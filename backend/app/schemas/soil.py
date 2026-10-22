"""Pydantic schemas for soil property intelligence and soil test submissions."""

from datetime import date as dt_date, datetime as dt_datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class SoilDataSource(str, Enum):
    """Provenance classification for soil data."""
    REGIONAL_ESTIMATE = "regional_estimate"          # ISRIC SoilGrids 250m & ICAR-NBSS&LUP regional survey
    FARMER_LAB_TEST = "farmer_lab_test"              # Individual field Soil Health Card / certified laboratory test
    ICAR_SURVEY_BENCHMARK = "icar_survey_benchmark"  # ICAR benchmark soil series profile


class SoilTextureClass(str, Enum):
    """USDA / ICAR soil textural classification."""
    CLAY = "clay"
    CLAY_LOAM = "clay_loam"
    SANDY_CLAY_LOAM = "sandy_clay_loam"
    LOAM = "loam"
    SANDY_LOAM = "sandy_loam"
    SILT_LOAM = "silt_loam"
    BLACK_COTTON_VERTISOL = "black_cotton_vertisol"
    COARSE_SHALLOW = "coarse_shallow"


class NutrientRating(str, Enum):
    """Agronomic nutrient availability tier (Maharashtra Dept of Agriculture standards)."""
    VERY_LOW = "very_low"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VERY_HIGH = "very_high"


class RegionalSoilSummaryResponse(BaseModel):
    """Model-estimated or regional baseline soil properties for an administrative block."""
    model_config = ConfigDict(extra="forbid")

    location_id: str = Field(..., description="Administrative block ID")
    location_name: str = Field(..., description="Block name")
    district_name: str = Field(..., description="District name")
    source: SoilDataSource = Field(default=SoilDataSource.REGIONAL_ESTIMATE, description="Source provenance")
    dataset_name: str = Field(..., description="Dataset name and citation (e.g. SoilGrids 250m / ICAR-NBSS&LUP)")
    spatial_resolution: str = Field(..., description="Spatial grid scale (e.g. 250m / regional series)")
    depth_layer: str = Field(default="0-30cm", description="Target topsoil depth layer")
    dominant_texture: SoilTextureClass = Field(..., description="Dominant soil texture class")
    clay_fraction_pct: float = Field(..., description="Clay percentage (0-100%)", ge=0.0, le=100.0)
    sand_fraction_pct: float = Field(..., description="Sand percentage (0-100%)", ge=0.0, le=100.0)
    silt_fraction_pct: float = Field(..., description="Silt percentage (0-100%)", ge=0.0, le=100.0)
    topsoil_ph: float = Field(..., description="pH in H2O", ge=3.0, le=11.0)
    organic_carbon_pct: float = Field(..., description="Organic carbon percentage (Walkley-Black)", ge=0.0, le=10.0)
    cation_exchange_capacity: float = Field(..., description="CEC in cmol(+)/kg", ge=0.0, le=150.0)
    available_water_capacity_mm_m: float = Field(
        ...,
        description="Available water capacity (AWC) in mm of water per meter of soil depth",
        ge=0.0,
        le=300.0,
    )
    drainage_class: str = Field(..., description="Soil drainage (well_drained, moderately_drained, imperfectly_drained)")
    uncertainty_note: str = Field(..., description="Confidence and spatial downscaling uncertainty note")
    limitations: str = Field(
        default=(
            "Estimated regional properties represent geographic centroid approximations. "
            "They do not replace a laboratory chemical analysis of an individual farmer's parcel."
        ),
        description="Non-negotiable soil estimate limitation notice"
    )
    retrieved_at: dt_datetime = Field(..., description="UTC retrieval timestamp")


