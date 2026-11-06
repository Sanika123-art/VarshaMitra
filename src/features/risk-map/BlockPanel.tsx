"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, ArrowRight, Info, ShieldCheck, Sprout, CloudRain, Sun } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import type { RiskLevel } from "@/types";
import RiskBadge from "@/components/RiskBadge";
import { riskLabelKey } from "@/lib/utils";
import { api, type RiskAssessmentResponse, type ForecastSeries, type RiskSummaryItem } from "@/lib/api";
import { useAppState } from "@/hooks/useAppState";

export default function BlockPanel({ item, onClose }: { item: RiskSummaryItem; onClose: () => void }) {
  const { t, language } = useTranslation();
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
          setError("Detailed climate risk could not be retrieved from the backend.");
        }
        if (fRes.status === "fulfilled") {
          setLiveForecast(fRes.value);
        }
      } catch {
        if (!cancelled) setError("Network error loading block details.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadLiveData();
    return () => {
      cancelled = true;
    };
  }, [item.block_id]);

  const activeRisk: RiskLevel = liveRisk?.overall_risk || item.overall_risk || "insufficient_data";
  const blockName = language === "mr" ? item.block_name_mr : item.block_name;

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

  return (
    <aside
      aria-label="Location Risk Details"
      className="absolute inset-x-0 bottom-0 z-[500] max-h-[80vh] overflow-y-auto rounded-t-2xl border-t-3 border-[#123C32] bg-[#F4F0E5] p-6 shadow-2xl backdrop-blur-md lg:inset-auto lg:right-0 lg:top-0 lg:bottom-0 lg:max-h-none lg:w-[400px] lg:rounded-none lg:border-l-3 lg:border-t-0 lg:border-[#123C32]"
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
          {item.district_name} District
        </span>
        <span className="flex items-center gap-1 rounded border border-[#123C32] bg-white px-2 py-0.5 font-mono text-[10px] font-bold text-[#123C32]">
          <ShieldCheck size={11} className="text-[#3B8B61]" />
          Verified Block
        </span>
      </div>

      <h3 className="mt-2 font-display text-2xl font-black text-[#123C32]">
        {blockName}
      </h3>

      <p className="mt-1 font-mono text-xs text-[#252923]/60">
        Centroid: {item.latitude.toFixed(3)}°N, {item.longitude.toFixed(3)}°E
      </p>

      {/* Risk Badge */}
      <div className="mt-4">
        <RiskBadge risk={activeRisk} label={t(riskLabelKey[activeRisk] ?? "common.insufficientData")} size="md" withPrefix />
      </div>

      {loading && (
        <div className="my-6 rounded-lg border-2 border-[#123C32]/20 bg-white p-4 font-mono text-xs text-[#123C32]">
          Synchronizing block telemetry...
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
          <div className="rounded-xl border-2 border-[#123C32] bg-white p-4 shadow-[3px_3px_0px_#123C32]">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#123C32]/60">
              Primary Risk Driver
            </span>
            <p className="mt-1 font-display text-base font-bold text-[#252923]">
              {liveRisk.risk_drivers?.[0]?.name?.toUpperCase() || "MONITORING"}
            </p>
            <p className="mt-1 font-sans text-xs text-[#252923]/70">
              Assessed at {liveRisk.assessment_time || "Recent Cycle"}.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border-2 border-[#123C32]/30 bg-white p-3">
              <span className="flex items-center gap-1 font-mono text-[10px] font-bold uppercase text-[#2878A5]">
                <CloudRain size={12} />
                Confidence
              </span>
              <p className="mt-1 font-mono text-base font-bold text-[#123C32]">
                {liveRisk.confidence.toUpperCase()}
              </p>
            </div>

            <div className="rounded-lg border-2 border-[#123C32]/30 bg-white p-3">
              <span className="flex items-center gap-1 font-mono text-[10px] font-bold uppercase text-[#E6A52E]">
                <Sun size={12} />
                Drivers
              </span>
              <p className="mt-1 font-mono text-base font-bold text-[#123C32]">
                {liveRisk.risk_drivers?.length ?? 0} active
              </p>
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
          <span>Monitor as My Farm</span>
          <ArrowRight size={14} />
        </Link>

        <Link
          href={`/location?q=${encodeURIComponent(item.block_name)}`}
          className="flex w-full items-center justify-center gap-1 rounded-lg border-2 border-[#123C32]/30 bg-white py-2.5 font-mono text-xs font-bold text-[#123C32] hover:bg-[#F4F0E5] transition"
        >
          <span>View Taluka Profile</span>
        </Link>
      </div>
    </aside>
  );
}