# Future AI / ML Plan

**No ML inference runs in this prototype.** Every probability shown in the
app is produced by a deterministic, seeded mock generator
(`src/data/climate.ts`) so the demo is stable and reproducible, not by a
trained model. This document describes the intended future pipeline only.

## Conceptual pipeline

```
Data ingestion
  → cleaning
  → feature engineering
  → climate signal extraction
  → prediction model
  → probabilistic forecast
  → hyperlocal downscaling
  → risk engine
  → crop-context engine
  → advisory engine
```

## Data ingestion & cleaning

Pull IMD rainfall/temperature observations, ERA5-Land reanalysis, and
ENSO/IOD/MJO indices (see `DATA_SOURCES.md`) on a scheduled basis; align to a
common spatial grid and temporal resolution; handle missing station data via
standard gap-filling (not invented for this document — this would follow
established climate-data QC practice).

## Feature engineering & signal extraction

Derive lagged and rolling features (recent rainfall anomaly, antecedent soil
moisture, days since last rainfall event) and encode large-scale signal state
(ENSO phase, IOD phase, active/inactive MJO phase) as model inputs alongside
location and calendar features (day-of-year, district, crop calendar phase).

## Prediction model families (candidates, not committed)

- Gradient-boosted trees (e.g. LightGBM/XGBoost) for tabular
  probability-of-event outputs (onset probability, dry-spell probability,
  heavy-rain probability) — a reasonable first baseline given limited
  hyperlocal training data.
- A sequence model (e.g. temporal convolutional network or lightweight
  transformer) if enough historical station-day data is available to model
  onset timing directly rather than as a fixed-window probability.
- Statistical downscaling / bias-correction on top of coarser numerical
  weather prediction output, rather than training a fully independent
  forecast model from scratch, given realistic data constraints for a
  hackathon-to-production timeline.

These are documented as **candidates for evaluation**, not as a finalised
architecture — the right choice depends on how much labelled hyperlocal
history is actually available per block.

## Hyperlocal downscaling

District/gridded model output is downscaled to block level using a
combination of terrain, historical station bias, and proximity-weighted
interpolation — the mechanism a real GIS/climate team would validate against
held-out station data before trusting it operationally.

## Risk engine

Converts calibrated probabilities into the four-level risk categories used
throughout the UI (Low / Moderate / High / Critical) using thresholds tuned
against historical crop-loss data, not the placeholder thresholds used in
this prototype's `riskLayers.ts`.

## Crop-context & advisory engine

Combines the risk engine's output with crop calendars and crop-stage
sensitivity (e.g. soybean at sowing is moisture-sensitive in a different way
than at grain-fill) to select or generate the recommendation — this
prototype's rule-based `src/data/advisories.ts` is a stand-in for this
engine, built to have the same input/output shape.

## Model evaluation

**No accuracy numbers are shown anywhere in this product**, and none should
be added until real model evaluation exists. Once training data and a
trained model are available, evaluation should be reported per risk category
(onset / dry-spell / heavy-rain) with a stated evaluation period and held-out
region, using the placeholder language already present in the officer
dashboard: *"Model evaluation — to be populated after training."*
