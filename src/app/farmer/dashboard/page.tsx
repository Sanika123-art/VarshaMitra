"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  CloudRain,
  Sprout,
  ChevronDown,
  ArrowRight,
  Layers,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  MapPin,
  Droplets,
  Sun,
  CloudLightning,
  Sparkles,
  ExternalLink,
  Info,
  Clock,
  Compass,
} from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { useAppState } from "@/hooks/useAppState";
import { useLocationLabel } from "@/hooks/useLocationLabel";
import { getCrop } from "@/data/crops";
import { cropPhotoFor } from "@/data/media";
import RiskBadge from "@/components/RiskBadge";
import type { RiskLevel } from "@/types";
import {
  api,
  type RiskAssessmentResponse,
  type ClimateIndicatorsResponse,
  type ForecastSeries,
  type CropAdvisoryResponse,
  type SowingAssessmentResponse,
  type RegionalSoilSummaryResponse,
} from "@/lib/api";
import { Photo } from "@/components/ui";
import { RainfallBars } from "@/features/charts/RainfallCharts";
import { ApiUnavailableState, InlineAlert } from "@/components/ui/States";

function formatSoilTexture(tex: string | undefined, isMr: boolean): string {
  if (!tex) return isMr ? "काळी कसदार जमीन" : "Deep Black Clay Soil";
  const map: Record<string, { en: string; mr: string }> = {
    black_cotton_vertisol: {
      en: "Deep Black Cotton Soil (Vertisol)",
      mr: "भारी काळी कसदार जमीन (व्हर्टिसॉल)",
    },
    clay_loam: {
      en: "Clay Loam Soil",
      mr: "मध्यम चिकणमाती (क्ले लोम)",
    },
    sandy_loam: {
      en: "Sandy Loam Soil",
      mr: "रेतीमिश्रित पोयटा जमीन",
    },
    red_laterite: {
      en: "Red Laterite Soil",
      mr: "तांबडी जांभी जमीन",
    },
    loamy: {
      en: "Loamy Soil",
      mr: "मध्यम पोयटा जमीन",
    },
  };
  return (isMr ? map[tex]?.mr : map[tex]?.en) || tex.replace(/_/g, " ");
}

