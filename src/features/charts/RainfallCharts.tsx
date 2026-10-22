"use client";

import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { RainfallPoint } from "@/types";
import { useTranslation } from "@/i18n/LanguageContext";
import { DRY_DAY_MM, HEAVY_DAY_MM, classifyRainDay } from "@/lib/rainfall";

const classFill = {
  dry: "var(--color-rain-dry)",
  normal: "var(--color-rain-normal)",
  heavy: "var(--color-rain-heavy)",
} as const;

const axisTick = { fontSize: 12, fill: "var(--color-ink-muted)" };

interface TipProps {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: Record<string, number> }>;
  label?: string | number;
}

export function ChartLegend({ items }: { items: { label: string; swatch: React.ReactNode }[] }) {
  return (
    <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-ink-muted">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-2">
          {i.swatch}
          {i.label}
        </li>
      ))}
    </ul>
  );
}

export const Swatch = ({ color, shape = "square" }: { color: string; shape?: "square" | "line" | "band" }) =>
  shape === "line" ? (
    <span className="inline-block h-0.5 w-5 rounded" style={{ background: color }} aria-hidden />
  ) : (
    <span
      className="inline-block h-3 w-3 rounded-sm"
      style={{ background: color, opacity: shape === "band" ? 0.35 : 1 }}
      aria-hidden
    />
  );

function RainTooltip({ active, payload, label }: TipProps) {
  const { t, fmtNumber } = useTranslation();
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  if (!row) return null;
  return (
    <div className="rounded-md border border-line-strong bg-surface-raised px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-ink">{t("common.dayN", { n: fmtNumber(Number(label)) })}</p>
      <p className="mt-1 text-ink-muted">
        {t("charts.expected")}: <span className="font-semibold text-ink">{fmtNumber(row.expected ?? 0, { maximumFractionDigits: 1 })} {t("climatePage.mm")}</span>
      </p>
      {row.upper !== undefined && row.lower !== undefined && (
        <p className="text-ink-muted">
          {t("charts.range")}: {fmtNumber(row.lower, { maximumFractionDigits: 1 })}–{fmtNumber(row.upper, { maximumFractionDigits: 1 })} {t("climatePage.mm")}
        </p>
      )}
    </div>
  );
}

