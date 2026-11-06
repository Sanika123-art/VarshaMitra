"""Pydantic schemas for rainfall observation data, forecast integration, and dataset pipeline."""

from datetime import date as dt_date, datetime as dt_datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class DataType(str, Enum):
    """Scientific classification of precipitation records to prevent conflation."""
    OBSERVATION = "observation"          # Ground truth from rain gauges or AWS (e.g. IMD stations)
    REANALYSIS = "reanalysis"            # Model-assimilated historical grids (e.g. ERA5-Land)
    MODEL_ANALYSIS = "model_analysis"    # Recent-past values served by a forecast service (model analysis); NOT a gauge observation
    FORECAST = "forecast"                # Future numerical weather prediction (e.g. Open-Meteo GFS/ECMWF)
    SYNTHETIC_TEST = "synthetic_test"    # Strictly labeled test fixtures and benchmarks


class QualityStatus(str, Enum):
    """Quality classification of a rainfall data point."""
    FRESH = "fresh"                      # Verified data within expected update window
    STALE = "stale"                      # Past expected update threshold (> 48 hours)
    PROVISIONAL = "provisional"          # Preliminary observation pending final QA/QC
    MISSING = "missing"                  # Value was unavailable or failed bounds check
    SYNTHETIC_STAGING = "synthetic_staging_baseline"  # Strictly marked baseline test fixture


class RainfallObservationItem(BaseModel):
    """Normalized daily rainfall observation point."""
    model_config = ConfigDict(extra="forbid")

    date: dt_date = Field(..., description="Observation calendar date (YYYY-MM-DD)")
    variable: str = Field(default="precipitation", description="Observed parameter")
    value_mm: Optional[float] = Field(
        None,
        description="Daily rainfall accumulation in millimeters (mm), or null if missing",
        ge=0.0,
        le=1500.0,
        examples=[14.2]
    )
    unit: str = Field(default="mm", description="Measurement unit (always millimeters)")
    quality: QualityStatus = Field(
        default=QualityStatus.FRESH,
        description="Data quality indicator"
    )
    data_type: DataType = Field(
        default=DataType.REANALYSIS,
        description="Data type classification (observation, reanalysis, forecast, synthetic_test)"
    )
    notes: Optional[str] = Field(None, description="Observation or sensor anomalies, if any")


class ProviderMetadata(BaseModel):
    """Data source provenance, licensing, and attribution."""
    model_config = ConfigDict(extra="forbid")

    provider_id: str = Field(..., description="Unique provider key (e.g. 'open-meteo', 'imd', 'copernicus')", examples=["open-meteo"])
    provider_name: str = Field(..., description="Human-readable provider name", examples=["Open-Meteo Weather API"])
    dataset_name: str = Field(..., description="Specific product or model name", examples=["Copernicus ERA5-Land & WMO Station Feeds"])
    attribution: str = Field(..., description="Required scientific/institutional citation")
    license: str = Field(..., description="Dataset usage license terms")
    spatial_resolution: str = Field(..., description="Spatial grid resolution", examples=["0.1° (~11 km)"])
    temporal_resolution: str = Field(default="daily", description="Aggregation timestep")
    timezone: str = Field(default="Asia/Kolkata", description="Timezone for day boundary definitions")


class RainfallObservationSeries(BaseModel):
    """Time-series of daily rainfall observations or historical reanalysis for an administrative block."""
    model_config = ConfigDict(extra="forbid")

    block_id: str = Field(..., description="Block identifier", examples=["baramati"])
    block_name: str = Field(..., description="Block English name", examples=["Baramati"])
    district_id: str = Field(..., description="District identifier", examples=["pune"])
    district_name: str = Field(..., description="District English name", examples=["Pune"])
    latitude: float = Field(..., description="Query latitude")
    longitude: float = Field(..., description="Query longitude")
    start_date: dt_date = Field(..., description="First date in observation series")
    end_date: dt_date = Field(..., description="Last date in observation series")
    observations: List[RainfallObservationItem] = Field(..., description="Chronological observation points")
    count: int = Field(..., description="Total observation points returned")
    total_rainfall_mm: float = Field(..., description="Cumulative rainfall sum in millimeters for period")
    missing_days_count: int = Field(default=0, description="Number of missing or null days in period")
    data_type: DataType = Field(default=DataType.REANALYSIS, description="Classification of series")
    retrieved_at: dt_datetime = Field(..., description="UTC timestamp when data was retrieved from provider")
    provider: ProviderMetadata = Field(..., description="Data provenance and attribution metadata")


class ForecastItem(BaseModel):
    """Future daily rainfall forecast prediction."""
    model_config = ConfigDict(extra="forbid")

    date: dt_date = Field(..., description="Forecast target calendar date (YYYY-MM-DD)")
    precipitation_sum_mm: Optional[float] = Field(
        None,
        description="Predicted 24-hour rainfall accumulation in mm, or null if beyond provider horizon",
        ge=0.0,
        le=1500.0,
    )
    precipitation_probability_pct: Optional[float] = Field(
        None,
        description="Probability of precipitation (0-100%) from ensemble, or null if uncalibrated",
        ge=0.0,
        le=100.0,
    )
    unit: str = Field(default="mm", description="Measurement unit (always millimeters)")
    horizon_day: int = Field(..., description="Forecast lead time in days (1 = tomorrow, 2 = day 2, ...)")
    data_type: DataType = Field(default=DataType.FORECAST, description="Always labeled forecast")
    notes: Optional[str] = Field(None, description="Atmospheric model run or horizon limitation note")


