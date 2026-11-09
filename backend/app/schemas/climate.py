"""Pydantic schemas for climate indicators, explainable risk assessment, and ML boundary contracts."""

from datetime import date as dt_date, datetime as dt_datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.rainfall import DataType, QualityStatus


class DataProvenance(BaseModel):
    """Where the rainfall behind a calculation came from, and what kind of data it is."""
    model_config = ConfigDict(extra="forbid")

    data_type: DataType = Field(..., description="observation | reanalysis | model_analysis | forecast | synthetic_test")
    provider_id: str = Field(..., description="Provider key, e.g. 'open-meteo'")
    provider_name: str = Field(..., description="Provider display name")
    dataset_name: str = Field(..., description="Specific product")
    attribution: str = Field(..., description="Required attribution text")
    spatial_resolution: str = Field(..., description="Grid resolution of the source")
    retrieved_at: dt_datetime = Field(..., description="UTC time the source data was retrieved")
    window_start: dt_date = Field(..., description="First day of the data used")
    window_end: dt_date = Field(..., description="Last day of the data used")
    is_station_observation: bool = Field(..., description="True only for gauge/AWS observations")
    note: str = Field(..., description="Plain-language caveat about this data type")


class RiskLevel(str, Enum):
    """Calibrated four-tier risk classification with insufficient_data fallback."""
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    CRITICAL = "critical"
    INSUFFICIENT_DATA = "insufficient_data"


class ConfidenceLevel(str, Enum):
    """Statistically defined confidence based on data completeness and sensor coverage."""
    HIGH = "high"        # >= 90% valid data in window, verified provider feed
    MEDIUM = "medium"    # 75% - 89% valid data in window
    LOW = "low"          # 60% - 74% valid data in window
    NONE = "none"        # < 60% valid data (insufficient evidence)


class AccumulationIndicator(BaseModel):
    """Total rainfall accumulation over a defined window."""
    model_config = ConfigDict(extra="forbid")

    total_mm: float = Field(..., description="Cumulative rainfall sum in millimeters", ge=0.0)
    valid_days_count: int = Field(..., description="Number of days with valid measurements")
    missing_days_count: int = Field(..., description="Number of days missing from window")
    daily_average_mm: float = Field(..., description="Average rainfall per valid day")


class DrySpellIndicator(BaseModel):
    """Analysis of rainless periods and consecutive dry days."""
    model_config = ConfigDict(extra="forbid")

    threshold_mm: float = Field(..., description="Daily rainfall threshold below which a day is dry (IMD: 2.5 mm)")
    dry_days_count: int = Field(..., description="Total non-rainy days in window")
    max_consecutive_dry_days: int = Field(..., description="Longest unbroken sequence of dry days")
    current_consecutive_dry_days: int = Field(..., description="Length of ongoing dry spell terminating at window end")
    severity: str = Field(..., description="Severity classification (none | mild | significant | critical)")


class HeavyRainIndicator(BaseModel):
    """Detection of single-day deluge and extreme precipitation events."""
    model_config = ConfigDict(extra="forbid")

    threshold_mm: float = Field(..., description="Heavy rainfall classification threshold (IMD: >= 64.5 mm)")
    heavy_rain_days_count: int = Field(..., description="Number of days exceeding heavy rain threshold")
    max_single_day_mm: float = Field(..., description="Maximum single-day rainfall recorded in window")
    event_dates: List[dt_date] = Field(default_factory=list, description="Calendar dates where heavy rain occurred")
    has_heavy_rain_event: bool = Field(..., description="True if at least one heavy rain event was detected")


class AnomalyIndicator(BaseModel):
    """Percentage departure compared against historical climatological normal."""
    model_config = ConfigDict(extra="forbid")

    observed_mm: float = Field(..., description="Actual observed precipitation in window")
    baseline_normal_mm: Optional[float] = Field(None, description="Historical normal benchmark for window, or null if uncalibrated")
    departure_pct: Optional[float] = Field(None, description="Percentage departure: (Observed - Normal) / Normal * 100")
    status: str = Field(..., description="Departure category (large_excess | excess | normal | deficient | large_deficient | insufficient_baseline_data)")
    baseline_provenance: str = Field(..., description="Source of climatological baseline or limitation notice")


