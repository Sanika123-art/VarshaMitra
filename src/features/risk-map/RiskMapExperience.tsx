"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Activity, LocateFixed, MapPin, RefreshCw, Search, ShieldAlert } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { useAppState } from "@/hooks/useAppState";
import { api, type RiskSummaryItem, type RiskSummaryResponse } from "@/lib/api";
import type { RiskLevel } from "@/types";
import { LoadingBlock } from "@/components/ui/States";
import { riskColor } from "@/lib/utils";
import { mapLayers, layerLabelKey, layerRisk, type MapLayer } from "./riskLayers";
import BlockPanel from "./BlockPanel";

const RiskMap = dynamic(() => import("./RiskMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[#EEF1EA]">
      <LoadingBlock label="Loading map…" />
    </div>
  ),
});

type MapMode = "farmer" | "officer";
type RiskFilter = "all" | RiskLevel;
type WindowDays = 7 | 14 | 30;

const LAYER_DATA_KEY: Record<MapLayer, string> = {
  overall: "overall_risk",
  onset: "monsoon_onset",
  drySpell: "dry_spell",
  heavyRain: "heavy_rainfall",
  rainfallForecast: "rainfall_forecast",
  historicalRainfall: "historical_rainfall",
};

function isRiskLevel(value: string): value is RiskLevel {
  return ["low", "moderate", "high", "critical", "insufficient_data"].includes(value);
}

