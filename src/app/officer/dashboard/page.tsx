"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  BarChart3,
  ArrowRight,
  TrendingUp,
  Layers,
  MapPin,
  RefreshCw,
  Clock,
  Sparkles,
  ExternalLink,
  Info,
} from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { riskColor, riskLabelKey } from "@/lib/utils";
import RiskBadge from "@/components/RiskBadge";
import type { RiskLevel } from "@/types";
import {
  api,
  type RiskSummaryResponse,
  type RiskAssessmentResponse,
  type ForecastSeries,
} from "@/lib/api";
import { ApiUnavailableState, LoadingBlock } from "@/components/ui/States";
import RuralSmsSimulator from "@/components/officer/RuralSmsSimulator";

export default function OfficerDashboard() {
  const { t, language } = useTranslation();

  const [summary, setSummary] = useState<RiskSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inspectId, setInspectId] = useState<string | null>(null);

  // Inspector detailed data
  const [inspectRisk, setInspectRisk] = useState<RiskAssessmentResponse | null>(null);
  const [inspectForecast, setInspectForecast] = useState<ForecastSeries | null>(null);
  const [inspectLoading, setInspectLoading] = useState(false);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getRiskSummary(14);
      setSummary(data);
      if (data.items.length > 0 && !inspectId) {
        const priorityBlock = data.items.find(
          (b) => b.overall_risk === "critical" || b.overall_risk === "high"
        ) ?? data.items[0];
        setInspectId(priorityBlock.block_id);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load officer risk summary";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [inspectId]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await api.getRiskSummary(14);
        if (cancelled) return;
        setSummary(data);
        if (data.items.length > 0) {
          const priorityBlock = data.items.find(
            (b) => b.overall_risk === "critical" || b.overall_risk === "high"
          ) ?? data.items[0];
          setInspectId(priorityBlock.block_id);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Failed to load officer risk summary";
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!inspectId) return;
    let cancelled = false;

    Promise.resolve().then(() => {
      if (!cancelled) setInspectLoading(true);
    });

    Promise.allSettled([
      api.getClimateRisk(inspectId),
      api.getForecast(inspectId, 14),
    ]).then(([riskRes, fcRes]) => {
      if (cancelled) return;
      if (riskRes.status === "fulfilled") setInspectRisk(riskRes.value);
      if (fcRes.status === "fulfilled") setInspectForecast(fcRes.value);
      setInspectLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [inspectId]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#F4F0E5]">
        <LoadingBlock label="Aggregating Maharashtra block risk overview..." />
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="py-12 max-w-xl mx-auto bg-[#F4F0E5]">
        <ApiUnavailableState
          serviceName="Officer Decision Engine"
          error={error ?? undefined}
          onRetry={fetchSummary}
        />
      </div>
    );
  }

  const items = summary.items;
  const counts: Record<RiskLevel, number> = {
    critical: items.filter((i) => i.overall_risk === "critical").length,
    high: items.filter((i) => i.overall_risk === "high").length,
    moderate: items.filter((i) => i.overall_risk === "moderate").length,
    low: items.filter((i) => i.overall_risk === "low").length,
    insufficient_data: items.filter((i) => i.status === "unavailable" || i.overall_risk === "insufficient_data").length,
  };

  const total = items.length || 1;
  const inspectedItem = items.find((b) => b.block_id === inspectId) ?? items[0];

  const sortedItems = [...items].sort((a, b) => {
    const order: Record<string, number> = {
      critical: 0,
      high: 1,
      moderate: 2,
      low: 3,
      insufficient_data: 4,
    };
    const rA = a.overall_risk ?? "insufficient_data";
    const rB = b.overall_risk ?? "insufficient_data";
    return (order[rA] ?? 5) - (order[rB] ?? 5);
  });

  return (
    <div className="space-y-8 bg-[#F4F0E5] text-[#252923]">
      
      {/* ── Page Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-[#123C32]/20 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded border border-[#172B4D] bg-[#172B4D] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#F4F0E5]">
              Administrative Cockpit
            </span>
            <span className="font-mono text-xs font-semibold text-[#172B4D]">
              Maharashtra State Agriculture Department
            </span>
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-[#172B4D] sm:text-3xl">
            {t("officer.dashboardTitle")}
          </h1>
          <p className="mt-1 font-sans text-xs text-[#252923]/70 sm:text-sm">
            {t("officerDashboard.subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/officer/risk-map"
            className="flex items-center gap-1.5 rounded-lg border-2 border-[#172B4D] bg-[#172B4D] px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-[#F4F0E5] shadow-[2px_2px_0px_#252923] hover:bg-[#123C32] transition"
          >
            <Layers size={14} className="text-[#E6A52E]" />
            <span>Statewide GIS Map</span>
          </Link>
          <Link
            href="/officer/insights"
            className="flex items-center gap-1.5 rounded-lg border-2 border-[#172B4D] bg-white px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-[#172B4D] shadow-[2px_2px_0px_#172B4D] hover:bg-[#F4F0E5] transition"
          >
            <TrendingUp size={14} />
            <span>{t("nav.insights")}</span>
          </Link>
        </div>
      </div>

      {/* ── Key Metrics Summary Strip ── */}
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border-2 border-[#123C32] bg-white p-4 shadow-[3px_3px_0px_#123C32]">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#123C32]">Monitored Talukas</span>
          <p className="mt-1 font-mono text-2xl font-black text-[#123C32]">{total}</p>
          <p className="font-mono text-xs font-medium text-[#252923]/80">Across 36 Districts</p>
        </div>

        <div className="rounded-xl border-2 border-[#C7473B] bg-white p-4 shadow-[3px_3px_0px_#C7473B]">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#C7473B]">Critical Alert Blocks</span>
          <p className="mt-1 font-mono text-2xl font-black text-[#C7473B]">{counts.critical}</p>
          <p className="font-mono text-xs font-medium text-[#252923]/80">{Math.round((counts.critical / total) * 100)}% of state blocks</p>
        </div>

        <div className="rounded-xl border-2 border-[#E58A38] bg-white p-4 shadow-[3px_3px_0px_#E58A38]">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#E58A38]">High Risk Blocks</span>
          <p className="mt-1 font-mono text-2xl font-black text-[#E58A38]">{counts.high}</p>
          <p className="font-mono text-xs font-medium text-[#252923]/80">{Math.round((counts.high / total) * 100)}% of state blocks</p>
        </div>

        <div className="rounded-xl border-2 border-[#3B8B61] bg-white p-4 shadow-[3px_3px_0px_#3B8B61]">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#3B8B61]">Favorable / Low Risk</span>
          <p className="mt-1 font-mono text-2xl font-black text-[#3B8B61]">{counts.low}</p>
          <p className="font-mono text-xs font-medium text-[#252923]/80">{Math.round((counts.low / total) * 100)}% of state blocks</p>
        </div>
      </div>

      {/* ── Statewide Proportional Risk Distribution ── */}
      <div className="rounded-xl border-2 border-[#123C32] bg-white p-6 shadow-[4px_4px_0px_#123C32]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#123C32]/15 pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-[#123C32]" />
            <h2 className="font-display text-base font-bold text-[#123C32]">
              {t("officer.riskDistribution")}
            </h2>
          </div>
          <span className="font-mono text-xs font-medium text-[#252923]">
            {t("officerDashboard.totalCoverage", { count: total })} (14-day evaluation cycle)
          </span>
        </div>

        {/* Proportional distribution bar */}
        <div className="mt-4 flex h-7 overflow-hidden rounded-md border-2 border-[#123C32]">
          {[
            { level: "critical" as RiskLevel, count: counts.critical, bg: "bg-[#C7473B]" },
            { level: "high" as RiskLevel, count: counts.high, bg: "bg-[#E58A38]" },
            { level: "moderate" as RiskLevel, count: counts.moderate, bg: "bg-[#E6B83F]" },
            { level: "low" as RiskLevel, count: counts.low, bg: "bg-[#3B8B61]" },
            { level: "insufficient_data" as RiskLevel, count: counts.insufficient_data, bg: "bg-[#252923]" },
          ].map((seg) => {
            const pct = (seg.count / total) * 100;
            if (pct === 0) return null;
            return (
              <div
                key={seg.level}
                className={`${seg.bg} flex items-center justify-center font-mono text-[10px] font-bold text-white transition-all`}
                style={{ width: `${pct}%` }}
                title={`${seg.level}: ${seg.count}`}
              >
                {pct > 8 && `${seg.count}`}
              </div>
            );
          })}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5 font-mono text-xs">
          <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#C7473B]" /><span>Critical: {counts.critical}</span></div>
          <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#E58A38]" /><span>High: {counts.high}</span></div>
          <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#E6B83F]" /><span>Moderate: {counts.moderate}</span></div>
          <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#3B8B61]" /><span>Low: {counts.low}</span></div>
          <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#252923]" /><span>Other: {counts.insufficient_data}</span></div>
        </div>
      </div>

      {/* ── 2-Column Split: Taluka Table (Left 7 cols) & Live Inspector (Right 5 cols) ── */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        
        {/* Taluka Table */}
        <div className="lg:col-span-7 rounded-xl border-2 border-[#123C32] bg-white shadow-[4px_4px_0px_#123C32] overflow-hidden">
          <div className="flex items-center justify-between border-b-2 border-[#123C32]/15 bg-[#F4F0E5] px-4 py-3">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#123C32]">
              Talukas Requiring Intervention
            </span>
            <span className="font-mono text-xs text-[#252923]/60">Click row to inspect</span>
          </div>

          <div className="max-h-[500px] overflow-y-auto">
            <table className="w-full border-collapse text-left font-sans text-xs">
              <thead>
                <tr className="border-b-2 border-[#123C32]/15 bg-white font-mono text-[10px] font-bold uppercase tracking-wider text-[#123C32]/70">
                  <th className="p-3">Block / Taluka</th>
                  <th className="p-3">District</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#123C32]/10">
                {sortedItems.map((b) => {
                  const isInspected = b.block_id === inspectId;
                  return (
                    <tr
                      key={b.block_id}
                      onClick={() => setInspectId(b.block_id)}
                      className={`cursor-pointer transition ${
                        isInspected
                          ? "bg-[#123C32]/10 font-semibold"
                          : "hover:bg-[#F4F0E5]"
                      }`}
                    >
                      <td className="p-3 font-display font-bold text-[#252923]">
                        {language === "mr" ? b.block_name_mr : b.block_name}
                      </td>
                      <td className="p-3 font-mono text-[#252923]/70">{b.district_name}</td>
                      <td className="p-3">
                        <RiskBadge risk={b.overall_risk ?? "insufficient_data"} size="sm" />
                      </td>
                      <td className="p-3 font-mono text-[11px] text-[#123C32] underline">
                        Inspect
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Inspector Panel */}
        <div className="lg:col-span-5 rounded-xl border-3 border-[#123C32] bg-white p-6 shadow-[6px_6px_0px_#123C32] space-y-4">
          <div className="flex items-center justify-between border-b-2 border-[#123C32]/15 pb-3">
            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#123C32]/60">
                Taluka Inspector
              </span>
              <h3 className="font-display text-xl font-black text-[#123C32]">
                {inspectedItem ? (language === "mr" ? inspectedItem.block_name_mr : inspectedItem.block_name) : "Select a Block"}
              </h3>
              <p className="font-mono text-xs text-[#252923]/60">{inspectedItem?.district_name} District</p>
            </div>
            {inspectLoading && <RefreshCw size={14} className="animate-spin text-[#123C32]" />}
          </div>

          {inspectedItem && (
            <div className="space-y-4">
              <div>
                <span className="font-mono text-[10px] uppercase text-[#252923]/60">Assessed Risk Tier:</span>
                <div className="mt-1">
                  <RiskBadge risk={inspectedItem.overall_risk ?? "insufficient_data"} size="md" withPrefix />
                </div>
              </div>

              {inspectRisk && (
                <div className="rounded-lg border-2 border-[#123C32]/20 bg-[#F4F0E5] p-3.5 space-y-2 font-mono text-xs text-[#252923]">
                  <p>
                    <span className="text-[#252923]/60">Primary Driver:</span>{" "}
                    <strong>{inspectRisk.risk_drivers?.[0]?.name?.toUpperCase() || "MONITORING"}</strong>
                  </p>
                  <p>
                    <span className="text-[#252923]/60">Confidence:</span>{" "}
                    <strong>{inspectRisk.confidence.toUpperCase()}</strong>
                  </p>
                  <p>
                    <span className="text-[#252923]/60">Evaluation Cycle:</span>{" "}
                    <strong>{inspectRisk.assessment_time}</strong>
                  </p>
                </div>
              )}

              <div className="pt-2">
                <Link
                  href={`/farmer/dashboard?block=${inspectedItem.block_id}`}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-[#123C32] bg-[#123C32] py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-[#F4F0E5] shadow-[2px_2px_0px_#252923] hover:bg-[#172B4D] transition"
                >
                  <span>Open Farmer Cockpit</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ── Rural 2G Feature Phone SMS & WhatsApp Broadcast Console ── */}
      {inspectedItem && (
        <RuralSmsSimulator
          blockName={language === "mr" ? inspectedItem.block_name_mr : inspectedItem.block_name}
          districtName={inspectedItem.district_name}
          riskLevel={inspectedItem.overall_risk ?? "moderate"}
          primaryDriver={inspectRisk?.risk_drivers?.[0]?.name}
          forecastRainMm={
            inspectForecast?.forecast?.length
              ? Math.round(
                  inspectForecast.forecast.reduce(
                    (acc, curr) => acc + (curr.precipitation_sum_mm || 0),
                    0
                  ) * 10
                ) / 10
              : 14.5
          }
        />
      )}

    </div>
  );
}