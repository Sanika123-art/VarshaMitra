"""Build a Maharashtra-only taluka GeoJSON from the pinned geoBoundaries release."""

import json
import re
import sys
import unicodedata
from pathlib import Path
from urllib.request import urlopen


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app.data.locations_data import RAW_DISTRICTS


RELEASE = "9469f09"
BASE_URL = (
    "https://github.com/wmgeolab/geoBoundaries/raw/"
    f"{RELEASE}/releaseData/gbOpen/IND/{{level}}/"
    "geoBoundaries-IND-{level}_simplified.geojson"
)
BOUNDARY_SOURCE = "Pathways Data Pvt. Ltd., Local Government Directory (lgdirectory.gov.in)"
BOUNDARY_LICENSE = "Open Data Commons Open Database License 1.0"
OUTPUT = ROOT / "backend" / "app" / "data" / "maharashtra-taluka-boundaries.geojson"

DISTRICT_ALIASES = {
    "ahmadnagar": "ahilyanagar",
    "ahmednagar": "ahilyanagar",
    "aurangabad": "chhatrapati sambhajinagar",
    "osmanabad": "dharashiv",
    "bid": "beed",
    "buldana": "buldhana",
    "gondiya": "gondia",
    "raigarh": "raigad",
}
AREA_ALIASES = {
    "karveer": "karvir",
    "malvan": "malwan",
    "wada": "vada",
    "yeola": "yevla",
    "chandwad": "chandvad",
    "shahada": "shahade",
    "taloda": "talode",
    "sindkheda": "sindkhede",
    "selu": "sailu",
    "murtizapur": "murtijapur",
    "nagpur city": "nagpur",
    "ratnagiri city": "ratnagiri",
}


def normalize(value: str) -> str:
    decomposed = unicodedata.normalize("NFKD", value or "")
    unaccented = "".join(char for char in decomposed if not unicodedata.combining(char))
    return re.sub(r"\s+", " ", unaccented.casefold()).strip()


def normalize_district(value: str) -> str:
    cleaned = re.sub(r"\s*\([^)]*\)", "", normalize(value)).strip()
    return DISTRICT_ALIASES.get(cleaned, cleaned)


def normalize_area(value: str) -> str:
    cleaned = re.sub(r"\s*\([^)]*\)", "", normalize(value)).strip()
    return AREA_ALIASES.get(cleaned, cleaned)


def fetch_features(level: str) -> list[dict]:
    with urlopen(BASE_URL.format(level=level), timeout=90) as response:
        return json.load(response)["features"]


def point_in_ring(longitude: float, latitude: float, ring: list[list[float]]) -> bool:
    inside = False
    for index, point in enumerate(ring):
        previous = ring[index - 1]
        if (point[1] > latitude) != (previous[1] > latitude):
            crossing = (
                (previous[0] - point[0])
                * (latitude - point[1])
                / (previous[1] - point[1])
                + point[0]
            )
            if longitude < crossing:
                inside = not inside
    return inside


def geometry_contains(geometry: dict, longitude: float, latitude: float) -> bool:
    if geometry["type"] == "Polygon":
        polygons = [geometry["coordinates"]]
    elif geometry["type"] == "MultiPolygon":
        polygons = geometry["coordinates"]
    else:
        return False

    return any(
        point_in_ring(longitude, latitude, polygon[0])
        and not any(point_in_ring(longitude, latitude, hole) for hole in polygon[1:])
        for polygon in polygons
    )


