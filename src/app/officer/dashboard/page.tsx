"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, ChevronRight, Shield, MapPin, BarChart3, Activity } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { regionRiskCounts, highRiskLocations, cropExposure, alerts } from "@/data/officer";
import { getBlock } from "@/data/locations";
import { getForecast } from "@/data/climate";
import { deriveAdvisory } from "@/data/advisories";
import { PrototypeTag, SectionHeading, AlertCard } from "@/components/ui";
import RiskBadge from "@/components/RiskBadge";
import { riskLabelKey } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function OfficerDashboard() {
  const { t, language } = useTranslation();
  const counts = regionRiskCounts();
  const locations = highRiskLocations();
  const [inspectId, setInspectId] = useState<string | null>(locations[0]?.blockId ?? null);
  const inspectBlock = inspectId ? getBlock(inspectId) : undefined;
  const inspectForecast = inspectBlock ? getForecast(inspectBlock.id, 14) : null;
  const inspectAdvisory = inspectBlock ? deriveAdvisory(inspectBlock.id, "soybean", "sowing") : null;

  const total = counts.critical + counts.high + counts.moderate + counts.low;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <PrototypeTag />
      <div className="mt-4">
        <p className="text-sm font-semibold uppercase tracking-wider text-[var(--color-sky)]">
          {t("login.roleOfficer")}
        </p>
        <h1 className="mt-2 font-display text-4xl leading-tight text-[var(--color-ink)] sm:text-5xl">
          {t("officer.dashboardTitle")}
        </h1>
      </div>

      {/* ── Risk Distribution Bar ──────────────────────────── */}
      <div className="mt-8 rounded-3xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-6 shadow-[var(--shadow-sm)]">
        <div className="flex items-center gap-2">
          <BarChart3 size={16} className="text-[var(--color-ink)]/45" />
          <p className="text-sm font-semibold text-[var(--color-ink)]/70">
            {t("officer.riskDistribution")}
          </p>
        </div>

        {/* Visual bar */}
        <div className="mt-4 flex h-10 overflow-hidden rounded-xl">
          {[
            { count: counts.critical, color: "var(--color-critical)", label: t("common.riskCritical") },
            { count: counts.high, color: "var(--color-clay)", label: t("common.riskHigh") },
            { count: counts.moderate, color: "var(--color-amber)", label: t("common.riskModerate") },
            { count: counts.low, color: "var(--color-moss)", label: t("common.riskLow") },
          ].map((seg) => (
            <div
              key={seg.label}
              className="flex items-center justify-center text-xs font-bold text-white transition-all duration-500"
              style={{
                width: `${(seg.count / total) * 100}%`,
                backgroundColor: seg.color,
                minWidth: seg.count > 0 ? "2rem" : "0",
              }}
            >
              {seg.count > 0 && seg.count}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-[var(--color-ink)]/55">
          {[
            { count: counts.critical, label: t("officer.criticalRiskBlocks"), color: "var(--color-critical)" },
            { count: counts.high, label: t("officer.highRiskBlocks"), color: "var(--color-clay)" },
            { count: counts.moderate, label: t("officer.moderateRiskBlocks"), color: "var(--color-amber)" },
            { count: counts.low, label: t("common.riskLow"), color: "var(--color-moss)" },
          ].map((item) => (
            <span key={item.label} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="font-semibold" style={{ color: item.color }}>{item.count}</span>
              {item.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Main content grid ──────────────────────────────── */}
      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* High risk locations list */}
        <div className="rounded-3xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-6 shadow-[var(--shadow-sm)] lg:col-span-2">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-[var(--color-clay)]" />
            <p className="text-sm font-semibold text-[var(--color-ink)]/70">
              {t("officer.highRiskLocations")}
            </p>
          </div>
          <ul className="mt-4 space-y-1">
            {locations.map((loc) => (
              <li key={loc.blockId}>
                <button
                  onClick={() => setInspectId(loc.blockId)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left text-sm transition-all",
                    inspectId === loc.blockId
                      ? "bg-[var(--color-forest)]/10 shadow-[var(--shadow-sm)]"
                      : "hover:bg-[var(--color-paper)]"
                  )}
                >
                  <span>
                    <span className="font-semibold text-[var(--color-ink)]">
                      {language === "mr" ? loc.blockNameMr : loc.blockName}
                    </span>
                    <span className="ml-1.5 text-xs text-[var(--color-ink)]/45">{loc.districtName}</span>
                  </span>
                  <RiskBadge risk={loc.risk} label={t(riskLabelKey[loc.risk])} size="sm" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Inspect panel */}
        <div className="rounded-3xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-6 shadow-[var(--shadow-sm)] lg:col-span-3">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-[var(--color-forest)]" />
            <p className="text-sm font-semibold text-[var(--color-ink)]/70">{t("officer.inspectBlock")}</p>
          </div>
          {inspectBlock && inspectForecast && inspectAdvisory ? (
            <div className="mt-4 slide-up">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-2xl text-[var(--color-ink)]">
                  {language === "mr" ? inspectBlock.nameMr : inspectBlock.name}
                </h3>
                <RiskBadge risk={inspectBlock.risk} label={t(riskLabelKey[inspectBlock.risk])} />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2.5 text-center">
                <MiniStat value={`${inspectForecast.monsoonOnsetProbability}%`} label={t("climatePage.onsetProbability")} />
                <MiniStat value={`${inspectForecast.drySpellProbability}%`} label={t("climatePage.drySpellRisk")} />
                <MiniStat value={`${inspectForecast.heavyRainProbability}%`} label={t("climatePage.heavyRainRisk")} />
              </div>
              <div className="mt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink)]/50">
                  {t("officer.riskDrivers")}
                </p>
                <ul className="mt-2 space-y-1.5">
                  {inspectBlock.riskDrivers.map((d) => (
                    <li key={d} className="flex items-start gap-2 text-sm text-[var(--color-ink)]/60">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-clay)]" />
                      {t(`riskDrivers.${d}`)}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-4 rounded-xl bg-[var(--color-forest)]/8 border border-[var(--color-forest)]/15 px-4 py-3 text-sm">
                <span className="font-bold text-[var(--color-forest-dark)]">
                  {t("officer.recommendedAction")}:
                </span>{" "}
                <span className="text-[var(--color-ink)]/70">
                  {t(
                    `advisoryTemplates.${inspectAdvisory.concern}.headlineSowing`,
                    { crop: t(inspectAdvisory.cropNameKey), stage: t(inspectAdvisory.stageNameKey) }
                  )}
                </span>
              </div>
              <Link
                href="/officer/risk-map"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-forest)] transition-colors hover:text-[var(--color-forest-dark)]"
              >
                {t("nav.riskMap")}
                <ChevronRight size={14} />
              </Link>
            </div>
          ) : (
            <p className="mt-4 text-sm text-[var(--color-ink)]/50">{t("riskMapPage.selectPrompt")}</p>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Crop exposure */}
        <div className="rounded-3xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-6 shadow-[var(--shadow-sm)]">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-[var(--color-amber)]" />
            <p className="text-sm font-semibold text-[var(--color-ink)]/70">{t("officer.cropExposure")}</p>
          </div>
          <ul className="mt-4 space-y-3">
            {cropExposure.map((c) => (
              <li key={c.cropKey} className="flex items-center justify-between text-sm">
                <span className="font-medium text-[var(--color-ink)]/80">{t(c.cropKey)}</span>
                <span className="flex items-center gap-2.5">
                  <span className="text-xs text-[var(--color-ink)]/45">{c.exposedBlocks} blocks</span>
                  <RiskBadge risk={c.riskWeighted} label={t(riskLabelKey[c.riskWeighted])} size="sm" />
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Climate alerts */}
        <div className="rounded-3xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-6 shadow-[var(--shadow-sm)]">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-[var(--color-clay)]" />
            <p className="text-sm font-semibold text-[var(--color-ink)]/70">{t("officer.climateAlerts")}</p>
          </div>
          <div className="mt-4 space-y-2">
            {alerts.map((a) => {
              const b = getBlock(a.blockId);
              return (
                <AlertCard
                  key={a.id}
                  severity={a.severity}
                  title={t(a.titleKey)}
                  location={b ? (language === "mr" ? b.nameMr : b.name) : ""}
                  time={t("farmer.hoursAgo", { h: a.timeAgoHours })}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Data status */}
      <div className="mt-6 rounded-3xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-6 shadow-[var(--shadow-sm)]">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[var(--color-moss)] animate-pulse" />
          <p className="text-sm font-semibold text-[var(--color-ink)]/70">{t("officer.dataStatus")}</p>
        </div>
        <div className="mt-3 flex flex-col gap-1.5 text-sm text-[var(--color-ink)]/55 sm:flex-row sm:gap-6">
          <span>{t("officer.modelStatus")}</span>
          <span>{t("officer.dataFeedStatus")}</span>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl bg-[var(--color-paper)] border border-[var(--color-line)]/50 p-3">
      <p className="tabular font-display text-xl text-[var(--color-ink)]">{value}</p>
      <p className="mt-0.5 text-[10px] leading-tight text-[var(--color-ink)]/50">{label}</p>
    </div>
  );
}
