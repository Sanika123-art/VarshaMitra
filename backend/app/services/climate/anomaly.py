"""Rainfall anomaly computation with strict baseline validation."""

from typing import Optional
from app.schemas.climate import AnomalyIndicator


def compute_rainfall_anomaly(
    observed_mm: float,
    baseline_normal_mm: Optional[float] = None,
    provenance: Optional[str] = None,
) -> AnomalyIndicator:
    """Compute percentage departure against a historical climatological normal.

    NOTE ON DATA INTEGRITY:
    If no valid, calibrated baseline normal is provided, the function explicitly returns
    'insufficient_baseline_data' instead of fabricating a baseline average.
    """
    if baseline_normal_mm is None or baseline_normal_mm <= 0.0:
        return AnomalyIndicator(
            observed_mm=observed_mm,
            baseline_normal_mm=None,
            departure_pct=None,
            status="insufficient_baseline_data",
            baseline_provenance=(
                "Official 30-year IMD block-level normals (1991–2020) are pending ingestion. "
                "Anomaly percentage is withheld to avoid uncalibrated distortion."
            ),
        )

    departure = round(((observed_mm - baseline_normal_mm) / baseline_normal_mm) * 100.0, 1)

    # Standard IMD Meteorological Departure Categories
    if departure >= 60.0:
        category = "large_excess"
    elif departure >= 20.0:
        category = "excess"
    elif departure >= -19.0:
        category = "normal"
    elif departure >= -59.0:
        category = "deficient"
    else:
        category = "large_deficient"

    return AnomalyIndicator(
        observed_mm=observed_mm,
        baseline_normal_mm=round(baseline_normal_mm, 2),
        departure_pct=departure,
        status=category,
        baseline_provenance=provenance or "Historical climatological window benchmark (IMD reference)",
    )
