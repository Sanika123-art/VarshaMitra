"""Pydantic schemas for crop requirements, suitability assessment, sowing readiness, and advisories."""

from datetime import date as dt_date, datetime as dt_datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.soil import SoilDataSource, SoilTextureClass


class CropSeason(str, Enum):
    """Agricultural cropping season in Maharashtra."""
    KHARIF = "kharif"          # Monsoon season (June - October)
    RABI = "rabi"              # Post-monsoon winter season (October - March)
    SUMMER = "summer"          # Zaid / Summer season (March - June)
    PERENNIAL = "perennial"    # Year-round crops (e.g. Sugarcane)


class WaterSourceType(str, Enum):
    """Farmer's water source and irrigation capability."""
    RAINFED = "rainfed"                          # Dependent solely on rainfall
    PROTECTIVE_IRRIGATION = "protective_irrigation"  # Farm pond, well, or tanker for 1-2 life-saving irrigations
    ASSURED_IRRIGATION = "assured_irrigation"    # Canal command or perennial borewell with drip/sprinkler


class SuitabilityStatus(str, Enum):
    """Categorical suitability tier based on agronomic requirements."""
    SUITABLE = "suitable"                        # Climate, soil, and water fully align with crop requirements
    CONDITIONALLY_SUITABLE = "conditionally_suitable"  # Feasible with specific agronomic interventions (e.g. protective irrigation, ridge & furrow)
    UNSUITABLE = "unsuitable"                    # Severe agro-climatic mismatch (e.g. waterlogging-intolerant crop in poorly drained clay)
    INSUFFICIENT_DATA = "insufficient_data"      # Key variables missing to make a responsible determination


class SowingReadinessStatus(str, Enum):
    """Real-time operational sowing readiness outcome."""
    FAVORABLE = "favorable"                      # Conditions support considering sowing (soil moisture & forward forecast align)
    WAIT_AND_REASSESS = "wait_and_reassess"      # Sowing window open but immediate weather hazard present (deluge or dry spell)
    UNFAVORABLE = "unfavorable"                  # Severe deficit, prolonged dry spell, or outside acceptable sowing calendar
    INSUFFICIENT_DATA = "insufficient_data"      # Rainfall history or forward forecast unavailable


class AdvisoryPriority(str, Enum):
    """Operational urgency level for agricultural actions."""
    CRITICAL = "critical"    # Immediate protective intervention required to avert crop loss
    WARNING = "warning"      # Emerging risk requiring proactive field measures within 48-72 hours
    ADVISORY = "advisory"    # Standard agronomic management according to crop growth stage
    INFO = "info"            # Educational or background contextual guidance


class SowingWindowDefinition(BaseModel):
    """Documented calendar sowing window for an agroclimatic zone."""
    model_config = ConfigDict(extra="forbid")

    optimal_start_month: int = Field(..., ge=1, le=12)
    optimal_start_day: int = Field(..., ge=1, le=31)
    optimal_end_month: int = Field(..., ge=1, le=12)
    optimal_end_day: int = Field(..., ge=1, le=31)
    delayed_cutoff_month: int = Field(..., ge=1, le=12)
    delayed_cutoff_day: int = Field(..., ge=1, le=31)
    rationale: str = Field(..., description="Agronomic rationale from university package of practices")


class GrowthStageItem(BaseModel):
    """Phenological growth stage of a crop."""
    model_config = ConfigDict(extra="forbid")

    stage_id: str = Field(..., description="Machine-readable stage code", examples=["sowing", "vegetative", "flowering"])
    name: str = Field(..., description="Stage name in English", examples=["Flowering & Pod Formation"])
    name_mr: str = Field(..., description="Stage name in Marathi", examples=["फुलधारणा व शेंगा भरणे"])
    start_day: int = Field(..., description="Approximate start day after sowing")
    end_day: int = Field(..., description="Approximate end day after sowing")
    water_requirement_tier: str = Field(..., description="Moisture demand: low | moderate | high | critical")
    is_critical_moisture_stage: bool = Field(..., description="True if moisture stress causes disproportionate yield loss")
    sensitivities: List[str] = Field(default_factory=list, description="Vulnerabilities (e.g. waterlogging, heat_stress, dry_spell)")


