"use client";

import { useState, useEffect } from "react";
import {
  CloudRain,
  Sprout,
  ChevronDown,
  ArrowRight,
  Shield,
  Layers,
  Sparkles,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { useAppState } from "@/hooks/useAppState";
import { getBlock, getDistrict } from "@/data/locations";
import { getForecast } from "@/data/climate";
import { getCrop } from "@/data/crops";
import { deriveAdvisory } from "@/data/advisories";
import { alertsForBlock } from "@/data/officer";
import { cropPhotoFor } from "@/data/media";
import RiskBadge from "@/components/RiskBadge";
import { pickName } from "@/lib/utils";
import type { RiskLevel } from "@/types";
import {
  api,
  type RiskAssessmentResponse,
  type ClimateIndicatorsResponse,
  type ForecastSeries,
  type CropAdvisoryResponse,
} from "@/lib/api";
import {
  PageHeader,
  MetaChip,
  Card,
  CardHeader,
  ButtonLink,
  DataStatus,
  ProbabilityMeter,
  AlertListItem,
  DriverList,
  Photo,
} from "@/components/ui";
import { RainfallBars } from "@/features/charts/RainfallCharts";

export default function FarmerDashboard() {
  const { t, language } = useTranslation();
  const { location, cropId, stageId, hydrated } = useAppState();
  const [whyOpen, setWhyOpen] = useState(false);

  // Live API states
  const [liveRisk, setLiveRisk] = useState<RiskAssessmentResponse | null>(null);
  const [liveIndicators, setLiveIndicators] = useState<ClimateIndicatorsResponse | null>(null);
  const [liveForecast, setLiveForecast] = useState<ForecastSeries | null>(null);
  const [liveAdvisory, setLiveAdvisory] = useState<CropAdvisoryResponse | null>(null);
  const [apiLoading, setApiLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated || !location.blockId) return;

    let active = true;
    setApiLoading(true);
    setApiError(null);

    Promise.allSettled([
      api.getClimateRisk(location.blockId),
      api.getClimateIndicators(location.blockId, 14),
      api.getForecast(location.blockId, 14),
      api.getCropAdvisory(location.blockId, cropId, stageId, language),
    ]).then(([riskRes, indRes, fcRes, advRes]) => {
      if (!active) return;

      if (riskRes.status === "fulfilled") setLiveRisk(riskRes.value);
      if (indRes.status === "fulfilled") setLiveIndicators(indRes.value);
      if (fcRes.status === "fulfilled") setLiveForecast(fcRes.value);
      if (advRes.status === "fulfilled") setLiveAdvisory(advRes.value);

      if (
        riskRes.status === "rejected" &&
        indRes.status === "rejected" &&
        fcRes.status === "rejected" &&
        advRes.status === "rejected"
      ) {
        setApiError("Backend API unavailable. Showing offline demo estimates.");
      }
      setApiLoading(false);
    });

    return () => {
      active = false;
    };
  }, [hydrated, location.blockId, cropId, stageId, language]);

  if (!hydrated) return null;

  const block = getBlock(location.blockId);
  if (!block) return null;
  const district = getDistrict(block.districtId);
  const fallbackFc = getForecast(block.id, 14);
  const crop = getCrop(cropId);
  const stage = crop?.stages.find((s) => s.id === stageId);
  const fallbackAdv = deriveAdvisory(block.id, cropId, stageId);
  const alerts = alertsForBlock(block.id);
  const photo = cropPhotoFor(cropId, stageId);

  const blockName = pickName(block, language);
  const districtName = district ? pickName(district, language) : "";
  const cropName = crop ? t(crop.nameKey) : cropId;
  const stageName = stage ? t(stage.nameKey) : stageId;

  // Use live advisory if available
  const isMr = language === "mr";
  const headline = liveAdvisory
    ? isMr ? liveAdvisory.primary_advisory.primary_action_mr : liveAdvisory.primary_advisory.primary_action_en
    : t(
        `advisoryTemplates.${fallbackAdv.concern}.${fallbackAdv.isSowing ? "headlineSowing" : "headlineOther"}`,
        { crop: cropName, stage: stageName }
      );

  const reason = liveAdvisory
    ? isMr ? liveAdvisory.primary_advisory.plain_language_reason_mr : liveAdvisory.primary_advisory.plain_language_reason_en
    : t(
        `advisoryTemplates.${fallbackAdv.concern}.${fallbackAdv.isSowing ? "reasonSowing" : "reasonOther"}`,
        { crop: cropName, stage: stageName }
      );

  const water = liveAdvisory
    ? (isMr ? liveAdvisory.primary_advisory.primary_action_mr : liveAdvisory.primary_advisory.primary_action_en)
    : t(`advisoryTemplates.${fallbackAdv.concern}.water`);

  const currentRisk: RiskLevel =
    liveRisk?.overall_risk && liveRisk.overall_risk !== "insufficient_data"
      ? liveRisk.overall_risk
      : block.risk;

  // Format risk drivers from live API or fallback
  const driverItems = liveRisk && liveRisk.risk_drivers.length > 0
    ? liveRisk.risk_drivers.map((d, idx) => ({
        key: d.driver_key || d.code || `driver_${idx}`,
        primary: idx === 0,
        text: `${d.name || d.plain_language_summary || "Driver"}: ${d.evidence}`,
      }))
    : block.riskDrivers.map((driver, idx) => ({
        key: driver,
        primary: idx === 0,
        text: t(`riskDrivers.${driver}`),
      }));

  // Build chart points from live forecast or fallback
  const rainfallPoints = liveForecast && liveForecast.forecast.length > 0
    ? liveForecast.forecast.map((f, idx) => ({
        day: idx + 1,
        expectedMm: f.precipitation_sum_mm,
        lowerMm: Math.max(0, Number((f.precipitation_sum_mm * 0.8).toFixed(1))),
        upperMm: Number((f.precipitation_sum_mm * 1.25).toFixed(1)),
      }))
    : fallbackFc.rainfallTrend;

  // Key meters: onset probability, dry spell days, heavy rain days
  const onsetProb = liveIndicators?.monsoon_onset?.onset_detected ? 100 : fallbackFc.monsoonOnsetProbability;
  const drySpellStreak = liveIndicators?.dry_spell?.current_consecutive_dry_days ?? 0;
  const drySpellProb = liveIndicators
    ? (liveIndicators.dry_spell.severity === "critical" ? 95 : liveIndicators.dry_spell.severity === "significant" ? 75 : 30)
    : fallbackFc.drySpellProbability;
  const heavyRainProb = liveIndicators?.heavy_rain?.has_heavy_rain_event ? 85 : fallbackFc.heavyRainProbability;

  return (
    <div className="space-y-6">
      {/* ── Page Header ────────────────────────────────────── */}
      <PageHeader
        eyebrow={t("farmerDashboard.eyebrow")}
        title={t("farmerDashboard.title", { location: blockName })}
        description={t("farmerDashboard.subtitle")}
        actions={
          <div className="flex gap-2">
            <ButtonLink href="/farmer/crop" variant="secondary" size="sm">
              <Sprout size={15} aria-hidden />
              {t("nav.crop")}
            </ButtonLink>
            <ButtonLink href="/farmer/risk-map" variant="primary" size="sm">
              <Layers size={15} aria-hidden />
              {t("nav.riskMap")}
            </ButtonLink>
          </div>
        }
      >
        <MetaChip>{districtName}</MetaChip>
        <MetaChip>
          <span className="font-semibold text-ink">{cropName}</span> ({stageName})
        </MetaChip>
        {apiLoading ? (
          <div className="ml-auto flex items-center gap-1.5 text-xs text-ink-muted">
            <RefreshCw size={13} className="animate-spin text-forest" />
            <span>Updating...</span>
          </div>
        ) : liveRisk ? (
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center rounded-full bg-forest-soft px-2 py-0.5 text-[10px] font-semibold text-forest">
              Live FastAPI
            </span>
            <RiskBadge risk={currentRisk} size="md" withPrefix />
          </div>
        ) : (
          <div className="ml-auto flex items-center gap-2">
            <RiskBadge risk={currentRisk} size="md" withPrefix />
          </div>
        )}
      </PageHeader>

      {/* ── Data Provenance Note ──────────────────────────── */}
      <DataStatus
        kind="assessment"
        date={liveRisk ? liveRisk.assessment_date : fallbackFc.updatedAt}
      />

      {/* ── BENTO GRID ─────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* 1. Primary Action & Advisory (Hero Bento Card - spans 8 cols) */}
        <Card tone="default" className="lg:col-span-8 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-forest-soft text-forest">
                  <Sparkles size={18} aria-hidden />
                </span>
                <div>
                  <h2 className="font-serif text-lg font-semibold text-ink">
                    {t("farmerDashboard.advisoryTitle")}
                  </h2>
                  <p className="text-xs text-ink-muted">
                    {cropName} · {stageName}
                  </p>
                </div>
              </div>
              <RiskBadge risk={currentRisk} size="md" />
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-12">
              {photo && (
                <div className="sm:col-span-4">
                  <div className="overflow-hidden rounded-lg border border-line">
                    <Photo
                      src={photo.src}
                      alt={cropName}
                      sizes="(max-width: 640px) 100vw, 250px"
                      className="aspect-[4/3] w-full"
                    />
                    <div className="bg-paper-deep/60 p-2 text-[11px] text-ink-muted">
                      {t("cropPhoto.contextNotice")}
                    </div>
                  </div>
                </div>
              )}

              <div className={photo ? "sm:col-span-8" : "sm:col-span-12"}>
                <div className="rounded-lg border border-forest/30 bg-forest-soft/40 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-forest-dark">
                    {t("advisory.recommendedAction")}
                  </p>
                  <p className="mt-1 font-serif text-lg font-bold leading-snug text-ink">
                    {headline}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                    {water}
                  </p>
                </div>

                {/* Explanation reveal */}
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setWhyOpen(!whyOpen)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-forest hover:underline"
                  >
                    <span>{whyOpen ? t("common.hideWhy") : t("common.seeWhy")}</span>
                    <ChevronDown
                      size={14}
                      className={`transition-transform ${whyOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {whyOpen && (
                    <div className="mt-2 rounded-md border border-line bg-surface-raised p-3 text-xs leading-relaxed text-ink-muted">
                      <p className="font-semibold text-ink">{t("advisory.agronomicBasis")}:</p>
                      <p className="mt-1">{reason}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <span className="text-xs text-ink-muted">
              {liveAdvisory ? `${liveAdvisory.primary_advisory.rule_id} · ${liveAdvisory.primary_advisory.provenance}` : t("advisory.ruleNotice")}
            </span>
            <ButtonLink href="/farmer/advisory" variant="primary" size="sm">
              {t("advisory.viewFullAdvisory")}
              <ArrowRight size={14} aria-hidden />
            </ButtonLink>
          </div>
        </Card>

        {/* 2. Key Climate Probabilities (spans 4 cols) */}
        <div className="space-y-4 lg:col-span-4 flex flex-col justify-between">
          <ProbabilityMeter
            label={t("climatePage.onsetProbability")}
            value={onsetProb}
            accent="forest"
            definition={t("climate.definitions.onset")}
          />
          <ProbabilityMeter
            label={t("climatePage.drySpellRisk")}
            value={drySpellProb}
            accent="earth"
            definition={drySpellStreak > 0 ? `Active streak: ${drySpellStreak} days without rain` : t("climate.definitions.drySpell")}
          />
          <ProbabilityMeter
            label={t("climatePage.heavyRainRisk")}
            value={heavyRainProb}
            accent="monsoon"
            definition={t("climate.definitions.heavyRain")}
          />
        </div>

        {/* 3. 14-Day Daily Rainfall Outlook (spans 7 cols) */}
        <Card tone="default" className="lg:col-span-7">
          <CardHeader
            icon={CloudRain}
            title={t("climatePage.rainfallOutlook")}
            description={t("farmerDashboard.rainfallOutlookDesc")}
            action={
              <ButtonLink href="/farmer/climate" variant="ghost" size="sm">
                {t("farmerDashboard.allClimateSignals")}
                <ArrowRight size={14} aria-hidden />
              </ButtonLink>
            }
          />
          <div className="mt-4">
            <RainfallBars points={rainfallPoints} height={210} />
          </div>
        </Card>

        {/* 4. Risk Drivers & Active Alerts (spans 5 cols) */}
        <div className="space-y-6 lg:col-span-5">
          <Card tone="default">
            <CardHeader
              icon={Shield}
              title={t("riskMapPage.whyAtRisk")}
              description={t("farmerDashboard.riskDriversDesc")}
            />
            <div className="mt-4">
              <DriverList items={driverItems} />
            </div>
          </Card>

          {alerts.length > 0 && (
            <Card tone="default">
              <CardHeader
                title={t("officerDashboard.alertsTitle")}
                description={t("farmerDashboard.activeBlockAlerts")}
              />
              <ul className="mt-4 space-y-2.5">
                {alerts.map((al) => (
                  <AlertListItem
                    key={al.id}
                    severity={al.severity}
                    title={t(al.titleKey)}
                    time={`${al.timeAgoHours}h ago`}
                  />
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