class MonsoonOnsetIndicator(BaseModel):
    """Evaluation of operational monsoon onset criteria."""
    model_config = ConfigDict(extra="forbid")

    status: str = Field(..., description="Onset condition: confirmed | pending | outside_onset_window")
    onset_date: Optional[dt_date] = Field(None, description="Date when operational criteria were satisfied, if any")
    criteria_summary: str = Field(..., description="Description of rule logic and window bounds")


class DataQualitySummary(BaseModel):
    """Data completeness, freshness, and adequacy audit for calculation."""
    model_config = ConfigDict(extra="forbid")

    coverage_ratio: float = Field(..., description="Ratio of valid days to total expected days in window", ge=0.0, le=1.0)
    is_sufficient: bool = Field(..., description="True if coverage ratio meets minimum threshold (>= 0.75)")
    freshness_status: QualityStatus = Field(..., description="Freshness classification of latest data point")
    missing_days_count: int = Field(..., description="Count of unavailable calendar days in window")


class ClimateIndicatorsResponse(BaseModel):
    """Full deterministic climate indicators suite for an administrative block."""
    model_config = ConfigDict(extra="forbid")

    block_id: str = Field(..., description="Unique block identifier")
    block_name: str = Field(..., description="Block English name")
    district_name: str = Field(..., description="District English name")
    window_days: int = Field(..., description="Analysis window length in days")
    start_date: dt_date = Field(..., description="Window start date")
    end_date: dt_date = Field(..., description="Window end date")
    accumulation: AccumulationIndicator = Field(..., description="Rainfall accumulation metrics")
    dry_spell: DrySpellIndicator = Field(..., description="Dry spell duration and continuity metrics")
    heavy_rain: HeavyRainIndicator = Field(..., description="Extreme rainfall event flags")
    anomaly: AnomalyIndicator = Field(..., description="Baseline departure metrics")
    monsoon_onset: MonsoonOnsetIndicator = Field(..., description="Monsoon onset surveillance")
    data_quality: DataQualitySummary = Field(..., description="Data completeness and reliability summary")
    method_version: str = Field(..., description="Deterministic indicator calculation engine version")
    retrieved_at: dt_datetime = Field(..., description="UTC timestamp of computation")
    data_provenance: Optional[DataProvenance] = Field(None, description="Source and data-type of the rainfall used")


class RiskDriver(BaseModel):
    """Specific meteorological driver contributing to the calculated risk level."""
    model_config = ConfigDict(extra="forbid")

    code: str = Field(..., description="Machine-readable driver code (e.g. 'drySpellAhead', 'heavySoilSaturation')")
    name: str = Field(..., description="Human-readable driver title")
    evidence: str = Field(..., description="Exact numerical observation or condition justifying this driver")
    contribution: str = Field(..., description="Contribution weight: primary | contributing")


class RiskAssessmentResponse(BaseModel):
    """Explainable agro-climatic risk assessment."""
    model_config = ConfigDict(extra="forbid")

    block_id: str = Field(..., description="Unique block identifier")
    block_name: str = Field(..., description="Block English name")
    district_name: str = Field(..., description="District English name")
    assessment_time: dt_datetime = Field(..., description="UTC timestamp of risk assessment")
    window_days: int = Field(..., description="Analysis window length in days")
    start_date: dt_date = Field(..., description="Analysis period start date")
    end_date: dt_date = Field(..., description="Analysis period end date")
    overall_risk: RiskLevel = Field(..., description="Synthesized risk level: low | moderate | high | critical | insufficient_data")
    confidence: ConfidenceLevel = Field(..., description="Confidence tier derived from data coverage ratio")
    confidence_rationale: str = Field(..., description="Clear explanation of how confidence was derived")
    risk_drivers: List[RiskDriver] = Field(..., description="Specific quantified factors driving the assessment")
    supporting_measurements: Dict[str, Any] = Field(..., description="Key numerical measurements used as rule evidence")
    methodology: str = Field(default="Heuristic Agro-Climatic Synthesis", description="Methodology classification")
    method_version: str = Field(..., description="Algorithm version identifier")
    provisional_notice: str = Field(..., description="Explicit notice on heuristic nature and requirement of expert review")
    limitations: str = Field(..., description="Transparent data limitations statement")
    data_provenance: Optional[DataProvenance] = Field(None, description="Source and data-type of the rainfall used")
    season_note: Optional[str] = Field(
        None,
        description="Set when the window lies outside the June-September monsoon; dry-spell and deficit rules are not applied then",
    )
    in_monsoon_season: bool = Field(
        True,
        description="True when the window ends in June-September. Dry-spell/deficit rules only escalate risk in-season.",
    )


