import type { Block, RiskLevel } from "@/types";

export type MapLayer = "overall" | "rainfall" | "drySpell" | "heavyRain" | "onset";

export const mapLayers: MapLayer[] = ["overall", "rainfall", "drySpell", "heavyRain", "onset"];

export const layerLabelKey: Record<MapLayer, string> = {
  overall: "riskMapPage.layerOverall",
  rainfall: "riskMapPage.layerRainfall",
  drySpell: "riskMapPage.layerDrySpell",
  heavyRain: "riskMapPage.layerHeavyRain",
  onset: "riskMapPage.layerOnset",
};

function bucket(score: number): RiskLevel {
  if (score >= 75) return "critical";
  if (score >= 55) return "high";
  if (score >= 30) return "moderate";
  return "low";
}

export function layerScore(block: Block, layer: MapLayer): number {
  switch (layer) {
    case "drySpell":
      return block.drySpellProbability;
    case "heavyRain":
      return block.heavyRainProbability;
    case "onset":
      return 100 - block.monsoonOnsetProbability;
    case "rainfall":
      return Math.round(
        (100 - block.monsoonOnsetProbability) * 0.4 +
          block.drySpellProbability * 0.3 +
          block.heavyRainProbability * 0.3
      );
    case "overall":
    default:
      return { low: 15, moderate: 45, high: 65, critical: 88 }[block.risk];
  }
}

export function layerRisk(block: Block, layer: MapLayer): RiskLevel {
  if (layer === "overall") return block.risk;
  return bucket(layerScore(block, layer));
}
