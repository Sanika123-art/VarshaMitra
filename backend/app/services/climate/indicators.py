"""Pure, deterministic climate indicator calculation functions."""

from datetime import date
from typing import List, Tuple
from app.core.climate_constants import (
    CRITICAL_DRY_SPELL_DAYS,
    HEAVY_RAIN_THRESHOLD_MM,
    IMD_DRY_DAY_THRESHOLD_MM,
    MILD_DRY_SPELL_DAYS,
    MINIMUM_DATA_COVERAGE_RATIO,
    SIGNIFICANT_DRY_SPELL_DAYS,
)
from app.schemas.climate import (
    AccumulationIndicator,
    DataQualitySummary,
    DrySpellIndicator,
    HeavyRainIndicator,
)
from app.schemas.rainfall import QualityStatus, RainfallObservationItem


def compute_accumulation(observations: List[RainfallObservationItem]) -> AccumulationIndicator:
    """Calculate cumulative rainfall and valid observation density."""
    if not observations:
        return AccumulationIndicator(
            total_mm=0.0,
            valid_days_count=0,
            missing_days_count=0,
            daily_average_mm=0.0,
        )

    valid_sum = 0.0
    valid_count = 0
    missing_count = 0

    for obs in observations:
        if obs.value_mm is not None and obs.quality != QualityStatus.MISSING:
            valid_sum += obs.value_mm
            valid_count += 1
        else:
            missing_count += 1

    daily_avg = round(valid_sum / valid_count, 2) if valid_count > 0 else 0.0

    return AccumulationIndicator(
        total_mm=round(valid_sum, 2),
        valid_days_count=valid_count,
        missing_days_count=missing_count,
        daily_average_mm=daily_avg,
    )


def compute_dry_spells(
    observations: List[RainfallObservationItem],
    threshold_mm: float = IMD_DRY_DAY_THRESHOLD_MM,
) -> DrySpellIndicator:
    """Calculate non-rainy days and consecutive dry spell sequences.

    NOTE ON MISSING DATA:
    Missing observations (None) are NOT assumed to be dry or rainy; they break
    unbroken dry streaks to prevent over-estimating consecutive dry day hazards.
    """
    dry_count = 0
    max_streak = 0
    current_streak = 0

    for obs in observations:
        if obs.value_mm is not None and obs.quality != QualityStatus.MISSING:
            if obs.value_mm < threshold_mm:
                dry_count += 1
                current_streak += 1
                if current_streak > max_streak:
                    max_streak = current_streak
            else:
                current_streak = 0
        else:
            # Missing day breaks continuous dry spell calculation
            current_streak = 0

    # Classify severity
    effective_streak = max(max_streak, current_streak)
    if effective_streak >= CRITICAL_DRY_SPELL_DAYS:
        severity = "critical"
    elif effective_streak >= SIGNIFICANT_DRY_SPELL_DAYS:
        severity = "significant"
    elif effective_streak >= MILD_DRY_SPELL_DAYS:
        severity = "mild"
    else:
        severity = "none"

    return DrySpellIndicator(
        threshold_mm=threshold_mm,
        dry_days_count=dry_count,
        max_consecutive_dry_days=max_streak,
        current_consecutive_dry_days=current_streak,
        severity=severity,
    )


def compute_heavy_rain(
    observations: List[RainfallObservationItem],
    threshold_mm: float = HEAVY_RAIN_THRESHOLD_MM,
) -> HeavyRainIndicator:
    """Identify deluge days meeting or exceeding IMD heavy rainfall threshold (>=64.5 mm)."""
    heavy_count = 0
    max_day_mm = 0.0
    dates: List[date] = []

    for obs in observations:
        if obs.value_mm is not None and obs.quality != QualityStatus.MISSING:
            if obs.value_mm > max_day_mm:
                max_day_mm = obs.value_mm
            if obs.value_mm >= threshold_mm:
                heavy_count += 1
                dates.append(obs.date)

    return HeavyRainIndicator(
        threshold_mm=threshold_mm,
        heavy_rain_days_count=heavy_count,
        max_single_day_mm=round(max_day_mm, 2),
        event_dates=dates,
        has_heavy_rain_event=(heavy_count > 0),
    )


def compute_data_quality(
    observations: List[RainfallObservationItem],
    fallback_freshness: QualityStatus = QualityStatus.FRESH,
) -> DataQualitySummary:
    """Evaluate data completeness ratio against minimum acceptable coverage."""
    total_days = len(observations)
    if total_days == 0:
        return DataQualitySummary(
            coverage_ratio=0.0,
            is_sufficient=False,
            freshness_status=QualityStatus.MISSING,
            missing_days_count=0,
        )

    missing_count = sum(
        1 for obs in observations if obs.value_mm is None or obs.quality == QualityStatus.MISSING
    )
    valid_count = total_days - missing_count
    coverage_ratio = round(valid_count / total_days, 3)
    is_sufficient = coverage_ratio >= MINIMUM_DATA_COVERAGE_RATIO

    # Determine latest point freshness
    latest_freshness = fallback_freshness
    if observations:
        latest_freshness = observations[-1].quality

    return DataQualitySummary(
        coverage_ratio=coverage_ratio,
        is_sufficient=is_sufficient,
        freshness_status=latest_freshness,
        missing_days_count=missing_count,
    )
