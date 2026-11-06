"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Sprout,
  Shield,
  CloudRain,
  ChevronDown,
  Sparkles,
  MapPin,
  Clock,
  Compass,
  Bot,
  AlertTriangle,
  RefreshCw,
  Info,
  Droplets,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { useAppState } from "@/hooks/useAppState";
import { useLocationLabel } from "@/hooks/useLocationLabel";
import { crops, getCrop } from "@/data/crops";
import { cropPhotoFor } from "@/data/media";
import RiskBadge from "@/components/RiskBadge";
import {
  api,
  type CropAdvisoryResponse,
  type ExplanationResponse,
  type RiskAssessmentResponse,
  type RiskLevel,
} from "@/lib/api";
import { Photo } from "@/components/ui";

export default function AdvisoryPage() {
  const { t, language } = useTranslation();
  const { location, cropId, stageId, setCrop, hydrated } = useAppState();
  const { blockName, districtName } = useLocationLabel();

  const [selectedCropId, setSelectedCropId] = useState(cropId);
  const currentCrop = getCrop(selectedCropId) ?? crops[0];
  const [selectedStageId, setSelectedStageId] = useState(
    currentCrop.stages.some((s) => s.id === stageId) ? stageId : currentCrop.stages[0].id
  );
  const [showExplanation, setShowExplanation] = useState(true);

  // Live backend states
  const [liveAdvisory, setLiveAdvisory] = useState<CropAdvisoryResponse | null>(null);
  const [advisoryLoading, setAdvisoryLoading] = useState(false);
  const [advisoryError, setAdvisoryError] = useState<string | null>(null);

  // Live risk assessment for local context
  const [climateRisk, setClimateRisk] = useState<RiskAssessmentResponse | null>(null);

  // NuGen explanation states
  const [explanation, setExplanation] = useState<ExplanationResponse | null>(null);
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [explanationError, setExplanationError] = useState<string | null>(null);

  const cropName = t(currentCrop.nameKey);
  const currentStage = currentCrop.stages.find((s) => s.id === selectedStageId) ?? currentCrop.stages[0];
  const stageName = t(currentStage.nameKey);

  const fetchAdvisory = useCallback(async () => {
    if (!location.blockId) return;
    setAdvisoryLoading(true);
    setAdvisoryError(null);
    setExplanation(null);

    try {
      const [advRes, riskRes] = await Promise.allSettled([
        api.getCropAdvisory(location.blockId, selectedCropId, selectedStageId, language),
        api.getClimateRisk(location.blockId),
      ]);

      if (advRes.status === "fulfilled") {
        setLiveAdvisory(advRes.value);
      } else {
        const msg = advRes.reason instanceof Error ? advRes.reason.message : "Failed to fetch live advisory";
        setAdvisoryError(msg);
        setLiveAdvisory(null);
      }

      if (riskRes.status === "fulfilled") {
        setClimateRisk(riskRes.value);
      }
    } finally {
      setAdvisoryLoading(false);
    }
  }, [location.blockId, selectedCropId, selectedStageId, language]);

  useEffect(() => {
    if (!hydrated || !location.blockId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch on input change
    fetchAdvisory();
  }, [hydrated, location.blockId, selectedCropId, selectedStageId, language, fetchAdvisory]);

  async function fetchExplanation() {
    if (!location.blockId) return;
    setExplanationLoading(true);
    setExplanationError(null);

    const advisoryId = liveAdvisory?.primary_advisory?.advisory_id || `adv_${location.blockId}_${selectedCropId}_${selectedStageId}_current`;

    try {
      const res = await api.getAdvisoryExplanation(advisoryId, {
        locationId: location.blockId,
        cropId: selectedCropId,
        stageId: selectedStageId,
        language,
      });
      setExplanation(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate NuGen explanation";
      setExplanationError(msg);
    } finally {
      setExplanationLoading(false);
    }
  }

  if (!hydrated) return null;

  const photo = cropPhotoFor(selectedCropId, selectedStageId);
  const primaryItem = liveAdvisory?.primary_advisory;

  const headline = primaryItem
    ? (language === "mr" ? primaryItem.primary_action_mr : primaryItem.primary_action_en)
    : advisoryError
      ? "Advisory currently unavailable"
      : "Evaluating agricultural advisory...";

  const reason = primaryItem
    ? (language === "mr" ? primaryItem.plain_language_reason_mr : primaryItem.plain_language_reason_en)
    : advisoryError
      ? advisoryError
      : "Retrieving agronomic and meteorological data...";

  const water = primaryItem
    ? primaryItem.secondary_actions_en.find((a) => a.toLowerCase().includes("irrigation") || a.toLowerCase().includes("drainage") || a.toLowerCase().includes("water")) ||
    primaryItem.secondary_actions_en[0] ||
    "Monitor root zone moisture and avoid water stagnation."
    : "Data pending from regional meteorological service.";

  const prioritySignal: RiskLevel = primaryItem
    ? primaryItem.priority === "critical"
      ? "critical"
      : primaryItem.priority === "warning"
        ? "high"
        : primaryItem.priority === "advisory"
          ? "moderate"
          : "low"
    : climateRisk?.overall_risk ?? "insufficient_data";

  function handleCropChange(newCropId: string) {
    setSelectedCropId(newCropId);
    const c = getCrop(newCropId);
    if (c && c.stages.length > 0) {
      setSelectedStageId(c.stages[0].id);
      setCrop(newCropId, c.stages[0].id);
    }
  }

  function handleStageChange(newStageId: string) {
    setSelectedStageId(newStageId);
    setCrop(selectedCropId, newStageId);
  }

  const climateContext = liveAdvisory?.climate_context || {};
  const drySpellSeverity = (climateContext.dry_spell_severity as string) || "none";
  const heavyRainEvent = (climateContext.heavy_rain_event as boolean) ?? false;
  const monsoonStatus = (climateContext.monsoon_onset_status as string) || "monsoon_in_progress";

  const decisionChain = [
    {
      num: "01",
      title: "Climate Signals",
      icon: CloudRain,
      detail: `Dry Spell: ${drySpellSeverity.toUpperCase()} · Heavy Rain: ${heavyRainEvent ? "Alert" : "Normal"} · Monsoon: ${monsoonStatus}`,
    },
    {
      num: "02",
      title: "Local Geometry",
      icon: MapPin,
      detail: `${blockName} (${districtName}) · ${climateRisk?.data_provenance?.dataset_name ?? "Open-Meteo High Resolution"}`,
    },
    {
      num: "03",
      title: "Crop Sensitivity",
      icon: Sprout,
      detail: `${cropName} at ${stageName} stage · Phenological Water Balance`,
    },
    {
      num: "04",
      title: "Action Triage",
      icon: Shield,
      detail: `Assessed Action Priority: ${prioritySignal.toUpperCase()}`,
      badge: <RiskBadge risk={prioritySignal} size="sm" />,
    },
  ];

  return (
    <div className="space-y-8 bg-[#F4F0E5] text-[#252923]">

      {/* ── Top Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-[#123C32]/20 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded border border-[#123C32] bg-[#123C32] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#F4F0E5]">
              Advisory Desk
            </span>
            <span className="font-mono text-xs font-semibold text-[#123C32]">
              {districtName} · Block {blockName}
            </span>
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-[#123C32] sm:text-3xl">
            {t("advisoryPage.title")}
          </h1>
          <p className="mt-1 font-sans text-xs text-[#252923]/70 sm:text-sm">
            {t("advisoryPage.subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/farmer/crop"
            className="flex items-center gap-1.5 rounded-lg border-2 border-[#123C32] bg-white px-3.5 py-2 font-mono text-xs font-bold uppercase tracking-wider text-[#123C32] shadow-[2px_2px_0px_#123C32] hover:bg-[#F4F0E5]"
          >
            <Sprout size={14} className="text-[#123C32]" />
            <span>Switch Crop</span>
          </Link>
          <RiskBadge risk={prioritySignal} size="md" withPrefix />
        </div>
      </div>

      {advisoryError && (
        <div className="flex items-center justify-between rounded-xl border-2 border-[#C7473B] bg-white p-4 font-mono text-xs text-[#C7473B] shadow-[2px_2px_0px_#C7473B]">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} />
            <span>{advisoryError}</span>
          </div>
          <button
            onClick={fetchAdvisory}
            className="rounded border border-[#C7473B] px-2 py-1 uppercase hover:bg-[#C7473B] hover:text-white"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Crop & Growth Stage Quick Selectors ── */}
      <div className="rounded-xl border-2 border-[#123C32] bg-white p-5 shadow-[4px_4px_0px_#123C32]">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="font-mono text-xs font-bold uppercase tracking-wider text-[#123C32]">
              {t("cropPage.selectCrop")}
            </label>
            <select
              value={selectedCropId}
              onChange={(e) => handleCropChange(e.target.value)}
              className="mt-1.5 w-full rounded-lg border-2 border-[#123C32]/30 bg-[#F4F0E5]/50 px-3 py-2 font-sans text-sm font-semibold text-[#252923] outline-none transition focus:border-[#123C32] focus:bg-white"
            >
              {crops.map((c) => (
                <option key={c.id} value={c.id}>
                  {t(c.nameKey)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-mono text-xs font-bold uppercase tracking-wider text-[#123C32]">
              {t("cropPage.selectStage")}
            </label>
            <select
              value={selectedStageId}
              onChange={(e) => handleStageChange(e.target.value)}
              className="mt-1.5 w-full rounded-lg border-2 border-[#123C32]/30 bg-[#F4F0E5]/50 px-3 py-2 font-sans text-sm font-semibold text-[#252923] outline-none transition focus:border-[#123C32] focus:bg-white"
            >
              {currentCrop.stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {t(s.nameKey)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── FOCAL POINT: Prioritized Recommended Action Card ── */}
      <div className="overflow-hidden rounded-xl border-3 border-[#123C32] bg-white p-6 shadow-[6px_6px_0px_#123C32] sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#123C32]/15 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-md border border-[#123C32] bg-[#123C32] text-[#E6A52E]">
              <Sparkles size={18} />
            </span>
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#123C32]">
                {t("advisory.prioritizedAction")}
              </p>
              <h2 className="font-display text-xl font-bold text-[#252923] sm:text-2xl">
                {headline}
              </h2>
            </div>
          </div>
          <RiskBadge risk={prioritySignal} size="lg" />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-12 items-start">
          {photo && (
            <div className="lg:col-span-4">
              <div className="overflow-hidden rounded-lg border-2 border-[#123C32]/30 shadow-xs">
                <Photo
                  src={photo.src}
                  alt={cropName}
                  sizes="(max-width: 1024px) 100vw, 320px"
                  className="aspect-[4/3] w-full object-cover"
                />
                <div className="bg-[#123C32] p-2.5 font-mono text-[11px] text-[#F4F0E5]">
                  <span className="font-bold">{cropName}</span> ({stageName})
                </div>
              </div>
            </div>
          )}

          <div className={photo ? "lg:col-span-8 space-y-4" : "lg:col-span-12 space-y-4"}>
            <div className="rounded-lg border-2 border-[#123C32]/20 bg-[#F4F0E5] p-4">
              <h3 className="flex items-center gap-2 font-display text-base font-bold text-[#123C32]">
                <Clock size={16} className="text-[#123C32]" />
                <span>{t("advisory.waterManagementAction")}</span>
              </h3>
              <p className="mt-2 font-sans text-sm font-medium leading-relaxed text-[#252923]">
                {water}
              </p>
            </div>

            {/* Why this recommendation is made */}
            <div className="rounded-lg border-2 border-[#123C32]/20 bg-white p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-bold text-[#123C32]">
                  {t("advisory.agronomicBasis")} & Evidence
                </h3>
                <button
                  type="button"
                  onClick={() => setShowExplanation(!showExplanation)}
                  className="flex items-center gap-1 font-mono text-xs font-bold text-[#123C32] hover:underline"
                >
                  {showExplanation ? t("common.collapse") : t("common.expand")}
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${showExplanation ? "rotate-180" : ""}`}
                  />
                </button>
              </div>

              {showExplanation && (
                <div className="mt-3 font-sans text-sm leading-relaxed text-[#252923]/80 space-y-2">
                  <p>{reason}</p>
                  {primaryItem && primaryItem.supporting_signals.length > 0 && (
                    <div className="mt-3 rounded border border-[#123C32]/10 bg-[#F4F0E5]/60 p-2.5 font-mono text-xs">
                      <span className="font-bold text-[#123C32]">Supporting Signals:</span>
                      <ul className="mt-1 list-inside list-disc text-[#252923]/70">
                        {primaryItem.supporting_signals.map((sig, i) => (
                          <li key={i}>{sig}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {primaryItem && (
                    <p className="font-mono text-[10px] text-[#252923]/60 pt-2 border-t border-[#123C32]/10">
                      <strong>Provenance:</strong> {primaryItem.provenance} (Rule ID: {primaryItem.rule_id} v{primaryItem.rule_version})
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── NuGen Grounded Agricultural Explanation Layer ── */}
      <div className="rounded-xl border-2 border-[#123C32] bg-white p-6 shadow-[4px_4px_0px_#123C32]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#123C32]/15 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-md border border-[#123C32] bg-[#123C32] text-[#E6A52E]">
              <Bot size={18} />
            </span>
            <div>
              <h3 className="font-display text-base font-bold text-[#123C32]">
                NuGen Grounded Agricultural Explanation
              </h3>
              <p className="font-sans text-xs text-[#252923]/70">
                Server-side AI explanation strictly bounded by verified agronomic evidence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {explanation && (
              <span className="rounded border border-[#123C32] bg-[#F4F0E5] px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase text-[#123C32]">
                {explanation.provider_status === "generated" ? "NuGen AI Grounded" : "Rule Fallback"}
              </span>
            )}

            <button
              type="button"
              onClick={fetchExplanation}
              disabled={explanationLoading || !liveAdvisory}
              className="flex items-center gap-1.5 rounded-lg border-2 border-[#123C32] bg-[#123C32] px-3.5 py-2 font-mono text-xs font-bold uppercase tracking-wider text-[#F4F0E5] shadow-[2px_2px_0px_#252923] hover:bg-[#172B4D] disabled:opacity-50"
            >
              {explanationLoading ? (
                <>
                  <RefreshCw size={12} className="animate-spin text-[#E6A52E]" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Sparkles size={12} className="text-[#E6A52E]" />
                  <span>{explanation ? "Regenerate" : "Explain with NuGen"}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {explanationError && (
          <div className="mt-4 rounded border-2 border-[#C7473B] bg-white p-3 font-mono text-xs text-[#C7473B]">
            <AlertTriangle size={14} className="mr-1 inline" />
            {explanationError}
          </div>
        )}

        {explanation ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-lg border-2 border-[#123C32]/20 bg-[#F4F0E5] p-4">
              <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-[#123C32]">Executive Summary</h4>
              <p className="mt-1 font-sans text-sm font-medium leading-relaxed text-[#252923]">{explanation.summary}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border-2 border-[#123C32]/20 bg-white p-4">
                <span className="font-mono text-xs font-bold uppercase text-[#2878A5]">
                  1. Climate & Weather Signals
                </span>
                <p className="mt-2 font-sans text-xs sm:text-sm leading-relaxed text-[#252923]/80">
                  {explanation.signal_explanation}
                </p>
              </div>

              <div className="rounded-lg border-2 border-[#123C32]/20 bg-white p-4">
                <span className="font-mono text-xs font-bold uppercase text-[#E6A52E]">
                  2. Agronomic Reasoning
                </span>
                <p className="mt-2 font-sans text-xs sm:text-sm leading-relaxed text-[#252923]/80">
                  {explanation.reasoning_summary}
                </p>
              </div>
            </div>

            <div className="rounded-lg border-2 border-[#3B8B61] bg-white p-4">
              <span className="font-mono text-xs font-bold uppercase text-[#3B8B61]">
                3. Actionable Field Guidance
              </span>
              <p className="mt-2 font-sans text-sm font-semibold leading-relaxed text-[#252923]">
                {explanation.action_explanation}
              </p>
            </div>

            <div className="rounded border border-[#123C32]/20 bg-[#F4F0E5]/50 p-3 font-mono text-[10px] text-[#252923]/70">
              <span className="font-bold text-[#123C32]">Verification Notice:</span> {explanation.uncertainty}.
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-lg border-2 border-dashed border-[#123C32]/30 bg-[#F4F0E5]/40 p-6 text-center">
            <p className="font-sans text-xs text-[#252923]/70">
              Click &quot;Explain with NuGen&quot; to generate an accessible natural-language explanation of this verified advisory in {language === "mr" ? "Marathi" : "English"}.
            </p>
          </div>
        )}
      </div>

      {/* ── 4-Step Decision Flow Sequence ── */}
      <div className="rounded-xl border-2 border-[#123C32] bg-white p-6 shadow-[4px_4px_0px_#123C32]">
        <div className="border-b-2 border-[#123C32]/15 pb-3">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#123C32]/60">Pipeline</span>
          <h3 className="font-display text-lg font-bold text-[#123C32]">
            Deterministic Decision Chain
          </h3>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {decisionChain.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="rounded-lg border-2 border-[#123C32]/20 bg-[#F4F0E5] p-4 transition hover:border-[#123C32]"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-base font-black text-[#123C32]">{step.num}</span>
                  <Icon size={16} className="text-[#123C32]" />
                </div>
                <h4 className="mt-2 font-display text-sm font-bold text-[#252923]">{step.title}</h4>
                <p className="mt-1 font-sans text-xs text-[#252923]/70">{step.detail}</p>
                {step.badge && <div className="mt-2">{step.badge}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}