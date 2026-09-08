import type { Block } from "@/types";
import { getBlock } from "./locations";
import { getCrop } from "./crops";

export type AdvisoryConcern = "dry" | "wet" | "uncertainOnset" | "stable";

export interface DerivedAdvisory {
  concern: AdvisoryConcern;
  isSowing: boolean;
  riskSignal: Block["risk"];
  cropNameKey: string;
  stageNameKey: string;
  factorKeys: string[]; // riskDrivers.* keys used as "factors used"
}

function pickConcern(block: Block): AdvisoryConcern {
  if (block.drySpellProbability >= 55) return "dry";
  if (block.heavyRainProbability >= 55) return "wet";
  if (block.monsoonOnsetProbability < 55) return "uncertainOnset";
  return "stable";
}

export function deriveAdvisory(blockId: string, cropId: string, stageId: string): DerivedAdvisory {
  const block = getBlock(blockId);
  if (!block) throw new Error(`Unknown block: ${blockId}`);
  const crop = getCrop(cropId);
  const stage = crop?.stages.find((s) => s.id === stageId) ?? crop?.stages[0];

  return {
    concern: pickConcern(block),
    isSowing: stageId === "sowing",
    riskSignal: block.risk,
    cropNameKey: crop?.nameKey ?? "crops.soybean",
    stageNameKey: stage?.nameKey ?? "cropStages.sowing",
    factorKeys: block.riskDrivers,
  };
}
