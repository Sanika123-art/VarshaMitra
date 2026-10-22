"use client";

import { useState, useEffect } from "react";
import { CloudRain, Thermometer, Wind, Droplets, Info, RefreshCw } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { useAppState } from "@/hooks/useAppState";
import { getBlock, getDistrict } from "@/data/locations";
import { getForecast } from "@/data/climate";
import type { ForecastHorizon } from "@/types";
import { pickName } from "@/lib/utils";
import { photos } from "@/data/media";
import {
  api,
  type ForecastSeries,
  type ClimateIndicatorsResponse,
} from "@/lib/api";
import {
  PageHeader,
  MetaChip,
  Card,
  CardHeader,
  DataStatus,
  ProbabilityMeter,
  Photo,
} from "@/components/ui";
import {
  RainfallForecastChart,
  RainfallBars,
  TemperatureChart,
} from "@/features/charts/RainfallCharts";

const horizons: ForecastHorizon[] = [7, 14, 30];

export default function ClimateIntelligencePage() {
  const { t, language } = useTranslation();
  const { location, hydrated } = useAppState();
  const [horizon, setHorizon] = useState<ForecastHorizon>(14);

  // Live state
  const [liveForecast, setLiveForecast] = useState<ForecastSeries | null>(null);
  const [liveIndicators, setLiveIndicators] = useState<ClimateIndicatorsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hydrated || !location.blockId) return;

    let active = true;
    setLoading(true);

    // Backend forecast supports 1 to 14 days
    const clampedDays = Math.min(horizon, 14);

    Promise.allSettled([
      api.getForecast(location.blockId, clampedDays),
      api.getClimateIndicators(location.blockId, clampedDays),
    ]).then(([fcRes, indRes]) => {
      if (!active) return;
      if (fcRes.status === "fulfilled") setLiveForecast(fcRes.value);
      if (indRes.status === "fulfilled") setLiveIndicators(indRes.value);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [hydrated, location.blockId, horizon]);

  if (!hydrated) return null;
  const block = getBlock(location.blockId);
  if (!block) return null;
  const district = getDistrict(block.districtId);
  const fallbackFc = getForecast(block.id, horizon);

  const blockName = pickName(block, language);
  const districtName = district ? pickName(district, language) : "";

  // Process forecast points from live API or fallback
  const forecastPoints = liveForecast && liveForecast.forecast.length > 0
    ? liveForecast.forecast.map((f, idx) => ({
        day: idx + 1,
        expectedMm: f.precipitation_sum_mm,
        lowerMm: Math.max(0, Number((f.precipitation_sum_mm * 0.75).toFixed(1))),
        upperMm: Number((f.precipitation_sum_mm * 1.3).toFixed(1)),
      }))
    : fallbackFc.rainfallTrend;

  // Temperature trend from live API or realistic default
  const temperatures = liveForecast && liveForecast.forecast.length > 0
    ? liveForecast.forecast.map((f) => f.temperature_max_c ?? (27 + (f.forecast_day_index % 4)))
    : forecastPoints.map((p) => 26 + (p.day % 5) * 1.2);

  // Probability calculations
  const onsetValue = liveIndicators?.monsoon_onset?.onset_detected ? 100 : fallbackFc.monsoonOnsetProbability;
  const drySpellValue = liveIndicators
    ? (liveIndicators.dry_spell.severity === "critical" ? 95 : liveIndicators.dry_spell.severity === "significant" ? 75 : 25)
    : fallbackFc.drySpellProbability;
  const heavyRainValue = liveIndicators?.heavy_rain?.has_heavy_rain_event ? 90 : fallbackFc.heavyRainProbability;

  const currentProvider = liveForecast
    ? `${liveForecast.provider.provider_name} (${liveForecast.provider.dataset_name}, ${liveForecast.provider.spatial_resolution})`
    : undefined;

  return (
    <div className="space-y-6">
      {/* ── Page Header ────────────────────────────────────── */}
      <PageHeader
        eyebrow={t("climatePage.eyebrow")}
        title={t("climatePage.title")}
        description={t("climatePage.subtitle")}
        actions={
          <div className="flex items-center rounded-lg border border-line bg-surface p-1">
            <span className="px-2.5 text-xs font-semibold text-ink-muted">
              {t("climatePage.horizon")}:
            </span>
            {horizons.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setHorizon(h)}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                  horizon === h
                    ? "bg-forest text-white"
                    : "text-ink-muted hover:bg-paper-deep hover:text-ink"
                }`}
              >
                {t(`common.day${h}`)}
              </button>
            ))}
          </div>
        }
      >
        <MetaChip>{districtName}</MetaChip>
        <MetaChip>{blockName}</MetaChip>
        <MetaChip>
          {t("climatePage.horizonSelected", { days: horizon })}
        </MetaChip>
        {loading ? (
          <div className="ml-auto flex items-center gap-1.5 text-xs text-ink-muted">
            <RefreshCw size={13} className="animate-spin text-forest" />
            <span>Loading...</span>
          </div>
        ) : liveForecast ? (
          <span className="ml-auto inline-flex items-center rounded-full bg-forest-soft px-2.5 py-0.5 text-[11px] font-semibold text-forest">
            Live Open-Meteo
          </span>
        ) : null}
      </PageHeader>

      {/* ── Provenance Banner ───────────────────────────────── */}
      <DataStatus
        kind="forecast"
        date={liveForecast?.forecast_generated_at ?? fallbackFc.updatedAt}
      />

      {/* ── Key Probability Meters ──────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <ProbabilityMeter
          label={t("climatePage.onsetProbability")}
          value={onsetValue}
          accent="forest"
          definition={t("climate.definitions.onset")}
          footnote={t("climate.footnotes.onset")}
        />
        <ProbabilityMeter
          label={t("climatePage.drySpellRisk")}
          value={drySpellValue}
          accent="earth"
          definition={t("climate.definitions.drySpell")}
          footnote={liveIndicators ? `Current streak: ${liveIndicators.dry_spell.current_consecutive_dry_days} days` : t("climate.footnotes.drySpell")}
        />
        <ProbabilityMeter
          label={t("climatePage.heavyRainRisk")}
          value={heavyRainValue}
          accent="monsoon"
          definition={t("climate.definitions.heavyRain")}
          footnote={t("climate.footnotes.heavyRain")}
        />
      </div>

      {/* ── Rainfall Forecast Chart with Uncertainty Band ──── */}
      <Card tone="default">
        <CardHeader
          icon={CloudRain}
          title={t("climatePage.rainfallOutlook")}
          description={t("climatePage.rainfallOutlookSubtitle", { days: horizon })}
        />
        <div className="mt-5">
          <RainfallForecastChart points={forecastPoints} height={320} />
        </div>
      </Card>

      {/* ── Daily Rainfall Classification & Temperature ─────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card tone="default">
          <CardHeader
            icon={Droplets}
            title={t("climatePage.dailyRainfallDistribution")}
            description={t("climatePage.dailyRainfallDistributionSubtitle")}
          />
          <div className="mt-4">
            <RainfallBars points={forecastPoints} height={200} />
          </div>
        </Card>

        <Card tone="default">
          <CardHeader
            icon={Thermometer}
            title={t("climatePage.temperatureTrend")}
            description={t("climatePage.temperatureTrendSubtitle")}
          />
          <div className="mt-4">
            <TemperatureChart
              values={temperatures}
              height={200}
            />
          </div>
        </Card>
      </div>

      {/* ── Contextual Meteorological Insight & Imagery ────── */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="overflow-hidden rounded-lg border border-line bg-surface">
            <Photo
              src={photos.monsoonFarms.src}
              alt={t("media.monsoonFarms")}
              sizes="(max-width: 1024px) 100vw, 400px"
              className="aspect-[16/10] w-full"
            />
            <div className="p-4 text-xs leading-relaxed text-ink-muted">
              <p className="font-semibold text-ink">{t("media.monsoonFarms")}</p>
              <p className="mt-1">{t("climatePage.cloudsContextNote")}</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-4">
          <Card tone="muted">
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-forest-soft text-forest">
                <Wind size={16} aria-hidden />
              </span>
              <div>
                <h3 className="font-serif text-base font-semibold text-ink">
                  {t("climatePage.synopticSignalsTitle")}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                  {t("climatePage.synopticSignalsBody")}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded bg-surface px-2.5 py-1 font-semibold text-ink border border-line">
                    ENSO: Neutral / La Niña leaning
                  </span>
                  <span className="rounded bg-surface px-2.5 py-1 font-semibold text-ink border border-line">
                    IOD: Positive phase
                  </span>
                  <span className="rounded bg-surface px-2.5 py-1 font-semibold text-ink border border-line">
                    MJO: Active Phase 3
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <Card tone="muted">
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-monsoon-soft text-monsoon">
                <Info size={16} aria-hidden />
              </span>
              <div>
                <h3 className="font-serif text-base font-semibold text-ink">
                  {t("climatePage.uncertaintyNoteTitle")}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                  {t("climatePage.uncertaintyNoteBody")}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
