# VarshaMitra — Phase 7 Readiness & Production Migration Blueprint

## Executive Status

Phases 1 through 6 have established a stable, verified, fully integrated full-stack baseline for VarshaMitra:
- **FastAPI Backend**: Complete with deterministic climate indicator calculation, explainable heuristic risk scoring, dual-layer soil profile intelligence (regional baselines + Soil Health Card test registrations), MPKV crop suitability & sowing readiness engines, crop-stage advisories, server-side NuGen LLM explanation layer with strict safety invariants, bulk regional risk aggregation with in-memory TTL caching, and 111 passing pytest test suites.
- **Next.js 16 Frontend**: Complete with responsive UI, MapLibre GL centroid-based geospatial visualization, farmer & officer workflows, Marathi/English bilingual support, honest data provenance indicators, accessible state notices (`ApiUnavailableState`, `StaleDataBanner`, `PartialDataNotice`), and 18 passing unit/integration test suites with clean TypeScript compilation and Turbopack production build.

Phase 7 deployment and production database migration are deliberately postponed to preserve local reproducibility during hackathon evaluation. This document specifies the complete operational readiness plan for Phase 7 execution.

---

## 1. Verified SQLite Database Architecture (Current State)

VarshaMitra currently uses embedded SQLite 3 databases in `backend/data/` with write-ahead logging (WAL) and dedicated connection lifecycle management:

### 1.1 `backend/data/historical_rainfall.sqlite`
- **Table**: `daily_rainfall`
- **Schema**:
  ```sql
  CREATE TABLE IF NOT EXISTS daily_rainfall (
      block_id TEXT NOT NULL,
      date TEXT NOT NULL,
      rainfall_mm REAL NOT NULL,
      provider TEXT NOT NULL,
      quality_flag TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (block_id, date, provider)
  );
  CREATE INDEX IF NOT EXISTS idx_daily_rainfall_block_date 
      ON daily_rainfall (block_id, date);
  ```
- **Integrity Guarantee**: Composite primary key `(block_id, date, provider)` guarantees idempotent insertion during CLI and API reanalysis ingestion.
- **Access Pattern**: Managed via context-managed connection factory `_connection()` in `backend/app/services/dataset/storage.py` ensuring zero leaked file locks.

### 1.2 `backend/data/field_soil_tests.sqlite`
- **Table**: `field_soil_tests`
- **Schema**:
  ```sql
  CREATE TABLE IF NOT EXISTS field_soil_tests (
      id TEXT PRIMARY KEY,
      block_id TEXT NOT NULL,
      village TEXT,
      farmer_id TEXT,
      test_date TEXT NOT NULL,
      ph REAL NOT NULL,
      ec REAL,
      organic_carbon_pct REAL,
      available_n_kg_ha REAL,
      available_p_kg_ha REAL,
      available_k_kg_ha REAL,
      available_s_ppm REAL,
      zn_ppm REAL,
      fe_ppm REAL,
      cu_ppm REAL,
      mn_ppm REAL,
      b_ppm REAL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_field_soil_tests_block 
      ON field_soil_tests (block_id, test_date DESC);
  ```
- **Access Pattern**: Managed via context-managed connection factory `_connection()` in `backend/app/services/agronomy/soil_service.py`.

---

## 2. Production Database Migration Roadmap (PostgreSQL + PostGIS)

For production deployment, embedded SQLite should be migrated to PostgreSQL 16+ with the PostGIS 3.4 spatial extension.

### 2.1 Target Schema & PostGIS Extension

```sql
-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Administrative Blocks & Real Polygon Boundaries
CREATE TABLE admin_blocks (
    block_id VARCHAR(64) PRIMARY KEY,
    block_name_en VARCHAR(128) NOT NULL,
    block_name_mr VARCHAR(128) NOT NULL,
    district_id VARCHAR(64) NOT NULL,
    district_name_en VARCHAR(128) NOT NULL,
    district_name_mr VARCHAR(128) NOT NULL,
    centroid GEOMETRY(Point, 4326) NOT NULL,
    boundary GEOMETRY(MultiPolygon, 4326), -- Official Survey of India / NWIC boundary
    agroclimatic_zone VARCHAR(128) NOT NULL,
    normal_annual_rainfall_mm NUMERIC(6,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_admin_blocks_geom ON admin_blocks USING GIST (boundary);
CREATE INDEX idx_admin_blocks_centroid ON admin_blocks USING GIST (centroid);

-- 2. Daily Rainfall Reanalysis & Ingested Observations
CREATE TABLE daily_rainfall_records (
    id BIGSERIAL PRIMARY KEY,
    block_id VARCHAR(64) NOT NULL REFERENCES admin_blocks(block_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    rainfall_mm NUMERIC(6,2) NOT NULL CHECK (rainfall_mm >= 0),
    provider VARCHAR(64) NOT NULL,
    quality_flag VARCHAR(32) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_block_date_provider UNIQUE (block_id, date, provider)
);
CREATE INDEX idx_rainfall_query ON daily_rainfall_records (block_id, date DESC);

-- 3. Farmer Registered Soil Test Profiles
CREATE TABLE field_soil_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    block_id VARCHAR(64) NOT NULL REFERENCES admin_blocks(block_id),
    farmer_id VARCHAR(128),
    village VARCHAR(128),
    test_date DATE NOT NULL,
    ph NUMERIC(4,2) NOT NULL CHECK (ph BETWEEN 0 AND 14),
    ec NUMERIC(6,2),
    organic_carbon_pct NUMERIC(5,2),
    available_n_kg_ha NUMERIC(7,2),
    available_p_kg_ha NUMERIC(7,2),
    available_k_kg_ha NUMERIC(7,2),
    available_s_ppm NUMERIC(6,2),
    zn_ppm NUMERIC(6,2),
    fe_ppm NUMERIC(6,2),
    cu_ppm NUMERIC(6,2),
    mn_ppm NUMERIC(6,2),
    b_ppm NUMERIC(6,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_soil_tests_lookup ON field_soil_tests (block_id, test_date DESC);
```

