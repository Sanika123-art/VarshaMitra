"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as Icons from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { useAppState } from "@/hooks/useAppState";
import { crops, getCrop } from "@/data/crops";
import { cn } from "@/lib/utils";

export default function CropSelectPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { cropId, stageId, setCrop } = useAppState();

  const [selectedCrop, setSelectedCrop] = useState(cropId);
  const crop = getCrop(selectedCrop) ?? crops[0];
  const [selectedStage, setSelectedStage] = useState(
    crop.stages.some((s) => s.id === stageId) ? stageId : crop.stages[0].id
  );

  function pickCrop(id: string) {
    setSelectedCrop(id);
    const c = getCrop(id);
    setSelectedStage(c?.stages[0].id ?? "sowing");
  }

  function confirm() {
    setCrop(selectedCrop, selectedStage);
    router.push("/farmer/dashboard");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <h1 className="font-display text-3xl text-[var(--color-ink)]">{t("cropSelect.title")}</h1>
      <p className="mt-2 text-sm text-[var(--color-ink)]/65">{t("cropSelect.subtitle")}</p>

      <div className="mt-8 rounded-3xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-6">
        <p className="mb-3 text-sm font-medium text-[var(--color-ink)]/80">{t("cropSelect.selectCrop")}</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {crops.map((c) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const Icon = (Icons as any)[c.icon] ?? Icons.Sprout;
            const active = c.id === selectedCrop;
            return (
              <button
                key={c.id}
                onClick={() => pickCrop(c.id)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-2xl border px-3 py-4 text-sm font-medium transition-colors",
                  active
                    ? "border-[var(--color-forest)] bg-[var(--color-forest)]/10 text-[var(--color-forest-dark)]"
                    : "border-[var(--color-line)] bg-[var(--color-paper)] text-[var(--color-ink)]/75 hover:border-[var(--color-forest)]/40"
                )}
              >
                <Icon size={20} />
                {t(c.nameKey)}
              </button>
            );
          })}
        </div>

        <p className="mb-3 mt-6 text-sm font-medium text-[var(--color-ink)]/80">{t("cropSelect.selectStage")}</p>
        <div className="flex flex-wrap gap-2">
          {crop.stages.map((s) => {
            const active = s.id === selectedStage;
            return (
              <button
                key={s.id}
                onClick={() => setSelectedStage(s.id)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  active
                    ? "border-[var(--color-forest)] bg-[var(--color-forest)] text-white"
                    : "border-[var(--color-line)] bg-[var(--color-paper)] text-[var(--color-ink)]/75"
                )}
              >
                {t(s.nameKey)}
              </button>
            );
          })}
        </div>

        <button
          onClick={confirm}
          className="mt-8 w-full rounded-full bg-[var(--color-forest)] py-3 text-sm font-medium text-white hover:bg-[var(--color-forest-dark)]"
        >
          {t("cropSelect.confirm")}
        </button>
      </div>
    </div>
  );
}
