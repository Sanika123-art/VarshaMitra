"use client";

import {
  CloudRain,
  Radio,
  Map as MapIcon,
  Sprout,
  Database,
  Shield,
  TrendingUp,
  Compass,
  ArrowDown,
  HelpCircle,
  Camera,
  ExternalLink,
} from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import {
  PageHeader,
  Card,
  CardHeader,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui";
import { usedCredits } from "@/data/media";

export default function AboutPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* ── Page Header ────────────────────────────────────── */}
      <PageHeader
        eyebrow="Team Bit2Bramha"
        title={t("about.title")}
        description={t("about.problemBody")}
      />

      {/* ── Core Problem & Why VarshaMitra ───────────────────── */}
      <div className="grid gap-6 sm:grid-cols-2">
        <Card tone="default">
          <div className="flex items-center gap-2.5 text-forest">
            <HelpCircle size={20} />
            <h2 className="font-serif text-lg font-bold text-ink">
              {t("about.problemTitle")}
            </h2>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            {t("about.problemBody")}
          </p>
        </Card>

        <Card tone="default">
          <div className="flex items-center gap-2.5 text-monsoon">
            <Compass size={20} />
            <h2 className="font-serif text-lg font-bold text-ink">
              {t("about.whyTitle")}
            </h2>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            {t("about.whyBody")}
          </p>
        </Card>
      </div>

      {/* ── Architecture Pipeline ───────────────────────────── */}
      <Card tone="default">
        <CardHeader
          icon={Radio}
          title={t("about.howTitle")}
          description={t("about.howBody")}
        />

        <div className="mt-6 flex flex-col items-center gap-0">
          {[
            {
              step: "01",
              icon: Database,
              label: "Observational & Satellite Inputs",
              desc: "IMD gridded rainfall, ECMWF ERA5, NOAA Sea Surface Temperatures (ENSO, IOD, MJO)",
            },
            {
              step: "02",
              icon: Radio,
              label: "Downscaling & Predictive Modeling",
              desc: "Calibrated probabilistic regression and classification for 7-, 14-, and 30-day forecast horizons",
            },
            {
              step: "03",
              icon: MapIcon,
              label: "Hyperlocal Risk Classification",
              desc: "Block-level spatial evaluation mapping dry-spells, heavy downpours, and monsoon onset dates",
            },
            {
              step: "04",
              icon: Sprout,
              label: "Crop Vulnerability Engine",
              desc: "Stage-aware agronomic models assessing sensitivity during sowing, vegetative, flowering, and harvest",
            },
            {
              step: "05",
              icon: CloudRain,
              label: "Decision-Support Advisory",
              desc: "Actionable, transparent farm-level advisories delivered in Marathi and English",
            },
          ].map((item, idx, arr) => {
            const Icon = item.icon;
            return (
              <div key={item.step} className="flex w-full flex-col items-center">
                <div className="flex w-full items-start gap-4 rounded-lg border border-line bg-surface-raised p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-forest-soft text-forest">
                    <Icon size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-serif text-sm font-semibold text-ink">
                        {item.label}
                      </h3>
                      <span className="text-xs font-bold text-ink-muted">
                        {item.step}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                      {item.desc}
                    </p>
                  </div>
                </div>
                {idx < arr.length - 1 && (
                  <div className="my-1 flex h-4 w-px items-center justify-center bg-line">
                    <ArrowDown size={12} className="text-ink-muted" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* ── Impact & Roadmap ─────────────────────────────────── */}
      <div className="grid gap-6 sm:grid-cols-2">
        <Card tone="default">
          <div className="flex items-center gap-2.5 text-forest">
            <TrendingUp size={20} />
            <h2 className="font-serif text-lg font-bold text-ink">
              {t("about.impactTitle")}
            </h2>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            {t("about.impactBody")}
          </p>
        </Card>

        <Card tone="default">
          <div className="flex items-center gap-2.5 text-earth">
            <Shield size={20} />
            <h2 className="font-serif text-lg font-bold text-ink">
              {t("about.roadmapTitle")}
            </h2>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            {t("about.roadmapBody")}
          </p>
        </Card>
      </div>

      {/* ── Contextual Photography Licensing & Attribution ───── */}
      <Card tone="default" padded={false}>
        <div className="border-b border-line p-5">
          <div className="flex items-center gap-2 text-forest">
            <Camera size={18} />
            <h2 className="font-serif text-base font-semibold text-ink">
              Photography Credits & Open Licensing
            </h2>
          </div>
          <p className="mt-1 text-xs text-ink-muted">
            All agricultural and contextual imagery used in VarshaMitra is sourced from Wikimedia Commons under Creative Commons licensing.
          </p>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Photograph Title</TableHead>
                <TableHead>Author / Contributor</TableHead>
                <TableHead>License</TableHead>
                <TableHead className="text-right">Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usedCredits.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-semibold text-ink text-xs">
                    {c.title}
                  </TableCell>
                  <TableCell className="text-xs text-ink-muted">
                    {c.author}
                  </TableCell>
                  <TableCell className="text-xs">
                    <a
                      href={c.licenseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-forest hover:underline"
                    >
                      {c.license}
                    </a>
                  </TableCell>
                  <TableCell className="text-right text-xs">
                    <a
                      href={c.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-forest hover:underline"
                    >
                      <span>Commons</span>
                      <ExternalLink size={11} />
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* ── Data Provenance & Integration Status ────────────────── */}
      <div className="rounded-lg border border-forest/30 bg-forest-soft/30 p-5 text-sm">
        <h3 className="font-serif font-bold text-forest">
          {t("about.prototypeTitle")}
        </h3>
        <p className="mt-2 leading-relaxed text-ink-muted">
          {t("about.prototypeBody")}
        </p>
      </div>
    </div>
  );
}
