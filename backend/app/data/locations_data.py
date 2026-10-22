"""Maharashtra administrative districts and blocks baseline dataset.

NOTE ON DATASET SCOPE & PRECISION:
- Coverage: This dataset contains a curated focus subset of 7 Maharashtra districts
  and 15 blocks (Western Maharashtra, Khandesh, and Marathwada zones) established
  for agro-climatic calibration. It does NOT represent all 36 Maharashtra districts.
- Coordinates: Centroids are approximate geographic reference points suitable for
  block-level rainfall downscaling, NOT survey-grade cadastral boundaries.
"""

from typing import Dict, List
from app.schemas.location import (
    BlockDetail,
    BlockSummary,
    CoordinatesPrecision,
    CoverageMetadata,
    CoverageStatus,
    DistrictDetail,
    DistrictSummary,
)

RAW_DISTRICTS: List[Dict] = [
    {
        "id": "pune",
        "name": "Pune",
        "name_mr": "पुणे",
        "state_id": "mh",
        "latitude": 18.5204,
        "longitude": 73.8567,
        "blocks": [
            {
                "id": "maval",
                "name": "Maval",
                "name_mr": "मावळ",
                "district_id": "pune",
                "district_name": "Pune",
                "latitude": 18.60,
                "longitude": 73.45,
            },
            {
                "id": "baramati",
                "name": "Baramati",
                "name_mr": "बारामती",
                "district_id": "pune",
                "district_name": "Pune",
                "latitude": 18.15,
                "longitude": 74.58,
            },
            {
                "id": "daund",
                "name": "Daund",
                "name_mr": "दौंड",
                "district_id": "pune",
                "district_name": "Pune",
                "latitude": 18.46,
                "longitude": 74.58,
            },
        ],
    },
    {
        "id": "nashik",
        "name": "Nashik",
        "name_mr": "नाशिक",
        "state_id": "mh",
        "latitude": 20.00,
        "longitude": 73.79,
        "blocks": [
            {
                "id": "niphad",
                "name": "Niphad",
                "name_mr": "निफाड",
                "district_id": "nashik",
                "district_name": "Nashik",
                "latitude": 20.08,
                "longitude": 74.11,
            },
            {
                "id": "sinnar",
                "name": "Sinnar",
                "name_mr": "सिन्नर",
                "district_id": "nashik",
                "district_name": "Nashik",
                "latitude": 19.85,
                "longitude": 73.99,
            },
        ],
    },
    {
        "id": "ahilyanagar",
        "name": "Ahilyanagar",
        "name_mr": "अहिल्यानगर",
        "state_id": "mh",
        "latitude": 19.09,
        "longitude": 74.74,
        "blocks": [
            {
                "id": "shrirampur",
                "name": "Shrirampur",
                "name_mr": "श्रीरामपूर",
                "district_id": "ahilyanagar",
                "district_name": "Ahilyanagar",
                "latitude": 19.62,
                "longitude": 74.66,
            },
            {
                "id": "rahuri",
                "name": "Rahuri",
                "name_mr": "राहुरी",
                "district_id": "ahilyanagar",
                "district_name": "Ahilyanagar",
                "latitude": 19.39,
                "longitude": 74.65,
            },
        ],
    },
    {
        "id": "kolhapur",
        "name": "Kolhapur",
        "name_mr": "कोल्हापूर",
        "state_id": "mh",
        "latitude": 16.70,
        "longitude": 74.24,
        "blocks": [
            {
                "id": "karvir",
                "name": "Karvir",
                "name_mr": "करवीर",
                "district_id": "kolhapur",
                "district_name": "Kolhapur",
                "latitude": 16.68,
                "longitude": 74.28,
            },
            {
                "id": "panhala",
                "name": "Panhala",
                "name_mr": "पन्हाळा",
                "district_id": "kolhapur",
                "district_name": "Kolhapur",
                "latitude": 16.81,
                "longitude": 74.11,
            },
        ],
    },
    {
        "id": "satara",
        "name": "Satara",
        "name_mr": "सातारा",
        "state_id": "mh",
        "latitude": 17.69,
        "longitude": 74.00,
        "blocks": [
            {
                "id": "wai",
                "name": "Wai",
                "name_mr": "वाई",
                "district_id": "satara",
                "district_name": "Satara",
                "latitude": 17.95,
                "longitude": 73.90,
            },
            {
                "id": "phaltan",
                "name": "Phaltan",
                "name_mr": "फलटण",
                "district_id": "satara",
                "district_name": "Satara",
                "latitude": 17.99,
                "longitude": 74.43,
            },
        ],
    },
    {
        "id": "solapur",
        "name": "Solapur",
        "name_mr": "सोलापूर",
        "state_id": "mh",
        "latitude": 17.66,
        "longitude": 75.91,
        "blocks": [
            {
                "id": "barshi",
                "name": "Barshi",
                "name_mr": "बार्शी",
                "district_id": "solapur",
                "district_name": "Solapur",
                "latitude": 18.23,
                "longitude": 75.69,
            },
            {
                "id": "karmala",
                "name": "Karmala",
                "name_mr": "करमाळा",
                "district_id": "solapur",
                "district_name": "Solapur",
                "latitude": 18.41,
                "longitude": 75.19,
            },
        ],
    },
    {
        "id": "nandurbar",
        "name": "Nandurbar",
        "name_mr": "नंदुरबार",
        "state_id": "mh",
        "latitude": 21.37,
        "longitude": 74.24,
        "blocks": [
            {
                "id": "shahada",
                "name": "Shahada",
                "name_mr": "शहादा",
                "district_id": "nandurbar",
                "district_name": "Nandurbar",
                "latitude": 21.55,
                "longitude": 74.47,
            },
            {
                "id": "navapur",
                "name": "Navapur",
                "name_mr": "नवापूर",
                "district_id": "nandurbar",
                "district_name": "Nandurbar",
                "latitude": 21.16,
                "longitude": 73.79,
            },
        ],
    },
]

