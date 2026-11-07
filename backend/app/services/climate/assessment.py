"""Shared evaluation pipeline: rainfall provider -> deterministic indicators -> provenance.

Used by the per-block indicator route, the per-block risk route and the bulk map summary so the
three can never drift apart. No thresholds are defined here; they live in `climate_constants`.
"""

from dataclasses import dataclass
from datetime import date
from typing import Optional

from app.core.climate_constants import MONSOON_SEASON_MONTHS
from app.schemas.climate import (
    AccumulationIndicator,
    AnomalyIndicator,
    DataProvenance,
    DataQualitySummary,
    DrySpellIndicator,
    HeavyRainIndicator,
    MonsoonOnsetIndicator,
)
from app.schemas.location import BlockDetail
from app.schemas.rainfall import DataType, RainfallObservationSeries
from app.services.climate.anomaly import compute_rainfall_anomaly
from app.services.climate.indicators import (
    compute_accumulation,
    compute_data_quality,
    compute_dry_spells,
    compute_heavy_rain,
)
from app.services.climate.onset import compute_monsoon_onset
from app.services.rainfall.factory import get_rainfall_provider


_DATA_TYPE_NOTES = {
    DataType.MODEL_ANALYSIS: (
        "Recent-past values are weather-model analysis served by a forecast service. They are not rain-gauge "
        "observations and not ERA5-Land reanalysis."
    ),
    DataType.OBSERVATION: "Gauge / automatic weather station observations.",
    DataType.REANALYSIS: "Historical reanalysis (model-assimilated grid); not a gauge observation.",
    DataType.FORECAST: "Forecast values; not observed rainfall.",
    DataType.SYNTHETIC_TEST: "Synthetic test fixture; not real rainfall.",
}


@dataclass
class BlockEvaluation:
    """All deterministic outputs for one block and window."""

    series: RainfallObservationSeries
    accumulation: AccumulationIndicator
    dry_spell: DrySpellIndicator
    heavy_rain: HeavyRainIndicator
    anomaly: AnomalyIndicator
    monsoon_onset: MonsoonOnsetIndicator
    data_quality: DataQualitySummary
    provenance: DataProvenance


def build_provenance(series: RainfallObservationSeries) -> DataProvenance:
    """Describe the rainfall series behind a calculation without overstating what it is."""
    return DataProvenance(
        data_type=series.data_type,
        provider_id=series.provider.provider_id,
        provider_name=series.provider.provider_name,
        dataset_name=series.provider.dataset_name,
        attribution=series.provider.attribution,
        spatial_resolution=series.provider.spatial_resolution,
        retrieved_at=series.retrieved_at,
        window_start=series.start_date,
        window_end=series.end_date,
        is_station_observation=(series.data_type == DataType.OBSERVATION),
        note=_DATA_TYPE_NOTES.get(series.data_type, "Unclassified data type."),
    )


def season_note_for(end_date: date) -> Optional[str]:
    """Flag windows outside the monsoon season (dry-spell and deficit rules are not applied there)."""
    if end_date.month in MONSOON_SEASON_MONTHS:
        return None
    return (
        "This window ends outside the June-September monsoon season. Dry-spell and rainfall-deficit rules are "
        "not applied outside the monsoon: a long rainless spell in the dry season is normal in Maharashtra and "
        "does not by itself indicate crop stress. Heavy-rain events are still flagged. Interpret alongside your "
        "crop calendar and irrigation availability."
    )


async def evaluate_block(
    block: BlockDetail,
    provider_id: str,
    window_days: int,
    baseline_normal_mm: Optional[float] = None,
    client: Optional[object] = None,
) -> BlockEvaluation:
    """Fetch rainfall for `block` and compute every deterministic indicator."""
    provider = get_rainfall_provider(provider_id)
    series = await provider.get_recent_observations(block=block, days=window_days, client=client)

    accumulation = compute_accumulation(series.observations)
    return BlockEvaluation(
        series=series,
        accumulation=accumulation,
        dry_spell=compute_dry_spells(series.observations),
        heavy_rain=compute_heavy_rain(series.observations),
        anomaly=compute_rainfall_anomaly(
            observed_mm=accumulation.total_mm,
            baseline_normal_mm=baseline_normal_mm,
            district_id=block.district_id,
            window_days=window_days,
        ),
        monsoon_onset=compute_monsoon_onset(series.observations),
        data_quality=compute_data_quality(series.observations),
        provenance=build_provenance(series),
    )
