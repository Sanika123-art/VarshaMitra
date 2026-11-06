import { clsx, type ClassValue } from "clsx";
import type { RiskLevel } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** Severity order, most severe first. */
export const RISK_LEVELS: RiskLevel[] = ["critical", "high", "moderate", "low", "insufficient_data"];

/** Hex fills for places CSS variables cannot be used (map markers). Mirrors globals.css tokens. */
export const riskColor: Record<RiskLevel, string> = {
  low: "#4c8a58",
  moderate: "#d19a2a",
  high: "#d0642a",
  critical: "#9b1f1f",
  insufficient_data: "#718096",
};

/** CSS-variable references for charts and inline styles. */
export const riskVar: Record<RiskLevel, string> = {
  low: "var(--color-risk-low)",
  moderate: "var(--color-risk-moderate)",
  high: "var(--color-risk-high)",
  critical: "var(--color-risk-critical)",
  insufficient_data: "var(--color-ink-muted)",
};

export const riskLabelKey: Record<RiskLevel, string> = {
  low: "common.riskLow",
  moderate: "common.riskModerate",
  high: "common.riskHigh",
  critical: "common.riskCritical",
  insufficient_data: "common.insufficientData",
};

export function riskOrder(risk: RiskLevel): number {
  return { critical: 0, high: 1, moderate: 2, low: 3, insufficient_data: 4 }[risk];
}

/** Pick the Marathi or English name of any entity that carries both. */
export function pickName(entity: { name: string; nameMr: string }, language: "en" | "mr"): string {
  return language === "mr" ? entity.nameMr : entity.name;
}