export default function FarmerDashboard() {
  const { t, language } = useTranslation();
  const { location, cropId, stageId, hydrated } = useAppState();
  const { blockName: localizedBlock, districtName: localizedDistrict } = useLocationLabel();
  const [whyOpen, setWhyOpen] = useState(false);

  // Live API states
  const [liveRisk, setLiveRisk] = useState<RiskAssessmentResponse | null>(null);
  const [liveIndicators, setLiveIndicators] = useState<ClimateIndicatorsResponse | null>(null);
  const [liveForecast, setLiveForecast] = useState<ForecastSeries | null>(null);
  const [liveAdvisory, setLiveAdvisory] = useState<CropAdvisoryResponse | null>(null);
  const [liveSowing, setLiveSowing] = useState<SowingAssessmentResponse | null>(null);
  const [liveSoil, setLiveSoil] = useState<RegionalSoilSummaryResponse | null>(null);
  const [apiLoading, setApiLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!location.blockId) return;
    setApiLoading(true);
    setApiError(null);
    try {
      const [riskRes, indRes, fcRes, advRes, sowRes, soilRes] = await Promise.allSettled([
        api.getClimateRisk(location.blockId),
        api.getClimateIndicators(location.blockId, 14),
        api.getForecast(location.blockId, 14),
        api.getCropAdvisory(location.blockId, cropId, stageId, language),
        api.getSowingReadiness(location.blockId, cropId),
        api.getRegionalSoil(location.blockId),
      ]);

      if (riskRes.status === "fulfilled") setLiveRisk(riskRes.value);
      if (indRes.status === "fulfilled") setLiveIndicators(indRes.value);
      if (fcRes.status === "fulfilled") setLiveForecast(fcRes.value);
      if (advRes.status === "fulfilled") setLiveAdvisory(advRes.value);
      if (sowRes.status === "fulfilled") setLiveSowing(sowRes.value);
      if (soilRes.status === "fulfilled") setLiveSoil(soilRes.value);

      if (
        riskRes.status === "rejected" &&
        indRes.status === "rejected" &&
        fcRes.status === "rejected" &&
        advRes.status === "rejected" &&
        sowRes.status === "rejected"
      ) {
        setApiError("Backend API unavailable. Check if the VarshaMitra service is running.");
      }
    } catch {
      setApiError("Failed to communicate with VarshaMitra backend.");
    } finally {
      setApiLoading(false);
    }
  }, [location.blockId, cropId, stageId, language]);

  useEffect(() => {
    if (!hydrated || !location.blockId) return;
    let active = true;

    async function run() {
      try {
        const [riskRes, indRes, fcRes, advRes, sowRes, soilRes] = await Promise.allSettled([
          api.getClimateRisk(location.blockId),
          api.getClimateIndicators(location.blockId, 14),
          api.getForecast(location.blockId, 14),
          api.getCropAdvisory(location.blockId, cropId, stageId, language),
          api.getSowingReadiness(location.blockId, cropId),
          api.getRegionalSoil(location.blockId),
        ]);

        if (!active) return;
        if (riskRes.status === "fulfilled") setLiveRisk(riskRes.value);
        if (indRes.status === "fulfilled") setLiveIndicators(indRes.value);
        if (fcRes.status === "fulfilled") setLiveForecast(fcRes.value);
        if (advRes.status === "fulfilled") setLiveAdvisory(advRes.value);
        if (sowRes.status === "fulfilled") setLiveSowing(sowRes.value);
        if (soilRes.status === "fulfilled") setLiveSoil(soilRes.value);

        if (
          riskRes.status === "rejected" &&
          indRes.status === "rejected" &&
          fcRes.status === "rejected" &&
          advRes.status === "rejected" &&
          sowRes.status === "rejected"
        ) {
          setApiError("Backend API unavailable. Check if the VarshaMitra service is running.");
        }
      } catch {
        if (active) setApiError("Failed to communicate with VarshaMitra backend.");
      } finally {
        if (active) setApiLoading(false);
      }
    }

    run();
    return () => {
      active = false;
    };
  }, [hydrated, location.blockId, cropId, stageId, language]);

  if (!hydrated) return null;

  const isMr = language === "mr";
  const crop = getCrop(cropId);
  const stage = crop?.stages.find((s) => s.id === stageId);
  const photo = cropPhotoFor(cropId, stageId);

  const blockName = localizedBlock || liveRisk?.block_name || "";
  const districtName = localizedDistrict || liveRisk?.district_name || "";
  const cropName = crop ? t(crop.nameKey) : cropId;
  const stageName = stage ? t(stage.nameKey) : stageId;

  const currentRisk: RiskLevel = liveRisk?.overall_risk || "insufficient_data";
  const inMonsoon = liveRisk?.in_monsoon_season ?? false;

  const isSowingStage = stageId === "sowing";

  // Recommendation status determination
  let recStatusLabel = t("farmerDashboard.recProceed");
  let recBadgeBg = "bg-[#3B8B61] text-[#F4F0E5]";
  let recBorderColor = "border-[#3B8B61]";
  let RecIcon = ShieldCheck;

  if (currentRisk === "insufficient_data" && !liveAdvisory && !liveSowing) {
    recStatusLabel = t("farmerDashboard.recInsufficient");
    recBadgeBg = "bg-[#252923]/20 text-[#252923]";
    recBorderColor = "border-[#252923]/30";
    RecIcon = HelpCircle;
  } else if (currentRisk === "critical" || liveAdvisory?.primary_advisory?.priority === "critical") {
    recStatusLabel = t("farmerDashboard.recHighRisk");
    recBadgeBg = "bg-[#C7473B] text-[#F4F0E5]";
    recBorderColor = "border-[#C7473B]";
    RecIcon = ShieldAlert;
  } else if (
    liveAdvisory?.primary_advisory?.priority === "warning" ||
    (isSowingStage && liveSowing?.status === "unfavorable")
  ) {
    recStatusLabel = t("farmerDashboard.recAttention");
    recBadgeBg = "bg-[#E58A38] text-[#F4F0E5]";
    recBorderColor = "border-[#E58A38]";
    RecIcon = AlertTriangle;
  } else if (isSowingStage && liveSowing?.status === "wait_and_reassess") {
    recStatusLabel = t("farmerDashboard.recWait");
    recBadgeBg = "bg-[#E6B83F] text-[#252923]";
    recBorderColor = "border-[#E6B83F]";
    RecIcon = AlertTriangle;
  }

  // Recommendation Headline
  const mainHeadline = isSowingStage && liveSowing
    ? isMr
      ? liveSowing.sowing_readiness_summary_mr
      : liveSowing.sowing_readiness_summary_en
    : liveAdvisory
    ? isMr
      ? liveAdvisory.primary_advisory.primary_action_mr
      : liveAdvisory.primary_advisory.primary_action_en
    : isMr
    ? "शेत कृतीचे मूल्यांकन सुरू आहे..."
    : "Evaluating farm action...";

  const mainReason = liveAdvisory
    ? isMr
      ? liveAdvisory.primary_advisory.plain_language_reason_mr
      : liveAdvisory.primary_advisory.plain_language_reason_en
    : isSowingStage && liveSowing
    ? liveSowing.optimal_window_description
    : "";

  // DO actions
  const doItems: string[] = [];
  if (liveAdvisory?.primary_advisory) {
    const pAction = isMr
      ? liveAdvisory.primary_advisory.primary_action_mr
      : liveAdvisory.primary_advisory.primary_action_en;
    if (pAction && !isSowingStage) doItems.push(pAction);

    const secActions = isMr
      ? liveAdvisory.primary_advisory.secondary_actions_mr
      : liveAdvisory.primary_advisory.secondary_actions_en;
    if (secActions && secActions.length > 0) {
      doItems.push(...secActions);
    }
  }
  if (isSowingStage && liveSowing?.supporting_factors) {
    liveSowing.supporting_factors.forEach((f) => {
      if (!doItems.includes(f)) doItems.push(f);
    });
  }

  // AVOID actions
  const avoidItems: string[] = [];
  if (liveAdvisory?.primary_advisory?.caveats) {
    avoidItems.push(liveAdvisory.primary_advisory.caveats);
  }
  if (liveSowing?.risk_factors && liveSowing.risk_factors.length > 0) {
    liveSowing.risk_factors.forEach((rf) => {
      avoidItems.push(rf);
    });
  }
  if (liveIndicators?.heavy_rain?.has_heavy_rain_event) {
    avoidItems.push(
      isMr
        ? "मुसळधार पाऊस सुरू असताना खते किंवा कीटकनाशकांची फवारणी करू नका."
        : "Avoid open fertilizer top-dressing or pesticide spraying during forecasted heavy rainfall events."
    );
  }

  // Weather calculations
  const forecastSeries = liveForecast?.forecast ?? [];
  const forecastTotal14d = Math.round(
    forecastSeries.reduce((acc, curr) => acc + (curr.precipitation_sum_mm ?? 0), 0) * 10
  ) / 10;
  const todayRainMm = forecastSeries[0]?.precipitation_sum_mm ?? 0;
  const todayMaxTemp = forecastSeries[0]?.temperature_max_c;
  const todayMinTemp = forecastSeries[0]?.temperature_min_c;

  const antecedentRain14d = liveSowing?.antecedent_rainfall_14d_mm ??
    liveIndicators?.accumulation?.total_mm ?? 0;
  const antecedentRain7d = liveSowing?.antecedent_rainfall_7d_mm ?? 0;

  const dryDaysStreak = liveIndicators?.dry_spell?.current_consecutive_dry_days ?? 0;
  const heavyRainEvent = liveIndicators?.heavy_rain?.has_heavy_rain_event ?? false;
  const heavyRainMax = liveIndicators?.heavy_rain?.max_single_day_mm ?? 0;

  const rainfallPoints = forecastSeries.map((f, idx) => {
    const mm = f.precipitation_sum_mm ?? 0;
    return {
      day: idx + 1,
      expectedMm: mm,
      lowerMm: mm,
      upperMm: mm,
    };
  });

  let forecastSentence = t("farmerDashboard.lightRainExpected");
  if (forecastTotal14d === 0) {
    forecastSentence = t("farmerDashboard.noRainExpected");
  } else if (forecastTotal14d > 0 && forecastTotal14d < 10) {
    forecastSentence = t("farmerDashboard.lightRainExpected");
  } else if (forecastTotal14d >= 10 && forecastTotal14d < 65) {
    forecastSentence = t("farmerDashboard.moderateRainExpected");
  } else if (forecastTotal14d >= 65) {
    forecastSentence = t("farmerDashboard.heavyRainExpected");
  }

  return (
    <div className="space-y-8 bg-[#F4F0E5] text-[#252923]">
      
      {/* ── Editorial Location & Cockpit Topbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-[#123C32]/20 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded border border-[#123C32] bg-[#123C32] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#F4F0E5]">
              Cockpit
            </span>
            <span className="font-mono text-xs font-semibold text-[#123C32]">
              {districtName} · Block {blockName}
            </span>
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-[#123C32] sm:text-3xl">
            {t("farmerDashboard.title", { location: blockName })}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/farmer/saarthi"
            className="flex items-center gap-1.5 rounded-lg border-2 border-[#E6A52E] bg-[#E6A52E]/15 px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider text-[#123C32] shadow-[2px_2px_0px_#E6A52E] transition hover:bg-[#E6A52E]/30"
          >
            <Sparkles size={14} className="text-[#E6A52E]" />
            <span>{t("nav.saarthi")}</span>
          </Link>

          <Link
            href="/farmer/crop"
            className="flex items-center gap-1.5 rounded-lg border-2 border-[#123C32] bg-white px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider text-[#123C32] shadow-[2px_2px_0px_#123C32] transition hover:bg-[#123C32]/5"
          >
            <Sprout size={14} className="text-[#123C32]" />
            <span>{t("farmerDashboard.changeCrop")}</span>
          </Link>

          <Link
            href="/farmer/risk-map"
            className="flex items-center gap-1.5 rounded-lg border-2 border-[#123C32] bg-[#123C32] px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider text-[#F4F0E5] shadow-[2px_2px_0px_#252923] transition hover:bg-[#172B4D]"
          >
            <Layers size={14} className="text-[#E6A52E]" />
            <span>{t("nav.riskMap")}</span>
          </Link>
        </div>
      </div>

      {/* ── Active Crop & Risk Telemetry Strip ── */}
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border-2 border-[#123C32] bg-white p-3.5 shadow-[3px_3px_0px_#123C32]">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#123C32]/60">Monitored Crop</span>
          <p className="mt-1 font-display text-base font-bold text-[#123C32] truncate">{cropName}</p>
          <p className="font-mono text-xs text-[#252923]/60">{stageName}</p>
        </div>

        <div className="rounded-xl border-2 border-[#123C32] bg-white p-3.5 shadow-[3px_3px_0px_#123C32]">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#123C32]/60">Agro-Climatic Zone</span>
          <p className="mt-1 font-display text-base font-bold text-[#123C32] truncate">{liveSoil?.location_name || districtName}</p>
          <p className="font-mono text-xs text-[#252923]/60">{formatSoilTexture(liveSoil?.dominant_texture, isMr)}</p>
        </div>

        <div className="rounded-xl border-2 border-[#123C32] bg-white p-3.5 shadow-[3px_3px_0px_#123C32]">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#123C32]/60">Precipitation Status</span>
          <p className="mt-1 font-mono text-base font-bold text-[#123C32]">
            {antecedentRain7d} mm <span className="text-xs font-normal text-[#252923]/60">/ 7-day</span>
          </p>
          <p className="font-mono text-xs text-[#252923]/60">Next 14d: {forecastTotal14d} mm</p>
        </div>

        <div className="rounded-xl border-2 border-[#123C32] bg-white p-3.5 shadow-[3px_3px_0px_#123C32] flex flex-col justify-between">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#123C32]/60">Assessed Risk Level</span>
          <div className="mt-1">
            <RiskBadge risk={currentRisk} size="md" withPrefix />
          </div>
        </div>
      </div>

      {/* ── API Error State ── */}
      {apiError && (
        <ApiUnavailableState
          serviceName="VarshaMitra Engine"
          error={apiError}
          onRetry={loadData}
        />
      )}

      {/* ── Seasonal Note Banner if active ── */}
      {liveRisk?.season_note && (
        <InlineAlert variant="info" title={isMr ? "हंगामी संदर्भ" : "Seasonal Weather Context"}>
          {liveRisk.season_note}
        </InlineAlert>
      )}

      {/* ───────────────────────────────────────────────────────────
          SECTION B — DOMINANT RECOMMENDATION COCKPIT (HEROIC CARD)
          ─────────────────────────────────────────────────────────── */}
      <section aria-labelledby="section-main-recommendation">
        <div
          className={`relative overflow-hidden rounded-2xl border-3 ${recBorderColor} bg-white p-6 shadow-[6px_6px_0px_#123C32] sm:p-8`}
        >
          {/* Decorative Corner Accent */}
          <div className="absolute right-0 top-0 h-16 w-16 overflow-hidden">
            <div className={`h-8 w-16 rotate-45 transform ${recBadgeBg} -translate-y-2 translate-x-4`} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider ${recBadgeBg}`}>
                <RecIcon size={14} aria-hidden />
                {recStatusLabel}
              </span>
              <span className="font-mono text-xs font-semibold text-[#123C32]">
                {cropName} · {stageName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {apiLoading && <RefreshCw size={14} className="animate-spin text-[#123C32]" />}
              <span className="rounded border border-[#123C32]/20 bg-[#F4F0E5] px-2 py-0.5 font-mono text-[10px] text-[#252923]/70">
                Rule ID: {liveAdvisory?.primary_advisory?.rule_id || "sowing-engine"}
              </span>
            </div>
          </div>

          <div className="mt-5">
            <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#123C32]">
              {t("farmerDashboard.sectionB")}
            </span>
            <h2
              id="section-main-recommendation"
              className="mt-2 font-display text-2xl font-black leading-snug text-[#252923] sm:text-3xl"
            >
              {mainHeadline}
            </h2>
            {mainReason && (
              <p className="mt-3 font-sans text-sm font-medium leading-relaxed text-[#252923]/80 sm:text-base">
                {mainReason}
              </p>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t-2 border-[#123C32]/10 pt-4">
            <span className="font-mono text-xs text-[#252923]/70">
              {isMr ? "या सल्ल्याबद्दल शंका आहे का?" : "Need an explanation or alternative options?"}
            </span>
            <Link
              href="/farmer/saarthi"
              className="flex items-center gap-1.5 rounded-lg border-2 border-[#123C32] bg-[#F4F0E5] px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-[#123C32] shadow-[2px_2px_0px_#123C32] transition hover:bg-white"
            >
              <Sparkles size={13} className="text-[#E6A52E]" />
              <span>{isMr ? "सारथीला विचारा" : "Consult Saarthi Assistant"}</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────
          SECTION C — WHAT SHOULD YOU DO? (DO & AVOID SPLIT GRID)
          ─────────────────────────────────────────────────────────── */}
      <section aria-labelledby="section-actions">
        <div className="mb-4">
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#123C32]">
            Field Operations
          </span>
          <h2 id="section-actions" className="font-display text-xl font-bold text-[#123C32]">
            {t("farmerDashboard.sectionC")}
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* DO COLUMN */}
          <div className="rounded-xl border-2 border-[#3B8B61] bg-white p-6 shadow-[4px_4px_0px_#3B8B61]">
            <div className="flex items-center gap-2.5 border-b-2 border-[#3B8B61]/20 pb-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-md border border-[#3B8B61] bg-[#3B8B61] text-[#F4F0E5]">
                <CheckCircle2 size={16} aria-hidden />
              </span>
              <div>
                <h3 className="font-display text-base font-bold text-[#123C32]">
                  {t("farmerDashboard.doTitle")}
                </h3>
                <span className="font-mono text-[10px] uppercase text-[#3B8B61]">Recommended Field Work</span>
              </div>
            </div>
            <ul className="mt-4 space-y-3">
              {doItems.length > 0 ? (
                doItems.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-[#252923] leading-relaxed">
                    <span className="mt-1 h-2 w-2 rounded-full bg-[#3B8B61] shrink-0" />
                    <span className="font-sans font-medium">{item}</span>
                  </li>
                ))
              ) : (
                <li className="font-sans text-sm italic text-[#252923]/60">
                  {t("farmerDashboard.noDoActions")}
                </li>
              )}
            </ul>
          </div>

          {/* AVOID COLUMN */}
          <div className="rounded-xl border-2 border-[#C7473B] bg-white p-6 shadow-[4px_4px_0px_#C7473B]">
            <div className="flex items-center gap-2.5 border-b-2 border-[#C7473B]/20 pb-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-md border border-[#C7473B] bg-[#C7473B] text-[#F4F0E5]">
                <AlertTriangle size={16} aria-hidden />
              </span>
              <div>
                <h3 className="font-display text-base font-bold text-[#C7473B]">
                  {t("farmerDashboard.avoidTitle")}
                </h3>
                <span className="font-mono text-[10px] uppercase text-[#C7473B]">Risky / Prohibited Actions</span>
              </div>
            </div>
            <ul className="mt-4 space-y-3">
              {avoidItems.length > 0 ? (
                avoidItems.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-[#252923] leading-relaxed">
                    <span className="mt-1 h-2 w-2 rounded-full bg-[#C7473B] shrink-0" />
                    <span className="font-sans font-medium">{item}</span>
                  </li>
                ))
              ) : (
                <li className="font-sans text-sm italic text-[#252923]/60">
                  {t("farmerDashboard.noAvoidActions")}
                </li>
              )}
            </ul>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────
          SECTION D — WHY WE ARE RECOMMENDING THIS (PLAIN LANGUAGE)
          ─────────────────────────────────────────────────────────── */}
      <section aria-labelledby="section-why">
        <div className="rounded-xl border-2 border-[#123C32] bg-white p-6 shadow-[4px_4px_0px_#123C32]">
          <div className="flex items-center justify-between border-b-2 border-[#123C32]/15 pb-3">
            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#123C32]/60">
                Decision Grounding
              </span>
              <h2 id="section-why" className="font-display text-lg font-bold text-[#123C32]">
                {t("farmerDashboard.sectionD")}
              </h2>
            </div>
            <Info size={18} className="text-[#123C32]" />
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border-2 border-[#123C32]/20 bg-[#F4F0E5]/60 p-4">
              <span className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase text-[#2878A5]">
                <CloudRain size={14} />
                {t("farmerDashboard.rainfallConsidered")}
              </span>
              <p className="mt-2 font-sans text-xs sm:text-sm leading-relaxed text-[#252923]">
                {antecedentRain14d > 0
                  ? isMr
                    ? `मागील १४ दिवसांत ${antecedentRain14d} मिमी पाऊस पडला आहे.`
                    : `Your field received ${antecedentRain14d} mm rain in the last 14 days.`
                  : isMr
                  ? "मागील १४ दिवसांत कोणताही मोजण्याजोगा पाऊस झालेला नाही."
                  : "No measurable rain observed over the last 14 days."}
              </p>
            </div>

            <div className="rounded-lg border-2 border-[#123C32]/20 bg-[#F4F0E5]/60 p-4">
              <span className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase text-[#E6A52E]">
                <Sun size={14} />
                {t("farmerDashboard.forecastIndicates")}
              </span>
              <p className="mt-2 font-sans text-xs sm:text-sm leading-relaxed text-[#252923]">
                {liveSowing?.forecast_summary ||
                  (isMr
                    ? `पुढील १४ दिवसांत एकूण ${forecastTotal14d} मिमी पाऊस अपेक्षित.`
                    : `${forecastTotal14d} mm rain forecast in the next 14 days.`)}
              </p>
            </div>

            <div className="rounded-lg border-2 border-[#123C32]/20 bg-[#F4F0E5]/60 p-4">
              <span className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase text-[#123C32]">
                <Droplets size={14} />
                {t("farmerDashboard.soilContext")}
              </span>
              <p className="mt-2 font-sans text-xs sm:text-sm leading-relaxed text-[#252923]">
                {formatSoilTexture(liveSoil?.dominant_texture, isMr)}.
                {liveSoil?.clay_fraction_pct
                  ? isMr
                    ? ` चिकणमातीचे प्रमाण ${liveSoil.clay_fraction_pct}%.`
                    : ` Clay fraction ${liveSoil.clay_fraction_pct}%.`
                  : ""}
              </p>
            </div>

            <div className="rounded-lg border-2 border-[#123C32]/20 bg-[#F4F0E5]/60 p-4">
              <span className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase text-[#3B8B61]">
                <Sprout size={14} />
                {t("farmerDashboard.cropStageContext")}
              </span>
              <p className="mt-2 font-sans text-xs sm:text-sm leading-relaxed text-[#252923]">
                {cropName} ({stageName}).{" "}
                {mainReason ||
                  (isMr
                    ? "पिकाच्या या टप्प्यावर पाण्याचा समतोल राखणे गरजेचे आहे."
                    : "Moisture balance is essential at this vegetative stage.")}
              </p>
            </div>
          </div>

          {/* Expandable Technical Rule Provenance */}
          <div className="mt-5 border-t border-[#123C32]/15 pt-4">
            <button
              type="button"
              onClick={() => setWhyOpen(!whyOpen)}
              className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-[#123C32] hover:underline"
            >
              <span>
                {whyOpen
                  ? t("farmerDashboard.hideTechnicalDetails")
                  : t("farmerDashboard.technicalDetails")}
              </span>
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${whyOpen ? "rotate-180" : ""}`}
              />
            </button>

            {whyOpen && (
              <div className="mt-3 rounded-lg border-2 border-[#123C32]/20 bg-[#F4F0E5] p-4 font-mono text-xs leading-relaxed space-y-2 text-[#252923]/80">
                <div>
                  <span className="font-bold text-[#123C32]">
                    {t("farmerDashboard.ruleCitation")}:
                  </span>{" "}
                  {liveAdvisory?.primary_advisory?.rule_id || "sowing-engine-v1.1.0"} ·{" "}
                  {liveAdvisory?.primary_advisory?.provenance ||
                    liveSowing?.provenance ||
                    "MPKV Rahuri Kharif Crop Production Guide; ICAR-IISR Indore Bulletin."}
                </div>
                <div>
                  <span className="font-bold text-[#123C32]">Data Sources:</span> Open-Meteo
                  Deterministic Forecast · ICAR-NBSS&LUP SoilGrids 250m Synthesis · IMD Agro-Climatic Zones.
                </div>
                <div>
                  <span className="font-bold text-[#123C32]">Freshness:</span>{" "}
                  {liveAdvisory?.generated_at || liveRisk?.assessment_time || "Recent model evaluation"}
                </div>
                <p className="text-[11px] text-[#252923]/60 border-t border-[#123C32]/10 pt-2 font-sans">
                  {liveSowing?.limitations ||
                    "VarshaMitra advisories are agro-climatic decision-support recommendations. Always physically verify soil moisture (Vapsa condition) before executing sowing or heavy chemical operations."}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────
          SECTION E — 14-DAY CALIBRATED RAINFALL CHART
          ─────────────────────────────────────────────────────────── */}
      <section aria-labelledby="section-weather-forecast">
        <div className="rounded-xl border-2 border-[#123C32] bg-white p-6 shadow-[4px_4px_0px_#123C32]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#123C32]/15 pb-4">
            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#123C32]/60">
                {t("farmerDashboard.sectionE")}
              </span>
              <h2 id="section-weather-forecast" className="font-display text-lg font-bold text-[#123C32]">
                {t("farmerDashboard.rainExpected14Days")}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2 font-mono text-xs">
              <span className="rounded border-2 border-[#123C32]/30 bg-[#F4F0E5] px-2.5 py-1 text-[#252923]">
                Past 14d: <strong className="text-[#123C32]">{antecedentRain14d} mm</strong>
              </span>
              <span className="rounded border-2 border-[#123C32] bg-[#123C32] px-2.5 py-1 text-[#F4F0E5]">
                Next 14d: <strong className="text-[#E6A52E]">{forecastTotal14d} mm</strong>
              </span>
            </div>
          </div>

          <div className="mt-4">
            <p className="font-sans text-sm font-semibold text-[#252923] mb-3">{forecastSentence}</p>
            {rainfallPoints.length > 0 ? (
              <RainfallBars points={rainfallPoints} height={210} />
            ) : (
              <div className="flex h-44 items-center justify-center font-mono text-xs text-[#252923]/60">
                {apiLoading ? "Calibrating forecast horizon..." : "No forecast series available."}
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#123C32]/15 pt-3 font-mono text-xs text-[#252923]/60">
            <span>Provider: {liveForecast?.provider?.provider_name || "Open-Meteo Ensemble"}</span>
            <Link
              href="/farmer/climate"
              className="flex items-center gap-1 font-bold text-[#123C32] underline hover:no-underline"
            >
              <span>{t("farmerDashboard.allClimateSignals")}</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────
          SECTION F — IMPORTANT FARM RISKS (3-COLUMN TRIAGE)
          ─────────────────────────────────────────────────────────── */}
      <section aria-labelledby="section-farm-risks">
        <div className="mb-4">
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#123C32]">
            Risk Radar
          </span>
          <h2 id="section-farm-risks" className="font-display text-xl font-bold text-[#123C32]">
            {t("farmerDashboard.sectionF")}
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {/* Risk 1: Dry Conditions */}
          <div className="rounded-xl border-2 border-[#123C32] bg-white p-5 shadow-[4px_4px_0px_#123C32]">
            <div className="flex items-center justify-between gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-md border border-[#E6A52E] bg-[#E6A52E]/15 text-[#E6A52E]">
                <Sun size={18} aria-hidden />
              </span>
              <span className="rounded border border-[#123C32]/20 px-2 py-0.5 font-mono text-[10px] font-bold uppercase">
                {!inMonsoon
                  ? isMr ? "सामान्य कोरडा काळ" : "Normal Dry Season"
                  : dryDaysStreak >= 7
                  ? isMr ? `पावसाचा खंड (${dryDaysStreak} दिवस)` : `Dry Spell (${dryDaysStreak}d)`
                  : isMr ? "सामान्य ओलावा" : "Normal Moisture"}
              </span>
            </div>
            <h3 className="mt-3 font-display text-base font-bold text-[#252923]">
              {t("farmerDashboard.dryConditionsTitle")}
            </h3>
            <p className="mt-1 font-sans text-xs leading-relaxed text-[#252923]/75">
              {!inMonsoon
                ? isMr
                  ? "सध्या मान्सूनचा हंगाम नाही. हिवाळी/उन्हाळी कोरडे हवामान सामान्य असून पिकावर मान्सून-खंडाचा धोका नाही."
                  : "Currently outside southwest monsoon season. Winter/summer dryness is normal; no off-season dry-spell penalty."
                : dryDaysStreak >= 7
                ? isMr
                  ? `मान्सून काळात सलग ${dryDaysStreak} दिवस पाऊस पडलेला नाही. पिकाला हलके पाणी देण्याची गरज तपासावी.`
                  : `${dryDaysStreak} consecutive rainless days during the monsoon. Protective irrigation may be needed.`
                : isMr
                ? "पावसाचा कोणताही मोठा खंड आढळला नाही."
                : "No severe dry spell detected in the current window."}
            </p>
          </div>

          {/* Risk 2: Heavy Rain & Storm */}
          <div className="rounded-xl border-2 border-[#123C32] bg-white p-5 shadow-[4px_4px_0px_#123C32]">
            <div className="flex items-center justify-between gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-md border border-[#2878A5] bg-[#2878A5]/15 text-[#2878A5]">
                <CloudLightning size={18} aria-hidden />
              </span>
              <span className="rounded border border-[#123C32]/20 px-2 py-0.5 font-mono text-[10px] font-bold uppercase">
                {heavyRainEvent
                  ? isMr ? `मुसळधार पाऊस (${heavyRainMax} मिमी)` : `Heavy Rain (${heavyRainMax}mm)`
                  : isMr ? "धोका नाही" : "No Severe Event"}
              </span>
            </div>
            <h3 className="mt-3 font-display text-base font-bold text-[#252923]">
              {t("farmerDashboard.heavyRainTitle")}
            </h3>
            <p className="mt-1 font-sans text-xs leading-relaxed text-[#252923]/75">
              {heavyRainEvent
                ? isMr
                  ? `अंदाजात एकाच दिवशी ${heavyRainMax} मिमी पाऊस पडण्याची शक्यता आहे. शेतातील पाण्याचा निचरा योग्य असल्याची खात्री करा.`
                  : `Forecast indicates single-day rainfall up to ${heavyRainMax} mm. Ensure drainage ditches are clear to prevent waterlogging.`
                : isMr
                ? "पुढील १४ दिवसांत कोणत्याही मुसळधार पावसाचा (>६४.५ मिमी/दिवस) इशारा नाही."
                : "No heavy rainfall event (>64.5 mm/day) expected over the next 14 days."}
            </p>
          </div>

          {/* Risk 3: Sowing Readiness */}
          <div className="rounded-xl border-2 border-[#123C32] bg-white p-5 shadow-[4px_4px_0px_#123C32]">
            <div className="flex items-center justify-between gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-md border border-[#3B8B61] bg-[#3B8B61]/15 text-[#3B8B61]">
                <Sprout size={18} aria-hidden />
              </span>
              <span className="rounded border border-[#123C32]/20 px-2 py-0.5 font-mono text-[10px] font-bold uppercase">
                {liveSowing?.status === "favorable"
                  ? isMr ? "पेरणी अनुकूल" : "Favorable"
                  : liveSowing?.window_status === "outside_season"
                  ? isMr ? "हंगाम समाप्त" : "Window Closed"
                  : liveSowing?.status === "wait_and_reassess"
                  ? isMr ? "ओलावा अपुरा" : "Moisture Low"
                  : isMr ? "अपुरी माहिती" : "Data Missing"}
              </span>
            </div>
            <h3 className="mt-3 font-display text-base font-bold text-[#252923]">
              {t("farmerDashboard.sowingReadinessTitle")}
            </h3>
            <p className="mt-1 font-sans text-xs leading-relaxed text-[#252923]/75">
              {liveSowing
                ? isMr
                  ? liveSowing.sowing_readiness_summary_mr
                  : liveSowing.sowing_readiness_summary_en
                : isMr
                ? "पेरणी तयारीची माहिती मिळवली जात आहे."
                : "Sowing readiness conditions are being monitored."}
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer Navigation Actions ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t-2 border-[#123C32]/20 pt-6">
        <div className="flex items-center gap-2 font-mono text-xs text-[#252923]/70">
          <Clock size={14} className="text-[#123C32]" />
          <span>Last Evaluation: {liveRisk?.assessment_time || "Recent model cycle"}</span>
        </div>
        <div className="flex gap-3">
          <Link
            href="/farmer/advisory"
            className="flex items-center gap-1.5 rounded-lg border-2 border-[#123C32] bg-white px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-[#123C32] shadow-[2px_2px_0px_#123C32] hover:bg-[#F4F0E5]"
          >
            <span>{t("advisory.viewFullAdvisory")}</span>
            <ExternalLink size={13} />
          </Link>
          <Link
            href="/farmer/risk-map"
            className="flex items-center gap-1.5 rounded-lg border-2 border-[#123C32] bg-[#123C32] px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-[#F4F0E5] shadow-[2px_2px_0px_#252923] hover:bg-[#172B4D]"
          >
            <span>{t("nav.riskMap")}</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}