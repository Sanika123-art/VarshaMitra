/**
 * Rainfall interpretation rules.
 *
 * These are prototype thresholds applied to *daily expected rainfall* so the
 * UI can label forecast days. They live here — not in components — so the
 * backend/model owners can replace them with validated agronomic thresholds.
 */
export const DRY_DAY_MM = 3;
export const HEAVY_DAY_MM = 15;

export type RainDayClass = "dry" | "normal" | "heavy";

export function classifyRainDay(expectedMm: number): RainDayClass {
  if (expectedMm > HEAVY_DAY_MM) return "heavy";
  if (expectedMm < DRY_DAY_MM) return "dry";
  return "normal";
}
