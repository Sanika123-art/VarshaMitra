"use client";

import Link from "next/link";
import {
  ArrowRight,
  CloudRain,
  Map as MapIcon,
  Sprout,
  ShieldCheck,
  Radio,
  ArrowDown,
  Droplets,
  Wind,
  Mountain,
  Database,
} from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { PrototypeTag, SectionHeading } from "@/components/ui";

export default function LandingPage() {
  const { t } = useTranslation();

  return (
    <div>
      {/* ────────────────────────────────── HERO ──────────────────────── */}
      <section className="relative overflow-hidden border-b border-[var(--color-line)]">
        {/* Atmospheric background */}
        <div className="absolute inset-0 topo-pattern" aria-hidden />
        <div
          className="absolute inset-0 bg-gradient-to-br from-[var(--color-paper)] via-[var(--color-paper)] to-[var(--color-forest-light)]"
          aria-hidden
        />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-12 lg:gap-8 lg:px-8 lg:py-28">
          <div className="lg:col-span-7 fade-up">
            <PrototypeTag />
            <p className="mt-5 text-sm font-semibold uppercase tracking-wider text-[var(--color-forest)]">
              {t("landing.heroEyebrow")}
            </p>
            <h1 className="mt-4 font-display text-5xl leading-[1.06] text-[var(--color-ink)] sm:text-6xl lg:text-7xl">
              {t("landing.heroTitleLine1")}
              <br />
              <span className="text-[var(--color-forest)]">
                {t("landing.heroTitleLine2")}
              </span>
              <br />
              {t("landing.heroTitleLine3")}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--color-ink)]/65">
              {t("landing.heroSubtitle")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-forest)] px-6 py-3.5 text-sm font-semibold text-white shadow-[var(--shadow-md)] transition-all hover:bg-[var(--color-forest-dark)] hover:shadow-[var(--shadow-lg)]"
              >
                {t("landing.ctaExplore")}
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/farmer/risk-map"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--color-ink)]/20 px-6 py-3.5 text-sm font-semibold text-[var(--color-ink)] transition-colors hover:bg-[var(--color-paper-raised)] hover:border-[var(--color-forest)]/40"
              >
                {t("landing.ctaMap")}
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 fade-up fade-up-delay-2">
            <HeroClimateVisual />
          </div>
        </div>
      </section>

      {/* ────────────────────────────── SIGNAL TO DECISION ────────────── */}
      <section className="border-b border-[var(--color-line)] bg-[var(--color-paper-raised)]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-forest)]">
            {t("landing.flowTitle")}
          </p>
          <div className="mt-8 flex flex-col items-stretch gap-0 sm:flex-row sm:items-center sm:justify-center sm:gap-0">
            {[
              { label: t("landing.flowClimateData"), icon: CloudRain, color: "var(--color-sky)" },
              { label: t("landing.flowPrediction"), icon: Radio, color: "var(--color-forest)" },
              { label: t("landing.flowRisk"), icon: MapIcon, color: "var(--color-clay)" },
              { label: t("landing.flowAdvisory"), icon: Sprout, color: "var(--color-forest-dark)" },
            ].map((step, i, arr) => (
              <div key={step.label} className="flex items-center gap-0">
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper)] px-6 py-5 text-center shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)]">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-full"
                    style={{ background: `${step.color}15`, color: step.color }}
                  >
                    <step.icon size={18} />
                  </span>
                  <span className="text-sm font-semibold text-[var(--color-ink)]">
                    {step.label}
                  </span>
                </div>
                {i < arr.length - 1 && (
                  <>
                    <ArrowRight
                      size={18}
                      className="hidden shrink-0 text-[var(--color-forest)]/25 sm:block mx-2"
                    />
                    <ArrowDown
                      size={18}
                      className="mx-auto my-2 text-[var(--color-forest)]/25 sm:hidden"
                    />
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────── THREE CAPABILITIES ──────────────── */}
      <section className="border-b border-[var(--color-line)]">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <SectionHeading
            title={t("landing.featuresTitle")}
            body={t("landing.featuresSubtitle")}
            center
          />
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            <FeatureCard
              icon={CloudRain}
              title={t("landing.feature1Title")}
              body={t("landing.feature1Body")}
              href="/farmer/climate"
              accent="var(--color-sky)"
              visual={<RainfallMiniVisual />}
            />
            <FeatureCard
              icon={MapIcon}
              title={t("landing.feature2Title")}
              body={t("landing.feature2Body")}
              href="/farmer/risk-map"
              accent="var(--color-clay)"
              visual={<MapMiniVisual />}
            />
            <FeatureCard
              icon={Sprout}
              title={t("landing.feature3Title")}
              body={t("landing.feature3Body")}
              href="/farmer/advisory"
              accent="var(--color-forest)"
              visual={<AdvisoryMiniVisual />}
            />
          </div>
        </div>
      </section>

      {/* ──────────────────────────── FARMER STORY ───────────────────── */}
      <section className="border-b border-[var(--color-line)] section-earth overflow-hidden">
        <div className="absolute inset-0 topo-dark" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-3xl leading-tight text-white sm:text-4xl">
              {t("landing.impactTitle")}
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/65">
              {t("landing.impactBody")}
            </p>

            {/* Before / After visual */}
            <div className="mt-12 grid gap-4 sm:grid-cols-3 items-center">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/40">{t("landing.beforeLabel")}</p>
                <p className="mt-3 font-display text-base leading-relaxed text-white/75 italic">
                  &ldquo;{t("landing.beforeQuote")}&rdquo;
                </p>
              </div>
              <div className="flex flex-col items-center gap-2 py-4 sm:py-0">
                <div className="h-px w-12 bg-white/20 sm:h-12 sm:w-px" />
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
                  <CloudRain size={16} className="text-white/80" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-white/50">VarshaMitra</span>
                <div className="h-px w-12 bg-white/20 sm:h-12 sm:w-px" />
              </div>
              <div className="rounded-2xl border border-[var(--color-forest-muted)] bg-[var(--color-forest-muted)]/20 p-6 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/50">{t("landing.afterLabel")}</p>
                <p className="mt-3 font-display text-base leading-relaxed text-white/90">
                  &ldquo;{t("landing.afterQuote")}&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────── HOW IT WORKS ───────────────────── */}
      <section className="border-b border-[var(--color-line)] section-atmospheric">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2 items-center">
            <div>
              <SectionHeading
                title={t("landing.howItWorksTitle")}
                body={t("landing.howItWorksBody")}
              />
            </div>
            <div className="flex justify-center">
              <SystemFlowDiagram />
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────── TRUST + FUTURE ─────────────────── */}
      <section className="border-b border-[var(--color-line)]">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-8 shadow-[var(--shadow-sm)]">
              <ShieldCheck size={24} className="text-[var(--color-forest)]" />
              <h3 className="mt-4 font-display text-2xl text-[var(--color-ink)]">
                {t("landing.trustTitle")}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink)]/65">
                {t("landing.trustBody")}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {["IMD", "NOAA", "Copernicus", "ENSO/IOD/MJO"].map((src) => (
                  <span
                    key={src}
                    className="rounded-full bg-[var(--color-forest)]/8 px-3 py-1 text-[11px] font-semibold text-[var(--color-forest-dark)]"
                  >
                    {src}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-8 shadow-[var(--shadow-sm)]">
              <Radio size={24} className="text-[var(--color-sky)]" />
              <h3 className="mt-4 font-display text-2xl text-[var(--color-ink)]">
                {t("landing.futureTitle")}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink)]/65">
                {t("landing.futureBody")}
              </p>
            </div>
          </div>

          <Link
            href="/login"
            className="mt-10 flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-forest)] px-6 py-5 text-center font-display text-xl text-white shadow-[var(--shadow-lg)] transition-all hover:bg-[var(--color-forest-dark)] hover:shadow-[var(--shadow-xl)]"
          >
            {t("landing.loginCta")}
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </div>
  );
}

