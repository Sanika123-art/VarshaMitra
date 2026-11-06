"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CloudRain,
  Map as MapIcon,
  Sprout,
  ShieldCheck,
  Radio,
  Search,
  Compass,
  Sparkles,
  ChevronRight,
  Droplets,
  Wind,
  Thermometer,
  ShieldAlert,
  Bot,
} from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { photos } from "@/data/media";
import { Photo } from "@/components/ui";

const AGRO_ZONES = [
  { name: "South Konkan Coastal Zone", rainfall: "3000-3500 mm", soil: "Lateritic Red Soil", crops: "Rice, Mango, Cashew" },
  { name: "North Konkan Coastal Zone", rainfall: "2600-3000 mm", soil: "Coarse Shallow Soil", crops: "Rice, Finger Millet" },
  { name: "Ghat Zone (Western Ghats)", rainfall: "3000-5000 mm", soil: "Lateritic & Forest Soil", crops: "Paddy, Hill Millets" },
  { name: "Transition Zone 1", rainfall: "1250-3000 mm", soil: "Reddish Brown to Black", crops: "Sugarcane, Groundnut" },
  { name: "Scarcity Zone (Rain Shadow)", rainfall: "500-750 mm", soil: "Medium Black to Calcareous", crops: "Sorghum, Pearl Millet, Pulses" },
  { name: "Central Vidarbha Zone", rainfall: "950-1250 mm", soil: "Deep Heavy Black Soil", crops: "Cotton, Soybean, Pigeonpea" },
];