class CropRequirement(BaseModel):
    """Full agronomic and climate requirement specification for a crop."""
    model_config = ConfigDict(extra="forbid")

    crop_id: str = Field(..., description="Unique crop identifier", examples=["soybean", "cotton"])
    name: str = Field(..., description="English crop name", examples=["Soybean"])
    name_mr: str = Field(..., description="Marathi crop name", examples=["सोयाबीन"])
    scientific_name: str = Field(..., description="Botanical name", examples=["Glycine max"])
    season: CropSeason = Field(..., description="Applicable cropping season")
    crop_category: str = Field(..., description="oilseed | fibre | pulse | cereal | vegetable | commercial")
    duration_days_min: int = Field(..., description="Minimum crop duration in days")
    duration_days_max: int = Field(..., description="Maximum crop duration in days")
    agroclimatic_zones: List[str] = Field(..., description="Applicable Maharashtra agroclimatic zones")
    sowing_window: SowingWindowDefinition = Field(..., description="Documented regional sowing calendar")

    # Soil requirements
    suitable_textures: List[SoilTextureClass] = Field(..., description="Acceptable soil texture classes")
    min_soil_ph: float = Field(..., description="Minimum tolerated soil pH")
    max_soil_ph: float = Field(..., description="Maximum tolerated soil pH")
    min_soil_depth_cm: int = Field(..., description="Minimum effective root-zone depth in cm")
    drainage_preference: str = Field(..., description="well_drained | moderately_drained | tolerant_to_poor_drainage")

    # Moisture & Rainfall requirements
    min_seasonal_rainfall_mm: float = Field(..., description="Minimum total seasonal rainfall for rainfed cultivation")
    max_seasonal_rainfall_mm: float = Field(..., description="Upper rainfall tolerance threshold before excess waterlogging")
    sowing_soil_moisture_min_mm: float = Field(..., description="Minimum cumulative precipitation required before sowing (e.g. 75-100 mm)")

    # Phenology and varieties
    growth_stages: List[GrowthStageItem] = Field(..., description="Ordered phenological growth stages")
    recommended_varieties: List[str] = Field(default_factory=list, description="Locally recommended certified varieties")
    intercropping_options: List[str] = Field(default_factory=list, description="Recommended intercrop combinations")

    # Provenance
    source_citation: str = Field(..., description="Official publication title and agricultural university")
    publisher: str = Field(..., description="MPKV Rahuri / PDKV Akola / VNMKV Parbhani / ICAR")
    version: str = Field(..., description="Specification version")


class CropSuitabilityResult(BaseModel):
    """Evaluated suitability score and diagnostic factors for a single candidate crop."""
    model_config = ConfigDict(extra="forbid")

    crop_id: str = Field(..., description="Crop identifier")
    name: str = Field(..., description="Crop name English")
    name_mr: str = Field(..., description="Crop name Marathi")
    season: CropSeason = Field(..., description="Evaluated season")
    status: SuitabilityStatus = Field(..., description="suitable | conditionally_suitable | unsuitable | insufficient_data")
    suitability_score: Optional[int] = Field(None, ge=0, le=100, description="Heuristic compatibility score (0-100), or None if insufficient data")
    supporting_factors: List[str] = Field(..., description="Agronomic conditions supporting suitability")
    limiting_factors: List[str] = Field(..., description="Constraints or risks lowering suitability")
    required_interventions: List[str] = Field(default_factory=list, description="Actionable interventions to mitigate limiting factors")
    missing_inputs: List[str] = Field(default_factory=list, description="Missing optional inputs that could improve confidence")
    citations: List[str] = Field(..., description="University / ICAR research publications supporting this evaluation")


class SuitabilityAssessmentResponse(BaseModel):
    """Full location-specific crop suitability report."""
    model_config = ConfigDict(extra="forbid")

    location_id: str = Field(..., description="Block ID")
    location_name: str = Field(..., description="Block name")
    district_name: str = Field(..., description="District name")
    agroclimatic_zone: str = Field(..., description="Maharashtra Agroclimatic Zone")
    season: CropSeason = Field(..., description="Target cropping season")
    evaluation_date: dt_date = Field(..., description="Date of assessment")
    water_source: WaterSourceType = Field(..., description="Water availability tier used in evaluation")
    soil_source_used: SoilDataSource = Field(..., description="Indicates whether regional estimates or field tests were used")
    soil_summary: Dict[str, Any] = Field(..., description="Key soil attributes applied during assessment")
    candidate_crops: List[CropSuitabilityResult] = Field(..., description="Evaluated candidate crops")
    methodology: str = Field(default="Heuristic Agro-Climatic Suitability Matrix (MPKV/ICAR)", description="Rule engine model")
    version: str = Field(..., description="Ruleset version")
    limitations: str = Field(
        default=(
            "Suitability scores reflect environmental and soil compatibility. "
            "They do not constitute a financial return forecast or commercial guarantee. "
            "Field verification with local Taluka Krishi Adhikari (TKA) is recommended."
        ),
        description="Non-negotiable disclaimer"
    )


