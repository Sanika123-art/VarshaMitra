"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CloudRain,
  Droplets,
  Sprout,
  MapPinned,
  AlertTriangle,
  ChevronDown,
  ArrowRight,
  Eye,
  Shield,
  Thermometer,
  Wind,
} from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { useAppState } from "@/hooks/useAppState";
import { getBlock } from "@/data/locations";
import { getForecast } from "@/data/climate";
import { getCrop } from "@/data/crops";
import { deriveAdvisory } from "@/data/advisories";
import { alertsForBlock } from "@/data/officer";
import RiskBadge from "@/components/RiskBadge";
import { riskLabelKey } from "@/lib/utils";
import { PrototypeTag, ForecastTimeline, ClimateSignalCard, AlertCard } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { RainfallPoint } from "@/types";

export default function FarmerDashboard() {
  const { t, language } = useTranslation();
  const { location, cropId, stageId, hydrated } = useAppState();
  const [whyOpen, setWhyOpen] = useState(false);

  if (!hydrated) return null;

  const block = getBlock(location.blockId);
  if (!block) return null;
  const forecast = getForecast(block.id, 14);
  const crop = getCrop(cropId);
  const stage = crop?.stages.find((s) => s.id === stageId);
  const advisory = deriveAdvisory(block.id, cropId, stageId);
  const alerts = alertsForBlock(block.id);

  const headline = t(
    `advisoryTemplates.${advisory.concern}.${advisory.isSowing ? "headlineSowing" : "headlineOther"}`,
    { crop: t(advisory.cropNameKey), stage: t(advisory.stageNameKey) }
  );
  const reason = t(
    `advisoryTemplates.${advisory.concern}.${advisory.isSowing ? "reasonSowing" : "reasonOther"}`,
    { crop: t(advisory.cropNameKey), stage: t(advisory.stageNameKey) }
  );
  const water = t(`advisoryTemplates.${advisory.concern}.water`);

  // Build timeline data from forecast
  const timelineData = forecast.rainfallTrend.map((point: RainfallPoint) => ({
    day: point.day,
    rain: point.expectedMm,
    type: (point.expectedMm > 15
      ? "heavy"
      : point.expectedMm < 3
        ? "dry"
        : "normal") as "normal" | "dry" | "heavy" | "moderate",
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <PrototypeTag />

      {/* ── Greeting ─────────────────────────────────────── */}
      <h1 className="mt-4 font-display text-4xl text-[var(--color-ink)] sm:text-5xl">
        {t("farmer.goodMorning")}
      </h1>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-forest)]/8 px-3 py-1 text-sm font-medium text-[var(--color-forest-dark)]">
          <MapPinned size={13} />
          {language === "mr" ? block.nameMr : block.name}, {location.districtName}
        </span>
        {crop && stage && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-forest)]/8 px-3 py-1 text-sm font-medium text-[var(--color-forest-dark)]">
            <Sprout size={13} />
            {t(crop.nameKey)} · {t(stage.nameKey)}
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-[var(--color-ink)]/55">
        {t("farmer.outlookFor", { days: 14 })}
      </p>

      {/* ── TODAY'S DECISION — The Hero ───────────────────── */}
      <div className="mt-8 rounded-3xl border border-[var(--color-forest)]/20 bg-gradient-to-br from-[var(--color-forest-light)] to-[var(--color-paper-raised)] p-6 shadow-[var(--shadow-md)] sm:p-8">
        <div className="flex items-center gap-2 text-[var(--color-forest)]">
          <Shield size={18} />
          <span className="text-xs font-bold uppercase tracking-wider">
            {t("farmer.todaysDecision")}
          </span>
        </div>

        <h2 className="mt-4 font-display text-2xl leading-snug text-[var(--color-forest-dark)] sm:text-3xl">
          {headline}
        </h2>

        <button
          onClick={() => setWhyOpen((v) => !v)}
          className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-[var(--color-forest)] transition-colors hover:text-[var(--color-forest-dark)]"
        >
          <ChevronDown
            size={16}
            className={cn("transition-transform duration-200", whyOpen && "rotate-180")}
          />
          {t("farmer.whyRecommendation")}
        </button>

        <div
          className={cn(
            "overflow-hidden transition-all duration-300",
            whyOpen ? "mt-3 max-h-40 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-ink)]/65">
            {reason}
          </p>
        </div>

        <div className="mt-5 rounded-2xl bg-[var(--color-sky)]/8 border border-[var(--color-sky)]/15 px-4 py-3 text-sm text-[var(--color-sky)]">
          <span className="font-semibold">{t("farmer.waterAction")}:</span> {water}
        </div>

        <Link
          href="/farmer/advisory"
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--color-forest)] px-5 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition-all hover:bg-[var(--color-forest-dark)] hover:shadow-[var(--shadow-md)]"
        >
          {t("farmer.viewAdvisory")}
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* ── 14-Day Forecast Timeline ─────────────────────── */}
      <div className="mt-6">
        <ForecastTimeline
          data={timelineData}
          labels={{
            title: t("farmer.forecastTimeline"),
            rain: t("farmer.timelineRain"),
            dry: t("farmer.timelineDry"),
            heavy: t("farmer.timelineHeavy"),
          }}
        />
      </div>

      {/* ── Risk Overview ────────────────────────────────── */}
      <div className="mt-6 rounded-3xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-6 shadow-[var(--shadow-sm)] sm:p-8">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-[var(--color-ink)]/65">
            {t("farmer.overallRisk")}
          </p>
          <RiskBadge risk={block.risk} label={t(riskLabelKey[block.risk])} size="lg" />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <RiskFactor
            icon={CloudRain}
            label={t("farmer.monsoonCard")}
            value={forecast.monsoonOnsetProbability}
            unit="%"
            color="var(--color-forest)"
            detail={t("farmer.monsoonLikely")}
          />
          <RiskFactor
            icon={Droplets}
            label={t("climatePage.drySpellRisk")}
            value={forecast.drySpellProbability}
            unit="%"
            color="var(--color-amber)"
          />
          <RiskFactor
            icon={CloudRain}
            label={t("climatePage.heavyRainRisk")}
            value={forecast.heavyRainProbability}
            unit="%"
            color="var(--color-clay)"
          />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* ── Climate Signals ────────────────────────────── */}
        <div className="rounded-3xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-6 shadow-[var(--shadow-sm)]">
          <div className="flex items-center gap-2">
            <Eye size={16} className="text-[var(--color-forest)]" />
            <p className="text-sm font-semibold text-[var(--color-ink)]/70">
              {t("farmer.whyForecast")}
            </p>
          </div>
          <div className="mt-4 space-y-2">
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

        {/* ── Alerts ─────────────────────────────────────── */}
        <div className="rounded-3xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-6 shadow-[var(--shadow-sm)]">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-[var(--color-clay)]" />
            <p className="text-sm font-semibold text-[var(--color-ink)]/70">
              {t("farmer.watchForTitle")}
            </p>
          </div>
          {alerts.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--color-ink)]/50">{t("farmer.noAlerts")}</p>
          ) : (
            <div className="mt-4 space-y-2">
              {alerts.map((a) => (
                <AlertCard
                  key={a.id}
                  severity={a.severity}
                  title={t(a.titleKey)}
                  time={t("farmer.hoursAgo", { h: a.timeAgoHours })}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Actions ────────────────────────────────── */}
      <div className="mt-6">
        <p className="mb-3 text-sm font-semibold text-[var(--color-ink)]/60">
          {t("farmer.quickActions")}
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <QuickAction href="/farmer/climate" label={t("farmer.checkClimate")} icon={CloudRain} />
          <QuickAction href="/farmer/risk-map" label={t("farmer.viewRiskMap")} icon={MapPinned} />
          <QuickAction href="/farmer/crop" label={t("farmer.updateCrop")} icon={Sprout} />
          <QuickAction href="/farmer/advisory" label={t("farmer.viewAdvisory")} icon={Shield} />
        </div>
      </div>
    </div>
  );
}

/* ── Risk Factor Card ─────────────────────────────────────────── */

function RiskFactor({
  icon: Icon,
  label,
  value,
  unit,
  color,
  detail,
}: {
  icon: typeof CloudRain;
  label: string;
  value: number;
  unit: string;
  color: string;
  detail?: string;
}) {
  return (
    <div className="rounded-2xl bg-[var(--color-paper)] p-4 border border-[var(--color-line)]/50">
      <div className="flex items-center gap-2">
        <Icon size={15} style={{ color }} />
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink)]/50">
          {label}
        </span>
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="tabular font-display text-3xl" style={{ color }}>
          {value}
        </span>
        <span className="text-sm text-[var(--color-ink)]/45">{unit}</span>
      </div>
      {/* Mini bar */}
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-line)]/40">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${Math.min(100, value)}%`, backgroundColor: color }}
        />
      </div>
      {detail && (
        <p className="mt-2 text-xs text-[var(--color-ink)]/50">{detail}</p>
      )}
    </div>
  );
}

/* ── Quick Action ─────────────────────────────────────────────── */

function QuickAction({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: typeof CloudRain;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col items-center gap-2 rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] px-3 py-4 text-center text-sm font-medium text-[var(--color-ink)]/75 transition-all hover:border-[var(--color-forest)]/40 hover:shadow-[var(--shadow-sm)]"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-forest)]/8 text-[var(--color-forest)] transition-transform group-hover:scale-110">
        <Icon size={16} />
      </span>
      {label}
    </Link>
  );
}
