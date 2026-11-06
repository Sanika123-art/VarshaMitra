"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Search, Layers, X, MapPin, Activity } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { api, type RiskSummaryItem, type RiskSummaryResponse } from "@/lib/api";
import { mapLayers, layerLabelKey, type MapLayer } from "./riskLayers";
import BlockPanel from "./BlockPanel";
import { cn } from "@/lib/utils";
import { LoadingBlock } from "@/components/ui/States";

const RiskMap = dynamic(() => import("./RiskMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#F4F0E5]">
      <LoadingBlock label="Initializing MapLibre GL geospatial canvas..." />
    </div>
  ),
});

export default function RiskMapExperience({ initialBlockId }: { initialBlockId?: string }) {
  const { t, language } = useTranslation();
  const [layer, setLayer] = useState<MapLayer>("overall");
  const [query, setQuery] = useState("");
  const [summaryData, setSummaryData] = useState<RiskSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<RiskSummaryItem | null>(null);

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

  return (
    <div className="relative flex flex-col h-[calc(100vh-64px)] w-full overflow-hidden bg-[#F4F0E5]">
      {/* ── TOP CONTROL DECK ── */}
      <header
        aria-label="Map Controls"
        className="absolute inset-x-3 top-3 z-[450] pointer-events-none sm:inset-x-4 sm:top-4"
      >
        <div className="flex flex-col gap-2 pointer-events-auto">
          {/* Main Top Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-[#123C32] bg-white p-2.5 sm:p-3 shadow-[4px_4px_0px_#123C32]">
            {/* 1. Title & Scope Badge */}
            <div className="flex items-center gap-2 px-1">
              <div>
                <h1 className="font-display text-base font-bold text-[#123C32] sm:text-lg leading-tight">
                  {t("riskMapPage.title")}
                </h1>
                <p className="hidden md:block font-mono text-[10px] text-[#252923]/60 leading-none mt-0.5">
                  {summaryData?.coordinates_note ?? "Taluka centroids shown · Not exact farm boundaries"}
                </p>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1 rounded border border-[#123C32] bg-[#F4F0E5] px-2 py-0.5 font-mono text-[10px] font-bold text-[#123C32]">
                <Activity size={10} className="text-[#3B8B61]" />
                {summaryData ? `${summaryData.count} Blocks · 36 Districts` : "Statewide Maharashtra"}
              </span>
            </div>

            {/* 2. Risk Layer Selector Segmented Buttons */}
            <nav aria-label="Risk Layers" className="flex items-center gap-1 rounded-lg border-2 border-[#123C32]/20 bg-[#F4F0E5] p-1">
              <Layers size={13} className="ml-1 text-[#123C32] hidden lg:block" />
              {mapLayers.map((l) => (
                <button
                  key={l}
                  onClick={() => setLayer(l)}
                  className={cn(
                    "rounded px-2.5 py-1 font-mono text-xs font-bold uppercase tracking-wider transition-all",
                    layer === l
                      ? "border border-[#123C32] bg-[#123C32] text-[#F4F0E5] shadow-xs"
                      : "text-[#252923] hover:bg-white"
                  )}
                >
                  {t(layerLabelKey[l])}
                </button>
              ))}
            </nav>

            {/* 3. Taluka/District Search Input */}
            <div className="relative w-full sm:w-56 md:w-64">
              <div className="flex items-center gap-1.5 rounded-lg border-2 border-[#123C32]/30 bg-white px-2.5 py-1.5 shadow-xs focus-within:border-[#123C32]">
                <Search size={14} className="shrink-0 text-[#123C32]" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("riskMapPage.searchPlaceholder")}
                  className="w-full bg-transparent font-sans text-xs text-[#252923] outline-none placeholder:text-[#252923]/50"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="shrink-0 p-0.5 text-[#252923]/60 hover:text-[#252923]"
                    aria-label="Clear search"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Instant Search Results Dropdown */}
              {filtered.length > 0 && (
                <ul className="absolute left-0 right-0 top-full mt-1.5 max-h-52 overflow-y-auto rounded-lg border-2 border-[#123C32] bg-white shadow-[4px_4px_0px_#123C32] z-[600]">
                  {filtered.map((b) => (
                    <li key={b.block_id} className="border-b border-[#123C32]/10 last:border-b-0">
                      <button
                        onClick={() => {
                          setSelected(b);
                          setQuery("");
                        }}
                        className="flex w-full items-center justify-between px-3 py-2 text-left font-sans text-xs hover:bg-[#F4F0E5] transition-colors"
                      >
                        <span className="font-bold text-[#123C32]">
                          {language === "mr" ? b.block_name_mr : b.block_name}
                        </span>
                        <span className="font-mono text-[10px] text-[#252923]/60">{b.district_name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Non-blocking loading indicator ── */}
      {loading && (
        <div
          role="status"
          aria-live="polite"
          className="absolute top-20 right-4 z-[450] flex items-center gap-2 rounded-lg border-2 border-[#123C32] bg-white px-3 py-1.5 shadow-[3px_3px_0px_#123C32]"
        >
          <span className="h-2 w-2 rounded-full bg-[#3B8B61] animate-ping" />
          <span className="font-mono text-xs font-bold text-[#123C32]">
            {language === "mr" ? "डेटा अद्यतनित करत आहे..." : "Updating block telemetry..."}
          </span>
        </div>
      )}

      {/* ── Non-blocking error banner ── */}
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="absolute top-20 left-1/2 -translate-x-1/2 z-[450] max-w-md w-[calc(100%-2rem)]"
        >
          <div className="flex items-center justify-between gap-3 rounded-lg border-2 border-[#C7473B] bg-white p-3.5 shadow-[4px_4px_0px_#C7473B] text-[#C7473B]">
            <div className="text-xs">
              <p className="font-bold">
                {language === "mr" ? "जोखीम डेटा अनुपलब्ध आहे" : "Risk overlay temporarily unavailable"}
              </p>
              <p className="font-mono text-[11px] mt-0.5 line-clamp-1">{error}</p>
            </div>
            <button
              onClick={fetchSummary}
              className="shrink-0 rounded border border-[#C7473B] bg-[#C7473B] px-3 py-1 font-mono text-xs font-bold uppercase text-white hover:bg-black"
            >
              {language === "mr" ? "पुन्हा प्रयत्न करा" : "Retry"}
            </button>
          </div>
        </div>
      )}

      {/* ── MAP CONTAINER ── */}
      <div className="h-full w-full">
        <RiskMap
          items={items}
          layer={layer}
          selectedBlockId={selected?.block_id ?? null}
          onSelect={setSelected}
          onMapCoordinateSelect={handleMapCoordinateSelect}
          language={language}
        />
      </div>

      {/* ── STABLE DOCKED LEGEND (Bottom-Left) ── */}
      <aside
        aria-label="Map Legend"
        className="absolute bottom-4 left-4 z-[400] rounded-xl border-2 border-[#123C32] bg-white p-3.5 shadow-[4px_4px_0px_#123C32]"
      >
        <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-[#123C32]">
          {t("riskMapPage.legend")}
        </p>
        <div className="flex flex-col gap-1.5 font-mono text-xs">
          <LegendDot color="#3B8B61" label={t("common.riskLow")} />
          <LegendDot color="#E6B83F" label={t("common.riskModerate")} />
          <LegendDot color="#E58A38" label={t("common.riskHigh")} />
          <LegendDot color="#C7473B" label={t("common.riskCritical")} />
          <LegendDot color="#252923" label={language === "mr" ? "अपुरी माहिती" : "Insufficient Data"} />
        </div>
      </aside>

      {/* ── SELECTED LOCATION DETAILS PANEL ── */}
      {selected && <BlockPanel item={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-[#252923]">
      <span className="h-2.5 w-2.5 rounded-full border border-black/20 shrink-0" style={{ background: color }} />
      <span className="text-[11px] font-medium leading-tight">{label}</span>
    </div>
  );
}