def representative_point(geometry: dict) -> tuple[float, float] | None:
    if geometry["type"] == "Polygon":
        polygons = [geometry["coordinates"]]
    elif geometry["type"] == "MultiPolygon":
        polygons = geometry["coordinates"]
    else:
        return None

    candidates: list[tuple[float, float, float]] = []
    for polygon in polygons:
        ring = polygon[0]
        longitudes = [point[0] for point in ring]
        latitudes = [point[1] for point in ring]
        for step in range(1, 20):
            latitude = min(latitudes) + (max(latitudes) - min(latitudes)) * step / 20
            crossings: list[float] = []
            for index, point in enumerate(ring):
                previous = ring[index - 1]
                if (point[1] > latitude) != (previous[1] > latitude):
                    crossings.append(
                        point[0]
                        + (latitude - point[1])
                        * (previous[0] - point[0])
                        / (previous[1] - point[1])
                    )
            crossings.sort()
            for index in range(0, len(crossings) - 1, 2):
                longitude = (crossings[index] + crossings[index + 1]) / 2
                if geometry_contains(geometry, longitude, latitude):
                    candidates.append((crossings[index + 1] - crossings[index], longitude, latitude))

    if not candidates:
        return None
    _, longitude, latitude = max(candidates)
    return longitude, latitude


def main() -> None:
    state_features = fetch_features("ADM1")
    maharashtra = next(
        feature["geometry"]
        for feature in state_features
        if normalize(feature["properties"]["shapeName"]) == "maharashtra"
    )
    district_features = fetch_features("ADM2")
    taluka_features = fetch_features("ADM3")

    district_id_by_source_name = {
        normalize_district(district["name"]): district["id"]
        for district in RAW_DISTRICTS
    }
    district_by_id = {district["id"]: district for district in RAW_DISTRICTS}
    block_district_by_name: dict[str, str | None] = {}
    for district in RAW_DISTRICTS:
        for block in district["blocks"]:
            name = normalize_area(block["name"])
            if name in block_district_by_name:
                block_district_by_name[name] = None
            else:
                block_district_by_name[name] = district["id"]

    features: list[dict] = []
    for feature in taluka_features:
        geometry = feature["geometry"]
        center = representative_point(geometry)
        if center is None or not geometry_contains(maharashtra, *center):
            continue

        parent = next(
            (
                district
                for district in district_features
                if geometry_contains(district["geometry"], *center)
            ),
            None,
        )
        district_name = parent["properties"]["shapeName"] if parent else ""
        district_id = district_id_by_source_name.get(normalize_district(district_name))
        area_name = feature["properties"]["shapeName"]
        if district_id is None:
            district_id = block_district_by_name.get(normalize_area(area_name))
        if district_id:
            district_name = district_by_id[district_id]["name"]

        matched_block_id = None
        if district_id:
            district = district_by_id[district_id]
            source_area_name = normalize_area(area_name)
            for block in district["blocks"]:
                if (
                    normalize_area(block["name"]) == source_area_name
                    and geometry_contains(geometry, block["longitude"], block["latitude"])
                ):
                    matched_block_id = block["id"]
                    break

        features.append(
            {
                "type": "Feature",
                "geometry": geometry,
                "properties": {
                    "shape_id": feature["properties"]["shapeID"],
                    "area_name": area_name,
                    "district_name": district_name,
                    "district_id": district_id,
                    "center_longitude": center[0],
                    "center_latitude": center[1],
                    "risk_block_id": matched_block_id,
                },
            }
        )

    payload = {
        "type": "FeatureCollection",
        "metadata": {
            "administrative_level": "taluka / sub-district (ADM3)",
            "boundary_year": "2018",
            "boundary_source": BOUNDARY_SOURCE,
            "boundary_license": BOUNDARY_LICENSE,
            "geoboundaries_release": RELEASE,
            "source_url": (
                "https://github.com/wmgeolab/geoBoundaries/tree/"
                f"{RELEASE}/releaseData/gbOpen/IND/ADM3"
            ),
            "matching_note": (
                "Risk links are attached only when a curated block name and district match "
                "and its approximate reference coordinate falls inside that polygon."
            ),
        },
        "features": features,
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    linked = sum(feature["properties"]["risk_block_id"] is not None for feature in features)
    print(f"Wrote {len(features)} taluka polygons; linked {linked} monitored blocks to {OUTPUT}.")


if __name__ == "__main__":
    main()