/* ─── Feature Card ────────────────────────────────────────────── */

function FeatureCard({
  icon: Icon,
  title,
  body,
  href,
  accent,
  visual,
}: {
  icon: typeof CloudRain;
  title: string;
  body: string;
  href: string;
  accent: string;
  visual?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-3xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] transition-all hover:border-[var(--color-forest)]/40 hover:shadow-[var(--shadow-md)]"
    >
      {/* Mini visual */}
      {visual && (
        <div className="relative h-36 w-full overflow-hidden bg-gradient-to-br from-[var(--color-paper)] to-[var(--color-forest-light)]">
          {visual}
        </div>
      )}
      <div className="flex flex-1 flex-col p-7">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-full transition-transform group-hover:scale-105"
          style={{ background: `${accent}15`, color: accent }}
        >
          <Icon size={20} />
        </span>
        <h3 className="mt-5 font-display text-xl text-[var(--color-ink)]">
          {title}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--color-ink)]/60">
          {body}
        </p>
        <span className="mt-4 flex items-center gap-1 text-sm font-semibold text-[var(--color-forest)] opacity-0 transition-opacity group-hover:opacity-100">
          <ArrowRight size={14} />
        </span>
      </div>
    </Link>
  );
}

/* ─── Hero Climate Visual (sophisticated animated SVG) ────────── */

