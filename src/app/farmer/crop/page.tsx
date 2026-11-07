"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sprout,
  Check,
  ArrowRight,
  AlertTriangle,
  Info,
  RefreshCw,
  Search,
  X,
  Droplets,
  BookOpen,
  Calendar,
  Sparkles,
  Layers,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { useAppState } from "@/hooks/useAppState";
import { crops as fallbackCrops } from "@/data/crops";
import { cropThumb } from "@/data/media";
import { useLocationLabel } from "@/hooks/useLocationLabel";
import {
  api,
  type CropRequirement,
  type RegionalSoilSummaryResponse,
  type SowingAssessmentResponse,
  type SuitabilityAssessmentResponse,
} from "@/lib/api";
import { Photo } from "@/components/ui";
import SoilVapsaDepthWidget from "@/components/soil/SoilVapsaDepthWidget";

const CATEGORY_TABS = [
  { id: "all", labelEn: "All Crops", labelMr: "सर्व पिके" },
  { id: "cereal", labelEn: "Cereals & Millets", labelMr: "तृणधान्ये" },
  { id: "pulse", labelEn: "Pulses", labelMr: "कडधान्ये" },
  { id: "oilseed", labelEn: "Oilseeds", labelMr: "गळीत धान्ये" },
  { id: "cash", labelEn: "Cash Crops", labelMr: "नगदी पिके" },
  { id: "vegetable", labelEn: "Vegetables", labelMr: "भाजीपाला" },
  { id: "horticulture", labelEn: "Horticulture", labelMr: "फळबाग" },
] as const;

