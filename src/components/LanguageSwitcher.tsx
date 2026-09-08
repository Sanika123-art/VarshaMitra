"use client";

import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";
import { Languages } from "lucide-react";

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div
      className="flex items-center gap-1 rounded-full border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-1"
      role="group"
      aria-label={t("nav.language")}
    >
      {!compact && <Languages size={14} className="ml-1.5 text-[var(--color-forest)]" aria-hidden />}
      <button
        type="button"
        onClick={() => setLanguage("en")}
        aria-pressed={language === "en"}
        className={cn(
          "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
          language === "en" ? "bg-[var(--color-forest)] text-white" : "text-[var(--color-ink)]/70 hover:text-[var(--color-ink)]"
        )}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage("mr")}
        aria-pressed={language === "mr"}
        className={cn(
          "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
          language === "mr" ? "bg-[var(--color-forest)] text-white" : "text-[var(--color-ink)]/70 hover:text-[var(--color-ink)]"
        )}
      >
        मराठी
      </button>
    </div>
  );
}
