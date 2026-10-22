# VarshaMitra — FastAPI Backend Service

This directory contains the Python FastAPI backend service for **VarshaMitra**, providing the foundation for climate-risk intelligence and agricultural decision support.

Phase 1 provides the foundational service architecture: typed settings, structured logging, safe exception handling, CORS middleware, unversioned and versioned health checks, and interactive API documentation.

---

## Directory Structure

```text
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # Application factory, middleware & route mounting
│   ├── api/
│   │   ├── __init__.py
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   └── health.py     # GET /health implementation
│   │   └── v1/
│   │       ├── __init__.py
│   │       └── router.py     # Central /api/v1 router
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py         # Pydantic Settings configuration
│   │   ├── errors.py         # Safe sanitized exception handlers
│   │   └── logging.py        # Safe structured logging
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── health.py         # Pydantic schemas (HealthResponse)
│   └── services/
│       └── __init__.py       # Service layer for upcoming phases
├── tests/
│   ├── __init__.py
│   ├── conftest.py           # Pytest test client fixture
│   └── test_health.py        # Health, OpenAPI, CORS & error tests
├── .env.example              # Environment variables template
├── requirements.txt          # Production and testing dependencies
└── README.md                 # Service documentation and run guide
```

---

## Prerequisites

- **Python**: 3.10, 3.11, or 3.12 (Python 3.12.3 verified)
- **Pip**: Latest version

---

## Quickstart

### 1. Create and Activate Virtual Environment

**On Windows (Git Bash / MinGW64):**
```bash
cd backend
python -m venv .venv
source .venv/Scripts/activate
```

**On Windows (PowerShell):**
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

**On macOS / Linux (bash/zsh):**
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Environment Configuration

Copy `.env.example` to `.env`:

**Windows PowerShell:**
```powershell
Copy-Item .env.example .env
```

**Git Bash / macOS / Linux:**
```bash
cp .env.example .env
```

### 4. Run the Development Server

**When working inside the `backend/` directory (`d:\hyperlocal\backend`):**
```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
*(Note: Use `app.main:app` here because `app` is a direct child of `backend/`)*

**When working from the repository root (`d:\hyperlocal`):**
```bash
uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```
*or:*
```bash
uvicorn app.main:app --app-dir backend --reload --host 127.0.0.1 --port 8000
```

The service will start at `http://127.0.0.1:8000`.

---

## Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Service root metadata & links |
| `GET` | `/health` | Unversioned stable service health status |
| `GET` | `/api/v1/health` | Versioned service health status |
| `GET` | `/api/v1/locations/districts` | List 7 curated Maharashtra focus districts |
| `GET` | `/api/v1/locations/districts/{id}` | District details with member blocks |
| `GET` | `/api/v1/locations/blocks` | List administrative blocks (optional `?district_id=...`) |
| `GET` | `/api/v1/locations/blocks/{id}` | Block details with parent hierarchy & coordinates |
| `GET` | `/api/v1/locations/coverage` | Transparent data scope, limitations & gazetteer source |
| `GET` | `/api/v1/rainfall/observations/{block_id}` | Daily rainfall series with quality flags & attribution (`?days=7&provider=...`) |
| `GET` | `/api/v1/rainfall/forecast/{block_id}` | Future forward weather forecast outlook 1 to 14 days (`?days=14`) |
| `GET` | `/api/v1/rainfall/historical/{block_id}` | Historical ERA5-Land reanalysis for custom window (`?start_date=...&end_date=...`) |
| `GET` | `/api/v1/rainfall/source-status` | Operational status & required credentials for all providers |
| `GET` | `/api/v1/climate/indicators/{block_id}` | Deterministic agro-climatic indicators suite (`?window_days=14&provider=...`) |
| `GET` | `/api/v1/climate/ml-boundary` | Formal ML feature/target contracts and temporal evaluation protocol |
| `GET` | `/api/v1/risk/{block_id}` | Explainable agro-climatic hazard risk assessment with drivers & limitations |
| `GET` | `/api/v1/dataset/inventory` | Catalog of all 8 evaluated candidate & integrated climate data sources |
| `POST`| `/api/v1/dataset/ingest` | Incremental historical reanalysis ingestion into local SQLite storage |
| `GET` | `/api/v1/dataset/records/{block_id}` | Query stored historical records from local database |
| `GET` | `/api/v1/dataset/summary` | Summary coverage statistics of stored climate dataset |
| `GET` | `/api/v1/soil/{block_id}` | Regional soil property profile (texture, pH, OC, CEC, AWC, depth) |
| `POST`| `/api/v1/soil/test-profile` | Register farmer field-specific soil test report (Soil Health Card) |
| `GET` | `/api/v1/soil/test-profile/{block_id}` | Retrieve latest registered field soil test for location |
| `GET` | `/api/v1/crops` | List supported crops and requirements (optional `?season=...`) |
| `GET` | `/api/v1/crops/details/{crop_id}` | Detailed crop agronomic specifications, growth stages & sensitivities |
| `GET` | `/api/v1/crops/suitability/{block_id}` | Explainable crop suitability evaluation (`?season=...&water_source=...`) |
| `GET` | `/api/v1/crops/sowing-readiness/{block_id}` | Sowing window & moisture readiness assessment (`?crop_id=...&date=...`) |
| `GET` | `/api/v1/advisories` | Crop-stage specific agro-advisories (`?location_id=...&crop_id=...&stage_id=...&language=en|mr`) |
| `POST`| `/api/v1/advisories/{advisory_id}/explanation` | Grounded NuGen LLM explanation of validated advisory (`en` or `mr`) |
| `GET` | `/docs` | Interactive Swagger UI (disabled in production) |
| `GET` | `/redoc` | Interactive ReDoc UI (disabled in production) |
| `GET` | `/openapi.json` | OpenAPI 3.1 JSON specification |


