# VarshaMitra — Hyperlocal Climate Risk Intelligence & Decision Support

[![Next.js](https://img.shields.io/badge/Next.js-16.3.4-black?logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.12-blue?logo=python)](https://python.org/)
[![MapLibre GL](https://img.shields.io/badge/MapLibre_GL-5.1.0-blue?logo=maplibre)](https://maplibre.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **PCCOE Indradhanu International Grand Challenge 2026 · AI for Climate Action**  
> *Hyperlocal rainfall intelligence and agricultural decision-support platform for farmers across Maharashtra.*

---

## 1. Product Vision & Philosophy

District-level weather bulletins tell you it will rain *"somewhere over Pune district"*. They do not tell a farmer in Maval or Baramati, growing soybean or cotton during sowing season, what action to take this week. 

That gap — between generic forecasts and actionable farm decisions — is where devastating crop losses happen:
- Sowing prematurely on a single misleading pre-monsoon shower.
- Running an expensive irrigation pump hours before heavy torrential rain.
- Unnoticed dry spells until root moisture is depleted and crops are irreversibly stressed.

**VarshaMitra's Core Principle:**
$$\text{PREDICT} \longrightarrow \text{VISUALIZE} \longrightarrow \text{DECIDE} \longrightarrow \text{ACT}$$

Every view provides a direct, actionable answer to a farmer's real question in their language (**English** or **मराठी**):
1. **What is likely to happen?** — Hyperlocal rainfall forecast & climate indicators (Open-Meteo High-Resolution Ensemble).
2. **What does it mean for my farm?** — Hyperlocal climate risk assessment & geospatial map across all 36 Maharashtra districts.
3. **What does it mean for my crop?** — Soil profile compatibility & MPKV Rahuri / PDKV Akola sowing readiness across 24 crops.
4. **What should I do right now?** — Actionable agronomic advisory with DO and AVOID guidance.
5. **How can I ask follow-up questions?** — Saarthi AI companion with persistent conversation history powered by NuGen Intelligence.

---

## 2. Statewide Maharashtra Coverage & Location Resolution

VarshaMitra supports **any location across all of Maharashtra** (36 districts, ~160 talukas, arbitrary villages, towns, PIN codes, and GPS farm coordinates):

- **Search by Place or Village**: Instant search covering all 36 districts and talukas (e.g., Alibaug, Panvel, Chiplun, Baramati, Niphad, Shirur).
- **Search by 6-digit Indian PIN Code**: Resolves postal locations (e.g., `410206`, `413102`) to administrative boundaries and coordinates.
- **Direct Map Click Selection**: Click anywhere within Maharashtra's geographic boundaries ($15.60^\circ\text{N} - 22.15^\circ\text{N}$, $72.60^\circ\text{E} - 80.90^\circ\text{E}$) to resolve and evaluate that farm location.
- **Device GPS Geolocation**: Single-click "Use My Farm Location (GPS)" using HTML5 browser geolocation.
- **Hybrid Geocoding Architecture**:
  1. Authoritative in-memory Maharashtra gazetteer (36 districts, ~160 talukas) for instant zero-latency resolution.
  2. OpenStreetMap Nominatim engine bounded to Maharashtra with rate limiting (1 req/sec) and a 2-hour TTL cache.
  3. Dynamic backend location registration (`geo_{lat}_{lon}`) ensuring all downstream weather, risk, and advisory APIs immediately resolve without 404s.

---

## 3. Technology Stack

### Frontend (`/src`)
- **Next.js 16.3.4 (App Router)** with React 19 and TypeScript.
- **Tailwind CSS v4** featuring an agricultural design system:
  - Deep Forest Green (`#1b3b2b`) for primary actions and navigation.
  - Monsoon Blue (`#1e5f74`) for rainfall intelligence.
  - Warm cream background (`#fbfbfa`) and restrained earthy accents.
- **MapLibre GL 5.1.0** with OpenStreetMap raster tiles (zero API key requirement).
- **Recharts** for rainfall probability bands and temperature series.
- **Lucide React** for iconography.
- **Bilingual i18n**: English and Marathi (`mr`) language support across all routes.

### Backend (`/backend`)
- **FastAPI (Python 3.12)** with Pydantic v2 schemas and strict typing.
- **Meteorological Provider**: Open-Meteo High-Resolution Weather API & Multi-Decadal Historical Archive.
- **Agronomic Rules Engine**: Package of Practices from Mahatma Phule Krishi Vidyapeeth (MPKV), Rahuri and Dr. PDKV, Akola.
- **Regional Soil Intelligence**: Agroclimatic soil baseline mapping (Vertisols / Black Cotton Soils vs. Coastal Laterites / Inceptisols).
- **NuGen AI Grounded Explanations & Saarthi Chat Companion**: Conversational assistant with persistent SQLite conversation history and explainability layer grounded in deterministic meteorological and agronomic evidence.
- **Local Persistence**: SQLite database storing multi-decadal historical climate series, dynamic geocoded locations, and Saarthi conversations.

---

## 4. Getting Started

### Prerequisites
- Node.js 18+ (Node 20+ recommended)
- Python 3.10+ (Python 3.12 recommended)
- Git

### Step 1: Start the FastAPI Backend
```bash
cd backend
python -m venv .venv

# Activate virtual environment
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# Linux / macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
Backend API will be active at `http://127.0.0.1:8000`.  
Interactive OpenAPI documentation is available at `http://127.0.0.1:8000/docs`.

### Step 2: Start the Next.js Frontend
In a separate terminal from repository root:
```bash
# Install frontend dependencies
npm install

# Start development server
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 5. Verification & Testing

Every layer of VarshaMitra includes automated verification suites:

```bash
# 1. Run Backend Pytest Suite (Unit, indicators, agronomy, geocoding)
pytest backend/tests -v

# 2. Run Frontend API Client Tests
npm run test:api

# 3. Run Live Integration Suite (verifies frontend connected to backend)
npm run test:integration

# 4. Lint Check
npm run lint

# 5. Production Build
npm run build
```

---

## 6. Project Structure

```
├── backend/                  # Python FastAPI service
│   ├── app/
│   │   ├── api/routes/       # Endpoints: locations, rainfall, climate, risk, soil, crops, advisories
│   │   ├── core/             # Configuration, settings, and climate constants
│   │   ├── data/             # 36-district gazetteer, crops catalogue, regional soil data
│   │   ├── schemas/          # Pydantic data contracts (locations, agronomy, soil, explanation)
│   │   └── services/         # Geocoder, risk engine, MPKV advisory engine, NuGen explanation
│   ├── tests/                # Pytest suites
│   └── requirements.txt
├── src/                      # Next.js 16 App Router frontend
│   ├── app/                  # Routes: /, /location, /farmer/*, /officer/*, /insights, /about
│   ├── components/           # UI primitives (Cards, Badges, Buttons, Header, Shell)
│   ├── features/             # MapLibre risk map, charts, block inspector
│   ├── hooks/                # AppState (location, crop, role) and useLocationLabel
│   ├── i18n/                 # English (en) and Marathi (mr) localization dictionaries
│   ├── lib/api/              # Typed API client connecting to FastAPI backend
│   └── types/                # Core domain types
├── tests/                    # Frontend Vitest suites (client and live integration)
├── ARCHITECTURE.md           # Deep-dive architectural documentation
├── DATA_SOURCES.md           # Authoritative meteorological & agronomic data provenance
└── PHASE7_READINESS.md       # Quality audit, security review, and deployment checklist
```

---

## 7. Data Provenance & Disclosures

- **Weather & Rainfall Forecasts**: Open-Meteo High-Resolution Ensemble Model.
- **Historical Observations**: Open-Meteo Historical Archive / ERA5-Land reanalysis.
- **Crop Rules & Sowing Calendars**: Mahatma Phule Krishi Vidyapeeth (MPKV), Rahuri and Dr. Panjabrao Deshmukh Krishi Vidyapeeth (PDKV), Akola.
- **Soil Baseline Data**: ICAR-NBSS&LUP agroclimatic soil classification. Regional Vertisol / Laterite baseline models are clearly identified as modeled estimates.
- **Administrative Coordinates**: Centroids and geocoded points are geographic references; they do not represent surveyed cadastral farm boundaries.

---

## 8. License

Distributed under the MIT License. See `LICENSE` for details.