class MLBoundarySpecification(BaseModel):
    """Formal specification of the Machine Learning boundary, data contract, and evaluation plan."""
    model_config = ConfigDict(extra="forbid")

    service_state: str = Field(default="heuristic_baseline_operational", description="Current operational state")
    model_status: str = Field(..., description="Truthful declaration of ML status")
    feature_contract: Dict[str, str] = Field(..., description="Defined input features required for training")
    target_contract: Dict[str, str] = Field(..., description="Defined prediction targets and units")
    data_requirements: Dict[str, str] = Field(..., description="Curated historical data prerequisites")
    evaluation_protocol: Dict[str, str] = Field(..., description="Temporal split and baseline comparison metrics")
    no_fabricated_metrics_notice: str = Field(..., description="Confirmation that no placeholder accuracy metrics are published")


class RiskSummaryItem(BaseModel):
    """One block in the map overview. Fields are null when the block's data was unavailable."""
    model_config = ConfigDict(extra="forbid")

    block_id: str
    block_name: str
    block_name_mr: str
    district_id: str
    district_name: str
    district_name_mr: str = Field(default="", description="District name in Marathi")
    latitude: float
    longitude: float
    geometry_type: str = Field(default="Point", description="Map geometry; point until verified administrative polygons are available")
    coordinates_precision: str = Field(default="approximate_centroid", description="Precision of the mapped coordinate")
    status: str = Field(..., description="ok | unavailable")
    error: Optional[str] = Field(None, description="Safe, user-presentable reason when status is 'unavailable'")
    overall_risk: Optional[RiskLevel] = None
    confidence: Optional[ConfidenceLevel] = None
    dry_spell_severity: Optional[str] = Field(None, description="none | mild | significant | critical (indicator engine)")
    current_dry_days: Optional[int] = None
    heavy_rain_event: Optional[bool] = None
    max_single_day_mm: Optional[float] = None
    accumulation_mm: Optional[float] = None
    monsoon_onset_status: Optional[str] = None
    in_monsoon_season: Optional[bool] = Field(None, description="True when the window ends in June-September")
    coverage_ratio: Optional[float] = None
    freshness_status: Optional[QualityStatus] = Field(None, description="Freshness classification of the latest climate data")
    missing_days_count: Optional[int] = None
    confidence_rationale: Optional[str] = None
    assessment_time: Optional[dt_datetime] = None
    data_provenance: Optional[DataProvenance] = None
    window_start: Optional[dt_date] = None
    window_end: Optional[dt_date] = None


class RiskSummaryResponse(BaseModel):
    """Backend-derived risk overview for every curated block (drives the map)."""
    model_config = ConfigDict(extra="forbid")

    generated_at: dt_datetime = Field(..., description="UTC time this summary was computed")
    cached: bool = Field(..., description="True when served from the short-lived in-memory cache")
    cache_age_seconds: int = Field(..., description="Seconds since computation")
    window_days: int
    provider: str
    count: int = Field(..., description="Blocks in the curated dataset")
    available_count: int = Field(..., description="Blocks whose risk could be computed")
    items: List[RiskSummaryItem]
    coordinates_note: str = Field(..., description="Marker geometry caveat")
    method_version: str
    data_provenance: Optional[DataProvenance] = None
    provisional_notice: str
    geometry_type: str = Field(default="Point", description="Current map geometry type")
    boundaries_available: bool = Field(default=False, description="True only when verified administrative boundary data is loaded")
    boundary_source: Optional[str] = Field(None, description="Source and license for verified boundary geometry, when available")
    layers_available: Dict[str, bool] = Field(
        default_factory=dict,
        description="Whether each layer has regional data in this response; unavailable layers must not be inferred",
    )
