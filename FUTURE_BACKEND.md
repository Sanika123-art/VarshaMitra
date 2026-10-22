# Future Backend (Historical Planning Document)

> [!NOTE]
> **Implementation Status Notice (Phases 1–6 Completed)**:
> The backend sketched conceptually below has now been implemented as a Python FastAPI service under [`backend/`](./backend/) (Phases 1–5) and integrated with the Next.js frontend (Phase 6).
>
> For the active backend architecture, live endpoints, agronomic models, and run instructions, please refer to [`backend/README.md`](./backend/README.md).

**Historical context from initial prototype:** This prototype was originally
frontend-only, reading from local TypeScript mock data. This document
sketches the backend a production version would need.

## Suggested stack

- **Python + FastAPI** — inference and aggregation service, sitting in front
  of the trained model(s) described in `AI_ML_PLAN.md`.
- **PostgreSQL + PostGIS** (or a managed equivalent like Supabase) — stores
  administrative boundaries, historical observations, and generated
  forecasts/advisories with proper spatial querying.
- **ML inference service** — could be a separate lightweight service (e.g. a
  container serving the trained gradient-boosted model) called by the
  FastAPI layer, or embedded directly if load is low.
- **Real weather/climate API integrations** — IMD, ERA5-Land, ENSO/IOD/MJO
  index feeds, ingested on a schedule (see `DATA_SOURCES.md`).
- **GeoJSON** — official administrative boundary files for state/district/
  block/panchayat, replacing this prototype's centroid-only coordinates.
- **Notification service** (e.g. SMS/voice gateway) — for the future
  "farmers without smartphones" channel mentioned on the landing page.

## Conceptual API surface

These are illustrative endpoint shapes matching the data this frontend
already expects from `src/data/*` — not an implemented or committed contract.

```
GET /locations
    → list of states/districts/blocks (replaces src/data/locations.ts)

GET /forecast/{blockId}?horizon=7|14|30
    → { monsoonOnsetProbability, drySpellProbability, heavyRainProbability,
        confidence, rainfallTrend[], temperatureTrendC[], signals[] }
    (replaces src/data/climate.ts:getForecast)

GET /risk/{blockId}
    → { risk, riskDrivers[], agriculturalImpact }
    (replaces the risk fields on src/data/locations.ts:Block)

GET /climate-signals
    → current ENSO/IOD/MJO phase and any other large-scale signal state

GET /crop-advisory?blockId=...&cropId=...&stageId=...
    → { headline, reason, steps[], waterAction, watchFor, factors[] }
    (replaces src/data/advisories.ts:deriveAdvisory)
```

## Migration path

Because every mock-data function in `src/data/` already has the signature a
real client would have, the frontend migration is: replace each function
body with a `fetch()`/`axios` call to the corresponding endpoint above, add
loading/error states where the current synchronous mock calls don't need
them, and remove the deterministic seeded generator in `climate.ts`. No
component in `src/app/` or `src/features/` needs to change.
