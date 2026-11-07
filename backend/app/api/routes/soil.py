"""API routes for regional soil property intelligence and farmer field soil tests."""

from typing import Optional
from fastapi import APIRouter, HTTPException, status

from app.schemas.soil import (
    FieldSoilTestResponse,
    FieldSoilTestSubmission,
    RegionalSoilSummaryResponse,
)
from app.services.agronomy.soil_service import soil_service
from app.services.location_service import location_service

router = APIRouter(prefix="/soil", tags=["Soil Intelligence"])


@router.get(
    "/{block_id}",
    response_model=RegionalSoilSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Regional Soil Profile",
    description="Retrieve estimated regional soil properties (texture, pH, organic carbon, available water capacity, drainage) for an administrative block.",
)
async def get_block_soil_profile(block_id: str) -> RegionalSoilSummaryResponse:
    """Fetch regional soil profile for a validated block."""
    block = location_service.get_block(block_id)
    if not block:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Block '{block_id}' not found in curated Maharashtra dataset.",
        )

    return await soil_service.get_regional_profile_with_live_diagnostics(block)


@router.post(
    "/test-profile",
    response_model=FieldSoilTestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit Field-Level Soil Test (Soil Health Card)",
    description="Register farmer field-specific soil test results with diagnostic nutrient ratings (N, P, K, OC, pH, EC).",
)
async def submit_field_soil_test(submission: FieldSoilTestSubmission) -> FieldSoilTestResponse:
    """Register farmer soil test report."""
    block = location_service.get_block(submission.location_id)
    if not block:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Block '{submission.location_id}' not found in curated Maharashtra dataset.",
        )

    return soil_service.register_field_soil_test(submission)


@router.get(
    "/test-profile/{block_id}",
    response_model=FieldSoilTestResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Latest Field Soil Test",
    description="Retrieve the most recent registered field soil test for an administrative block.",
)
async def get_latest_field_soil_test(block_id: str) -> FieldSoilTestResponse:
    """Retrieve latest registered field soil test."""
    block = location_service.get_block(block_id)
    if not block:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Block '{block_id}' not found in curated dataset.",
        )

    profile = soil_service.get_latest_field_test(block_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No field soil test reports registered for block '{block_id}'. Using regional estimates.",
        )

    return profile
