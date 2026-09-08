# Mock Data

Every number in this prototype is generated locally — there is no network
call to any weather, climate or GIS API. This document explains how the mock
data is structured and why, so it reads as one coherent demo rather than
random numbers.

## Locations — `src/data/locations.ts`

Seven Maharashtra districts (Pune, Nashik, Ahilyanagar, Kolhapur, Satara,
Solapur, Nandurbar), each with two or three blocks. Each block has:

- Approximate centroid coordinates (good enough for a prototype map, **not**
  survey-grade — see `DATA_SOURCES.md` for real boundary sources).
- A hand-assigned overall risk level and onset/dry-spell/heavy-rain
  probabilities, chosen so nearby numbers tell a consistent story (e.g.
  Baramati has low onset probability **and** high dry-spell probability
  **and** an ENSO-related risk driver — not three unrelated random numbers).
- A short list of `riskDrivers` keys (e.g. `enso`, `weakOnset`,
  `terrainDrainage`) that both the map's "why is this area at risk?" panel
  and the advisory engine read from, so the explanation a farmer sees and the
  recommendation they get are always derived from the same underlying
  factors.

## Climate forecasts — `src/data/climate.ts`

`getForecast(blockId, horizon)` is a **deterministic, seeded** generator: it
hashes `blockId + horizon` into a seed so the same block/horizon combination
always produces the same rainfall trend and temperature trend on every
render and reload, instead of jittering randomly on each page view — a
prototype should feel like one stable forecast, not noise.

- Longer horizons apply a probability "drift" and widen the uncertainty band,
  which is also used to compute a **confidence level** (high/medium/low) —
  30-day forecasts are deliberately shown as less confident than 7-day ones.
- Rainfall trend points dip during the expected dry-spell window when a
  block's dry-spell probability is high, so the chart visually matches the
  advisory's "dry spell likely" language instead of contradicting it.

## Crop advisory logic — `src/data/advisories.ts`

`deriveAdvisory(blockId, cropId, stageId)` picks one of four "concerns" from
the block's own probabilities:

| Concern | Trigger |
|---|---|
| `dry` | dry-spell probability ≥ 55% |
| `wet` | heavy-rain probability ≥ 55% (checked after `dry`) |
| `uncertainOnset` | monsoon onset probability < 55% |
| `stable` | none of the above |

Each concern has a sowing-specific and a non-sowing-specific set of
translated templates (`src/i18n/en.ts` / `mr.ts` → `advisoryTemplates`), so
"delay sowing" language only appears when the crop stage actually is sowing,
and other stages get moisture/drainage guidance appropriate to an established
crop instead.

## Officer aggregates — `src/data/officer.ts`

Region-wide counts (`regionRiskCounts`) and the high-risk locations list are
**derived from the same block data** above, not separately hand-typed — so
the officer dashboard's numbers always match what the risk map shows. Crop
exposure and alerts are hand-authored mock lists referencing real block IDs,
so alerts link correctly into the map and dashboard.

## Historical insights — `src/data/insights.ts`

Ten seasons (2016–2025) of mock rainfall-anomaly and dry-spell-day data,
plus a district-level average dry-spell frequency ranking and a short list of
recognisable crop-risk patterns. Clearly labelled "historical analysis —
prototype data" in the UI.

## What would change with a real backend

Every function above keeps the same name and signature a real API client
would use. See `ARCHITECTURE.md` → "Swapping in a real backend later" and
`FUTURE_BACKEND.md` for the intended replacement.
