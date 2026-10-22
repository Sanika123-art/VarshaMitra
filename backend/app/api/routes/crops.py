"""API routes for crop requirements, suitability assessment, and sowing intelligence."""

from datetime import date
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status

from app.schemas.agronomy import (
    CropRequirement,
    CropSeason,
    SowingAssessmentResponse,
    SuitabilityAssessmentResponse,
    WaterSourceType,
)
from app.services.agronomy.crop_service import crop_service
from app.services.agronomy.soil_service import soil_service
from app.services.agronomy.sowing_engine import evaluate_sowing_readiness
from app.services.agronomy.suitability_engine import assess_block_suitability
from app.services.climate.indicators import (
    compute_accumulation,
    compute_dry_spells,
    compute_heavy_rain,
)
from app.services.location_service import location_service
from app.services.rainfall.factory import get_rainfall_provider
from app.services.rainfall.open_meteo import OpenMeteoRainfallProvider

router = APIRouter(prefix="/crops", tags=["Crop Intelligence & Sowing Engine"])


@router.get(
    "",
    response_model=List[CropRequirement],
    status_code=status.HTTP_200_OK,
    summary="List Supported Crops",
    description="List Maharashtra crops with documented agronomic requirements, growth stages, and sowing calendars.",
)
async def list_crops(
    season: Optional[CropSeason] = Query(None, description="Optional season filter (kharif, rabi, summer, perennial)"),
) -> List[CropRequirement]:
    """List crops catalogue."""
    return crop_service.list_crops(season)


@router.get(
    "/details/{crop_id}",
    response_model=CropRequirement,
    status_code=status.HTTP_200_OK,
    summary="Get Crop Requirements Specification",
    description="Fetch full agronomic specification, sowing calendar, soil requirements, and growth stages for a specific crop.",
)
async def get_crop_details(crop_id: str) -> CropRequirement:
    """Fetch details for a single crop."""
    crop = crop_service.get_crop(crop_id)
    if not crop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Crop '{crop_id}' not found in Maharashtra agricultural catalogue.",
        )
    return crop


@router.get(
    "/suitability/{block_id}",
    response_model=SuitabilityAssessmentResponse,
    status_code=status.HTTP_200_OK,
    summary="Assess Location Crop Suitability",
    description="Evaluate potentially suitable crops for an administrative block, taking into account soil properties, season, and irrigation.",
)
async def assess_crop_suitability(
    block_id: str,
    season: CropSeason = Query(default=CropSeason.KHARIF, description="Target cropping season"),
    water_source: WaterSourceType = Query(default=WaterSourceType.RAINFED, description="Irrigation availability tier"),
) -> SuitabilityAssessmentResponse:
    """Assess crop suitability for a block."""
    block = location_service.get_block(block_id)
    if not block:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Block '{block_id}' not found in curated Maharashtra dataset.",
        )

    soil_profile = soil_service.get_regional_profile(block_id)
    field_test = soil_service.get_latest_field_test(block_id)

    return assess_block_suitability(
        block=block,
        soil_profile=soil_profile,
        field_test=field_test,
        season=season,
        water_source=water_source,
    )


@router.get(
    "/sowing-readiness/{block_id}",
    response_model=SowingAssessmentResponse,
    status_code=status.HTTP_200_OK,
    summary="Assess Sowing Readiness",
    description="Evaluate whether current date, recent rainfall history (soil moisture proxy), and forward weather forecast support sowing a crop.",
)
async def assess_sowing_conditions(
    block_id: str,
    crop_id: str = Query(..., description="Crop ID to evaluate (e.g. 'soybean', 'cotton')", examples=["soybean"]),
    target_date: Optional[date] = Query(None, description="Assessment date (defaults to today)", examples=["2026-06-25"]),
    provider: str = Query(default="open-meteo", description="Rainfall provider"),
) -> SowingAssessmentResponse:
    """Evaluate real-time sowing conditions."""
    block = location_service.get_block(block_id)
    if not block:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Block '{block_id}' not found in curated Maharashtra dataset.",
        )

    crop = crop_service.get_crop(crop_id)
    if not crop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Crop '{crop_id}' not found in catalogue.",
        )

    assessment_d = target_date or date.today()

    # 1. Fetch recent rainfall observations (14 days trailing)
    provider_instance = get_rainfall_provider(provider)
    obs_series = await provider_instance.get_recent_observations(block=block, days=14)
    acc = compute_accumulation(obs_series.observations)
    dry = compute_dry_spells(obs_series.observations)
    heavy = compute_heavy_rain(obs_series.observations)

    # 2. Fetch forward forecast (14 days lead time)
    forecast_series = None
    if isinstance(provider_instance, OpenMeteoRainfallProvider):
        try:
            forecast_series = await provider_instance.get_forecast(block=block, days=14)
        except Exception:
            forecast_series = None

    return evaluate_sowing_readiness(
        block=block,
        crop=crop,
        target_date=assessment_d,
        accumulation=acc,
        forecast=forecast_series,
        dry_spell=dry,
        heavy_rain=heavy,
    )
