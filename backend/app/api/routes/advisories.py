"""API routes for crop-stage-specific agricultural advisories."""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status

from app.schemas.agronomy import CropAdvisoryResponse
from app.schemas.explanation import ExplanationRequest, ExplanationResponse
from app.services.agronomy.advisory_engine import generate_crop_advisories
from app.services.agronomy.crop_service import crop_service
from app.services.explanation import explanation_service
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

router = APIRouter(prefix="/advisories", tags=["Crop Advisories Engine"])


@router.get(
    "",
    response_model=CropAdvisoryResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Crop-Stage Specific Agricultural Advisory",
    description="Generate prioritized agronomic recommendations for a specific crop and growth stage, synthesized with real-time climate indicators.",
)
async def get_crop_advisory(
    location_id: str = Query(..., description="Administrative block ID (e.g. 'baramati')", examples=["baramati"]),
    crop_id: str = Query(..., description="Crop ID (e.g. 'soybean', 'cotton')", examples=["soybean"]),
    stage_id: str = Query(..., description="Phenological growth stage (e.g. 'sowing', 'flowering')", examples=["flowering"]),
    language: str = Query(default="en", description="Output language: 'en' (English) or 'mr' (Marathi)", examples=["en"]),
    provider: str = Query(default="open-meteo", description="Rainfall provider key"),
) -> CropAdvisoryResponse:
    """Generate prioritized crop-stage advisory."""
    block = location_service.get_block(location_id)
    if not block:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Block '{location_id}' not found in curated Maharashtra dataset.",
        )

    crop = crop_service.get_crop(crop_id)
    if not crop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Crop '{crop_id}' not found in catalogue.",
        )

    stage = crop_service.get_stage(crop_id, stage_id)
    if not stage:
        allowed_stages = [st.stage_id for st in crop.growth_stages]
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Growth stage '{stage_id}' not found for crop '{crop_id}'. Allowed stages: {allowed_stages}",
        )

    # Fetch 14-day trailing rainfall observations
    provider_instance = get_rainfall_provider(provider)
    obs_series = await provider_instance.get_recent_observations(block=block, days=14)

    acc = compute_accumulation(obs_series.observations)
    dry = compute_dry_spells(obs_series.observations)
    heavy = compute_heavy_rain(obs_series.observations)
    anomaly = compute_rainfall_anomaly(observed_mm=acc.total_mm, district_id=block.district_id, window_days=14)
    onset = compute_monsoon_onset(obs_series.observations)
    quality = compute_data_quality(obs_series.observations)

    climate_risk = assess_climate_risk(
        block_id=block.id,
        block_name=block.name,
        district_name=block.district_name,
        start_date=obs_series.start_date,
        end_date=obs_series.end_date,
        accumulation=acc,
        dry_spell=dry,
        heavy_rain=heavy,
        anomaly=anomaly,
        monsoon_onset=onset,
        data_quality=quality,
    )

    return generate_crop_advisories(
        block=block,
        crop=crop,
        stage=stage,
        climate_risk=climate_risk,
        accumulation=acc,
        dry_spell=dry,
        heavy_rain=heavy,
        language=language,
    )


@router.post(
    "/{advisory_id}/explanation",
    response_model=ExplanationResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate Grounded Explanation for Crop Advisory",
    description=(
        "Produces an evidence-grounded explanation of a validated crop advisory in English or Marathi. "
        "NuGen serves strictly as an explanation layer and cannot alter agronomic recommendations or risk categories."
    ),
)
async def explain_advisory_endpoint(
    advisory_id: str,
    request: Optional[ExplanationRequest] = None,
    location_id: Optional[str] = Query(default=None, description="Optional block ID override"),
    crop_id: Optional[str] = Query(default=None, description="Optional crop ID override"),
    stage_id: Optional[str] = Query(default=None, description="Optional growth stage ID override"),
    language: Optional[str] = Query(default=None, description="Language override: 'en' or 'mr'"),
    provider: str = Query(default="open-meteo", description="Rainfall provider key"),
) -> ExplanationResponse:
    """Generate an evidence-grounded explanation for an advisory."""
    # Determine target language from query or request body
    target_lang = "en"
    if language:
        target_lang = language.strip().lower()
    elif request and request.language:
        target_lang = request.language.strip().lower()

    # Parse location, crop, and stage from advisory_id or query parameters
    loc = location_id
    crp = crop_id
    stg = stage_id

    if not (loc and crp and stg):
        # Try parsing from standard advisory_id format: adv_{location_id}_{crop_id}_{stage_id}_{timestamp}
        parts = advisory_id.split("_")
        if len(parts) >= 4 and parts[0] == "adv":
            loc = loc or parts[1]
            crp = crp or parts[2]
            stg = stg or parts[3]

    if not (loc and crp and stg):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Could not resolve advisory context from ID '{advisory_id}'. "
                "Please provide 'location_id', 'crop_id', and 'stage_id' query parameters."
            ),
        )

    # Validate location
    block = location_service.get_block(loc)
    if not block:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Block '{loc}' not found in curated Maharashtra dataset.",
        )

    # Validate crop
    crop = crop_service.get_crop(crp)
    if not crop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Crop '{crp}' not found in catalogue.",
        )

    # Validate stage
    stage = crop_service.get_stage(crp, stg)
    if not stage:
        allowed_stages = [s.stage_id for s in crop.growth_stages]
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Growth stage '{stg}' not found for crop '{crp}'. Allowed stages: {allowed_stages}",
        )

    # Resolve canonical advisory server-side
    provider_instance = get_rainfall_provider(provider)
    obs_series = await provider_instance.get_recent_observations(block=block, days=14)

    acc = compute_accumulation(obs_series.observations)
    dry = compute_dry_spells(obs_series.observations)
    heavy = compute_heavy_rain(obs_series.observations)
    anomaly = compute_rainfall_anomaly(observed_mm=acc.total_mm, district_id=block.district_id, window_days=14)
    onset = compute_monsoon_onset(obs_series.observations)
    quality = compute_data_quality(obs_series.observations)

    climate_risk = assess_climate_risk(
        block_id=block.id,
        block_name=block.name,
        district_name=block.district_name,
        start_date=obs_series.start_date,
        end_date=obs_series.end_date,
        accumulation=acc,
        dry_spell=dry,
        heavy_rain=heavy,
        anomaly=anomaly,
        monsoon_onset=onset,
        data_quality=quality,
    )

    canonical_advisory = generate_crop_advisories(
        block=block,
        crop=crop,
        stage=stage,
        climate_risk=climate_risk,
        accumulation=acc,
        dry_spell=dry,
        heavy_rain=heavy,
        language=target_lang,
    )

    # Generate grounded explanation
    explanation = explanation_service.explain_advisory(
        advisory=canonical_advisory,
        language=target_lang,
    )

    # Preserve the requested advisory_id in the response if custom
    if explanation.advisory_id != advisory_id:
        return explanation.model_copy(update={"advisory_id": advisory_id})
    return explanation