---

## Phase 3 — Climate Indicators & Explainable Risk Engine

### 1. Pure Deterministic Indicators
- **Accumulation**: Window sum in mm, valid vs. missing days count, and daily average. Missing data is never silently set to 0.0.
- **Dry Spells**: IMD-standard threshold (< 2.5 mm/day). Tracks total dry days, maximum continuous streak, and current streak. Classified into `none` (<5 days), `mild` (5–6 days), `significant` (7–13 days), and `critical` (>=14 days). Missing days break continuous streaks.
- **Heavy Rain**: IMD standard (>= 64.5 mm/day) and very heavy rain (>= 115.6 mm/day). Logs exact event calendar dates.
- **Rainfall Anomaly**: Compares observed sum to 30-year IMD climatological normal: `(Observed - Normal) / Normal * 100`. Returns `insufficient_baseline_data` when normal is uncalibrated.
- **Monsoon Onset**: Operational Maharashtra surveillance window (June 1 – July 15). Criterion: 2 consecutive days >= 2.5 mm each, with 2-day sum >= 25.0 mm.

### 2. Explainable Heuristic Risk Engine
- Synthesizes indicators into calibrated risk levels: `low`, `moderate`, `high`, `critical`, or `insufficient_data`.
- Returns explicit `risk_drivers` with numerical evidence (e.g., `criticalDrySpell`, `heavySoilSaturation`).
- Strictly enforces `insufficient_data` when data coverage < 75%.
- Statistically defined confidence: `high` (>=90% valid data & fresh), `medium` (>=75%), `low` (<75%), `none` (<60%).

### 3. Machine Learning Boundary
- Declares `heuristic_baseline_operational` with zero fabricated metrics.
- Defines future contracts for features (7d/14d rolling, harmonic DOY, ICAR soil series) and targets (7d dry spell, 3d heavy rain).
- Outlines temporal walk-forward split (1991–2018 train, 2019–2021 val, 2022–2024 test) and Brier Skill Score benchmarks.

---

## Phase 4 — Integrated Crop Suitability, Sowing Intelligence & Crop-Specific Advisory Engine

### 1. Soil Intelligence & Dual-Layer Architecture
- **Regional Baseline (SoilGrids 250m & ICAR-NBSS&LUP)**: Calibrated regional topsoil (0–30 cm) estimates for all 15 Maharashtra focus blocks, detailing texture, clay/sand/silt fractions, pH in H2O, Walkley-Black organic carbon, cation exchange capacity (CEC), and available water capacity (AWC mm/m). Transparently labeled as modeled estimates with explicit spatial resolution limitations.
- **ISRIC SoilGrids REST API Status**: Live REST API (`rest.isric.org`) is confirmed paused/offline by ISRIC. The system degrades gracefully to the ICAR-NBSS&LUP Research Bulletin 54 survey baseline with clear source provenance.
- **Farmer Field Soil Test Profiles (Soil Health Card)**: Separate field-level database (`field_soil_tests` in SQLite) supporting farmer-provided laboratory test submissions: pH, EC (salinity), Walkley-Black organic carbon, available N, P, K, sulphur, and micronutrients (Zn, Fe, Cu, Mn, B).
- **Diagnostic Nutrient Ratings**: Implements official Maharashtra Department of Agriculture / MPKV soil fertility rating tiers (Very Low, Low, Medium, High, Very High). Does not fabricate arbitrary chemical fertilizer dosages.

