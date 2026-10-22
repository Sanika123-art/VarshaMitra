"""Operational monsoon onset detection service for Maharashtra agro-climatic zones."""

from datetime import date
from typing import List, Optional
from app.core.climate_constants import (
    ONSET_CUMULATIVE_2DAY_MM,
    ONSET_DAILY_MIN_MM,
    ONSET_WINDOW_END_DAY,
    ONSET_WINDOW_END_MONTH,
    ONSET_WINDOW_START_DAY,
    ONSET_WINDOW_START_MONTH,
)
from app.schemas.climate import MonsoonOnsetIndicator
from app.schemas.rainfall import QualityStatus, RainfallObservationItem


def is_in_onset_window(d: date) -> bool:
    """Check if a calendar date falls within Maharashtra monsoon onset surveillance window (June 1 – July 15)."""
    start_tuple = (ONSET_WINDOW_START_MONTH, ONSET_WINDOW_START_DAY)
    end_tuple = (ONSET_WINDOW_END_MONTH, ONSET_WINDOW_END_DAY)
    date_tuple = (d.month, d.day)
    return start_tuple <= date_tuple <= end_tuple


def compute_monsoon_onset(observations: List[RainfallObservationItem]) -> MonsoonOnsetIndicator:
    """Evaluate operational monsoon onset criteria based on daily rainfall observations.

    Operational Definition:
    - Surveillance Window: June 1 to July 15 (Kharif sowing onset season).
    - Thresholds: Two consecutive calendar days with daily rainfall >= 2.5 mm each,
      and 2-day cumulative sum >= 25.0 mm.
    - Missing data handling: Missing days (None or MISSING quality) do not count towards
      the condition and cannot bridge consecutive days.

    Rationale:
    Standard agrometeorological criterion used in peninsular India to designate
    soil-wetting sufficient for Kharif germination and emergence.
    """
    if not observations:
        return MonsoonOnsetIndicator(
            status="outside_onset_window",
            onset_date=None,
            criteria_summary="No rainfall observations provided for onset evaluation.",
        )

    # Check if any observation falls within the onset surveillance window
    dates_in_window = [obs for obs in observations if is_in_onset_window(obs.date)]

    if not dates_in_window:
        first_d = observations[0].date
        last_d = observations[-1].date
        return MonsoonOnsetIndicator(
            status="outside_onset_window",
            onset_date=None,
            criteria_summary=(
                f"Observation window ({first_d} to {last_d}) lies outside the Maharashtra Kharif "
                f"onset surveillance window (June {ONSET_WINDOW_START_DAY} to July {ONSET_WINDOW_END_DAY})."
            ),
        )

    # Chronologically sort window observations
    sorted_obs = sorted(dates_in_window, key=lambda x: x.date)

    # Evaluate consecutive day criterion
    for i in range(len(sorted_obs) - 1):
        obs1 = sorted_obs[i]
        obs2 = sorted_obs[i + 1]

        # Verify consecutive calendar days
        if (obs2.date - obs1.date).days != 1:
            continue

        # Check for valid measurements
        if obs1.value_mm is None or obs1.quality == QualityStatus.MISSING:
            continue
        if obs2.value_mm is None or obs2.quality == QualityStatus.MISSING:
            continue

        if (
            obs1.value_mm >= ONSET_DAILY_MIN_MM
            and obs2.value_mm >= ONSET_DAILY_MIN_MM
            and (obs1.value_mm + obs2.value_mm) >= ONSET_CUMULATIVE_2DAY_MM
        ):
            return MonsoonOnsetIndicator(
                status="confirmed",
                onset_date=obs2.date,
                criteria_summary=(
                    f"Operational onset criteria satisfied on {obs2.date}: 2 consecutive days "
                    f"({obs1.value_mm:.1f} mm on {obs1.date}, {obs2.value_mm:.1f} mm on {obs2.date}) "
                    f"totaling {obs1.value_mm + obs2.value_mm:.1f} mm (>= {ONSET_CUMULATIVE_2DAY_MM} mm)."
                ),
            )

    return MonsoonOnsetIndicator(
        status="pending",
        onset_date=None,
        criteria_summary=(
            f"Onset criteria (2 consecutive days >= {ONSET_DAILY_MIN_MM} mm, cumulative >= {ONSET_CUMULATIVE_2DAY_MM} mm) "
            f"not yet satisfied within surveillance window."
        ),
    )
