"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";
import {
  CloudRain,
  Radio,
  Map as MapIcon,
  Sprout,
  ArrowDown,
  Droplets,
  Thermometer,
  Wind,
} from "lucide-react";

/* ─── Prototype Tag ───────────────────────────────────────────── */

export function PrototypeTag({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-[var(--color-forest)]/30 bg-[var(--color-forest)]/8 px-2.5 py-1 text-[11px] font-medium tracking-wide text-[var(--color-forest-dark)]",
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-forest)]" />
      {t("common.prototypeLabel")} · {t("common.simulatedForecast")}
    </span>
  );
}

/* ─── Section Heading ─────────────────────────────────────────── */

export function SectionHeading({
  eyebrow,
  title,
  body,
  center,
  large,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  center?: boolean;
  large?: boolean;
}) {
  return (
    <div className={cn("max-w-2xl", center && "mx-auto text-center")}>
      {eyebrow && (
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-[var(--color-forest)]">
          {eyebrow}
        </p>
      )}
      <h2
        className={cn(
          "font-display leading-tight text-[var(--color-ink)]",
          large ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl"
        )}
      >
        {title}
      </h2>
      {body && (
        <p className="mt-3 text-base leading-relaxed text-[var(--color-ink)]/70">
          {body}
        </p>
      )}
    </div>
  );
}

/* ─── Section Divider ─────────────────────────────────────────── */

export function SectionDivider() {
  return (
    <div className="relative my-2">
      <div className="h-px bg-[var(--color-line)]" />
      <svg
        viewBox="0 0 600 20"
        className="absolute left-1/2 top-1/2 h-5 w-48 -translate-x-1/2 -translate-y-1/2 text-[var(--color-line)]"
        aria-hidden
      >
        <path
          d="M0 10 Q150 3 300 10 T600 10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}

/* ─── Count Up ────────────────────────────────────────────────── */

function useCountUp(target: number, durationMs = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return value;
}

/* ─── Probability Card (Enhanced with arc gauge) ──────────────── */

export function ProbabilityCard({
  label,
  value,
  accent = "forest",
  suffix = "%",
  footnote,
}: {
  label: string;
  value: number;
  accent?: "forest" | "clay" | "sky" | "amber";
  suffix?: string;
  footnote?: string;
}) {
  const animated = useCountUp(value);
  const accentVar = {
    forest: "var(--color-forest)",
    clay: "var(--color-clay)",
    sky: "var(--color-sky)",
    amber: "var(--color-amber)",
  }[accent];

  const pct = Math.min(100, value);
  const circumference = 2 * Math.PI * 32;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-5 transition-shadow hover:shadow-[var(--shadow-md)]">
      <p className="text-sm font-medium text-[var(--color-ink)]/65">{label}</p>
      <div className="mt-3 flex items-center gap-4">
        <div className="relative h-18 w-18 shrink-0">
          <svg viewBox="0 0 72 72" className="h-full w-full -rotate-90">
            <circle
              cx="36"
              cy="36"
              r="32"
              fill="none"
              stroke="var(--color-line)"
              strokeWidth="5"
              opacity="0.4"
            />
            <circle
              cx="36"
              cy="36"
              r="32"
              fill="none"
              stroke={accentVar}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <span
            className="absolute inset-0 flex items-center justify-center tabular font-display text-lg font-bold"
            style={{ color: accentVar }}
          >
            {animated}
          </span>
        </div>
        <div>
          <p
            className="tabular font-display text-3xl"
            style={{ color: accentVar }}
          >
            {animated}
            {suffix}
          </p>
        </div>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-line)]/40">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${Math.min(100, value)}%`, background: accentVar }}
        />
      </div>
      {footnote && (
        <p className="mt-2 text-xs text-[var(--color-ink)]/55">{footnote}</p>
      )}
    </div>
  );
}

/* ─── Stat Tile (Enhanced) ────────────────────────────────────── */

export function StatTile({
  value,
  label,
  tone = "ink",
}: {
  value: string | number;
  label: string;
  tone?: "ink" | "clay" | "critical" | "amber" | "forest" | "moss";
}) {
  const toneStyles = {
    ink: { text: "text-[var(--color-ink)]", bg: "" },
    clay: {
      text: "text-[var(--color-clay)]",
      bg: "bg-gradient-to-br from-[var(--color-clay-light)] to-[var(--color-paper-raised)]",
    },
    critical: {
      text: "text-[var(--color-critical)]",
      bg: "bg-gradient-to-br from-[#f5e5e3] to-[var(--color-paper-raised)]",
    },
    amber: {
      text: "text-[var(--color-amber)]",
      bg: "bg-gradient-to-br from-[var(--color-amber-light)] to-[var(--color-paper-raised)]",
    },
    forest: {
      text: "text-[var(--color-forest)]",
      bg: "bg-gradient-to-br from-[var(--color-forest-light)] to-[var(--color-paper-raised)]",
    },
    moss: {
      text: "text-[var(--color-moss)]",
      bg: "bg-gradient-to-br from-[var(--color-forest-light)] to-[var(--color-paper-raised)]",
    },
  }[tone];

  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--color-line)] p-5 text-center transition-shadow hover:shadow-[var(--shadow-md)]",
        toneStyles.bg || "bg-[var(--color-paper-raised)]"
      )}
    >
      <p className={cn("tabular font-display text-4xl", toneStyles.text)}>
        {value}
      </p>
      <p className="mt-1.5 text-xs font-medium text-[var(--color-ink)]/60">
        {label}
      </p>
    </div>
  );
}

/* ─── Forecast Timeline ───────────────────────────────────────── */