class SowingAssessmentResponse(BaseModel):
    """Real-time sowing readiness assessment."""
    model_config = ConfigDict(extra="forbid")

    location_id: str = Field(..., description="Block ID")
    location_name: str = Field(..., description="Block name")
    district_name: str = Field(..., description="District name")
    crop_id: str = Field(..., description="Evaluated crop ID")
    crop_name: str = Field(..., description="Crop name English")
    crop_name_mr: str = Field(..., description="Crop name Marathi")
    season: CropSeason = Field(..., description="Cropping season")
    assessment_date: dt_date = Field(..., description="Evaluation target date")
    status: SowingReadinessStatus = Field(..., description="favorable | wait_and_reassess | unfavorable | insufficient_data")
    window_status: str = Field(..., description="optimal | early | delayed | outside_season")
    optimal_window_description: str = Field(..., description="Documented optimal calendar window")
    sowing_readiness_summary_en: str = Field(..., description="Plain-language recommendation summary in English")
    sowing_readiness_summary_mr: str = Field(..., description="Plain-language recommendation summary in Marathi")
    supporting_factors: List[str] = Field(..., description="Conditions supporting sowing")
    risk_factors: List[str] = Field(..., description="Identified hazards or warnings")
    antecedent_rainfall_7d_mm: Optional[float] = Field(None, description="Trailing 7-day cumulative precipitation (null if not computed)")
    antecedent_rainfall_14d_mm: float = Field(..., description="Trailing 14-day cumulative precipitation")
    forecast_14d_hazard_flag: bool = Field(..., description="True if forward 14-day forecast contains dry spell or extreme deluge")
    forecast_summary: str = Field(..., description="Forward forecast evidence string")
    next_reassessment_date: dt_date = Field(..., description="Suggested date for farmer to re-evaluate conditions")
    rule_version: str = Field(..., description="Sowing engine version")
    provenance: str = Field(..., description="Source citation for sowing calendar and thresholds")
    limitations: str = Field(
        default=(
            "Sowing readiness is an environmental decision-support proxy based on rainfall history and weather forecast. "
            "Soil moisture in the top 10 cm must be physically verified by the farmer before sowing (Vapsa condition)."
        ),
        description="Field verification reminder"
    )


class CropAdvisoryItem(BaseModel):
    """Actionable crop-stage-specific advisory item."""
    model_config = ConfigDict(extra="forbid")

    advisory_id: str = Field(..., description="Unique advisory reference")
    crop_id: str = Field(..., description="Crop ID")
    crop_name: str = Field(..., description="Crop English name")
    crop_name_mr: str = Field(..., description="Crop Marathi name")
    stage_id: str = Field(..., description="Growth stage ID")
    stage_name: str = Field(..., description="Stage English name")
    stage_name_mr: str = Field(..., description="Stage Marathi name")
    priority: AdvisoryPriority = Field(..., description="critical | warning | advisory | info")
    primary_action_en: str = Field(..., description="High-priority actionable recommendation in English")
    primary_action_mr: str = Field(..., description="High-priority actionable recommendation in Marathi")
    secondary_actions_en: List[str] = Field(default_factory=list, description="Supporting field practices in English")
    secondary_actions_mr: List[str] = Field(default_factory=list, description="Supporting field practices in Marathi")
    plain_language_reason_en: str = Field(..., description="Underlying climate or crop physiological reason in English")
    plain_language_reason_mr: str = Field(..., description="Underlying climate or crop physiological reason in Marathi")
    supporting_signals: List[str] = Field(..., description="Climate indicators triggering this advisory")
    rule_id: str = Field(..., description="Internal agronomic rule ID")
    rule_version: str = Field(..., description="Algorithm version")
    validity_days: int = Field(default=5, description="Number of days this advisory remains applicable")
    caveats: str = Field(..., description="Uncertainty, data limits, or conditional constraints")
    provenance: str = Field(..., description="Institutional source citation")


class CropAdvisoryResponse(BaseModel):
    """Complete advisory payload for a crop, growth stage, and location."""
    model_config = ConfigDict(extra="forbid")

    location_id: str = Field(..., description="Block ID")
    block_name: str = Field(..., description="Block name")
    district_name: str = Field(..., description="District name")
    crop_id: str = Field(..., description="Crop ID")
    stage_id: str = Field(..., description="Growth stage ID")
    language: str = Field(default="en", description="Requested language (en | mr)")
    generated_at: dt_datetime = Field(..., description="UTC timestamp of generation")
    primary_advisory: CropAdvisoryItem = Field(..., description="Prioritized primary action")
    secondary_advisories: List[CropAdvisoryItem] = Field(default_factory=list, description="Additional contextual advisories")
    climate_context: Dict[str, Any] = Field(..., description="Underlying climate indicators applied")
    official_warning_disclaimer: str = Field(
        default=(
            "VarshaMitra advisories are agro-climatic decision-support recommendations. "
            "They do not replace official statutory disaster warnings issued by IMD or Maharashtra State Agriculture Dept."
        ),
        description="Statutory advisory notice"
    )
