"""API routes for explainable agro-climatic risk assessment."""

from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status
from app.schemas.climate import RiskAssessmentResponse
from app.services.climate.anomaly import compute_rainfall_anomaly
from app.services.climate.indicators import (
    compute_accumulation,
    compute_data_quality,
    compute_dry_spells,
    compute_heavy_rain,
)
from app.services.climate.onset import compute_monsoon_onset
from app.services.climate.risk_engine import assess_climate_risk
from app.services.location_service import location_service
from app.services.rainfall.factory import get_rainfall_provider

router = APIRouter(prefix="/risk", tags=["Explainable Risk Engine"])


@router.get(
    "/{block_id}",
    response_model=RiskAssessmentResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Explainable Agro-Climatic Risk Assessment",
    description="Evaluate explainable, rule-based climate hazard risk with supporting measurements, risk drivers, confidence, and transparent limitations.",
)
async def get_block_risk_assessment(
    block_id: str,
    window_days: int = Query(
        default=14,
        ge=3,
        le=60,
        description="Assessment window in days (3 to 60 days)",
        examples=[14],
    ),
    provider: str = Query(
        default="open-meteo",
        description="Rainfall provider key ('open-meteo' or 'imd')",
        examples=["open-meteo"],
    ),
    baseline_normal_mm: Optional[float] = Query(
        default=None,
        description="Optional 30-year historical normal rainfall in mm for anomaly baseline",
        examples=[45.0],
    ),
) -> RiskAssessmentResponse:
    """Perform explainable risk evaluation for a validated administrative block."""
    block = location_service.get_block(block_id)
    if not block:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Block '{block_id}' not found in curated Maharashtra dataset.",
        )

    provider_instance = get_rainfall_provider(provider)
    obs_series = await provider_instance.get_recent_observations(block=block, days=window_days)

    accumulation = compute_accumulation(obs_series.observations)
    dry_spell = compute_dry_spells(obs_series.observations)
    heavy_rain = compute_heavy_rain(obs_series.observations)
    anomaly = compute_rainfall_anomaly(
        observed_mm=accumulation.total_mm,
        baseline_normal_mm=baseline_normal_mm,
    )
    monsoon_onset = compute_monsoon_onset(obs_series.observations)
    data_quality = compute_data_quality(obs_series.observations)

    return assess_climate_risk(
        block_id=block.id,
        block_name=block.name,
        district_name=block.district_name,
        start_date=obs_series.start_date,
        end_date=obs_series.end_date,
        accumulation=accumulation,
        dry_spell=dry_spell,
        heavy_rain=heavy_rain,
        anomaly=anomaly,
        monsoon_onset=monsoon_onset,
        data_quality=data_quality,
        custom_assessment_time=datetime.now(timezone.utc),
    )