export default function CropSelectPage() {
  const { language } = useTranslation();
  const router = useRouter();
  const { location, cropId, stageId, setCrop, hydrated } = useAppState();

  // Catalogue and filtering state
  const [catalogue, setCatalogue] = useState<CropRequirement[]>([]);
  const [selectedCrop, setSelectedCrop] = useState<string>(cropId || "soybean");
  const [selectedStage, setSelectedStage] = useState<string>(stageId || "sowing");

  // Keep selectedCrop and selectedStage in sync when active context hydrates or changes
  useEffect(() => {
    if (hydrated && cropId) {
      setSelectedCrop(cropId);
      if (stageId) setSelectedStage(stageId);
    }
  }, [hydrated, cropId, stageId]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSeason, setSelectedSeason] = useState<string>("all");
  const [waterSource, setWaterSource] = useState<string>("rainfed");

  // Backend analysis state
  const [soil, setSoil] = useState<RegionalSoilSummaryResponse | null>(null);
  const [suitability, setSuitability] = useState<SuitabilityAssessmentResponse | null>(null);
  const [sowing, setSowing] = useState<SowingAssessmentResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [catalogueLoading, setCatalogueLoading] = useState<boolean>(true);
  const [backendError, setBackendError] = useState<string | null>(null);

  const { blockName, districtName } = useLocationLabel();

  // 1. Load authoritative backend crop catalogue on mount
  useEffect(() => {
    let cancelled = false;

    async function fetchCatalogue() {
      setCatalogueLoading(true);
      try {
        const cropsData = await api.getCrops();
        if (!cancelled && cropsData && cropsData.length > 0) {
          setCatalogue(cropsData);
        }
      } catch {
        if (!cancelled) {
          const fallbackReqs: CropRequirement[] = fallbackCrops.map((c) => ({
            crop_id: c.id,
            name: c.id.charAt(0).toUpperCase() + c.id.slice(1),
            name_mr: c.id === "soybean" ? "सोयाबीन" : c.id === "cotton" ? "कापूस" : c.id,
            scientific_name: "",
            season: "kharif",
            crop_category: c.id === "soybean" ? "oilseed" : c.id === "cotton" ? "fibre" : "cereal",
            duration_days_min: 90,
            duration_days_max: 120,
            growth_stages: c.stages.map((st, idx) => ({
              stage_id: st.id,
              name: st.id.charAt(0).toUpperCase() + st.id.slice(1),
              name_mr: st.id,
              start_day: idx * 25,
              end_day: (idx + 1) * 25,
              water_requirement_tier: "moderate",
              is_critical_moisture_stage: idx === 2,
              sensitivities: [],
            })),
            sowing_window: {
              optimal_start_month: 6,
              optimal_start_day: 15,
              optimal_end_month: 7,
              optimal_end_day: 15,
              rationale: "Requires minimum 75 mm cumulative rainfall before sowing.",
            },
            min_soil_ph: 6.0,
            max_soil_ph: 8.0,
            suitable_textures: ["clay", "clay_loam", "loam"],
            sowing_soil_moisture_min_mm: 75.0,
            source_citation: "MPKV Rahuri Agronomic Guide",
            publisher: "Mahatma Phule Krishi Vidyapeeth, Rahuri",
            version: "v2024.1",
          }));
          setCatalogue(fallbackReqs);
        }
      } finally {
        if (!cancelled) setCatalogueLoading(false);
      }
    }

    fetchCatalogue();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeCropSpec = useMemo(() => {
    return catalogue.find((c) => c.crop_id.toLowerCase() === selectedCrop.toLowerCase()) || catalogue[0];
  }, [catalogue, selectedCrop]);

  const [reloadTrigger, setReloadTrigger] = useState(0);

  useEffect(() => {
    if (!hydrated || !selectedCrop) return;
    let cancelled = false;

    async function loadAnalysis() {
      setLoading(true);
      setBackendError(null);
      try {
        const targetSeason = activeCropSpec?.season === "perennial" ? "perennial" : activeCropSpec?.season || "kharif";
        const [soilRes, suitRes, sowRes] = await Promise.allSettled([
          api.getRegionalSoil(location.blockId),
          api.getCropSuitability(location.blockId, targetSeason, waterSource, selectedCrop),
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
          setBackendError("Live agronomic engine currently unreachable for this location.");
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Failed to load crop assessment";
          setBackendError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAnalysis();
    return () => {
      cancelled = true;
    };
  }, [hydrated, location.blockId, selectedCrop, activeCropSpec, waterSource, reloadTrigger]);

  const filteredCrops = useMemo(() => {
    return catalogue.filter((c) => {
      if (selectedCategory !== "all") {
        if (selectedCategory === "cash") {
          if (c.crop_category !== "fibre" && c.crop_category !== "commercial") return false;
        } else if (c.crop_category.toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }
      }

      if (selectedSeason !== "all") {
        if (c.season.toLowerCase() !== selectedSeason.toLowerCase() && c.season !== "perennial") {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesNameMr = c.name_mr.includes(searchQuery.trim());
        const matchesSci = c.scientific_name?.toLowerCase().includes(q);
        const matchesId = c.crop_id.toLowerCase().includes(q);
        return matchesName || matchesNameMr || matchesSci || matchesId;
      }

      return true;
    });
  }, [catalogue, selectedCategory, selectedSeason, searchQuery]);

  const activeSuitabilityResult = useMemo(() => {
    if (!suitability?.candidate_crops) return null;
    return (
      suitability.candidate_crops.find(
        (cand) => cand.crop_id.toLowerCase() === selectedCrop.toLowerCase()
      ) || suitability.candidate_crops[0]
    );
  }, [suitability, selectedCrop]);

  if (!hydrated) return null;

  function pickCrop(id: string) {
    setSelectedCrop(id);
    const target = catalogue.find((c) => c.crop_id === id);
    if (target && target.growth_stages.length > 0) {
      setSelectedStage(target.growth_stages[0].stage_id);
    }
  }

  function confirm() {
    setCrop(selectedCrop, selectedStage);
    router.push("/farmer/dashboard");
  }

  return (
    <div className="space-y-8 bg-[#F4F0E5] text-[#252923]">
      
      {/* ── Top Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-[#123C32]/20 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded border border-[#123C32] bg-[#123C32] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#F4F0E5]">
              Agronomy Catalogue
            </span>
            <span className="font-mono text-xs font-semibold text-[#123C32]">
              {districtName} · Block {blockName}
            </span>
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-[#123C32] sm:text-3xl">
            {language === "mr" ? "पीक कॅटलॉग व उपयुक्तता मूल्यमापन" : "Crop Discovery & Suitability Matrix"}
          </h1>
          <p className="mt-1 font-sans text-xs text-[#252923]/70 sm:text-sm">
            {language === "mr"
              ? "स्थानिक माती, तापमान आणि पर्जन्यमानानुसार अधिकृत पीक शिफारशी."
              : "24 accredited Maharashtra crops evaluated against regional soil chemistry and 14-day rainfall."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/farmer/dashboard"
            className="flex items-center gap-1.5 rounded-lg border-2 border-[#123C32] bg-white px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-[#123C32] shadow-[2px_2px_0px_#123C32] hover:bg-[#F4F0E5]"
          >
            <span>Return to Dashboard</span>
          </Link>
          <button
            type="button"
            onClick={confirm}
            className="flex items-center gap-2 rounded-lg border-2 border-[#123C32] bg-[#123C32] px-5 py-2 font-mono text-xs font-bold uppercase tracking-wider text-[#F4F0E5] shadow-[3px_3px_0px_#252923] hover:bg-[#172B4D]"
          >
            <Check size={14} className="text-[#E6A52E]" />
            <span>Select & Monitor</span>
          </button>
        </div>
      </div>

      {backendError && (
        <div className="flex items-center justify-between rounded-xl border-2 border-[#C7473B] bg-white p-4 font-mono text-xs text-[#C7473B] shadow-[2px_2px_0px_#C7473B]">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} />
            <span>{backendError}</span>
          </div>
          <button
            onClick={() => setReloadTrigger((prev) => prev + 1)}
            className="rounded border border-[#C7473B] px-2 py-1 uppercase hover:bg-[#C7473B] hover:text-white"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Search & Filter Controls Panel ── */}
      <div className="rounded-xl border-2 border-[#123C32] bg-white p-6 shadow-[4px_4px_0px_#123C32]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#123C32]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search crop or variety (e.g. Cotton, Soybean, JS-335)..."
              className="w-full rounded-lg border-2 border-[#123C32]/30 bg-[#F4F0E5]/50 py-2.5 pl-10 pr-9 font-sans text-xs text-[#252923] outline-none transition focus:border-[#123C32] focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#252923]/50 hover:text-[#252923]"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[#123C32]/70">Water:</span>
              <select
                value={waterSource}
                onChange={(e) => setWaterSource(e.target.value)}
                className="rounded border-2 border-[#123C32]/30 bg-white px-2.5 py-1.5 font-sans text-xs font-semibold text-[#252923] outline-none focus:border-[#123C32]"
              >
                <option value="rainfed">Rainfed (जिरायती / कोरडवाहू)</option>
                <option value="protective_irrigation">Protective (विहीर / शेततळे)</option>
                <option value="assured_irrigation">Assured Perennial (कालवा / ठिबक)</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[#123C32]/70">Season:</span>
              <select
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(e.target.value)}
                className="rounded border-2 border-[#123C32]/30 bg-white px-2.5 py-1.5 font-sans text-xs font-semibold text-[#252923] outline-none focus:border-[#123C32]"
              >
                <option value="all">All Seasons</option>
                <option value="kharif">Kharif (खरीप)</option>
                <option value="rabi">Rabi (रब्बी)</option>
                <option value="perennial">Perennial (बारमाही)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="mt-4 flex flex-wrap gap-2 border-t-2 border-[#123C32]/10 pt-4">
          {CATEGORY_TABS.map((tab) => {
            const active = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id)}
                className={`rounded-md border-2 px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider transition-all ${
                  active
                    ? "border-[#123C32] bg-[#123C32] text-[#F4F0E5] shadow-[2px_2px_0px_#252923]"
                    : "border-[#123C32]/30 bg-white text-[#252923] hover:border-[#123C32] hover:bg-[#F4F0E5]"
                }`}
              >
                {language === "mr" ? tab.labelMr : tab.labelEn}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 2-Column Main Workspace: Crop Gallery (Left) & Crop Spec Sheet (Right) ── */}
      <div className="grid gap-8 lg:grid-cols-12 items-start">
        
        {/* Left Column: Responsive 24-Crop Grid (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between font-mono text-xs text-[#252923]/70">
            <span>
              Showing {filteredCrops.length} of {catalogue.length} crops
            </span>
            {catalogueLoading && <RefreshCw size={13} className="animate-spin text-[#123C32]" />}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {filteredCrops.map((c) => {
              const active = c.crop_id.toLowerCase() === selectedCrop.toLowerCase();
              const thumb = cropThumb(c.crop_id);
              const thumbSrc = thumb?.src ?? "/images/crops/soybean.jpg";
              const suit = suitability?.candidate_crops.find(
                (cand) => cand.crop_id.toLowerCase() === c.crop_id.toLowerCase()
              );

              return (
                <button
                  key={c.crop_id}
                  type="button"
                  onClick={() => pickCrop(c.crop_id)}
                  className={`group relative flex flex-col overflow-hidden rounded-xl border-2 text-left transition-all ${
                    active
                      ? "border-[#123C32] bg-white shadow-[4px_4px_0px_#123C32] ring-2 ring-[#E6A52E]"
                      : "border-[#123C32]/30 bg-white hover:border-[#123C32] hover:shadow-[3px_3px_0px_#123C32]"
                  }`}
                >
                  {/* Photo with Overlay Badge */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#123C32]/10">
                    <Photo
                      src={thumbSrc}
                      alt={c.name}
                      sizes="180px"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {active && (
                      <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border border-[#123C32] bg-[#E6A52E] text-[#123C32] shadow-xs">
                        <Check size={14} strokeWidth={3} />
                      </span>
                    )}
                    <span className="absolute bottom-2 left-2 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-white backdrop-blur-xs">
                      {c.crop_category}
                    </span>
                  </div>

                  <div className="p-3">
                    <h3 className="font-display text-sm font-bold text-[#252923] group-hover:text-[#123C32]">
                      {c.name}
                    </h3>
                    <p className="font-devanagari text-xs text-[#252923]/70">{c.name_mr}</p>

                    <div className="mt-2.5 flex items-center justify-between border-t border-[#123C32]/10 pt-2 font-mono text-[10px]">
                      <span className="text-[#252923]/60">{c.season}</span>
                      <span className="font-bold text-[#123C32]">{c.duration_days_max}d</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Crop Detailed Spec & Suitability Cockpit (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {activeCropSpec && (
            <div className="rounded-xl border-3 border-[#123C32] bg-white p-6 shadow-[6px_6px_0px_#123C32]">
              {/* Header */}
              <div className="flex items-center justify-between border-b-2 border-[#123C32]/15 pb-4">
                <div>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#123C32]/60">
                    Selected Crop Profile
                  </span>
                  <h2 className="font-display text-2xl font-black text-[#123C32]">{activeCropSpec.name}</h2>
                  <p className="font-devanagari text-sm font-semibold text-[#252923]/80">{activeCropSpec.name_mr}</p>
                </div>
                <div className="text-right">
                  <span className="rounded border border-[#123C32] bg-[#123C32] px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-[#F4F0E5]">
                    {activeCropSpec.season}
                  </span>
                </div>
              </div>

              {/* Photo & Botanical Meta */}
              <div className="mt-4 flex gap-4">
                <div className="w-28 shrink-0 overflow-hidden rounded-lg border-2 border-[#123C32]/30">
                  <Photo
                    src={cropThumb(activeCropSpec.crop_id)?.src ?? "/images/crops/soybean.jpg"}
                    alt={activeCropSpec.name}
                    sizes="120px"
                    className="aspect-square w-full object-cover"
                  />
                </div>
                <div className="space-y-1.5 font-mono text-xs">
                  <p>
                    <span className="text-[#252923]/60">Duration:</span>{" "}
                    <strong>{activeCropSpec.duration_days_min}–{activeCropSpec.duration_days_max} days</strong>
                  </p>
                  <p>
                    <span className="text-[#252923]/60">Soil pH:</span>{" "}
                    <strong>{activeCropSpec.min_soil_ph} – {activeCropSpec.max_soil_ph}</strong>
                  </p>
                  <p>
                    <span className="text-[#252923]/60">Sowing Rain:</span>{" "}
                    <strong className="text-[#123C32]">{activeCropSpec.sowing_soil_moisture_min_mm} mm req</strong>
                  </p>
                  <p className="font-sans text-[11px] text-[#252923]/70 italic line-clamp-2">
                    {activeCropSpec.scientific_name}
                  </p>
                </div>
              </div>

              {/* Growth Stage Selector */}
              <div className="mt-5 border-t-2 border-[#123C32]/10 pt-4">
                <label className="font-mono text-xs font-bold uppercase tracking-wider text-[#123C32]">
                  Select Growth Stage:
                </label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {activeCropSpec.growth_stages.map((st) => {
                    const active = selectedStage === st.stage_id;
                    return (
                      <button
                        key={st.stage_id}
                        type="button"
                        onClick={() => setSelectedStage(st.stage_id)}
                        className={`rounded-lg border-2 p-2.5 text-left font-mono text-xs transition ${
                          active
                            ? "border-[#123C32] bg-[#123C32] text-[#F4F0E5] shadow-[2px_2px_0px_#252923]"
                            : "border-[#123C32]/20 bg-white text-[#252923] hover:border-[#123C32]"
                        }`}
                      >
                        <p className="font-bold truncate">{st.name}</p>
                        <p className="text-[10px] opacity-75">{st.name_mr}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Location Suitability Assessment Strip */}
              <div className="mt-5 rounded-lg border-2 border-[#123C32]/20 bg-[#F4F0E5] p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#123C32]">
                    Block Soil & Climate Fit
                  </span>
                  {loading && <RefreshCw size={12} className="animate-spin text-[#123C32]" />}
                </div>
                <div className="mt-2 space-y-1.5 font-sans text-xs text-[#252923]">
                  <p>
                    <strong>Soil Profile:</strong> {soil?.dominant_texture || "Deep Vertisol Clay"} in {blockName}
                  </p>
                  <p>
                    <strong>Sowing Readiness:</strong>{" "}
                    <span className="font-bold text-[#123C32]">
                      {sowing?.sowing_readiness_summary_en || "Rainfall threshold monitored daily."}
                    </span>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={confirm}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-[#123C32] bg-[#123C32] py-3 font-mono text-xs font-bold uppercase tracking-wider text-[#F4F0E5] shadow-[4px_4px_0px_#252923] transition hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_#252923] active:translate-x-[0px] active:translate-y-[0px]"
                >
                  <CheckCircle2 size={16} className="text-[#E6A52E]" />
                  <span>Set as Active Crop</span>
                </button>
              </div>
            </div>
          )}

          {/* Live Soil Strata & Vapsa Depth Widget */}
          <SoilVapsaDepthWidget soil={soil} cropName={activeCropSpec?.name} />
        </div>
      </div>
    </div>
  );
}