"use client";

import Link from "next/link";
import {
  MapPin,
  Layers,
  Sprout,
  Sparkles,
  Droplets,
  RefreshCw,
} from "lucide-react";
import type { FarmerProfile } from "@/hooks/useAppState";
import type { SelectedLocation } from "@/types";

interface FarmerIdentityHeaderProps {
  farmerProfile?: FarmerProfile | null;
  location: SelectedLocation;
  cropName: string;
  stageName: string;
  isMr: boolean;
}

export default function FarmerIdentityHeader({
  farmerProfile,
  location,
  cropName,
  stageName,
  isMr,
}: FarmerIdentityHeaderProps) {
  const farmerName = farmerProfile?.farmerName || (isMr ? "शेतकरी मित्र" : "Farmer friend");
  const acres = farmerProfile?.landAcres;
  const isIrrigated = farmerProfile?.irrigationType === "irrigated";

  // Location display
  const village =
    (isMr ? farmerProfile?.villageNameMr : farmerProfile?.villageName) ||
    farmerProfile?.villageName ||
    location.taluka ||
    location.blockName;
  const taluka = (isMr ? farmerProfile?.talukaNameMr : farmerProfile?.talukaName) || location.blockName;
  const district = (isMr ? farmerProfile?.districtNameMr : farmerProfile?.districtName) || location.districtName;

  return (
    <div className="relative overflow-hidden rounded-2xl border-3 border-[#123C32] bg-gradient-to-br from-[#123C32] via-[#0d2e26] to-[#081f19] p-5 sm:p-6 text-[#F4F0E5] shadow-[6px_6px_0px_#123C32]">
      
      {/* Background Subtle Watermark */}
      <div className="pointer-events-none absolute -right-6 -bottom-6 opacity-10 text-[#E6A52E]">
        <Sprout size={160} />
      </div>

      <div className="relative z-10 flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
        
        {/* Left Column: Farmer Persona & Details */}
        <div className="space-y-3">
          
          {/* Top Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#3B8B61] bg-[#3B8B61]/30 px-3 py-1 text-sm font-bold text-[#D9F99D]">
              <Sprout size={12} />
              {isMr ? "नमस्कार शेतकरी मित्रा!" : "Hello, farmer friend!"}
            </span>

            {farmerProfile?.gatNumber && (
              <span className="rounded border border-[#F4F0E5]/20 bg-white/5 px-2 py-1 text-xs text-[#F4F0E5]/80">
                {isMr ? "गट क्रमांक: " : "Farm number: "}
                <strong className="text-white">{farmerProfile.gatNumber}</strong>
              </span>
            )}
          </div>

          {/* Farmer Full Name & Location Header */}
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {farmerName}
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-2 font-mono text-xs text-[#F4F0E5]/80">
              <span className="flex items-center gap-1 text-[#E6A52E]">
                <MapPin size={13} />
                <strong className="text-white">{village}</strong>
              </span>
              <span>·</span>
              <span>
                {isMr ? "तालुका: " : "Taluka: "}
                <strong className="text-white">{taluka}</strong>
              </span>
              <span>·</span>
              <span>
                {isMr ? "जिल्हा: " : "District: "}
                <strong className="text-white">{district}</strong>
              </span>
            </p>
          </div>

          {/* Farm Land & Crop Quick Tag */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            {farmerProfile?.irrigationType && (
              <div className="flex items-center gap-1.5 rounded-lg border border-[#F4F0E5]/20 bg-white/10 px-2.5 py-1 text-xs">
                <Droplets size={12} className={isIrrigated ? "text-[#38BDF8]" : "text-[#E6A52E]"} />
                <span>
                  {isMr
                    ? isIrrigated ? "बागायती शेती" : "पावसावरची शेती"
                    : isIrrigated ? "Irrigated Farm" : "Rainfed Farm"}
                </span>
              </div>
            )}
            {acres !== undefined && (
              <div className="flex items-center gap-1.5 rounded-lg border border-[#F4F0E5]/20 bg-white/10 px-2.5 py-1 text-xs">
                <span>{isMr ? "जमीन:" : "Land:"} {acres} {isMr ? "एकर" : "acres"}</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 rounded-lg border border-[#E6A52E]/40 bg-[#E6A52E]/15 px-2.5 py-1 text-xs text-[#E6A52E]">
              <Sprout size={13} />
              <span className="font-bold text-white">{cropName}</span>
              <span className="text-white/70">({stageName})</span>
            </div>
          </div>

        </div>

        {/* Right Column: Key Navigation Controls */}
        <div className="flex flex-wrap items-center gap-2.5 lg:flex-col lg:items-end">
          
          <Link
            href="/farmer/crop"
            className="flex items-center gap-1.5 rounded-lg border-2 border-[#E6A52E] bg-[#E6A52E] px-3.5 py-2 font-mono text-xs font-bold uppercase tracking-wider text-[#123C32] shadow-[3px_3px_0px_#081f19] transition hover:bg-[#F4F0E5] hover:border-white"
          >
            <RefreshCw size={13} />
            <span>{isMr ? "सक्रिय पीक बदला" : "Change Active Crop"}</span>
          </Link>

          <Link
            href="/farmer/saarthi"
            className="flex items-center gap-1.5 rounded-lg border-2 border-[#F4F0E5]/40 bg-white/10 px-3.5 py-2 font-mono text-xs font-bold uppercase tracking-wider text-[#F4F0E5] shadow-[3px_3px_0px_#081f19] transition hover:bg-white/20"
          >
            <Sparkles size={13} className="text-[#E6A52E]" />
            <span>{isMr ? "सारथी AI सल्लागार" : "Ask Saarthi AI"}</span>
          </Link>

          <Link
            href="/farmer/risk-map"
            className="flex items-center gap-1.5 rounded-lg border-2 border-[#F4F0E5]/20 bg-transparent px-3 py-1.5 font-mono text-[11px] text-[#F4F0E5]/80 transition hover:bg-white/10"
          >
            <Layers size={12} className="text-[#38BDF8]" />
            <span>{isMr ? "तालुका नकाशा पहा" : "Hyperlocal Risk Map"}</span>
          </Link>

        </div>

      </div>

    </div>
  );
}