function HeroClimateVisual() {
  return (
    <div className="relative h-80 w-full overflow-hidden rounded-3xl border border-[var(--color-line)] bg-[var(--color-forest-dark)] shadow-[var(--shadow-xl)] sm:h-96 lg:h-full">
      <svg
        viewBox="0 0 420 360"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <defs>
          <linearGradient id="hero-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0a1f16" />
            <stop offset="50%" stopColor="#143126" />
            <stop offset="100%" stopColor="#1f4b3a" />
          </linearGradient>
          <linearGradient id="hero-terrain" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0f2e22" />
            <stop offset="100%" stopColor="#1a4535" />
          </linearGradient>
          <radialGradient id="hero-glow" cx="0.5" cy="0.4" r="0.5">
            <stop offset="0%" stopColor="#2d6b52" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#0a1f16" stopOpacity="0" />
          </radialGradient>
          <filter id="softglow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width="420" height="360" fill="url(#hero-sky)" />
        <rect width="420" height="360" fill="url(#hero-glow)" />

        {/* Topographic contour lines */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <path
            key={`contour-${i}`}
            d={`M0,${200 + i * 18} Q105,${180 + i * 15} 210,${200 + i * 18} T420,${195 + i * 18}`}
            fill="none"
            stroke="#9fd6c1"
            strokeWidth="0.6"
            opacity={0.1 - i * 0.012}
          />
        ))}

        {/* Terrain layers */}
        <g className="rain-band" opacity="0.5">
          <path d="M0,200 Q60,180 120,195 T240,190 T360,200 T420,195 V360 H0 Z" fill="#173a2c" />
        </g>
        <g className="rain-band" style={{ animationDelay: "-3s" }} opacity="0.7">
          <path d="M0,240 Q80,220 160,240 T320,235 T420,240 V360 H0 Z" fill="#0f2e22" />
        </g>
        <g className="rain-band" style={{ animationDelay: "-6s" }} opacity="0.9">
          <path d="M0,275 Q100,260 200,275 T400,270 V360 H0 Z" fill="#0a1f16" />
        </g>

        {/* Rain drops */}
        {Array.from({ length: 30 }).map((_, i) => (
          <line
            key={`rain-${i}`}
            x1={14 + i * 14}
            y1={-10}
            x2={6 + i * 14}
            y2={45}
            stroke="#9fd6c1"
            strokeWidth="1"
            opacity={0.2 + (i % 3) * 0.1}
          >
            <animate
              attributeName="y1"
              values={`${-20 - (i % 5) * 10};${40 - (i % 5) * 10}`}
              dur={`${1.5 + (i % 3) * 0.5}s`}
              repeatCount="indefinite"
            />
            <animate
              attributeName="y2"
              values={`${30 - (i % 5) * 10};${90 - (i % 5) * 10}`}
              dur={`${1.5 + (i % 3) * 0.5}s`}
              repeatCount="indefinite"
            />
          </line>
        ))}

        {/* Risk zone indicators */}
        <circle cx="120" cy="180" r="18" fill="#B5502E" opacity="0.15" filter="url(#softglow)">
          <animate attributeName="opacity" values="0.1;0.2;0.1" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="300" cy="160" r="14" fill="#C8952E" opacity="0.12" filter="url(#softglow)">
          <animate attributeName="opacity" values="0.08;0.16;0.08" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx="210" cy="195" r="10" fill="#4C7A4F" opacity="0.15" filter="url(#softglow)" />
      </svg>

      {/* Overlay metrics */}
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
        <div className="rounded-2xl bg-white/8 px-4 py-3 backdrop-blur-sm border border-white/10">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
            Onset probability
          </p>
          <p className="font-display text-2xl text-white">78%</p>
        </div>
        <div className="rounded-2xl bg-white/8 px-4 py-3 backdrop-blur-sm border border-white/10">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
            Dry-spell risk
          </p>
          <p className="font-display text-2xl text-white">24%</p>
        </div>
        <div className="hidden rounded-2xl bg-white/8 px-4 py-3 backdrop-blur-sm border border-white/10 sm:block">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
            Confidence
          </p>
          <p className="font-display text-2xl text-white">Med</p>
        </div>
      </div>

      {/* Corner badge */}
      <div className="absolute left-4 top-4 rounded-full bg-white/10 px-3 py-1 backdrop-blur-sm">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/60">
          Live preview · Simulated
        </span>
      </div>
    </div>
  );
}

