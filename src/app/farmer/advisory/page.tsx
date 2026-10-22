"use client";

import { useEffect, useState } from "react";
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
  BookOpen,
  Info,
} from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { useAppState } from "@/hooks/useAppState";
import { crops, getCrop } from "@/data/crops";
import { getBlock, getDistrict } from "@/data/locations";
import { deriveAdvisory } from "@/data/advisories";
import { getForecast } from "@/data/climate";
import { cropPhotoFor } from "@/data/media";
import RiskBadge from "@/components/RiskBadge";
import { pickName } from "@/lib/utils";
import {
  api,
  type CropAdvisoryResponse,
  type ExplanationResponse,
} from "@/lib/api";
import {
  PageHeader,
  MetaChip,
  Card,
  CardHeader,
  ButtonLink,
  Button,
  DataStatus,
  Photo,
} from "@/components/ui";

export default function AdvisoryPage() {
  const { t, language } = useTranslation();
  const { location, cropId, stageId, setCrop, hydrated } = useAppState();

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

  // NuGen explanation states
  const [explanation, setExplanation] = useState<ExplanationResponse | null>(null);
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [explanationError, setExplanationError] = useState<string | null>(null);

  const block = getBlock(location.blockId);
  const district = block ? getDistrict(block.districtId) : null;
  const forecast = getForecast(location.blockId, 14);

  const blockName = block ? pickName(block, language) : location.blockId;
  const districtName = district ? pickName(district, language) : "";
  const cropName = t(currentCrop.nameKey);
  const currentStage = currentCrop.stages.find((s) => s.id === selectedStageId) ?? currentCrop.stages[0];
  const stageName = t(currentStage.nameKey);

  // Fetch live advisory whenever location, crop, stage or language changes
  const targetBlockId = block?.id;
  useEffect(() => {
    if (!hydrated || !targetBlockId) return;
    let cancelled = false;

    async function fetchAdvisory() {
      setAdvisoryLoading(true);
      setAdvisoryError(null);
      setExplanation(null); // reset explanation when inputs change

      try {
        const res = await api.getCropAdvisory(
          targetBlockId!,
          selectedCropId,
          selectedStageId,
          language
        );
        if (!cancelled) {
          setLiveAdvisory(res);
        }
      } catch (err: any) {
        if (!cancelled) {
          setAdvisoryError(err.message || "Failed to fetch live advisory");
          setLiveAdvisory(null);
        }
      } finally {
        if (!cancelled) setAdvisoryLoading(false);
      }
    }

    fetchAdvisory();
    return () => {
      cancelled = true;
    };
  }, [hydrated, targetBlockId, selectedCropId, selectedStageId, language]);

  // Handler to request NuGen explanation
  async function fetchExplanation() {
    if (!block) return;
    setExplanationLoading(true);
    setExplanationError(null);

    const advisoryId = liveAdvisory?.primary_advisory?.advisory_id || `adv_${block.id}_${selectedCropId}_${selectedStageId}_current`;

    try {
      const res = await api.getAdvisoryExplanation(advisoryId, {
        locationId: block.id,
        cropId: selectedCropId,
        stageId: selectedStageId,
        language,
      });
      setExplanation(res);
    } catch (err: any) {
      setExplanationError(err.message || "Failed to generate NuGen explanation");
    } finally {
      setExplanationLoading(false);
    }
  }

  if (!hydrated || !block) return null;

  // Fallback heuristic advisory if backend is offline
  const fallbackAdvisory = deriveAdvisory(block.id, selectedCropId, selectedStageId);
  const photo = cropPhotoFor(selectedCropId, selectedStageId);

  // Pick between live backend data and fallback
  const isLive = !!liveAdvisory;
  const primaryItem = liveAdvisory?.primary_advisory;

  const headline = primaryItem
    ? (language === "mr" ? primaryItem.primary_action_mr : primaryItem.primary_action_en)
    : t(
        `advisoryTemplates.${fallbackAdvisory.concern}.${fallbackAdvisory.isSowing ? "headlineSowing" : "headlineOther"}`,
        { crop: cropName, stage: stageName }
      );

  const reason = primaryItem
    ? (language === "mr" ? primaryItem.plain_language_reason_mr : primaryItem.plain_language_reason_en)
    : t(
        `advisoryTemplates.${fallbackAdvisory.concern}.${fallbackAdvisory.isSowing ? "reasonSowing" : "reasonOther"}`,
        { crop: cropName, stage: stageName }
      );

  const water = primaryItem
    ? primaryItem.secondary_actions_en.find((a) => a.toLowerCase().includes("irrigation") || a.toLowerCase().includes("drainage") || a.toLowerCase().includes("water")) ||
      primaryItem.secondary_actions_en[0] ||
      "Monitor root zone moisture and avoid stagnation."
    : t(`advisoryTemplates.${fallbackAdvisory.concern}.water`);

  const prioritySignal = primaryItem
    ? primaryItem.priority === "critical"
      ? "critical"
      : primaryItem.priority === "warning"
      ? "high"
      : primaryItem.priority === "advisory"
      ? "moderate"
      : "low"
    : fallbackAdvisory.riskSignal;

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

  // Decision chain steps
  const decisionChain = [
    {
      num: 1,
      title: t("advisory.chain.climateSignal"),
      icon: CloudRain,
      detail: `${t("climatePage.onsetProbability")}: ${forecast.monsoonOnsetProbability}% · ${t("climatePage.drySpellRisk")}: ${forecast.drySpellProbability}%`,
    },
    {
      num: 2,
      title: t("advisory.chain.localCondition"),
      icon: MapPin,
      detail: `${blockName} (${districtName}) · ${t("advisory.chain.soilVulnerability")}`,
    },
    {
      num: 3,
      title: t("advisory.chain.cropImpact"),
      icon: Sprout,
      detail: `${cropName} at ${stageName} stage · ${selectedStageId === "sowing" ? t("advisory.chain.criticalSowingWindow") : t("advisory.chain.stageSensitivity")}`,
    },
    {
      num: 4,
      title: t("advisory.chain.riskAssessment"),
      icon: Shield,
      detail: `${t("common.riskLevel")}: ${prioritySignal.toUpperCase()}`,
      badge: <RiskBadge risk={prioritySignal} size="sm" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Page Header ────────────────────────────────────── */}
      <PageHeader
        eyebrow={t("advisoryPage.eyebrow")}
        title={t("advisoryPage.title")}
        description={t("advisoryPage.subtitle")}
        actions={
          <ButtonLink href="/farmer/crop" variant="secondary" size="sm">
            <Sprout size={15} aria-hidden />
            {t("nav.crop")}
          </ButtonLink>
        }
      >
        <MetaChip>{districtName} · {blockName}</MetaChip>
        <MetaChip>
          <span className="font-semibold text-ink">{cropName}</span> ({stageName})
        </MetaChip>
        <MetaChip>
          {isLive ? (
            <span className="flex items-center gap-1.5 text-forest">
              <span className="h-2 w-2 rounded-full bg-forest" />
              Verified MPKV Engine (Phase 4)
            </span>
          ) : (
            <span className="text-ink-muted">Heuristic Mode</span>
          )}
        </MetaChip>
        <div className="ml-auto">
          <RiskBadge risk={prioritySignal} size="md" withPrefix />
        </div>
      </PageHeader>

      {/* ── Data Provenance ─────────────────────────────────── */}
      <DataStatus kind="assessment" date={liveAdvisory?.generated_at || forecast.updatedAt} />

      {advisoryError && (
        <div className="flex items-center justify-between rounded-xl border border-clay/30 bg-clay-soft/40 p-4 text-xs text-clay-dark">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} />
            <span>{advisoryError} (Using offline verified agronomic rules)</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setSelectedCropId((c) => c);
            }}
          >
            <RefreshCw size={13} className="mr-1" /> Retry
          </Button>
        </div>
      )}

      {/* ── Crop & Growth Stage Selector ────────────────────── */}
      <Card tone="default" padded={false} className="p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted">
              {t("cropPage.selectCrop")}
            </label>
            <select
              value={selectedCropId}
              onChange={(e) => handleCropChange(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-forest"
            >
              {crops.map((c) => (
                <option key={c.id} value={c.id}>
                  {t(c.nameKey)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted">
              {t("cropPage.selectStage")}
            </label>
            <select
              value={selectedStageId}
              onChange={(e) => handleStageChange(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-forest"
            >
              {currentCrop.stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {t(s.nameKey)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* ── FOCAL POINT: Prioritized Recommended Action ──────── */}
      <Card tone="default" className="border-forest/40 bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-forest text-white">
              <Sparkles size={18} aria-hidden />
            </span>
            <div>
              <p className="eyebrow text-forest">{t("advisory.prioritizedAction")}</p>
              <h2 className="font-serif text-xl font-bold text-ink">
                {headline}
              </h2>
            </div>
          </div>
          <RiskBadge risk={prioritySignal} size="lg" />
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-12">
          {photo && (
            <div className="lg:col-span-4">
              <div className="overflow-hidden rounded-lg border border-line">
                <Photo
                  src={photo.src}
                  alt={cropName}
                  sizes="(max-width: 1024px) 100vw, 320px"
                  className="aspect-[4/3] w-full"
                />
                <div className="bg-paper-deep/60 p-2.5 text-[11px] leading-snug text-ink-muted">
                  <span className="font-semibold text-ink">{cropName}</span> ({stageName})
                  <p className="mt-0.5">{t("cropPhoto.contextNotice")}</p>
                </div>
              </div>
            </div>
          )}

          <div className={photo ? "lg:col-span-8 space-y-4" : "lg:col-span-12 space-y-4"}>
            <div className="rounded-lg border border-line bg-paper-deep/40 p-4">
              <h3 className="flex items-center gap-2 font-serif text-base font-semibold text-ink">
                <Clock size={16} className="text-forest" aria-hidden />
                {t("advisory.waterManagementAction")}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink">
                {water}
              </p>
            </div>

            {/* Why this recommendation is made */}
            <div className="rounded-lg border border-line bg-surface-raised p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-sm font-semibold text-ink">
                  {t("advisory.agronomicBasis")} & Evidence
                </h3>
                <button
                  type="button"
                  onClick={() => setShowExplanation(!showExplanation)}
                  className="flex items-center gap-1 text-xs font-semibold text-forest hover:underline"
                >
                  {showExplanation ? t("common.collapse") : t("common.expand")}
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${showExplanation ? "rotate-180" : ""}`}
                  />
                </button>
              </div>
              {showExplanation && (
                <div className="mt-3 text-sm leading-relaxed text-ink-muted space-y-2">
                  <p>{reason}</p>
                  {primaryItem && primaryItem.supporting_signals.length > 0 && (
                    <div className="mt-2 text-xs">
                      <span className="font-semibold text-forest">Supporting Signals:</span>
                      <ul className="list-inside list-disc text-ink-muted">
                        {primaryItem.supporting_signals.map((sig, i) => (
                          <li key={i}>{sig}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {primaryItem && (
                    <p className="mt-2 text-[11px] text-ink-subtle">
                      <strong>Scientific Provenance:</strong> {primaryItem.provenance} (Rule ID: {primaryItem.rule_id} v{primaryItem.rule_version})
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* ── NuGen LLM Explanation Layer (Phase 5 Secure API) ─── */}
      <Card tone="default" className="border-forest/50 bg-paper-deep/20">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest-soft text-forest">
              <Bot size={18} />
            </span>
            <div>
              <h3 className="font-serif text-base font-semibold text-ink">
                NuGen Grounded Agricultural Explanation
              </h3>
              <p className="text-xs text-ink-muted">
                Server-side LLM explanation grounded in deterministic agronomic evidence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {explanation && (
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  explanation.provider_status === "generated"
                    ? "bg-forest-soft text-forest-dark"
                    : "bg-clay-soft text-clay-dark"
                }`}
              >
                {explanation.provider_status === "generated"
                  ? "NuGen AI Grounded"
                  : "Deterministic Fallback Rule"}
              </span>
            )}

            <Button
              variant="secondary"
              size="sm"
              onClick={fetchExplanation}
              disabled={explanationLoading}
            >
              {explanationLoading ? (
                <>
                  <RefreshCw size={13} className="mr-1.5 animate-spin" />
                  Generating Explanation...
                </>
              ) : (
                <>
                  <Sparkles size={13} className="mr-1.5 text-forest" />
                  {explanation ? "Refresh NuGen Explanation" : "Explain with NuGen AI"}
                </>
              )}
            </Button>
          </div>
        </div>

        {explanationError && (
          <div className="mt-4 rounded-lg border border-clay/30 bg-clay-soft/40 p-3 text-xs text-clay-dark">
            <AlertTriangle size={14} className="mr-1 inline" />
            {explanationError}
          </div>
        )}

        {explanation ? (
          <div className="mt-4 space-y-3.5">
            <div className="rounded-lg border border-line bg-surface p-4">
              <h4 className="font-serif text-sm font-bold text-ink">Executive Farmer Summary</h4>
              <p className="mt-1 text-sm leading-relaxed text-ink">{explanation.summary}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-line bg-surface p-3.5">
                <span className="text-xs font-bold uppercase tracking-wider text-forest">
                  1. Climate & Weather Signals
                </span>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
                  {explanation.signal_explanation}
                </p>
              </div>

              <div className="rounded-lg border border-line bg-surface p-3.5">
                <span className="text-xs font-bold uppercase tracking-wider text-forest">
                  2. Agronomic Reasoning
                </span>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
                  {explanation.reasoning_summary}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-line bg-surface p-3.5">
              <span className="text-xs font-bold uppercase tracking-wider text-forest">
                3. Actionable Field Guidance
              </span>
              <p className="mt-1.5 text-xs leading-relaxed text-ink">
                {explanation.action_explanation}
              </p>
            </div>

            <div className="flex items-start gap-2 rounded-lg bg-paper-deep/60 p-3 text-[11px] text-ink-subtle">
              <Info size={14} className="mt-0.5 shrink-0 text-ink-muted" />
              <div>
                <strong>Uncertainty & Verification Notice:</strong> {explanation.uncertainty}.
                <p className="mt-0.5">
                  <em>Provenance:</em> {explanation.provenance} · Rule {explanation.rule_id} v{explanation.rule_version}. Generated at {explanation.generated_at}.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-dashed border-line bg-surface/50 p-6 text-center">
            <p className="text-xs text-ink-muted">
              Click &quot;Explain with NuGen AI&quot; to generate an accessible, natural-language explanation of this verified advisory and its underlying meteorological evidence in {language === "mr" ? "Marathi" : "English"}.
            </p>
          </div>
        )}
      </Card>

      {/* ── VISUAL SEQUENCE: Climate -> Local -> Impact -> Risk ── */}
      <Card tone="default">
        <CardHeader
          icon={Compass}
          title={t("advisory.chain.title")}
          description={t("advisory.chain.subtitle")}
        />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {decisionChain.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="relative rounded-lg border border-line bg-surface-raised p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-forest-soft text-xs font-bold text-forest">
                    {step.num}
                  </span>
                  <Icon size={16} className="text-ink-muted" aria-hidden />
                </div>
                <h4 className="mt-3 font-serif text-sm font-semibold text-ink">
                  {step.title}
                </h4>
                <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                  {step.detail}
                </p>
                {step.badge && <div className="mt-2">{step.badge}</div>}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