### 2. Crop Catalogue & Authoritative Agronomic Specifications
- **8 Core Maharashtra Crops**:
  - `soybean` (MPKV Rahuri / ICAR-IISR)
  - `cotton` (ICAR-CICR Nagpur / MPKV Rahuri)
  - `pigeonpea` / Red Gram (VNMKV Parbhani / PDKV Akola)
  - `pearl_millet` / Bajra (ICAR-AICRP on Bajra / MPKV)
  - `sorghum` / Jowar (ICAR-IIMR / MPKV Rahuri)
  - `onion` (ICAR-DOGR Rajgurunagar)
  - `chickpea` / Bengal Gram (MPKV Rahuri / PDKV Akola)
  - `sugarcane` (Vasantdada Sugar Institute / MPKV Rahuri)
- **Detailed Agronomic Rules**: Verified sowing windows (DOY), optimal & marginal pH ranges, required soil textures, root depth classes, water requirements, and critical phenological growth stages with moisture stress sensitivities.

### 3. Explainable Crop Suitability Engine
- Multi-factor deterministic evaluation:
  - Soil texture compatibility (e.g., Vertisol suitability for cotton/soybean, well-drained for onion).
  - Soil pH tolerance.
  - Water availability and irrigation mode (`rainfed`, `protective_irrigation`, `assured_irrigation`).
  - Historical rainfall regime of the agroclimatic zone.
- Sugarcane constraint: Strictly marked `unsuitable` under rainfed conditions (<1200 mm water requirement); conditionally suitable or suitable under assured irrigation.
- Returns explicit `supporting_factors`, `limiting_factors`, `data_limitations`, and deterministic score (0–100).

### 4. Sowing-Readiness & Moisture Intelligence
- Evaluates:
  - Local agroclimatic sowing window (current calendar date vs. crop window).
  - Antecedent 14-day cumulative rainfall against the Maharashtra Kharif threshold (>= 75–100 mm for adequate "Vapsa" root-zone moisture).
  - Forward 14-day weather forecast for severe hazards (deluges > 64.5 mm/day causing seedling rot vs. prolonged dry spells causing germination failure).
- Returns actionable status: `FAVORABLE_FOR_SOWING`, `WAIT_AND_REASSESS`, `UNFAVORABLE_CONDITIONS`, or `INSUFFICIENT_DATA`.
- Plain-language advisory in both English and Marathi (e.g., *"धुळवाफ पेरणी टाळावी..."*).

### 5. Crop-Stage-Specific Agro-Advisory Engine
- Maps phenological growth stages (`sowing`, `vegetative`, `flowering`, `pod_development`, `maturity_harvest`) to real-time climate risks.
- Deterministic conflict resolution priority:
  1. `CRITICAL` drainage advisories for heavy deluges / flood threats.
  2. `CRITICAL` or `HIGH` protective irrigation advisories for dry spells during flowering / pod formation.
  3. Sowing seed treatment (e.g., Trichoderma / Rhizobium bio-fertilizers).
  4. Routine vegetative & harvest operations.
- Bilingual output: Full Marathi localization matching official MPKV Krishi Darshani guidelines.
- **NuGen / LLM Safety Boundary**: No generative AI hallucination of agricultural dosages, dates, or risk probabilities. All rules are strictly traceable, deterministic, and versioned (`rule_version="1.0.0-mpkv"`).

---

## Phase 5 — Secure NuGen LLM Explanation Integration

### 1. Explanation Layer Architecture & Strict Boundary
- **Role & Invariants**: NuGen Intelligence is integrated strictly as an **optional, server-side explanation assistant**. It translates canonical outputs from Phases 1–4 into clear, farmer-accessible English and Marathi.
- **Non-Negotiable Boundary**:
  - NuGen **NEVER** creates or alters numeric rainfall measurements, forecast horizons, risk categories, soil test values, crop suitability scores, sowing decisions, or recommended advisory actions.
  - All canonical decisions are anchored from the backend database/service layer. Client requests cannot supply synthetic risks or actions.
  - The model output is strictly validated against decision invariants before returning to the user.

