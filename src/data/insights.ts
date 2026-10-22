import type { HistoricalTrendPoint } from "@/types";

/**
 * Simulated historical series for the prototype. These are NOT official
 * observations — see MOCK_DATA.md. The period is exposed so the UI can state it.
 */
export const historicalTrend: HistoricalTrendPoint[] = [
  { year: 2016, rainfallAnomalyPct: 8, drySpellDays: 11 },
  { year: 2017, rainfallAnomalyPct: -6, drySpellDays: 18 },
  { year: 2018, rainfallAnomalyPct: -14, drySpellDays: 26 },
  { year: 2019, rainfallAnomalyPct: 22, drySpellDays: 9 },
  { year: 2020, rainfallAnomalyPct: 4, drySpellDays: 13 },
  { year: 2021, rainfallAnomalyPct: -3, drySpellDays: 16 },
  { year: 2022, rainfallAnomalyPct: 12, drySpellDays: 10 },
  { year: 2023, rainfallAnomalyPct: -19, drySpellDays: 29 },
  { year: 2024, rainfallAnomalyPct: -8, drySpellDays: 20 },
  { year: 2025, rainfallAnomalyPct: 6, drySpellDays: 14 },
];

export const historicalPeriod = { from: 2016, to: 2025 };

export const drySpellFrequencyByDistrict = [
  { districtId: "solapur", districtName: "Solapur", avgDrySpellDays: 24 },
  { districtId: "ahilyanagar", districtName: "Ahilyanagar", avgDrySpellDays: 21 },
  { districtId: "pune", districtName: "Pune", avgDrySpellDays: 17 },
  { districtId: "satara", districtName: "Satara", avgDrySpellDays: 15 },
  { districtId: "nashik", districtName: "Nashik", avgDrySpellDays: 13 },
  { districtId: "nandurbar", districtName: "Nandurbar", avgDrySpellDays: 11 },
  { districtId: "kolhapur", districtName: "Kolhapur", avgDrySpellDays: 8 },
];

/** Crop risk patterns. Text is referenced by i18n key so it renders in English and Marathi. */
export const cropRiskPatterns = [
  { blockId: "baramati", cropKey: "crops.soybean", patternKey: "insights.patterns.baramatiSoybean" },
  { blockId: "barshi", cropKey: "crops.jowar", patternKey: "insights.patterns.barshiJowar" },
  { blockId: "panhala", cropKey: "crops.sugarcane", patternKey: "insights.patterns.panhalaSugarcane" },
  { blockId: "phaltan", cropKey: "crops.onion", patternKey: "insights.patterns.phaltanOnion" },
];
