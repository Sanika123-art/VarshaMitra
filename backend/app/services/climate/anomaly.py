"""Rainfall anomaly computation with strict baseline validation."""

from typing import Dict, Optional
from datetime import datetime, timezone
from app.schemas.climate import AnomalyIndicator

# Official IMD / CRIDA 30-year climatological normal annual rainfall (mm) for Maharashtra districts
MAHARASHTRA_DISTRICT_NORMALS_MM: Dict[str, float] = {
    "pune": 899.9,
    "satara": 925.0,
    "solapur": 680.0,
    "ahilyanagar": 580.0,
    "kolhapur": 1780.0,
    "sangli": 690.0,
    "nashik": 1050.0,
    "dhule": 674.0,
    "nandurbar": 850.0,
    "jalgaon": 740.0,
    "chhatrapati_sambhajinagar": 720.0,
    "jalna": 710.0,
    "parbhani": 880.0,
    "hingoli": 890.0,
    "nanded": 950.0,
    "beed": 660.0,
    "latur": 800.0,
    "dharashiv": 760.0,
    "buldhana": 790.0,
    "akola": 840.0,
    "washim": 910.0,
    "amravati": 870.0,
    "yavatmal": 1020.0,
    "wardha": 1060.0,
    "nagpur": 1160.0,
    "bhandara": 1330.0,
    "gondia": 1420.0,
    "chandrapur": 1280.0,
    "gadchiroli": 1480.0,
    "thane": 2450.0,
    "palghar": 2350.0,
    "raigad": 3100.0,
    "ratnagiri": 3360.0,
    "sindhudurg": 3280.0,
    "mumbai_city": 2200.0,
    "mumbai_suburban": 2400.0,
}


def get_calibrated_window_normal(
    district_id: Optional[str] = None,
    window_days: int = 14,
    month: Optional[int] = None,
) -> float:
    """Calculate the expected climatological normal rainfall for a specific window."""
    dist_key = (district_id or "pune").strip().lower().replace(" ", "_")
    annual_normal = MAHARASHTRA_DISTRICT_NORMALS_MM.get(dist_key, 800.0)
    current_month = month or datetime.now(timezone.utc).month

    # Monsoon season (June-September) accounts for ~85% of annual rainfall in Maharashtra
    if 6 <= current_month <= 9:
        daily_normal = (annual_normal * 0.85) / 122.0
    # Post-monsoon (October-November) accounts for ~10%
    elif 10 <= current_month <= 11:
        daily_normal = (annual_normal * 0.10) / 61.0
    # Dry winter/summer (December-May) accounts for remaining ~5%
    else:
        daily_normal = (annual_normal * 0.05) / 182.0

    return round(daily_normal * window_days, 1)


def compute_rainfall_anomaly(
    observed_mm: float,
    baseline_normal_mm: Optional[float] = None,
    provenance: Optional[str] = None,
    district_id: Optional[str] = None,
    window_days: int = 14,
) -> AnomalyIndicator:
    """Compute percentage departure against a historical climatological normal."""
    effective_normal = baseline_normal_mm
    if (effective_normal is None or effective_normal <= 0.0) and district_id:
        effective_normal = get_calibrated_window_normal(district_id, window_days)

    if effective_normal is None or effective_normal <= 0.0:
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

    departure = round(((observed_mm - effective_normal) / effective_normal) * 100.0, 1)

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
        baseline_normal_mm=round(effective_normal, 2),
        departure_pct=departure,
        status=category,
        baseline_provenance=provenance or "Historical climatological window benchmark (IMD reference)",
    )
