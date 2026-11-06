"use client";

import { CircleCheck, Database, OctagonAlert, TriangleAlert, CircleAlert } from "lucide-react";
import type { ReactNode } from "react";
import type { RiskLevel } from "@/types";
import { useTranslation } from "@/i18n/LanguageContext";
import { cn, riskLabelKey } from "@/lib/utils";
import { InfoTip } from "./InfoTip";

/* ─── Probability meter ──────────────────────────────────────── */

const accents = {
  forest: { text: "text-forest", bar: "bg-forest" },
  monsoon: { text: "text-monsoon", bar: "bg-monsoon" },
  earth: { text: "text-earth", bar: "bg-earth" },
} as const;

/**
 * A single probability with its plain-language definition available in a tooltip.
 * The bar is decorative reinforcement; the number and label carry the meaning.
 */
export function ProbabilityMeter({
  label,
  value,
  accent = "forest",
  definition,
  footnote,
}: {
  label: string;
  value: number;
  accent?: keyof typeof accents;
  definition?: string;
  footnote?: string;
}) {
  const { t, fmtNumber } = useTranslation();
  const a = accents[accent];
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ink-muted">{label}</p>
        {definition && (
          <InfoTip label={t("common.whatIsThis", { item: label })} align="end">
            {definition}
          </InfoTip>
        )}
      </div>
      <p className={cn("mt-2 font-serif text-3xl font-semibold tabular", a.text)}>
        {fmtNumber(pct)}
        <span className="text-xl">%</span>
      </p>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-valuetext={`${fmtNumber(pct)}%`}
        className="mt-3 h-2 w-full overflow-hidden rounded-full bg-paper-deep"
      >
        <div className={cn("h-full rounded-full transition-[width] duration-500", a.bar)} style={{ width: `${pct}%` }} />
      </div>
      {footnote && <p className="mt-2 text-xs text-ink-muted">{footnote}</p>}
    </div>
  );
}

/* ─── Data provenance banner ─────────────────────────────────── */

export type DataKind = "forecast" | "historical" | "assessment";

/**
 * States, on every data-bearing page, what the numbers are, when they were
 * produced and where they come from — so simulated data is never mistaken
 * for a live forecast.
 */
export function DataStatus({
  kind,
  date,
  period,
  className,
}: {
  kind: DataKind;
  /** ISO date the dataset was generated. */
  date?: string;
  /** Year range for historical series. */
  period?: { from: number; to: number };
  className?: string;
}) {
  const { t, fmtDate, fmtNumber } = useTranslation();
  return (
    <aside
      aria-label={t("status.label")}
      className={cn("rounded-lg border border-line bg-paper-deep/50 px-4 py-3", className)}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-risk-moderate-soft px-2 py-0.5 text-xs font-bold text-risk-moderate-ink">
          <Database size={13} aria-hidden />
          {t("status.demoBadge")}
        </span>
        <p className="min-w-0 flex-1 text-sm text-ink-muted">{t(`status.note.${kind}`)}</p>
      </div>
      <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs text-ink-muted">
        <div className="flex gap-1.5">
          <dt className="font-semibold text-ink">{t("status.type")}:</dt>
          <dd>{t(`status.kind.${kind}`)}</dd>
        </div>
        {date && (
          <div className="flex gap-1.5">
            <dt className="font-semibold text-ink">{t("status.generated")}:</dt>
            <dd>{fmtDate(date)}</dd>
          </div>
        )}
        {period && (
          <div className="flex gap-1.5">
            <dt className="font-semibold text-ink">{t("status.period")}:</dt>
            <dd>
              {fmtNumber(period.from, { useGrouping: false })}–{fmtNumber(period.to, { useGrouping: false })}
            </dd>
          </div>
        )}
        <div className="flex gap-1.5">
          <dt className="font-semibold text-ink">{t("status.source")}:</dt>
          <dd>{t("status.sourcePrototype")}</dd>
        </div>
      </dl>
    </aside>
  );
}

export function PrototypeTag({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-risk-moderate/40 bg-risk-moderate-soft px-2 py-0.5 text-xs font-semibold text-risk-moderate-ink",
        className
      )}
    >
      <Database size={12} aria-hidden />
      {t("status.demoBadge")}
    </span>
  );
}


/* ─── Alert list item ────────────────────────────────────────── */

const alertAccent: Record<RiskLevel, { border: string; bg: string; text: string; icon: typeof CircleCheck }> = {
  critical: { border: "border-l-risk-critical", bg: "bg-risk-critical-soft/60", text: "text-risk-critical-ink", icon: OctagonAlert },
  high: { border: "border-l-risk-high", bg: "bg-risk-high-soft/60", text: "text-risk-high-ink", icon: TriangleAlert },
  moderate: { border: "border-l-risk-moderate", bg: "bg-risk-moderate-soft/60", text: "text-risk-moderate-ink", icon: CircleAlert },
  low: { border: "border-l-risk-low", bg: "bg-risk-low-soft/60", text: "text-risk-low-ink", icon: CircleCheck },
  insufficient_data: { border: "border-l-slate-400", bg: "bg-slate-100/60 dark:bg-slate-800/60", text: "text-slate-600 dark:text-slate-400", icon: CircleAlert },
};

export function AlertListItem({
  severity,
  title,
  location,
  time,
  action,
}: {
  severity: RiskLevel;
  title: string;
  location?: string;
  time?: string;
  action?: ReactNode;
}) {
  const { t } = useTranslation();
  const a = alertAccent[severity];
  const Icon = a.icon;
  return (
    <li className={cn("rounded-md border border-line border-l-4 px-3.5 py-3", a.border, a.bg)}>
      <div className="flex items-start gap-2.5">
        <Icon size={16} className={cn("mt-0.5 shrink-0", a.text)} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug text-ink">{title}</p>
          <p className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-ink-muted">
            <span className={cn("font-semibold", a.text)}>{t(riskLabelKey[severity])}</span>
            {location && <span>· {location}</span>}
            {time && <span>· {time}</span>}
          </p>
        </div>
        {action}
      </div>
    </li>
  );
}

/* ─── Driver / signal list ───────────────────────────────────── */

export function DriverList({ items }: { items: { key: string; primary?: boolean; text: string; detail?: string }[] }) {
  const { t } = useTranslation();
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item.key} className="rounded-md border border-line bg-surface-raised px-3.5 py-3">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-semibold text-ink">{item.text}</p>
            <span
              className={cn(
                "shrink-0 rounded-sm px-2 py-0.5 text-xs font-semibold",
                item.primary ? "bg-forest-soft text-forest" : "bg-paper-deep text-ink-muted"
              )}
            >
              {item.primary ? t("signals.primary") : t("signals.contributing")}
            </span>
          </div>
          {item.detail && <p className="mt-1 text-sm text-ink-muted">{item.detail}</p>}
        </li>
      ))}
    </ul>
  );
}
