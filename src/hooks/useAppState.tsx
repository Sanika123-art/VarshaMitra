"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { SelectedLocation, UserRole } from "@/types";
import { defaultLocation } from "@/data/locations";

const STORAGE_KEY = "hyperlocal:app-state";

interface AppState {
  role: UserRole | null;
  location: SelectedLocation;
  cropId: string;
  stageId: string;
}

interface AppStateContextValue extends AppState {
  setRole: (role: UserRole | null) => void;
  setLocation: (loc: SelectedLocation) => void;
  setCrop: (cropId: string, stageId: string) => void;
  logout: () => void;
  hydrated: boolean;
}

const defaultState: AppState = {
  role: null,
  location: defaultLocation,
  cropId: "soybean",
  stageId: "sowing",
};

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
      if (stored) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage
        setState({ ...defaultState, ...JSON.parse(stored) });
      }
    } catch {
      // ignore malformed storage
    }
    setHydrated(true);
  }, []);

  const persist = useCallback((next: AppState) => {
    setState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  }, []);

  const setRole = useCallback((role: UserRole | null) => persist({ ...state, role }), [state, persist]);
  const setLocation = useCallback(
    (location: SelectedLocation) => persist({ ...state, location }),
    [state, persist]
  );
  const setCrop = useCallback(
    (cropId: string, stageId: string) => persist({ ...state, cropId, stageId }),
    [state, persist]
  );

  const logout = useCallback(() => {
    setState((prev) => {
      const next: AppState = {
        ...prev,
        role: null,
      };
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ ...state, setRole, setLocation, setCrop, logout, hydrated }),
    [state, setRole, setLocation, setCrop, logout, hydrated]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
