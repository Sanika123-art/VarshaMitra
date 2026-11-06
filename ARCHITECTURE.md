# System Architecture

## 1. High-Level System Architecture

VarshaMitra implements a decoupled, production-grade pairing between a high-performance Python FastAPI backend and a Next.js 16 App Router frontend:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   Next.js 16 Frontend (Web & Mobile)                  │
│   • Bilingual UI (EN / MR)  • MapLibre GL 5.1.0  • Recharts Visuals   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / JSON
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Central Typed API Client (src/lib/api)              │
│   • api.searchLocations()   • api.reverseGeocodeLocation()             │
│   • api.getForecast()       • api.getClimateRisk()                     │
│   • api.getCropSuitability()• api.getSowingReadiness()                 │
│   • api.getCropAdvisory()   • api.getAdvisoryExplanation()             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ REST API
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   FastAPI Backend Core (backend/app)                   │
├───────────────────────────────────┬────────────────────────────────────┤
│ 1. Geospatial & Location Engine   │ 2. Meteorological Ingestion Engine │
│  • 36-District Gazetteer (~160 bl)│  • Open-Meteo High-Res Forecast    │
│  • Maharashtra Nominatim Resolver │  • Multi-Decadal Historical Store  │
│  • Dynamic Slug: geo_{lat}_{lon}  │  • SQLite Archive (1994–2024)      │
├───────────────────────────────────┼────────────────────────────────────┤
│ 3. Climate Indicators Suite       │ 4. Agronomic Rules & AI Engine     │
│  • Accumulation (7/14/30-day)     │  • MPKV Rahuri / PDKV Akola Logic  │
│  • Dry-Spell Severity Engine      │  • Vertisol / Laterite Soil Model  │
│  • Heavy Rainfall Event Flagging  │  • Sowing Readiness Calibrator     │
│  • Monsoon Onset Tracker          │  • NuGen LLM Grounded Explainers   │
└───────────────────────────────────┴────────────────────────────────────┘
```

---

## 2. Statewide Location Resolution Pipeline

The location engine allows any farmer in Maharashtra to resolve their exact location:

```
Farmer Input (Place Name, Village, PIN Code, Map Click, or GPS Coordinates)
                               │
                               ▼
        Is the query a Lat/Lon coordinate pair?
             /                           \
          [YES]                         [NO]
           │                              │
           │                     Query Local Maharashtra
           │                     Gazetteer (36 Districts, ~160 Talukas)
           │                              │
           │                     Found in Gazetteer?
           │                         /        \
           │                      [YES]       [NO]
           │                       │           │
           │                       │    Query OpenStreetMap Nominatim
           │                       │    (Bounded to MH: 15.6-22.15°N, 72.6-80.9°E)
           │                       │           │
           ▼                       ▼           ▼
   Validate Maharashtra Geographic Bounding Box
                               │
                               ▼
     Generate Canonical Location Entity (BlockDetail)
     ID: slug or dynamic geo_{lat}_{lon}
                               │
                               ▼
     Register into In-Memory Dynamic Location Registry
                               │
                               ▼
     All downstream routes (/rainfall, /risk, /crops/suitability, /advisories)
     immediately evaluate for this location ID without 404s!
```

---

## 3. Frontend Architecture

### Structure & Modules
```
src/
  app/                        # Next.js 16 App Router pages
    page.tsx                  # Public landing page
    login/page.tsx            # Role selection (Farmer / Officer)
    location/page.tsx         # Statewide search, PIN code, GPS & 36-district hub
    farmer/
      dashboard/page.tsx      # Calm daily decision dashboard
      climate/page.tsx        # High-resolution forecast & indicators
      risk-map/page.tsx       # Fullscreen MapLibre GL risk map
      crop/page.tsx           # Crop selection, soil suitability & sowing readiness
      advisory/page.tsx       # MPKV crop-stage advisory & NuGen explanations
    officer/
      dashboard/page.tsx      # Regional administrative overview
      risk-map/page.tsx       # Officer risk map with district drill-downs
    insights/page.tsx         # SQLite dataset summary & multi-decadal trends
    about/page.tsx            # Scientific provenance & institutional credits
    globals.css               # Agricultural design tokens
  components/                 # Modular design system (Cards, Badges, Buttons, Shell)
  features/                   # Feature-specific implementations
    risk-map/                 # MapLibre GL map, layers, and inspection panel
    charts/                   # Recharts probability bands and bar charts
  hooks/
    useAppState.tsx           # Global state: active role, location, selected crop
    useLocationLabel.ts       # Localized English & Marathi location formatter
  lib/api/
    client.ts                 # Centralized typed HTTP API client
    types.ts                  # TypeScript mirrors of backend Pydantic schemas
  i18n/
    LanguageContext.tsx       # Bilingual provider (English & Marathi)
    en.ts / mr.ts             # Translation dictionaries
  data/
    locations.ts              # Default fallback location coordinates
    crops.ts                  # Presentation icons & translation keys
    media.ts                  # Photography assets & crop thumbnails
```

### State Management
- **`AppStateProvider`** (`src/hooks/useAppState.tsx`): Manages the farmer's active location (`SelectedLocation`), selected crop (`cropId`), growth stage (`stageId`), and user role (`role`), automatically hydrated from and persisted to `localStorage`.
- **`LanguageProvider`** (`src/i18n/LanguageContext.tsx`): Reactive language toggle between English and Marathi (`mr`).

---

## 4. Backend Architecture

### Design Philosophy
1. **Authoritative Backend**: The backend is the single source of truth for all agricultural decisions, risk classifications, and meteorological evaluations. The frontend renders backend responses and never fabricates mock decision outputs.
2. **Deterministic Baseline**: Core agricultural advisories, sowing windows, and risk alerts are computed using deterministic rules codified from agricultural universities (MPKV Rahuri, PDKV Akola).
3. **Optional Explanatory LLM**: NuGen acts solely as an explanatory layer to translate complex agro-meteorological metrics into natural language; it never alters or overrides deterministic risk scores.
4. **Resilient Geocoding**: Rate-limited, cached geocoding protects external providers while ensuring 100% Maharashtra statewide coverage.