/** Compact daily-rainfall bars for the farmer dashboard, coloured by dry / normal / heavy class. */
export function RainfallBars({ points, height = 200 }: { points: RainfallPoint[]; height?: number }) {
  const { t, fmtNumber } = useTranslation();
  const rows = points.map((p) => ({ day: p.day, expected: p.expectedMm, cls: classifyRainDay(p.expectedMm) }));
  const dry = rows.filter((r) => r.cls === "dry").length;
  const heavy = rows.filter((r) => r.cls === "heavy").length;
  const summary = t("charts.barsSummary", { days: fmtNumber(rows.length), dry: fmtNumber(dry), heavy: fmtNumber(heavy) });

  return (
    <div>
      <div role="img" aria-label={summary} style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="var(--color-line)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="day" tick={axisTick} tickLine={false} axisLine={{ stroke: "var(--color-line-strong)" }} tickFormatter={(v) => fmtNumber(Number(v))} />
            <YAxis tick={axisTick} tickLine={false} axisLine={false} width={44} unit={` ${t("climatePage.mm")}`} tickFormatter={(v) => fmtNumber(Number(v))} />
            <Tooltip content={<RainTooltip />} cursor={{ fill: "var(--color-paper-deep)", opacity: 0.6 }} />
            <Bar dataKey="expected" radius={[3, 3, 0, 0]}>
              {rows.map((r) => (
                <Cell key={r.day} fill={classFill[r.cls]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ChartLegend
        items={[
          { label: t("charts.normalDay"), swatch: <Swatch color={classFill.normal} /> },
          { label: t("charts.dryDay", { mm: fmtNumber(DRY_DAY_MM) }), swatch: <Swatch color={classFill.dry} /> },
          { label: t("charts.heavyDay", { mm: fmtNumber(HEAVY_DAY_MM) }), swatch: <Swatch color={classFill.heavy} /> },
        ]}
      />
    </div>
  );
}

/** Forecast line with a lower–upper uncertainty band and prototype dry/heavy thresholds. */
export function RainfallForecastChart({ points, height = 320 }: { points: RainfallPoint[]; height?: number }) {
  const { t, fmtNumber } = useTranslation();
  const rows = points.map((p) => ({
    day: p.day,
    expected: p.expectedMm,
    lower: p.lowerMm,
    upper: p.upperMm,
    band: Math.max(0, p.upperMm - p.lowerMm),
  }));
  const peak = Math.max(...rows.map((r) => r.upper), HEAVY_DAY_MM + 5);
  const maxExpected = Math.max(...rows.map((r) => r.expected));
  const summary = t("charts.forecastSummary", {
    days: fmtNumber(rows.length),
    max: fmtNumber(maxExpected, { maximumFractionDigits: 1 }),
  });

  return (
    <div>
      <div role="img" aria-label={summary} style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 12, right: 12, bottom: 18, left: 0 }}>
            <CartesianGrid stroke="var(--color-line)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="day"
              tick={axisTick}
              tickLine={false}
              axisLine={{ stroke: "var(--color-line-strong)" }}
              tickFormatter={(v) => fmtNumber(Number(v))}
              label={{ value: t("charts.daysFromToday"), position: "insideBottom", offset: -12, fill: "var(--color-ink-muted)", fontSize: 12 }}
            />
            <YAxis
              domain={[0, Math.ceil(peak / 5) * 5]}
              tick={axisTick}
              tickLine={false}
              axisLine={false}
              width={52}
              unit={` ${t("climatePage.mm")}`}
              tickFormatter={(v) => fmtNumber(Number(v))}
            />
            <Tooltip content={<RainTooltip />} />
            <Area type="monotone" dataKey="lower" stackId="band" stroke="none" fill="none" isAnimationActive={false} />
            <Area type="monotone" dataKey="band" stackId="band" stroke="none" fill="var(--color-monsoon)" fillOpacity={0.16} isAnimationActive={false} />
            <ReferenceLine y={HEAVY_DAY_MM} stroke="var(--color-rain-heavy)" strokeDasharray="5 4" strokeOpacity={0.7} />
            <ReferenceLine y={DRY_DAY_MM} stroke="var(--color-earth)" strokeDasharray="5 4" strokeOpacity={0.8} />
            <Line type="monotone" dataKey="expected" stroke="var(--color-monsoon)" strokeWidth={2.5} dot={{ r: 2.5, fill: "var(--color-monsoon)" }} activeDot={{ r: 5 }} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <ChartLegend
        items={[
          { label: t("charts.expectedRain"), swatch: <Swatch color="var(--color-monsoon)" shape="line" /> },
          { label: t("charts.uncertaintyBand"), swatch: <Swatch color="var(--color-monsoon)" shape="band" /> },
          { label: t("charts.heavyThreshold", { mm: fmtNumber(HEAVY_DAY_MM) }), swatch: <Swatch color="var(--color-rain-heavy)" shape="line" /> },
          { label: t("charts.dryThreshold", { mm: fmtNumber(DRY_DAY_MM) }), swatch: <Swatch color="var(--color-earth)" shape="line" /> },
        ]}
      />
    </div>
  );
}

/** Simple temperature trend line. */
export function TemperatureChart({ values, height = 200 }: { values: number[]; height?: number }) {
  const { t, fmtNumber } = useTranslation();
  const rows = values.map((v, i) => ({ day: i + 1, temp: v }));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const summary = t("charts.tempSummary", {
    min: fmtNumber(min, { maximumFractionDigits: 1 }),
    max: fmtNumber(max, { maximumFractionDigits: 1 }),
  });
  return (
    <div role="img" aria-label={summary} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="var(--color-line)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="day" tick={axisTick} tickLine={false} axisLine={{ stroke: "var(--color-line-strong)" }} tickFormatter={(v) => fmtNumber(Number(v))} />
          <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={axisTick} tickLine={false} axisLine={false} width={48} unit="°C" tickFormatter={(v) => fmtNumber(Math.round(Number(v)))} />
          <Tooltip
            formatter={(v) => [`${fmtNumber(Number(v), { maximumFractionDigits: 1 })} °C`, t("charts.temperature")]}
            labelFormatter={(l) => t("common.dayN", { n: fmtNumber(Number(l)) })}
            contentStyle={{ borderRadius: 8, border: "1px solid var(--color-line-strong)", fontSize: 12 }}
          />
          <Line type="monotone" dataKey="temp" stroke="var(--color-earth)" strokeWidth={2.5} dot={{ r: 2.5, fill: "var(--color-earth)" }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
