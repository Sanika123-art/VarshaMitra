# Data Sources (Future Integrations)

This prototype uses **local mock data only** (`src/data/`). Nothing in this
repository calls a live weather or climate API. This document lists the real
data sources the production system is designed to eventually ingest.

## Rainfall & surface weather

- **IMD (India Meteorological Department)** rainfall observations and
  gridded rainfall products — the primary ground-truth rainfall source.
- **IMD** climate datasets (temperature, humidity) for feature engineering
  and bias-correction of downscaled model output.

## Large-scale climate signals

- **NOAA ONI / ENSO** index — El Niño / La Niña state, a major driver of
  Indian monsoon variability.
- **Bureau of Meteorology (Australia) IOD** index — Indian Ocean Dipole,
  which modulates monsoon rainfall independently of ENSO.
- **Bureau of Meteorology (Australia) MJO** index — Madden–Julian
  Oscillation, relevant to sub-seasonal (2–4 week) rainfall bursts and dry
  spells.

## Reanalysis & soil data

- **Copernicus ERA5-Land** — reanalysis fields (precipitation, temperature,
  soil moisture) for historical training data and gap-filling.
- **Copernicus soil moisture products** — direct input to dry-spell and
  moisture-stress risk scoring.

## Agricultural & administrative context

- **Government crop calendars** — expected sowing/growth/harvest windows by
  crop and district, used to contextualise crop-stage-specific advisories.
- **Government crop production data** — historical yield and area data for
  validating the eventual risk model against real outcomes.
- **Government administrative boundaries** (state/district/block/panchayat
  GeoJSON) — to replace this prototype's approximate centroid coordinates
  with real polygon boundaries on the risk map.

## What this prototype uses instead

`src/data/locations.ts`, `src/data/climate.ts`, `src/data/crops.ts` and
`src/data/officer.ts` contain hand-authored, internally-consistent mock data
for seven Maharashtra districts and their blocks, generated deterministically
so the same block always tells the same climate story (see `MOCK_DATA.md`).
This mock data is structured to mirror the shape the real sources above would
eventually populate, so the data layer — not the UI — is what changes when
real integrations are added.

## Non-negotiable framing

VarshaMitra is designed to **complement** IMD and other official sources, not
replace them. No screen in this product claims to be an authoritative
forecast, and no accuracy metric is shown anywhere, because no model has
been trained on real data yet.
