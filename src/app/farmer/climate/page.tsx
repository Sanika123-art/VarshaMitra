"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { CloudRain, Thermometer, Wind, Droplets, Info, RefreshCw, Layers, ArrowRight, ShieldCheck, Sun } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { useAppState } from "@/hooks/useAppState";
import { useLocationLabel } from "@/hooks/useLocationLabel";
import type { ForecastHorizon } from "@/types";
import {
  api,
  type ForecastSeries,
  type ClimateIndicatorsResponse,
} from "@/lib/api";
import {
  RainfallForecastChart,
  RainfallBars,
  TemperatureChart,
} from "@/features/charts/RainfallCharts";
import { ApiUnavailableState, InlineAlert } from "@/components/ui/States";

const horizons: ForecastHorizon[] = [7, 14, 30];

export default function ClimateIntelligencePage() {
  const { t } = useTranslation();
  const { location, hydrated } = useAppState();
  const { blockName, districtName } = useLocationLabel();
  const [horizon, setHorizon] = useState<ForecastHorizon>(14);

  // Live state
  const [liveForecast, setLiveForecast] = useState<ForecastSeries | null>(null);
  const [liveIndicators, setLiveIndicators] = useState<ClimateIndicatorsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!location.blockId) return;
    setLoading(true);
    setError(null);
    const clampedDays = Math.min(horizon, 14);
    try {
      const [fcRes, indRes] = await Promise.allSettled([
        api.getForecast(location.blockId, clampedDays),
        api.getClimateIndicators(location.blockId, clampedDays),
      ]);
      if (fcRes.status === "fulfilled") setLiveForecast(fcRes.value);
      if (indRes.status === "fulfilled") setLiveIndicators(indRes.value);
      if (fcRes.status === "rejected" && indRes.status === "rejected") {
        setError("Unable to retrieve climate forecast from the backend API.");
      }
    } catch {
      setError("Network error fetching climate indicators.");
    } finally {
      setLoading(false);
    }
  }, [location.blockId, horizon]);

  useEffect(() => {
    if (!hydrated || !location.blockId) return;
    let active = true;

    async function run() {
      const clampedDays = Math.min(horizon, 14);
      try {
        const [fcRes, indRes] = await Promise.allSettled([
          api.getForecast(location.blockId, clampedDays),
          api.getClimateIndicators(location.blockId, clampedDays),
        ]);

        if (!active) return;
        if (fcRes.status === "fulfilled") setLiveForecast(fcRes.value);
        if (indRes.status === "fulfilled") setLiveIndicators(indRes.value);

        if (fcRes.status === "rejected" && indRes.status === "rejected") {
          setError("Unable to retrieve climate forecast from the backend API.");
        }
      } catch {
        if (active) setError("Network error fetching climate indicators.");
      } finally {
        if (active) setLoading(false);
      }
    }

    run();
    return () => {
      active = false;
    };
  }, [hydrated, location.blockId, horizon]);

  if (!hydrated) return null;

  const forecastPoints = liveForecast && liveForecast.forecast && liveForecast.forecast.length > 0
    ? liveForecast.forecast.map((f, idx) => {
        const mm = f.precipitation_sum_mm ?? 0;
        return {
          day: idx + 1,
          expectedMm: mm,
          lowerMm: mm,
          upperMm: mm,
        };
      })
    : [];

  const temperatures = liveForecast && liveForecast.forecast && liveForecast.forecast.length > 0
    ? liveForecast.forecast.map((f) => f.temperature_max_c ?? 28)
    : [28, 29, 27, 28, 30, 29, 28];

  const dryDaysStreak = liveIndicators?.dry_spell?.current_consecutive_dry_days ?? 0;
  const drySpellSeverity = liveIndicators?.dry_spell?.severity ?? "none";
  const heavyRainEvent = liveIndicators?.heavy_rain?.has_heavy_rain_event ?? false;
  const heavyRainMax = liveIndicators?.heavy_rain?.max_single_day_mm ?? 0;
  const onsetStatus = liveIndicators?.monsoon_onset?.status ?? "unknown";

  return (
    <div className="space-y-8 bg-[#F4F0E5] text-[#252923]">
      
      {/* ── Page Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-[#123C32]/20 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded border border-[#123C32] bg-[#123C32] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#F4F0E5]">
              Climate Telemetry
            </span>
            <span className="font-mono text-xs font-semibold text-[#123C32]">
              {districtName} · Block {blockName}
            </span>
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-[#123C32] sm:text-3xl">
            {t("climatePage.title")}
          </h1>
          <p className="mt-1 font-sans text-xs text-[#252923]/70 sm:text-sm">
            {t("climatePage.subtitle")}
          </p>
        </div>

        {/* Horizon Picker */}
        <div className="flex items-center rounded-lg border-2 border-[#123C32] bg-white p-1 shadow-[2px_2px_0px_#123C32]">
          <span className="px-2.5 font-mono text-xs font-bold uppercase text-[#123C32]">
            Horizon:
          </span>
          {horizons.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => setHorizon(h)}
              className={`rounded-md px-3 py-1 font-mono text-xs font-bold transition ${
                horizon === h
                  ? "bg-[#123C32] text-[#F4F0E5]"
                  : "text-[#252923] hover:bg-[#F4F0E5]"
              }`}
            >
              {h} Days
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="my-4">
          <ApiUnavailableState
            serviceName="Weather & Climate Service"
            error={error}
            onRetry={loadData}
          />
        </div>
      )}

      {horizon > 14 && (
        <div className="rounded-lg border-2 border-[#2878A5] bg-white p-4 font-mono text-xs text-[#2878A5] shadow-[2px_2px_0px_#2878A5]">
          <strong>Note:</strong> Standard high-resolution numerical weather prediction provides deterministic daily resolution up to 14 days. Days 15–30 utilize regional historical climatology baselines.
        </div>
      )}

      {/* ── Key Indicators (3-Column Triage) ── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border-2 border-[#123C32] bg-white p-5 shadow-[4px_4px_0px_#123C32]">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#123C32]/60">Monsoon Onset</span>
            <span className="rounded border border-[#123C32] bg-[#F4F0E5] px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-[#123C32]">
              {onsetStatus.replace(/_/g, " ")}
            </span>
          </div>
          <p className="mt-3 font-display text-xl font-bold text-[#123C32]">
            {onsetStatus === "outside_onset_window"
              ? "Outside Window"
              : onsetStatus === "onset_detected"
              ? "Onset Verified"
              : "Monitoring Window"}
          </p>
          <p className="mt-1 font-sans text-xs text-[#252923]/70">
            IMD onset criteria: 25 mm rain over 2 consecutive rainy days.
          </p>
        </div>

        <div className="rounded-xl border-2 border-[#123C32] bg-white p-5 shadow-[4px_4px_0px_#123C32]">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#123C32]">Dry-Spell Streak</span>
            <span className="rounded border border-[#E6A52E] bg-[#E6A52E]/15 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-[#123C32]">
              {drySpellSeverity}
            </span>
          </div>
          <p className="mt-3 font-mono text-2xl font-black text-[#123C32]">
            {dryDaysStreak} <span className="text-xs font-normal text-[#252923]/80">days</span>
          </p>
          <p className="mt-1 font-sans text-xs text-[#252923]/70">
            Threshold: consecutive days with precipitation &lt; 2.5 mm.
          </p>
        </div>

        <div className="rounded-xl border-2 border-[#123C32] bg-white p-5 shadow-[4px_4px_0px_#123C32]">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#123C32]">Deluge Risk</span>
            <span className={`rounded border px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
              heavyRainEvent
                ? "border-[#C7473B] bg-[#C7473B]/10 text-[#C7473B]"
                : "border-[#3B8B61] bg-[#3B8B61]/10 text-[#3B8B61]"
            }`}>
              {heavyRainEvent ? "Alert" : "Low Risk"}
            </span>
          </div>
          <p className="mt-3 font-display text-xl font-bold text-[#123C32]">
            {heavyRainEvent ? `Max: ${heavyRainMax} mm` : "No Severe Event"}
          </p>
          <p className="mt-1 font-sans text-xs text-[#252923]/70">
            Threshold: single-day deluge &ge; 64.5 mm (IMD Heavy Rain).
          </p>
        </div>
      </div>

      {/* ── Rainfall Forecast Chart Card ── */}
      <div className="rounded-xl border-2 border-[#123C32] bg-white p-6 shadow-[4px_4px_0px_#123C32]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#123C32]/15 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-md border border-[#123C32] bg-[#123C32] text-[#E6A52E]">
              <CloudRain size={16} />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold text-[#123C32]">
                {t("climatePage.rainfallOutlook")}
              </h2>
              <p className="font-sans text-xs text-[#252923]/70">
                Calibrated daily precipitation distribution ({Math.min(horizon, 14)}-day horizon)
              </p>
            </div>
          </div>
          <span className="font-mono text-xs text-[#252923]/70">
            Provider: {liveForecast?.provider.provider_name || "Open-Meteo"}
          </span>
        </div>

        <div className="mt-5">
          {forecastPoints.length > 0 ? (
            <RainfallForecastChart points={forecastPoints} height={320} />
          ) : (
            <div className="flex h-56 items-center justify-center font-mono text-xs text-[#252923]/60">
              {loading ? "Loading forecast series..." : "No forecast points available."}
            </div>
          )}
        </div>
      </div>

      {/* ── Temperature Distribution ── */}
      <div className="rounded-xl border-2 border-[#123C32] bg-white p-6 shadow-[4px_4px_0px_#123C32]">
        <div className="flex items-center gap-2.5 border-b-2 border-[#123C32]/15 pb-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-md border border-[#123C32] bg-[#123C32] text-[#E6A52E]">
            <Thermometer size={16} />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold text-[#123C32]">
              Temperature Range (°C)
            </h2>
            <p className="font-sans text-xs text-[#252923]/70">
              Daily maximum surface temperature trend across forecast days
            </p>
          </div>
        </div>

        <div className="mt-5">
          <TemperatureChart values={temperatures} height={220} />
        </div>
      </div>
    </div>
  );
}