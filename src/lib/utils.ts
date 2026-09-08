import { clsx, type ClassValue } from "clsx";
import type { RiskLevel } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export const riskColor: Record<RiskLevel, string> = {
  low: "#4C7A4F",
  moderate: "#C8952E",
  high: "#B5502E",
  critical: "#7A2E1F",
};

export const riskBg: Record<RiskLevel, string> = {
  low: "bg-[#4C7A4F]",
  moderate: "bg-[#C8952E]",
  high: "bg-[#B5502E]",
  critical: "bg-[#7A2E1F]",
};

export const riskTextClass: Record<RiskLevel, string> = {
  low: "text-[#3A5F3D]",
  moderate: "text-[#8C6420]",
  high: "text-[#93401E]",
  critical: "text-[#5E2317]",
};

export const riskLabelKey: Record<RiskLevel, string> = {
  low: "common.riskLow",
  moderate: "common.riskModerate",
  high: "common.riskHigh",
  critical: "common.riskCritical",
};

export function riskOrder(risk: RiskLevel): number {
  return { critical: 0, high: 1, moderate: 2, low: 3 }[risk];
}
