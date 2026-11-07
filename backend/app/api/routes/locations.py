"""API routes for Maharashtra administrative locations, statewide search, and geocoding."""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from app.schemas.location import (
    BlockDetail,
    BlockSummary,
    CoordinatesPrecision,
    CoverageMetadata,
    CoverageStatus,
    DistrictDetail,
    DistrictSummary,
    LocationListResponse,
    LocationResolutionSource,
    LocationResolveRequest,
    LocationSearchItem,
    LocationSearchResponse,
)
from app.services.geocoding.geocoder import (
    MH_MAX_LAT,
    MH_MAX_LON,
    MH_MIN_LAT,
    MH_MIN_LON,
    geocoder_service,
    is_in_maharashtra,
)
from app.services.location_service import location_service

router = APIRouter(prefix="/locations", tags=["Locations"])


@router.get(
    "/search",
    response_model=LocationSearchResponse,
    status_code=status.HTTP_200_OK,
    summary="Search Locations in Maharashtra",
    description="Search for villages, towns, talukas, districts, or 6-digit PIN codes across Maharashtra.",
)
async def search_locations(
    q: str = Query(..., min_length=1, max_length=100, description="Search place name, taluka, or PIN code", examples=["Alibaug"]),
    limit: int = Query(default=6, ge=1, le=15, description="Maximum number of search results to return"),
) -> LocationSearchResponse:
    """Search for locations across Maharashtra using hybrid local gazetteer and Nominatim."""
    results = await geocoder_service.search(query=q, limit=limit)
    return LocationSearchResponse(
        query=q,
        count=len(results),
        results=results,
    )


@router.get(
    "/reverse",
    response_model=LocationSearchItem,
    status_code=status.HTTP_200_OK,
    summary="Reverse Geocode Coordinates to Location",
    description="Convert arbitrary WGS84 GPS coordinates into a resolved Maharashtra location and register it.",
)
async def reverse_geocode_location(
    lat: float = Query(..., ge=-90.0, le=90.0, description="WGS84 latitude", examples=[18.6498]),
    lon: float = Query(..., ge=-180.0, le=180.0, description="WGS84 longitude", examples=[72.8765]),
) -> LocationSearchItem:
    """Reverse geocode coordinates within Maharashtra bounds and register for immediate API access."""
    if not is_in_maharashtra(lat, lon):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Coordinates [{lat}, {lon}] are outside Maharashtra operational coverage "
                f"(Latitude {MH_MIN_LAT}°N to {MH_MAX_LAT}°N, Longitude {MH_MIN_LON}°E to {MH_MAX_LON}°E)."
            ),
        )

    try:
        resolved = await geocoder_service.reverse_geocode(latitude=lat, longitude=lon)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Unable to reverse geocode coordinates: {exc}",
        )

    # Register in location_service so downstream weather/advisory routes accept this location_id
    block_model = BlockDetail(
        id=resolved.id,
        name=resolved.name,
        name_mr=resolved.name_mr,
        district_id=resolved.district_id,
        district_name=resolved.district_name,
        state_id="mh",
        state_name="Maharashtra",
        state_name_mr="महाराष्ट्र",
        latitude=resolved.latitude,
        longitude=resolved.longitude,
        coordinates_precision=CoordinatesPrecision.EXACT_GEOCODED_POINT,
        coverage_status=CoverageStatus.DYNAMIC_RESOLVED,
    )
    location_service.register_dynamic_location(block_model)

    return resolved


