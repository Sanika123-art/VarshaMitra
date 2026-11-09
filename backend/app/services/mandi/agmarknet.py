"""Verified daily APMC prices from the Data.gov.in Agmarknet dataset."""

import logging
import re
import time
from datetime import datetime, timezone
from typing import Any

import httpx
from fastapi import HTTPException

from app.core.config import settings
from app.schemas.mandi import MandiRateResponse, NearbyMandiItem
from app.services.location_service import location_service

logger = logging.getLogger("varshamitra.mandi")

RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070"
DATA_GOV_URL = f"https://api.data.gov.in/resource/{RESOURCE_ID}"
AGMARKNET_URL = "https://agmarknet.gov.in/"
CACHE_TTL_SECONDS = 900
_MANDI_CACHE: dict[str, tuple[float, MandiRateResponse]] = {}

CROPS: dict[str, tuple[str, str, tuple[str, ...]]] = {
    "onion": ("Onion", "कांदा", ("onion",)),
    "soybean": ("Soybean", "सोयाबीन", ("soyabean", "soybean")),
    "cotton": ("Cotton", "कापूस", ("cotton",)),
    "rice": ("Paddy / Rice", "भात / धान", ("paddy", "rice")),
    "wheat": ("Wheat", "गहू", ("wheat",)),
    "sugarcane": ("Sugarcane", "ऊस", ("sugarcane",)),
    "maize": ("Maize", "मका", ("maize",)),
    "pigeonpea": ("Pigeonpea (Tur)", "तूर", ("arhar", "tur", "pigeonpea")),
}

# Deliberately illustrative figures for a prototype, never represented as market observations.
DEMO_PRICES: dict[str, tuple[float, float, float]] = {
    "onion": (2400, 1800, 3000),
    "soybean": (4700, 4200, 5100),
    "cotton": (6800, 6200, 7300),
    "rice": (3200, 2800, 3600),
    "wheat": (2500, 2200, 2800),
    "sugarcane": (340, 300, 380),
    "maize": (2200, 1900, 2500),
    "pigeonpea": (7200, 6500, 7900),
}


def _field(record: dict[str, Any], name: str) -> str:
    value = next((value for key, value in record.items() if key.casefold() == name.casefold()), "")
    return str(value).strip() if value is not None else ""


def _normalized(value: str) -> str:
    return re.sub(r"[^a-z0-9]", "", value.casefold())


def _price(record: dict[str, Any], name: str) -> float | None:
    raw = _field(record, name).replace(",", "")
    try:
        value = float(raw)
    except ValueError:
        return None
    return value if value >= 0 else None


def _arrival_date(value: str) -> str:
    for date_format in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y"):
        try:
            return datetime.strptime(value, date_format).date().isoformat()
        except ValueError:
            continue
    return value


def _unavailable_response(
    *,
    crop_id: str,
    crop_name: str,
    crop_name_mr: str,
    district: str,
    district_mr: str,
    taluka: str | None,
    code: str,
    notice: str,
) -> MandiRateResponse:
    return MandiRateResponse(
        crop_id=crop_id,
        crop_name=crop_name,
        crop_name_mr=crop_name_mr,
        market_name=None,
        market_name_mr=None,
        district=district,
        district_mr=district_mr,
        taluka=taluka,
        modal_price=None,
        min_price=None,
        max_price=None,
        msp=None,
        msp_difference=None,
        unit="Quintal",
        unit_mr="क्विंटल",
        arrivals=None,
        arrivals_mr=None,
        trend="unknown",
        trend_mr="माहिती नाही",
        arrival_date=None,
        sync_time=None,
        source="Data.gov.in (Agmarknet)",
        source_url=AGMARKNET_URL,
        data_mode="unavailable",
        is_live_sync=False,
        data_available=False,
        availability_code=code,
        availability_notice=notice,
        selling_advice_en=None,
        selling_advice_mr=None,
        nearby_mandis=[],
    )


