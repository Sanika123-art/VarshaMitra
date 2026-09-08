"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import * as Icons from "lucide-react";
import { ArrowRight, RotateCcw, CloudRain, Radio, Sprout, MapPin, Shield, Eye } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { useAppState } from "@/hooks/useAppState";
import { crops, getCrop } from "@/data/crops";
import { deriveAdvisory } from "@/data/advisories";
import { PrototypeTag, SectionHeading, DecisionFlowVisual } from "@/components/ui";
import RiskBadge from "@/components/RiskBadge";
import { riskLabelKey } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3 | "generating" | 4;

export default function AdvisoryPage() {
  const { t } = useTranslation();
  const { location, cropId, stageId, setCrop, hydrated } = useAppState();

  const [step, setStep] = useState<Step>(1);
  const [localCropId, setLocalCropId] = useState(cropId);
  const crop = getCrop(localCropId) ?? crops[0];
  const [localStageId, setLocalStageId] = useState(
    crop.stages.some((s) => s.id === stageId) ? stageId : crop.stages[0].id
  );

  if (!hydrated) return null;

  function generate() {
    setCrop(localCropId, localStageId);
    setStep("generating");
  }

  const advisory = step === 4 ? deriveAdvisory(location.blockId, localCropId, localStageId) : null;
  const steps: { n: Step; label: string }[] = [
    { n: 1, label: t("advisoryPage.step1") },
    { n: 2, label: t("advisoryPage.step2") },
    { n: 3, label: t("advisoryPage.step3") },
    { n: 4, label: t("advisoryPage.step4") },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <PrototypeTag />
      <div className="mt-4">
        <h1 className="font-display text-4xl leading-tight text-[var(--color-ink)] sm:text-5xl">
          {t("advisoryPage.title")}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--color-ink)]/60">
          {t("advisoryPage.subtitle")}
        </p>
      </div>

      {/* Step indicator */}
      <ol className="mt-8 flex flex-wrap items-center gap-2 text-sm">
        {steps.map((s, i) => {
          const isActive = step === s.n || (step === "generating" && s.n === 4);
          const isCompleted = typeof step === "number" ? step > (s.n as number) : s.n !== 4;
          return (
            <li key={s.n as string} className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300",
                  isCompleted || isActive
                    ? "bg-[var(--color-forest)] text-white shadow-[var(--shadow-sm)]"
                    : "bg-[var(--color-paper-raised)] text-[var(--color-ink)]/40 border border-[var(--color-line)]"
                )}
              >
                {isCompleted && typeof step === "number" && step > (s.n as number) ? "✓" : s.n === "generating" ? "…" : s.n}
              </span>
              <span
                className={cn(
                  "font-medium transition-colors",
                  isActive || isCompleted ? "text-[var(--color-ink)]" : "text-[var(--color-ink)]/40"
                )}
              >
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <div className="hidden sm:block w-8 h-px bg-[var(--color-line)]" />
              )}
            </li>
          );
        })}
      </ol>

      {/* Step content */}
      <div className="mt-8 rounded-3xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-6 shadow-[var(--shadow-sm)] sm:p-8">
        {step === 1 && (
          <div className="fade-up">
            <div className="flex items-center gap-2 text-[var(--color-forest)]">
              <MapPin size={18} />
              <h3 className="text-sm font-bold uppercase tracking-wider">{t("advisoryPage.step1")}</h3>
            </div>
            <p className="mt-3 text-lg font-medium text-[var(--color-ink)]">
              {location.blockName}, {location.districtName}
            </p>
            <p className="mt-1 text-sm text-[var(--color-ink)]/50">{location.stateName}</p>
            <div className="mt-6 flex gap-3">
              <Link href="/location" className="rounded-full border border-[var(--color-line)] px-4 py-2.5 text-sm font-medium transition-colors hover:border-[var(--color-forest)]/40">
                {t("location.changeLocation")}
              </Link>
              <button
                onClick={() => setStep(2)}
                className="rounded-full bg-[var(--color-forest)] px-6 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition-all hover:bg-[var(--color-forest-dark)]"
              >
                {t("common.continue")}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="fade-up">
            <div className="flex items-center gap-2 text-[var(--color-forest)]">
              <Sprout size={18} />
              <h3 className="text-sm font-bold uppercase tracking-wider">{t("advisoryPage.step2")}</h3>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {crops.map((c) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const Icon = (Icons as any)[c.icon] ?? Icons.Sprout;
                const active = c.id === localCropId;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setLocalCropId(c.id);
                      setLocalStageId(c.stages[0].id);
                    }}
                    className={cn(
                      "group flex flex-col items-center gap-2.5 rounded-2xl border px-3 py-5 text-sm font-semibold transition-all",
                      active
                        ? "border-[var(--color-forest)] bg-[var(--color-forest)]/10 text-[var(--color-forest-dark)] shadow-[var(--shadow-sm)]"
                        : "border-[var(--color-line)] bg-[var(--color-paper)] text-[var(--color-ink)]/70 hover:border-[var(--color-forest)]/40 hover:shadow-[var(--shadow-sm)]"
                    )}
                  >
                    <span className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full transition-transform group-hover:scale-110",
                      active ? "bg-[var(--color-forest)]/15" : "bg-[var(--color-paper-raised)]"
                    )}>
                      <Icon size={20} />
                    </span>
                    {t(c.nameKey)}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setStep(3)}
              className="mt-6 rounded-full bg-[var(--color-forest)] px-6 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition-all hover:bg-[var(--color-forest-dark)]"
            >
              {t("common.continue")}
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="fade-up">
            <div className="flex items-center gap-2 text-[var(--color-forest)]">
              <Radio size={18} />
              <h3 className="text-sm font-bold uppercase tracking-wider">{t("advisoryPage.step3")}</h3>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {crop.stages.map((s) => {
                const active = s.id === localStageId;
                return (
                  <button
                    key={s.id}
                    onClick={() => setLocalStageId(s.id)}
                    className={cn(
                      "rounded-full border px-5 py-2.5 text-sm font-semibold transition-all",
                      active
                        ? "border-[var(--color-forest)] bg-[var(--color-forest)] text-white shadow-[var(--shadow-sm)]"
                        : "border-[var(--color-line)] bg-[var(--color-paper)] text-[var(--color-ink)]/70 hover:border-[var(--color-forest)]/40"
                    )}
                  >
                    {t(s.nameKey)}
                  </button>
                );
              })}
            </div>
            <button
              onClick={generate}
              className="mt-6 rounded-full bg-[var(--color-forest)] px-6 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition-all hover:bg-[var(--color-forest-dark)]"
            >
              {t("advisoryPage.generate")}
            </button>
          </div>
        )}

        {step === "generating" && (
          <GeneratingAnimation onComplete={() => setStep(4)} t={t} />
        )}

        {step === 4 && advisory && (
          <AdvisoryResult advisory={advisory} onRestart={() => setStep(1)} t={t} />
        )}
      </div>
    </div>
  );
}

