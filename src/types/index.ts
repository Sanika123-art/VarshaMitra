// Core domain types for the VarshaMitra climate intelligence prototype.
// These shapes are designed so a real backend/ML service can be swapped in
// later without touching the UI layer — see ARCHITECTURE.md.

export type RiskLevel = "low" | "moderate" | "high" | "critical" | "insufficient_data";

export type Language = "en" | "mr";

export type UserRole = "farmer" | "officer";

export interface District {
  id: string;
  name: string;
  nameMr: string;
  stateId: string;
  lat: number;
  lng: number;
  blocks: Block[];
}

export interface Block {
  id: string;
  name: string;
  nameMr: string;
  districtId: string;
  lat: number;
  lng: number;
  risk: RiskLevel;
  monsoonOnsetProbability: number; // %
  drySpellProbability: number; // %
  heavyRainProbability: number; // %
  agriculturalImpact: string; // short label, translated at use-site
  riskDrivers: string[]; // keys into i18n riskDrivers dictionary
}

export interface SelectedLocation {
  stateId: string;
  stateName: string;
  districtId: string;
  districtName: string;
  districtNameMr?: string;
  blockId: string;
  blockName: string;
  blockNameMr?: string;
  latitude?: number;
  longitude?: number;
  taluka?: string | null;
  postalCode?: string | null;
  displayName?: string | null;
  isDynamic?: boolean;
}

export type ForecastHorizon = 7 | 14 | 30;

export interface RainfallPoint {
  day: number;
  expectedMm: number;
  lowerMm: number;
  upperMm: number;
}

export interface ClimateSignal {
  id: string;
  labelKey: string; // i18n key
  value: string;
  descriptionKey: string;
}

export interface ClimateForecast {
  horizon: ForecastHorizon;
  monsoonOnsetProbability: number;
  drySpellProbability: number;
  heavyRainProbability: number;
  confidence: "low" | "medium" | "high";
  rainfallTrend: RainfallPoint[];
  temperatureTrendC: number[];
  signals: ClimateSignal[];
  updatedAt: string; // ISO date, mock
}

export interface Crop {
  id: string;
  nameKey: string;
  icon: string; // lucide icon name
  stages: CropStage[];
}

export interface CropStage {
  id: string;
  nameKey: string;
}

export interface AdvisoryFactor {
  labelKey: string;
  valueKey: string;
}

export interface Advisory {
  id: string;
  blockId: string;
  cropId: string;
  stageId: string;
  headlineKey: string;
  reasonKey: string;
  steps: string[]; // i18n keys
  waterActionKey: string;
  watchForKey: string;
  factors: AdvisoryFactor[];
  riskSignal: RiskLevel;
}

export interface AlertItem {
  id: string;
  blockId: string;
  severity: RiskLevel;
  titleKey: string;
  timeAgoHours: number;
}

export interface OfficerRegionStat {
  label: string;
  high: number;
  critical: number;
  moderate: number;
  low: number;
}

export interface HistoricalTrendPoint {
  year: number;
  rainfallAnomalyPct: number;
  drySpellDays: number;
}
