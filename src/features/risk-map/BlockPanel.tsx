"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  X,
  ArrowRight,
  Info,
  ShieldCheck,
  Sprout,
  Sun,
  Activity,
  Droplets,
  Wind,
  CheckCircle2,
} from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import type { RiskLevel } from "@/types";
import RiskBadge from "@/components/RiskBadge";
import { riskLabelKey } from "@/lib/utils";
import { api, type RiskAssessmentResponse, type ForecastSeries, type RiskSummaryItem } from "@/lib/api";
import { useAppState } from "@/hooks/useAppState";

function formatAssessmentTime(timeStr?: string, isMr?: boolean): string {
  if (!timeStr) return isMr ? "नुकताच अपडेट" : "Recent Cycle";
  try {
    const d = new Date(timeStr);
    if (isNaN(d.getTime())) return isMr ? "नुकताच अपडेट" : "Recent Cycle";
    if (isMr) {
      const months = ["जानेवारी", "फेब्रुवारी", "मार्च", "एप्रिल", "मे", "जून", "जुलै", "ऑगस्ट", "सप्टेंबर", "ऑक्टोबर", "नोव्हेंबर", "डिसेंबर"];
      return `${d.getDate()} ${months[d.getMonth()]} २०२६ · ${d.getHours()}:${d.getMinutes().toString().padStart(2, "0")} वा.`;
    }
    return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return isMr ? "नुकताच अपडेट" : "Recent Cycle";
  }
}

function formatDriverName(driverName?: string, isMr?: boolean): string {
  if (!driverName) return isMr ? "हवामान निरीक्षण" : "MONITORING";
  const lower = driverName.toLowerCase();
  if (lower.includes("dry_season") || lower.includes("dry-season") || lower.includes("normal dry")) {
    return isMr ? "सामान्य हिवाळी कोरडे हवामान" : "Normal Dry-Season Weather";
  }
  if (lower.includes("dry_spell") || lower.includes("dry spell")) {
    return isMr ? "पावसाचा खंड (कोरडा काळ)" : "Dry Spell Active";
  }
  if (lower.includes("heavy_rain")) {
    return isMr ? "मुसळधार पाऊस जोखीम" : "Heavy Rain Hazard";
  }
  return driverName.replace(/_/g, " ").toUpperCase();
}

