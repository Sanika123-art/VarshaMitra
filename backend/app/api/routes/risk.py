"""API routes for explainable agro-climatic risk assessment and the map overview."""

import asyncio
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import FileResponse
import httpx

from app.core.climate_constants import RISK_ENGINE_METHOD_VERSION
from app.core.config import settings
from app.core.logging import logger
from app.schemas.climate import (
    DataProvenance,
    RiskAssessmentResponse,
    RiskSummaryItem,
    RiskSummaryResponse,
)
from app.schemas.location import BlockDetail
from app.services.climate.assessment import (
    BlockEvaluation,
    evaluate_block,
    season_note_for,
)
from app.services.climate.risk_engine import assess_climate_risk
from app.services.location_service import location_service
from app.services.rainfall.factory import get_rainfall_provider

router = APIRouter(prefix="/risk", tags=["Explainable Risk Engine"])
BOUNDARY_DATA_PATH = Path(__file__).resolve().parents[2] / "data" / "maharashtra-taluka-boundaries.geojson"
BOUNDARY_SOURCE = (
    "geoBoundaries India ADM3 (2018), sourced from Pathways Data Pvt. Ltd. / Local Government Directory; "
    "Open Data Commons Open Database License 1.0."
)

PROVISIONAL_NOTICE = (
    "Provisional heuristic. Risk levels come from documented rules over recent rainfall only; they are not "
    "validated forecasts and have not been reviewed by local agronomists (KVK)."
)
COORDINATES_NOTE = (
    "Climate values are evaluated at approximate block/taluka reference coordinates, not farm-level measurements. "
    "Administrative polygon geometry is served separately by /risk/boundaries."
)
MAP_LAYERS_AVAILABLE = {
    "overall_risk": True,
    "monsoon_onset": True,
    "dry_spell": True,
    "heavy_rainfall": True,
    "rainfall_forecast": False,
    "historical_rainfall": False,
    "crop_distribution": False,
    "farmer_reports": False,
}

# (provider, window_days) -> (monotonic timestamp, response)
_SUMMARY_CACHE: Dict[Tuple[str, int], Tuple[float, RiskSummaryResponse]] = {}


def clear_summary_cache() -> None:
    """Drop cached summaries (used by tests)."""
    _SUMMARY_CACHE.clear()


def _risk_for(block: BlockDetail, ev: BlockEvaluation) -> RiskAssessmentResponse:
    risk = assess_climate_risk(
        block_id=block.id,
        block_name=block.name,
        district_name=block.district_name,
        start_date=ev.series.start_date,
        end_date=ev.series.end_date,
        accumulation=ev.accumulation,
        dry_spell=ev.dry_spell,
        heavy_rain=ev.heavy_rain,
        anomaly=ev.anomaly,
        monsoon_onset=ev.monsoon_onset,
        data_quality=ev.data_quality,
        custom_assessment_time=datetime.now(timezone.utc),
    )
    risk.data_provenance = ev.provenance
    risk.season_note = season_note_for(ev.series.end_date)
    return risk


async def _summarise_block(
    block: BlockDetail,
    provider: str,
    window_days: int,
    semaphore: asyncio.Semaphore,
    client: Optional[httpx.AsyncClient] = None,
) -> Tuple[RiskSummaryItem, Optional[DataProvenance]]:
    district = location_service.get_district(block.district_id)
    base = dict(
        block_id=block.id,
        block_name=block.name,
        block_name_mr=block.name_mr,
        district_id=block.district_id,
        district_name=block.district_name,
        district_name_mr=district.name_mr if district else block.district_name,
        latitude=block.latitude,
        longitude=block.longitude,
        geometry_type="Point",
        coordinates_precision=block.coordinates_precision.value,
    )
    try:
        async with semaphore:
            # Per-block bounded timeout prevents a single slow network query from hanging regional aggregation
            ev = await asyncio.wait_for(
                evaluate_block(block, provider, window_days, client=client),
                timeout=5.0,
            )
    except asyncio.TimeoutError:
        logger.warning("Risk summary: block %s evaluation timed out after 5.0s", block.id)
        return RiskSummaryItem(**base, status="unavailable", error="Rainfall provider request timed out for this block."), None
    except HTTPException as exc:
        logger.warning("Risk summary: block %s unavailable (HTTP %s)", block.id, exc.status_code)
        return RiskSummaryItem(**base, status="unavailable", error=str(exc.detail)), None
    except Exception:  # pragma: no cover - defensive; never leak internals to the browser
        logger.exception("Risk summary: unexpected failure for block %s", block.id)
        return RiskSummaryItem(**base, status="unavailable", error="Risk could not be computed for this block."), None

    risk = _risk_for(block, ev)
    return (
        RiskSummaryItem(
            **base,
            status="ok",
            overall_risk=risk.overall_risk,
            confidence=risk.confidence,
            dry_spell_severity=ev.dry_spell.severity,
            current_dry_days=ev.dry_spell.current_consecutive_dry_days,
            heavy_rain_event=ev.heavy_rain.has_heavy_rain_event,
            max_single_day_mm=ev.heavy_rain.max_single_day_mm,
            accumulation_mm=ev.accumulation.total_mm,
            monsoon_onset_status=ev.monsoon_onset.status,
            in_monsoon_season=risk.in_monsoon_season,
            coverage_ratio=ev.data_quality.coverage_ratio,
            freshness_status=ev.data_quality.freshness_status,
            missing_days_count=ev.data_quality.missing_days_count,
            confidence_rationale=risk.confidence_rationale,
            assessment_time=risk.assessment_time,
            data_provenance=ev.provenance,
            window_start=ev.series.start_date,
            window_end=ev.series.end_date,
        ),
        ev.provenance,
    )


