"""Maharashtra-wide Geocoding and Reverse Geocoding Service.

Integrates OpenStreetMap Nominatim with local gazetteer fallback,
Maharashtra geographic bounding box validation, rate limiting, and in-memory TTL caching.
"""

import asyncio
from datetime import datetime, timezone
import math
import re
import time
from typing import Dict, List, Optional, Tuple
import httpx

from app.core.logging import logger
from app.data.locations_data import BLOCKS_MAP, DISTRICTS_MAP
from app.schemas.location import (
    BlockDetail,
    CoordinatesPrecision,
    CoverageStatus,
    DistrictDetail,
    LocationResolutionSource,
    LocationSearchItem,
)

# Geographic Bounding Box for the State of Maharashtra
# Latitude: 15.60° N to 22.15° N
# Longitude: 72.60° E to 80.90° E
MH_MIN_LAT = 15.60
MH_MAX_LAT = 22.15
MH_MIN_LON = 72.60
MH_MAX_LON = 80.90

NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search"
NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse"
USER_AGENT = "VarshaMitra/1.0 (agro-climate-decision-support; contact: info@varshamitra.gov.in)"

# In-memory TTL caches
_SEARCH_CACHE: Dict[str, Tuple[float, List[LocationSearchItem]]] = {}
_REVERSE_CACHE: Dict[str, Tuple[float, LocationSearchItem]] = {}
CACHE_TTL_SECONDS = 7200  # 2 hours

_LAST_NOMINATIM_CALL = 0.0
_NOMINATIM_LOCK = asyncio.Lock()


def is_in_maharashtra(lat: float, lon: float) -> bool:
    """Validate whether coordinates fall inside Maharashtra geographic boundaries."""
    return MH_MIN_LAT <= lat <= MH_MAX_LAT and MH_MIN_LON <= lon <= MH_MAX_LON


