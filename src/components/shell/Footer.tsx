"use client";

import Link from "next/link";
import { useTranslation } from "@/i18n/LanguageContext";
import { BrandLockup } from "./Brand";

export default function Footer() {
  const { t } = useTranslation();

  const cols: { title: string; links: { href: string; label: string }[] }[] = [
    {
      title: t("footer.platform"),
      links: [
        { href: "/farmer/climate", label: t("nav.climateIntelligence") },
        { href: "/farmer/risk-map", label: t("nav.riskMap") },
        { href: "/farmer/advisory", label: t("nav.cropAdvisory") },
        { href: "/insights", label: t("nav.insights") },
      ],
    },
    {
      title: t("footer.about"),
      links: [
        { href: "/field-stories", label: t("nav.fieldStories") },
        { href: "/about", label: t("nav.about") },
        { href: "/about#data", label: t("footer.dataTransparency") },
        { href: "/about#credits", label: t("footer.imageCredits") },
      ],
    },
  ];

  return (
    <footer className="mt-16 border-t border-forest-dark bg-forest-dark text-white">
      <div className="container-page py-10">
        <div className="grid gap-8 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <BrandLockup light showTagline tagline={t("shell.tagline")} />
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/90">{t("footer.notice")}</p>
          </div>
          {cols.map((c) => (
            <nav key={c.title} aria-label={c.title}>
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-[#E6A52E]">{c.title}</h2>
              <ul className="mt-3 space-y-2">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm font-medium text-white/90 underline-offset-4 hover:text-white hover:underline">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-8 flex flex-col gap-1 border-t border-white/20 pt-5 text-xs text-white/80 sm:flex-row sm:justify-between">
          <p>{t("footer.team")}</p>
          <p>{t("footer.disclaimer")}</p>
        </div>
      </div>
    </footer>
  );
}