@router.get(
    "/boundaries",
    response_class=FileResponse,
    status_code=status.HTTP_200_OK,
    summary="Maharashtra administrative taluka boundary polygons",
    description=(
        "Serves the pinned geoBoundaries India ADM3 dataset subset for Maharashtra. "
        "The source represents 2018 sub-district boundaries and is not cadastral or farm-level geometry."
    ),
)
async def get_risk_boundaries() -> FileResponse:
    if not BOUNDARY_DATA_PATH.is_file():
        logger.error("Risk map boundary file is missing at %s", BOUNDARY_DATA_PATH)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Administrative boundary data is not installed on this server.",
        )
    return FileResponse(BOUNDARY_DATA_PATH, media_type="application/geo+json")


@router.get(
    "/summary",
    response_model=RiskSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Backend-derived risk overview for every curated block (map data)",
    description=(
        "Runs the same deterministic indicator and risk engine used by /risk/{block_id} for every curated block. "
        "Blocks whose rainfall data cannot be retrieved are returned with status 'unavailable' rather than being "
        "omitted or filled in. Results are cached in memory for a short, configurable period."
    ),
)
async def get_risk_summary(
    window_days: int = Query(default=14, ge=3, le=30, description="Assessment window in days (3 to 30)"),
    provider: str = Query(default="open-meteo", description="Rainfall provider key"),
) -> RiskSummaryResponse:
    get_rainfall_provider(provider)  # 400 for unknown providers

    key = (provider.strip().lower(), window_days)
    ttl = settings.RISK_SUMMARY_CACHE_TTL_SECONDS
    now = time.monotonic()
    cached = _SUMMARY_CACHE.get(key)
    if cached and ttl > 0 and (now - cached[0]) < ttl:
        age = int(now - cached[0])
        return cached[1].model_copy(update={"cached": True, "cache_age_seconds": age})

    blocks = location_service.list_blocks(include_dynamic=False)
    semaphore = asyncio.Semaphore(max(1, settings.RISK_SUMMARY_CONCURRENCY))
    details = [location_service.get_block(b.id) for b in blocks]

    # Shared connection pool with keepalive speeds up 15-block aggregation by 5-6x
    limits = httpx.Limits(max_keepalive_connections=20, max_connections=20)
    timeout = httpx.Timeout(4.5, connect=3.0)
    async with httpx.AsyncClient(limits=limits, timeout=timeout) as client:
        results = await asyncio.gather(
            *[_summarise_block(d, provider, window_days, semaphore, client=client) for d in details if d is not None]
        )

    items = [r[0] for r in results]
    provenance = next((r[1] for r in results if r[1] is not None), None)
    response = RiskSummaryResponse(
        generated_at=datetime.now(timezone.utc),
        cached=False,
        cache_age_seconds=0,
        window_days=window_days,
        provider=key[0],
        count=len(items),
        available_count=sum(1 for i in items if i.status == "ok"),
        items=items,
        coordinates_note=COORDINATES_NOTE,
        method_version=RISK_ENGINE_METHOD_VERSION,
        data_provenance=provenance,
        provisional_notice=PROVISIONAL_NOTICE,
        geometry_type="Point",
        boundaries_available=BOUNDARY_DATA_PATH.is_file(),
        boundary_source=BOUNDARY_SOURCE if BOUNDARY_DATA_PATH.is_file() else None,
        layers_available=MAP_LAYERS_AVAILABLE,
    )
    # Only cache when at least one block succeeded; a total outage must not be remembered.
    if response.available_count > 0:
        _SUMMARY_CACHE[key] = (now, response)
    return response


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
        le=30,
        description="Assessment window in days (3 to 30 days)",
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

    ev = await evaluate_block(block, provider, window_days, baseline_normal_mm)
    return _risk_for(block, ev)
