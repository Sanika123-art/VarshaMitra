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
  dry: "#E58A38",
  normal: "#3B8B61",
  heavy: "#1D4ED8",
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
  const { t, fmtNumber, language } = useTranslation();
  const isMr = language === "mr";
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  if (!row) return null;

  const expected = row.expected ?? 0;
  const isDry = expected < DRY_DAY_MM;
  const isHeavy = expected >= HEAVY_DAY_MM;

  return (
    <div className="rounded-lg border-2 border-[#123C32] bg-white px-3 py-2 text-xs shadow-md font-mono">
      <p className="font-bold text-[#123C32]">
        {t("common.dayN", { n: fmtNumber(Number(label)) })}
      </p>
      <p className="mt-1 text-[#252923]">
        {t("charts.expected")}:{" "}
        <strong className="text-[#123C32]">
          {fmtNumber(expected, { maximumFractionDigits: 1 })} {t("climatePage.mm")}
        </strong>
      </p>
      <div className="mt-1">
        {isDry ? (
          <span className="inline-block rounded bg-[#E58A38]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#8F4C13]">
            {isMr ? "कोरडा दिवस (<२.५ मिमी)" : "Dry Day (<2.5 mm)"}
          </span>
        ) : isHeavy ? (
          <span className="inline-block rounded bg-[#1D4ED8]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#1D4ED8]">
            {isMr ? "मुसळधार पाऊस (≥६५ मिमी)" : "Heavy Rain (≥65 mm)"}
          </span>
        ) : (
          <span className="inline-block rounded bg-[#3B8B61]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#1F5336]">
            {isMr ? "मध्यम पाऊस" : "Normal Rain"}
          </span>
        )}
      </div>
      {row.upper !== undefined && row.lower !== undefined && (
        <p className="mt-1 text-[#252923]/60 text-[11px]">
          {t("charts.range")}: {fmtNumber(row.lower, { maximumFractionDigits: 1 })}–{fmtNumber(row.upper, { maximumFractionDigits: 1 })} {t("climatePage.mm")}
        </p>
      )}
    </div>
  );
}

