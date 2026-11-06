"use client";

import { CircleAlert, CircleCheck, CircleHelp, OctagonAlert, TriangleAlert } from "lucide-react";
import type { RiskLevel } from "@/types";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/LanguageContext";
import { riskLabelKey } from "@/lib/utils";

const icons = {
  low: CircleCheck,
  moderate: CircleAlert,
  high: TriangleAlert,
  critical: OctagonAlert,
  insufficient_data: CircleHelp,
} as const;

const styles: Record<RiskLevel, string> = {
  low: "bg-[#3B8B61]/15 text-[#3B8B61] border-[#3B8B61]",
  moderate: "bg-[#E6B83F]/20 text-[#252923] border-[#E6B83F]",
  high: "bg-[#E58A38]/15 text-[#E58A38] border-[#E58A38]",
  critical: "bg-[#C7473B]/15 text-[#C7473B] border-[#C7473B]",
  insufficient_data: "bg-[#252923]/10 text-[#252923] border-[#252923]/40",
};

/**
 * Risk classification badge:
 * Refined neo-brutalist badge with icon shape, monospace label, and high-contrast border.
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
  withPrefix?: boolean;
  className?: string;
  label?: string;
}) {
  const { t } = useTranslation();
  const Icon = icons[risk] || CircleHelp;
  const label = customLabel ?? t(riskLabelKey[risk] ?? "common.insufficientData");

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border-2 font-mono font-bold uppercase tracking-wider whitespace-nowrap shadow-xs",
        styles[risk] || styles.insufficient_data,
        size === "sm" && "px-2 py-0.5 text-[10px]",
        size === "md" && "px-2.5 py-1 text-xs",
        size === "lg" && "px-3.5 py-1.5 text-sm",
        className
      )}
    >
      <Icon size={size === "lg" ? 16 : size === "sm" ? 11 : 13} aria-hidden />
      {withPrefix ? `${t("common.riskPrefix", { level: label })}` : label}
    </span>
  );
}

export { riskLabelKey };
