"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sprout, ShieldCheck, ArrowRight, CloudRain, Sparkles, MapPin, Compass, ShieldAlert, Cpu } from "lucide-react";
import dynamic from "next/dynamic";
import { useTranslation } from "@/i18n/LanguageContext";
import { useAppState } from "@/hooks/useAppState";

// Dynamically import 3D Canvas with ssr: false for high-performance client rendering
const MonsoonLandscapeCanvas = dynamic(
  () => import("@/components/3d/MonsoonLandscapeCanvas"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#0c251f] text-[#E6A52E]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E6A52E] border-t-transparent" />
          <span className="font-mono text-xs uppercase tracking-widest text-[#F4F0E5]/70">
            Rendering Landscape...
          </span>
        </div>
      </div>
    ),
  }
);

export default function LoginPage() {
  const { t } = useTranslation();
  const { setRole, hydrated } = useAppState();
  const router = useRouter();
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<"farmer" | "officer">("farmer");

  function enterAs(role: "farmer" | "officer") {
    setRole(role);
    router.push(role === "farmer" ? "/farmer/dashboard" : "/officer/dashboard");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    enterAs(selectedRole);
  }

  if (!hydrated) return null;

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#F4F0E5] py-8 sm:py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Top Header Tag */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#123C32]/20 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded border border-[#123C32] bg-[#123C32] text-[#E6A52E]">
              <CloudRain size={16} />
            </span>
            <span className="font-mono text-xs font-bold tracking-widest uppercase text-[#123C32]">
              VarshaMitra · Agricultural Intelligence Portal
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs text-[#252923]/70">
            <MapPin size={13} className="text-[#123C32]" />
            <span>MAHARASHTRA REGIONAL DESK · 19.7515° N, 75.7139° E</span>
          </div>
        </div>

        {/* Main 2-Column Split Container */}
        <div className="grid overflow-hidden rounded-xl border-3 border-[#123C32] bg-[#F4F0E5] shadow-[8px_8px_0px_#123C32] lg:grid-cols-12">
          
          {/* Left Column: Immersive 3D Canvas + Monsoon Atmosphere (7 cols on large screens) */}
          <div className="relative min-h-[440px] overflow-hidden bg-[#0c251f] text-[#F4F0E5] lg:col-span-7 lg:min-h-[640px]">
            {/* 3D WebGL Canvas */}
            <div className="absolute inset-0">
              <MonsoonLandscapeCanvas className="h-full w-full" />
            </div>

            {/* Subtle Gradient Overlays for Readability */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0c251f]/95 via-transparent to-[#0c251f]/60" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(230,165,46,0.15),transparent_60%)]" />

            {/* Left Column Content Layer */}
            <div className="relative z-10 flex h-full flex-col justify-between p-6 sm:p-10">
              {/* Header Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded border border-[#E6A52E] bg-[#E6A52E]/10 px-2.5 py-1 font-mono text-xs font-bold uppercase tracking-wider text-[#E6A52E] backdrop-blur-md">
                  <Sparkles size={12} />
                  Live 3D Landscape Model
                </span>
                <span className="inline-flex items-center gap-1.5 rounded border border-[#2878A5]/60 bg-[#172B4D]/60 px-2.5 py-1 font-mono text-xs text-[#F4F0E5]/90 backdrop-blur-md">
                  <Compass size={12} className="text-[#2878A5]" />
                  IMD · ECMWF · ERA5 Hyperlocal Ensemble
                </span>
              </div>

              {/* Central Cinematic Typography */}
              <div className="my-auto py-8">
                <div className="inline-block rounded bg-[#123C32]/80 px-2.5 py-1 font-mono text-xs font-bold uppercase tracking-widest text-[#E6A52E] backdrop-blur-sm">
                  Smart Decision Support
                </div>
                <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight tracking-tight text-[#F4F0E5] sm:text-4xl md:text-5xl">
                  Precision monsoon <br />
                  intelligence for <br />
                  <span className="text-[#E6A52E] underline decoration-[#E6A52E]/50 underline-offset-4">
                    every farm acre.
                  </span>
                </h1>
                <p className="mt-4 max-w-lg font-sans text-sm leading-relaxed text-white/90 sm:text-base">
                  Real-time soil moisture profiles, dry-spell risk radar, and phenology-matched sowing recommendations tailored to Maharashtra&apos;s agro-climatic zones.
                </p>

                {/* Telemetry Strip */}
                <div className="mt-6 grid grid-cols-3 gap-3 border-t border-white/20 pt-4">
                  <div className="rounded-lg border border-white/20 bg-black/40 p-2.5 backdrop-blur-xs">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-[#E6A52E] font-bold">Grid Resolution</p>
                    <p className="mt-0.5 font-mono text-sm font-bold text-white">Hyperlocal 0.05°</p>
                  </div>
                  <div className="rounded-lg border border-white/20 bg-black/40 p-2.5 backdrop-blur-xs">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-[#E6A52E] font-bold">Districts Covered</p>
                    <p className="mt-0.5 font-mono text-sm font-bold text-white">36 Maharashtra</p>
                  </div>
                  <div className="rounded-lg border border-white/20 bg-black/40 p-2.5 backdrop-blur-xs">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-[#E6A52E] font-bold">Active Crops</p>
                    <p className="mt-0.5 font-mono text-sm font-bold text-[#3B8B61]">24 Field Crops</p>
                  </div>
                </div>
              </div>

              {/* Bottom Interactive Hint */}
              <div className="flex items-center justify-between text-xs text-white/80">
                <span className="font-mono">Move cursor to navigate 3D cloud & terrain layers</span>
                <span className="font-mono text-[#E6A52E] font-bold">● Real-time Simulation</span>
              </div>
            </div>
          </div>

          {/* Right Column: Refined Neo-Brutalist Authentication Card (5 cols) */}
          <div className="flex flex-col justify-between p-6 sm:p-10 lg:col-span-5 bg-[#F4F0E5]">
            <div>
              {/* Header Title */}
              <div className="border-b-2 border-[#123C32]/20 pb-5">
                <div className="flex items-center justify-between">
                  <span className="inline-block rounded-none border border-[#123C32] bg-[#123C32] px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider text-[#F4F0E5]">
                    Access Portal
                  </span>
                  <span className="font-mono text-xs font-semibold text-[#123C32]">
                    v0.9.0-DEMO
                  </span>
                </div>
                <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-[#252923] sm:text-3xl">
                  {t("login.title")}
                </h2>
                <p className="mt-1 font-sans text-xs sm:text-sm text-[#252923]/70">
                  Select your operational mode or proceed directly with one-click demo credentials.
                </p>
              </div>

              {/* Instant Role Selectors */}
              <div className="mt-6 space-y-3">
                <p className="font-mono text-xs font-bold uppercase tracking-wider text-[#123C32]">
                  Select Demonstration Role:
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  {/* Farmer Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole("farmer");
                      enterAs("farmer");
                    }}
                    className={`group relative flex flex-col justify-between rounded-lg border-2 p-4 text-left transition-all duration-150 ${
                      selectedRole === "farmer"
                        ? "border-[#123C32] bg-[#123C32]/10 shadow-[4px_4px_0px_#123C32]"
                        : "border-[#123C32]/30 bg-white/70 hover:border-[#123C32] hover:bg-white hover:shadow-[3px_3px_0px_#123C32]"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="flex h-9 w-9 items-center justify-center rounded-md border border-[#123C32] bg-[#123C32] text-[#F4F0E5] shadow-xs">
                          <Sprout size={18} />
                        </span>
                        <span className="rounded bg-[#123C32]/15 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#123C32]">
                          Primary
                        </span>
                      </div>
                      <h3 className="mt-3 font-display text-base font-bold text-[#252923]">
                        {t("login.demoFarmer")}
                      </h3>
                      <p className="mt-1 font-sans text-xs text-[#252923]/75 line-clamp-2">
                        {t("login.farmerRoleDesc")}
                      </p>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-[#123C32]/15 pt-2 text-xs font-bold text-[#123C32]">
                      <span>Enter as Farmer</span>
                      <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                    </div>
                  </button>

                  {/* Officer Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole("officer");
                      enterAs("officer");
                    }}
                    className={`group relative flex flex-col justify-between rounded-lg border-2 p-4 text-left transition-all duration-150 ${
                      selectedRole === "officer"
                        ? "border-[#172B4D] bg-[#172B4D]/10 shadow-[4px_4px_0px_#172B4D]"
                        : "border-[#172B4D]/30 bg-white/70 hover:border-[#172B4D] hover:bg-white hover:shadow-[3px_3px_0px_#172B4D]"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="flex h-9 w-9 items-center justify-center rounded-md border border-[#172B4D] bg-[#172B4D] text-[#F4F0E5] shadow-xs">
                          <ShieldCheck size={18} />
                        </span>
                        <span className="rounded bg-[#172B4D]/15 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#172B4D]">
                          Admin
                        </span>
                      </div>
                      <h3 className="mt-3 font-display text-base font-bold text-[#252923]">
                        {t("login.demoOfficer")}
                      </h3>
                      <p className="mt-1 font-sans text-xs text-[#252923]/75 line-clamp-2">
                        {t("login.officerRoleDesc")}
                      </p>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-[#172B4D]/15 pt-2 text-xs font-bold text-[#172B4D]">
                      <span>Enter as Officer</span>
                      <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                    </div>
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="my-6 flex items-center gap-3">
                <div className="h-[2px] flex-1 bg-[#123C32]/15" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#252923]/60">
                  {t("login.orStandardLogin")}
                </span>
                <div className="h-[2px] flex-1 bg-[#123C32]/15" />
              </div>

              {/* Standard Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="contact"
                    className="flex items-center justify-between font-mono text-xs font-bold uppercase tracking-wider text-[#252923]"
                  >
                    <span>{t("login.fieldContact")}</span>
                    <span className="text-[10px] font-normal text-[#252923]/60">Phone or Gov ID</span>
                  </label>
                  <input
                    id="contact"
                    type="text"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="e.g. 9876543210 / officer@agri.gov.in"
                    className="mt-1.5 w-full rounded-md border-2 border-[#123C32]/30 bg-white px-3.5 py-2.5 font-sans text-sm text-[#252923] shadow-xs outline-none transition focus:border-[#123C32] focus:shadow-[2px_2px_0px_#123C32]"
                    autoComplete="username"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="flex items-center justify-between font-mono text-xs font-bold uppercase tracking-wider text-[#252923]"
                  >
                    <span>{t("login.fieldPassword")}</span>
                    <span className="text-[10px] font-normal text-[#252923]/60">Demo: Any Password</span>
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="mt-1.5 w-full rounded-md border-2 border-[#123C32]/30 bg-white px-3.5 py-2.5 font-sans text-sm text-[#252923] shadow-xs outline-none transition focus:border-[#123C32] focus:shadow-[2px_2px_0px_#123C32]"
                    autoComplete="current-password"
                  />
                </div>

                <button
                  type="submit"
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-md border-2 border-[#123C32] bg-[#123C32] px-4 py-3 font-mono text-sm font-bold uppercase tracking-wider text-[#F4F0E5] shadow-[4px_4px_0px_#252923] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_#252923] active:translate-x-[0px] active:translate-y-[0px] active:shadow-[2px_2px_0px_#252923]"
                >
                  <span>{t("login.submit")}</span>
                  <ArrowRight size={16} />
                </button>
              </form>
            </div>

            {/* Bottom Institutional Disclaimer */}
            <div className="mt-8 border-t border-[#123C32]/15 pt-4 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs text-[#252923]/70">
                <ShieldAlert size={14} className="text-[#E6A52E]" />
                <span>Sandbox Mode: Instant credentials preloaded for jury evaluation</span>
              </div>
              <p className="mt-1 font-mono text-[10px] text-[#252923]/50">
                VarshaMitra · Smart India Hackathon Demonstration Release
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}