"use client";

import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";

/** Prominent English / Marathi switcher. Changes language in place — route and selections are untouched. */
export default function LanguageSwitcher({ onDark = false }: { onDark?: boolean }) {
  const { language, setLanguage, t } = useLanguage();

  const option = (code: "en" | "mr", label: string, lang: string) => (
    <button
      type="button"
      lang={lang}
      onClick={() => setLanguage(code)}
      aria-pressed={language === code}
      className={cn(
        "min-h-8 rounded-[5px] px-3 text-sm font-semibold transition-colors",
        language === code
          ? onDark
            ? "bg-white text-forest-dark"
            : "bg-forest text-white"
          : onDark
            ? "text-white/85 hover:bg-white/12"
            : "text-ink-muted hover:text-ink"
      )}
    >
      {label}
    </button>
  );

  return (
    <div
      role="group"
      aria-label={t("shell.languageLabel")}
      className={cn(
        "inline-flex items-center rounded-md border p-0.5",
        onDark ? "border-white/30" : "border-line-strong bg-surface-raised"
      )}
    >
      {option("en", "English", "en")}
      {option("mr", "मराठी", "mr")}
    </div>
  );
}