def _demo_response(
    *,
    crop_id: str,
    crop_name: str,
    crop_name_mr: str,
    district: str,
    district_mr: str,
    taluka: str,
) -> MandiRateResponse:
    """Provide static, clearly illustrative values to keep the demo populated."""
    modal, minimum, maximum = DEMO_PRICES[crop_id]
    market_id = f"demo-{district.casefold().replace(' ', '-')}-{crop_id}"
    demo_market_en = f"Demo example — {district} (not a market quote)"
    demo_market_mr = f"डेमो नमुना — {district_mr} (प्रत्यक्ष बाजारभाव नाही)"
    item = NearbyMandiItem(
        market_id=market_id,
        market_name=demo_market_en,
        market_name_mr=demo_market_mr,
        variety=None,
        distance_km=None,
        distance_km_str=None,
        is_nearest=False,
        modal_price=modal,
        min_price=minimum,
        max_price=maximum,
        arrivals=None,
        arrivals_mr=None,
        trend="unknown",
        trend_mr="डेमो",
    )
    return MandiRateResponse(
        crop_id=crop_id,
        crop_name=crop_name,
        crop_name_mr=crop_name_mr,
        market_name=demo_market_en,
        market_name_mr=demo_market_mr,
        district=district,
        district_mr=district_mr,
        taluka=taluka,
        modal_price=modal,
        min_price=minimum,
        max_price=maximum,
        msp=None,
        msp_difference=None,
        unit="Quintal",
        unit_mr="क्विंटल",
        arrivals=None,
        arrivals_mr=None,
        trend="unknown",
        trend_mr="डेमो",
        arrival_date=None,
        sync_time=None,
        source="VarshaMitra demo sample (not official)",
        source_url=AGMARKNET_URL,
        data_mode="demo",
        is_live_sync=False,
        data_available=True,
        availability_code="api_key_missing",
        availability_notice="These sample values are for demonstrating the page only. They are not today's market rates.",
        selling_advice_en=None,
        selling_advice_mr=None,
        nearby_mandis=[item],
    )


