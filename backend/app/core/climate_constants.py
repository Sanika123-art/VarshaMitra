"""Documented, configurable meteorological and agronomic thresholds.

References:
- India Meteorological Department (IMD) Rainfall Terminology & Classification Standards
- FAO 56 Irrigation and Drainage Paper (Crop Evapotranspiration & Moisture Stress)
- Maharashtra State Department of Agriculture Kharif Crop Contingency Norms
"""

# -------------------------------------------------------------------------
# Daily Rainfall Classification Thresholds (in millimeters / 24 hours)
# -------------------------------------------------------------------------

# IMD Standard: Days with < 2.5 mm are non-rainy / dry days
IMD_DRY_DAY_THRESHOLD_MM: float = 2.5

# Agronomic moisture replenishment threshold: Days with < 3.0 mm provide negligible effective root-zone moisture
AGRONOMIC_DRY_DAY_THRESHOLD_MM: float = 3.0

# IMD Moderate rain range: 15.6 mm to 64.4 mm
MODERATE_RAIN_THRESHOLD_MM: float = 15.6

# IMD Heavy rain classification: single-day rainfall >= 64.5 mm (or rounded 65.0 mm)
HEAVY_RAIN_THRESHOLD_MM: float = 64.5

# IMD Very Heavy rain classification: single-day rainfall >= 115.6 mm
VERY_HEAVY_RAIN_THRESHOLD_MM: float = 115.6

# IMD Extremely Heavy rain: single-day rainfall >= 204.5 mm
EXTREMELY_HEAVY_RAIN_THRESHOLD_MM: float = 204.5


# -------------------------------------------------------------------------
# Dry Spell Thresholds (Consecutive Dry Days, daily rain < 2.5 mm)
# -------------------------------------------------------------------------

# Mild dry spell: 5 to 6 consecutive dry days (incipient stress for shallow-rooted crops)
MILD_DRY_SPELL_DAYS: int = 5

# Significant dry spell: 7 to 13 consecutive dry days (soil moisture depletion trigger)
SIGNIFICANT_DRY_SPELL_DAYS: int = 7

# Critical dry spell: >= 14 consecutive dry days (severe wilting risk, requires emergency irrigation)
CRITICAL_DRY_SPELL_DAYS: int = 14


# Southwest-monsoon months (June-September). The dry-spell and rainfall-deficit rules were written for
# in-season monitoring: a long rainless spell outside these months is the normal dry season in Maharashtra
# and is NOT treated as crop stress by the risk engine. Heavy-rain rules apply in every month.
MONSOON_SEASON_MONTHS = (6, 7, 8, 9)


# -------------------------------------------------------------------------
# Data Quality & Coverage Thresholds
# -------------------------------------------------------------------------

# Minimum ratio of valid observation points required in a window (e.g. 75%)
# If valid points / total expected points < 0.75, status must be INSUFFICIENT_DATA
MINIMUM_DATA_COVERAGE_RATIO: float = 0.75

# Freshness limit: Observations older than 48 hours are flagged as STALE
MAX_OBSERVATION_AGE_HOURS: int = 48


# -------------------------------------------------------------------------
# Monsoon Calendar Windows (Maharashtra Agro-Climatic Zones)
# -------------------------------------------------------------------------

# Onset surveillance window: June 1 (month 6, day 1) to July 15 (month 7, day 15)
ONSET_WINDOW_START_MONTH: int = 6
ONSET_WINDOW_START_DAY: int = 1
ONSET_WINDOW_END_MONTH: int = 7
ONSET_WINDOW_END_DAY: int = 15

# Sub-seasonal operational onset criterion:
# Two consecutive days each with >= 2.5 mm, cumulative 2-day total >= 25.0 mm
ONSET_DAILY_MIN_MM: float = 2.5
ONSET_CUMULATIVE_2DAY_MM: float = 25.0


# -------------------------------------------------------------------------
# Engine Metadata
# -------------------------------------------------------------------------
RISK_ENGINE_METHOD_VERSION: str = "heuristic-agroclimatic-v1.1.0"
ML_BOUNDARY_VERSION: str = "future-ml-spec-v1.0.0"