export default function LandingPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredZones = searchQuery
    ? AGRO_ZONES.filter(
        (z) =>
          z.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          z.crops.toLowerCase().includes(searchQuery.toLowerCase()) ||
          z.soil.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : AGRO_ZONES;

  return (
    <div className="bg-[#F4F0E5] text-[#252923]">
      {/* ────────────────────────────────── HERO SECTION ──────────────────────── */}
      <section className="relative overflow-hidden border-b-2 border-[#123C32]/20 py-12 sm:py-16 md:py-24">
        {/* Subtle grid pattern background */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#123C32 1px, transparent 1px), linear-gradient(90deg, #123C32 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="container-page relative z-10">
          {/* Top Ticker Badge */}
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded border border-[#123C32] bg-[#123C32] px-2.5 py-1 font-mono text-xs font-bold uppercase tracking-wider text-[#F4F0E5] shadow-[2px_2px_0px_#252923]">
              <span className="h-2 w-2 rounded-full bg-[#E6A52E] animate-pulse" />
              {t("landing.heroEyebrow")}
            </span>
            <span className="font-mono text-xs text-[#252923]/70 sm:inline">
              Operational Ensemble: IMD Automatic Weather Stations · ERA5-Land Reanalysis · ECMWF 14-Day
            </span>
          </div>

          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left Headline & Search (7 cols) */}
            <div className="space-y-6 lg:col-span-7">
              <h1 className="font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-[#123C32] sm:text-5xl lg:text-6xl">
                Hyperlocal rainfall <br />
                intelligence for <br />
                <span className="bg-[#123C32] text-[#F4F0E5] px-2 py-0.5 inline-block shadow-[4px_4px_0px_#E6A52E]">
                  smarter farming.
                </span>
              </h1>

              <p className="max-w-xl font-sans text-base leading-relaxed text-[#252923]/80 sm:text-lg">
                VarshaMitra delivers block-level monsoon onset predictions, 14-day calibrated dry-spell risk radars, and crop-stage advisories across all 36 districts of Maharashtra.
              </p>

              {/* District & Location Search Bar */}
              <div className="max-w-xl">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (searchQuery.trim()) {
                      router.push(`/location?q=${encodeURIComponent(searchQuery)}`);
                    } else {
                      router.push("/location");
                    }
                  }}
                  className="flex overflow-hidden rounded-lg border-2 border-[#123C32] bg-white shadow-[4px_4px_0px_#123C32]"
                >
                  <div className="flex items-center pl-3.5 text-[#123C32]">
                    <Search size={18} />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search your district or taluka (e.g. Pune, Baramati, Nagpur)..."
                    className="w-full bg-transparent px-3 py-3 font-sans text-sm text-[#252923] outline-none placeholder:text-[#252923]/40"
                  />
                  <button
                    type="submit"
                    className="border-l-2 border-[#123C32] bg-[#123C32] px-5 py-3 font-mono text-xs font-bold uppercase tracking-wider text-[#F4F0E5] transition-colors hover:bg-[#172B4D]"
                  >
                    Locate
                  </button>
                </form>
                <div className="mt-2 flex flex-wrap items-center gap-1.5 font-mono text-xs text-[#252923]/60">
                  <span>Popular:</span>
                  {["Nashik", "Aurangabad", "Solapur", "Kolhapur", "Amravati"].map((city) => (
                    <Link
                      key={city}
                      href={`/location?q=${encodeURIComponent(city)}`}
                      className="rounded border border-[#123C32]/20 bg-white/60 px-1.5 py-0.5 hover:border-[#123C32] hover:bg-white"
                    >
                      {city}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href="/login"
                  className="flex items-center gap-2 rounded-lg border-2 border-[#123C32] bg-[#123C32] px-6 py-3 font-mono text-sm font-bold uppercase tracking-wider text-[#F4F0E5] shadow-[4px_4px_0px_#252923] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#252923] active:translate-x-[0px] active:translate-y-[0px] active:shadow-[2px_2px_0px_#252923]"
                >
                  <span>{t("landing.ctaExplore")}</span>
                  <ArrowRight size={16} />
                </Link>

                <Link
                  href="/farmer/risk-map"
                  className="flex items-center gap-2 rounded-lg border-2 border-[#123C32] bg-white px-5 py-3 font-mono text-sm font-bold uppercase tracking-wider text-[#123C32] shadow-[4px_4px_0px_#123C32] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#123C32] active:translate-x-[0px] active:translate-y-[0px] active:shadow-[2px_2px_0px_#123C32]"
                >
                  <MapIcon size={16} />
                  <span>Interactive Map</span>
                </Link>

                <Link
                  href="/farmer/saarthi"
                  className="flex items-center gap-2 rounded-lg border-2 border-[#E6A52E] bg-[#E6A52E]/15 px-4 py-3 font-mono text-xs font-bold uppercase tracking-wider text-[#123C32] hover:bg-[#E6A52E]/30"
                >
                  <Bot size={16} className="text-[#123C32]" />
                  <span>Ask Saarthi AI</span>
                </Link>
              </div>

              {/* Editorial Coverage Footer */}
              <div className="flex flex-wrap items-center gap-6 border-t-2 border-[#123C32]/15 pt-4 font-mono text-xs text-[#252923]/70">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#123C32]" />
                  <span className="font-bold">36 Maharashtra Districts</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#2878A5]" />
                  <span className="font-bold">350+ Talukas Covered</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#E6A52E]" />
                  <span className="font-bold">24 Field & Cash Crops</span>
                </div>
              </div>
            </div>

            {/* Right Visual & Live Climate Card (5 cols) */}
            <div className="lg:col-span-5">
              <div className="overflow-hidden rounded-xl border-3 border-[#123C32] bg-white shadow-[8px_8px_0px_#123C32]">
                {/* Header Tag */}
                <div className="flex items-center justify-between border-b-2 border-[#123C32] bg-[#123C32] px-4 py-2 text-[#F4F0E5]">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider">
                    Ground Station Telemetry
                  </span>
                  <span className="rounded bg-[#E6A52E] px-2 py-0.5 font-mono text-[10px] font-bold text-[#123C32]">
                    LIVE OBSERVATION
                  </span>
                </div>

                {/* Authentic Agriculture Image with Editorial Caption */}
                <div className="relative">
                  <Photo
                    src={photos.farmerSowing.src}
                    alt={t("media.farmerSowing")}
                    sizes="(max-width: 1024px) 100vw, 500px"
                    priority
                    className="aspect-[16/10] w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4 text-[#F4F0E5]">
                    <p className="font-display text-sm font-bold text-white">
                      Kharif Sowing Operations · Baramati Taluka, Pune
                    </p>
                    <p className="font-mono text-[11px] text-white/80">
                      Topsoil moisture: 68% · Calibrated Sowing Window: ACTIVE
                    </p>
                  </div>
                </div>

                {/* Weather Metrics Strip */}
                <div className="grid grid-cols-3 divide-x-2 divide-[#123C32]/20 border-b-2 border-[#123C32]/20 bg-[#F4F0E5]/60 p-3 text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1 text-[#2878A5]">
                      <Droplets size={14} />
                      <span className="font-mono text-[10px] uppercase font-bold text-[#252923]/60">Rainfall</span>
                    </div>
                    <p className="mt-1 font-mono text-base font-bold text-[#123C32]">28.4 mm</p>
                    <p className="text-[10px] text-[#252923]/60">Past 48h</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-[#E6A52E]">
                      <Thermometer size={14} />
                      <span className="font-mono text-[10px] uppercase font-bold text-[#252923]/60">Temp</span>
                    </div>
                    <p className="mt-1 font-mono text-base font-bold text-[#123C32]">29.2°C</p>
                    <p className="text-[10px] text-[#252923]/60">Day Mean</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-[#3B8B61]">
                      <Wind size={14} />
                      <span className="font-mono text-[10px] uppercase font-bold text-[#252923]/60">Risk</span>
                    </div>
                    <p className="mt-1 font-mono text-base font-bold text-[#3B8B61]">Low</p>
                    <p className="text-[10px] text-[#252923]/60">Dry-spell: 12%</p>
                  </div>
                </div>

                {/* Live Recommendation Badge */}
                <div className="p-4 bg-white">
                  <div className="flex items-start gap-3 rounded-lg border-2 border-[#123C32]/20 bg-[#123C32]/5 p-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#123C32] bg-[#123C32] text-[#F4F0E5]">
                      <Sprout size={16} />
                    </span>
                    <div>
                      <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#123C32]">
                        Agronomic Advisory Signal
                      </p>
                      <p className="mt-0.5 font-sans text-xs font-semibold text-[#252923]">
                        Soybean and Cotton sowing recommended. Favorable soil saturation with 45mm cumulative rain forecast across next 5 days.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────── 4-STEP SIGNAL-TO-DECISION PIPELINE ────── */}
      <section className="border-b-2 border-[#123C32]/20 bg-white py-14 sm:py-20">
        <div className="container-page">
          <div className="flex flex-col items-center text-center">
            <span className="rounded border border-[#123C32] bg-[#123C32] px-3 py-1 font-mono text-xs font-bold uppercase tracking-widest text-[#F4F0E5] shadow-[2px_2px_0px_#252923]">
              Deterministic Architecture
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-[#123C32] sm:text-4xl">
              From Raw Climate Signals to Farm-Gate Decisions
            </h2>
            <p className="mt-2 max-w-2xl font-sans text-sm text-[#252923]/70 sm:text-base">
              VarshaMitra replaces vague regional forecasts with a calibrated decision pipeline designed for Maharashtra&apos;s agro-climatic conditions.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: "01",
                label: "Climate Ingestion",
                icon: CloudRain,
                tag: "IMD + ERA5-Land",
                desc: "Grid-calibrated rainfall, surface temperature, humidity, and atmospheric pressure updated continuously.",
              },
              {
                step: "02",
                label: "Ensemble Forecasts",
                icon: Radio,
                tag: "14-Day Horizon",
                desc: "High-resolution multi-model ensemble predictions accounting for Western Ghats orographic variation.",
              },
              {
                step: "03",
                label: "Risk Engine",
                icon: ShieldAlert,
                tag: "Dry-Spell & Deluge",
                desc: "Deterministic threshold analysis calculating dry-spell streaks, soil moisture deficits, and deluge hazards.",
              },
              {
                step: "04",
                label: "Actionable Advisory",
                icon: Sprout,
                tag: "Clear Do / Avoid",
                desc: "Direct guidance answering: What should I sow? When should I irrigate? What should I avoid today?",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className="group relative flex flex-col justify-between rounded-xl border-2 border-[#123C32] bg-[#F4F0E5] p-6 shadow-[4px_4px_0px_#123C32] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#123C32]"
                >
                  <div>
                    <div className="flex items-center justify-between border-b-2 border-[#123C32]/15 pb-3">
                      <span className="font-mono text-xl font-black text-[#123C32]">{item.step}</span>
                      <span className="rounded border border-[#123C32]/30 bg-white px-2 py-0.5 font-mono text-[10px] font-bold text-[#123C32]">
                        {item.tag}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-md border border-[#123C32] bg-[#123C32] text-[#E6A52E]">
                        <Icon size={18} />
                      </span>
                      <h3 className="font-display text-lg font-bold text-[#252923]">{item.label}</h3>
                    </div>
                    <p className="mt-3 font-sans text-xs leading-relaxed text-[#252923]/75 sm:text-sm">
                      {item.desc}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-1 font-mono text-xs font-bold text-[#123C32]">
                    <span>Deterministic Flow</span>
                    <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ────────────────────────────── SIX CORE PLATFORM CAPABILITIES ────────── */}
      <section className="container-page py-16 sm:py-24">
        <div className="flex flex-col items-center text-center">
          <span className="rounded border border-[#123C32] bg-[#123C32] px-3 py-1 font-mono text-xs font-bold uppercase tracking-widest text-[#F4F0E5]">
            Platform Capabilities
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-[#123C32] sm:text-4xl">
            Everything Required for Precision Farm Management
          </h2>
          <p className="mt-2 max-w-2xl font-sans text-sm text-[#252923]/70 sm:text-base">
            Engineered with strict zero-hallucination protocols. Every metric maps to an exact observational sensor or peer-reviewed agronomic rule.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Hyperlocal Weather Intelligence",
              badge: "Observational",
              desc: "14-day rainfall forecasts, past 30-day precipitation history, vapor pressure deficits, and evapotranspiration calculations.",
              href: "/farmer/climate",
              icon: CloudRain,
            },
            {
              title: "Maharashtra Risk Radar Map",
              badge: "Geospatial",
              desc: "Block-by-block GIS risk assessment with dry-spell clustering, rainfall anomalies, and district-level vulnerability heatmaps.",
              href: "/farmer/risk-map",
              icon: MapIcon,
            },
            {
              title: "24-Crop Suitability Catalogue",
              badge: "Agronomy",
              desc: "Soil-matched suitability matrix covering Kharif and Rabi staples with authentic high-resolution photographic field specimens.",
              href: "/farmer/crop",
              icon: Sprout,
            },
            {
              title: "Sowing Window Intelligence",
              badge: "Phenology",
              desc: "75mm cumulative rainfall thresholds, soil moisture saturation status, and optimal seed germination day windows.",
              href: "/farmer/dashboard",
              icon: Compass,
            },
            {
              title: "Crop-Stage Advisory Engine",
              badge: "Advisory",
              desc: "Phenological stage-specific advisories detailing pesticide spray timing, irrigation schedules, and deluge protection.",
              href: "/farmer/advisory",
              icon: ShieldCheck,
            },
            {
              title: "Saarthi Conversational AI",
              badge: "Assistant",
              desc: "Multilingual voice-ready companion answering farm questions in Marathi and English with full context awareness.",
              href: "/farmer/saarthi",
              icon: Bot,
            },
          ].map((feature) => {
            const Icon = feature.icon;
            return (
              <Link
                key={feature.title}
                href={feature.href}
                className="group flex flex-col justify-between rounded-xl border-2 border-[#123C32] bg-white p-6 shadow-[4px_4px_0px_#123C32] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#123C32]"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-[#123C32] bg-[#123C32] text-[#E6A52E]">
                      <Icon size={20} />
                    </span>
                    <span className="rounded border border-[#123C32]/30 bg-[#F4F0E5] px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#123C32]">
                      {feature.badge}
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-lg font-bold text-[#252923] group-hover:text-[#123C32]">
                    {feature.title}
                  </h3>
                  <p className="mt-2 font-sans text-xs leading-relaxed text-[#252923]/70 sm:text-sm">
                    {feature.desc}
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-1 font-mono text-xs font-bold text-[#123C32]">
                  <span>Access Module</span>
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ────────────────────────────── MAHARASHTRA AGRO-CLIMATIC ZONES ─────── */}
      <section className="border-t-2 border-[#123C32]/20 bg-[#123C32] py-16 text-[#F4F0E5] sm:py-20">
        <div className="container-page">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <span className="rounded border border-[#E6A52E] bg-[#E6A52E]/10 px-2.5 py-1 font-mono text-xs font-bold uppercase tracking-widest text-[#E6A52E]">
                State Agro-Climatic Intelligence
              </span>
              <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-[#F4F0E5] sm:text-4xl">
                Tuned to Maharashtra&apos;s 9 Distinct Agricultural Zones
              </h2>
              <p className="mt-2 max-w-xl font-sans text-sm text-[#F4F0E5]/80">
                Rainfall patterns vary drastically from 4,000mm in the Western Ghats to less than 600mm in the rain shadow scarcity zone.
              </p>
            </div>
            <Link
              href="/location"
              className="flex items-center gap-2 rounded-lg border-2 border-[#E6A52E] bg-[#E6A52E] px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-[#123C32] shadow-[3px_3px_0px_#000] hover:bg-white"
            >
              <span>Select Your Zone</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredZones.map((zone) => (
              <div
                key={zone.name}
                className="rounded-lg border border-[#F4F0E5]/20 bg-black/25 p-5 backdrop-blur-xs transition hover:border-[#E6A52E]"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-base font-bold text-[#F4F0E5]">{zone.name}</h3>
                  <span className="font-mono text-xs font-bold text-[#E6A52E]">{zone.rainfall}</span>
                </div>
                <div className="mt-3 space-y-1.5 font-mono text-xs text-[#F4F0E5]/75">
                  <p>
                    <span className="text-[#F4F0E5]/50">Soil Profile:</span> {zone.soil}
                  </p>
                  <p>
                    <span className="text-[#F4F0E5]/50">Major Crops:</span> {zone.crops}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────────── CALL TO ACTION ────────────────────────── */}
      <section className="container-page py-16 text-center">
        <div className="rounded-2xl border-3 border-[#123C32] bg-white p-8 shadow-[8px_8px_0px_#123C32] sm:p-14">
          <div className="inline-flex items-center gap-1.5 rounded border border-[#123C32] bg-[#123C32] px-3 py-1 font-mono text-xs font-bold uppercase tracking-widest text-[#F4F0E5]">
            <Sparkles size={12} className="text-[#E6A52E]" />
            National Hackathon Evaluation Sandbox
          </div>
          <h2 className="mt-4 font-display text-3xl font-extrabold text-[#123C32] sm:text-4xl md:text-5xl">
            Start Exploring VarshaMitra Today
          </h2>
          <p className="mx-auto mt-3 max-w-xl font-sans text-sm text-[#252923]/75 sm:text-base">
            No signup barriers. Launch immediately into the farmer decision cockpit or the administrative district monitoring console.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/farmer/dashboard"
              className="flex items-center gap-2 rounded-lg border-2 border-[#123C32] bg-[#123C32] px-6 py-3.5 font-mono text-sm font-bold uppercase tracking-wider text-[#F4F0E5] shadow-[4px_4px_0px_#252923] transition hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[6px_6px_0px_#252923]"
            >
              <Sprout size={18} className="text-[#E6A52E]" />
              <span>Launch Farmer Dashboard</span>
            </Link>

            <Link
              href="/officer/dashboard"
              className="flex items-center gap-2 rounded-lg border-2 border-[#172B4D] bg-[#172B4D] px-6 py-3.5 font-mono text-sm font-bold uppercase tracking-wider text-[#F4F0E5] shadow-[4px_4px_0px_#252923] transition hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[6px_6px_0px_#252923]"
            >
              <ShieldCheck size={18} className="text-[#2878A5]" />
              <span>Launch Officer Console</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}