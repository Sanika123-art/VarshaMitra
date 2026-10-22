import type { Block, District, SelectedLocation } from "@/types";

export const stateInfo = {
  id: "mh",
  name: "Maharashtra",
  nameMr: "महाराष्ट्र",
};

// Coordinates are approximate district/taluka centroids — good enough for a
// prototype map, not survey-grade. Real boundaries would come from
// government GeoJSON (see DATA_SOURCES.md).
export const districts: District[] = [
  {
    id: "pune",
    name: "Pune",
    nameMr: "पुणे",
    stateId: "mh",
    lat: 18.5204,
    lng: 73.8567,
    blocks: [
      {
        id: "maval",
        name: "Maval",
        nameMr: "मावळ",
        districtId: "pune",
        lat: 18.6,
        lng: 73.45,
        risk: "high",
        monsoonOnsetProbability: 71,
        drySpellProbability: 38,
        heavyRainProbability: 64,
        agriculturalImpact: "Moderate–High",
        riskDrivers: ["weakOnset", "drySpellAhead", "terrainDrainage"],
      },
      {
        id: "baramati",
        name: "Baramati",
        nameMr: "बारामती",
        districtId: "pune",
        lat: 18.15,
        lng: 74.58,
        risk: "critical",
        monsoonOnsetProbability: 46,
        drySpellProbability: 67,
        heavyRainProbability: 22,
        agriculturalImpact: "High",
        riskDrivers: ["lowSoilMoisture", "enso", "drySpellAhead"],
      },
      {
        id: "daund",
        name: "Daund",
        nameMr: "दौंड",
        districtId: "pune",
        lat: 18.46,
        lng: 74.58,
        risk: "moderate",
        monsoonOnsetProbability: 63,
        drySpellProbability: 41,
        heavyRainProbability: 35,
        agriculturalImpact: "Moderate",
        riskDrivers: ["weakOnset", "lowSoilMoisture"],
      },
    ],
  },
  {
    id: "nashik",
    name: "Nashik",
    nameMr: "नाशिक",
    stateId: "mh",
    lat: 20.0,
    lng: 73.79,
    blocks: [
      {
        id: "niphad",
        name: "Niphad",
        nameMr: "निफाड",
        districtId: "nashik",
        lat: 20.08,
        lng: 74.11,
        risk: "moderate",
        monsoonOnsetProbability: 68,
        drySpellProbability: 30,
        heavyRainProbability: 40,
        agriculturalImpact: "Moderate",
        riskDrivers: ["weakOnset", "convectiveBurst"],
      },
      {
        id: "sinnar",
        name: "Sinnar",
        nameMr: "सिन्नर",
        districtId: "nashik",
        lat: 19.85,
        lng: 73.99,
        risk: "low",
        monsoonOnsetProbability: 81,
        drySpellProbability: 18,
        heavyRainProbability: 33,
        agriculturalImpact: "Low",
        riskDrivers: ["iod"],
      },
    ],
  },
  {
    id: "ahilyanagar",
    name: "Ahilyanagar",
    nameMr: "अहिल्यानगर",
    stateId: "mh",
    lat: 19.09,
    lng: 74.74,
    blocks: [
      {
        id: "shrirampur",
        name: "Shrirampur",
        nameMr: "श्रीरामपूर",
        districtId: "ahilyanagar",
        lat: 19.62,
        lng: 74.66,
        risk: "high",
        monsoonOnsetProbability: 52,
        drySpellProbability: 58,
        heavyRainProbability: 27,
        agriculturalImpact: "High",
        riskDrivers: ["enso", "lowSoilMoisture", "drySpellAhead"],
      },
      {
        id: "rahuri",
        name: "Rahuri",
        nameMr: "राहुरी",
        districtId: "ahilyanagar",
        lat: 19.39,
        lng: 74.65,
        risk: "moderate",
        monsoonOnsetProbability: 66,
        drySpellProbability: 35,
        heavyRainProbability: 30,
        agriculturalImpact: "Moderate",
        riskDrivers: ["weakOnset"],
      },
    ],
  },
  {
    id: "kolhapur",
    name: "Kolhapur",
    nameMr: "कोल्हापूर",
    stateId: "mh",
    lat: 16.7,
    lng: 74.24,
    blocks: [
      {
        id: "karvir",
        name: "Karvir",
        nameMr: "करवीर",
        districtId: "kolhapur",
        lat: 16.68,
        lng: 74.28,
        risk: "moderate",
        monsoonOnsetProbability: 74,
        drySpellProbability: 20,
        heavyRainProbability: 58,
        agriculturalImpact: "Moderate",
        riskDrivers: ["convectiveBurst", "terrainDrainage"],
      },
      {
        id: "panhala",
        name: "Panhala",
        nameMr: "पन्हाळा",
        districtId: "kolhapur",
        lat: 16.81,
        lng: 74.11,
        risk: "critical",
        monsoonOnsetProbability: 79,
        drySpellProbability: 12,
        heavyRainProbability: 83,
        agriculturalImpact: "High",
        riskDrivers: ["heavySoilSaturation", "terrainDrainage", "convectiveBurst"],
      },
    ],
  },
  {
    id: "satara",
    name: "Satara",
    nameMr: "सातारा",
    stateId: "mh",
    lat: 17.69,
    lng: 74.0,
    blocks: [
      {
        id: "wai",
        name: "Wai",
        nameMr: "वाई",
        districtId: "satara",
        lat: 17.95,
        lng: 73.9,
        risk: "low",
        monsoonOnsetProbability: 77,
        drySpellProbability: 22,
        heavyRainProbability: 45,
        agriculturalImpact: "Low",
        riskDrivers: ["iod"],
      },
      {
        id: "phaltan",
        name: "Phaltan",
        nameMr: "फलटण",
        districtId: "satara",
        lat: 17.99,
        lng: 74.43,
        risk: "high",
        monsoonOnsetProbability: 49,
        drySpellProbability: 60,
        heavyRainProbability: 19,
        agriculturalImpact: "High",
        riskDrivers: ["lowSoilMoisture", "enso"],
      },
    ],
  },
  {
    id: "solapur",
    name: "Solapur",
    nameMr: "सोलापूर",
    stateId: "mh",
    lat: 17.66,
    lng: 75.91,
    blocks: [
      {
        id: "barshi",
        name: "Barshi",
        nameMr: "बार्शी",
        districtId: "solapur",
        lat: 18.23,
        lng: 75.69,
        risk: "critical",
        monsoonOnsetProbability: 41,
        drySpellProbability: 71,
        heavyRainProbability: 15,
        agriculturalImpact: "High",
        riskDrivers: ["enso", "lowSoilMoisture", "drySpellAhead"],
      },
      {
        id: "karmala",
        name: "Karmala",
        nameMr: "करमाळा",
        districtId: "solapur",
        lat: 18.41,
        lng: 75.19,
        risk: "moderate",
        monsoonOnsetProbability: 59,
        drySpellProbability: 44,
        heavyRainProbability: 24,
        agriculturalImpact: "Moderate",
        riskDrivers: ["weakOnset", "lowSoilMoisture"],
      },
    ],
  },
  {
    id: "nandurbar",
    name: "Nandurbar",
    nameMr: "नंदुरबार",
    stateId: "mh",
    lat: 21.37,
    lng: 74.24,
    blocks: [
      {
        id: "shahada",
        name: "Shahada",
        nameMr: "शहादा",
        districtId: "nandurbar",
        lat: 21.55,
        lng: 74.47,
        risk: "moderate",
        monsoonOnsetProbability: 65,
        drySpellProbability: 33,
        heavyRainProbability: 37,
        agriculturalImpact: "Moderate",
        riskDrivers: ["weakOnset"],
      },
      {
        id: "navapur",
        name: "Navapur",
        nameMr: "नवापूर",
        districtId: "nandurbar",
        lat: 21.16,
        lng: 73.79,
        risk: "low",
        monsoonOnsetProbability: 83,
        drySpellProbability: 14,
        heavyRainProbability: 41,
        agriculturalImpact: "Low",
        riskDrivers: ["iod"],
      },
    ],
  },
];