# Build indexed collections for O(1) lookups
DISTRICTS_MAP: Dict[str, DistrictDetail] = {}
BLOCKS_MAP: Dict[str, BlockDetail] = {}

for d in RAW_DISTRICTS:
    block_objs = []
    for b in d["blocks"]:
        block_model = BlockDetail(
            id=b["id"],
            name=b["name"],
            name_mr=b["name_mr"],
            district_id=b["district_id"],
            district_name=b["district_name"],
            latitude=b["latitude"],
            longitude=b["longitude"],
            coordinates_precision=CoordinatesPrecision.APPROXIMATE_CENTROID,
            coverage_status=CoverageStatus.CURATED_FOCUS_SUBSET,
            state_id="mh",
            state_name="Maharashtra",
            state_name_mr="महाराष्ट्र",
        )
        BLOCKS_MAP[b["id"]] = block_model
        block_objs.append(
            BlockSummary(
                id=b["id"],
                name=b["name"],
                name_mr=b["name_mr"],
                district_id=b["district_id"],
                district_name=b["district_name"],
                latitude=b["latitude"],
                longitude=b["longitude"],
                coordinates_precision=CoordinatesPrecision.APPROXIMATE_CENTROID,
                coverage_status=CoverageStatus.CURATED_FOCUS_SUBSET,
            )
        )

    dist_model = DistrictDetail(
        id=d["id"],
        name=d["name"],
        name_mr=d["name_mr"],
        state_id=d["state_id"],
        latitude=d["latitude"],
        longitude=d["longitude"],
        block_count=len(block_objs),
        coverage_status=CoverageStatus.CURATED_FOCUS_SUBSET,
        blocks=block_objs,
    )
    DISTRICTS_MAP[d["id"]] = dist_model


def get_coverage_metadata() -> CoverageMetadata:
    """Return explicit metadata detailing data boundaries and coverage percentage."""
    curated_districts = len(DISTRICTS_MAP)
    curated_blocks = len(BLOCKS_MAP)
    total_districts = 36
    pct = round((curated_districts / total_districts) * 100, 1)

    return CoverageMetadata(
        total_state_districts=total_districts,
        curated_districts_count=curated_districts,
        curated_blocks_count=curated_blocks,
        statewide_coverage_pct=pct,
        coordinates_precision=CoordinatesPrecision.APPROXIMATE_CENTROID,
        coverage_limitation_statement=(
            "Curated focus subset for agro-climatic calibration covering 7 of 36 Maharashtra districts "
            "(15 representative blocks). Centroids are approximate reference points for rainfall interpolation. "
            "Authoritative statewide gazetteer and boundary polygons are pending official Local Government "
            "Directory (LGD) ingestion."
        ),
        gazetteer_source="Local Government Directory (LGD) reference list / VarshaMitra validated subset",
    )
