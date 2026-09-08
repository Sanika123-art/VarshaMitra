"use client";

import { CloudRain, Radio, Map as MapIcon, Sprout, Database, Shield, TrendingUp, Compass, ArrowDown, HelpCircle, Workflow } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { SectionHeading } from "@/components/ui";

export default function AboutPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <SectionHeading title={t("about.title")} />

      <Block icon={HelpCircle} title={t("about.problemTitle")} body={t("about.problemBody")} />
      <Block icon={Compass} title={t("about.whyTitle")} body={t("about.whyBody")} />

      {/* ── System Diagram — Visual Centerpiece ─────────── */}
      <div className="mt-12 rounded-3xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-8 shadow-[var(--shadow-sm)]">
        <div className="flex items-center gap-2 text-[var(--color-forest)]">
          <Workflow size={18} />
          <h3 className="font-display text-xl text-[var(--color-ink)]">{t("about.howTitle")}</h3>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink)]/65">{t("about.howBody")}</p>

        {/* Beautiful vertical system flow */}
        <div className="mt-8 flex flex-col items-center gap-0">
          {[
            { icon: Database, label: "Climate Data", desc: "IMD · NOAA · Copernicus", color: "var(--color-sky)" },
            { icon: Radio, label: "AI Prediction", desc: "Hyperlocal ML model", color: "var(--color-forest)" },
            { icon: MapIcon, label: "Hyperlocal Localization", desc: "Block-level risk mapping", color: "var(--color-amber)" },
            { icon: Shield, label: "Risk Engine", desc: "Onset · Dry spell · Heavy rain", color: "var(--color-clay)" },
            { icon: Sprout, label: "Crop Context", desc: "Crop + stage awareness", color: "var(--color-moss)" },
            { icon: CloudRain, label: "Advisory", desc: "Farmer decision support", color: "var(--color-forest-dark)" },
          ].map((step, i, arr) => (
            <div key={step.label} className="flex flex-col items-center">
              {i > 0 && (
                <div className="flex flex-col items-center">
                  <div className="h-5 w-px bg-[var(--color-forest)]/15" />
                  <ArrowDown size={14} className="text-[var(--color-forest)]/25" />
                  <div className="h-2 w-px bg-[var(--color-forest)]/15" />
                </div>
              )}
              <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper)] px-5 py-3.5 shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)]">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-full"
                  style={{ background: `${step.color}15`, color: step.color }}
                >
                  <step.icon size={18} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-[var(--color-ink)]">{step.label}</p>
                  <p className="text-[11px] text-[var(--color-ink)]/50">{step.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Block icon={TrendingUp} title={t("about.impactTitle")} body={t("about.impactBody")} />
      <Block icon={Radio} title={t("about.roadmapTitle")} body={t("about.roadmapBody")} />

      {/* Prototype honesty */}
      <div className="mt-10 rounded-2xl border border-[var(--color-amber)]/30 bg-[var(--color-amber)]/5 p-6">
        <p className="text-sm font-semibold text-[var(--color-amber)]">{t("about.prototypeTitle")}</p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink)]/60">
          {t("about.prototypeBody")}
        </p>
      </div>
    </div>
  );
}

function Block({ icon: Icon, title, body }: { icon: typeof CloudRain; title: string; body: string }) {
  return (
    <div className="mt-10">
      <div className="flex items-center gap-2.5 text-[var(--color-forest)]">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-forest)]/8">
          <Icon size={18} />
        </span>
        <h3 className="font-display text-xl text-[var(--color-ink)]">{title}</h3>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink)]/65">{body}</p>
    </div>
  );
}
