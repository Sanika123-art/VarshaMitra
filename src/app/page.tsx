"use client";

import Link from "next/link";
import {
  ArrowRight,
  CloudRain,
  Map as MapIcon,
  Sprout,
  ShieldCheck,
  Radio,
} from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import {
  SectionHeading,
  ButtonLink,
  Card,
  Photo,
} from "@/components/ui";
import { photos } from "@/data/media";

export default function LandingPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-16 py-8 sm:py-12">
      {/* ────────────────────────────────── HERO ──────────────────────── */}
      <section className="container-page">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-forest-soft px-3 py-1 text-xs font-semibold text-forest">
                <span className="h-2 w-2 rounded-full bg-forest animate-pulse" />
                {t("landing.heroEyebrow")}
              </span>
            </div>

            <h1 className="font-serif text-4xl leading-[1.12] text-ink sm:text-5xl lg:text-6xl">
              {t("landing.heroTitleLine1")}{" "}
              <span className="text-forest">
                {t("landing.heroTitleLine2")}
              </span>{" "}
              {t("landing.heroTitleLine3")}
            </h1>

            <p className="max-w-xl text-lg leading-relaxed text-ink-muted">
              {t("landing.heroSubtitle")}
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <ButtonLink href="/login" variant="primary" size="lg">
                {t("landing.ctaExplore")}
                <ArrowRight size={18} aria-hidden />
              </ButtonLink>
              <ButtonLink href="/farmer/risk-map" variant="secondary" size="lg">
                <MapIcon size={18} aria-hidden />
                {t("landing.ctaMap")}
              </ButtonLink>
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-ink-muted border-t border-line">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-forest" />
                <span>Maharashtra 36 Districts</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-monsoon" />
                <span>Block-level Climate Signals</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-earth" />
                <span>Marathi & English</span>
              </div>
            </div>
          </div>

          {/* Hero Visual: Authentic Maharashtra agriculture photo + climate badge */}
          <div className="lg:col-span-5">
            <div className="relative overflow-hidden rounded-xl border border-line bg-surface shadow-md">
              <Photo
                src={photos.farmerSowing.src}
                alt={t("media.farmerSowing")}
                sizes="(max-width: 1024px) 100vw, 500px"
                priority
                className="aspect-[4/3] w-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-white/80">
                      {t("media.farmerSowing")}
                    </p>
                    <p className="text-[11px] text-white/60">
                      Western Ghats, Maharashtra
                    </p>
                  </div>
                  <span className="rounded bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase backdrop-blur-sm">
                    {t("status.demoBadge")}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/20 pt-3 text-center">
                  <div className="rounded bg-white/10 p-2 backdrop-blur-sm">
                    <p className="text-[10px] text-white/70">Onset Prob.</p>
                    <p className="font-serif text-base font-bold text-white tabular">78%</p>
                  </div>
                  <div className="rounded bg-white/10 p-2 backdrop-blur-sm">
                    <p className="text-[10px] text-white/70">Dry-spell Risk</p>
                    <p className="font-serif text-base font-bold text-white tabular">24%</p>
                  </div>
                  <div className="rounded bg-white/10 p-2 backdrop-blur-sm">
                    <p className="text-[10px] text-white/70">Confidence</p>
                    <p className="font-serif text-base font-bold text-white">High</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────── SIGNAL TO DECISION ────────────── */}
      <section className="border-y border-line bg-surface-raised py-12">
        <div className="container-page">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-forest">
            {t("landing.flowTitle")}
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: t("landing.flowClimateData"), icon: CloudRain, desc: "IMD, NOAA & Satellite feeds" },
              { label: t("landing.flowPrediction"), icon: Radio, desc: "Calibrated forecast horizons" },
              { label: t("landing.flowRisk"), icon: MapIcon, desc: "Block & district vulnerabilities" },
              { label: t("landing.flowAdvisory"), icon: Sprout, desc: "Crop & growth-stage actions" },
            ].map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.label}
                  className="rounded-lg border border-line bg-surface p-5 transition-shadow hover:shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-forest-soft text-forest">
                      <Icon size={18} />
                    </span>
                    <span className="text-xs font-bold text-ink-muted">0{idx + 1}</span>
                  </div>
                  <h3 className="mt-4 font-serif text-base font-semibold text-ink">
                    {step.label}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ──────────────────────────── THREE CAPABILITIES ──────────────── */}
      <section className="container-page space-y-10">
        <SectionHeading
          title={t("landing.featuresTitle")}
          body={t("landing.featuresSubtitle")}
          center
        />

        <div className="grid gap-6 md:grid-cols-3">
          <FeatureCard
            icon={CloudRain}
            title={t("landing.feature1Title")}
            body={t("landing.feature1Body")}
            href="/farmer/climate"
            badge="Rainfall & Temperature"
          />
          <FeatureCard
            icon={MapIcon}
            title={t("landing.feature2Title")}
            body={t("landing.feature2Body")}
            href="/farmer/risk-map"
            badge="Geospatial Map"
          />
          <FeatureCard
            icon={Sprout}
            title={t("landing.feature3Title")}
            body={t("landing.feature3Body")}
            href="/farmer/advisory"
            badge="Crop-Specific"
          />
        </div>
      </section>

      {/* ──────────────────────────── FARMER IMPACT ───────────────────── */}
      <section className="container-page">
        <div className="rounded-xl border border-line bg-forest-dark p-8 text-white sm:p-12">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-serif text-2xl font-bold leading-tight sm:text-3xl lg:text-4xl">
              {t("landing.impactTitle")}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-white/80">
              {t("landing.impactBody")}
            </p>

            <div className="mt-8 grid gap-4 text-left sm:grid-cols-2">
              <div className="rounded-lg border border-white/15 bg-white/5 p-5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-risk-moderate-soft">
                  {t("landing.beforeLabel")}
                </span>
                <p className="mt-2 text-sm italic leading-relaxed text-white/70">
                  &ldquo;{t("landing.beforeQuote")}&rdquo;
                </p>
              </div>

              <div className="rounded-lg border border-forest/50 bg-forest/20 p-5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white">
                  {t("landing.afterLabel")}
                </span>
                <p className="mt-2 text-sm leading-relaxed text-white/95">
                  &ldquo;{t("landing.afterQuote")}&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────── TRUST & PUBLIC SECTOR ──────────── */}
      <section className="container-page pb-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card tone="default">
            <ShieldCheck size={24} className="text-forest" />
            <h3 className="mt-4 font-serif text-xl font-bold text-ink">
              {t("landing.trustTitle")}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              {t("landing.trustBody")}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["IMD Observational Data", "ECMWF & NOAA Ensemble", "OpenStreetMap", "Gov-Ready Architecture"].map(
                (src) => (
                  <span
                    key={src}
                    className="rounded-md border border-line bg-surface-raised px-2.5 py-1 text-xs font-semibold text-ink"
                  >
                    {src}
                  </span>
                )
              )}
            </div>
          </Card>

          <Card tone="default">
            <Radio size={24} className="text-monsoon" />
            <h3 className="mt-4 font-serif text-xl font-bold text-ink">
              {t("landing.futureTitle")}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              {t("landing.futureBody")}
            </p>
            <div className="mt-6">
              <ButtonLink href="/login" variant="primary" size="md">
                {t("landing.loginCta")}
                <ArrowRight size={16} aria-hidden />
              </ButtonLink>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  body,
  href,
  badge,
}: {
  icon: typeof CloudRain;
  title: string;
  body: string;
  href: string;
  badge: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col justify-between rounded-lg border border-line bg-surface p-6 shadow-xs transition-all hover:border-forest/50 hover:shadow-sm"
    >
      <div>
        <div className="flex items-center justify-between">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-forest-soft text-forest">
            <Icon size={20} />
          </span>
          <span className="rounded bg-paper-deep px-2 py-0.5 text-[11px] font-semibold text-ink-muted">
            {badge}
          </span>
        </div>
        <h3 className="mt-4 font-serif text-lg font-bold text-ink group-hover:text-forest">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          {body}
        </p>
      </div>
      <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-forest">
        <span>Explore</span>
        <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}
