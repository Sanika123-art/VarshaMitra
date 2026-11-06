"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTranslation } from "@/i18n/LanguageContext";
import {
  historicalTrend,
  historicalPeriod,
  drySpellFrequencyByDistrict,
  cropRiskPatterns,
} from "@/data/insights";
import { getBlock } from "@/data/locations";
import { pickName } from "@/lib/utils";
import { TrendingUp, Droplets, Sprout, BarChart3, Database, ArrowRight } from "lucide-react";
import { api, type DatasetSummaryResponse } from "@/lib/api";

export default function InsightsPage() {
  const { t, language } = useTranslation();
  const [datasetSummary, setDatasetSummary] = useState<DatasetSummaryResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDatasetSummary() {
      try {
        const res = await api.getDatasetSummary();
        if (!cancelled) setDatasetSummary(res);
      } catch {
        // Fallback remains active
      }
    }

    loadDatasetSummary();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-8 bg-[#F4F0E5] text-[#252923]">
      
      {/* ── Page Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-[#123C32]/20 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded border border-[#123C32] bg-[#123C32] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#F4F0E5]">
              Climatology Archive
            </span>
            <span className="font-mono text-xs font-semibold text-[#123C32]">
              30-Year Longitudinal Reanalysis (1994–2024)
            </span>
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-[#123C32] sm:text-3xl">
            {t("insights.title")}
          </h1>
          <p className="mt-1 font-sans text-xs text-[#252923]/70 sm:text-sm">
            {t("insights.subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="rounded-lg border-2 border-[#123C32] bg-white px-3 py-1.5 font-bold text-[#123C32] shadow-[2px_2px_0px_#123C32]">
            IMD & ERA5-Land Verified
          </span>
        </div>
      </div>

      {/* ── Live Dataset Acquisition Engine Summary ── */}
      {datasetSummary && (
        <div className="rounded-xl border-2 border-[#123C32] bg-white p-6 shadow-[4px_4px_0px_#123C32]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#123C32]/15 pb-3">
            <div className="flex items-center gap-2">
              <Database size={18} className="text-[#123C32]" />
              <h2 className="font-display text-base font-bold text-[#123C32]">
                Verified Meteorological Dataset Engine (Local Storage)
              </h2>
            </div>
            <span className="rounded border border-[#123C32] bg-[#F4F0E5] px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase text-[#123C32]">
              SQLite Persistent Store
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <div className="rounded-lg border-2 border-[#123C32]/20 bg-[#F4F0E5]/60 p-3">
              <span className="font-mono text-[10px] font-bold uppercase text-[#123C32]/60">Total Records</span>
              <p className="mt-1 font-mono text-lg font-black text-[#123C32]">{datasetSummary.total_records.toLocaleString()}</p>
              <span className="font-mono text-[10px] text-[#252923]/60">Weather observations</span>
            </div>
            <div className="rounded-lg border-2 border-[#123C32]/20 bg-[#F4F0E5]/60 p-3">
              <span className="font-mono text-[10px] font-bold uppercase text-[#123C32]/60">Valid Observations</span>
              <p className="mt-1 font-mono text-lg font-black text-[#3B8B61]">{datasetSummary.valid_records.toLocaleString()}</p>
              <span className="font-mono text-[10px] text-[#252923]/60">Missing: {datasetSummary.missing_records}</span>
            </div>
            <div className="rounded-lg border-2 border-[#123C32]/20 bg-[#F4F0E5]/60 p-3">
              <span className="font-mono text-[10px] font-bold uppercase text-[#123C32]/60">Coverage Period</span>
              <p className="mt-1 font-mono text-xs font-bold text-[#123C32]">
                {datasetSummary.min_date || "1994"} → {datasetSummary.max_date || "2024"}
              </p>
              <span className="font-mono text-[10px] text-[#252923]/60">Multi-decadal reanalysis</span>
            </div>
            <div className="rounded-lg border-2 border-[#123C32]/20 bg-[#F4F0E5]/60 p-3">
              <span className="font-mono text-[10px] font-bold uppercase text-[#123C32]/60">Accumulated Rain</span>
              <p className="mt-1 font-mono text-lg font-black text-[#123C32]">
                {datasetSummary.total_precipitation_mm?.toLocaleString() ?? 0} mm
              </p>
              <span className="font-mono text-[10px] text-[#252923]/60">Location: {datasetSummary.location_id}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Rainfall Anomalies Chart ── */}
      <div className="rounded-xl border-2 border-[#123C32] bg-white p-6 shadow-[4px_4px_0px_#123C32]">
        <div className="border-b-2 border-[#123C32]/15 pb-4">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-[#123C32]" />
            <h2 className="font-display text-lg font-bold text-[#123C32]">
              {t("insights.rainfallAnomalies")}
            </h2>
          </div>
          <p className="font-sans text-xs text-[#252923]/70 mt-1">
            {t("insights.rainfallAnomaliesDesc")}
          </p>
        </div>

        <div className="mt-6 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={historicalTrend} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="#123C32" strokeOpacity={0.1} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 11, fill: "#252923", fontFamily: "var(--font-ibm-plex-mono)" }}
                axisLine={{ stroke: "#123C32", strokeWidth: 1.5 }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#252923", fontFamily: "var(--font-ibm-plex-mono)" }}
                axisLine={false}
                tickLine={false}
                width={45}
                unit="%"
              />
              <Tooltip
                formatter={(v) => [`${v}%`, t("insights.anomaly")]}
                contentStyle={{
                  borderRadius: 6,
                  border: "2px solid #123C32",
                  fontSize: 12,
                  fontFamily: "var(--font-ibm-plex-mono)",
                  backgroundColor: "#F4F0E5",
                  boxShadow: "3px 3px 0px #123C32",
                }}
              />
              <Bar dataKey="rainfallAnomalyPct" radius={[2, 2, 0, 0]}>
                {historicalTrend.map((d, i) => (
                  <Cell
                    key={i}
                    fill={d.rainfallAnomalyPct >= 0 ? "#2878A5" : "#E58A38"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Historical Dry Spell Days & District Frequency ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Trend line */}
        <div className="rounded-xl border-2 border-[#123C32] bg-white p-6 shadow-[4px_4px_0px_#123C32]">
          <div className="border-b-2 border-[#123C32]/15 pb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-[#123C32]" />
              <h3 className="font-display text-base font-bold text-[#123C32]">
                {t("insights.historicalTrends")}
              </h3>
            </div>
            <p className="font-sans text-xs text-[#252923]/70 mt-1">
              {t("insights.drySpellDaysTrend")}
            </p>
          </div>

          <div className="mt-5 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalTrend} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="#123C32" strokeOpacity={0.1} strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 11, fill: "#252923", fontFamily: "var(--font-ibm-plex-mono)" }}
                  axisLine={{ stroke: "#123C32", strokeWidth: 1.5 }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#252923", fontFamily: "var(--font-ibm-plex-mono)" }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                  unit={` ${t("common.days")}`}
                />
                <Tooltip
                  formatter={(v) => [`${v} ${t("common.days")}`, t("climatePage.drySpellRisk")]}
                  contentStyle={{
                    borderRadius: 6,
                    border: "2px solid #123C32",
                    fontSize: 12,
                    fontFamily: "var(--font-ibm-plex-mono)",
                    backgroundColor: "#F4F0E5",
                    boxShadow: "3px 3px 0px #123C32",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="drySpellDays"
                  stroke="#E6A52E"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#123C32" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* District frequency */}
        <div className="rounded-xl border-2 border-[#123C32] bg-white p-6 shadow-[4px_4px_0px_#123C32]">
          <div className="border-b-2 border-[#123C32]/15 pb-4">
            <div className="flex items-center gap-2">
              <Droplets size={18} className="text-[#2878A5]" />
              <h3 className="font-display text-base font-bold text-[#123C32]">
                {t("insights.drySpellFrequency")}
              </h3>
            </div>
            <p className="font-sans text-xs text-[#252923]/70 mt-1">
              {t("insights.drySpellFrequencyDesc")}
            </p>
          </div>

          <ul className="mt-5 space-y-3 font-mono text-xs">
            {drySpellFrequencyByDistrict.map((d) => (
              <li key={d.districtId} className="flex items-center gap-3">
                <span className="w-28 shrink-0 font-bold text-[#252923]">
                  {d.districtName}
                </span>
                <div className="h-3 flex-1 overflow-hidden rounded-full border border-[#123C32]/20 bg-[#F4F0E5]">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${(d.avgDrySpellDays / 30) * 100}%`,
                      background:
                        d.avgDrySpellDays > 20
                          ? "#C7473B"
                          : d.avgDrySpellDays > 14
                          ? "#E6B83F"
                          : "#3B8B61",
                    }}
                  />
                </div>
                <span className="w-16 shrink-0 text-right font-bold text-[#123C32]">
                  {d.avgDrySpellDays} d
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Crop Risk Patterns ── */}
      <div className="rounded-xl border-2 border-[#123C32] bg-white p-6 shadow-[4px_4px_0px_#123C32]">
        <div className="border-b-2 border-[#123C32]/15 pb-4">
          <div className="flex items-center gap-2">
            <Sprout size={18} className="text-[#123C32]" />
            <h3 className="font-display text-lg font-bold text-[#123C32]">
              {t("insights.cropRiskPatterns")}
            </h3>
          </div>
          <p className="font-sans text-xs text-[#252923]/70 mt-1">
            {t("insights.cropRiskPatternsDesc")}
          </p>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {cropRiskPatterns.map((c, i) => {
            const b = getBlock(c.blockId);
            const bName = b ? pickName(b, language) : c.blockId;
            return (
              <div
                key={i}
                className="rounded-lg border-2 border-[#123C32]/20 bg-[#F4F0E5] p-4 transition hover:border-[#123C32]"
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-sm font-bold text-[#123C32]">{bName}</span>
                  <span className="rounded border border-[#123C32]/30 bg-white px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-[#123C32]">
                    {t(c.cropKey)}
                  </span>
                </div>
                <p className="mt-2 font-sans text-xs leading-relaxed text-[#252923]/80">
                  {t(c.patternKey)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}