interface TimelineDay {
  day: number;
  rain: number; // mm expected
  type: "normal" | "dry" | "heavy" | "moderate";
}

export function ForecastTimeline({
  data,
  labels,
}: {
  data: TimelineDay[];
  labels: {
    title: string;
    rain: string;
    dry: string;
    heavy: string;
  };
}) {
  const maxRain = Math.max(...data.map((d) => d.rain), 1);

  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-5 sm:p-6">
      <p className="text-sm font-medium text-[var(--color-ink)]/65">
        {labels.title}
      </p>
      <div className="mt-4 flex items-end gap-[3px] sm:gap-1">
        {data.map((d) => {
          const h = Math.max(8, (d.rain / maxRain) * 80);
          const color =
            d.type === "heavy"
              ? "var(--color-clay)"
              : d.type === "dry"
                ? "var(--color-amber)"
                : "var(--color-sky)";
          return (
            <div
              key={d.day}
              className="group relative flex flex-1 flex-col items-center"
            >
              <div
                className="w-full rounded-t-sm transition-all duration-500 ease-out"
                style={{
                  height: `${h}px`,
                  backgroundColor: color,
                  opacity: d.type === "dry" ? 0.35 : 0.75,
                }}
              />
              <span className="mt-1.5 text-[9px] tabular text-[var(--color-ink)]/45 sm:text-[10px]">
                {d.day}
              </span>
              {/* Tooltip */}
              <div className="pointer-events-none absolute -top-10 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[var(--color-ink)] px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                {d.rain.toFixed(1)}mm
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-[var(--color-ink)]/55">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-[var(--color-sky)]" />
          {labels.rain}
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-[var(--color-amber)] opacity-50" />
          {labels.dry}
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-[var(--color-clay)]" />
          {labels.heavy}
        </span>
      </div>
    </div>
  );
}

/* ─── Climate Signal Card ─────────────────────────────────────── */

export function ClimateSignalCard({
  name,
  value,
  strength,
  explanation,
}: {
  name: string;
  value: string;
  strength: "Primary" | "Contributing";
  explanation?: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper)] p-4 transition-shadow hover:shadow-[var(--shadow-sm)]">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-[var(--color-ink)]/80">
          {name}
        </span>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
            strength === "Primary"
              ? "bg-[var(--color-forest)]/12 text-[var(--color-forest-dark)]"
              : "bg-[var(--color-line)]/60 text-[var(--color-ink)]/55"
          )}
        >
          {value}
        </span>
      </div>
      {explanation && (
        <p className="mt-2 text-xs leading-relaxed text-[var(--color-ink)]/55">
          {explanation}
        </p>
      )}
    </div>
  );
}

/* ─── Decision Flow Visual ────────────────────────────────────── */

interface FlowStep {
  label: string;
  value: string;
  icon?: typeof CloudRain;
  highlight?: boolean;
}

export function DecisionFlowVisual({
  steps,
}: {
  steps: FlowStep[];
}) {
  const defaultIcons = [CloudRain, Radio, MapIcon, Sprout, Sprout];

  return (
    <div className="flex flex-col items-center gap-0">
      {steps.map((step, i) => {
        const Icon = step.icon || defaultIcons[i % defaultIcons.length];
        return (
          <div key={i} className="flex flex-col items-center">
            {i > 0 && (
              <div className="flex flex-col items-center">
                <div className="h-6 w-px bg-[var(--color-forest)]/20" />
                <ArrowDown
                  size={14}
                  className="text-[var(--color-forest)]/30"
                />
                <div className="h-2 w-px bg-[var(--color-forest)]/20" />
              </div>
            )}
            <div
              className={cn(
                "flex w-full max-w-sm items-center gap-3 rounded-2xl border px-4 py-3",
                step.highlight
                  ? "border-[var(--color-forest)] bg-[var(--color-forest)]/10 shadow-[var(--shadow-glow-forest)]"
                  : "border-[var(--color-line)] bg-[var(--color-paper-raised)]"
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  step.highlight
                    ? "bg-[var(--color-forest)] text-white"
                    : "bg-[var(--color-forest)]/10 text-[var(--color-forest)]"
                )}
              >
                <Icon size={14} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-ink)]/45">
                  {step.label}
                </p>
                <p
                  className={cn(
                    "mt-0.5 text-sm leading-snug",
                    step.highlight
                      ? "font-medium text-[var(--color-forest-dark)]"
                      : "text-[var(--color-ink)]/75"
                  )}
                >
                  {step.value}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Alert Card ──────────────────────────────────────────────── */

export function AlertCard({
  severity,
  title,
  location,
  time,
}: {
  severity: "critical" | "high" | "moderate" | "low";
  title: string;
  location?: string;
  time?: string;
}) {
  const severityStyles = {
    critical: "border-l-[var(--color-critical)] bg-[#fdf5f4]",
    high: "border-l-[var(--color-clay)] bg-[var(--color-clay-light)]",
    moderate: "border-l-[var(--color-amber)] bg-[var(--color-amber-light)]",
    low: "border-l-[var(--color-moss)] bg-[var(--color-forest-light)]",
  }[severity];

  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--color-line)] border-l-[3px] px-4 py-3",
        severityStyles
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-[var(--color-ink)]/85">
          {title}
        </p>
        {time && (
          <span className="shrink-0 text-[11px] text-[var(--color-ink)]/45">
            {time}
          </span>
        )}
      </div>
      {location && (
        <p className="mt-1 text-xs text-[var(--color-ink)]/55">{location}</p>
      )}
    </div>
  );
}
