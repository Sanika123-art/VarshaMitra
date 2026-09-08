"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CloudRain, Sprout, ShieldCheck, Droplets, Thermometer, Wind } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { useAppState } from "@/hooks/useAppState";

export default function LoginPage() {
  const { t } = useTranslation();
  const { setRole, hydrated } = useAppState();
  const router = useRouter();
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");

  function enterAs(role: "farmer" | "officer") {
    setRole(role);
    router.push(role === "farmer" ? "/farmer/dashboard" : "/officer/dashboard");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Prototype only — no real authentication is performed.
    enterAs("farmer");
  }

  if (!hydrated) return null;

  return (
    <div className="mx-auto grid min-h-[calc(100vh-64px)] max-w-6xl grid-cols-1 lg:grid-cols-2">
      {/* ── Left: Atmospheric panel ──────────────────────────── */}
      <div className="relative hidden overflow-hidden bg-[var(--color-forest-dark)] p-10 text-white lg:flex lg:flex-col lg:justify-between">
        {/* Topographic background */}
        <div className="absolute inset-0 topo-dark opacity-60" aria-hidden />

        {/* Animated rain */}
        <svg className="absolute inset-0 h-full w-full" aria-hidden>
          {Array.from({ length: 20 }).map((_, i) => (
            <line
              key={i}
              x1={20 + i * 30}
              y1={-10}
              x2={12 + i * 30}
              y2={40}
              stroke="#9fd6c1"
              strokeWidth="0.8"
              opacity={0.12 + (i % 3) * 0.05}
            >
              <animate
                attributeName="y1"
                values={`${-20 - (i % 4) * 15};${50 - (i % 4) * 15}`}
                dur={`${2 + (i % 3) * 0.7}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="y2"
                values={`${30 - (i % 4) * 15};${100 - (i % 4) * 15}`}
                dur={`${2 + (i % 3) * 0.7}s`}
                repeatCount="indefinite"
              />
            </line>
          ))}
        </svg>

        {/* Brand */}
        <div className="relative flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
            <CloudRain size={16} />
          </span>
          <span className="font-display text-lg">VarshaMitra</span>
        </div>

        {/* Climate indicators */}
        <div className="relative flex flex-wrap gap-3">
          {[
            { icon: Droplets, label: "Onset", value: "78%" },
            { icon: Thermometer, label: "Avg temp", value: "28°C" },
            { icon: Wind, label: "Confidence", value: "Med" },
          ].map((metric) => (
            <div
              key={metric.label}
              className="rounded-xl bg-white/8 border border-white/10 px-3 py-2 backdrop-blur-sm"
            >
              <div className="flex items-center gap-1.5 text-white/40">
                <metric.icon size={12} />
                <span className="text-[10px] font-medium uppercase tracking-wider">{metric.label}</span>
              </div>
              <p className="mt-0.5 font-display text-lg text-white/80">{metric.value}</p>
            </div>
          ))}
        </div>

        {/* Tagline */}
        <div className="relative">
          <p className="font-display text-3xl leading-snug">
            {t("landing.heroTitleLine1")} {t("landing.heroTitleLine2")}
          </p>
          <p className="mt-4 max-w-sm text-sm text-white/60">{t("landing.heroSubtitle")}</p>
        </div>

        <p className="relative text-xs text-white/40">{t("footer.prototypeNotice")}</p>
      </div>

      {/* ── Right: Authentication ────────────────────────────── */}
      <div className="flex flex-col justify-center px-6 py-14 sm:px-12">
        <h1 className="font-display text-3xl text-[var(--color-ink)]">{t("login.title")}</h1>
        <p className="mt-2 text-sm text-[var(--color-ink)]/60">{t("login.subtitle")}</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="contact" className="block text-sm font-medium text-[var(--color-ink)]/75">
              {t("login.fieldContact")}
            </label>
            <input
              id="contact"
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--color-forest)] focus:shadow-[var(--shadow-sm)]"
              autoComplete="username"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[var(--color-ink)]/75">
              {t("login.fieldPassword")}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--color-forest)] focus:shadow-[var(--shadow-sm)]"
              autoComplete="current-password"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-[var(--color-ink)]/65">
            <input type="checkbox" className="h-4 w-4 rounded border-[var(--color-line)]" />
            {t("login.remember")}
          </label>
          <button
            type="submit"
            className="w-full rounded-full bg-[var(--color-forest)] py-3.5 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition-all hover:bg-[var(--color-forest-dark)] hover:shadow-[var(--shadow-md)]"
          >
            {t("login.submit")}
          </button>
        </form>

        <div className="my-7 flex items-center gap-3 text-xs text-[var(--color-ink)]/40">
          <span className="h-px flex-1 bg-[var(--color-line)]" />
          {t("login.or")}
          <span className="h-px flex-1 bg-[var(--color-line)]" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            onClick={() => enterAs("farmer")}
            className="group flex items-center justify-center gap-2.5 rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] px-4 py-3.5 text-sm font-semibold text-[var(--color-ink)] transition-all hover:border-[var(--color-forest)] hover:shadow-[var(--shadow-sm)]"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-forest)]/10 text-[var(--color-forest)] transition-transform group-hover:scale-110">
              <Sprout size={16} />
            </span>
            {t("login.demoFarmer")}
          </button>
          <button
            onClick={() => enterAs("officer")}
            className="group flex items-center justify-center gap-2.5 rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] px-4 py-3.5 text-sm font-semibold text-[var(--color-ink)] transition-all hover:border-[var(--color-sky)] hover:shadow-[var(--shadow-sm)]"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-sky)]/10 text-[var(--color-sky)] transition-transform group-hover:scale-110">
              <ShieldCheck size={16} />
            </span>
            {t("login.demoOfficer")}
          </button>
        </div>

        <p className="mt-7 text-xs text-[var(--color-ink)]/40">{t("login.disclaimer")}</p>
      </div>
    </div>
  );
}
