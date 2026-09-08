"use client";

import Link from "next/link";
import { useTranslation } from "@/i18n/LanguageContext";
import { CloudRain } from "lucide-react";

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="relative border-t border-[var(--color-line)] bg-[var(--color-forest-dark)] text-white overflow-hidden">
      {/* Topographic background */}
      <div className="absolute inset-0 topo-dark opacity-40" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white">
                <CloudRain size={15} />
              </span>
              <span className="font-display text-lg text-white">VarshaMitra</span>
            </div>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/65">
              {t("footer.tagline")}
            </p>
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-white/55">
            <Link href="/about" className="transition-colors hover:text-white/90">
              {t("nav.about")}
            </Link>
            <Link href="/insights" className="transition-colors hover:text-white/90">
              {t("nav.insights")}
            </Link>
            <Link href="/farmer/risk-map" className="transition-colors hover:text-white/90">
              {t("nav.riskMap")}
            </Link>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-6">
          <p className="max-w-3xl text-xs leading-relaxed text-white/40">
            {t("footer.prototypeNotice")}
          </p>
          <p className="mt-3 text-[11px] text-white/30">
            PCCOE Indradhanu Grand Challenge 2026 · AI for Climate Action
          </p>
        </div>
      </div>
    </footer>
  );
}