### 2.2 Migration Steps
1. Export current SQLite records using `sqlite3 backend/data/*.sqlite .dump`.
2. Cleanse data types (convert ISO strings to native `DATE` and `TIMESTAMPTZ`).
3. Apply Alembic database migrations:
   ```bash
   alembic revision --autogenerate -m "Initial PostgreSQL + PostGIS schema"
   alembic upgrade head
   ```
4. Ingest official GeoJSON administrative polygons from the National Water Informatics Centre (NWIC) or Survey of India into `admin_blocks.boundary`.

---

## 3. High-Availability Production Architecture

```
                          [ Internet Traffic ]
                                   │
                                   ▼
                    [ Cloudflare / Edge CDN ]
                     - DDoS Protection & SSL
                     - Asset Caching (Next.js static)
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                             ▼
       [ Next.js 16 Web App ]           [ Nginx Reverse Proxy ]
       (Node.js Cluster / Vercel)       (Rate Limiting & TLS)
                    │                             │
                    └──────────────┬──────────────┘
                                   ▼
                       [ FastAPI Backend Service ]
                       - Gunicorn + 4 Uvicorn Workers
                       - Pydantic Settings Validation
                       - Concurrency Control (Semaphore=4)
                                   │
              ┌────────────────────┼────────────────────┐
              ▼                    ▼                    ▼
     [ Redis 7 Cluster ]  [ PostgreSQL + PostGIS ]  [ NuGen LLM ]
     - Risk Summary Cache  - Persistent Storage      - Server-Side
     - Session Store       - Spatial Queries          Fallback Safe
```

---

## 4. Production Deployment Configurations

### 4.1 Systemd Service Definition (`/etc/systemd/system/varshamitra-backend.service`)
```ini
[Unit]
Description=VarshaMitra FastAPI Backend Service
After=network.target postgresql.service redis.service

[Service]
User=varshamitra
Group=varshamitra
WorkingDirectory=/opt/varshamitra/backend
Environment="PATH=/opt/varshamitra/backend/.venv/bin"
EnvironmentFile=/opt/varshamitra/backend/.env
ExecStart=/opt/varshamitra/backend/.venv/bin/gunicorn app.main:app \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 127.0.0.1:8000 \
    --access-logfile /var/log/varshamitra/access.log \
    --error-logfile /var/log/varshamitra/error.log \
    --timeout 30

Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### 4.2 Nginx Production Gateway Configuration
```nginx
upstream varshamitra_backend {
    server 127.0.0.1:8000;
    keepalive 32;
}

upstream varshamitra_frontend {
    server 127.0.0.1:3000;
    keepalive 32;
}

server {
    listen 80;
    server_name varshamitra.gov.in;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name varshamitra.gov.in;

    ssl_certificate /etc/letsencrypt/live/varshamitra.gov.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/varshamitra.gov.in/privkey.pem;

    # Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://*.basemaps.cartocdn.com; connect-src 'self' https://*.basemaps.cartocdn.com;" always;

    # API Routes
    location /api/ {
        proxy_pass http://varshamitra_backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 30s;
    }

    # Frontend Application
    location / {
        proxy_pass http://varshamitra_frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 5. Security & Invariant Checklist for Production Launch

1. **Environment Variables**:
   - `ENVIRONMENT="production"`
   - `DEBUG=false`
   - `CORS_ORIGINS=["https://varshamitra.gov.in"]` (strict origins, zero wildcard `*`).
2. **NuGen LLM Server-Side Boundaries**:
   - `NUGEN_API_KEY` stored exclusively in server environment; NEVER exposed in frontend code or client bundles.
   - Decision-integrity validator active: outputs containing unauthorized chemical dosages or contradicting canonical agronomic advisories are dropped in favor of verified MPKV templates.
3. **Caching & Rate Limiting**:
   - `GET /api/v1/risk/summary` cached with Redis (or in-memory TTL 900s) to prevent cascading re-evaluation under load.
   - Concurrency semaphore bounded to prevent event loop exhaustion during external weather queries.
4. **Backup & Disaster Recovery**:
   - Daily automated database snapshots with WAL archiving.
   - Fallback offline templates verified to serve farmers seamlessly even if upstream weather APIs or database connections experience transient outages.