/* ── Generating Animation ─────────────────────────────────────── */

function GeneratingAnimation({
  onComplete,
  t,
}: {
  onComplete: () => void;
  t: (key: string) => string;
}) {
  const [phase, setPhase] = useState(0);
  const labels = [
    t("advisoryPage.genStep1"),
    t("advisoryPage.genStep2"),
    t("advisoryPage.genStep3"),
    t("advisoryPage.genStep4"),
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setPhase((prev) => {
        if (prev >= labels.length - 1) {
          clearInterval(interval);
          setTimeout(onComplete, 400);
          return prev;
        }
        return prev + 1;
      });
    }, 600);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center py-12">
      {/* Spinner */}
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 rounded-full border-2 border-[var(--color-line)]" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--color-forest)] animate-spin" />
        <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-[var(--color-forest-muted)] animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
      </div>
      <div className="mt-6 space-y-2 text-center">
        {labels.map((label, i) => (
          <p
            key={i}
            className={cn(
              "text-sm transition-all duration-300",
              i <= phase
                ? "text-[var(--color-ink)]/70 opacity-100"
                : "text-[var(--color-ink)]/20 opacity-50"
            )}
          >
            {i < phase ? "✓" : i === phase ? "●" : "○"} {label}
          </p>
        ))}
      </div>
    </div>
  );
}

/* ── Advisory Result ──────────────────────────────────────────── */

