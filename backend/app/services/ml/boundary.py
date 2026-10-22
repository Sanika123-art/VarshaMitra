"""Machine Learning Boundary Specification.

Defines the formal boundary between heuristic baselines and future learned models.
Adheres strictly to the principle of NO FABRICATED METRICS.
"""

from app.core.climate_constants import ML_BOUNDARY_VERSION
from app.schemas.climate import MLBoundarySpecification


def get_ml_boundary_specification() -> MLBoundarySpecification:
    """Return the formal machine learning boundary contract and evaluation protocol."""
    return MLBoundarySpecification(
        service_state="heuristic_baseline_operational",
        model_status=(
            "No trained model deployed in production. Current operational engine uses deterministic "
            "agro-climatic rules (heuristic-agroclimatic-v1.0.0). Training is deferred until curated, "
            "quality-controlled historical datasets (1991–2024) are ingested and audited."
        ),
        feature_contract={
            "rolling_rainfall_7d_mm": "Continuous float: 7-day trailing cumulative precipitation",
            "rolling_rainfall_14d_mm": "Continuous float: 14-day trailing cumulative precipitation",
            "consecutive_dry_days_count": "Integer count: unbroken days with precipitation < 2.5 mm",
            "max_single_day_rain_7d_mm": "Continuous float: peak single-day rain in past 7 days",
            "historical_anomaly_departure_pct": "Continuous float: departure from 30-year IMD block normal",
            "day_of_year_sin": "Harmonic float: sine encoding of day of year for seasonality",
            "day_of_year_cos": "Harmonic float: cosine encoding of day of year for seasonality",
            "soil_type_code": "Categorical string: dominant ICAR soil series for the administrative block",
        },
        target_contract={
            "dry_spell_next_7d_flag": "Binary classification: 1 if >= 5 consecutive dry days occur in the subsequent 7 days, else 0",
            "heavy_rain_next_3d_flag": "Binary classification: 1 if >= 64.5 mm occurs on any single day in next 3 days, else 0",
            "crop_moisture_stress_tier": "Multi-class ordinal: None (0), Mild (1), Significant (2), Critical (3)",
        },
        data_requirements={
            "spatial_coverage": "36 administrative districts and 358 talukas of Maharashtra state",
            "temporal_span": "1991-01-01 to 2024-12-31 (minimum 30 years for climatological validity)",
            "observation_resolution": "Daily gridded / AWS station rainfall (IMD 0.25° gridded or validated MahaAgri AWS)",
            "quality_audit": "Outlier detection, duplicate stripping, spatial coherence validation, and sensor drift correction",
        },
        evaluation_protocol={
            "temporal_split": (
                "Strict temporal walk-forward split to prevent data leakage: "
                "Training: 1991–2018 (28 years); Validation: 2019–2021 (3 years); Holdout Test: 2022–2024 (3 years)."
            ),
            "baseline_benchmarks": (
                "New models must empirically beat two baselines: "
                "1) 30-year climatological normal frequency (zero-skill persistence baseline); "
                "2) Heuristic deterministic rule engine (heuristic-agroclimatic-v1.0.0)."
            ),
            "evaluation_metrics": "Brier Skill Score (BSS), Precision-Recall AUC (PR-AUC), and Expected Calibration Error (ECE).",
        },
        no_fabricated_metrics_notice=(
            "INTEGRITY NOTICE: No placeholder accuracy, F1-scores, or R² values are published. "
            "Real metrics will only be reported following reproducible evaluation on the frozen holdout test set."
        ),
    )
