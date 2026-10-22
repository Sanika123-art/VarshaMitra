"""API routes for Maharashtra administrative locations."""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from app.schemas.location import (
    BlockDetail,
    BlockSummary,
    CoverageMetadata,
    DistrictDetail,
    DistrictSummary,
    LocationListResponse,
)
from app.services.location_service import location_service

router = APIRouter(prefix="/locations", tags=["Locations"])


@router.get(
    "/districts",
    response_model=List[DistrictSummary],
    status_code=status.HTTP_200_OK,
    summary="List Maharashtra Focus Districts",
    description="Returns all 7 curated focus districts in Maharashtra currently supported for agro-climatic calibration.",
)
async def list_districts() -> List[DistrictSummary]:
    """Retrieve all curated Maharashtra districts."""
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
            detail=f"District '{district_id}' not found in curated Maharashtra dataset.",
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
        description="Filter blocks by parent district ID (e.g. 'pune', 'nashik', 'solapur')",
        examples=["pune"],
    )
) -> LocationListResponse:
    """List blocks with optional district filtering."""
    if district_id and not location_service.get_district(district_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"District filter '{district_id}' does not match any curated Maharashtra district.",
        )

    items = location_service.list_blocks(district_id=district_id)
    return LocationListResponse(
        count=len(items),
        items=items,
        coverage_notice="Curated focus subset for agro-climatic testing; approximate centroid coordinates.",
    )


@router.get(
    "/blocks/{block_id}",
    response_model=BlockDetail,
    status_code=status.HTTP_200_OK,
    summary="Get Block Detail",
    description="Retrieve a single administrative block by its unique identifier with parent hierarchy.",
)
async def get_block(block_id: str) -> BlockDetail:
    """Retrieve specific block details."""
    block = location_service.get_block(block_id)
    if not block:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Block '{block_id}' not found in curated Maharashtra dataset.",
        )
    return block


@router.get(
    "/coverage",
    response_model=CoverageMetadata,
    status_code=status.HTTP_200_OK,
    summary="Dataset Coverage Limitations & Gazetteers",
    description="Transparent declaration of geographic scope, coordinate precision, and pending statewide gazetteer ingestion.",
)
async def get_coverage_info() -> CoverageMetadata:
    """Declared data coverage and limitations statement."""
    return location_service.get_coverage()
