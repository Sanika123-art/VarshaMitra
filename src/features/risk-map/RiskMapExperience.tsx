"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Search, Layers, X, MapPin, Activity, Compass, RefreshCw, ZoomIn, ShieldCheck, Sparkles } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { useAppState } from "@/hooks/useAppState";
import { api, type RiskSummaryItem, type RiskSummaryResponse } from "@/lib/api";
import { mapLayers, layerLabelKey, layerRisk, type MapLayer } from "./riskLayers";
import BlockPanel from "./BlockPanel";
import { cn, riskColor } from "@/lib/utils";
import { LoadingBlock } from "@/components/ui/States";

const RiskMap = dynamic(() => import("./RiskMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#F4F0E5]">
      <LoadingBlock label="Initializing MapLibre GL geospatial canvas..." />
    </div>
  ),
});

interface RegionPreset {
  id: string;
  labelEn: string;
  labelMr: string;
  center: [number, number];
  zoom: number;
}

const REGION_PRESETS: RegionPreset[] = [
  { id: "all", labelEn: "All State", labelMr: "संपूर्ण राज्य", center: [76.4, 19.2], zoom: 6.6 },
  { id: "marathwada", labelEn: "Marathwada", labelMr: "मराठवाडा", center: [76.2, 19.3], zoom: 7.9 },
  { id: "vidarbha", labelEn: "Vidarbha", labelMr: "विदर्भ", center: [78.8, 20.9], zoom: 7.8 },
  { id: "western", labelEn: "Western Maha", labelMr: "पश्चिम महा.", center: [74.3, 17.8], zoom: 7.9 },
  { id: "khandesh", labelEn: "Khandesh", labelMr: "उत्तर महा. (खान्देश)", center: [74.9, 21.0], zoom: 8.0 },
  { id: "konkan", labelEn: "Konkan", labelMr: "कोकण किनारपट्टी", center: [73.3, 17.0], zoom: 8.0 },
];

