# Architecture

## Conceptual pipeline (future, full system)

```
DATA SOURCES
    ↓
DATA PROCESSING
    ↓
CLIMATE PREDICTION ENGINE
    ↓
HYPERLOCAL RISK ENGINE
    ↓
AGRICULTURAL CONTEXT
    ↓
ADVISORY ENGINE
    ↓
WEB APPLICATION  ← you are here (this prototype)
```

Everything above "WEB APPLICATION" was the original roadmap. Across
Phases 1–6, this repository implemented both the web application layer and
the Python FastAPI backend service in [`backend/`](./backend/) (data processing,
indicators suite, heuristic risk scoring, soil profiles, and crop suitability).
See [`backend/README.md`](./backend/README.md) for detailed backend architecture.

## Frontend stack

- **Next.js 16** App Router, TypeScript, React 19
- **Tailwind CSS v4** (CSS-first `@theme` tokens, see `src/app/globals.css`)
- **react-leaflet / Leaflet** for the risk map
- **Recharts** for rainfall/temperature/historical charts
- **lucide-react** for icons

## Folder structure

```
src/
  app/                        Next.js routes
    page.tsx                  Landing page
    login/page.tsx
    location/page.tsx
    farmer/
      dashboard/page.tsx
      climate/page.tsx
      risk-map/page.tsx
      advisory/page.tsx
      crop/page.tsx
    officer/
      dashboard/page.tsx
      risk-map/page.tsx
    insights/page.tsx
    about/page.tsx
    layout.tsx                Providers + navbar/footer shell
    globals.css                Design tokens

  components/                 Shared, presentational UI
    Navbar.tsx
    Footer.tsx
    LanguageSwitcher.tsx
    RiskBadge.tsx
    ui.tsx                     PrototypeTag, SectionHeading, ProbabilityCard, StatTile

  features/
    risk-map/
      RiskMap.tsx              Leaflet map (client-only, dynamically imported)
      RiskMapExperience.tsx    Layer selector + legend + search + panel shell
      BlockPanel.tsx           "Why is this area at risk?" side panel
      riskLayers.ts            Per-layer risk scoring/bucketing

  data/                        Mock datasets + the prototype's "mock model"
    locations.ts               Maharashtra → districts → blocks
    crops.ts                   Crop + crop-stage catalogue
    climate.ts                 Deterministic seeded forecast generator
    advisories.ts               Rule-based advisory derivation
    officer.ts                  Regional aggregates, alerts
    insights.ts                  Historical mock trend data

  i18n/
    en.ts / mr.ts               Translation dictionaries (same shape)
    LanguageContext.tsx         Provider + t()/tList() hooks, localStorage-backed

  hooks/
    useAppState.tsx             Role, location, crop/stage — localStorage-backed

  types/index.ts                Shared domain types
  lib/utils.ts                  cn(), risk colour/label maps
```

## State management

Two small React context providers, both persisted to `localStorage`:

- **`LanguageProvider`** (`src/i18n/LanguageContext.tsx`) — current language,
  `t(key, vars?)` and `tList(key, vars?)` for translated strings/arrays.
- **`AppStateProvider`** (`src/hooks/useAppState.tsx`) — active role
  (farmer/officer), selected location, selected crop + stage.

No global state library is used; the app is small enough that two contexts
plus route-level `useState` cover it cleanly.

## Why the mock data is structured this way

`src/data/climate.ts` uses a seeded pseudo-random generator keyed by
`blockId + horizon` so the same block always produces the same forecast shape
across renders and reloads, instead of jittering randomly. `src/data/
advisories.ts` derives one of four "concerns" (dry / wet / uncertain onset /
stable) from a block's own probabilities, so the map colour, the dashboard
headline, and the advisory wizard are always internally consistent for a
given block — see `MOCK_DATA.md` for the full rationale.

## Swapping in a real backend later

Every data module in `src/data/` exports plain functions with the same
signatures a real API client would have (e.g. `getForecast(blockId, horizon)`,
`deriveAdvisory(blockId, cropId, stageId)`). Replacing a function body with a
`fetch()` call to the endpoints sketched in `FUTURE_BACKEND.md` is the entire
migration — no component above the data layer needs to change.
