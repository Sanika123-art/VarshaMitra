# Features

## 1. Hyperlocal monsoon intelligence — `/farmer/climate`

- 7 / 14 / 30-day forecast horizon tabs.
- Monsoon onset probability, dry-spell probability, heavy-rain probability,
  each shown as an animated probability card with a count-up and a progress
  bar.
- A stated **confidence level** (low / medium / high) that widens as the
  horizon lengthens — the prototype is deliberately less confident at 30
  days than at 7, rather than pretending otherwise.
- An expected rainfall trend chart (band chart with expected/lower/upper
  bounds) and a temperature trend line chart, both built with Recharts.
- Climate signal indicators (e.g. "weak El Niño signal", "positive Indian
  Ocean Dipole") shown as a labelled list — these map to the real large-scale
  signals the future system would ingest (see `DATA_SOURCES.md`).
- Every value on this page is explicitly labelled prototype/simulated data.

## 2. Hyperlocal climate risk map — `/farmer/risk-map`, `/officer/risk-map`

- Full-screen Leaflet map of Maharashtra with all seven prototype districts
  and their blocks plotted as risk-coloured markers.
- Five switchable layers: Overall Risk, Rainfall Risk, Dry-Spell Risk,
  Heavy-Rain Risk, Monsoon Onset Risk — each recolours the same markers using
  a different derived score (`src/features/risk-map/riskLayers.ts`).
- Location search, a risk legend, and a click-to-inspect side panel showing
  the block's probabilities, agricultural impact, and a **"why is this area
  at risk?"** explanation built from named risk drivers rather than a raw
  score.
- A direct link from the panel into the crop advisory flow for that block.

## 3. Crop-specific actionable advisory — `/farmer/advisory`

- A 4-step wizard: confirm location → choose crop → choose crop stage →
  generate advisory.
- The recommendation is produced by a small rule engine
  (`src/data/advisories.ts`) that looks at the block's dominant risk
  (dry-spell / heavy-rain / uncertain-onset / stable) and the crop stage, and
  picks from a set of plain-language advisory templates — never generic
  "AI-sounding" text.
- An expandable **"why this recommendation?"** section, a water-action line,
  a "watch for" line, the list of factors used, and a causal-flow visual
  (climate signal → agricultural impact → recommended action).
- The same rule engine drives the farmer dashboard's daily recommendation and
  the officer dashboard's per-block recommended action, so the numbers, the
  map colour, and the advisory always tell the same story.

## Farmer experience — `/farmer/dashboard`

A deliberately calm "what should I know today" summary: greeting, current
block, one overall risk badge, a one-line monsoon/rain/crop summary, the main
recommendation with its reasoning tucked behind a disclosure, a risk
snapshot, recent alerts for the block, and four quick actions. No raw tables,
no dense analytics.

## Officer experience — `/officer/dashboard`

A regional analytics view: counts of high/critical/moderate/low-risk blocks,
a clickable high-risk locations list with a drill-down inspect panel (risk
drivers + recommended action for the selected block), crop exposure by
estimated risk, recent climate alerts, and a data/model status panel that is
explicit about being prototype output.

## Climate insights — `/insights`

Historical rainfall anomaly and dry-spell-day charts (10 mock seasons),
average dry-spell frequency by district, and a short list of recognisable
crop-risk patterns — all explicitly labelled "historical analysis — prototype
data."

## Location & crop selection — `/location`, `/farmer/crop`

State → district → block drill-down (state is fixed to Maharashtra for the
prototype) and a crop + crop-stage picker. Both persist to `localStorage` via
`useAppState` so the rest of the app is personalised immediately.

## Language switching — everywhere

Every piece of interface text — navigation, buttons, cards, the map legend,
advisory copy, alerts, empty states — is resolved through
`src/i18n/LanguageContext.tsx` from `src/i18n/en.ts` / `src/i18n/mr.ts`.
Switching language in the navbar re-renders the entire interface immediately
and persists the choice.

## Login / role selection — `/login`

A split visual layout with a prototype login form (not wired to a real
auth service) and two working "Continue as demo farmer / officer" buttons
that set the active role and route into the corresponding experience.
