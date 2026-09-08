"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import { useTranslation } from "@/i18n/LanguageContext";
import { useAppState } from "@/hooks/useAppState";
import { getBlock } from "@/data/locations";
import { getForecast } from "@/data/climate";
import type { ForecastHorizon } from "@/types";
import { PrototypeTag, ProbabilityCard, SectionHeading, ClimateSignalCard } from "@/components/ui";
import { cn } from "@/lib/utils";

const horizons: ForecastHorizon[] = [7, 14, 30];

export default function ClimateIntelligencePage() {
  const { t, language } = useTranslation();
  const { location, hydrated } = useAppState();
  const [horizon, setHorizon] = useState<ForecastHorizon>(14);

  if (!hydrated) return null;
  const block = getBlock(location.blockId);
  if (!block) return null;
  const forecast = getForecast(block.id, horizon);

  const horizonLabel = { 7: t("common.day7"), 14: t("common.day14"), 30: t("common.day30") }[horizon];

  // Find dry-spell and heavy-rain windows for chart annotations
  const dryStart = forecast.rainfallTrend.find((p) => p.expectedMm < 3)?.day;
  const heavyStart = forecast.rainfallTrend.find((p) => p.expectedMm > 15)?.day;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <PrototypeTag />
      <div className="mt-4">
        <p className="text-sm font-semibold uppercase tracking-wider text-[var(--color-forest)]">
          {language === "mr" ? block.nameMr : block.name}, {location.districtName}
        </p>
        <h1 className="mt-2 font-display text-4xl leading-tight text-[var(--color-ink)] sm:text-5xl">
          {t("climatePage.title")}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--color-ink)]/60">
          {t("climatePage.subtitle")}
        </p>
      </div>

      {/* Horizon selector */}
      <div className="mt-6 inline-flex rounded-full border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-1 shadow-[var(--shadow-sm)]">
        {horizons.map((h) => (
          <button
            key={h}
            onClick={() => setHorizon(h)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200",
              horizon === h
                ? "bg-[var(--color-forest)] text-white shadow-[var(--shadow-sm)]"
                : "text-[var(--color-ink)]/65 hover:text-[var(--color-ink)]"
            )}
          >
            {t(`common.day${h}` as "common.day7")}
          </button>
        ))}
      </div>

      {/* ── Dominant Metric: Monsoon Onset ──────────────── */}
      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        <div className="sm:col-span-1">
          <ProbabilityCard
            label={t("climatePage.onsetProbability")}
            value={forecast.monsoonOnsetProbability}
            accent="forest"
          />
        </div>
        <div className="sm:col-span-1">
          <ProbabilityCard
            label={t("climatePage.drySpellRisk")}
            value={forecast.drySpellProbability}
            accent="amber"
          />
        </div>
        <div className="sm:col-span-1">
          <ProbabilityCard
            label={t("climatePage.heavyRainRisk")}
            value={forecast.heavyRainProbability}
            accent="sky"
          />
        </div>
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-5 transition-shadow hover:shadow-[var(--shadow-md)]">
          <p className="text-sm font-medium text-[var(--color-ink)]/65">{t("common.confidence")}</p>
          <p className="mt-3 font-display text-3xl capitalize text-[var(--color-ink)]">
            {t(`common.${forecast.confidence}`)}
          </p>
          <p className="mt-3 text-xs text-[var(--color-ink)]/45">{t("common.demoData")}</p>
        </div>
      </div>

      {/* ── Rainfall Chart (Large, Dominant) ────────────── */}
      <div className="mt-8 rounded-3xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-6 shadow-[var(--shadow-sm)]">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-[var(--color-ink)]/70">
            {t("climatePage.rainfallTrend")} · {horizonLabel}
          </p>
          <span className="rounded-full bg-[var(--color-sky)]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[var(--color-sky)]">
            {t("climatePage.mm")}
          </span>
        </div>
        <div className="mt-4 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecast.rainfallTrend}>
              <defs>
                <linearGradient id="rainFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-sky)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--color-sky)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--color-line)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: "var(--color-ink)", opacity: 0.5 }}
                stroke="var(--color-line)"
                tickLine={false}
                axisLine={{ strokeOpacity: 0.3 }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--color-ink)", opacity: 0.5 }}
                stroke="var(--color-line)"
                unit="mm"
                width={45}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  borderColor: "var(--color-line)",
                  fontSize: 12,
                  boxShadow: "var(--shadow-md)",
                }}
                formatter={(v) => [`${v ?? ""} ${t("climatePage.mm")}`, ""]}
              />
              {/* Normal range band */}
              <Area type="monotone" dataKey="upperMm" stroke="none" fill="url(#rainFill)" />
              {/* Expected line */}
              <Area
                type="monotone"
                dataKey="expectedMm"
                stroke="var(--color-sky)"
                strokeWidth={2.5}
                fill="none"
                dot={false}
              />
              {/* Lower bound */}
              <Area
                type="monotone"
                dataKey="lowerMm"
                stroke="var(--color-sky)"
                strokeOpacity={0.3}
                strokeDasharray="4 3"
                fill="none"
                dot={false}
              />
              {/* Event markers */}
              {dryStart && (
                <ReferenceLine
                  x={dryStart}
                  stroke="var(--color-amber)"
                  strokeDasharray="4 4"
                  strokeOpacity={0.6}
                  label={{
                    value: t("farmer.timelineDry"),
                    position: "top",
                    fill: "var(--color-amber)",
                    fontSize: 10,
                  }}
                />
              )}
              {heavyStart && (
                <ReferenceLine
                  x={heavyStart}
                  stroke="var(--color-clay)"
                  strokeDasharray="4 4"
                  strokeOpacity={0.6}
                  label={{
                    value: t("farmer.timelineHeavy"),
                    position: "top",
                    fill: "var(--color-clay)",
                    fontSize: 10,
                  }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Temperature (Secondary) ──────────────────────── */}
      <div className="mt-6 rounded-3xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-6 shadow-[var(--shadow-sm)]">
        <p className="text-sm font-semibold text-[var(--color-ink)]/70">
          {t("climatePage.temperatureTrend")}
        </p>
        <div className="mt-4 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={forecast.temperatureTrendC.map((v, i) => ({ i, v }))}>
              <CartesianGrid stroke="var(--color-line)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="i"
                tick={{ fontSize: 11, fill: "var(--color-ink)", opacity: 0.5 }}
                stroke="var(--color-line)"
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--color-ink)", opacity: 0.5 }}
                stroke="var(--color-line)"
                unit="°C"
                width={40}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  borderColor: "var(--color-line)",
                  fontSize: 12,
                  boxShadow: "var(--shadow-md)",
                }}
              />
              <Line
                type="monotone"
                dataKey="v"
                stroke="var(--color-clay)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Climate Signals ──────────────────────────────── */}
      <div className="mt-8 rounded-3xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-6 shadow-[var(--shadow-sm)]">
        <p className="text-sm font-semibold text-[var(--color-ink)]/70">
          {t("climatePage.climateSignals")}
        </p>
        <p className="mt-1 text-xs text-[var(--color-ink)]/45">
          {t("climatePage.signalsExplanation")}
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {forecast.signals.map((s) => (
            <ClimateSignalCard
              key={s.id}
              name={t(s.labelKey)}
              value={s.value}
              strength={s.value as "Primary" | "Contributing"}
              explanation={t(`farmer.signalExplanation.${s.descriptionKey.split('.').pop()}`)}
            />
          ))}
        </div>
      </div>

      <p className="mt-6 text-xs text-[var(--color-ink)]/40">
        {t("climatePage.lastUpdated", { date: forecast.updatedAt })}
      </p>
    </div>
  );
}
