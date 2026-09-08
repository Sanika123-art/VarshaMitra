"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { useAppState } from "@/hooks/useAppState";
import { districts, stateInfo } from "@/data/locations";

export default function LocationPage() {
  const { t, language } = useTranslation();
  const router = useRouter();
  const { location, setLocation, role, hydrated } = useAppState();

  const [districtId, setDistrictId] = useState(location.districtId);
  const district = useMemo(() => districts.find((d) => d.id === districtId), [districtId]);
  const [blockId, setBlockId] = useState(location.blockId);

  useEffect(() => {
    if (hydrated && !role) {
      router.replace("/login");
    }
  }, [hydrated, role, router]);

  if (!hydrated || !role) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[var(--color-forest)] border-t-transparent" />
      </div>
    );
  }

  function handleDistrictChange(id: string) {
    setDistrictId(id);
    const d = districts.find((dd) => dd.id === id);
    if (d) setBlockId(d.blocks[0].id);
  }

  function confirm() {
    const d = districts.find((dd) => dd.id === districtId);
    const b = d?.blocks.find((bb) => bb.id === blockId);
    if (!d || !b) return;
    setLocation({
      stateId: stateInfo.id,
      stateName: stateInfo.name,
      districtId: d.id,
      districtName: d.name,
      blockId: b.id,
      blockName: b.name,
    });
    router.push(role === "officer" ? "/officer/dashboard" : "/farmer/dashboard");
  }

  const selectedBlock = district?.blocks.find((b) => b.id === blockId);

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <MapPin className="text-[var(--color-forest)]" size={26} />
      <h1 className="mt-4 font-display text-3xl text-[var(--color-ink)]">{t("location.title")}</h1>
      <p className="mt-2 text-sm text-[var(--color-ink)]/65">{t("location.subtitle")}</p>

      <div className="mt-8 space-y-5 rounded-3xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-6">
        <Field label={t("location.selectState")}>
          <select
            disabled
            value={stateInfo.id}
            className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] px-4 py-2.5 text-sm text-[var(--color-ink)]/70"
          >
            <option value={stateInfo.id}>{language === "mr" ? stateInfo.nameMr : stateInfo.name}</option>
          </select>
        </Field>

        <Field label={t("location.selectDistrict")}>
          <select
            value={districtId}
            onChange={(e) => handleDistrictChange(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-forest)]"
          >
            {districts.map((d) => (
              <option key={d.id} value={d.id}>
                {language === "mr" ? d.nameMr : d.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label={t("location.selectBlock")}>
          <select
            value={blockId}
            onChange={(e) => setBlockId(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-forest)]"
          >
            {district?.blocks.map((b) => (
              <option key={b.id} value={b.id}>
                {language === "mr" ? b.nameMr : b.name}
              </option>
            ))}
          </select>
        </Field>

        {selectedBlock && (
          <p className="rounded-xl bg-[var(--color-forest)]/8 px-4 py-3 text-sm text-[var(--color-forest-dark)]">
            {t("location.personalizedFor", {
              block: language === "mr" ? selectedBlock.nameMr : selectedBlock.name,
            })}
          </p>
        )}

        <button
          onClick={confirm}
          className="w-full rounded-full bg-[var(--color-forest)] py-3 text-sm font-medium text-white hover:bg-[var(--color-forest-dark)]"
        >
          {t("location.confirm")}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]/80">{label}</span>
      {children}
    </label>
  );
}
