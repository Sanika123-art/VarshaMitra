"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, MapPin, X } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { useAppState } from "@/hooks/useAppState";
import {
  api,
  type CropAdvisoryResponse,
  type ForecastSeries,
  type HistoricalTrendsResponse,
  type RiskAssessmentResponse,
  type RiskSummaryItem,
} from "@/lib/api";
import type { RiskLevel } from "@/types";
import RiskBadge from "@/components/RiskBadge";
import AudioAdvisoryPlayer from "@/components/audio/AudioAdvisoryPlayer";
import { riskLabelKey } from "@/lib/utils";

type PanelMode = "farmer" | "officer";

export default function BlockPanel({
  item,
  mode,
  layer,
  onClose,
  onUseAsFarm,
}: {
  item: RiskSummaryItem;
  mode: PanelMode;
  layer: string;
  onClose: () => void;
  onUseAsFarm: () => void;
}) {
  const { t, language } = useTranslation();
  const isMr = language === "mr";
  const { cropId, stageId } = useAppState();
  const [detailRisk, setDetailRisk] = useState<RiskAssessmentResponse | null>(null);
  const [forecast, setForecast] = useState<ForecastSeries | null>(null);
  const [history, setHistory] = useState<HistoricalTrendsResponse | null>(null);
  const [advisory, setAdvisory] = useState<CropAdvisoryResponse | null>(null);
  const [loading, setLoading] = useState(item.status === "ok");
  const [detailError, setDetailError] = useState<string | null>(null);

  const canAdvise = item.status === "ok"
    && item.overall_risk !== "insufficient_data"
    && item.confidence !== "none"
    && item.freshness_status !== "stale"
    && item.freshness_status !== "missing"
    && item.freshness_status !== "synthetic_staging_baseline";

  useEffect(() => {
    if (item.status !== "ok") return;
    let cancelled = false;

    const requests: Promise<unknown>[] = [
      api.getClimateRisk(item.block_id),
      api.getForecast(item.block_id, 7),
    ];
    if (mode === "farmer" && canAdvise) {
      requests.push(api.getCropAdvisory(item.block_id, cropId, stageId, language));
    }
    if (layer === "historicalRainfall" && !item.block_id.startsWith("geo_")) {
      requests.push(api.getHistoricalTrends(item.block_id));
    }

    Promise.allSettled(requests).then((results) => {
      if (cancelled) return;
      const [riskResult, forecastResult] = results;
      if (riskResult.status === "fulfilled") {
        setDetailRisk(riskResult.value as RiskAssessmentResponse);
      } else {
        setDetailError(isMr ? "या भागाची सविस्तर जोखीम माहिती मिळाली नाही." : "Detailed risk data is unavailable for this area.");
      }
      if (forecastResult.status === "fulfilled") {
        setForecast(forecastResult.value as ForecastSeries);
      }
      let nextResult = 2;
      if (mode === "farmer" && canAdvise) {
        const advisoryResult = results[nextResult];
        if (advisoryResult?.status === "fulfilled") {
          setAdvisory(advisoryResult.value as CropAdvisoryResponse);
        }
        nextResult += 1;
      }
      if (layer === "historicalRainfall" && !item.block_id.startsWith("geo_")) {
        const historyResult = results[nextResult];
        if (historyResult?.status === "fulfilled") {
          const value = historyResult.value as HistoricalTrendsResponse;
          if (value.location_id === item.block_id) setHistory(value);
        }
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [item.block_id, item.status, mode, canAdvise, cropId, stageId, language, isMr, layer]);

  const freshnessInvalid = item.freshness_status === "stale"
    || item.freshness_status === "missing"
    || item.freshness_status === "synthetic_staging_baseline";
  const activeRisk: RiskLevel = item.status === "ok" && !freshnessInvalid
    ? detailRisk?.overall_risk ?? item.overall_risk ?? "insufficient_data"
    : "insufficient_data";
  const areaName = isMr ? item.block_name_mr : item.block_name;
  const activeForecast = forecast?.forecast ?? [];
  const sevenDayRain = activeForecast.reduce((sum, day) => sum + (day.precipitation_sum_mm ?? 0), 0);
  const provenance = item.data_provenance ?? detailRisk?.data_provenance;
  const coverage = item.coverage_ratio;
  const hasBoundary = item.geometry_type === "Polygon" || item.geometry_type === "MultiPolygon";

  return (
    <aside
      aria-label={isMr ? "निवडलेल्या भागाची हवामान माहिती" : "Selected area climate information"}
      className="absolute inset-x-0 bottom-0 z-[500] max-h-[78dvh] overflow-y-auto rounded-t-2xl border-t border-black/15 bg-white p-4 shadow-2xl sm:inset-x-auto sm:right-3 sm:top-3 sm:bottom-3 sm:max-h-[calc(100%-24px)] sm:w-[min(420px,calc(100vw-24px))] sm:rounded-xl sm:border"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-black/15 bg-white"
        aria-label={t("common.close")}
      >
        <X size={18} />
      </button>

      <div className="pr-12">
        <p className="flex items-center gap-1 text-xs font-medium text-[#56645B]">
          <MapPin size={14} /> {item.district_name}
        </p>
        <h2 className="mt-1 text-xl font-bold">{areaName}</h2>
        <p className="mt-1 text-xs text-[#56645B]">
          {hasBoundary
            ? (isMr ? "प्रशासकीय तालुका सीमा · २०१८ डेटा" : "Administrative taluka boundary · 2018 dataset")
            : `${t("riskMapPage.mapPoint")} · ${item.latitude.toFixed(3)}, ${item.longitude.toFixed(3)}`}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <RiskBadge
          risk={activeRisk}
          label={t(riskLabelKey[activeRisk] ?? "common.insufficientData")}
          size="md"
          withPrefix
        />
        {item.confidence && (
          <span className="rounded-full border border-black/10 px-2.5 py-1 text-xs">
            {isMr ? "माहिती कव्हरेज" : "Data coverage"}: {item.confidence}
          </span>
        )}
      </div>

      {item.status === "unavailable" && (
        <div role="alert" className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
          {item.error ?? (isMr ? "या ठिकाणासाठी पुरेशी माहिती नाही." : "Climate data is unavailable for this area.")}
        </div>
      )}

      {item.status === "ok" && activeRisk === "insufficient_data" && (
        <div role="status" className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
          {freshnessInvalid
            ? (isMr ? "हवामान माहिती अद्ययावत किंवा पडताळलेली नाही. जोखीम किंवा पीक कृती दाखवलेली नाही." : "Climate data is stale, missing, or synthetic. No current risk level or crop action is shown.")
            : (isMr ? "माहिती अपुरी आहे. जोखीम किंवा पीक कृतीचा अंदाज दिलेला नाही." : "Data is insufficient. No risk level or crop action is inferred.")}
        </div>
      )}

      {loading && (
        <p className="mt-3 text-sm text-[#56645B]" role="status">
          {isMr ? "तपशील लोड होत आहेत…" : "Loading area details…"}
        </p>
      )}
      {detailError && (
        <p className="mt-3 rounded-lg bg-[#F4F4EF] p-3 text-sm text-[#56645B]" role="status">{detailError}</p>
      )}

      <section className="mt-4 rounded-lg border border-black/10 bg-[#F8F9F6] p-3">
        <h3 className="font-semibold">{isMr ? "माहितीचा कालावधी" : "Data period"}</h3>
        <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
          <div>
            <dt className="text-xs text-[#56645B]">{isMr ? "पासून" : "From"}</dt>
            <dd>{item.window_start ?? detailRisk?.start_date ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#56645B]">{isMr ? "पर्यंत" : "Through"}</dt>
            <dd>{item.window_end ?? detailRisk?.end_date ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#56645B]">{isMr ? "अद्ययावत वेळ" : "Assessed"}</dt>
            <dd>{item.assessment_time ? new Date(item.assessment_time).toLocaleString(isMr ? "mr-IN" : "en-IN") : "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#56645B]">{isMr ? "डेटा कव्हरेज" : "Valid data"}</dt>
            <dd>{coverage === undefined || coverage === null ? "—" : `${Math.round(coverage * 100)}%`}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#56645B]">{isMr ? "माहितीची ताजेपणा" : "Data freshness"}</dt>
            <dd>
              {item.freshness_status === "fresh"
                ? (isMr ? "अद्ययावत" : "Fresh")
                : item.freshness_status === "stale"
                  ? (isMr ? "जुनी माहिती" : "Stale")
                  : item.freshness_status === "provisional"
                    ? (isMr ? "तात्पुरती" : "Provisional")
                    : item.freshness_status === "missing"
                      ? (isMr ? "उपलब्ध नाही" : "Missing")
                      : item.freshness_status === "synthetic_staging_baseline"
                        ? (isMr ? "कृत्रिम चाचणी माहिती" : "Synthetic test data")
                        : "—"}
            </dd>
          </div>
        </dl>
        {provenance && (
          <div className="mt-3 border-t border-black/10 pt-2 text-xs text-[#56645B]">
            <p className="font-semibold text-[#16231B]">{provenance.provider_name} · {provenance.data_type.replaceAll("_", " ")}</p>
            <p>{provenance.dataset_name} · {provenance.spatial_resolution}</p>
            <p className="mt-1">{provenance.note}</p>
          </div>
        )}
        {item.confidence_rationale && (
          <p className="mt-2 text-xs text-[#56645B]">{item.confidence_rationale}</p>
        )}
      </section>

      {forecast && (
        <section className="mt-3 rounded-lg border border-black/10 p-3">
          <h3 className="font-semibold">{isMr ? "पुढील ७ दिवसांचा हवामान अंदाज" : "Next 7-day forecast"}</h3>
          <p className="mt-1 text-sm">
            {isMr ? "एकूण अंदाजित पाऊस" : "Forecast rainfall total"}: <strong>{sevenDayRain.toFixed(1)} mm</strong>
          </p>
          <p className="mt-1 text-xs text-[#56645B]">
            {forecast.provider.provider_name} · {forecast.data_type.replaceAll("_", " ")} · {forecast.forecast_generated_at ?? "—"}
          </p>
          <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
            {activeForecast.slice(0, 7).map((day) => (
              <li key={day.date} className="flex justify-between gap-2">
                <span>{day.date}</span><span>{day.precipitation_sum_mm.toFixed(1)} mm</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {layer === "historicalRainfall" && history && (
        <section className="mt-3 rounded-lg border border-black/10 p-3">
          <h3 className="font-semibold">{isMr ? "ऐतिहासिक पर्जन्य संदर्भ" : "Historical rainfall context"}</h3>
          <p className="mt-1 text-sm">
            {isMr ? "वार्षिक सामान्य पाऊस" : "Normal annual rainfall"}: <strong>{history.normal_annual_rainfall_mm.toFixed(0)} mm</strong>
          </p>
          <p className="text-xs text-[#56645B]">
            {history.coverage_years} · {history.dataset_provenance} · {history.retrieved_at}
          </p>
        </section>
      )}
      {layer === "historicalRainfall" && item.block_id.startsWith("geo_") && (
        <p className="mt-3 rounded-lg bg-[#F4F4EF] p-3 text-sm text-[#56645B]">
          {isMr ? "या निवडलेल्या GPS बिंदूसाठी ऐतिहासिक संदर्भ जोडलेला नाही." : "Historical context is not registered for this selected GPS point."}
        </p>
      )}

      {mode === "farmer" && item.status === "ok" && canAdvise && advisory && (
        <section className="mt-3 rounded-lg border border-[#1F4B3A]/20 bg-[#E9F0EA] p-3">
          <h3 className="font-semibold">{isMr ? "तुमच्या पिकासाठी कृती" : "Action for your crop"}</h3>
          <p className="mt-1 text-xs text-[#56645B]">
            {isMr ? "निवडलेले पीक व अवस्था" : "Selected crop and stage"}: {advisory.primary_advisory.crop_name} · {advisory.primary_advisory.stage_name}
          </p>
          <p className="mt-2 text-sm font-medium">
            {isMr ? advisory.primary_advisory.primary_action_mr : advisory.primary_advisory.primary_action_en}
          </p>
          <p className="mt-2 text-xs text-[#56645B]">
            {isMr ? advisory.primary_advisory.plain_language_reason_mr : advisory.primary_advisory.plain_language_reason_en}
          </p>
          <p className="mt-2 text-xs text-[#56645B]">
            {isMr ? advisory.primary_advisory.caveats_mr : advisory.primary_advisory.caveats}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <AudioAdvisoryPlayer
              title={isMr ? "पीक सल्ला" : "Crop advisory"}
              textToRead={isMr
                ? `${advisory.primary_advisory.primary_action_mr}. ${advisory.primary_advisory.plain_language_reason_mr}`
                : `${advisory.primary_advisory.primary_action_en}. ${advisory.primary_advisory.plain_language_reason_en}`}
              cropName={advisory.primary_advisory.crop_name}
              stageName={advisory.primary_advisory.stage_name}
              compact
            />
            <Link href="/farmer/advisory" className="inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-[#1F4B3A] underline">
              {isMr ? "पूर्ण सल्ला" : "Full advisory"} <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      )}
      {mode === "farmer" && item.status === "ok" && !canAdvise && (
        <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-950">
          {t("riskMapPage.noCropAdvice")}
        </p>
      )}

      {mode === "officer" && (
        <p className="mt-3 rounded-lg bg-[#F4F4EF] p-3 text-xs text-[#56645B]">
          {t("riskMapPage.aggregatedOnly")}
        </p>
      )}

      {mode === "farmer" && (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={onUseAsFarm}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#1F4B3A] px-3 text-sm font-semibold text-white hover:bg-[#173a2d]"
          >
            {t("riskMapPage.useSelectedArea")}
          </button>
          <Link
            href="/farmer/dashboard"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-black/15 px-3 text-sm font-semibold"
          >
            {isMr ? "आजचा सल्ला" : "Today's advice"}
          </Link>
        </div>
      )}
    </aside>
  );
}