function AdvisoryResult({
  advisory,
  onRestart,
  t,
}: {
  advisory: ReturnType<typeof deriveAdvisory>;
  onRestart: () => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  const variant = advisory.isSowing ? "Sowing" : "Other";
  const vars = { crop: t(advisory.cropNameKey), stage: t(advisory.stageNameKey) };
  const headline = t(`advisoryTemplates.${advisory.concern}.headline${variant}`, vars);
  const reason = t(`advisoryTemplates.${advisory.concern}.reason${variant}`, vars);
  const water = t(`advisoryTemplates.${advisory.concern}.water`);
  const watch = t(`advisoryTemplates.${advisory.concern}.watch`);

  return (
    <div className="fade-up">
      {/* Recommendation hero */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[var(--color-forest)]">
            <Shield size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">{t("advisoryPage.recommendation")}</span>
          </div>
          <h3 className="mt-3 font-display text-2xl leading-snug text-[var(--color-forest-dark)] sm:text-3xl">
            {headline}
          </h3>
        </div>
        <RiskBadge risk={advisory.riskSignal} label={t(riskLabelKey[advisory.riskSignal])} size="md" />
      </div>

      {/* Why */}
      <div className="mt-6">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink)]/50">
          {t("advisoryPage.why")}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink)]/70">{reason}</p>
      </div>

      {/* Steps */}
      <StepsList concern={advisory.concern} variant={variant} label={t("advisoryPage.whatToDo")} />

      {/* Action cards */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-[var(--color-sky)]/8 border border-[var(--color-sky)]/15 px-4 py-3.5 text-sm">
          <span className="font-bold text-[var(--color-sky)]">{t("advisoryPage.waterAction")}</span>
          <p className="mt-1 text-[var(--color-ink)]/65">{water}</p>
        </div>
        <div className="rounded-2xl bg-[var(--color-amber)]/8 border border-[var(--color-amber)]/15 px-4 py-3.5 text-sm">
          <span className="font-bold text-[var(--color-amber)]">{t("advisoryPage.watchFor")}</span>
          <p className="mt-1 text-[var(--color-ink)]/65">{watch}</p>
        </div>
      </div>

      {/* Factors used */}
      <div className="mt-6">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink)]/50">
          {t("advisoryPage.factorsUsed")}
        </p>
        <ul className="mt-2 space-y-1.5">
          {advisory.factorKeys.map((k) => (
            <li key={k} className="flex items-start gap-2 text-sm text-[var(--color-ink)]/60">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-forest)]" />
              {t(`riskDrivers.${k}`)}
            </li>
          ))}
        </ul>
      </div>

      {/* Signature Decision Flow Visual */}
      <div className="mt-8 rounded-2xl bg-[var(--color-paper)] border border-[var(--color-line)] p-6">
        <p className="mb-4 text-center text-xs font-bold uppercase tracking-wider text-[var(--color-ink)]/45">
          {t("advisoryPage.decisionPath")}
        </p>
        <DecisionFlowVisual
          steps={[
            { label: t("advisoryPage.causeSignal"), value: t(`riskDrivers.${advisory.factorKeys[0]}`), icon: CloudRain },
            { label: t("advisoryPage.causeImpact"), value: reason.slice(0, 80) + "…", icon: Radio },
            { label: t("advisoryPage.causeAction"), value: headline, icon: Sprout, highlight: true },
          ]}
        />
      </div>

      <button
        onClick={onRestart}
        className="mt-6 flex items-center gap-1.5 rounded-full border border-[var(--color-line)] px-5 py-2.5 text-sm font-semibold text-[var(--color-ink)]/70 transition-all hover:border-[var(--color-forest)]/40 hover:shadow-[var(--shadow-sm)]"
      >
        <RotateCcw size={14} />
        {t("advisoryPage.regenerate")}
      </button>
    </div>
  );
}

/* ── Steps List ───────────────────────────────────────────────── */

function StepsList({ concern, variant, label }: { concern: string; variant: string; label: string }) {
  const { tList } = useTranslation();
  const items = tList(`advisoryTemplates.${concern}.steps${variant}`);
  return (
    <div className="mt-6">
      <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink)]/50">{label}</p>
      <ol className="mt-3 space-y-2.5">
        {items.map((s, i) => (
          <li key={i} className="flex gap-3 text-sm text-[var(--color-ink)]/70">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-forest)]/10 text-xs font-bold text-[var(--color-forest)]">
              {i + 1}
            </span>
            <span className="pt-0.5">{s}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