export default function RiskMapExperience({
  initialBlockId,
  mode,
}: {
  initialBlockId?: string;
  mode: MapMode;
}) {
  const { t, language } = useTranslation();
  const isMr = language === "mr";
  const { location, cropId, stageId, setLocation } = useAppState();
  const isOfficer = mode === "officer";
  const [layer, setLayer] = useState<MapLayer>("overall");
  const [mapStyle, setMapStyle] = useState<"risk" | "roads" | "satellite">("risk");
  const [query, setQuery] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("all");
  const [selectedBlockFilter, setSelectedBlockFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
  const [windowDays, setWindowDays] = useState<WindowDays>(14);
  const [summaryData, setSummaryData] = useState<RiskSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<RiskSummaryItem | null>(null);
  const [selectingPoint, setSelectingPoint] = useState(false);
  const [flyTarget, setFlyTarget] = useState<{
    center: [number, number];
    zoom: number;
    key: number;
  } | null>(null);

  const fetchSummary = useCallback(async (days: WindowDays = windowDays) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getRiskSummary(days);
      setSummaryData(data);
      if (initialBlockId) {
        const initial = data.items.find((item) => item.block_id === initialBlockId);
        if (initial) setSelected(initial);
      }
    } catch (fetchError: unknown) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load map data.");
    } finally {
      setLoading(false);
    }
  }, [initialBlockId, windowDays]);

  useEffect(() => {
    // This effect intentionally starts the initial and window-change map-data request.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchSummary();
  }, [fetchSummary]);

  const items = useMemo(() => summaryData?.items ?? [], [summaryData]);
  const districts = useMemo(() => {
    const distinct = new Map<string, { name: string; nameMr: string }>();
    for (const item of items) {
      distinct.set(item.district_id, {
        name: item.district_name,
        nameMr: item.district_name_mr ?? item.district_name,
      });
    }
    return [...distinct.entries()].sort((a, b) => a[1].name.localeCompare(b[1].name));
  }, [items]);

  const riskCounts = useMemo(() => {
    const counts: Record<RiskLevel, number> = {
      low: 0,
      moderate: 0,
      high: 0,
      critical: 0,
      insufficient_data: 0,
    };
    for (const item of items) {
      const risk = layerRisk(item, layer);
      counts[risk] += 1;
    }
    return counts;
  }, [items, layer]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    return items.filter((item) => {
      if (selectedDistrict !== "all" && item.district_id !== selectedDistrict) return false;
      if (selectedBlockFilter !== "all" && item.block_id !== selectedBlockFilter) return false;
      if (riskFilter !== "all" && layerRisk(item, layer) !== riskFilter) return false;
      if (!q) return true;
      return [
        item.block_name,
        item.block_name_mr,
        item.district_name,
        item.district_id,
      ].some((value) => value.toLocaleLowerCase().includes(q));
    });
  }, [items, layer, query, riskFilter, selectedBlockFilter, selectedDistrict]);

  const mapItems = useMemo(() => {
    if (selected && !filteredItems.some((item) => item.block_id === selected.block_id)) {
      return [...filteredItems, selected];
    }
    return filteredItems;
  }, [filteredItems, selected]);

  const handleMapCoordinateSelect = useCallback(async (lat: number, lon: number) => {
    setSelectingPoint(true);
    const id = `geo_${lat.toFixed(4)}_${lon.toFixed(4)}`;
    try {
      const risk = await api.getClimateRisk(id);
      const knownBlock = items.find(
        (item) => item.block_name.toLowerCase() === risk.block_name.toLowerCase()
      );
      const matchingDistrict = districts.find(
        ([, names]) => names.name.toLowerCase() === risk.district_name.toLowerCase()
      );
      setSelected({
        block_id: id,
        block_name: risk.block_name,
        block_name_mr: knownBlock?.block_name_mr ?? risk.block_name,
        district_id: knownBlock?.district_id ?? matchingDistrict?.[0] ?? "unknown",
        district_name: risk.district_name,
        district_name_mr: knownBlock?.district_name_mr ?? matchingDistrict?.[1].nameMr ?? risk.district_name,
        latitude: lat,
        longitude: lon,
        geometry_type: "Point",
        coordinates_precision: "selected_map_point",
        status: "ok",
        overall_risk: risk.overall_risk,
        confidence: risk.confidence,
        confidence_rationale: risk.confidence_rationale,
        assessment_time: risk.assessment_time,
        data_provenance: risk.data_provenance,
        window_start: risk.start_date,
        window_end: risk.end_date,
      });
    } catch (pointError: unknown) {
      setSelected({
        block_id: id,
        block_name: isMr ? "निवडलेला नकाशा-बिंदू" : "Selected map point",
        block_name_mr: "निवडलेला नकाशा-बिंदू",
        district_id: "unknown",
        district_name: isMr ? "अज्ञात" : "Unknown area",
        latitude: lat,
        longitude: lon,
        geometry_type: "Point",
        coordinates_precision: "selected_map_point",
        status: "unavailable",
        error: pointError instanceof Error ? pointError.message : "Risk data is unavailable for this point.",
      });
    } finally {
      setSelectingPoint(false);
    }
  }, [districts, isMr, items]);

  const focusFarm = () => {
    const farm = items.find((item) => item.block_id === location.blockId);
    if (!farm) return;
    setSelected(farm);
    setFlyTarget({ center: [farm.longitude, farm.latitude], zoom: 9.5, key: Date.now() });
  };

  const chooseDistrict = (districtId: string) => {
    setSelectedDistrict(districtId);
    setSelectedBlockFilter("all");
    setQuery("");
    const firstItem = items.find((item) => districtId === "all" || item.district_id === districtId);
    if (firstItem && districtId !== "all") {
      setFlyTarget({ center: [firstItem.longitude, firstItem.latitude], zoom: 8, key: Date.now() });
    }
  };

  const selectedCropName = isMr
    ? ({ soybean: "सोयाबीन", cotton: "कापूस", onion: "कांदा" }[cropId] ?? cropId)
    : ({ soybean: "Soybean", cotton: "Cotton", onion: "Onion" }[cropId] ?? cropId);

  const areaCounts = useMemo(() => ({
    high: filteredItems.filter((item) => item.status === "ok" && (item.overall_risk === "high" || item.overall_risk === "critical")).length,
    critical: filteredItems.filter((item) => item.status === "ok" && item.overall_risk === "critical").length,
    dry: filteredItems.filter((item) => item.status === "ok" && (item.dry_spell_severity === "significant" || item.dry_spell_severity === "critical")).length,
    heavy: filteredItems.filter((item) => item.status === "ok" && item.heavy_rain_event === true).length,
    quality: filteredItems.filter((item) => item.status === "ok" && (item.coverage_ratio ?? 0) >= 0.75).length,
  }), [filteredItems]);

  const layerAvailable = summaryData?.layers_available?.[LAYER_DATA_KEY[layer]] ?? false;
  const mapHeading = isOfficer
    ? (isMr ? "प्रादेशिक हवामान निरीक्षण" : "Regional climate monitoring")
    : (isMr ? "तुमच्या भागातील हवामान जोखीम" : "Climate risk near your farm");

  return (
    <main className="flex min-h-[calc(100dvh-64px)] flex-col bg-[#EEF1EA] text-[#16231B]">
      <header className="z-10 space-y-3 border-b border-black/10 bg-white px-3 py-3 shadow-sm sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-[220px]">
            <h1 className="font-display text-xl font-bold sm:text-2xl">{mapHeading}</h1>
            <p className="mt-1 max-w-3xl text-sm text-[#56645B]">{t("riskMapPage.subtitle")}</p>
            {mode === "farmer" && (
              <p className="mt-1 text-sm font-medium">
                {location.blockName}, {location.districtName} · {selectedCropName} · {stageId}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!isOfficer && (
              <button
                type="button"
                onClick={focusFarm}
                disabled={!items.some((item) => item.block_id === location.blockId)}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#1F4B3A] bg-[#1F4B3A] px-3 text-sm font-semibold text-white hover:bg-[#173a2d] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <LocateFixed size={17} />
                {isMr ? "माझा भाग" : "My area"}
              </button>
            )}
            <button
              type="button"
              onClick={() => void fetchSummary()}
              disabled={loading}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-black/15 bg-white px-3 text-sm font-semibold hover:bg-[#F4F4EF] disabled:opacity-60"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              {isMr ? "अद्यतनित करा" : "Refresh"}
            </button>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(210px,1.3fr)_minmax(150px,1fr)_minmax(150px,1fr)_auto_auto]">
          <label className="flex min-h-11 items-center gap-2 rounded-lg border border-black/15 bg-[#F8F9F6] px-3">
            <Search size={17} className="shrink-0 text-[#56645B]" />
            <span className="sr-only">{t("riskMapPage.searchPlaceholder")}</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("riskMapPage.searchPlaceholder")}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
          </label>

          <label className="flex min-h-11 items-center gap-2 rounded-lg border border-black/15 bg-[#F8F9F6] px-3 text-sm">
            <span className="shrink-0 font-medium">{isMr ? "स्तर" : "Layer"}</span>
            <select
              value={layer}
              onChange={(event) => setLayer(event.target.value as MapLayer)}
              className="min-w-0 flex-1 bg-transparent py-2 outline-none"
              aria-label={isMr ? "नकाशा स्तर" : "Map layer"}
            >
              {mapLayers.map((mapLayer) => (
                <option key={mapLayer} value={mapLayer}>{t(layerLabelKey[mapLayer])}</option>
              ))}
            </select>
          </label>

          {isOfficer && (
            <>
              <label className="flex min-h-11 items-center gap-2 rounded-lg border border-black/15 bg-[#F8F9F6] px-3 text-sm">
                <span className="shrink-0 font-medium">{t("riskMapPage.district")}</span>
                <select
                  value={selectedDistrict}
                  onChange={(event) => chooseDistrict(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent py-2 outline-none"
                >
                  <option value="all">{t("riskMapPage.allDistricts")}</option>
                  {districts.map(([id, names]) => <option key={id} value={id}>{isMr ? names.nameMr : names.name}</option>)}
                </select>
              </label>
              <label className="flex min-h-11 items-center gap-2 rounded-lg border border-black/15 bg-[#F8F9F6] px-3 text-sm">
                <span className="shrink-0 font-medium">{isMr ? "तालुका / ब्लॉक" : "Taluka / block"}</span>
                <select
                  value={selectedBlockFilter}
                  onChange={(event) => {
                    setSelectedBlockFilter(event.target.value);
                    const item = items.find((entry) => entry.block_id === event.target.value);
                    if (item) setSelected(item);
                  }}
                  className="min-w-0 flex-1 bg-transparent py-2 outline-none"
                >
                  <option value="all">{isMr ? "सर्व भाग" : "All monitored areas"}</option>
                  {items
                    .filter((item) => selectedDistrict === "all" || item.district_id === selectedDistrict)
                    .map((item) => (
                      <option key={item.block_id} value={item.block_id}>
                        {isMr ? item.block_name_mr : item.block_name}
                      </option>
                    ))}
                </select>
              </label>
              <div className="flex min-h-11 items-center gap-2 rounded-lg border border-black/15 bg-[#F8F9F6] px-3 text-sm">
                <span className="shrink-0 font-medium">{isMr ? "कालावधी" : "Window"}</span>
                <select
                  value={windowDays}
                  onChange={(event) => {
                    const days = Number(event.target.value);
                    if (days === 7 || days === 14 || days === 30) {
                      setWindowDays(days);
                    }
                  }}
                  className="min-w-0 flex-1 bg-transparent py-2 outline-none"
                  aria-label={t("riskMapPage.forecastPeriod")}
                >
                  <option value={7}>7 {t("common.days")}</option>
                  <option value={14}>14 {t("common.days")}</option>
                  <option value={30}>30 {t("common.days")}</option>
                </select>
              </div>
            </>
          )}
        </div>

        {isOfficer && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6" aria-label="Regional risk summary">
            {[
              [t("riskMapPage.monitoredAreas"), items.length],
              [t("riskMapPage.highRiskAreas"), areaCounts.high],
              [t("riskMapPage.criticalRiskAreas"), areaCounts.critical],
              [t("riskMapPage.drySpellAlerts"), areaCounts.dry],
              [t("riskMapPage.heavyRainAlerts"), areaCounts.heavy],
              [t("riskMapPage.dataQuality"), `${areaCounts.quality}/${items.filter((item) => item.status === "ok").length}`],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-lg border border-black/10 bg-[#F8F9F6] px-3 py-2">
                <div className="text-xs text-[#56645B]">{label}</div>
                <div className="mt-0.5 text-lg font-bold tabular-nums">{value}</div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="risk-level-filter">{t("riskMapPage.allRisks")}</label>
          {isOfficer && (
            <select
              id="risk-level-filter"
              value={riskFilter}
              onChange={(event) => {
                const value = event.target.value;
                setRiskFilter(value === "all" ? "all" : isRiskLevel(value) ? value : "all");
              }}
              className="min-h-10 rounded-lg border border-black/15 bg-white px-3 text-sm"
            >
              <option value="all">{t("riskMapPage.allRisks")}</option>
              {(["low", "moderate", "high", "critical", "insufficient_data"] as RiskLevel[]).map((risk) => (
                <option key={risk} value={risk}>{t(`common.${risk === "insufficient_data" ? "insufficientData" : `risk${risk[0].toUpperCase()}${risk.slice(1)}`}`)}</option>
              ))}
            </select>
          )}

          <label className="ml-auto flex min-h-10 items-center gap-2 rounded-lg border border-black/15 bg-white px-3 text-xs">
            {isMr ? "नकाशा" : "Map"}
            <select
              value={mapStyle}
              onChange={(event) => {
                const value = event.target.value;
                setMapStyle(value === "satellite" || value === "roads" ? value : "risk");
              }}
              className="bg-transparent py-2 text-sm outline-none"
              aria-label={isMr ? "नकाशा शैली" : "Basemap style"}
            >
              <option value="risk">{isMr ? "जोखीम नकाशा" : "Risk map"}</option>
              <option value="roads">{isMr ? "रस्ते" : "Roads"}</option>
              <option value="satellite">{isMr ? "उपग्रह" : "Satellite"}</option>
            </select>
          </label>
        </div>
      </header>

      <div className="relative min-h-[420px] flex-1">
        <RiskMap
          items={items}
          visibleBlockIds={mapItems.map((item) => item.block_id)}
          layer={layer}
          selectedBlockId={selected?.block_id ?? null}
          selectedDistrictId={selectedDistrict}
          selectedBlockFilter={selectedBlockFilter}
          riskFilter={isOfficer ? riskFilter : "all"}
          hasSearchQuery={Boolean(query.trim())}
          flyTarget={flyTarget}
          onSelect={setSelected}
          onMapCoordinateSelect={handleMapCoordinateSelect}
          language={language}
          mapStyle={mapStyle}
          userFarmBlockId={location.blockId}
        />

        <section
          aria-label={t("riskMapPage.legend")}
          className="absolute left-3 top-3 z-20 w-44 rounded-lg border border-black/10 bg-white/95 p-3 shadow-lg backdrop-blur sm:w-48"
        >
          <h2 className="mb-2 text-sm font-bold">{t("riskMapPage.legend")}</h2>
          <ul className="space-y-1.5">
            {(["low", "moderate", "high", "critical", "insufficient_data"] as RiskLevel[]).map((risk) => (
              <li key={risk} className="flex items-center gap-2 text-xs">
                <span
                  className="h-4 w-5 shrink-0 rounded-sm border border-black/15"
                  style={{ backgroundColor: riskColor[risk] }}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  {t(`common.${risk === "insufficient_data" ? "insufficientData" : `risk${risk[0].toUpperCase()}${risk.slice(1)}`}`)}
                </span>
                <strong className="tabular-nums">{riskCounts[risk]}</strong>
              </li>
            ))}
          </ul>
          <p className="mt-2 border-t border-black/10 pt-2 text-[10px] leading-snug text-[#56645B]">
            {isMr ? "करडा रंग म्हणजे जोखीम माहिती उपलब्ध नाही." : "Grey means risk data is unavailable."}
          </p>
        </section>

        <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-10 flex justify-center sm:bottom-4">
          <div className="pointer-events-auto max-w-3xl rounded-lg border border-[#1F4B3A]/20 bg-white/95 px-3 py-2 text-xs shadow-md backdrop-blur">
            <p className="flex items-start gap-2">
              <MapPin size={15} className="mt-0.5 shrink-0 text-[#1F4B3A]" />
              <span>{t("riskMapPage.noBoundaryNotice")}</span>
            </p>
            <details className="mt-1 pl-6 text-[#56645B]">
              <summary className="cursor-pointer font-semibold">
                {isMr ? "स्रोत आणि माहिती" : "Sources & details"}
              </summary>
              <p className="mt-1">{t("riskMapPage.boundaryAttribution")}</p>
              {!layerAvailable && <p className="mt-1">{t("riskMapPage.unavailableLayer")}</p>}
              {summaryData?.data_provenance && (
                <p className="mt-1">
                  {summaryData.data_provenance.provider_name} · {summaryData.data_provenance.data_type.replaceAll("_", " ")} · {summaryData.data_provenance.window_start}–{summaryData.data_provenance.window_end}
                  {summaryData.cached && ` · ${isMr ? "प्रतिसाद कॅश केला" : "Response cached"} ${Math.floor(summaryData.cache_age_seconds / 60)} ${isMr ? "मिनिटांपूर्वी" : "min ago"}`}
                </p>
              )}
            </details>
          </div>
        </div>

        {loading && (
          <div className="absolute right-3 top-3 z-10 flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm shadow">
            <RefreshCw size={15} className="animate-spin" />
            {isMr ? "माहिती अद्यतनित होत आहे" : "Updating climate data"}
          </div>
        )}
        {selectingPoint && (
          <div className="absolute left-3 top-3 z-10 rounded-lg bg-white px-3 py-2 text-sm shadow" role="status">
            <Activity size={15} className="mr-2 inline" />
            {isMr ? "निवडलेल्या बिंदूसाठी जोखीम तपासत आहे" : "Checking risk for selected point"}
          </div>
        )}
        {error && (
          <div role="alert" className="absolute left-3 right-3 top-3 z-10 rounded-lg border border-red-300 bg-white p-3 text-sm text-red-800 sm:right-auto sm:max-w-lg">
            <div className="flex items-center gap-2 font-semibold"><ShieldAlert size={16} />{isMr ? "नकाशा माहिती उपलब्ध नाही" : "Map data is unavailable"}</div>
            <p className="mt-1">{error}</p>
            <button type="button" onClick={() => void fetchSummary()} className="mt-2 min-h-10 rounded-md border border-red-300 px-3 font-semibold">{t("common.retry")}</button>
          </div>
        )}
        {isOfficer && (
          <div className="absolute right-3 top-14 z-10 hidden max-w-xs rounded-lg border border-black/10 bg-white/95 p-3 text-xs shadow sm:block">
            {t("riskMapPage.aggregatedOnly")}
          </div>
        )}
        {selected && (
          <BlockPanel
            key={`${selected.block_id}:${layer}:${cropId}:${stageId}:${language}`}
            item={selected}
            mode={mode}
            layer={layer}
            onClose={() => setSelected(null)}
            onUseAsFarm={() => setLocation({
              stateId: "mh",
              stateName: "Maharashtra",
              districtId: selected.district_id,
              districtName: selected.district_name,
              blockId: selected.block_id,
              blockName: selected.block_name,
              latitude: selected.latitude,
              longitude: selected.longitude,
            })}
          />
        )}
      </div>
    </main>
  );
}
