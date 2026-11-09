import type { RiskLevel } from "@/types";
import type { RiskSummaryItem } from "@/lib/api/types";

export type MapLayer =
  | "overall"
  | "drySpell"
  | "heavyRain"
  | "onset"
  | "rainfallForecast"
  | "historicalRainfall";

export const mapLayers: MapLayer[] = [
  "overall",
  "onset",
  "drySpell",
  "heavyRain",
  "rainfallForecast",
  "historicalRainfall",
];

export const layerLabelKey: Record<MapLayer, string> = {
  overall: "riskMapPage.layerOverall",
  drySpell: "riskMapPage.layerDrySpell",
  heavyRain: "riskMapPage.layerHeavyRain",
  onset: "riskMapPage.layerOnset",
  rainfallForecast: "riskMapPage.layerRainfallForecast",
  historicalRainfall: "riskMapPage.layerHistoricalRainfall",
};

/**
 * Deterministically computes the display risk level for a block under the selected layer.
 * Strictly derives from backend indicators without synthetic probability models.
 */
export function layerRisk(item: RiskSummaryItem, layer: MapLayer): RiskLevel {
  if (
    item.status === "unavailable"
    || item.freshness_status === "stale"
    || item.freshness_status === "missing"
    || item.freshness_status === "synthetic_staging_baseline"
    || !item.overall_risk
    || item.overall_risk === "insufficient_data"
    || item.confidence === "none"
  ) {
    return "insufficient_data";
  }

  switch (layer) {
    case "drySpell": {
      if (item.in_monsoon_season === undefined || item.in_monsoon_season === null) {
        return "insufficient_data";
      }
      if (!item.in_monsoon_season) return "low";
      const sev = item.dry_spell_severity;
      if (!sev) return "insufficient_data";
      if (sev === "critical") return "critical";
      if (sev === "significant") return "high";
      if (sev === "mild") return "moderate";
      return "low";
    }
    case "heavyRain": {
      if (item.heavy_rain_event === null || item.heavy_rain_event === undefined) {
        return "insufficient_data";
      }
      if (item.heavy_rain_event) {
        if ((item.max_single_day_mm ?? 0) >= 115.6) return "critical";
        return "high";
      }
      return "low";
    }
    case "onset": {
      const st = item.monsoon_onset_status;
      if (!st) return "insufficient_data";
      if (st === "delayed_onset") return "high";
      if (st === "pending" || st === "onset_criteria_not_met") return "moderate";
      if (st === "confirmed") return "low";
      if (st === "outside_onset_window") return "insufficient_data";
      return "low";
    }
    case "rainfallForecast":
    case "historicalRainfall":
      return "insufficient_data";
    case "overall":
    default:
      return item.overall_risk;
  }
}