@router.post(
    "/resolve",
    response_model=BlockDetail,
    status_code=status.HTTP_200_OK,
    summary="Resolve or Register Any Location",
    description="Resolves any query, PIN code, or coordinate pair into an active BlockDetail ready for all APIs.",
)
async def resolve_location(
    body: LocationResolveRequest,
) -> BlockDetail:
    """Resolve location and register it dynamically into backend location registry."""
    # 1. Direct coordinates
    if body.latitude is not None and body.longitude is not None:
        if not is_in_maharashtra(body.latitude, body.longitude):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Coordinates [{body.latitude}, {body.longitude}] are outside Maharashtra.",
            )
        resolved = await geocoder_service.reverse_geocode(body.latitude, body.longitude)
        block_model = BlockDetail(
            id=resolved.id,
            name=resolved.name,
            name_mr=resolved.name_mr,
            district_id=resolved.district_id,
            district_name=resolved.district_name,
            state_id="mh",
            state_name="Maharashtra",
            state_name_mr="महाराष्ट्र",
            latitude=resolved.latitude,
            longitude=resolved.longitude,
            coordinates_precision=CoordinatesPrecision.EXACT_GEOCODED_POINT,
            coverage_status=CoverageStatus.DYNAMIC_RESOLVED,
        )
        return location_service.register_dynamic_location(block_model)

    # 2. Text query or PIN code
    search_query = body.postal_code or body.query
    if not search_query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must provide either 'query', 'postal_code', or ('latitude', 'longitude').",
        )

    results = await geocoder_service.search(search_query, limit=1)
    if not results:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Could not resolve '{search_query}' to any location in Maharashtra.",
        )

    top = results[0]
    block_model = BlockDetail(
        id=top.id,
        name=top.name,
        name_mr=top.name_mr,
        district_id=top.district_id,
        district_name=top.district_name,
        state_id="mh",
        state_name="Maharashtra",
        state_name_mr="महाराष्ट्र",
        latitude=top.latitude,
        longitude=top.longitude,
        coordinates_precision=top.precision,
        coverage_status=CoverageStatus.DYNAMIC_RESOLVED,
    )
    return location_service.register_dynamic_location(block_model)


@router.get(
    "/districts",
    response_model=List[DistrictSummary],
    status_code=status.HTTP_200_OK,
    summary="List All 36 Maharashtra Districts",
    description="Returns all 36 administrative districts in Maharashtra.",
)
async def list_districts() -> List[DistrictSummary]:
    """Retrieve all Maharashtra districts."""
    return location_service.list_districts()


@router.get(
    "/districts/{district_id}",
    response_model=DistrictDetail,
    status_code=status.HTTP_200_OK,
    summary="Get District Details",
    description="Returns detailed information for a specific district including member blocks.",
)
async def get_district(district_id: str) -> DistrictDetail:
    """Retrieve district by ID with member blocks."""
    district = location_service.get_district(district_id)
    if not district:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"District '{district_id}' not found in Maharashtra dataset.",
        )
    return district


@router.get(
    "/blocks",
    response_model=LocationListResponse,
    status_code=status.HTTP_200_OK,
    summary="List Administrative Blocks",
    description="List administrative blocks, optionally filtered by parent district ID.",
)
async def list_blocks(
    district_id: Optional[str] = Query(
        None,
        description="Filter blocks by parent district ID (e.g. 'pune', 'raigad', 'solapur')",
        examples=["raigad"],
    )
) -> LocationListResponse:
    """List blocks with optional district filtering."""
    if district_id and not location_service.get_district(district_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"District filter '{district_id}' does not match any Maharashtra district.",
        )

    items = location_service.list_blocks(district_id=district_id)
    return LocationListResponse(
        count=len(items),
        items=items,
        coverage_notice="Statewide coverage covering all 36 Maharashtra districts and 160+ taluka centroids.",
    )


@router.get(
    "/blocks/{block_id}",
    response_model=BlockDetail,
    status_code=status.HTTP_200_OK,
    summary="Get Block Detail",
    description="Retrieve a single administrative block or registered location by its unique identifier.",
)
async def get_block(block_id: str) -> BlockDetail:
    """Retrieve specific block details."""
    block = location_service.get_block(block_id)
    if not block:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Block or location '{block_id}' not found in Maharashtra dataset.",
        )
    return block


@router.get(
    "/coverage",
    response_model=CoverageMetadata,
    status_code=status.HTTP_200_OK,
    summary="Dataset Coverage Limitations & Gazetteers",
    description="Transparent declaration of geographic scope, coordinate precision, and statewide gazetteer ingestion.",
)
async def get_coverage_info() -> CoverageMetadata:
    """Declared data coverage and limitations statement."""
    return location_service.get_coverage()


