import type { RiskLevel } from "@/types";
import type { RiskSummaryItem } from "@/lib/api/types";

export type MapLayer = "overall" | "drySpell" | "heavyRain" | "onset";

export const mapLayers: MapLayer[] = ["overall", "drySpell", "heavyRain", "onset"];

export const layerLabelKey: Record<MapLayer, string> = {
  overall: "riskMapPage.layerOverall",
  drySpell: "riskMapPage.layerDrySpell",
  heavyRain: "riskMapPage.layerHeavyRain",
  onset: "riskMapPage.layerOnset",
};

/**
 * Deterministically computes the display risk level for a block under the selected layer.
 * Strictly derives from backend indicators without synthetic probability models.
 */
export function layerRisk(item: RiskSummaryItem, layer: MapLayer): RiskLevel {
  if (item.status === "unavailable" || !item.overall_risk) {
    return "insufficient_data";
  }

  switch (layer) {
    case "drySpell": {
      const sev = item.dry_spell_severity;
      if (sev === "critical") return "critical";
      if (sev === "significant") return "high";
      if (sev === "mild") return "moderate";
      return "low";
    }
    case "heavyRain": {
      if (item.heavy_rain_event) {
        if ((item.max_single_day_mm ?? 0) >= 115.6) return "critical";
        return "high";
      }
      return "low";
    }
    case "onset": {
      const st = item.monsoon_onset_status;
      if (st === "delayed_onset") return "high";
      if (st === "onset_criteria_not_met") return "moderate";
      if (st === "outside_onset_window") return "insufficient_data";
      return "low";
    }
    case "overall":
    default:
      return item.overall_risk;
  }
}
