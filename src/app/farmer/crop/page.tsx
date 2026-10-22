"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sprout,
  Check,
  ArrowRight,
  Layers,
  CalendarCheck,
  AlertTriangle,
  Info,
  RefreshCw,
  Droplets,
  FlaskConical,
} from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { useAppState } from "@/hooks/useAppState";
import { crops, getCrop } from "@/data/crops";
import { cropThumb } from "@/data/media";
import { getBlock, getDistrict } from "@/data/locations";
import { pickName } from "@/lib/utils";
import {
  api,
  type RegionalSoilSummaryResponse,
  type SowingAssessmentResponse,
  type SuitabilityAssessmentResponse,
} from "@/lib/api";
import {
  PageHeader,
  Card,
  Button,
  Photo,
  MetaChip,
  DataStatus,
} from "@/components/ui";

export default function CropSelectPage() {
  const { t, language } = useTranslation();
  const router = useRouter();
  const { location, cropId, stageId, setCrop, hydrated } = useAppState();

  const [selectedCrop, setSelectedCrop] = useState(cropId);
  const crop = getCrop(selectedCrop) ?? crops[0];
  const [selectedStage, setSelectedStage] = useState(
    crop.stages.some((s) => s.id === stageId) ? stageId : crop.stages[0].id
  );

  // Backend state
  const [soil, setSoil] = useState<RegionalSoilSummaryResponse | null>(null);
  const [suitability, setSuitability] = useState<SuitabilityAssessmentResponse | null>(null);
  const [sowing, setSowing] = useState<SowingAssessmentResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [backendError, setBackendError] = useState<string | null>(null);

  const block = getBlock(location.blockId);
  const district = block ? getDistrict(block.districtId) : null;
  const blockName = block ? pickName(block, language) : location.blockId;
  const districtName = district ? pickName(district, language) : "";

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setBackendError(null);
      try {
        const [soilRes, suitRes, sowRes] = await Promise.allSettled([
          api.getRegionalSoil(location.blockId),
          api.getCropSuitability(location.blockId, "kharif", "rainfed"),
          api.getSowingReadiness(location.blockId, selectedCrop),
        ]);

        if (cancelled) return;

        if (soilRes.status === "fulfilled") setSoil(soilRes.value);
        if (suitRes.status === "fulfilled") setSuitability(suitRes.value);
        if (sowRes.status === "fulfilled") setSowing(sowRes.value);

        if (
          soilRes.status === "rejected" &&
          suitRes.status === "rejected" &&
          sowRes.status === "rejected"
        ) {
          setBackendError("Live agronomic engine currently unreachable");
        }
      } catch (err: any) {
        if (!cancelled) setBackendError(err.message || "Failed to load crop assessment");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [hydrated, location.blockId, selectedCrop]);

  if (!hydrated) return null;

  function pickCrop(id: string) {
    setSelectedCrop(id);
    const c = getCrop(id);
    setSelectedStage(c?.stages[0].id ?? "sowing");
  }

  function confirm() {
    setCrop(selectedCrop, selectedStage);
    router.push("/farmer/dashboard");
  }

  const selectedCropSuitability = suitability?.candidate_crops.find(
    (c) => c.crop_id.toLowerCase() === selectedCrop.toLowerCase()
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        eyebrow={t("cropPage.eyebrow")}
        title={t("cropPage.title")}
        description={t("cropPage.subtitle")}
      >
        <MetaChip>{districtName} · {blockName}</MetaChip>
        <MetaChip>
          {soil ? (
            <span className="flex items-center gap-1.5 text-forest">
              <span className="h-2 w-2 rounded-full bg-forest" />
              Live Agro-Soil API
            </span>
          ) : (
            <span className="text-ink-muted">Regional Engine</span>
          )}
        </MetaChip>
      </PageHeader>

      <DataStatus kind="assessment" />

      {backendError && (
        <div className="flex items-center justify-between rounded-xl border border-clay/30 bg-clay-soft/40 p-4 text-xs text-clay-dark">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} />
            <span>{backendError} (Displaying fallback agronomic profiles)</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setSelectedCrop((c) => c);
            }}
          >
            <RefreshCw size={13} className="mr-1" /> Retry
          </Button>
        </div>
      )}

      {/* ── 1. Select Crop ─────────────────────────────────── */}
      <Card tone="default">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-base font-semibold text-ink">
            1. {t("cropPage.selectCrop")}
          </h2>
          <span className="text-xs text-ink-muted">
            {crops.length} Maharashtra Kharif Candidates
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {crops.map((c) => {
            const active = c.id === selectedCrop;
            const thumb = cropThumb(c.id);
            const name = t(c.nameKey);
            const suit = suitability?.candidate_crops.find(
              (cand) => cand.crop_id.toLowerCase() === c.id.toLowerCase()
            );

            return (
              <button
                key={c.id}
                type="button"
                onClick={() => pickCrop(c.id)}
                className={`group relative flex flex-col overflow-hidden rounded-lg border text-left transition-all ${
                  active
                    ? "border-forest bg-forest-soft/30 shadow-sm ring-2 ring-forest"
                    : "border-line bg-surface hover:border-forest/40"
                }`}
              >
                {thumb ? (
                  <Photo
                    src={thumb.src}
                    alt={name}
                    sizes="180px"
                    priority={c.id === "soybean"}
                    className="aspect-[16/10] w-full"
                  />
                ) : (
                  <div className="flex aspect-[16/10] w-full items-center justify-center bg-paper-deep text-forest">
                    <Sprout size={28} />
                  </div>
                )}
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-serif text-sm font-semibold text-ink">
                      {name}
                    </p>
                    {active && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-forest text-white">
                        <Check size={12} />
                      </span>
                    )}
                  </div>
                  {suit && (
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${
                          suit.status === "suitable"
                            ? "bg-forest"
                            : suit.status === "conditionally_suitable"
                            ? "bg-clay"
                            : "bg-ink-muted"
                        }`}
                      />
                      <span className="text-[11px] capitalize text-ink-muted">
                        {suit.status.replace("_", " ")}
                      </span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* ── 2. Verified Sowing Readiness (Live Phase 4 API) ───── */}
      {sowing && (
        <Card tone="default" className="border-forest/30 bg-surface">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <CalendarCheck size={18} className="text-forest" />
              <h2 className="font-serif text-base font-semibold text-ink">
                Sowing Readiness Assessment: {language === "mr" ? sowing.crop_name_mr : sowing.crop_name}
              </h2>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${
                sowing.status === "favorable"
                  ? "bg-forest-soft text-forest-dark"
                  : sowing.status === "wait_and_reassess"
                  ? "bg-clay-soft text-clay-dark"
                  : "bg-paper-deep text-ink-muted"
              }`}
            >
              {sowing.status.replace(/_/g, " ")}
            </span>
          </div>

          <div className="mt-4 space-y-4">
            <div className="rounded-lg border border-line bg-paper-deep/30 p-4">
              <p className="text-sm font-semibold text-ink">
                {language === "mr"
                  ? sowing.sowing_readiness_summary_mr
                  : sowing.sowing_readiness_summary_en}
              </p>
              <p className="mt-2 text-xs text-ink-muted">
                <strong>Window Status:</strong> {sowing.window_status} · {sowing.optimal_window_description}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-line bg-surface p-3">
                <span className="text-[11px] font-semibold uppercase text-ink-muted">7-Day Rain</span>
                <p className="mt-1 text-lg font-bold text-ink">
                  {sowing.antecedent_rainfall_7d_mm.toFixed(1)} mm
                </p>
                <span className="text-[10px] text-ink-subtle">Antecedent accumulation</span>
              </div>
              <div className="rounded-lg border border-line bg-surface p-3">
                <span className="text-[11px] font-semibold uppercase text-ink-muted">14-Day Rain</span>
                <p className="mt-1 text-lg font-bold text-ink">
                  {sowing.antecedent_rainfall_14d_mm.toFixed(1)} mm
                </p>
                <span className="text-[10px] text-ink-subtle">Cumulative monsoon wetting</span>
              </div>
              <div className="rounded-lg border border-line bg-surface p-3">
                <span className="text-[11px] font-semibold uppercase text-ink-muted">14-Day Hazard Flag</span>
                <p className="mt-1 text-base font-bold text-ink">
                  {sowing.forecast_14d_hazard_flag ? (
                    <span className="text-clay">Elevated Risk</span>
                  ) : (
                    <span className="text-forest">Low Hazard</span>
                  )}
                </p>
                <span className="text-[10px] text-ink-subtle">{sowing.forecast_summary}</span>
              </div>
            </div>

            {sowing.supporting_factors.length > 0 && (
              <div className="space-y-1 text-xs">
                <span className="font-semibold text-forest">Supporting Indicators:</span>
                <ul className="list-inside list-disc text-ink-muted">
                  {sowing.supporting_factors.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            )}

            {sowing.risk_factors.length > 0 && (
              <div className="space-y-1 text-xs">
                <span className="font-semibold text-clay">Key Sowing Cautions:</span>
                <ul className="list-inside list-disc text-ink-muted">
                  {sowing.risk_factors.map((rf, i) => (
                    <li key={i}>{rf}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center gap-2 rounded-lg bg-paper-deep/60 px-3 py-2 text-[11px] text-ink-subtle">
              <Info size={14} className="shrink-0 text-ink-muted" />
              <span>
                <strong>Limitation:</strong> {sowing.limitations}. Reassessment recommended on {sowing.next_reassessment_date}.
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* ── 3. Regional Soil Characteristics (Phase 4 API) ───── */}
      {soil && (
        <Card tone="default">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <FlaskConical size={18} className="text-forest" />
              <h2 className="font-serif text-base font-semibold text-ink">
                Regional Soil Properties ({soil.location_name})
              </h2>
            </div>
            <span className="rounded-full bg-forest-soft px-2.5 py-0.5 text-[11px] font-semibold text-forest">
              {soil.source}
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-line bg-paper-deep/30 p-3">
              <span className="text-[11px] font-semibold uppercase text-ink-muted">Dominant Texture</span>
              <p className="mt-1 text-sm font-bold text-ink">{soil.dominant_texture}</p>
              <span className="text-[10px] text-ink-subtle">Clay: {soil.clay_fraction_pct}% · Sand: {soil.sand_fraction_pct}%</span>
            </div>
            <div className="rounded-lg border border-line bg-paper-deep/30 p-3">
              <span className="text-[11px] font-semibold uppercase text-ink-muted">Topsoil pH</span>
              <p className="mt-1 text-sm font-bold text-ink">{soil.topsoil_ph.toFixed(1)}</p>
              <span className="text-[10px] text-ink-subtle">Depth: {soil.depth_layer}</span>
            </div>
            <div className="rounded-lg border border-line bg-paper-deep/30 p-3">
              <span className="text-[11px] font-semibold uppercase text-ink-muted">Organic Carbon</span>
              <p className="mt-1 text-sm font-bold text-ink">{soil.organic_carbon_pct.toFixed(2)}%</p>
              <span className="text-[10px] text-ink-subtle">CEC: {soil.cation_exchange_capacity} meq/100g</span>
            </div>
            <div className="rounded-lg border border-line bg-paper-deep/30 p-3">
              <span className="text-[11px] font-semibold uppercase text-ink-muted">Water Capacity</span>
              <p className="mt-1 text-sm font-bold text-ink">{soil.available_water_capacity_mm_m} mm/m</p>
              <span className="text-[10px] text-ink-subtle">{soil.drainage_class} drainage</span>
            </div>
          </div>

          <div className="mt-3 flex items-start gap-2 rounded-lg bg-paper-deep/50 p-2.5 text-[11px] text-ink-muted">
            <Info size={14} className="mt-0.5 shrink-0 text-ink-muted" />
            <p>
              <strong>Provenance Notice:</strong> {soil.limitations} (Spatial resolution: {soil.spatial_resolution}).
              Always verify with a certified local Krishi Vigyan Kendra (KVK) soil test before heavy fertilization.
            </p>
          </div>
        </Card>
      )}

      {/* ── 4. Select Growth Stage ─────────────────────────── */}
      <Card tone="default">
        <h2 className="font-serif text-base font-semibold text-ink">
          2. {t("cropPage.selectStage")} ({t(crop.nameKey)})
        </h2>
        <p className="mt-1 text-xs text-ink-muted">
          {t("cropPage.selectStageSubtitle")}
        </p>

        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
          {crop.stages.map((st) => {
            const active = st.id === selectedStage;
            const name = t(st.nameKey);
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setSelectedStage(st.id)}
                className={`flex items-start justify-between rounded-lg border p-3.5 text-left transition-colors ${
                  active
                    ? "border-forest bg-forest-soft text-forest-dark font-semibold"
                    : "border-line bg-surface hover:bg-paper-deep text-ink"
                }`}
              >
                <div>
                  <p className="text-sm">{name}</p>
                </div>
                {active && (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-forest text-white">
                    <Check size={12} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* ── Action Footer ──────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          variant="secondary"
          size="md"
          onClick={() => router.push("/farmer/dashboard")}
        >
          {t("common.cancel")}
        </Button>
        <Button variant="primary" size="md" onClick={confirm}>
          {t("cropPage.confirmSelection")}
          <ArrowRight size={15} aria-hidden />
        </Button>
      </div>
    </div>
  );
}

