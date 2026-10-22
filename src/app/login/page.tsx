"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sprout, ShieldCheck, ArrowRight, CloudRain } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { useAppState } from "@/hooks/useAppState";
import { photos } from "@/data/media";
import {
  Button,
  Photo,
} from "@/components/ui";

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
    enterAs("farmer");
  }

  if (!hydrated) return null;

  return (
    <div className="container-page py-10 sm:py-16">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-xl border border-line bg-surface shadow-sm lg:grid-cols-12">
        {/* Left Column: Context & Imagery (5 cols) */}
        <div className="relative flex flex-col justify-between bg-forest-dark p-8 text-white lg:col-span-5">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-white/15">
                <CloudRain size={20} />
              </span>
              <span className="font-serif text-xl font-bold tracking-tight">VarshaMitra</span>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/70">
                {t("login.demoPlatformBadge")}
              </p>
              <h2 className="mt-2 font-serif text-2xl font-bold leading-snug">
                {t("landing.heroTitleLine1")} {t("landing.heroTitleLine2")}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/80">
                {t("login.demoPlatformDesc")}
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <div className="overflow-hidden rounded-lg border border-white/20">
              <Photo
                src={photos.farmerSowing.src}
                alt={t("media.farmerSowing")}
                sizes="380px"
                className="aspect-[16/9] w-full"
              />
              <div className="bg-black/40 p-2.5 text-[11px] text-white/75 backdrop-blur-xs">
                {t("media.farmerSowing")} · Maharashtra
              </div>
            </div>

            <p className="text-[11px] text-white/60">
              {t("login.accessNotice")}
            </p>
          </div>
        </div>

        {/* Right Column: Roles & Interactive Login (7 cols) */}
        <div className="p-8 sm:p-12 lg:col-span-7 flex flex-col justify-center">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-forest-soft px-2.5 py-0.5 text-[11px] font-semibold text-forest">
                {t("login.accessPortalBadge")}
              </span>
              <span className="text-xs font-semibold text-ink-muted">
                {t("login.selectRoleToEnter")}
              </span>
            </div>
            <h1 className="font-serif text-2xl font-bold text-ink sm:text-3xl">
              {t("login.title")}
            </h1>
            <p className="text-sm text-ink-muted">
              {t("login.subtitle")}
            </p>
          </div>

          {/* Quick Access Roles */}
          <div className="mt-8 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">
              {t("login.instantDemoRoles")}
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => enterAs("farmer")}
                className="group flex flex-col justify-between rounded-lg border-2 border-forest/30 bg-forest-soft/30 p-4 text-left transition-all hover:border-forest hover:bg-forest-soft/60"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-forest text-white">
                      <Sprout size={18} />
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-forest">
                      Farmer
                    </span>
                  </div>
                  <h3 className="mt-3 font-serif text-base font-bold text-ink">
                    {t("login.demoFarmer")}
                  </h3>
                  <p className="mt-1 text-xs text-ink-muted">
                    {t("login.farmerRoleDesc")}
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-forest">
                  <span>{t("login.enterAsFarmer")}</span>
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => enterAs("officer")}
                className="group flex flex-col justify-between rounded-lg border-2 border-monsoon/30 bg-monsoon-soft/30 p-4 text-left transition-all hover:border-monsoon hover:bg-monsoon-soft/60"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-monsoon text-white">
                      <ShieldCheck size={18} />
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-monsoon">
                      Officer
                    </span>
                  </div>
                  <h3 className="mt-3 font-serif text-base font-bold text-ink">
                    {t("login.demoOfficer")}
                  </h3>
                  <p className="mt-1 text-xs text-ink-muted">
                    {t("login.officerRoleDesc")}
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-monsoon">
                  <span>{t("login.enterAsOfficer")}</span>
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </div>
              </button>
            </div>
          </div>

          <div className="my-6 flex items-center gap-3 text-xs text-ink-muted">
            <span className="h-px flex-1 bg-line" />
            <span>{t("login.orStandardLogin")}</span>
            <span className="h-px flex-1 bg-line" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="contact" className="block text-xs font-bold uppercase tracking-wider text-ink-muted">
                {t("login.fieldContact")}
              </label>
              <input
                id="contact"
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="e.g. 9876543210 / officer@agri.gov"
                className="mt-1.5 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-forest"
                autoComplete="username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-ink-muted">
                {t("login.fieldPassword")}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-forest"
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" variant="primary" size="md" className="w-full">
              {t("login.submit")}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-ink-muted">
            {t("login.disclaimer")}
          </p>
        </div>
      </div>
    </div>
  );
}
