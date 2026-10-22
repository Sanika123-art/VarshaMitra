"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import en, { Translations } from "./en";
import mr from "./mr";
import type { Language } from "@/types";

const dictionaries: Record<Language, Translations> = { en, mr };

const STORAGE_KEY = "hyperlocal:lang";

type Vars = Record<string, string | number>;

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string, vars?: Vars) => string;
  tList: (path: string, vars?: Vars) => string[];
  /** Locale-aware number formatting (Devanagari digits in Marathi). */
  fmtNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  /** Locale-aware date formatting for ISO date strings. */
  fmtDate: (iso: string, options?: Intl.DateTimeFormatOptions) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveNode(dict: Translations, path: string): any {
  const parts = path.split(".");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let node: any = dict;
  for (const part of parts) {
    if (node == null) return undefined;
    node = node[part];
  }
  return node;
}

function resolve(dict: Translations, path: string): string | undefined {
  const node = resolveNode(dict, path);
  return typeof node === "string" ? node : undefined;
}

function resolveList(dict: Translations, path: string): string[] | undefined {
  const node = resolveNode(dict, path);
  return Array.isArray(node) ? (node as string[]) : undefined;
}

function interpolate(str: string, vars?: Vars): string {
  if (!vars) return str;
  return Object.entries(vars).reduce(
    (acc, [key, value]) => acc.replaceAll(`{${key}}`, String(value)),
    str
  );
}

function humanizeKey(path: string): string {
  const leaf = path.split(".").pop() || path;
  const spaced = leaf
    .replace(/^group([A-Z])/, "$1")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

const localeFor: Record<Language, string> = { en: "en-IN", mr: "mr-IN" };

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (stored === "en" || stored === "mr") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage
      setLanguageState(stored);
    }
  }, []);

  // Keep the document language in sync for screen readers, hyphenation and fonts.
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, lang);
    }
  }, []);

  const t = useCallback(
    (path: string, vars?: Vars) => {
      const dict = dictionaries[language];
      let value = resolve(dict, path) ?? resolve(en, path);
      if (value === undefined) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(`[i18n] Missing translation for key "${path}" (locale: "${language}")`);
        }
        value = humanizeKey(path);
      }
      return interpolate(value, vars);
    },
    [language]
  );

  const tList = useCallback(
    (path: string, vars?: Vars) => {
      const dict = dictionaries[language];
      const value = resolveList(dict, path) ?? resolveList(en, path) ?? [];
      return value.map((item) => interpolate(item, vars));
    },
    [language]
  );

  const fmtNumber = useCallback(
    (value: number, options?: Intl.NumberFormatOptions) =>
      new Intl.NumberFormat(localeFor[language], options).format(value),
    [language]
  );

  const fmtDate = useCallback(
    (iso: string, options?: Intl.DateTimeFormatOptions) => {
      const d = new Date(`${iso}T00:00:00`);
      if (Number.isNaN(d.getTime())) return iso;
      return new Intl.DateTimeFormat(
        localeFor[language],
        options ?? { day: "numeric", month: "short", year: "numeric" }
      ).format(d);
    },
    [language]
  );

  const value = useMemo(
    () => ({ language, setLanguage, t, tList, fmtNumber, fmtDate }),
    [language, setLanguage, t, tList, fmtNumber, fmtDate]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

export function useTranslation() {
  const { t, tList, language, fmtNumber, fmtDate } = useLanguage();
  return { t, tList, language, fmtNumber, fmtDate };
}