class FieldSoilTestSubmission(BaseModel):
    """Field-specific soil test submission from farmer or Soil Health Card."""
    model_config = ConfigDict(extra="forbid")

    location_id: str = Field(..., description="Target block ID", examples=["baramati"])
    field_identifier: Optional[str] = Field(None, description="Optional survey number or farm plot identifier", examples=["Plot-A4"])
    sampling_date: dt_date = Field(..., description="Date soil sample was collected (YYYY-MM-DD)", examples=["2026-05-15"])
    laboratory_name: Optional[str] = Field(None, description="Testing laboratory or KVK centre", examples=["KVK Baramati Soil Testing Lab"])
    test_method: Optional[str] = Field(default="Soil Health Card Standard (DAC&FW)", description="Standardized laboratory testing protocol")

    # Chemical Properties
    ph: float = Field(..., description="Soil reaction (pH)", ge=3.5, le=10.5, examples=[7.6])
    electrical_conductivity_ds_m: Optional[float] = Field(None, description="Electrical Conductivity (EC) in dS/m (1:2 soil:water)", ge=0.0, le=20.0, examples=[0.45])
    organic_carbon_pct: Optional[float] = Field(None, description="Organic Carbon percentage (%)", ge=0.0, le=10.0, examples=[0.55])

    # Primary Macronutrients (Available in kg/ha)
    available_nitrogen_kg_ha: Optional[float] = Field(None, description="Available Nitrogen (N) in kg/ha", ge=0.0, le=1500.0, examples=[240.0])
    available_phosphorus_kg_ha: Optional[float] = Field(None, description="Available Phosphorus (P2O5) in kg/ha", ge=0.0, le=300.0, examples=[18.5])
    available_potassium_kg_ha: Optional[float] = Field(None, description="Available Potassium (K2O) in kg/ha", ge=0.0, le=1500.0, examples=[320.0])

    # Secondary & Micronutrients
    available_sulphur_ppm: Optional[float] = Field(None, description="Available Sulphur (S) in ppm", ge=0.0, le=200.0, examples=[12.0])
    zinc_ppm: Optional[float] = Field(None, description="DTPA extractable Zinc (Zn) in ppm", ge=0.0, le=50.0, examples=[0.8])
    iron_ppm: Optional[float] = Field(None, description="DTPA extractable Iron (Fe) in ppm", ge=0.0, le=100.0, examples=[5.5])
    copper_ppm: Optional[float] = Field(None, description="DTPA extractable Copper (Cu) in ppm", ge=0.0, le=50.0, examples=[1.2])
    manganese_ppm: Optional[float] = Field(None, description="DTPA extractable Manganese (Mn) in ppm", ge=0.0, le=100.0, examples=[8.0])
    boron_ppm: Optional[float] = Field(None, description="Hot water extractable Boron (B) in ppm", ge=0.0, le=20.0, examples=[0.4])

    farmer_notes: Optional[str] = Field(None, description="Optional farmer observations on soil condition")


class FieldSoilTestResponse(BaseModel):
    """Validated field soil test report with diagnostic nutrient ratings."""
    model_config = ConfigDict(extra="forbid")

    profile_id: str = Field(..., description="Unique profile record UUID")
    location_id: str = Field(..., description="Associated block ID")
    field_identifier: Optional[str] = Field(None, description="Plot identifier")
    sampling_date: dt_date = Field(..., description="Sample collection date")
    laboratory_name: Optional[str] = Field(None, description="Testing facility")
    ph: float = Field(..., description="Soil pH")
    ph_rating: str = Field(..., description="pH classification (acidic, neutral, moderately_alkaline, highly_alkaline)")
    electrical_conductivity_ds_m: Optional[float] = Field(None, description="EC dS/m")
    salinity_status: str = Field(..., description="Salinity rating (normal, critical_saline, hazardous)")
    organic_carbon_pct: Optional[float] = Field(None, description="OC percentage")
    organic_carbon_rating: Optional[NutrientRating] = Field(None, description="OC rating tier")
    nitrogen_rating: Optional[NutrientRating] = Field(None, description="Available N rating tier")
    phosphorus_rating: Optional[NutrientRating] = Field(None, description="Available P rating tier")
    potassium_rating: Optional[NutrientRating] = Field(None, description="Available K rating tier")
    nutrient_ratings: Dict[str, str] = Field(default_factory=dict, description="Dictionary of all evaluated nutrients and their diagnostic tiers")
    source: SoilDataSource = Field(default=SoilDataSource.FARMER_LAB_TEST, description="Field laboratory origin")
    registered_at: dt_datetime = Field(..., description="UTC registration timestamp")
    disclaimer: str = Field(
        default=(
            "Individual field test reports represent the chemical state of sampled soil. "
            "Specific fertilizer doses must follow state university Package of Practices based on the target crop."
        ),
        description="Agronomic advisory disclaimer"
    )
