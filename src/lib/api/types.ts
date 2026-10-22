/**
 * TypeScript API contracts matching the FastAPI backend Pydantic schemas.
 * (Phases 1-5 canonical data models)
 */

export type RiskLevel = "low" | "moderate" | "high" | "critical" | "insufficient_data";

export interface DistrictSummary {
  id: string;
  name: string;
  name_mr: string;
  state_id: string;
  state_name: string;
}

export interface BlockSummary {
  id: string;
  name: string;
  name_mr: string;
  district_id: string;
  district_name: string;
  latitude: number;
  longitude: number;
}

export interface BlockDetail extends BlockSummary {
  altitude_m?: number;
  agroclimatic_zone?: string;
  historical_data_available: boolean;
}

export interface DistrictDetail extends DistrictSummary {
  member_blocks: BlockDetail[];
}

export interface ForecastItem {
  date: string;
  forecast_day_index: number;
  precipitation_sum_mm: number;
  precipitation_probability_pct?: number;
  temperature_max_c?: number;
  temperature_min_c?: number;
}

export interface ForecastSeries {
  block_id: string;
  block_name: string;
  district_id: string;
  district_name: string;
  latitude: number;
  longitude: number;
  forecast_days: number;
  available_days: number;
  forecast: ForecastItem[];
  provider: {
    provider_id: string;
    provider_name: string;
    dataset_name: string;
    attribution: string;
    license: string;
    spatial_resolution: string;
    temporal_resolution: string;
    timezone: string;
  };
  data_type: string;
  disclaimer: string;
  location_id?: string;
  forecast_generated_at?: string;
  source?: string;
}

export interface DrySpellIndicator {
  threshold_mm: number;
  dry_days_count: number;
  max_consecutive_dry_days: number;
  current_consecutive_dry_days: number;
  severity: "none" | "mild" | "significant" | "critical";
}

export interface AccumulationIndicator {
  total_mm: number;
  valid_days_count: number;
  missing_days_count: number;
  daily_average_mm: number;
}

export interface HeavyRainIndicator {
  threshold_mm: number;
  heavy_rain_days_count: number;
  max_single_day_mm: number;
  has_heavy_rain_event: boolean;
  event_dates: string[];
}

export interface ClimateIndicatorsResponse {
  block_id: string;
  block_name: string;
  district_name: string;
  start_date: string;
  end_date: string;
  window_days: number;
  accumulation: AccumulationIndicator;
  dry_spell: DrySpellIndicator;
  heavy_rain: HeavyRainIndicator;
  monsoon_onset: {
    threshold_mm?: number;
    consecutive_days?: number;
    onset_detected: boolean;
    onset_date?: string;
    onset_probability?: number;
    status: string;
  };
  anomaly: {
    observed_mm?: number;
    normal_mm?: number;
    departure_pct?: number;
    departure_class?: string;
  };
  data_quality?: any;
  method_version?: string;
  retrieved_at?: string;
}

export interface RiskDriver {
  code: string;
  name: string;
  evidence: string;
  contribution: string;
  driver_key?: string;
  plain_language_summary?: string;
}

export interface RiskAssessmentResponse {
  block_id: string;
  block_name: string;
  district_name: string;
  assessment_time?: string;
  assessment_date?: string;
  window_days?: number;
  start_date?: string;
  end_date?: string;
  overall_risk: RiskLevel;
  confidence: "high" | "medium" | "low" | "none";
  confidence_rationale?: string;
  risk_drivers: RiskDriver[];
  supporting_measurements?: Record<string, any>;
  evidence_summary?: Record<string, any>;
  methodology?: string;
  evaluation_method?: string;
  method_version?: string;
  provisional_notice?: string;
  limitations: string;
}

export interface RegionalSoilSummaryResponse {
  location_id: string;
  location_name: string;
  district_name: string;
  source: string;
  dataset_name: string;
  spatial_resolution: string;
  depth_layer: string;
  dominant_texture: string;
  clay_fraction_pct: number;
  sand_fraction_pct: number;
  silt_fraction_pct: number;
  topsoil_ph: number;
  organic_carbon_pct: number;
  cation_exchange_capacity: number;
  available_water_capacity_mm_m: number;
  drainage_class: string;
  limitations: string;
}

