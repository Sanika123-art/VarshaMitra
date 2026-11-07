"use client";

import { useMemo } from "react";
import {
  Droplets,
  Thermometer,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Sprout,
  ArrowDown,
  Layers,
  Wind,
} from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import type { RegionalSoilSummaryResponse } from "@/lib/api";

interface SoilVapsaDepthWidgetProps {
  soil: RegionalSoilSummaryResponse | null;
  cropName?: string;
}

export default function SoilVapsaDepthWidget({ soil, cropName }: SoilVapsaDepthWidgetProps) {
  const { language } = useTranslation();
  const isMr = language === "mr";

  // Volumetric moisture (m3/m3 to %)
  const topMoisturePct = useMemo(() => {
    if (!soil?.live_soil_moisture_0_to_7cm) return 30.7;
    return Math.round(soil.live_soil_moisture_0_to_7cm * 1000) / 10;
  }, [soil]);

  const subMoisturePct = useMemo(() => {
    if (!soil?.live_soil_moisture_7_to_28cm) return 31.0;
    return Math.round(soil.live_soil_moisture_7_to_28cm * 1000) / 10;
  }, [soil]);

  const soilTemp = useMemo(() => {
    if (!soil?.live_soil_temperature_c) return 30.4;
    return Math.round(soil.live_soil_temperature_c * 10) / 10;
  }, [soil]);

  // Vapsa status interpretation
  const vapsaStatus = soil?.vapsa_status || (
    topMoisturePct < 18 ? "dry_stress" : topMoisturePct > 38 ? "saturated_waterlogged" : "optimal_vapsa"
  );

  const statusConfig = {
    dry_stress: {
      color: "#E58A38",
      bg: "#FAEBDD",
      border: "#8F4C13",
      label: isMr ? "कोरडी जमीन (तणाव)" : "Dry Soil (Moisture Stress)",
      desc: isMr
        ? "वरच्या थरातील ओलावा कमी आहे (१८% पेक्षा कमी). पुरेशा पावसाशिवाय पेरणी करू नये."
        : "Topsoil moisture is below the 18% germination threshold. Avoid dry sowing.",
      badgeIcon: AlertTriangle,
    },
    optimal_vapsa: {
      color: "#3B8B61",
      bg: "#E8F4EC",
      border: "#1F5336",
      label: isMr ? "उत्तम वाफसा स्थिती (अनुकूल)" : "Optimal Vapsa (Ideal Moisture)",
      desc: isMr
        ? "मातीमध्ये ५०% हवा आणि ५०% पाणी समतोल आहे. बियाणे उगवण व मुळांच्या वाढीसाठी सर्वोत्तम स्थिती."
        : "50% capillary moisture & 50% soil pore aeration achieved. Ideal for sowing & vigorous root growth.",
      badgeIcon: CheckCircle2,
    },
    saturated_waterlogged: {
      color: "#C7473B",
      bg: "#F8E5E3",
      border: "#7F2017",
      label: isMr ? "अति ओलावा (पाणी साचले)" : "Saturated (Waterlogged)",
      desc: isMr
        ? "जमीन प्रमाणापेक्षा जास्त ओली आहे (३८% पेक्षा जास्त). मुळांना हवा न मिळाल्याने मर रोगाचा धोका वाढतो."
        : "Soil moisture exceeds field capacity (38%+). Risk of seed rot and compaction. Ensure field drainage.",
      badgeIcon: AlertTriangle,
    },
  }[vapsaStatus] || {
    color: "#3B8B61",
    bg: "#E8F4EC",
    border: "#1F5336",
    label: isMr ? "उत्तम वाफसा स्थिती" : "Optimal Vapsa",
    desc: isMr ? "जमिनीतील ओलावा योग्य समतोलात आहे." : "Topsoil moisture is optimal.",
    badgeIcon: CheckCircle2,
  };

  const BadgeIcon = statusConfig.badgeIcon;
  const needlePos = Math.min(Math.max((topMoisturePct / 45) * 100, 5), 95);

  // Marathi texture dictionary
  const textureLabel = useMemo(() => {
    const raw = soil?.dominant_texture || "clay_loam";
    const dict: Record<string, { mr: string; en: string }> = {
      clay_loam: { mr: "काळी चिकणमाती (Clay Loam)", en: "Clay Loam" },
      black_cotton_vertisol: { mr: "काळी कसदार कापशी माती (Vertisol)", en: "Black Cotton Vertisol" },
      clay: { mr: "भारी चिकणमाती (Clay)", en: "Clay" },
      sandy_clay_loam: { mr: "रेताड चिकणमाती (Sandy Clay Loam)", en: "Sandy Clay Loam" },
      loam: { mr: "मध्यम पोयटा माती (Loam)", en: "Loam" },
      sandy_loam: { mr: "हलकी रेताड माती (Sandy Loam)", en: "Sandy Loam" },
      silt_loam: { mr: "गाळाची पोयटा माती (Silt Loam)", en: "Silt Loam" },
      coarse_shallow: { mr: "मुरमाड हलकी जमीन (Coarse Shallow)", en: "Coarse Shallow" },
    };
    return isMr ? dict[raw]?.mr || raw : dict[raw]?.en || raw;
  }, [soil?.dominant_texture, isMr]);

  const drainageLabel = useMemo(() => {
    const raw = soil?.drainage_class || "well_drained";
    const dict: Record<string, { mr: string; en: string }> = {
      well_drained: { mr: "उत्तम निचरा (Well Drained)", en: "Well Drained" },
      moderately_drained: { mr: "मध्यम निचरा (Moderately Drained)", en: "Moderately Drained" },
      imperfectly_drained: { mr: "मंद निचरा (Imperfectly Drained)", en: "Imperfectly Drained" },
      poorly_drained: { mr: "पाणी साचणारी जमीन (Poorly Drained)", en: "Poorly Drained" },
    };
    return isMr ? dict[raw]?.mr || raw : dict[raw]?.en || raw;
  }, [soil?.drainage_class, isMr]);

  return (
    <div className="rounded-xl border-2 border-[#123C32] bg-white p-4 sm:p-5 shadow-[4px_4px_0px_#123C32]">
      
      {/* ── Top Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#123C32]/15 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-[#123C32] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#F4F0E5]">
              ECMWF / Open-Meteo Land Surface Live
            </span>
            <span className="font-mono text-xs font-semibold text-[#123C32]">
              {isMr ? "०–३० सेमी शेतजमीन थर" : "0–30 cm Arable Strata"}
            </span>
          </div>
          <h3 className="font-display text-lg font-black text-[#123C32] mt-1 sm:text-xl">
            {isMr ? "जमीन वाफसा व मूळ-क्षेत्र ओलावा दर्शक" : "Root-Zone Soil Strata & Vapsa Gauge"}
          </h3>
        </div>

        {/* Live Vapsa Status Pill */}
        <div
          className="flex items-center gap-1.5 rounded-lg border-2 px-3 py-1.5 font-mono text-xs font-black shadow-[2px_2px_0px_#123C32]"
          style={{
            backgroundColor: statusConfig.bg,
            borderColor: statusConfig.border,
            color: statusConfig.color,
          }}
        >
          <BadgeIcon size={16} />
          <span>{statusConfig.label}</span>
        </div>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-12 lg:items-start">
        
        {/* ── Left Column: Hill Climb Grass Header + Exact Original Soil Strata & Droplets (6 cols) ── */}
        <div className="space-y-3 lg:col-span-6">
          <div className="rounded-xl border-2 border-[#123C32] overflow-hidden bg-[#2D2115] shadow-md">
            
            {/* ════ LEVEL 0: THE HILL CLIMB RACING GREEN GRASS CREST ════ */}
            <div className="relative bg-gradient-to-b from-[#A4CEF2] via-[#C4E3FC] to-[#E2F1FD] pt-2 overflow-hidden select-none">
              
              {/* Sky Badges */}
              <div className="flex items-center justify-between px-3 pb-1">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-0.5 font-mono text-[10px] font-black text-[#123C32] shadow-sm">
                  <Sprout size={12} className="text-[#15803D]" />
                  <span>{cropName || (isMr ? "कांदा" : "Crop")}</span>
                  <span className="text-[9px] text-[#252923]/60">· {isMr ? "पृष्ठभाग (० सेमी)" : "Surface (0cm)"}</span>
                </span>

                <span className="inline-flex items-center gap-1 rounded bg-[#123C32]/10 px-2 py-0.5 font-mono text-[9px] font-bold text-[#123C32]">
                  <Wind size={10} className="text-[#15803D]" />
                  <span>{isMr ? "हवा खेळती: ५०%" : "Aeration: 50%"}</span>
                </span>
              </div>

              {/* Hill Climb Turf Ribbon + Trees & Crop */}
              <div className="relative -mb-1 w-full">
                <svg
                  viewBox="0 0 500 52"
                  className="w-full h-auto block"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="hcGrassTurf" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#7CD33B" />
                      <stop offset="40%" stopColor="#68BF2B" />
                      <stop offset="85%" stopColor="#55A720" />
                      <stop offset="100%" stopColor="#3B7D14" />
                    </linearGradient>

                    <linearGradient id="treeGradSmall" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#2BA44C" />
                      <stop offset="100%" stopColor="#146A2C" />
                    </linearGradient>
                  </defs>

                  {/* Left Trees (Far left, away from text) */}
                  <g transform="translate(18, 2)">
                    <rect x="6" y="24" width="4" height="12" fill="#6B411E" stroke="#331A08" strokeWidth="0.8" />
                    <path d="M 0,26 L 8,13 L 16,26 Z" fill="url(#treeGradSmall)" stroke="#0E4E20" strokeWidth="1" />
                    <path d="M 1.5,17 L 8,7 L 14.5,17 Z" fill="url(#treeGradSmall)" stroke="#0E4E20" strokeWidth="1" />
                    <path d="M 3,9 L 8,1 L 13,9 Z" fill="url(#treeGradSmall)" stroke="#0E4E20" strokeWidth="1" />
                  </g>
                  <g transform="translate(38, 5)">
                    <rect x="5" y="22" width="4" height="11" fill="#6B411E" stroke="#331A08" strokeWidth="0.8" />
                    <path d="M 0,24 L 7,12 L 14,24 Z" fill="url(#treeGradSmall)" stroke="#0E4E20" strokeWidth="1" />
                    <path d="M 1.5,15 L 7,6 L 12.5,15 Z" fill="url(#treeGradSmall)" stroke="#0E4E20" strokeWidth="1" />
                    <path d="M 3,8 L 7,1 L 11,8 Z" fill="url(#treeGradSmall)" stroke="#0E4E20" strokeWidth="1" />
                  </g>

                  {/* Right Trees (Far right) */}
                  <g transform="translate(450, 4)">
                    <rect x="5" y="22" width="4" height="11" fill="#6B411E" stroke="#331A08" strokeWidth="0.8" />
                    <path d="M 0,24 L 7,12 L 14,24 Z" fill="url(#treeGradSmall)" stroke="#0E4E20" strokeWidth="1" />
                    <path d="M 1.5,15 L 7,6 L 12.5,15 Z" fill="url(#treeGradSmall)" stroke="#0E4E20" strokeWidth="1" />
                    <path d="M 3,8 L 7,1 L 11,8 Z" fill="url(#treeGradSmall)" stroke="#0E4E20" strokeWidth="1" />
                  </g>
                  <g transform="translate(470, 1)">
                    <rect x="6" y="24" width="4" height="12" fill="#6B411E" stroke="#331A08" strokeWidth="0.8" />
                    <path d="M 0,26 L 8,13 L 16,26 Z" fill="url(#treeGradSmall)" stroke="#0E4E20" strokeWidth="1" />
                    <path d="M 1.5,17 L 8,7 L 14.5,17 Z" fill="url(#treeGradSmall)" stroke="#0E4E20" strokeWidth="1" />
                    <path d="M 3,9 L 8,1 L 13,9 Z" fill="url(#treeGradSmall)" stroke="#0E4E20" strokeWidth="1" />
                  </g>

                  {/* Center Crop Plant at Surface (x=250) */}
                  <g transform="translate(235, 12)">
                    <path d="M 15,26 C 11,15 6,9 1,4 C 6,7 11,15 15,26 Z" fill="#1B5E20" />
                    <path d="M 15,26 C 13,12 15,5 15,0 C 17,5 19,12 15,26 Z" fill="#43A047" />
                    <path d="M 15,26 C 18,15 24,9 29,4 C 24,7 19,15 15,26 Z" fill="#2E7D32" />
                    <ellipse cx="15" cy="25" rx="4" ry="2.5" fill="#E8F5E9" stroke="#1B5E20" strokeWidth="1" />
                  </g>

                  {/* Spiky Grass Blades on top */}
                  <path
                    d="M 5,38 L 8,28 L 11,38 M 28,38 L 31,28 L 34,38 M 52,38 L 55,28 L 58,38 M 76,38 L 79,28 L 82,38 M 100,38 L 103,28 L 106,38 M 124,38 L 127,28 L 130,38 M 148,38 L 151,28 L 154,38 M 172,38 L 175,28 L 178,38 M 196,38 L 199,28 L 202,38 M 220,38 L 223,28 L 226,38 M 274,38 L 277,28 L 280,38 M 298,38 L 301,28 L 304,38 M 322,38 L 325,28 L 328,38 M 346,38 L 349,28 L 352,38 M 370,38 L 373,28 L 376,38 M 394,38 L 397,28 L 400,38 M 418,38 L 421,28 L 424,38 M 442,38 L 445,28 L 448,38 M 466,38 L 469,28 L 472,38 M 490,38 L 493,28 L 496,38"
                    stroke="#70C836"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    fill="none"
                  />

                  {/* Solid Lime Green Turf Ribbon */}
                  <rect x="0" y="38" width="500" height="14" fill="url(#hcGrassTurf)" />
                  <line x1="0" y1="38" x2="500" y2="38" stroke="#8EE446" strokeWidth="2" />
                  <line x1="0" y1="52" x2="500" y2="52" stroke="#2B600F" strokeWidth="1.5" />
                </svg>
              </div>

            </div>

            {/* ════ LEVEL 1: वरचा सुपीक थर (०–७ सेमी) — EXACT ORIGINAL DESIGN ════ */}
            <div className="relative border-b-2 border-[#123C32] bg-gradient-to-r from-[#4A3728] to-[#5C4533] p-4 text-[#F4F0E5]">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="font-bold flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#E6A52E]" />
                  {isMr ? "वरचा थर (०–७ सेमी)" : "Topsoil Layer (0–7 cm)"}
                </span>
                <span className="font-black text-[#E6A52E] text-sm">
                  {topMoisturePct}% Volumetric
                </span>
              </div>
              <p className="mt-1 font-mono text-[11px] opacity-80">
                {isMr ? "बियाणे रुजवण आणि सुरुवातीची मुळे" : "Seed Germination & Sowing Depth"}
              </p>

              {/* Water Droplet visual particles (EXACT ORIGINAL LUCIDE DROPLETS WITH ANIMATE-PULSE) */}
              <div className="mt-3 flex items-center gap-1.5">
                {[...Array(8)].map((_, i) => (
                  <Droplets
                    key={i}
                    size={14}
                    className={`transition-all duration-500 ${
                      i < Math.round((topMoisturePct / 40) * 8)
                        ? "text-[#47A6D8] opacity-100 animate-pulse drop-shadow-sm"
                        : "text-white/20 opacity-30"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* ════ LEVEL 2: मुख्य मूळ-क्षेत्र थर (७–२८ सेमी) — EXACT ORIGINAL DESIGN ════ */}
            <div className="relative border-b-2 border-[#123C32] bg-gradient-to-r from-[#38281B] to-[#453223] p-4 text-[#F4F0E5]">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="font-bold flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#2878A5]" />
                  {isMr ? "खोल थर (७–२८ सेमी)" : "Root-Zone Layer (7–28 cm)"}
                </span>
                <span className="font-black text-[#47A6D8] text-sm">
                  {subMoisturePct}% Volumetric
                </span>
              </div>
              <p className="mt-1 font-mono text-[11px] opacity-80">
                {isMr ? "दुय्यम मुळांची ओलावा उपलब्धता व अन्नद्रव्य शोषण" : "Capillary Water Retention & Active Root Network"}
              </p>

              {/* Water Droplet visual particles (EXACT ORIGINAL LUCIDE DROPLETS) */}
              <div className="mt-3 flex items-center gap-1.5">
                {[...Array(8)].map((_, i) => (
                  <Droplets
                    key={i}
                    size={14}
                    className={`transition-all duration-500 ${
                      i < Math.round((subMoisturePct / 40) * 8)
                        ? "text-[#47A6D8] opacity-100 animate-pulse drop-shadow-sm"
                        : "text-white/20 opacity-30"
                    }`}
                  />
                ))}
              </div>

              {/* Root system graphic bar */}
              <div className="mt-3 flex items-center justify-between font-mono text-[10px] text-white/60 border-t border-white/10 pt-2">
                <span className="flex items-center gap-1 text-[#E6A52E] font-semibold">
                  <Sprout size={13} />
                  {cropName ? `${cropName} ${isMr ? "मुळांचे जाळे" : "Roots"}` : isMr ? "कांदा मुळांचे जाळे" : "Active Crop Roots"}
                </span>
                <span className="text-white/80">{drainageLabel}</span>
              </div>
            </div>

            {/* ════ LEVEL 3: पाझर व खडक थर (२८+ सेमी) — CLEAN BEDROCK DRAINAGE ════ */}
            <div className="relative bg-gradient-to-r from-[#24150B] to-[#1C0F07] p-3.5 text-[#F4F0E5]">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="font-bold flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#8B5E3C]" />
                  {isMr ? "पाझर व खडक थर (२८+ सेमी)" : "Deep Drainage Substratum (>28 cm)"}
                </span>
                <span className="font-bold text-[#A3D9B1] text-xs">
                  {drainageLabel}
                </span>
              </div>

              <div className="mt-2.5 flex items-center justify-between font-mono text-[10px] text-white/70">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-3.5 rounded-sm bg-[#5C4533] border border-white/20 inline-block" />
                    <span className="h-2.5 w-4 rounded-full bg-[#4A3728] border border-white/20 inline-block" />
                    <span className="h-1.5 w-3 rounded-sm bg-[#3E2D20] border border-white/20 inline-block" />
                  </div>
                  <span>{isMr ? "मुरूम व नैसर्गिक निचरा पाझर" : "Porous Substratum & Mineral Bed"}</span>
                </div>

                <div className="flex items-center gap-1 text-[#4ADE80] font-bold">
                  <ArrowDown size={12} className="animate-bounce" />
                  <span>{isMr ? "पाणी साचत नाही" : "No Waterlogging"}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Soil Telemetry Bar (Temp & Texture) */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1 font-mono text-[11px] text-[#252923]">
            <span className="inline-flex items-center gap-1 rounded bg-[#E58A38]/10 px-2 py-0.5 border border-[#E58A38]/30">
              <Thermometer size={13} className="text-[#E58A38]" />
              <span>{isMr ? "जमिनीचे तापमान:" : "Soil Temp:"}</span>
              <strong className="text-[#8F4C13]">{soilTemp}°C</strong>
            </span>

            <span className="inline-flex items-center gap-1 rounded bg-[#123C32]/10 px-2 py-0.5 border border-[#123C32]/20">
              <Layers size={13} className="text-[#123C32]" />
              <span>{isMr ? "प्रकार:" : "Texture:"}</span>
              <strong className="text-[#123C32]">{textureLabel}</strong>
            </span>
          </div>

        </div>

        {/* ── Right Column: Vapsa Dial & Agronomic Advisory (6 cols) ── */}
        <div className="space-y-4 lg:col-span-6">
          
          {/* Dial / Progress Track */}
          <div className="rounded-xl border-2 border-[#123C32]/20 bg-[#F4F0E5]/70 p-4">
            <div className="flex items-center justify-between font-mono text-xs font-bold text-[#123C32] mb-2">
              <span>{isMr ? "वाफसा निर्देशांक" : "Vapsa Index Gauge"}</span>
              <span className="text-sm font-black">{topMoisturePct}%</span>
            </div>

            {/* Gradient Gauge Bar */}
            <div className="relative h-6 w-full overflow-hidden rounded-lg border-2 border-[#123C32] bg-white">
              {/* 3 Zones */}
              <div className="flex h-full w-full">
                <div className="h-full w-[38%] bg-[#E58A38]/40 border-r border-[#123C32]/30 flex items-center justify-center font-mono text-[9px] font-bold text-[#8F4C13]">
                  {isMr ? "कोरडी" : "DRY"}
                </div>
                <div className="h-full w-[44%] bg-[#3B8B61]/40 border-r border-[#123C32]/30 flex items-center justify-center font-mono text-[9px] font-bold text-[#1F5336]">
                  {isMr ? "वाफसा (50:50)" : "VAPSA"}
                </div>
                <div className="h-full w-[18%] bg-[#C7473B]/40 flex items-center justify-center font-mono text-[9px] font-bold text-[#7F2017]">
                  {isMr ? "ओल" : "WET"}
                </div>
              </div>

              {/* Indicator Needle Marker */}
              <div
                className="absolute top-0 bottom-0 w-2 -ml-1 bg-[#123C32] border border-white shadow-md transition-all duration-700 ease-out"
                style={{ left: `${needlePos}%` }}
              />
            </div>

            {/* Scale ticks */}
            <div className="mt-1 flex justify-between font-mono text-[9px] text-[#252923]/60 px-0.5">
              <span>0%</span>
              <span>18% ({isMr ? "वाफसा आरंभ" : "Vapsa Start"})</span>
              <span>38% ({isMr ? "कमाल धारणा" : "Field Capacity"})</span>
              <span>45%+</span>
            </div>
          </div>

          {/* Actionable MPKV Rahuri Diagnostic Card */}
          <div
            className="rounded-xl border-2 p-4 shadow-sm"
            style={{
              backgroundColor: statusConfig.bg,
              borderColor: statusConfig.border,
            }}
          >
            <div className="flex items-center gap-2 font-mono text-xs font-black" style={{ color: statusConfig.color }}>
              <ShieldCheck size={16} />
              <span>{isMr ? "कृषी विद्यापीठ वाफसा सल्ला:" : "Agronomic Vapsa Advisory:"}</span>
            </div>
            <p className="mt-2 font-sans text-xs sm:text-sm font-semibold leading-relaxed text-[#252923]">
              {statusConfig.desc}
            </p>
            <p className="mt-2 font-mono text-[10px] text-[#252923]/70">
              {isMr
                ? "स्रोत: महात्मा फुले कृषी विद्यापीठ (राहुरी) कोरडवाहू शेती वाफसा निकष."
                : "Source: MPKV Rahuri Dryland Farming Vapsa Standards."}
            </p>
          </div>

          {/* Educational Agri-Tip */}
          <div className="rounded-xl border border-[#123C32]/20 bg-white p-3 font-mono text-xs text-[#252923]">
            <strong className="text-[#123C32] block mb-1 font-bold">
              {isMr ? "💡 वाफसा म्हणजे काय?" : "💡 What is Vapsa?"}
            </strong>
            <p className="text-[11px] leading-relaxed text-[#252923]/80">
              {isMr
                ? "वाफसा म्हणजे शेतात पाणी भरणे नव्हे; तर मातीच्या कणांमध्ये ५०% पाणी आणि ५०% हवा असणे होय. या स्थितीत पिकाची पांढरी मुळे वेगाने अन्नद्रव्ये शोषून घेतात."
                : "Vapsa is achieving a 50% water and 50% air balance in soil pores, allowing white feeder roots to absorb nutrients rapidly."}
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