/** Compact daily-rainfall bars for the farmer dashboard, coloured by dry / normal / heavy class. */
export function RainfallBars({ points, height = 200 }: { points: RainfallPoint[]; height?: number }) {
  const { t, fmtNumber, language } = useTranslation();
  const isMr = language === "mr";
  const rows = points.map((p) => ({ day: p.day, expected: p.expectedMm, cls: classifyRainDay(p.expectedMm) }));
  const dry = rows.filter((r) => r.cls === "dry").length;
  const heavy = rows.filter((r) => r.cls === "heavy").length;
  const allZero = rows.every((r) => (r.expected ?? 0) === 0);
  const summary = t("charts.barsSummary", { days: fmtNumber(rows.length), dry: fmtNumber(dry), heavy: fmtNumber(heavy) });

  return (
    <div>
      {/* Reassuring Banner when all 14 days are completely rainless */}
      {allZero && (
        <div className="mb-3 flex items-center justify-between rounded-lg border border-[#E58A38]/30 bg-[#E58A38]/10 px-3 py-2 font-mono text-xs text-[#8F4C13]">
          <span className="flex items-center gap-1.5 font-bold">
            <span>☀️</span>
            <span>
              {isMr
                ? "पुढील सर्व १४ दिवस १००% कोरडे (०.० मिमी पाऊस)"
                : "All 14 forecast days are dry (0.0 mm rain)"}
            </span>
          </span>
          <span className="text-[11px] opacity-80">
            {isMr ? "सिंचन व फवारणीसाठी योग्य" : "Favorable for spraying & irrigation"}
          </span>
        </div>
      )}

      <div role="img" aria-label={summary} style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="#123C32" strokeOpacity={0.12} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="day" tick={axisTick} tickLine={false} axisLine={{ stroke: "#123C32", strokeOpacity: 0.3 }} tickFormatter={(v) => fmtNumber(Number(v))} />
            <YAxis tick={axisTick} tickLine={false} axisLine={false} width={44} unit={` ${t("climatePage.mm")}`} tickFormatter={(v) => fmtNumber(Number(v))} />
            <Tooltip content={<RainTooltip />} cursor={{ fill: "#123C32", opacity: 0.06 }} />
            <Bar dataKey="expected" minPointSize={6} radius={[3, 3, 0, 0]}>
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
  const { t, fmtNumber, language } = useTranslation();
  const isMr = language === "mr";
  const rows = points.map((p) => ({
    day: p.day,
    expected: p.expectedMm,
    lower: p.lowerMm,
    upper: p.upperMm,
    band: Math.max(0, p.upperMm - p.lowerMm),
  }));
  const maxUpper = Math.max(0, ...rows.map((r) => r.upper));
  const maxExpected = Math.max(0, ...rows.map((r) => r.expected));
  const allDry = rows.every((r) => r.expected < DRY_DAY_MM);

  // Smart adaptive vertical domain:
  // When dry season or low rain, scale nicely so the 2.5 mm dry threshold and subtle ensemble band are visible.
  const yDomainMax = maxUpper > 20
    ? Math.max(Math.ceil(maxUpper * 1.15), HEAVY_DAY_MM + 5)
    : Math.max(8, Math.ceil((maxUpper + 3) / 2) * 2);

  const summary = t("charts.forecastSummary", {
    days: fmtNumber(rows.length),
    max: fmtNumber(maxExpected, { maximumFractionDigits: 1 }),
  });

  return (
    <div>
      {/* Reassuring Dry Spell / Clean Weather Banner */}
      {allDry && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#E58A38]/30 bg-[#E58A38]/10 px-3.5 py-2 font-mono text-xs text-[#8F4C13]">
          <div className="flex items-center gap-2">
            <span className="text-base">☀️</span>
            <span>
              {isMr
                ? "कोरडा काळ सक्रिय — पुढील सर्व दिवसांत पाऊस नगण्य (< २.५ मिमी). फवारणी, सिंचन व शेतीकामांसाठी उत्तम परिस्थिती."
                : "Dry Weather Window Active — zero significant rainfall (< 2.5 mm). Highly favorable for spraying, weeding & irrigation."}
            </span>
          </div>
          <span className="rounded bg-white/80 px-2 py-0.5 font-bold uppercase tracking-wider text-[#8F4C13] shadow-sm">
            {isMr ? "कमाल पाऊस: " + fmtNumber(maxExpected, { maximumFractionDigits: 1 }) + " मिमी" : "Max: " + maxExpected.toFixed(1) + " mm"}
          </span>
        </div>
      )}

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
              domain={[0, yDomainMax]}
              tick={axisTick}
              tickLine={false}
              axisLine={false}
              width={52}
              unit={` ${t("climatePage.mm")}`}
              tickFormatter={(v) => fmtNumber(Number(v))}
            />
            <Tooltip content={<RainTooltip />} />
            <Area type="monotone" dataKey="lower" stackId="band" stroke="none" fill="none" isAnimationActive={false} />
            <Area type="monotone" dataKey="band" stackId="band" stroke="none" fill="var(--color-monsoon)" fillOpacity={0.2} isAnimationActive={false} />
            {yDomainMax >= HEAVY_DAY_MM && (
              <ReferenceLine y={HEAVY_DAY_MM} stroke="var(--color-rain-heavy)" strokeDasharray="5 4" strokeOpacity={0.7} label={{ value: isMr ? "मुसळधार मर्यादा (६४.५ मिमी)" : "Heavy Rain (64.5mm)", fill: "var(--color-rain-heavy)", fontSize: 10, position: "top" }} />
            )}
            <ReferenceLine y={DRY_DAY_MM} stroke="var(--color-earth)" strokeDasharray="5 4" strokeOpacity={0.8} label={{ value: isMr ? "कोरडा दिवस मर्यादा (२.५ मिमी)" : "Dry threshold (2.5mm)", fill: "var(--color-earth)", fontSize: 10, position: "insideTopLeft" }} />
            <Line
              type="monotone"
              dataKey="expected"
              stroke="var(--color-monsoon)"
              strokeWidth={2.5}
              dot={{ r: 3, fill: maxExpected === 0 ? "var(--color-earth)" : "var(--color-monsoon)", stroke: "#fff", strokeWidth: 1.5 }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <ChartLegend
        items={[
          { label: t("charts.expectedRain"), swatch: <Swatch color="var(--color-monsoon)" shape="line" /> },
          { label: t("charts.uncertaintyBand"), swatch: <Swatch color="var(--color-monsoon)" shape="band" /> },
          ...(yDomainMax >= HEAVY_DAY_MM
            ? [{ label: t("charts.heavyThreshold", { mm: fmtNumber(HEAVY_DAY_MM) }), swatch: <Swatch color="var(--color-rain-heavy)" shape="line" /> }]
            : []),
          { label: t("charts.dryThreshold", { mm: fmtNumber(DRY_DAY_MM) }), swatch: <Swatch color="var(--color-earth)" shape="line" /> },
        ]}
      />
    </div>
  );
}

export interface TemperaturePoint {
  day: number;
  max: number;
  min: number;
  date?: string;
}

/** Rich temperature trend chart with diurnal min/max envelope. */
export function TemperatureChart({
  values,
  series,
  height = 220,
}: {
  values?: number[];
  series?: TemperaturePoint[];
  height?: number;
}) {
  const { t, fmtNumber, language } = useTranslation();
  const isMr = language === "mr";

  const rows = series && series.length > 0
    ? series.map((s) => ({
        day: s.day,
        max: s.max,
        min: s.min,
        range: Math.max(0, s.max - s.min),
        date: s.date,
      }))
    : (values ?? [28, 29, 27, 28, 30, 29, 28]).map((v, i) => ({
        day: i + 1,
        max: v,
        min: Math.max(12, Math.round(v - 13)),
        range: 13,
        date: undefined,
      }));

  const allMax = rows.map((r) => r.max);
  const allMin = rows.map((r) => r.min);
  const minVal = Math.floor(Math.min(...allMin) - 2);
  const maxVal = Math.ceil(Math.max(...allMax) + 2);

  const summary = t("charts.tempSummary", {
    min: fmtNumber(Math.min(...allMin), { maximumFractionDigits: 1 }),
    max: fmtNumber(Math.max(...allMax), { maximumFractionDigits: 1 }),
  });

  return (
    <div>
      <div role="img" aria-label={summary} style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 12, right: 12, bottom: 12, left: 0 }}>
            <CartesianGrid stroke="var(--color-line)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="day"
              tick={axisTick}
              tickLine={false}
              axisLine={{ stroke: "var(--color-line-strong)" }}
              tickFormatter={(v) => fmtNumber(Number(v))}
              label={{ value: t("charts.daysFromToday"), position: "insideBottom", offset: -8, fill: "var(--color-ink-muted)", fontSize: 12 }}
            />
            <YAxis
              domain={[minVal, maxVal]}
              tick={axisTick}
              tickLine={false}
              axisLine={false}
              width={48}
              unit="°C"
              tickFormatter={(v) => fmtNumber(Math.round(Number(v)))}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0]?.payload;
                return (
                  <div className="rounded-lg border-2 border-[#123C32] bg-white p-2.5 font-mono text-xs shadow-md">
                    <p className="font-bold text-[#123C32]">
                      {t("common.dayN", { n: fmtNumber(Number(label)) })}
                      {d?.date ? ` · ${d.date}` : ""}
                    </p>
                    <p className="mt-1 text-[#C7473B]">
                      {isMr ? "कमाल तापमान:" : "Max Temp:"}{" "}
                      <strong>{fmtNumber(d.max, { maximumFractionDigits: 1 })} °C</strong>
                    </p>
                    <p className="text-[#2878A5]">
                      {isMr ? "किमान तापमान:" : "Min Temp:"}{" "}
                      <strong>{fmtNumber(d.min, { maximumFractionDigits: 1 })} °C</strong>
                    </p>
                    <p className="mt-1 text-[10px] text-[#252923]/60">
                      {isMr ? "तापमान तफावत: " : "Diurnal Range: "}
                      {fmtNumber(d.max - d.min, { maximumFractionDigits: 1 })} °C
                    </p>
                  </div>
                );
              }}
            />
            <Area type="monotone" dataKey="min" stackId="range" stroke="none" fill="none" isAnimationActive={false} />
            <Area type="monotone" dataKey="range" stackId="range" stroke="none" fill="#2878A5" fillOpacity={0.08} isAnimationActive={false} />
            <Line
              type="monotone"
              dataKey="max"
              stroke="#C7473B"
              strokeWidth={2.5}
              dot={{ r: 2.5, fill: "#C7473B" }}
              name={isMr ? "कमाल तापमान" : "Max Temp"}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="min"
              stroke="#2878A5"
              strokeWidth={2.5}
              dot={{ r: 2.5, fill: "#2878A5" }}
              name={isMr ? "किमान तापमान" : "Min Temp"}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-xs text-[#252923]/80">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#C7473B]" />
          <span>{isMr ? "कमाल तापमान (°C)" : "Max Temp (°C)"}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#2878A5]" />
          <span>{isMr ? "किमान तापमान (°C)" : "Min Temp (°C)"}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-4 rounded bg-[#2878A5]/20 border border-[#2878A5]/40" />
          <span>{isMr ? "दैनिक तापमान तफावत (Diurnal Range)" : "Diurnal Spread"}</span>
        </div>
      </div>
    </div>
  );
}
