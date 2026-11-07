"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { SelectedLocation, UserRole } from "@/types";
import { defaultLocation } from "@/data/locations";
import {
  saveFarmerToRegistry,
  updateFarmerCrop,
  updateFarmerLocation,
  updateFarmerProfile,
  type RegisteredFarmerRecord,
} from "@/lib/farmerRegistry";

const STORAGE_KEY = "hyperlocal:app-state";

export interface FarmerProfile {
  farmerName: string;
  mobileNumber: string;
  mpin?: string;
  gatNumber?: string;
  irrigationType: "rainfed" | "irrigated";
  landAcres?: number;
  villageName?: string;
  villageNameMr?: string;
  talukaName?: string;
  talukaNameMr?: string;
  districtName?: string;
  districtNameMr?: string;
}

interface AppState {
  role: UserRole | null;
  location: SelectedLocation;
  cropId: string;
  stageId: string;
  farmerProfile?: FarmerProfile | null;
}

interface AppStateContextValue extends AppState {
  setRole: (role: UserRole | null) => void;
  setLocation: (loc: SelectedLocation) => void;
  setCrop: (cropId: string, stageId: string) => void;
  setFarmerProfile: (profile: FarmerProfile | null) => void;
  registerFarmer: (
    profile: FarmerProfile,
    location: SelectedLocation,
    cropId: string,
    stageId?: string
  ) => void;
  loginAsFarmer: (record: RegisteredFarmerRecord) => void;
  logout: () => void;
  hydrated: boolean;
}

const defaultState: AppState = {
  role: null,
  location: defaultLocation,
  cropId: "soybean",
  stageId: "sowing",
  farmerProfile: null,
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
        const parsed = { ...defaultState, ...JSON.parse(stored) };
        setState(parsed);
        // Sync any existing active crop to the farmer registry so it is never lost
        if (parsed.farmerProfile?.mobileNumber && parsed.cropId) {
          updateFarmerCrop(parsed.farmerProfile.mobileNumber, parsed.cropId, parsed.stageId || "sowing");
        }
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
    (location: SelectedLocation) => {
      persist({ ...state, location });
      if (state.farmerProfile?.mobileNumber) {
        updateFarmerLocation(state.farmerProfile.mobileNumber, location);
      }
    },
    [state, persist]
  );

  const setCrop = useCallback(
    (cropId: string, stageId: string) => {
      persist({ ...state, cropId, stageId });
      if (state.farmerProfile?.mobileNumber) {
        updateFarmerCrop(state.farmerProfile.mobileNumber, cropId, stageId);
      }
    },
    [state, persist]
  );

  const setFarmerProfile = useCallback(
    (farmerProfile: FarmerProfile | null) => {
      persist({ ...state, farmerProfile });
      if (farmerProfile?.mobileNumber) {
        updateFarmerProfile(farmerProfile.mobileNumber, farmerProfile);
      }
    },
    [state, persist]
  );

  const registerFarmer = useCallback(
    (
      profile: FarmerProfile,
      location: SelectedLocation,
      cropId: string,
      stageId: string = "sowing"
    ) => {
      // 1. Persist to permanent Farmers Registry by mobile number
      saveFarmerToRegistry({
        profile,
        location,
        cropId,
        stageId,
        mpin: profile.mpin || "1234",
        registeredAt: new Date().toISOString(),
      });

      // 2. Set current active session state
      persist({
        ...state,
        role: "farmer",
        farmerProfile: profile,
        location,
        cropId,
        stageId,
      });
    },
    [state, persist]
  );

  const loginAsFarmer = useCallback(
    (record: RegisteredFarmerRecord) => {
      persist({
        ...state,
        role: "farmer",
        farmerProfile: record.profile,
        location: record.location,
        cropId: record.cropId,
        stageId: record.stageId,
      });
    },
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
    () => ({
      ...state,
      setRole,
      setLocation,
      setCrop,
      setFarmerProfile,
      registerFarmer,
      loginAsFarmer,
      logout,
      hydrated,
    }),
    [state, setRole, setLocation, setCrop, setFarmerProfile, registerFarmer, loginAsFarmer, logout, hydrated]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