class ForecastSeries(BaseModel):
    """Daily forecast outlook for up to 14 days lead time."""
    model_config = ConfigDict(extra="forbid")

    block_id: str = Field(..., description="Block identifier", examples=["baramati"])
    block_name: str = Field(..., description="Block English name", examples=["Baramati"])
    district_id: str = Field(..., description="District identifier", examples=["pune"])
    district_name: str = Field(..., description="District English name", examples=["Pune"])
    latitude: float = Field(..., description="Centroid latitude")
    longitude: float = Field(..., description="Centroid longitude")
    forecast_generated_at: dt_datetime = Field(..., description="UTC timestamp of forecast model cycle")
    forecast_days: int = Field(..., description="Number of future days requested (1 to 14)")
    available_days: int = Field(..., description="Number of future days with valid prediction from provider")
    forecast: List[ForecastItem] = Field(..., description="Chronological future forecast days")
    provider: ProviderMetadata = Field(..., description="Forecast provider attribution")
    data_type: DataType = Field(default=DataType.FORECAST, description="Strictly marked as forecast")
    disclaimer: str = Field(
        default=(
            "Weather forecasts represent atmospheric numerical model predictions. "
            "They are inherently probabilistic and do not constitute an authoritative emergency warning."
        ),
        description="Non-negotiable forecast advisory notice"
    )


class ProviderStatusResponse(BaseModel):
    """Operational and credential status of a rainfall provider integration."""
    model_config = ConfigDict(extra="forbid")

    provider_id: str = Field(..., description="Provider unique identifier")
    provider_name: str = Field(..., description="Provider display name")
    is_configured: bool = Field(..., description="Whether required credentials and URLs are configured in environment")
    is_available: bool = Field(..., description="Whether provider is operational or currently unreachable")
    status_code: str = Field(..., description="Status summary code (operational | configuration_required | degraded | unavailable)")
    status_message: str = Field(..., description="Detailed message regarding operational readiness")
    required_credentials: List[str] = Field(
        default_factory=list,
        description="Environment variable names required for live operation (variable names only, never secrets)"
    )
    documentation_url: str = Field(..., description="URL to official provider documentation")
    attribution: str = Field(..., description="Attribution text")
    integration_status: str = Field(
        default="implemented",
        description="implemented | implemented_unverified | not_implemented | reference_only",
    )


class HistoricalRainfallRecord(BaseModel):
    """Canonical persistent storage record for historical climate dataset."""
    model_config = ConfigDict(extra="forbid")

    location_id: str = Field(..., description="Administrative block ID")
    district_id: str = Field(..., description="District ID")
    latitude: float = Field(..., description="Centroid latitude")
    longitude: float = Field(..., description="Centroid longitude")
    date: dt_date = Field(..., description="Calendar date")
    precipitation_mm: Optional[float] = Field(None, description="Precipitation in mm, or None if missing")
    data_type: DataType = Field(..., description="observation | reanalysis | forecast | synthetic_test")
    source_provider: str = Field(..., description="Provider identifier (open-meteo-archive, imd, era5-land)")
    dataset_product: str = Field(..., description="Product name (e.g. ERA5-Land Reanalysis, IMD Gridded 0.25)")
    quality_status: QualityStatus = Field(..., description="Quality flag")
    retrieved_at: dt_datetime = Field(..., description="Retrieval timestamp UTC")


class DatasetIngestionSummary(BaseModel):
    """Audit report for an incremental historical data ingestion run."""
    model_config = ConfigDict(extra="forbid")

    location_id: str = Field(..., description="Target block ID")
    start_date: dt_date = Field(..., description="Ingested window start date")
    end_date: dt_date = Field(..., description="Ingested window end date")
    total_days: int = Field(..., description="Total days in requested range")
    ingested_count: int = Field(..., description="Newly inserted or updated records")
    skipped_count: int = Field(..., description="Duplicate records skipped")
    missing_days_count: int = Field(..., description="Days where provider had no data")
    data_type: DataType = Field(..., description="Type of data ingested")
    source_provider: str = Field(..., description="Provider source key")
    storage_path: str = Field(..., description="Target persistent file or database")
    ingestion_time: dt_datetime = Field(..., description="UTC timestamp of ingestion")


class SourceInventoryItem(BaseModel):
    """Detailed evaluation and classification entry for candidate climate data sources."""
    model_config = ConfigDict(extra="forbid")

    source_id: str = Field(..., description="Identifier key")
    name: str = Field(..., description="Official source title")
    organization: str = Field(..., description="Operating agency / institution")
    category: str = Field(..., description="observation | reanalysis | forecast | auxiliary_soil | boundaries")
    endpoint_or_catalog: str = Field(..., description="Primary API endpoint or download catalog URL")
    documentation_url: str = Field(..., description="Link to official developer/data docs")
    data_type: DataType = Field(..., description="Primary data classification")
    temporal_coverage: str = Field(..., description="Historical availability range and update latency")
    spatial_coverage: str = Field(..., description="Geographic boundary and resolution")
    licensing: str = Field(..., description="License and citation requirements")
    authentication: str = Field(..., description="Auth mechanism (free open access, API key, registration)")
    current_reachability: str = Field(..., description="operational | configuration_required | reference_catalog")
    integration_role: str = Field(..., description="How this dataset is used in VarshaMitra")
    integration_status: str = Field(
        default="reference_only",
        description="implemented | implemented_unverified | not_implemented | reference_only",
    )
