import { allBlocks, districts } from "./locations";
import type { AlertItem, RiskLevel } from "@/types";

export function regionRiskCounts() {
  const blocks = allBlocks();
  return {
    high: blocks.filter((b) => b.risk === "high").length,
    critical: blocks.filter((b) => b.risk === "critical").length,
    moderate: blocks.filter((b) => b.risk === "moderate").length,
    low: blocks.filter((b) => b.risk === "low").length,
  };
}

export function highRiskLocations() {
  return allBlocks()
    .filter((b) => b.risk === "high" || b.risk === "critical")
    .sort((a, b) => (a.risk === "critical" ? -1 : 1) - (b.risk === "critical" ? -1 : 1))
    .map((b) => ({
      blockId: b.id,
      blockName: b.name,
      blockNameMr: b.nameMr,
      districtName: districts.find((d) => d.id === b.districtId)?.name ?? "",
      risk: b.risk as RiskLevel,
    }));
}

export const cropExposure = [
  { cropKey: "crops.soybean", exposedBlocks: 9, riskWeighted: "high" as RiskLevel },
  { cropKey: "crops.cotton", exposedBlocks: 7, riskWeighted: "moderate" as RiskLevel },
  { cropKey: "crops.onion", exposedBlocks: 4, riskWeighted: "high" as RiskLevel },
  { cropKey: "crops.sugarcane", exposedBlocks: 5, riskWeighted: "low" as RiskLevel },
  { cropKey: "crops.jowar", exposedBlocks: 6, riskWeighted: "moderate" as RiskLevel },
  { cropKey: "crops.tur", exposedBlocks: 3, riskWeighted: "moderate" as RiskLevel },
];

export const alerts: AlertItem[] = [
  { id: "a1", blockId: "baramati", severity: "critical", titleKey: "riskDrivers.drySpellAhead", timeAgoHours: 2 },
  { id: "a2", blockId: "panhala", severity: "critical", titleKey: "riskDrivers.heavySoilSaturation", timeAgoHours: 5 },
  { id: "a3", blockId: "maval", severity: "high", titleKey: "riskDrivers.weakOnset", timeAgoHours: 9 },
  { id: "a4", blockId: "shrirampur", severity: "high", titleKey: "riskDrivers.enso", timeAgoHours: 14 },
  { id: "a5", blockId: "barshi", severity: "critical", titleKey: "riskDrivers.lowSoilMoisture", timeAgoHours: 20 },
];

export function alertsForBlock(blockId: string) {
  return alerts.filter((a) => a.blockId === blockId);
}