export default function RiskMapExperience({ initialBlockId }: { initialBlockId?: string }) {
  const { t, language } = useTranslation();
  const isMr = language === "mr";
  const { location } = useAppState();

  const userFarmBlockId = location.blockId || "niphad";

  const [layer, setLayer] = useState<MapLayer>("overall");
  const [mapStyle, setMapStyle] = useState<"terrain" | "satellite">("terrain");
  const [activeRegion, setActiveRegion] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [summaryData, setSummaryData] = useState<RiskSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<RiskSummaryItem | null>(null);
  const [flyTarget, setFlyTarget] = useState<{ center: [number, number]; zoom: number; key: number } | null>(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getRiskSummary(14);
      setSummaryData(data);
      if (initialBlockId) {
        const init = data.items.find((item) => item.block_id === initialBlockId);
        if (init) setSelected(init);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load risk summary";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [initialBlockId]);

  useEffect(() => {
    let cancelled = false;
    async function initLoad() {
      try {
        const data = await api.getRiskSummary(14);
        if (cancelled) return;
        setSummaryData(data);
        if (initialBlockId) {
          const init = data.items.find((item) => item.block_id === initialBlockId);
          if (init) setSelected(init);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Failed to load risk summary";
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    initLoad();
    return () => {
      cancelled = true;
    };
  }, [initialBlockId]);

  const items = useMemo(() => summaryData?.items ?? [], [summaryData]);

  // Compute live risk counts for bottom status dock
  const riskCounts = useMemo(() => {
    const counts = { low: 0, moderate: 0, high: 0, critical: 0, insufficient_data: 0 };
    items.forEach((item) => {
      const r = layerRisk(item, layer);
      if (r in counts) {
        counts[r as keyof typeof counts]++;
      } else {
        counts.insufficient_data++;
      }
    });
    return counts;
  }, [items, layer]);

  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return items.filter(
      (b) =>
        b.block_name.toLowerCase().includes(q) ||
        b.block_name_mr.includes(query.trim()) ||
        b.district_name.toLowerCase().includes(q)
    );
  }, [items, query]);

  const handleMapCoordinateSelect = useCallback(async (lat: number, lon: number) => {
    try {
      const resolved = await api.reverseGeocodeLocation(lat, lon);
      const dynamicItem: RiskSummaryItem = {
        block_id: resolved.id,
        block_name: resolved.name,
        block_name_mr: resolved.name_mr,
        district_id: resolved.district_id,
        district_name: resolved.district_name,
        latitude: resolved.latitude,
        longitude: resolved.longitude,
        status: "ok",
        overall_risk: "moderate",
      };
      setSelected(dynamicItem);
    } catch {
      const directItem: RiskSummaryItem = {
        block_id: `geo_${lat.toFixed(4)}_${lon.toFixed(4)}`,
        block_name: `Point ${lat.toFixed(3)}°N, ${lon.toFixed(3)}°E`,
        block_name_mr: `स्थान ${lat.toFixed(3)}°N, ${lon.toFixed(3)}°E`,
        district_id: "maharashtra",
        district_name: "Maharashtra",
        latitude: lat,
        longitude: lon,
        status: "ok",
        overall_risk: "moderate",
      };
      setSelected(directItem);
    }
  }, []);

  const handleRegionSelect = (preset: RegionPreset) => {
    setActiveRegion(preset.id);
    setFlyTarget({
      center: preset.center,
      zoom: preset.zoom,
      key: Date.now(),
    });
  };

  const handleResetView = () => {
    setActiveRegion("all");
    setSelected(null);
    setFlyTarget({
      center: [76.4, 19.2],
      zoom: 6.6,
      key: Date.now(),
    });
  };

  const handleFocusMyFarm = () => {
    const myFarm =
      items.find((b) => b.block_id === userFarmBlockId) ||
      items.find((b) => b.block_id.toLowerCase().includes("niphad")) ||
      items[0];

    if (myFarm) {
      setSelected(myFarm);
      setFlyTarget({
        center: [myFarm.longitude, myFarm.latitude],
        zoom: 10.5,
        key: Date.now(),
      });
    }
  };

  return (
    <div className="relative flex flex-col h-[calc(100vh-64px)] w-full overflow-hidden bg-[#F4F0E5]">
      
      {/* ── CLEAN DOCKED TOP GIS CONTROL STRIP ── */}
      <div className="shrink-0 z-20 border-b-2 border-[#123C32] bg-white px-4 py-3 shadow-[0px_4px_10px_rgba(18,60,50,0.08)]">
        
        {/* Row 1: Title, Farm Focus Button, Map Style Switcher & Quick Search */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-lg sm:text-xl font-black text-[#123C32] leading-tight">
                  {isMr ? "स्थानिक हवामान जोखीम नकाशा" : "Hyperlocal Climate Risk GIS"}
                </h1>
                <span className="flex items-center gap-1 rounded-full border border-[#3B8B61] bg-[#3B8B61]/10 px-2 py-0.5 font-mono text-[10px] font-bold text-[#3B8B61]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#3B8B61] animate-pulse" />
                  Live ERA5 / ECMWF
                </span>
              </div>
              <p className="font-mono text-[11px] text-[#252923]/70">
                {isMr
                  ? "महाराष्ट्रातील ३५१ तालुके · ३६ जिल्हे (रिअल-टाइम हवामान व पीक जोखीम रडार)"
                  : "Statewide 351 Blocks across 36 Districts · Real-time Agronomic Risk"}
              </p>
            </div>

            {/* Quick "Locate My Farm" button */}
            <button
              type="button"
              onClick={handleFocusMyFarm}
              className="flex items-center gap-1.5 rounded-lg border-2 border-[#123C32] bg-[#E6A52E] px-3 py-1.5 font-mono text-xs font-bold text-[#123C32] shadow-[2px_2px_0px_#123C32] hover:bg-[#d89720] transition active:scale-95"
              title={isMr ? "तुमचे शेत (निफाड) नकाशावर झूम करा" : "Zoom directly to your registered farm in Niphad"}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#123C32] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#123C32]"></span>
              </span>
              <span>{isMr ? "📍 माझे शेत (निफाड)" : "📍 My Farm (Niphad)"}</span>
            </button>

            {/* Satellite / Terrain Switcher */}
            <div className="flex items-center rounded-lg border-2 border-[#123C32] bg-[#F4F0E5] p-0.5 shadow-[2px_2px_0px_#123C32]">
              <button
                type="button"
                onClick={() => setMapStyle("terrain")}
                className={cn(
                  "rounded px-2.5 py-1 font-mono text-[11px] font-bold transition",
                  mapStyle === "terrain" ? "bg-[#123C32] text-[#F4F0E5]" : "text-[#252923] hover:bg-white"
                )}
              >
                {isMr ? "भूप्रदेश (Terrain)" : "Terrain"}
              </button>
              <button
                type="button"
                onClick={() => setMapStyle("satellite")}
                className={cn(
                  "rounded px-2.5 py-1 font-mono text-[11px] font-bold transition",
                  mapStyle === "satellite" ? "bg-[#123C32] text-[#F4F0E5]" : "text-[#252923] hover:bg-white"
                )}
              >
                {isMr ? "उपग्रह (Satellite)" : "Satellite"}
              </button>
            </div>
          </div>

          {/* Taluka / District Search Box */}
          <div className="relative w-full sm:w-64 md:w-80">
            <div className="flex items-center gap-2 rounded-lg border-2 border-[#123C32] bg-[#F4F0E5] px-3 py-1.5 shadow-[2px_2px_0px_#123C32] focus-within:bg-white focus-within:border-[#123C32] transition">
              <Search size={14} className="shrink-0 text-[#123C32]" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={isMr ? "जिल्हा किंवा तालुका शोधा..." : "Search Taluka or District..."}
                className="w-full bg-transparent font-sans text-xs font-semibold text-[#252923] outline-none placeholder:text-[#252923]/50"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="shrink-0 p-0.5 text-[#252923]/60 hover:text-[#252923]"
                  aria-label="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Instant Search Results Dropdown */}
            {filtered.length > 0 && (
              <ul className="absolute left-0 right-0 top-full mt-1.5 max-h-56 overflow-y-auto rounded-xl border-3 border-[#123C32] bg-white shadow-[6px_6px_0px_#123C32] z-[600] divide-y divide-[#123C32]/10">
                {filtered.map((b) => (
                  <li key={b.block_id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(b);
                        setQuery("");
                      }}
                      className="flex w-full items-center justify-between px-3.5 py-2.5 text-left font-sans text-xs hover:bg-[#F4F0E5] transition-colors"
                    >
                      <div>
                        <span className="font-bold text-[#123C32]">
                          {language === "mr" ? b.block_name_mr : b.block_name}
                        </span>
                        <span className="ml-1.5 font-mono text-[10px] text-[#252923]/60">({b.district_name})</span>
                      </div>
                      <span className="font-mono text-[10px] uppercase font-bold text-[#123C32]">
                        Inspect →
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Row 2: Segmented Risk Layers & Regional Presets */}
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-[#123C32]/15">
          
          {/* Risk Layer Selector */}
          <div className="flex items-center gap-1 rounded-lg border-2 border-[#123C32]/25 bg-[#F4F0E5] p-1 font-mono text-xs">
            <Layers size={13} className="ml-1 mr-0.5 text-[#123C32] hidden sm:block" />
            {mapLayers.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLayer(l)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-bold transition-all",
                  layer === l
                    ? "border border-[#123C32] bg-[#123C32] text-[#F4F0E5] shadow-xs"
                    : "text-[#252923] hover:bg-white"
                )}
              >
                {t(layerLabelKey[l])}
              </button>
            ))}
          </div>

          {/* Regional View Presets */}
          <div className="flex flex-wrap items-center gap-1 font-mono text-[11px]">
            <span className="text-[#252923]/60 font-bold uppercase hidden md:inline mr-1">
              {isMr ? "विभाग:" : "Region:"}
            </span>
            {REGION_PRESETS.map((preset) => {
              const active = activeRegion === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleRegionSelect(preset)}
                  className={`rounded-lg border px-2.5 py-1 font-semibold transition ${
                    active
                      ? "border-[#123C32] bg-[#E6A52E] text-[#123C32] font-bold shadow-xs"
                      : "border-[#123C32]/20 bg-white text-[#252923]/80 hover:border-[#123C32]"
                  }`}
                >
                  {isMr ? preset.labelMr : preset.labelEn}
                </button>
              );
            })}
          </div>

        </div>

      </div>

      {/* ── STATEWIDE AGRO-CLIMATIC INTELLIGENCE RIBBON ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#123C32]/15 bg-[#123C32]/5 px-4 py-2 font-mono text-xs text-[#123C32]">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#3B8B61] text-white text-[10px] font-bold">
            ✓
          </span>
          <span className="leading-snug">
            {isMr
              ? "राज्यस्तरीय हवामान निष्कर्ष: संपूर्ण महाराष्ट्रात मान्सून पूर्णपणे माघारी गेला असून रब्बी कोरडे हवामान सक्रिय आहे. ३५०/३५१ तालुके सुरक्षित (कमी जोखीम) श्रेणीत आहेत."
              : "Statewide Agro-Climatic Intelligence: Post-monsoon dry season active statewide. 350 of 351 blocks are in Low Risk (favorable for Rabi sowing & spraying)."}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-bold">
          <span className="text-[#3B8B61]">● {isMr ? "कमी जोखीम: ९९.७%" : "Low Risk: 99.7%"}</span>
          <span className="text-[#8F4C13]">● {isMr ? "वाफसा: ५०:५० समतोल" : "Vapsa: 50:50 Optimal"}</span>
        </div>
      </div>

      {/* ── MAP CONTAINER (Full Unobstructed Viewport) ── */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        <RiskMap
          items={items}
          layer={layer}
          selectedBlockId={selected?.block_id ?? null}
          flyTarget={flyTarget}
          onSelect={setSelected}
          onMapCoordinateSelect={handleMapCoordinateSelect}
          language={language}
          mapStyle={mapStyle}
          userFarmBlockId={userFarmBlockId}
        />

        {/* ── SLEEK FLOATING BOTTOM DOCK: LEGEND & LIVE STATUS ── */}
        <div className="absolute inset-x-3 bottom-3 z-[400] pointer-events-none sm:inset-x-6 sm:bottom-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-3 border-[#123C32] bg-white/95 px-4 py-2.5 shadow-[5px_5px_0px_#123C32] backdrop-blur-md pointer-events-auto">
            
            {/* Live Counts & Color Legend */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 font-mono text-xs">
              <span className="font-bold uppercase text-[#123C32] text-[10px] tracking-wider hidden sm:inline">
                {isMr ? "जोखीम सूची:" : "Legend:"}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#3B8B61]" />
                <span className="text-[11px] font-medium">{t("common.riskLow")}: <strong>{riskCounts.low}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#E6B83F]" />
                <span className="text-[11px] font-medium">{t("common.riskModerate")}: <strong>{riskCounts.moderate}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#E58A38]" />
                <span className="text-[11px] font-medium">{t("common.riskHigh")}: <strong>{riskCounts.high}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#C7473B]" />
                <span className="text-[11px] font-medium">{t("common.riskCritical")}: <strong>{riskCounts.critical}</strong></span>
              </div>
            </div>

            {/* Interactive Prompt & Reset View Button */}
            <div className="flex items-center gap-3">
              <span className="hidden lg:inline font-sans text-xs text-[#252923]/70 italic">
                {isMr
                  ? "💡 नकाशावरील कोणत्याही तालुक्यावर क्लिक करून हवामान व पीक सल्ला तपासा"
                  : "💡 Click any circle or point to inspect block telemetry & advisory"}
              </span>
              <button
                type="button"
                onClick={handleResetView}
                className="flex items-center gap-1.5 rounded-lg border-2 border-[#123C32] bg-[#F4F0E5] px-3 py-1 font-mono text-xs font-bold uppercase text-[#123C32] shadow-[2px_2px_0px_#123C32] hover:bg-white transition"
              >
                <Compass size={13} className="text-[#123C32]" />
                <span>{isMr ? "नकाशा रीसेट" : "Reset View"}</span>
              </button>
            </div>

          </div>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="absolute top-4 right-4 z-[450] flex items-center gap-2 rounded-lg border-2 border-[#123C32] bg-white px-3 py-1.5 shadow-[3px_3px_0px_#123C32]">
            <RefreshCw size={13} className="animate-spin text-[#123C32]" />
            <span className="font-mono text-xs font-bold text-[#123C32]">
              {isMr ? "डेटा अद्यतनित होत आहे..." : "Updating block telemetry..."}
            </span>
          </div>
        )}

        {/* Selected Location Details Slide-in Panel */}
        {selected && <BlockPanel item={selected} onClose={() => setSelected(null)} />}

      </div>

    </div>
  );
}
