"use client";

import { useEffect, useState } from "react";
import {
  ShieldAlert,
  BarChart3,
  Sprout,
  ArrowRight,
  TrendingUp,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import {
  regionRiskCounts,
  highRiskLocations,
  cropExposure,
  alerts,
} from "@/data/officer";
import { getBlock, getDistrict } from "@/data/locations";
import { getForecast } from "@/data/climate";
import { deriveAdvisory } from "@/data/advisories";
import { pickName, riskColor, riskLabelKey } from "@/lib/utils";
import RiskBadge from "@/components/RiskBadge";
import type { RiskLevel } from "@/types";
import { api, type BlockDetail, type RiskAssessmentResponse } from "@/lib/api";
import {
  PageHeader,
  MetaChip,
  Card,
  CardHeader,
  DataStatus,
  AlertListItem,
  ButtonLink,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui";

export default function OfficerDashboard() {
  const { t, language } = useTranslation();
  const fallbackCounts = regionRiskCounts();
  const fallbackLocations = highRiskLocations();

  const [liveBlocks, setLiveBlocks] = useState<BlockDetail[]>([]);
  const [liveRisks, setLiveRisks] = useState<Record<string, RiskAssessmentResponse>>({});
  const [isLive, setIsLive] = useState(false);

  const [inspectId, setInspectId] = useState<string | null>(fallbackLocations[0]?.blockId ?? null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const blocks = await api.getBlocks();
        if (cancelled || !blocks.length) return;
        setLiveBlocks(blocks);

        // Fetch risk assessments in parallel for all blocks
        const riskResults = await Promise.allSettled(
          blocks.map((b) => api.getClimateRisk(b.id))
        );

        if (cancelled) return;
        const riskMap: Record<string, RiskAssessmentResponse> = {};
        riskResults.forEach((r) => {
          if (r.status === "fulfilled") {
            riskMap[r.value.block_id] = r.value;
          }
        });

        if (Object.keys(riskMap).length > 0) {
          setLiveRisks(riskMap);
          setIsLive(true);
        }
      } catch {
        // Fallback remains active
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  // Compute live counts if live data is available
  const counts = isLive
    ? Object.values(liveRisks).reduce(
        (acc, curr) => {
          const r = curr.overall_risk;
          if (r !== "insufficient_data" && r in acc) {
            acc[r as RiskLevel]++;
          }
          return acc;
        },
        { critical: 0, high: 0, moderate: 0, low: 0 } as Record<RiskLevel, number>
      )
    : fallbackCounts;

  const total = counts.critical + counts.high + counts.moderate + counts.low || 1;

  const inspectBlock = inspectId ? getBlock(inspectId) : undefined;
  const inspectDistrict = inspectBlock ? getDistrict(inspectBlock.districtId) : undefined;
  const inspectForecast = inspectBlock ? getForecast(inspectBlock.id, 14) : null;
  const inspectAdvisory = inspectBlock ? deriveAdvisory(inspectBlock.id, "soybean", "sowing") : null;

  return (
    <div className="space-y-6">
      {/* ── Page Header ────────────────────────────────────── */}
      <PageHeader
        eyebrow={t("officerDashboard.eyebrow")}
        title={t("officer.dashboardTitle")}
        description={t("officerDashboard.subtitle")}
        actions={
          <div className="flex gap-2">
            <ButtonLink href="/officer/risk-map" variant="primary" size="sm">
              <Layers size={15} aria-hidden />
              {t("nav.riskMap")}
            </ButtonLink>
            <ButtonLink href="/officer/insights" variant="secondary" size="sm">
              <TrendingUp size={15} aria-hidden />
              {t("nav.insights")}
            </ButtonLink>
          </div>
        }
      >
        <MetaChip>
          <span className="font-semibold text-ink">{total}</span> {t("officerDashboard.monitoredBlocks")}
        </MetaChip>
        <MetaChip>
          <span className="font-semibold text-risk-critical-ink">{counts.critical}</span> {t("common.riskCritical")}
        </MetaChip>
        <MetaChip>
          <span className="font-semibold text-risk-high-ink">{counts.high}</span> {t("common.riskHigh")}
        </MetaChip>
      </PageHeader>

      {/* ── Provenance Banner ───────────────────────────────── */}
      <DataStatus kind="assessment" />

      {/* ── Regional Risk Distribution ──────────────────────── */}
      <Card tone="default">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-forest" aria-hidden />
            <h2 className="font-serif text-base font-semibold text-ink">
              {t("officer.riskDistribution")}
            </h2>
          </div>
          <span className="text-xs text-ink-muted">
            {t("officerDashboard.totalCoverage", { count: total })}
          </span>
        </div>

        {/* Proportional distribution bar */}
        <div className="mt-4 flex h-7 overflow-hidden rounded-md border border-line">
          {[
            { level: "critical" as RiskLevel, count: counts.critical, bg: "bg-risk-critical" },
            { level: "high" as RiskLevel, count: counts.high, bg: "bg-risk-high" },
            { level: "moderate" as RiskLevel, count: counts.moderate, bg: "bg-risk-moderate" },
            { level: "low" as RiskLevel, count: counts.low, bg: "bg-risk-low" },
          ].map((seg) => {
            const pct = (seg.count / total) * 100;
            if (pct === 0) return null;
            return (
              <div
                key={seg.level}
                className={`${seg.bg} flex items-center justify-center text-[11px] font-bold text-white transition-all`}
                style={{ width: `${pct}%` }}
                title={`${t(riskLabelKey[seg.level])}: ${seg.count}`}
              >
                {pct > 12 && `${seg.count}`}
              </div>
            );
          })}
        </div>

        {/* Legend stats */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { level: "critical" as RiskLevel, count: counts.critical },
            { level: "high" as RiskLevel, count: counts.high },
            { level: "moderate" as RiskLevel, count: counts.moderate },
            { level: "low" as RiskLevel, count: counts.low },
          ].map((item) => (
            <div
              key={item.level}
              className="rounded-lg border border-line bg-surface-raised p-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-muted">{t(riskLabelKey[item.level])}</span>
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: riskColor[item.level] }}
                />
              </div>
              <p className="mt-1 font-serif text-xl font-bold tabular text-ink">
                {item.count}
                <span className="ml-1 text-xs font-normal text-ink-muted">
                  ({Math.round((item.count / total) * 100)}%)
                </span>
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Locations Requiring Attention + Drill-down Panel ─── */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Table: Locations (7 cols) */}
        <Card tone="default" className="lg:col-span-7" padded={false}>
          <div className="border-b border-line p-5">
            <h3 className="font-serif text-base font-semibold text-ink">
              {t("officer.locationsTitle")}
            </h3>
            <p className="mt-0.5 text-xs text-ink-muted">
              {t("officerDashboard.inspectInstructions")}
            </p>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("common.location")}</TableHead>
                  <TableHead>{t("common.risk")}</TableHead>
                  <TableHead className="text-right">{t("climatePage.drySpellRisk")}</TableHead>
                  <TableHead className="text-right">{t("climatePage.heavyRainRisk")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fallbackLocations.map((loc) => {
                  const b = getBlock(loc.blockId);
                  if (!b) return null;
                  const isSelected = b.id === inspectId;
                  return (
                    <TableRow
                      key={loc.blockId}
                      onClick={() => setInspectId(b.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-forest-soft/40 font-semibold" : "hover:bg-paper-deep"
                      }`}
                    >
                      <TableCell>
                        <div>
                          <p className="text-sm font-semibold text-ink">
                            {pickName(b, language)}
                          </p>
                          <p className="text-xs text-ink-muted">
                            {loc.districtName}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <RiskBadge risk={loc.risk} size="sm" />
                      </TableCell>
                      <TableCell className="text-right tabular text-sm">
                        {b.drySpellProbability}%
                      </TableCell>
                      <TableCell className="text-right tabular text-sm">
                        {b.heavyRainProbability}%
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Drill-down Inspector Panel (5 cols) */}
        <Card tone="muted" className="lg:col-span-5 flex flex-col justify-between">
          {inspectBlock && inspectForecast ? (
            <div>
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div>
                  <p className="text-xs font-semibold text-ink-muted uppercase">
                    {inspectDistrict ? pickName(inspectDistrict, language) : ""}
                  </p>
                  <h3 className="font-serif text-lg font-bold text-ink">
                    {pickName(inspectBlock, language)}
                  </h3>
                </div>
                <RiskBadge risk={inspectBlock.risk} size="md" />
              </div>

              {/* Climate summary */}
              <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs">
                <div className="rounded border border-line bg-surface p-2">
                  <p className="text-ink-muted">{t("climatePage.onsetProbability")}</p>
                  <p className="font-serif text-base font-bold text-ink tabular">
                    {inspectForecast.monsoonOnsetProbability}%
                  </p>
                </div>
                <div className="rounded border border-line bg-surface p-2">
                  <p className="text-ink-muted">{t("climatePage.drySpellRisk")}</p>
                  <p className="font-serif text-base font-bold text-ink tabular">
                    {inspectForecast.drySpellProbability}%
                  </p>
                </div>
              </div>

              {/* Agricultural Impact */}
              <div className="mt-4 rounded-md border border-line bg-surface p-3">
                <p className="text-xs font-bold text-ink uppercase tracking-wide">
                  {t("riskMapPage.agriculturalImpact")}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                  {inspectBlock.agriculturalImpact}
                </p>
              </div>

              {/* Advisory recommendation for this block */}
              {inspectAdvisory && (
                <div className="mt-3 rounded-md border border-forest/30 bg-forest-soft/30 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-forest uppercase tracking-wide">
                    <Sprout size={14} aria-hidden />
                    <span>{t("advisory.recommendedAction")}</span>
                  </div>
                  <p className="mt-1 text-xs font-medium text-ink">
                    {t(
                      `advisoryTemplates.${inspectAdvisory.concern}.${inspectAdvisory.isSowing ? "headlineSowing" : "headlineOther"}`,
                      { crop: t("crops.soybean"), stage: t("cropStages.sowing") }
                    )}
                  </p>
                </div>
              )}

              {/* Risk Drivers */}
              <div className="mt-4">
                <p className="text-xs font-bold text-ink uppercase tracking-wide">
                  {t("riskMapPage.whyAtRisk")}
                </p>
                <ul className="mt-2 space-y-1.5 text-xs text-ink-muted">
                  {inspectBlock.riskDrivers.map((d) => (
                    <li key={d} className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-forest" />
                      {t(`riskDrivers.${d}`)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-xs text-ink-muted">{t("officerDashboard.selectLocationToInspect")}</p>
          )}

          <div className="mt-6 border-t border-line pt-3">
            <ButtonLink
              href={`/officer/risk-map`}
              variant="secondary"
              size="sm"
              className="w-full"
            >
              {t("officerDashboard.viewOnRiskMap")}
              <ArrowRight size={14} aria-hidden />
            </ButtonLink>
          </div>
        </Card>
      </div>

      {/* ── Regional Crop Exposure & Alerts ─────────────────── */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Crop exposure table (7 cols) */}
        <Card tone="default" className="lg:col-span-7" padded={false}>
          <div className="border-b border-line p-5">
            <h3 className="font-serif text-base font-semibold text-ink">
              {t("officer.cropExposureTitle")}
            </h3>
            <p className="mt-0.5 text-xs text-ink-muted">
              {t("officerDashboard.cropExposureDesc")}
            </p>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("common.crop")}</TableHead>
                  <TableHead className="text-right">{t("officer.exposedBlocks")}</TableHead>
                  <TableHead>{t("officer.riskWeighted")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cropExposure.map((ce) => (
                  <TableRow key={ce.cropKey}>
                    <TableCell className="font-semibold text-ink">
                      {t(ce.cropKey)}
                    </TableCell>
                    <TableCell className="text-right tabular">
                      {ce.exposedBlocks} {t("officerDashboard.blocks")}
                    </TableCell>
                    <TableCell>
                      <RiskBadge risk={ce.riskWeighted} size="sm" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Regional Alert Feed (5 cols) */}
        <Card tone="default" className="lg:col-span-5">
          <CardHeader
            icon={ShieldAlert}
            title={t("officerDashboard.alertsTitle")}
            description={t("officerDashboard.regionalAlertsDesc")}
          />
          <ul className="mt-4 space-y-2.5">
            {alerts.slice(0, 4).map((al) => {
              const b = getBlock(al.blockId);
              const locName = b ? pickName(b, language) : al.blockId;
              return (
                <AlertListItem
                  key={al.id}
                  severity={al.severity}
                  title={t(al.titleKey)}
                  location={locName}
                  time={`${al.timeAgoHours}h ago`}
                />
              );
            })}
          </ul>
        </Card>
      </div>
    </div>
  );
}
