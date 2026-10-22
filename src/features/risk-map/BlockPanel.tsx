"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, ArrowRight, ShieldCheck } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import type { Block, RiskLevel } from "@/types";
import { getDistrict } from "@/data/locations";
import { getForecast } from "@/data/climate";
import RiskBadge from "@/components/RiskBadge";
import { riskLabelKey } from "@/lib/utils";
import { api, type RiskAssessmentResponse, type ForecastSeries } from "@/lib/api";

export default function BlockPanel({ block, onClose }: { block: Block; onClose: () => void }) {
  const { t, language } = useTranslation();
  const district = getDistrict(block.districtId);
  const fallbackForecast = getForecast(block.id, 14);

  const [liveRisk, setLiveRisk] = useState<RiskAssessmentResponse | null>(null);
  const [liveForecast, setLiveForecast] = useState<ForecastSeries | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadLiveData() {
      try {
        const [rRes, fRes] = await Promise.allSettled([
          api.getClimateRisk(block.id),
          api.getForecast(block.id, 14),
        ]);

        if (cancelled) return;
        if (rRes.status === "fulfilled") setLiveRisk(rRes.value);
        if (fRes.status === "fulfilled") setLiveForecast(fRes.value);
      } catch {
        // Fallback remains active
      }
    }

    loadLiveData();
    return () => {
      cancelled = true;
    };
  }, [block.id]);

  const activeRisk: RiskLevel =
    liveRisk?.overall_risk && liveRisk.overall_risk !== "insufficient_data"
      ? liveRisk.overall_risk
      : block.risk;
  const onsetProb = liveRisk
    ? Math.round((liveRisk.evidence_summary?.monsoon_onset?.onset_probability || 0.72) * 100)
    : fallbackForecast.monsoonOnsetProbability;
  const drySpellProb = liveRisk
    ? Math.round((liveRisk.evidence_summary?.dry_spell?.dry_spell_probability || 0.65) * 100)
    : fallbackForecast.drySpellProbability;
  const heavyRainProb = liveRisk
    ? Math.round((liveRisk.evidence_summary?.heavy_rain?.heavy_rain_probability || 0.20) * 100)
    : fallbackForecast.heavyRainProbability;

  return (
    <div className="absolute inset-x-3 bottom-3 z-[500] slide-up rounded-3xl border border-[var(--color-line)] bg-[var(--color-paper)]/95 p-6 shadow-[var(--shadow-xl)] backdrop-blur-md sm:inset-auto sm:right-4 sm:top-4 sm:bottom-4 sm:w-80 sm:slide-in-right sm:overflow-y-auto">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full p-1.5 text-[var(--color-ink)]/40 transition-colors hover:bg-[var(--color-paper-raised)] hover:text-[var(--color-ink)]"
        aria-label={t("common.close")}
      >
        <X size={16} />
      </button>

      {/* Location */}
      <div className="flex items-center justify-between pr-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink)]/45">
          {district ? (language === "mr" ? district.nameMr : district.name) : ""}
        </p>
        {liveRisk && (
          <span className="flex items-center gap-1 rounded-full bg-forest-soft px-2 py-0.5 text-[10px] font-semibold text-forest">
            <span className="h-1.5 w-1.5 rounded-full bg-forest" />
            Live Engine
          </span>
        )}
      </div>
      <h3 className="mt-1 font-display text-2xl text-[var(--color-ink)]">
        {language === "mr" ? block.nameMr : block.name}
      </h3>

      {/* Risk */}
      <div className="mt-3">
        <RiskBadge risk={activeRisk} label={t(riskLabelKey[activeRisk])} size="md" />
      </div>

      {/* Metrics */}
      <div className="mt-5 grid grid-cols-3 gap-2">
        <MiniMetric label={t("climatePage.onsetProbability")} value={`${onsetProb}%`} />
        <MiniMetric label={t("climatePage.drySpellRisk")} value={`${drySpellProb}%`} />
        <MiniMetric label={t("climatePage.heavyRainRisk")} value={`${heavyRainProb}%`} />
      </div>

      {/* Agricultural Impact */}
      <div className="mt-4 rounded-xl bg-[var(--color-amber)]/8 border border-[var(--color-amber)]/15 px-3 py-2 text-sm">
        <span className="text-xs font-semibold text-[var(--color-amber)]">
          {t("riskMapPage.agriculturalImpact")}
        </span>
        <p className="mt-0.5 font-medium text-[var(--color-ink)]/80">
          {block.agriculturalImpact}
        </p>
      </div>

      {/* Why at risk */}
      <div className="mt-5">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink)]/50">
          {t("riskMapPage.whyAtRisk")}
        </p>
        <ul className="mt-2.5 space-y-2">
          {liveRisk && liveRisk.risk_drivers.length > 0
            ? liveRisk.risk_drivers.map((driver, idx) => {
                const driverName = driver.name || driver.driver_key || driver.code || "Risk Driver";
                const driverSummary = driver.plain_language_summary || driver.evidence || "";
                return (
                  <li
                    key={driver.code || driver.driver_key || `driver_${idx}`}
                    className="flex items-start gap-2 text-sm leading-snug text-[var(--color-ink)]/65"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-clay)]" />
                    <span>
                      <strong className="capitalize text-ink">
                        {driverName.replace(/_/g, " ")}:
                      </strong>{" "}
                      {driverSummary}
                    </span>
                  </li>
                );
              })
            : block.riskDrivers.map((driver) => (
                <li
                  key={driver}
                  className="flex items-start gap-2 text-sm leading-snug text-[var(--color-ink)]/65"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-clay)]" />
                  {t(`riskDrivers.${driver}`)}
                </li>
              ))}
        </ul>
      </div>

      {/* CTA */}
      <Link
        href="/farmer/advisory"
        className="mt-6 flex items-center justify-center gap-2 rounded-full bg-[var(--color-forest)] py-3 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition-all hover:bg-[var(--color-forest-dark)] hover:shadow-[var(--shadow-md)]"
      >
        {t("riskMapPage.openAdvisory")}
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[var(--color-paper-raised)] border border-[var(--color-line)]/50 p-2.5 text-center">
      <p className="tabular font-display text-lg text-[var(--color-ink)]">{value}</p>
      <p className="mt-0.5 text-[9px] leading-tight text-[var(--color-ink)]/45">{label}</p>
    </div>
  );
}

