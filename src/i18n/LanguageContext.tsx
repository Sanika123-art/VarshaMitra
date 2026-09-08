"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import en, { Translations } from "./en";
import mr from "./mr";
import type { Language } from "@/types";

const dictionaries: Record<Language, Translations> = { en, mr };

const STORAGE_KEY = "hyperlocal:lang";

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string, vars?: Record<string, string | number>) => string;
  tList: (path: string, vars?: Record<string, string | number>) => string[];
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

function interpolate(str: string, vars?: Record<string, string | number>): string {
  if (!vars) return str;
  return Object.entries(vars).reduce(
    (acc, [key, value]) => acc.replaceAll(`{${key}}`, String(value)),
    str
  );
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (stored === "en" || stored === "mr") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage
      setLanguageState(stored);
    }
    setHydrated(true);
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, lang);
    }
  }, []);

  const t = useCallback(
    (path: string, vars?: Record<string, string | number>) => {
      const dict = dictionaries[language];
      const value = resolve(dict, path) ?? resolve(en, path) ?? path;
      return interpolate(value, vars);
    },
    [language]
  );

  const tList = useCallback(
    (path: string, vars?: Record<string, string | number>) => {
      const dict = dictionaries[language];
      const value = resolveList(dict, path) ?? resolveList(en, path) ?? [];
      return value.map((item) => interpolate(item, vars));
    },
    [language]
  );

  const value = useMemo(() => ({ language, setLanguage, t, tList }), [language, setLanguage, t, tList]);

  return (
    <LanguageContext.Provider value={value}>
      <div lang={language} suppressHydrationWarning data-hydrated={hydrated}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

export function useTranslation() {
  const { t, tList, language } = useLanguage();
  return { t, tList, language };
}