export interface GrowthStageItem {
  stage_id: string;
  name: string;
  name_mr: string;
  start_day: number;
  end_day: number;
  water_requirement_tier: string;
  is_critical_moisture_stage: boolean;
  sensitivities: string[];
}

export interface CropRequirement {
  crop_id: string;
  name: string;
  name_mr: string;
  scientific_name: string;
  season: "kharif" | "rabi" | "zaid" | "perennial";
  crop_category: string;
  duration_days_min: number;
  duration_days_max: number;
  growth_stages: GrowthStageItem[];
  sowing_window: {
    optimal_start_month: number;
    optimal_start_day: number;
    optimal_end_month: number;
    optimal_end_day: number;
    rationale: string;
  };
  min_soil_ph: number;
  max_soil_ph: number;
  suitable_textures: string[];
  sowing_soil_moisture_min_mm: number;
  source_citation: string;
  publisher: string;
  version: string;
}

export interface CropSuitabilityResult {
  crop_id: string;
  name: string;
  name_mr: string;
  season: string;
  status: "suitable" | "conditionally_suitable" | "unsuitable" | "insufficient_data";
  suitability_score?: number;
  supporting_factors: string[];
  limiting_factors: string[];
  required_interventions: string[];
  missing_inputs: string[];
  citations: string[];
}

export interface SuitabilityAssessmentResponse {
  location_id: string;
  location_name: string;
  district_name: string;
  agroclimatic_zone: string;
  season: string;
  evaluation_date: string;
  water_source: string;
  candidate_crops: CropSuitabilityResult[];
  limitations: string;
}

export interface SowingAssessmentResponse {
  location_id: string;
  location_name: string;
  district_name: string;
  crop_id: string;
  crop_name: string;
  crop_name_mr: string;
  season: string;
  assessment_date: string;
  status: "favorable" | "wait_and_reassess" | "unfavorable" | "insufficient_data";
  window_status: string;
  optimal_window_description: string;
  sowing_readiness_summary_en: string;
  sowing_readiness_summary_mr: string;
  supporting_factors: string[];
  risk_factors: string[];
  antecedent_rainfall_7d_mm: number;
  antecedent_rainfall_14d_mm: number;
  forecast_14d_hazard_flag: boolean;
  forecast_summary: string;
  next_reassessment_date: string;
  limitations: string;
}

export interface CropAdvisoryItem {
  advisory_id: string;
  crop_id: string;
  crop_name: string;
  crop_name_mr: string;
  stage_id: string;
  stage_name: string;
  stage_name_mr: string;
  priority: "critical" | "warning" | "advisory" | "info";
  primary_action_en: string;
  primary_action_mr: string;
  secondary_actions_en: string[];
  secondary_actions_mr: string[];
  plain_language_reason_en: string;
  plain_language_reason_mr: string;
  supporting_signals: string[];
  rule_id: string;
  rule_version: string;
  validity_days: number;
  caveats: string;
  provenance: string;
}

export interface CropAdvisoryResponse {
  location_id: string;
  block_name: string;
  district_name: string;
  crop_id: string;
  stage_id: string;
  language: string;
  generated_at: string;
  primary_advisory: CropAdvisoryItem;
  secondary_advisories: CropAdvisoryItem[];
  climate_context: Record<string, any>;
  official_warning_disclaimer: string;
}

export type ExplanationProviderStatus = "generated" | "fallback" | "disabled" | "unavailable";

export interface ExplanationResponse {
  advisory_id: string;
  location_id: string;
  block_name: string;
  district_name: string;
  crop_id: string;
  crop_name: string;
  stage_id: string;
  stage_name: string;
  language: string;
  provider_status: ExplanationProviderStatus;
  model_used?: string;
  summary: string;
  signal_explanation: string;
  reasoning_summary: string;
  action_explanation: string;
  uncertainty: string;
  canonical_primary_action: string;
  canonical_priority: string;
  rule_id: string;
  rule_version: string;
  provenance: string;
  generated_at: string;
  limitations: string;
}

export interface DatasetSummaryResponse {
  location_id: string;
  total_records: number;
  valid_records: number;
  missing_records: number;
  min_date?: string | null;
  max_date?: string | null;
  total_precipitation_mm?: number;
  storage_file?: string;
}
