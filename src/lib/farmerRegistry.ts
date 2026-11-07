import type { SelectedLocation } from "@/types";
import type { FarmerProfile } from "@/hooks/useAppState";

export interface RegisteredFarmerRecord {
  profile: FarmerProfile;
  location: SelectedLocation;
  cropId: string;
  stageId: string;
  mpin?: string;
  registeredAt: string;
}

const REGISTRY_STORAGE_KEY = "varshamitra:farmers-registry";

export const DEFAULT_FARMERS_REGISTRY: Record<string, RegisteredFarmerRecord> = {
  "7249702373": {
    profile: {
      farmerName: "Sumit Barve",
      mobileNumber: "7249702373",
      gatNumber: "42/B",
      irrigationType: "rainfed",
      landAcres: 2.5,
      villageName: "Igatpuri Town",
      villageNameMr: "इगतपुरी शहर",
      talukaName: "Igatpuri",
      talukaNameMr: "इगतपुरी",
      districtName: "Nashik",
      districtNameMr: "नाशिक",
    },
    location: {
      stateId: "mh",
      stateName: "Maharashtra",
      districtId: "nashik",
      districtName: "Nashik",
      districtNameMr: "नाशिक",
      blockId: "igatpuri",
      blockName: "Igatpuri",
      blockNameMr: "इगतपुरी",
      taluka: "Igatpuri",
      displayName: "Igatpuri Town, Igatpuri",
      latitude: 19.6967,
      longitude: 73.5658,
    },
    cropId: "soybean",
    stageId: "sowing",
    mpin: "1234",
    registeredAt: "2026-11-07T10:00:00.000Z",
  },
  "9822012345": {
    profile: {
      farmerName: "Ramesh Patil",
      mobileNumber: "9822012345",
      gatNumber: "18",
      irrigationType: "rainfed",
      landAcres: 3.0,
      villageName: "Shahapur Town",
      villageNameMr: "शहापूर शहर",
      talukaName: "Shahapur",
      talukaNameMr: "शहापूर",
      districtName: "Thane",
      districtNameMr: "ठाणे",
    },
    location: {
      stateId: "mh",
      stateName: "Maharashtra",
      districtId: "thane",
      districtName: "Thane",
      districtNameMr: "ठाणे",
      blockId: "shahapur",
      blockName: "Shahapur",
      blockNameMr: "शहापूर",
      taluka: "Shahapur",
      displayName: "Shahapur Town, Shahapur",
      latitude: 19.4526,
      longitude: 73.3312,
    },
    cropId: "rice",
    stageId: "sowing",
    mpin: "1234",
    registeredAt: "2026-11-06T14:30:00.000Z",
  },
  "9876543210": {
    profile: {
      farmerName: "Sagar Talpade",
      mobileNumber: "9876543210",
      gatNumber: "105/2",
      irrigationType: "irrigated",
      landAcres: 4.5,
      villageName: "Niphad Town",
      villageNameMr: "निफाड शहर",
      talukaName: "Niphad",
      talukaNameMr: "निफाड",
      districtName: "Nashik",
      districtNameMr: "नाशिक",
    },
    location: {
      stateId: "mh",
      stateName: "Maharashtra",
      districtId: "nashik",
      districtName: "Nashik",
      districtNameMr: "नाशिक",
      blockId: "niphad",
      blockName: "Niphad",
      blockNameMr: "निफाड",
      taluka: "Niphad",
      displayName: "Niphad Town, Niphad",
      latitude: 20.0827,
      longitude: 74.1105,
    },
    cropId: "onion",
    stageId: "vegetative",
    mpin: "1234",
    registeredAt: "2026-11-05T09:15:00.000Z",
  },
};

/**
 * Normalizes input phone string to 10-digit standard Indian format.
 */
export function normalizeMobile(mobile: string): string {
  const digits = (mobile || "").replace(/\D/g, "");
  if (digits.length > 10) {
    return digits.slice(-10);
  }
  return digits;
}

/**
 * Returns all registered farmers merged with defaults.
 */
export function getRegisteredFarmers(): Record<string, RegisteredFarmerRecord> {
  if (typeof window === "undefined") return DEFAULT_FARMERS_REGISTRY;
  try {
    const raw = window.localStorage.getItem(REGISTRY_STORAGE_KEY);
    if (!raw) {
      // Initialize with defaults on first run
      window.localStorage.setItem(
        REGISTRY_STORAGE_KEY,
        JSON.stringify(DEFAULT_FARMERS_REGISTRY)
      );
      return DEFAULT_FARMERS_REGISTRY;
    }
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_FARMERS_REGISTRY, ...parsed };
  } catch {
    return DEFAULT_FARMERS_REGISTRY;
  }
}

/**
 * Finds a registered farmer by their 10-digit mobile number.
 */
export function getFarmerByMobile(mobile: string): RegisteredFarmerRecord | null {
  const norm = normalizeMobile(mobile);
  if (!norm || norm.length !== 10) return null;
  const registry = getRegisteredFarmers();
  return registry[norm] || null;
}

/**
 * Saves or updates a farmer record in the persistent registry.
 */
export function saveFarmerToRegistry(record: RegisteredFarmerRecord): void {
  if (typeof window === "undefined") return;
  const norm = normalizeMobile(record.profile.mobileNumber);
  if (!norm || norm.length !== 10) return;

  try {
    const registry = getRegisteredFarmers();
    registry[norm] = record;
    window.localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(registry));
  } catch (err) {
    console.error("Failed to persist farmer to registry:", err);
  }
}

/**
 * Updates active crop and stage for a registered farmer by mobile number.
 */
export function updateFarmerCrop(mobile: string, cropId: string, stageId: string): void {
  if (typeof window === "undefined") return;
  const norm = normalizeMobile(mobile);
  if (!norm || norm.length !== 10) return;

  try {
    const registry = getRegisteredFarmers();
    if (registry[norm]) {
      registry[norm] = {
        ...registry[norm],
        cropId,
        stageId,
      };
      window.localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(registry));
    }
  } catch (err) {
    console.error("Failed to update farmer crop in registry:", err);
  }
}

/**
 * Updates location for a registered farmer by mobile number.
 */
export function updateFarmerLocation(mobile: string, location: SelectedLocation): void {
  if (typeof window === "undefined") return;
  const norm = normalizeMobile(mobile);
  if (!norm || norm.length !== 10) return;

  try {
    const registry = getRegisteredFarmers();
    if (registry[norm]) {
      registry[norm] = {
        ...registry[norm],
        location,
      };
      window.localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(registry));
    }
  } catch (err) {
    console.error("Failed to update farmer location in registry:", err);
  }
}

/**
 * Updates profile for a registered farmer by mobile number.
 */
export function updateFarmerProfile(mobile: string, profile: FarmerProfile): void {
  if (typeof window === "undefined") return;
  const norm = normalizeMobile(mobile);
  if (!norm || norm.length !== 10) return;

  try {
    const registry = getRegisteredFarmers();
    if (registry[norm]) {
      registry[norm] = {
        ...registry[norm],
        profile: {
          ...registry[norm].profile,
          ...profile,
        },
      };
      window.localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(registry));
    }
  } catch (err) {
    console.error("Failed to update farmer profile in registry:", err);
  }
}

/**
 * Returns list of registered farmers for demonstration / fast selection.
 */
export function getSampleFarmersList(): RegisteredFarmerRecord[] {
  const registry = getRegisteredFarmers();
  return Object.values(registry);
}