### 2. Verified NuGen API Contract
- **Root Domain & Base URL**: `https://api.nugen.in`
- **Inference Route**: `POST /api/v3/inference/chat/completions` (also supports `/api/v3/inference/openai-compatible-responses`)
- **Authentication**: HTTP Header `Authorization: Bearer <api_key>`
- **Model Verification**: Tested with base inference-ready model `Qwen/Qwen2.5-0.5B-Instruct` (and custom aligned models `model_<id>` where deployed).
- **Error Handling & Bounded Retries**: Bounded backoff retry on transient HTTP 429 / 5xx errors; immediate fail without retry on 401/403 auth errors; strict 12.0s timeout.

### 3. Decision-Integrity Output Validator
- **Payload Schema**: Verifies presence of five mandatory narrative sections: `summary`, `signal_explanation`, `reasoning_summary`, `action_explanation`, `uncertainty`.
- **Hallucination Detection**:
  - Detects and rejects unauthorized chemical dosages (e.g. `\d+ ml/acre`) or banned toxic agrochemicals.
  - Detects semantic contradictions (e.g. recommending "flood irrigation" when canonical advisory mandates "drainage", or recommending "immediate dry sowing" when canonical mandates "wait for vapsa").
- **Automatic Fallback Substitution**: If validation fails or NuGen is unavailable, the service transparently substitutes verified deterministic templates in English or Marathi, reporting `provider_status: "fallback"` or `"unavailable"`.

### 4. Explanation Provider Statuses
| Status | Meaning |
| :--- | :--- |
| `generated` | Successfully generated by NuGen LLM and verified against all decision invariants |
| `fallback` | Deterministic template served because LLM output violated an invariant |
| `disabled` | NuGen is explicitly disabled via `NUGEN_ENABLED=false` |
| `unavailable` | NuGen API timed out, returned an HTTP error, or credentials were missing |

### Health Check Response (`GET /health`)

```json
{
  "status": "healthy",
  "service": "varshamitra-backend",
  "version": "0.1.0",
  "environment": "development"
}
```

---

## Running Tests

From the repository root:

```powershell
pytest backend/tests -v
```

Or from inside `backend/`:

```powershell
pytest tests -v
```

## Historical Dataset Pipeline & CLI Ingestion

The backend includes an idempotent local dataset ingestion pipeline that stores verified ERA5-Land reanalysis in persistent SQLite storage (`backend/data/historical_rainfall.sqlite`).

### Running Ingestion via CLI

From `backend/`:

```bash
# Ingest 2023 Kharif season for Baramati
python -m app.services.dataset.ingest --block baramati --start 2023-06-01 --end 2023-10-31

# Ingest 2023 season for Barshi (Solapur)
python -m app.services.dataset.ingest --block barshi --start 2023-06-01 --end 2023-10-31
```

Repeated executions automatically skip identical records (deduplication) without creating duplicate entries.

---


## Configuration Variables

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `PROJECT_NAME` | `string` | `"VarshaMitra API"` | Application title |
| `VERSION` | `string` | `"0.1.0"` | Semantic version |
| `DESCRIPTION` | `string` | `"..."` | Application description |
| `ENVIRONMENT` | `string` | `"development"` | `development`, `staging`, or `production` |
| `DEBUG` | `boolean` | `false` | Enables debug mode and logs |
| `HOST` | `string` | `"127.0.0.1"` | Bind host |
| `PORT` | `integer` | `8000` | Bind port |
| `CORS_ORIGINS` | `JSON array / string` | `["http://localhost:3000","http://127.0.0.1:3000"]` | Allowed web clients |
| `API_V1_PREFIX`| `string` | `"/api/v1"` | URL prefix for v1 routers |
| `LOG_LEVEL` | `string` | `"INFO"` | Logging verbosity |
| `NUGEN_ENABLED`| `boolean` | `false` | Enable NuGen LLM explanation integration |
| `NUGEN_API_KEY`| `string / null` | `null` | API key for NuGen Intelligence |
| `NUGEN_BASE_URL`| `string` | `"https://api.nugen.in"` | NuGen API base URL |
| `NUGEN_INFERENCE_PATH` | `string` | `"/api/v3/inference/chat/completions"` | Chat completions inference route |
| `NUGEN_MODEL` | `string` | `"Qwen/Qwen2.5-0.5B-Instruct"` | LLM model identifier |
| `NUGEN_TIMEOUT_SECONDS` | `float` | `12.0` | Request timeout in seconds |
| `NUGEN_MAX_RETRIES` | `integer` | `2` | Bounded retries for transient HTTP errors |

