"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Search, Layers } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { allBlocks } from "@/data/locations";
import type { Block } from "@/types";
import { mapLayers, layerLabelKey, type MapLayer } from "./riskLayers";
import BlockPanel from "./BlockPanel";
import { cn } from "@/lib/utils";

const RiskMap = dynamic(() => import("./RiskMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <div className="shimmer h-full w-full" />
    </div>
  ),
});

export default function RiskMapExperience({ initialBlockId }: { initialBlockId?: string }) {
  const { t, language } = useTranslation();
  const [layer, setLayer] = useState<MapLayer>("overall");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Block | null>(
    () => allBlocks().find((b) => b.id === initialBlockId) ?? null
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return allBlocks().filter((b) => b.name.toLowerCase().includes(q) || b.nameMr.includes(query));
  }, [query]);

  return (
    <div className="flex flex-col">
      {/* Map takes dominant visual space */}
      <div className="relative mx-auto mt-0 h-[calc(100vh-64px)] w-full overflow-hidden sm:h-[calc(100vh-64px)]">
        {/* Title overlay */}
        <div className="absolute left-3 top-3 z-[500] sm:left-4 sm:top-4">
          <div className="rounded-2xl bg-[var(--color-paper)]/90 border border-[var(--color-line)] px-4 py-3 backdrop-blur-md shadow-[var(--shadow-md)]">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-lg text-[var(--color-ink)] sm:text-xl">
                {t("riskMapPage.title")}
              </h1>
              <span className="hidden sm:inline-flex items-center rounded-full bg-forest-soft px-2.5 py-0.5 text-[11px] font-semibold text-forest">
                Maharashtra 36 Districts
              </span>
            </div>
            <p className="mt-0.5 text-xs text-[var(--color-ink)]/50 max-w-xs">
              {t("riskMapPage.subtitle")}
            </p>
          </div>
        </div>

        {/* Layer selector */}
        <div className="absolute left-1/2 top-3 z-[500] -translate-x-1/2 sm:top-4">
          <div className="flex items-center gap-1 rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper)]/90 p-1 backdrop-blur-md shadow-[var(--shadow-md)]">
            <Layers size={14} className="ml-2 text-[var(--color-ink)]/40 hidden sm:block" />
            {mapLayers.map((l) => (
              <button
                key={l}
                onClick={() => setLayer(l)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all duration-200 sm:text-xs",
                  layer === l
                    ? "bg-[var(--color-forest)] text-white shadow-[var(--shadow-sm)]"
                    : "text-[var(--color-ink)]/60 hover:bg-[var(--color-paper-raised)] hover:text-[var(--color-ink)]"
                )}
              >
                {t(layerLabelKey[l])}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="absolute right-3 top-3 z-[500] w-52 max-w-[calc(100%-1.5rem)] sm:right-auto sm:left-4 sm:top-24 sm:w-56">
          <div className="flex items-center gap-2 rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)]/90 px-3 py-2.5 backdrop-blur-md shadow-[var(--shadow-sm)]">
            <Search size={14} className="text-[var(--color-ink)]/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("riskMapPage.searchPlaceholder")}
              className="w-full bg-transparent text-xs outline-none placeholder:text-[var(--color-ink)]/35"
            />
          </div>
          {filtered.length > 0 && (
            <ul className="mt-1 max-h-40 overflow-auto rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] shadow-[var(--shadow-lg)]">
              {filtered.map((b) => (
                <li key={b.id}>
                  <button
                    onClick={() => {
                      setSelected(b);
                      setQuery("");
                    }}
                    className="block w-full px-3 py-2.5 text-left text-xs hover:bg-[var(--color-paper-raised)] transition-colors"
                  >
                    {language === "mr" ? b.nameMr : b.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-[500] rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper)]/90 p-3.5 backdrop-blur-md shadow-[var(--shadow-md)]">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink)]/50">
            {t("riskMapPage.legend")}
          </p>
          <div className="flex flex-col gap-2">
            <LegendDot color="#4C7A4F" label={t("common.riskLow")} />
            <LegendDot color="#C8952E" label={t("common.riskModerate")} />
            <LegendDot color="#B5502E" label={t("common.riskHigh")} />
            <LegendDot color="#7A2E1F" label={t("common.riskCritical")} />
          </div>
        </div>

        <RiskMap layer={layer} selectedBlockId={selected?.id ?? null} onSelect={setSelected} language={language} />

        {selected && <BlockPanel block={selected} onClose={() => setSelected(null)} />}
      </div>

      {!selected && (
        <p className="mx-auto mt-3 mb-6 max-w-7xl px-4 text-center text-xs text-[var(--color-ink)]/40 sm:px-6">
          {t("riskMapPage.selectPrompt")}
        </p>
      )}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2.5 text-xs text-[var(--color-ink)]/70">
      <span className="h-3 w-3 rounded-full shadow-[var(--shadow-sm)]" style={{ background: color }} />
      {label}
    </div>
  );
}
