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
  state_id?: string;
  state_name?: string;
  state_name_mr?: string;
  altitude_m?: number;
  agroclimatic_zone?: string;
  historical_data_available?: boolean;
  coordinates_precision?: string;
  coverage_status?: string;
}

export interface DistrictDetail extends DistrictSummary {
  member_blocks: BlockDetail[];
}

export type LocationResolutionSource =
  | "nominatim_osm"
  | "local_gazetteer"
  | "reverse_geocode"
  | "coordinate_direct";

export interface LocationSearchItem {
  id: string;
  name: string;
  name_mr: string;
  taluka?: string | null;
  district_id: string;
  district_name: string;
  district_name_mr: string;
  state_id: string;
  state_name: string;
  latitude: number;
  longitude: number;
  postal_code?: string | null;
  display_name: string;
  precision: string;
  source: LocationResolutionSource;
}

export interface LocationSearchResponse {
  query: string;
  count: number;
  results: LocationSearchItem[];
}

export interface LocationResolveRequest {
  query?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
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

export interface DataProvenance {
  data_type: "observation" | "reanalysis" | "model_analysis" | "forecast" | "synthetic_test";
  provider_id: string;
  provider_name: string;
  dataset_name: string;
  attribution: string;
  spatial_resolution: string;
  retrieved_at: string;
  window_start: string;
  window_end: string;
  is_station_observation: boolean;
  note: string;
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
    onset_detected?: boolean;
    onset_date?: string | null;
    onset_probability?: number;
    status: string;
  };
  anomaly: {
    observed_mm?: number;
    normal_mm?: number;
    baseline_normal_mm?: number;
    departure_pct?: number;
    departure_class?: string;
    status?: string;
    baseline_provenance?: string;
  };
  data_quality?: Record<string, unknown>;
  method_version?: string;
  retrieved_at?: string;
  data_provenance?: DataProvenance;
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
  assessment_time: string;
  assessment_date?: string;
  window_days?: number;
  start_date?: string;
  end_date?: string;
  overall_risk: RiskLevel;
  confidence: "high" | "medium" | "low" | "none";
  confidence_rationale?: string;
  risk_drivers: RiskDriver[];
  supporting_measurements?: Record<string, unknown>;
  evidence_summary?: Record<string, unknown>;
  methodology?: string;
  evaluation_method?: string;
  method_version?: string;
  provisional_notice?: string;
  limitations: string;
  data_provenance?: DataProvenance;
  season_note?: string;
  in_monsoon_season?: boolean;
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
  recommended_varieties?: string[];
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
  provenance?: string;
  rule_version?: string;
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
  climate_context: Record<string, unknown>;
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

export interface RiskSummaryItem {
  block_id: string;
  block_name: string;
  block_name_mr: string;
  district_id: string;
  district_name: string;
  latitude: number;
  longitude: number;
  status: "ok" | "unavailable";
  error?: string | null;
  overall_risk?: RiskLevel | null;
  confidence?: "high" | "medium" | "low" | "none" | null;
  dry_spell_severity?: "none" | "mild" | "significant" | "critical" | null;
  current_dry_days?: number | null;
  heavy_rain_event?: boolean | null;
  max_single_day_mm?: number | null;
  accumulation_mm?: number | null;
  monsoon_onset_status?: string | null;
  coverage_ratio?: number | null;
  window_start?: string | null;
  window_end?: string | null;
}

export interface RiskSummaryResponse {
  generated_at: string;
  cached: boolean;
  cache_age_seconds: number;
  window_days: number;
  provider: string;
  count: number;
  available_count: number;
  items: RiskSummaryItem[];
  coordinates_note: string;
  method_version: string;
  data_provenance?: DataProvenance;
  provisional_notice: string;
}

export interface BlocksResponse {
  count: number;
  coverage_notice: string;
  items: BlockSummary[];
}

export interface ChatMessageItem {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  provider_status?: "nugen" | "engine_fallback" | "error" | string;
  context_metadata?: Record<string, unknown> | null;
}

export interface ChatConversationItem {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  location_id?: string | null;
  crop_id?: string | null;
  stage_id?: string | null;
  language: string;
  latest_message?: string | null;
  message_count: number;
}

export interface ChatConversationDetail extends ChatConversationItem {
  messages: ChatMessageItem[];
}

