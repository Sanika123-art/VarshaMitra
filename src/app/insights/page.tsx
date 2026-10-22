"use client";

import { useEffect, useState } from "react";
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
import {
  PageHeader,
  Card,
  CardHeader,
  DataStatus,
  MetaChip,
} from "@/components/ui";
import { TrendingUp, Droplets, Sprout, BarChart3, Database, HardDrive, CheckCircle2 } from "lucide-react";
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
    <div className="space-y-6">
      {/* ── Page Header ────────────────────────────────────── */}
      <PageHeader
        eyebrow={t("insights.eyebrow")}
        title={t("insights.title")}
        description={t("insights.subtitle")}
      >
        <MetaChip>1994–2024 Historical Baseline</MetaChip>
        {datasetSummary && (
          <MetaChip>
            <span className="flex items-center gap-1.5 text-forest">
              <span className="h-2 w-2 rounded-full bg-forest" />
              Ingested Records: {datasetSummary.total_records.toLocaleString()} (Valid: {datasetSummary.valid_records.toLocaleString()})
            </span>
          </MetaChip>
        )}
      </PageHeader>

      {/* ── Provenance Banner ───────────────────────────────── */}
      <DataStatus kind="historical" period={historicalPeriod} />

      {/* ── Live Dataset Acquisition Engine Summary ─────────── */}
      {datasetSummary && (
        <Card tone="default" className="border-forest/30 bg-surface">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <Database size={18} className="text-forest" />
              <h2 className="font-serif text-base font-semibold text-ink">
                Verified Meteorological Dataset Engine (Local Storage)
              </h2>
            </div>
            <span className="rounded-full bg-forest-soft px-2.5 py-0.5 text-[11px] font-semibold text-forest">
              SQLite Persistent Store
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-line bg-paper-deep/30 p-3">
              <span className="text-[11px] font-semibold uppercase text-ink-muted">Total Records</span>
              <p className="mt-1 text-lg font-bold text-ink">{datasetSummary.total_records.toLocaleString()}</p>
              <span className="text-[10px] text-ink-subtle">Ingested weather observations</span>
            </div>
            <div className="rounded-lg border border-line bg-paper-deep/30 p-3">
              <span className="text-[11px] font-semibold uppercase text-ink-muted">Valid Observations</span>
              <p className="mt-1 text-lg font-bold text-forest">{datasetSummary.valid_records.toLocaleString()}</p>
              <span className="text-[10px] text-ink-subtle">Missing: {datasetSummary.missing_records}</span>
            </div>
            <div className="rounded-lg border border-line bg-paper-deep/30 p-3">
              <span className="text-[11px] font-semibold uppercase text-ink-muted">Coverage Period</span>
              <p className="mt-1 text-xs font-bold text-ink">
                {datasetSummary.min_date || "1994"} → {datasetSummary.max_date || "2024"}
              </p>
              <span className="text-[10px] text-ink-subtle">Multi-decadal reanalysis</span>
            </div>
            <div className="rounded-lg border border-line bg-paper-deep/30 p-3">
              <span className="text-[11px] font-semibold uppercase text-ink-muted">Accumulated Rainfall</span>
              <p className="mt-1 text-lg font-bold text-ink">
                {datasetSummary.total_precipitation_mm?.toLocaleString() ?? 0} mm
              </p>
              <span className="text-[10px] text-ink-subtle">Storage: {datasetSummary.location_id}</span>
            </div>
          </div>
        </Card>
      )}

      {/* ── Rainfall Anomalies Chart ────────────────────────── */}
      <Card tone="default">
        <CardHeader
          icon={BarChart3}
          title={t("insights.rainfallAnomalies")}
          description={t("insights.rainfallAnomaliesDesc")}
        />
        <div className="mt-5 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={historicalTrend} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="var(--color-line)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 12, fill: "var(--color-ink-muted)" }}
                axisLine={{ stroke: "var(--color-line-strong)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "var(--color-ink-muted)" }}
                axisLine={false}
                tickLine={false}
                width={45}
                unit="%"
              />
              <Tooltip
                formatter={(v) => [`${v}%`, t("insights.anomaly")]}
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid var(--color-line-strong)",
                  fontSize: 12,
                  backgroundColor: "var(--color-surface-raised)",
                }}
              />
              <Bar dataKey="rainfallAnomalyPct" radius={[4, 4, 0, 0]}>
                {historicalTrend.map((d, i) => (
                  <Cell
                    key={i}
                    fill={d.rainfallAnomalyPct >= 0 ? "var(--color-monsoon)" : "var(--color-earth)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* ── Historical Dry Spell Days & District Frequency ──── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Trend line */}
        <Card tone="default">
          <CardHeader
            icon={TrendingUp}
            title={t("insights.historicalTrends")}
            description={t("insights.drySpellDaysTrend")}
          />
          <div className="mt-5 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalTrend} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="var(--color-line)" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 12, fill: "var(--color-ink-muted)" }}
                  axisLine={{ stroke: "var(--color-line-strong)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "var(--color-ink-muted)" }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                  unit={` ${t("common.days")}`}
                />
                <Tooltip
                  formatter={(v) => [`${v} ${t("common.days")}`, t("climatePage.drySpellRisk")]}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid var(--color-line-strong)",
                    fontSize: 12,
                    backgroundColor: "var(--color-surface-raised)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="drySpellDays"
                  stroke="var(--color-earth)"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "var(--color-earth)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* District frequency */}
        <Card tone="default">
          <CardHeader
            icon={Droplets}
            title={t("insights.drySpellFrequency")}
            description={t("insights.drySpellFrequencyDesc")}
          />
          <ul className="mt-5 space-y-3">
            {drySpellFrequencyByDistrict.map((d) => (
              <li key={d.districtId} className="flex items-center gap-3">
                <span className="w-28 shrink-0 text-sm font-semibold text-ink">
                  {d.districtName}
                </span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-paper-deep">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${(d.avgDrySpellDays / 30) * 100}%`,
                      background:
                        d.avgDrySpellDays > 20
                          ? "var(--color-risk-critical)"
                          : d.avgDrySpellDays > 14
                          ? "var(--color-risk-moderate)"
                          : "var(--color-risk-low)",
                    }}
                  />
                </div>
                <span className="w-12 shrink-0 text-right text-xs font-semibold tabular text-ink-muted">
                  {d.avgDrySpellDays} {t("common.days")}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* ── Crop Risk Patterns ──────────────────────────────── */}
      <Card tone="default">
        <CardHeader
          icon={Sprout}
          title={t("insights.cropRiskPatterns")}
          description={t("insights.cropRiskPatternsDesc")}
        />
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {cropRiskPatterns.map((c, i) => {
            const b = getBlock(c.blockId);
            const blockName = b ? pickName(b, language) : c.blockId;
            return (
              <div
                key={i}
                className="rounded-lg border border-line bg-surface-raised p-4 transition-shadow hover:shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-forest" />
                  <span className="font-serif text-sm font-semibold text-ink">
                    {blockName}
                  </span>
                  <span className="text-xs text-ink-muted">· {t(c.cropKey)}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  {t(c.patternKey)}
                </p>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