export function allBlocks(): Block[] {
  return districts.flatMap((d) => d.blocks);
}

export function getBlock(blockId: string): Block | undefined {
  return allBlocks().find((b) => b.id === blockId);
}

export function getDistrict(districtId: string): District | undefined {
  return districts.find((d) => d.id === districtId);
}

export function getDistrictOfBlock(blockId: string): District | undefined {
  return districts.find((d) => d.blocks.some((b) => b.id === blockId));
}

export const defaultLocation: SelectedLocation = {
  stateId: "mh",
  stateName: "Maharashtra",
  districtId: "pune",
  districtName: "Pune",
  blockId: "maval",
  blockName: "Maval",
};

/** Maps the short agricultural-impact label on a block to an i18n key. */
export function impactLabelKey(block: Block): string {
  switch (block.agriculturalImpact) {
    case "Low":
      return "impact.low";
    case "Moderate":
      return "impact.moderate";
    case "Moderate–High":
      return "impact.moderateHigh";
    default:
      return "impact.high";
  }
}

/** [west, south, east, north] bounds enclosing the given blocks, for map fitting. */
export function boundsOf(blocks: Block[]): [[number, number], [number, number]] {
  const lngs = blocks.map((b) => b.lng);
  const lats = blocks.map((b) => b.lat);
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ];
}