async def get_mandi_rates_for_crop(
    crop_id: str,
    block_id: str | None = None,
) -> MandiRateResponse:
    """Return only official price records matching the selected district and crop."""
    norm_crop = crop_id.strip().lower()
    crop_name, crop_name_mr, commodity_aliases = CROPS.get(
        norm_crop,
        (crop_id.replace("_", " ").title(), crop_id, ()),
    )

    block = location_service.get_block(block_id) if block_id else None
    district_detail = location_service.get_district(block.district_id) if block else None
    if not block or not district_detail:
        return _unavailable_response(
            crop_id=norm_crop,
            crop_name=crop_name,
            crop_name_mr=crop_name_mr,
            district=block.district_name if block else "Unknown",
            district_mr=district_detail.name_mr if district_detail else "अज्ञात",
            taluka=block.name if block else None,
            code="invalid_location",
            notice="Choose a valid Maharashtra taluka to look up its district market records.",
        )

    if not commodity_aliases:
        return _unavailable_response(
            crop_id=norm_crop,
            crop_name=crop_name,
            crop_name_mr=crop_name_mr,
            district=district_detail.name,
            district_mr=district_detail.name_mr,
            taluka=block.name,
            code="unsupported_crop",
            notice="Verified market prices are not available for this crop yet.",
        )

    if not settings.DATA_GOV_IN_API_KEY:
        return _demo_response(
            crop_id=norm_crop,
            crop_name=crop_name,
            crop_name_mr=crop_name_mr,
            district=district_detail.name,
            district_mr=district_detail.name_mr,
            taluka=block.name,
        )

    cache_key = f"{norm_crop}:{district_detail.id}"
    cached = _MANDI_CACHE.get(cache_key)
    now = time.monotonic()
    if cached and now - cached[0] < CACHE_TTL_SECONDS:
        return cached[1]

    params = {
        "api-key": settings.DATA_GOV_IN_API_KEY,
        "format": "json",
        "limit": "1000",
        "filters[state]": "Maharashtra",
        "filters[district]": district_detail.name,
        "filters[commodity]": commodity_aliases[0],
        "sort[arrival_date]": "desc",
    }
    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            response = await client.get(DATA_GOV_URL, params=params)
            response.raise_for_status()
            payload = response.json()
    except (httpx.HTTPError, ValueError) as error:
        logger.warning(
            "Agmarknet price request failed for crop=%s district=%s (%s)",
            norm_crop,
            district_detail.id,
            type(error).__name__,
        )
        raise HTTPException(
            status_code=503,
            detail="Official market prices could not be reached. Please try again later.",
        ) from error

    records = payload.get("records") if isinstance(payload, dict) else None
    if not isinstance(records, list):
        logger.error("Data.gov.in returned an unexpected Agmarknet response.")
        raise HTTPException(
            status_code=502,
            detail="The official market-price response could not be read.",
        )

    expected_commodities = {_normalized(alias) for alias in commodity_aliases}

    def matches_commodity(value: str) -> bool:
        normalized_value = _normalized(value)
        return any(
            normalized_value == alias
            or (len(alias) >= 4 and normalized_value.startswith(alias))
            for alias in expected_commodities
        )

    matching = [
        record
        for record in records
        if isinstance(record, dict)
        and _normalized(_field(record, "state")) in {"maharashtra", "mh"}
        and _normalized(_field(record, "district")) == _normalized(district_detail.name)
        and matches_commodity(_field(record, "commodity"))
        and _price(record, "modal_price") is not None
    ]
    matching.sort(key=lambda record: _arrival_date(_field(record, "arrival_date")), reverse=True)

    if not matching:
        result = _unavailable_response(
            crop_id=norm_crop,
            crop_name=crop_name,
            crop_name_mr=crop_name_mr,
            district=district_detail.name,
            district_mr=district_detail.name_mr,
            taluka=block.name,
            code="records_missing",
            notice="No matching official market-price record was returned for this crop and district.",
        )
        _MANDI_CACHE[cache_key] = (now, result)
        return result

    markets: list[NearbyMandiItem] = []
    seen_markets: set[str] = set()
    for record in matching:
        market_name = _field(record, "market")
        market_key = _normalized(market_name)
        if not market_name or market_key in seen_markets:
            continue
        modal_price = _price(record, "modal_price")
        min_price = _price(record, "min_price")
        max_price = _price(record, "max_price")
        if modal_price is None or min_price is None or max_price is None:
            continue
        seen_markets.add(market_key)
        markets.append(
            NearbyMandiItem(
                market_id=market_key,
                market_name=market_name,
                market_name_mr=market_name,
                variety=_field(record, "variety") or None,
                distance_km=None,
                distance_km_str=None,
                is_nearest=False,
                modal_price=modal_price,
                min_price=min_price,
                max_price=max_price,
                arrivals=_field(record, "arrivals") or None,
                arrivals_mr=None,
                trend="unknown",
                trend_mr="माहिती नाही",
            )
        )
        if len(markets) == 5:
            break

    if not markets:
        result = _unavailable_response(
            crop_id=norm_crop,
            crop_name=crop_name,
            crop_name_mr=crop_name_mr,
            district=district_detail.name,
            district_mr=district_detail.name_mr,
            taluka=block.name,
            code="incomplete_prices",
            notice="Official records were returned, but they did not include complete prices.",
        )
        _MANDI_CACHE[cache_key] = (now, result)
        return result

    latest = matching[0]
    latest_date = _arrival_date(_field(latest, "arrival_date"))
    result = MandiRateResponse(
        crop_id=norm_crop,
        crop_name=crop_name,
        crop_name_mr=crop_name_mr,
        market_name=markets[0].market_name,
        market_name_mr=markets[0].market_name_mr,
        district=district_detail.name,
        district_mr=district_detail.name_mr,
        taluka=block.name,
        modal_price=markets[0].modal_price,
        min_price=markets[0].min_price,
        max_price=markets[0].max_price,
        msp=None,
        msp_difference=None,
        unit="Quintal",
        unit_mr="क्विंटल",
        arrivals=markets[0].arrivals,
        arrivals_mr=None,
        trend="unknown",
        trend_mr="माहिती नाही",
        arrival_date=latest_date,
        sync_time=datetime.now(timezone.utc).isoformat(),
        source="Data.gov.in Agmarknet daily market prices",
        source_url=AGMARKNET_URL,
        data_mode="official",
        is_live_sync=True,
        data_available=True,
        availability_notice=None,
        selling_advice_en="Market rates can change with quality and auction demand. Confirm the current bid before transporting produce.",
        selling_advice_mr="मालाचा दर्जा आणि लिलावानुसार भाव बदलतो. माल नेण्यापूर्वी बाजार समितीत आजचा दर नक्की विचारा.",
        nearby_mandis=markets,
    )
    _MANDI_CACHE[cache_key] = (now, result)
    return result
