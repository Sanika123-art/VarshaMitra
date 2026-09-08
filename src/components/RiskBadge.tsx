import type { RiskLevel } from "@/types";
import { riskLabelKey } from "@/lib/utils";
import { cn } from "@/lib/utils";

const dotClass: Record<RiskLevel, string> = {
  low: "bg-[var(--color-moss)]",
  moderate: "bg-[var(--color-amber)]",
  high: "bg-[var(--color-clay)]",
  critical: "bg-[var(--color-critical)]",
};

const textClass: Record<RiskLevel, string> = {
  low: "text-[var(--color-moss)]",
  moderate: "text-[var(--color-amber)]",
  high: "text-[var(--color-clay)]",
  critical: "text-[var(--color-critical)]",
};

const bgClass: Record<RiskLevel, string> = {
  low: "bg-[var(--color-forest-light)]",
  moderate: "bg-[var(--color-amber-light)]",
  high: "bg-[var(--color-clay-light)]",
  critical: "bg-[#f5e5e3]",
};

export default function RiskBadge({
  risk,
  label,
  size = "md",
}: {
  risk: RiskLevel;
  label: string;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] font-medium",
        bgClass[risk],
        size === "sm" && "px-2.5 py-0.5 text-xs",
        size === "md" && "px-3 py-1.5 text-sm",
        size === "lg" && "px-5 py-2 text-base",
        textClass[risk],
        risk === "critical" && "pulse-critical"
      )}
    >
      <span className={cn("h-2 w-2 rounded-full", dotClass[risk])} aria-hidden />
      {label}
    </span>
  );
}

export { riskLabelKey };
