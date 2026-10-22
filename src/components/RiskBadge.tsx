"use client";

import { CircleAlert, CircleCheck, OctagonAlert, TriangleAlert } from "lucide-react";
import type { RiskLevel } from "@/types";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/LanguageContext";
import { riskLabelKey } from "@/lib/utils";

const icons = {
  low: CircleCheck,
  moderate: CircleAlert,
  high: TriangleAlert,
  critical: OctagonAlert,
} as const;

const styles: Record<RiskLevel, string> = {
  low: "bg-risk-low-soft text-risk-low-ink border-risk-low/40",
  moderate: "bg-risk-moderate-soft text-risk-moderate-ink border-risk-moderate/50",
  high: "bg-risk-high-soft text-risk-high-ink border-risk-high/50",
  critical: "bg-risk-critical-soft text-risk-critical-ink border-risk-critical/50",
};

/**
 * Risk classification badge. Colour is never the only cue: each level has its
 * own icon shape and a text label (translated).
 */
export default function RiskBadge({
  risk,
  size = "md",
  withPrefix = false,
  className,
  label: customLabel,
}: {
  risk: RiskLevel;
  size?: "sm" | "md" | "lg";
  /** Prefix the label with "Risk:" for stand-alone use. */
  withPrefix?: boolean;
  className?: string;
  label?: string;
}) {
  const { t } = useTranslation();
  const Icon = icons[risk];
  const label = customLabel ?? t(riskLabelKey[risk]);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border font-semibold whitespace-nowrap",
        styles[risk],
        size === "sm" && "px-2 py-0.5 text-xs",
        size === "md" && "px-2.5 py-1 text-sm",
        size === "lg" && "px-3.5 py-1.5 text-base",
        className
      )}
    >
      <Icon size={size === "lg" ? 18 : size === "sm" ? 13 : 15} aria-hidden />
      {withPrefix ? t("common.riskPrefix", { level: label }) : label}
    </span>
  );
}

export { riskLabelKey };
