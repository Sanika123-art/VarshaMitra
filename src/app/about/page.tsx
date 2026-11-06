"use client";

import Link from "next/link";
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
  Sparkles,
} from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { usedCredits } from "@/data/media";

export default function AboutPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-4xl space-y-8 bg-[#F4F0E5] text-[#252923]">
      
      {/* ── Page Header ── */}
      <div className="border-b-2 border-[#123C32]/20 pb-5">
        <div className="flex items-center gap-2">
          <span className="rounded border border-[#123C32] bg-[#123C32] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#F4F0E5]">
            Engineering & Methodology
          </span>
          <span className="font-mono text-xs font-semibold text-[#123C32]">
            Smart India Hackathon 2024
          </span>
        </div>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-[#123C32] sm:text-3xl">
          {t("about.title")}
        </h1>
        <p className="mt-1 font-sans text-xs text-[#252923]/70 sm:text-sm">
          {t("about.problemBody")}
        </p>
      </div>

      {/* ── Problem & Purpose ── */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border-2 border-[#123C32] bg-white p-6 shadow-[4px_4px_0px_#123C32]">
          <div className="flex items-center gap-2 border-b-2 border-[#123C32]/15 pb-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-md border border-[#123C32] bg-[#123C32] text-[#E6A52E]">
              <HelpCircle size={16} />
            </span>
            <h2 className="font-display text-base font-bold text-[#123C32]">
              {t("about.problemTitle")}
            </h2>
          </div>
          <p className="mt-3 font-sans text-xs sm:text-sm leading-relaxed text-[#252923]/80">
            {t("about.problemBody")}
          </p>
        </div>

        <div className="rounded-xl border-2 border-[#123C32] bg-white p-6 shadow-[4px_4px_0px_#123C32]">
          <div className="flex items-center gap-2 border-b-2 border-[#123C32]/15 pb-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-md border border-[#172B4D] bg-[#172B4D] text-[#F4F0E5]">
              <Compass size={16} />
            </span>
            <h2 className="font-display text-base font-bold text-[#172B4D]">
              {t("about.whyTitle")}
            </h2>
          </div>
          <p className="mt-3 font-sans text-xs sm:text-sm leading-relaxed text-[#252923]/80">
            {t("about.whyBody")}
          </p>
        </div>
      </div>

      {/* ── 5-Step Architecture Pipeline ── */}
      <div className="rounded-xl border-2 border-[#123C32] bg-white p-6 shadow-[4px_4px_0px_#123C32]">
        <div className="border-b-2 border-[#123C32]/15 pb-4">
          <div className="flex items-center gap-2">
            <Radio size={18} className="text-[#123C32]" />
            <h2 className="font-display text-lg font-bold text-[#123C32]">
              {t("about.howTitle")}
            </h2>
          </div>
          <p className="font-sans text-xs text-[#252923]/70 mt-1">
            {t("about.howBody")}
          </p>
        </div>

        <div className="mt-6 flex flex-col items-center gap-0">
          {[
            {
              step: "01",
              icon: Database,
              label: "Observational & Satellite Inputs",
              desc: "IMD gridded rainfall, ECMWF ERA5-Land reanalysis, NOAA Sea Surface Temperatures (ENSO, IOD, MJO).",
            },
            {
              step: "02",
              icon: Radio,
              label: "Downscaling & Predictive Modeling",
              desc: "Deterministic and ensemble models providing calibrated 7-, 14-, and 30-day forecast horizons.",
            },
            {
              step: "03",
              icon: MapIcon,
              label: "Hyperlocal Risk Classification",
              desc: "Taluka-level spatial evaluation mapping dry-spell streaks, deluge hazards, and monsoon onset dates.",
            },
            {
              step: "04",
              icon: Sprout,
              label: "Crop Vulnerability Engine",
              desc: "Stage-aware agronomic models evaluating moisture stress during sowing, vegetative, flowering, and harvest.",
            },
            {
              step: "05",
              icon: CloudRain,
              label: "Decision-Support Advisory & Saarthi AI",
              desc: "Direct farm-gate advisories and multilingual conversational assistance grounded strictly in verified evidence.",
            },
          ].map((item, idx, arr) => {
            const Icon = item.icon;
            return (
              <div key={item.step} className="flex w-full flex-col items-center">
                <div className="flex w-full items-start gap-4 rounded-lg border-2 border-[#123C32]/20 bg-[#F4F0E5] p-4 transition hover:border-[#123C32]">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[#123C32] bg-[#123C32] text-[#E6A52E]">
                    <Icon size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-sm font-bold text-[#123C32]">
                        {item.label}
                      </h3>
                      <span className="font-mono text-xs font-black text-[#123C32]">
                        {item.step}
                      </span>
                    </div>
                    <p className="mt-1 font-sans text-xs leading-relaxed text-[#252923]/75">
                      {item.desc}
                    </p>
                  </div>
                </div>
                {idx < arr.length - 1 && (
                  <div className="my-1 flex h-4 w-px items-center justify-center bg-[#123C32]/30">
                    <ArrowDown size={11} className="text-[#123C32]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Photography Licensing Table ── */}
      <div className="rounded-xl border-2 border-[#123C32] bg-white p-6 shadow-[4px_4px_0px_#123C32]">
        <div className="border-b-2 border-[#123C32]/15 pb-4">
          <div className="flex items-center gap-2">
            <Camera size={18} className="text-[#123C32]" />
            <h2 className="font-display text-base font-bold text-[#123C32]">
              Photography Credits & Open Licensing
            </h2>
          </div>
          <p className="font-sans text-xs text-[#252923]/70 mt-1">
            All agricultural field specimens and contextual crops are sourced under Creative Commons CC-BY / CC0 licenses.
          </p>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-left font-sans text-xs">
            <thead>
              <tr className="border-b-2 border-[#123C32]/15 bg-[#F4F0E5] font-mono text-[10px] font-bold uppercase tracking-wider text-[#123C32]">
                <th className="p-2.5">Specimen / Title</th>
                <th className="p-2.5">Author</th>
                <th className="p-2.5">License</th>
                <th className="p-2.5 text-right">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#123C32]/10 font-mono text-[11px]">
              {usedCredits.map((c) => (
                <tr key={c.id} className="hover:bg-[#F4F0E5]/50">
                  <td className="p-2.5 font-sans font-semibold text-[#252923]">{c.title}</td>
                  <td className="p-2.5 text-[#252923]/70">{c.author}</td>
                  <td className="p-2.5">
                    <a
                      href={c.licenseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#123C32] underline"
                    >
                      {c.license}
                    </a>
                  </td>
                  <td className="p-2.5 text-right">
                    <a
                      href={c.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#123C32] hover:underline"
                    >
                      <span>Commons</span>
                      <ExternalLink size={10} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Evaluation Notice ── */}
      <div className="rounded-xl border-2 border-[#123C32] bg-[#123C32] p-6 text-[#F4F0E5] shadow-[4px_4px_0px_#252923]">
        <h3 className="font-display text-base font-bold text-[#E6A52E]">
          {t("about.prototypeTitle")}
        </h3>
        <p className="mt-2 font-sans text-xs sm:text-sm leading-relaxed text-[#F4F0E5]/80">
          {t("about.prototypeBody")}
        </p>
      </div>

    </div>
  );
}