/* ─── Mini Visuals for Feature Cards ──────────────────────────── */

function RainfallMiniVisual() {
  const bars = [6, 12, 8, 18, 24, 14, 9, 20, 16, 10, 7, 22, 15, 11];
  return (
    <div className="absolute inset-0 flex items-end justify-center gap-[3px] px-6 pb-4 pt-8">
      {bars.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-sm bg-[var(--color-sky)] transition-all"
          style={{ height: `${h * 3}%`, opacity: 0.3 + (h / 30) * 0.5 }}
        />
      ))}
    </div>
  );
}

function MapMiniVisual() {
  const dots = [
    { x: 30, y: 45, r: 8, color: "#4C7A4F" },
    { x: 55, y: 30, r: 10, color: "#B5502E" },
    { x: 70, y: 60, r: 7, color: "#C8952E" },
    { x: 45, y: 70, r: 9, color: "#7A2E1F" },
    { x: 80, y: 40, r: 6, color: "#4C7A4F" },
  ];
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
      <rect width="100" height="100" fill="var(--color-forest-light)" opacity="0.3" />
      {/* Grid lines */}
      {[20, 40, 60, 80].map((pos) => (
        <g key={pos}>
          <line x1={pos} y1="0" x2={pos} y2="100" stroke="var(--color-line)" strokeWidth="0.3" />
          <line x1="0" y1={pos} x2="100" y2={pos} stroke="var(--color-line)" strokeWidth="0.3" />
        </g>
      ))}
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={d.color} opacity="0.6" />
      ))}
    </svg>
  );
}

function AdvisoryMiniVisual() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-8">
      {["Climate Signal", "Crop Impact", "Action"].map((label, i) => (
        <div key={label} className="flex flex-col items-center">
          {i > 0 && <div className="h-2 w-px bg-[var(--color-forest)]/25" />}
          <div className="rounded-lg bg-[var(--color-paper-raised)] border border-[var(--color-line)] px-4 py-1.5 text-[10px] font-medium text-[var(--color-ink)]/60">
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── System Flow Diagram ─────────────────────────────────────── */

function SystemFlowDiagram() {
  const steps = [
    { icon: Database, label: "Climate Data", sublabel: "IMD · ENSO · IOD · MJO" },
    { icon: Radio, label: "AI Prediction", sublabel: "Hyperlocal model" },
    { icon: MapIcon, label: "Risk Engine", sublabel: "Block-level risk" },
    { icon: Sprout, label: "Crop Context", sublabel: "Crop + stage" },
    { icon: Wind, label: "Advisory", sublabel: "Farmer decision" },
  ];

  return (
    <div className="flex flex-col items-center gap-0">
      {steps.map((step, i) => (
        <div key={step.label} className="flex flex-col items-center">
          {i > 0 && (
            <div className="flex flex-col items-center">
              <div className="h-4 w-px bg-[var(--color-forest)]/20" />
              <ArrowDown size={14} className="text-[var(--color-forest)]/30" />
              <div className="h-2 w-px bg-[var(--color-forest)]/20" />
            </div>
          )}
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] px-5 py-3 shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)]">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-forest)]/10 text-[var(--color-forest)]">
              <step.icon size={16} />
            </span>
            <div>
              <p className="text-sm font-semibold text-[var(--color-ink)]">{step.label}</p>
              <p className="text-[11px] text-[var(--color-ink)]/50">{step.sublabel}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