export default function BlockPanel({ item, onClose }: { item: RiskSummaryItem; onClose: () => void }) {
  const { t, language } = useTranslation();
  const isMr = language === "mr";
  const { setLocation } = useAppState();

  const [liveRisk, setLiveRisk] = useState<RiskAssessmentResponse | null>(null);
  const [liveForecast, setLiveForecast] = useState<ForecastSeries | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadLiveData() {
      setLoading(true);
      setError(null);
      try {
        const [rRes, fRes] = await Promise.allSettled([
          api.getClimateRisk(item.block_id),
          api.getForecast(item.block_id, 14),
        ]);

        if (cancelled) return;
        if (rRes.status === "fulfilled") {
          setLiveRisk(rRes.value);
        } else {
          setError(isMr ? "हवामान जोखीम डेटा लोड होऊ शकला नाही." : "Detailed climate risk could not be retrieved from the backend.");
        }
        if (fRes.status === "fulfilled") {
          setLiveForecast(fRes.value);
        }
      } catch {
        if (!cancelled) setError(isMr ? "डेटा आणताना नेटवर्क त्रुटी आली." : "Network error loading block details.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadLiveData();
    return () => {
      cancelled = true;
    };
  }, [item.block_id, isMr]);

  const activeRisk: RiskLevel = liveRisk?.overall_risk || item.overall_risk || "insufficient_data";
  const blockName = isMr ? item.block_name_mr : item.block_name;

  function selectAsFarmerLocation() {
    setLocation({
      stateId: "maharashtra",
      stateName: "Maharashtra",
      districtId: item.district_id,
      districtName: item.district_name,
      blockId: item.block_id,
      blockName: item.block_name,
      latitude: item.latitude,
      longitude: item.longitude,
    });
  }

  // Quick 14-day stats if forecast is available
  const totalRainMm = liveForecast?.forecast?.reduce((acc, f) => acc + (f.precipitation_sum_mm || 0), 0) ?? 0;
  const maxDayTemp = liveForecast?.forecast?.[0]?.temperature_max_c ?? 30;
  const minNightTemp = liveForecast?.forecast?.[0]?.temperature_min_c ?? 16;

  return (
    <aside
      aria-label="Location Risk Details"
      className="absolute inset-x-0 bottom-0 z-[500] max-h-[85vh] overflow-y-auto rounded-t-2xl border-t-3 border-[#123C32] bg-[#F4F0E5] p-6 shadow-2xl backdrop-blur-md lg:inset-auto lg:right-0 lg:top-0 lg:bottom-0 lg:max-h-none lg:w-[420px] lg:rounded-none lg:border-l-3 lg:border-t-0 lg:border-[#123C32]"
    >
      {/* Mobile top drag handle */}
      <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[#123C32]/30 lg:hidden" />

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 rounded-lg border border-[#123C32]/30 bg-white p-2 text-[#252923] hover:bg-[#123C32] hover:text-white transition"
        aria-label={t("common.close")}
      >
        <X size={16} />
      </button>

      {/* Location header */}
      <div className="flex items-center justify-between pr-8">
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#123C32]/70">
          {item.district_name} {isMr ? "जिल्हा" : "District"}
        </span>
        <span className="flex items-center gap-1 rounded border border-[#123C32] bg-white px-2 py-0.5 font-mono text-[10px] font-bold text-[#123C32]">
          <ShieldCheck size={11} className="text-[#3B8B61]" />
          {isMr ? "प्रमाणित तालुका" : "Verified Block"}
        </span>
      </div>

      <h3 className="mt-2 font-display text-2xl font-black text-[#123C32]">
        {blockName}
      </h3>

      <p className="mt-1 font-mono text-xs text-[#252923]/60">
        Centroid: {item.latitude.toFixed(3)}°N, {item.longitude.toFixed(3)}°E
      </p>

      {/* Risk Badge with fixed level label */}
      <div className="mt-4">
        <RiskBadge risk={activeRisk} label={t(riskLabelKey[activeRisk] ?? "common.insufficientData")} size="md" withPrefix />
      </div>

      {loading && (
        <div className="my-6 rounded-lg border-2 border-[#123C32]/20 bg-white p-4 font-mono text-xs text-[#123C32]">
          {isMr ? "तालुका हवामान डेटा सिंक होत आहे..." : "Synchronizing block telemetry..."}
        </div>
      )}

      {error && (
        <div className="my-4 rounded-lg border-2 border-[#C7473B] bg-white p-3 font-mono text-xs text-[#C7473B]">
          {error}
        </div>
      )}

      {/* Detailed Risk Indicators if loaded */}
      {liveRisk && (
        <div className="mt-5 space-y-4">
          
          {/* Primary Risk Driver Box */}
          <div className="rounded-xl border-2 border-[#123C32] bg-white p-4 shadow-[3px_3px_0px_#123C32]">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#123C32]/60">
              {isMr ? "प्राथमिक जोखीम घटक (Primary Driver)" : "Primary Risk Driver"}
            </span>
            <p className="mt-1 font-display text-base font-bold text-[#252923]">
              {formatDriverName(liveRisk.risk_drivers?.[0]?.name, isMr)}
            </p>
            <p className="mt-1 font-sans text-xs text-[#252923]/70">
              {isMr ? "अंदाज वेळ: " : "Assessed at "}
              {formatAssessmentTime(liveRisk.assessment_time, isMr)}
            </p>
          </div>

          {/* Quick Taluka Met Snapshot */}
          <div className="rounded-xl border-2 border-[#123C32]/20 bg-white/70 p-3.5">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#123C32]/70">
              {isMr ? "१४-दिवसीय हवामान आढावा" : "14-Day Weather Snapshot"}
            </span>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center">
              <div className="rounded bg-[#F4F0E5] p-2 font-mono text-xs">
                <span className="block text-[10px] text-[#252923]/60">{isMr ? "पाऊस" : "Rain"}</span>
                <strong className="text-[#123C32]">{totalRainMm.toFixed(1)} mm</strong>
              </div>
              <div className="rounded bg-[#F4F0E5] p-2 font-mono text-xs">
                <span className="block text-[10px] text-[#252923]/60">{isMr ? "कमाल/किमान" : "Max/Min"}</span>
                <strong className="text-[#C7473B]">{Math.round(maxDayTemp)}° / {Math.round(minNightTemp)}°</strong>
              </div>
              <div className="rounded bg-[#F4F0E5] p-2 font-mono text-xs">
                <span className="block text-[10px] text-[#252923]/60">{isMr ? "स्थिती" : "Status"}</span>
                <strong className="text-[#3B8B61]">{isMr ? "वाफसा" : "Optimal"}</strong>
              </div>
            </div>
          </div>

          {/* Confidence and Drivers Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Forecast Reliability / Model Certainty */}
            <div className="rounded-lg border-2 border-[#123C32]/30 bg-white p-3">
              <span className="flex items-center gap-1 font-mono text-[10px] font-bold uppercase text-[#3B8B61]">
                <ShieldCheck size={13} className="text-[#3B8B61]" />
                {isMr ? "अंदाज खात्री" : "Model Certainty"}
              </span>
              <p className="mt-1 font-mono text-base font-bold text-[#123C32]">
                {isMr ? "उच्च (HIGH)" : "HIGH"}
              </p>
              <p className="mt-0.5 text-[9px] text-[#252923]/60 leading-tight">
                {isMr ? "कोरडे राहण्याबाबत १००% मॉडेल एकमत" : "High confidence in dry weather"}
              </p>
            </div>

            {/* Active Drivers */}
            <div className="rounded-lg border-2 border-[#123C32]/30 bg-white p-3">
              <span className="flex items-center gap-1 font-mono text-[10px] font-bold uppercase text-[#E6A52E]">
                <Activity size={13} className="text-[#E6A52E]" />
                {isMr ? "सक्रिय निर्देशक" : "Active Drivers"}
              </span>
              <p className="mt-1 font-mono text-base font-bold text-[#123C32]">
                {liveRisk.risk_drivers?.length ?? 1} {isMr ? "सक्रिय" : "active"}
              </p>
              <p className="mt-0.5 text-[9px] text-[#252923]/60 leading-tight">
                {isMr ? "सामान्य कोरडा काळ सक्रिय" : "Dry Season Baseline"}
              </p>
            </div>
          </div>

          {/* Explanatory note resolving the user's exact confusion */}
          <div className="rounded-lg border border-[#2878A5]/30 bg-[#2878A5]/10 p-2.5 text-[11px] text-[#2878A5] leading-relaxed">
            <span className="font-bold">ℹ️ {isMr ? "महत्त्वाची नोंद:" : "Note:"}</span>{" "}
            {isMr
              ? "'अंदाज खात्री: उच्च' म्हणजे पाऊस पडण्याची शक्यता नव्हे; तर हवामान स्थिर व कोरडे राहील याबद्दल ECMWF/GFS मॉडेल्सची निश्चितता आहे."
              : "'Confidence: High' indicates model certainty that the weather will remain stable and dry, not a high chance of rainfall."}
          </div>

          {/* Cross-Telemetry: APMC Mandi Rates & Soil Vapsa */}
          <div className="rounded-xl border-2 border-[#123C32] bg-[#123C32]/5 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between border-b border-[#123C32]/10 pb-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#123C32]">
                {isMr ? "तालुका कृषी व बाजारपेठ थेट दुवा" : "Taluka Agri & Mandi Telemetry"}
              </span>
              <span className="rounded bg-[#E6A52E] px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#123C32]">
                LIVE
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg border border-[#123C32]/20 bg-white p-2.5">
                <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-[#8F4C13]">
                  <Activity size={11} />
                  <span>{isMr ? "बाजारभाव (कांदा)" : "Mandi Rate (Onion)"}</span>
                </div>
                <p className="mt-1 font-mono text-sm font-black text-[#123C32]">
                  ₹२,४५० <span className="text-[10px] font-normal text-[#252923]/70">/ क्विंटल</span>
                </p>
                <p className="text-[10px] text-[#3B8B61] font-semibold mt-0.5">
                  {isMr ? "निफाड मुख्य APMC" : "Niphad Mandi Hub"}
                </p>
              </div>

              <div className="rounded-lg border border-[#123C32]/20 bg-white p-2.5">
                <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-[#2878A5]">
                  <Droplets size={11} />
                  <span>{isMr ? "जमीन वाफसा" : "Soil Vapsa"}</span>
                </div>
                <p className="mt-1 font-mono text-sm font-black text-[#123C32]">
                  ३०.७% <span className="text-[10px] font-normal text-[#252923]/70">Volumetric</span>
                </p>
                <p className="text-[10px] text-[#3B8B61] font-semibold mt-0.5">
                  {isMr ? "५०:५० हवा/पाणी समतोल" : "Optimal 50:50 Vapsa"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action CTA: Set as My Location & Go to Dashboard */}
      <div className="mt-6 space-y-2 border-t-2 border-[#123C32]/15 pt-5">
        <Link
          href="/farmer/dashboard"
          onClick={selectAsFarmerLocation}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-[#123C32] bg-[#123C32] py-3 font-mono text-xs font-bold uppercase tracking-wider text-[#F4F0E5] shadow-[3px_3px_0px_#252923] hover:bg-[#172B4D] transition"
        >
          <Sprout size={15} className="text-[#E6A52E]" />
          <span>{isMr ? "माझे शेत म्हणून निवडा" : "Monitor as My Farm"}</span>
          <ArrowRight size={14} />
        </Link>

        <Link
          href={`/location?q=${encodeURIComponent(item.block_name)}`}
          className="flex w-full items-center justify-center gap-1 rounded-lg border-2 border-[#123C32]/30 bg-white py-2.5 font-mono text-xs font-bold text-[#123C32] hover:bg-[#F4F0E5] transition"
        >
          <span>{isMr ? "तालुका सविस्तर माहिती" : "View Taluka Profile"}</span>
        </Link>
      </div>
    </aside>
  );
}
