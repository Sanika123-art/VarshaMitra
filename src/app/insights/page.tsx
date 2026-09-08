"use client";

import { BarChart, Bar, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useTranslation } from "@/i18n/LanguageContext";
import { historicalTrend, drySpellFrequencyByDistrict, cropRiskPatterns } from "@/data/insights";
import { PrototypeTag } from "@/components/ui";
import { TrendingUp, Droplets, Sprout, BarChart3 } from "lucide-react";

export default function InsightsPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <PrototypeTag />
      <div className="mt-4">
        <p className="text-sm font-semibold uppercase tracking-wider text-[var(--color-forest)]">
          {t("insights.eyebrow")}
        </p>
        <h1 className="mt-2 font-display text-4xl leading-tight text-[var(--color-ink)] sm:text-5xl">
          {t("insights.title")}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--color-ink)]/60">
          {t("insights.subtitle")}
        </p>
      </div>

      {/* Rainfall anomalies — large, prominent */}
      <div className="mt-10 rounded-3xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-6 shadow-[var(--shadow-sm)]">
        <div className="flex items-center gap-2">
          <BarChart3 size={16} className="text-[var(--color-sky)]" />
          <p className="text-sm font-semibold text-[var(--color-ink)]/70">{t("insights.rainfallAnomalies")}</p>
        </div>
        <p className="mt-1 text-xs text-[var(--color-ink)]/40">{t("insights.rainfallAnomaliesDesc")}</p>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={historicalTrend}>
              <CartesianGrid stroke="var(--color-line)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--color-ink)", opacity: 0.5 }} stroke="var(--color-line)" tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--color-ink)", opacity: 0.5 }} stroke="var(--color-line)" width={40} unit="%" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, borderColor: "var(--color-line)", fontSize: 12, boxShadow: "var(--shadow-md)" }} />
              <Bar dataKey="rainfallAnomalyPct" radius={[6, 6, 0, 0]}>
                {historicalTrend.map((d, i) => (
                  <Cell key={i} fill={d.rainfallAnomalyPct >= 0 ? "var(--color-sky)" : "var(--color-clay)"} opacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Historical trends */}
        <div className="rounded-3xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-6 shadow-[var(--shadow-sm)]">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-[var(--color-amber)]" />
            <p className="text-sm font-semibold text-[var(--color-ink)]/70">{t("insights.historicalTrends")}</p>
          </div>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalTrend}>
                <CartesianGrid stroke="var(--color-line)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--color-ink)", opacity: 0.5 }} stroke="var(--color-line)" tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--color-ink)", opacity: 0.5 }} stroke="var(--color-line)" width={40} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, borderColor: "var(--color-line)", fontSize: 12, boxShadow: "var(--shadow-md)" }} />
                <Line type="monotone" dataKey="drySpellDays" stroke="var(--color-amber)" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dry-spell frequency */}
        <div className="rounded-3xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-6 shadow-[var(--shadow-sm)]">
          <div className="flex items-center gap-2">
            <Droplets size={16} className="text-[var(--color-clay)]" />
            <p className="text-sm font-semibold text-[var(--color-ink)]/70">{t("insights.drySpellFrequency")}</p>
          </div>
          <ul className="mt-5 space-y-3.5">
            {drySpellFrequencyByDistrict.map((d) => (
              <li key={d.districtId} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-sm font-medium text-[var(--color-ink)]/70">{d.districtName}</span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-[var(--color-line)]/40">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${(d.avgDrySpellDays / 30) * 100}%`,
                      background: d.avgDrySpellDays > 20 ? "var(--color-clay)" : d.avgDrySpellDays > 14 ? "var(--color-amber)" : "var(--color-moss)",
                    }}
                  />
                </div>
                <span className="tabular w-10 shrink-0 text-right text-xs font-semibold text-[var(--color-ink)]/55">
                  {d.avgDrySpellDays}d
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Crop risk patterns */}
      <div className="mt-6 rounded-3xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-6 shadow-[var(--shadow-sm)]">
        <div className="flex items-center gap-2">
          <Sprout size={16} className="text-[var(--color-forest)]" />
          <p className="text-sm font-semibold text-[var(--color-ink)]/70">{t("insights.cropRiskPatterns")}</p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {cropRiskPatterns.map((c, i) => (
            <div key={i} className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper)] p-4 transition-shadow hover:shadow-[var(--shadow-sm)]">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[var(--color-clay)]" />
                <span className="text-sm font-semibold text-[var(--color-ink)]">
                  {c.blockName}
                </span>
                <span className="text-xs text-[var(--color-ink)]/45">· {t(c.cropKey)}</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink)]/60">{c.pattern}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
