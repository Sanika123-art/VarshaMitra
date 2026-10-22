"""API routes for climate indicators and ML boundary specification."""

from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status
from app.core.climate_constants import RISK_ENGINE_METHOD_VERSION
from app.schemas.climate import (
    ClimateIndicatorsResponse,
    MLBoundarySpecification,
)
from app.services.climate.anomaly import compute_rainfall_anomaly
from app.services.climate.indicators import (
    compute_accumulation,
    compute_data_quality,
    compute_dry_spells,
    compute_heavy_rain,
)
from app.services.climate.onset import compute_monsoon_onset
from app.services.location_service import location_service
from app.services.ml.boundary import get_ml_boundary_specification
from app.services.rainfall.factory import get_rainfall_provider

router = APIRouter(prefix="/climate", tags=["Climate Indicators"])


@router.get(
    "/indicators/{block_id}",
    response_model=ClimateIndicatorsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Deterministic Climate Indicators",
    description="Calculate verified agro-climatic indicators (accumulation, dry spells, heavy deluge, anomaly, onset) for an administrative block.",
)
async def get_climate_indicators(
    block_id: str,
    window_days: int = Query(
        default=14,
        ge=3,
        le=60,
        description="Analysis window in days (3 to 60 days)",
        examples=[14],
    ),
    provider: str = Query(
        default="open-meteo",
        description="Rainfall provider key ('open-meteo' or 'imd')",
        examples=["open-meteo"],
    ),
    baseline_normal_mm: Optional[float] = Query(
        default=None,
        description="Optional 30-year historical normal rainfall in mm for anomaly computation",
        examples=[45.0],
    ),
) -> ClimateIndicatorsResponse:
    """Compute and return pure climate indicators from verified rainfall data."""
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

    return ClimateIndicatorsResponse(
        block_id=block.id,
        block_name=block.name,
        district_name=block.district_name,
        window_days=window_days,
        start_date=obs_series.start_date,
        end_date=obs_series.end_date,
        accumulation=accumulation,
        dry_spell=dry_spell,
        heavy_rain=heavy_rain,
        anomaly=anomaly,
        monsoon_onset=monsoon_onset,
        data_quality=data_quality,
        method_version=RISK_ENGINE_METHOD_VERSION,
        retrieved_at=datetime.now(timezone.utc),
    )


@router.get(
    "/ml-boundary",
    response_model=MLBoundarySpecification,
    status_code=status.HTTP_200_OK,
    summary="Get Machine Learning Boundary & Evaluation Protocol",
    description="Returns formal specification of ML contracts, feature definitions, data requirements, temporal split, and no-fabricated-metrics policy.",
)
async def get_ml_boundary() -> MLBoundarySpecification:
    """Return transparent ML boundary and evaluation protocol."""
    return get_ml_boundary_specification()