def _haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate approximate great-circle distance between two coordinates in kilometers."""
    r = 6371.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return r * c


def find_nearest_district(lat: float, lon: float) -> Tuple[DistrictDetail, float]:
    """Find the closest Maharashtra district centroid to the given coordinates."""
    closest_dist: Optional[DistrictDetail] = None
    min_dist_km = float("inf")

    for d in DISTRICTS_MAP.values():
        dist_km = _haversine_distance_km(lat, lon, d.latitude, d.longitude)
        if dist_km < min_dist_km:
            min_dist_km = dist_km
            closest_dist = d

    if closest_dist is None:
        # Fallback to Pune
        return DISTRICTS_MAP.get("pune", list(DISTRICTS_MAP.values())[0]), 0.0

    return closest_dist, round(min_dist_km, 1)


def find_nearest_taluka(lat: float, lon: float) -> Tuple[BlockDetail, float]:
    """Find the closest Maharashtra taluka/block to the given coordinates."""
    closest_b: Optional[BlockDetail] = None
    min_dist_km = float("inf")

    for b in BLOCKS_MAP.values():
        dist_km = _haversine_distance_km(lat, lon, b.latitude, b.longitude)
        if dist_km < min_dist_km:
            min_dist_km = dist_km
            closest_b = b

    if closest_b is None:
        return list(BLOCKS_MAP.values())[0], 0.0

    return closest_b, round(min_dist_km, 1)


class GeocoderService:
    """Service for place searching, geocoding, and reverse geocoding across Maharashtra."""

    def search_local(self, query: str, limit: int = 5) -> List[LocationSearchItem]:
        """Search built-in 36-district and 160-taluka gazetteer."""
        q = query.strip().lower()
        if not q:
            return []

        results: List[LocationSearchItem] = []
        seen_ids = set()

        # 1. Check Talukas / Blocks
        for b in BLOCKS_MAP.values():
            if q in b.name.lower() or q in b.name_mr.lower() or q == b.id:
                seen_ids.add(b.id)
                dist = DISTRICTS_MAP.get(b.district_id)
                dist_mr = dist.name_mr if dist else b.district_name
                results.append(
                    LocationSearchItem(
                        id=b.id,
                        name=b.name,
                        name_mr=b.name_mr,
                        taluka=b.name,
                        district_id=b.district_id,
                        district_name=b.district_name,
                        district_name_mr=dist_mr,
                        latitude=b.latitude,
                        longitude=b.longitude,
                        display_name=f"{b.name}, {b.district_name}, Maharashtra",
                        precision=CoordinatesPrecision.APPROXIMATE_CENTROID,
                        source=LocationResolutionSource.LOCAL_GAZETTEER,
                    )
                )
                if len(results) >= limit:
                    return results

        # 2. Check Districts
        for d in DISTRICTS_MAP.values():
            if d.id in seen_ids:
                continue
            if q in d.name.lower() or q in d.name_mr.lower() or q == d.id:
                results.append(
                    LocationSearchItem(
                        id=f"dist_{d.id}",
                        name=d.name,
                        name_mr=d.name_mr,
                        taluka=None,
                        district_id=d.id,
                        district_name=d.name,
                        district_name_mr=d.name_mr,
                        latitude=d.latitude,
                        longitude=d.longitude,
                        display_name=f"{d.name} District, Maharashtra",
                        precision=CoordinatesPrecision.APPROXIMATE_CENTROID,
                        source=LocationResolutionSource.LOCAL_GAZETTEER,
                    )
                )
                if len(results) >= limit:
                    return results

        return results

    async def search_nominatim(self, query: str, limit: int = 5) -> List[LocationSearchItem]:
        """Query OpenStreetMap Nominatim for locations, villages, and PIN codes in Maharashtra."""
        q = query.strip()
        if len(q) < 2:
            return []

        # Check cache
        cache_key = q.lower()
        cached = _SEARCH_CACHE.get(cache_key)
        now = time.monotonic()
        if cached and (now - cached[0]) < CACHE_TTL_SECONDS:
            return cached[1]

        # Is query a 6-digit Indian PIN code?
        is_pin = bool(re.match(r"^\d{6}$", q))

        params = {
            "format": "json",
            "addressdetails": 1,
            "limit": limit,
            "countrycodes": "in",
        }

        if is_pin:
            params["postalcode"] = q
        else:
            # Append Maharashtra to anchor search within state
            search_str = q if "maharashtra" in q.lower() else f"{q}, Maharashtra"
            params["q"] = search_str

        results: List[LocationSearchItem] = []

        global _LAST_NOMINATIM_CALL
        async with _NOMINATIM_LOCK:
            elapsed = time.monotonic() - _LAST_NOMINATIM_CALL
            if elapsed < 1.0:
                await asyncio.sleep(1.0 - elapsed)
            _LAST_NOMINATIM_CALL = time.monotonic()

            try:
                headers = {"User-Agent": USER_AGENT}
                async with httpx.AsyncClient(timeout=4.0) as client:
                    resp = await client.get(NOMINATIM_SEARCH_URL, params=params, headers=headers)

                if resp.status_code == 200:
                    raw_items = resp.json()
                    for item in raw_items:
                        lat = float(item["lat"])
                        lon = float(item["lon"])

                        # Bounding box filter: must be in Maharashtra
                        if not is_in_maharashtra(lat, lon):
                            continue

                        addr = item.get("address", {})
                        state = addr.get("state", "")
                        if state and "maharashtra" not in state.lower():
                            continue

                        # Resolve place name
                        place_name = (
                            addr.get("village")
                            or addr.get("town")
                            or addr.get("city")
                            or addr.get("suburb")
                            or addr.get("hamlet")
                            or addr.get("neighbourhood")
                            or item.get("name")
                            or q
                        )

                        # Resolve district
                        raw_district = (
                            addr.get("state_district")
                            or addr.get("county")
                            or addr.get("district")
                            or ""
                        )
                        raw_district_clean = (
                            raw_district.replace("District", "")
                            .replace("district", "")
                            .strip()
                        )

                        # Match with our district dictionary or nearest
                        matched_d = None
                        if raw_district_clean:
                            matched_d = next(
                                (
                                    d
                                    for d in DISTRICTS_MAP.values()
                                    if raw_district_clean.lower() in d.name.lower()
                                    or d.name.lower() in raw_district_clean.lower()
                                ),
                                None,
                            )

                        if not matched_d:
                            matched_d, _ = find_nearest_district(lat, lon)

                        taluka = (
                            addr.get("taluk")
                            or addr.get("subdistrict")
                            or addr.get("tehsil")
                            or None
                        )

                        clean_id = f"loc_{re.sub(r'[^a-zA-Z0-9_]', '', place_name.lower())[:24]}_{round(lat, 2)}_{round(lon, 2)}"
                        postcode = addr.get("postcode") or (q if is_pin else None)

                        results.append(
                            LocationSearchItem(
                                id=clean_id,
                                name=place_name,
                                name_mr=place_name,  # Fallback to English place name if Marathi transliteration not available
                                taluka=taluka,
                                district_id=matched_d.id,
                                district_name=matched_d.name,
                                district_name_mr=matched_d.name_mr,
                                latitude=round(lat, 4),
                                longitude=round(lon, 4),
                                postal_code=postcode,
                                display_name=item.get("display_name", f"{place_name}, {matched_d.name}, Maharashtra"),
                                precision=CoordinatesPrecision.EXACT_GEOCODED_POINT,
                                source=LocationResolutionSource.NOMINATIM_OSM,
                            )
                        )
                        if len(results) >= limit:
                            break
            except Exception as err:
                logger.warning(f"Nominatim search error for '{query}': {err}")

        _SEARCH_CACHE[cache_key] = (time.monotonic(), results)
        return results

    async def search(self, query: str, limit: int = 5) -> List[LocationSearchItem]:
        """Unified search across local gazetteer and online Nominatim geocoder."""
        q = query.strip()
        if not q:
            return []

        # 1. Local search first (0ms latency)
        local_results = self.search_local(q, limit=limit)
        if len(local_results) >= limit:
            return local_results

        # 2. Supplementary online Nominatim search
        try:
            online_results = await self.search_nominatim(q, limit=limit)
        except Exception:
            online_results = []

        # Combine and deduplicate
        combined: List[LocationSearchItem] = list(local_results)
        seen_names = {r.name.lower() for r in combined}

        for item in online_results:
            if item.name.lower() not in seen_names:
                seen_names.add(item.name.lower())
                combined.append(item)
            if len(combined) >= limit:
                break

        return combined

    async def reverse_geocode(self, latitude: float, longitude: float) -> LocationSearchItem:
        """Reverse geocode coordinates into a structured Maharashtra location."""
        if not is_in_maharashtra(latitude, longitude):
            raise ValueError(
                f"Coordinates [{latitude}, {longitude}] are outside Maharashtra operational coverage "
                f"({MH_MIN_LAT}°N to {MH_MAX_LAT}°N, {MH_MIN_LON}°E to {MH_MAX_LON}°E)."
            )

        cache_key = f"{round(latitude, 3)}_{round(longitude, 3)}"
        cached = _REVERSE_CACHE.get(cache_key)
        now = time.monotonic()
        if cached and (now - cached[0]) < CACHE_TTL_SECONDS:
            return cached[1]

        nearest_d, d_dist = find_nearest_district(latitude, longitude)
        nearest_b, b_dist = find_nearest_taluka(latitude, longitude)

        # Default fallback representation based on nearest taluka/district
        default_item = LocationSearchItem(
            id=f"geo_{round(latitude, 4)}_{round(longitude, 4)}",
            name=f"Near {nearest_b.name}",
            name_mr=f"{nearest_b.name_mr} जवळ",
            taluka=nearest_b.name,
            district_id=nearest_d.id,
            district_name=nearest_d.name,
            district_name_mr=nearest_d.name_mr,
            latitude=round(latitude, 4),
            longitude=round(longitude, 4),
            display_name=f"Farm point near {nearest_b.name}, {nearest_d.name}, Maharashtra",
            precision=CoordinatesPrecision.EXACT_GEOCODED_POINT,
            source=LocationResolutionSource.REVERSE_GEOCODE,
        )

        # Attempt online Nominatim reverse query
        global _LAST_NOMINATIM_CALL
        async with _NOMINATIM_LOCK:
            elapsed = time.monotonic() - _LAST_NOMINATIM_CALL
            if elapsed < 1.0:
                await asyncio.sleep(1.0 - elapsed)
            _LAST_NOMINATIM_CALL = time.monotonic()

            try:
                params = {
                    "lat": latitude,
                    "lon": longitude,
                    "format": "json",
                    "addressdetails": 1,
                }
                headers = {"User-Agent": USER_AGENT}
                async with httpx.AsyncClient(timeout=4.0) as client:
                    resp = await client.get(NOMINATIM_REVERSE_URL, params=params, headers=headers)

                if resp.status_code == 200:
                    raw = resp.json()
                    addr = raw.get("address", {})

                    place_name = (
                        addr.get("village")
                        or addr.get("hamlet")
                        or addr.get("town")
                        or addr.get("suburb")
                        or addr.get("city")
                        or addr.get("neighbourhood")
                        or f"Near {nearest_b.name}"
                    )

                    taluka = addr.get("taluk") or addr.get("subdistrict") or nearest_b.name

                    raw_d = (
                        addr.get("state_district")
                        or addr.get("county")
                        or addr.get("district")
                        or nearest_d.name
                    )
                    raw_d_clean = raw_d.replace("District", "").replace("district", "").strip()

                    matched_d = next(
                        (
                            d
                            for d in DISTRICTS_MAP.values()
                            if raw_d_clean.lower() in d.name.lower()
                            or d.name.lower() in raw_d_clean.lower()
                        ),
                        nearest_d,
                    )

                    result_item = LocationSearchItem(
                        id=f"geo_{round(latitude, 4)}_{round(longitude, 4)}",
                        name=place_name,
                        name_mr=place_name,
                        taluka=taluka,
                        district_id=matched_d.id,
                        district_name=matched_d.name,
                        district_name_mr=matched_d.name_mr,
                        latitude=round(latitude, 4),
                        longitude=round(longitude, 4),
                        postal_code=addr.get("postcode"),
                        display_name=raw.get("display_name", f"{place_name}, {matched_d.name}, Maharashtra"),
                        precision=CoordinatesPrecision.EXACT_GEOCODED_POINT,
                        source=LocationResolutionSource.REVERSE_GEOCODE,
                    )
                    _REVERSE_CACHE[cache_key] = (time.monotonic(), result_item)
                    return result_item
            except Exception as err:
                logger.warning(f"Reverse geocode exception: {err}; using nearest taluka fallback.")

        _REVERSE_CACHE[cache_key] = (time.monotonic(), default_item)
        return default_item


geocoder_service = GeocoderService()