@router.get(
    "/agro-zones",
    status_code=status.HTTP_200_OK,
    summary="Official Maharashtra Agro-Climatic Zones",
    description="Retrieve all 9 official agro-climatic zones with climatological normals, soil characteristics, and primary crops.",
)
async def get_agro_climatic_zones() -> List[dict]:
    """Retrieve official agro-climatic zones."""
    return [
        {
            "id": "south_konkan",
            "name": "South Konkan Coastal Zone",
            "name_mr": "दक्षिण कोकण किनारपट्टी विभाग",
            "districts": "Ratnagiri, Sindhudurg",
            "rainfall": "3000-3500 mm",
            "soil": "Lateritic Red Soil",
            "crops": "Rice, Mango (Alphonso), Cashew",
        },
        {
            "id": "north_konkan",
            "name": "North Konkan Coastal Zone",
            "name_mr": "उत्तर कोकण किनारपट्टी विभाग",
            "districts": "Thane, Palghar, Raigad",
            "rainfall": "2600-3000 mm",
            "soil": "Coarse Shallow & Coastal Alluvium",
            "crops": "Rice, Finger Millet (Ragi), Vegetables",
        },
        {
            "id": "ghat_zone",
            "name": "Ghat Zone (Western Ghats)",
            "name_mr": "घाट विभाग",
            "districts": "Maval, Mahabaleshwar, Radhanagari",
            "rainfall": "3000-5000 mm",
            "soil": "Lateritic & Forest Soil",
            "crops": "Paddy, Hill Millets, Potato",
        },
        {
            "id": "transition_zone_1",
            "name": "Transition Zone 1",
            "name_mr": "संक्रमण विभाग १",
            "districts": "Kolhapur, Satara, Pune plains",
            "rainfall": "1250-3000 mm",
            "soil": "Reddish Brown to Medium Black",
            "crops": "Sugarcane, Soybean, Groundnut",
        },
        {
            "id": "transition_zone_2",
            "name": "Transition Zone 2",
            "name_mr": "संक्रमण विभाग २",
            "districts": "Eastern Pune, Satara, Sangli, Nashik",
            "rainfall": "700-1250 mm",
            "soil": "Medium Black Vertisol",
            "crops": "Bajra, Jowar, Onion, Grapes",
        },
        {
            "id": "scarcity_zone",
            "name": "Scarcity Zone (Rain Shadow)",
            "name_mr": "पर्जन्यछायेचा अवर्षणप्रवण विभाग",
            "districts": "Solapur, Ahilyanagar, Beed, Dharashiv",
            "rainfall": "500-750 mm",
            "soil": "Medium Black to Calcareous Clay",
            "crops": "Rabi Jowar, Pomegranate, Pulses",
        },
        {
            "id": "central_plateau",
            "name": "Central Maharashtra Plateau Zone",
            "name_mr": "मध्य महाराष्ट्र पठारी विभाग",
            "districts": "Chh. Sambhajinagar, Jalna, Parbhani",
            "rainfall": "700-900 mm",
            "soil": "Deep Black Cotton Soil",
            "crops": "Cotton, Soybean, Sweet Orange",
        },
        {
            "id": "central_vidarbha",
            "name": "Central Vidarbha Zone",
            "name_mr": "मध्य विदर्भ विभाग",
            "districts": "Nagpur, Wardha, Amravati, Yavatmal",
            "rainfall": "950-1250 mm",
            "soil": "Deep Heavy Vertisol",
            "crops": "Cotton, Soybean, Pigeonpea (Tur)",
        },
        {
            "id": "eastern_vidarbha",
            "name": "Eastern Vidarbha Zone",
            "name_mr": "पूर्व विदर्भ विभाग",
            "districts": "Bhandara, Gondia, Chandrapur, Gadchiroli",
            "rainfall": "1250-1700 mm",
            "soil": "Yellowish Brown Sandy Loam (Wainganga basin)",
            "crops": "Paddy, Pulses, Forest Produce",
        },
    ]
