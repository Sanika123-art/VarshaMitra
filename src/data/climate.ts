import type { Block, ClimateForecast, ClimateSignal, ForecastHorizon, RainfallPoint } from "@/types";
import { getBlock } from "./locations";

// Small seeded PRNG so the "mock model" is stable across renders/horizons
// instead of jumping around randomly on every reload — a prototype should
// feel like one coherent forecast, not noise.
function seededRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return () => {
    h = (h * 9301 + 49297) % 233280;
    return h / 233280;
  };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

const horizonDrift: Record<ForecastHorizon, number> = { 7: 0, 14: -4, 30: -9 };

function buildSignals(block: Block): ClimateSignal[] {
  return block.riskDrivers.map((driverKey, i) => ({
    id: `${block.id}-signal-${i}`,
    labelKey: `riskDrivers.${driverKey}`,
    value: i === 0 ? "Primary" : "Contributing",
    descriptionKey: `riskDrivers.${driverKey}`,
  }));
}

function buildRainfallTrend(block: Block, horizon: ForecastHorizon): RainfallPoint[] {
  const rand = seededRandom(`${block.id}-${horizon}-rain`);
  const points: RainfallPoint[] = [];
  const baseline = 4 + (block.heavyRainProbability / 100) * 10 - (block.drySpellProbability / 100) * 3;
  const days = horizon;
  const stepSize = horizon === 30 ? 3 : 1;
  for (let day = stepSize; day <= days; day += stepSize) {
    const noise = (rand() - 0.5) * 6;
    const drySpellDip = block.drySpellProbability > 55 && day > days * 0.3 && day < days * 0.7 ? -3.5 : 0;
    const expected = clamp(baseline + noise + drySpellDip, 0, 45);
    points.push({
      day,
      expectedMm: Math.round(expected * 10) / 10,
      lowerMm: Math.round(clamp(expected - 4 - rand() * 3, 0, 45) * 10) / 10,
      upperMm: Math.round(clamp(expected + 4 + rand() * 4, 0, 60) * 10) / 10,
    });
  }
  return points;
}

function buildTemperatureTrend(block: Block, horizon: ForecastHorizon): number[] {
  const rand = seededRandom(`${block.id}-${horizon}-temp`);
  const base = 27 + (block.drySpellProbability / 100) * 4;
  const days = horizon === 30 ? 10 : horizon;
  const points: number[] = [];
  for (let i = 0; i < days; i++) {
    points.push(Math.round((base + (rand() - 0.5) * 2.5) * 10) / 10);
  }
  return points;
}

export function getForecast(blockId: string, horizon: ForecastHorizon): ClimateForecast {
  const block = getBlock(blockId);
  if (!block) throw new Error(`Unknown block: ${blockId}`);

  const drift = horizonDrift[horizon];
  const monsoonOnsetProbability = clamp(block.monsoonOnsetProbability + drift, 5, 96);
  const drySpellProbability = clamp(block.drySpellProbability - drift * 0.6, 4, 92);
  const heavyRainProbability = clamp(block.heavyRainProbability + (horizon === 30 ? -6 : 0), 4, 92);

  const spread = Math.abs(drift) + (horizon === 30 ? 12 : horizon === 14 ? 6 : 2);
  const confidence: ClimateForecast["confidence"] = spread < 5 ? "high" : spread < 12 ? "medium" : "low";

  return {
    horizon,
    monsoonOnsetProbability: Math.round(monsoonOnsetProbability),
    drySpellProbability: Math.round(drySpellProbability),
    heavyRainProbability: Math.round(heavyRainProbability),
    confidence,
    rainfallTrend: buildRainfallTrend(block, horizon),
    temperatureTrendC: buildTemperatureTrend(block, horizon),
    signals: buildSignals(block),
    updatedAt: "2026-06-01",
  };
}
