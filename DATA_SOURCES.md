# Data Sources & Scientific Provenance

This document records the authoritative data sources, scientific publications, provider licenses, and operational boundaries utilized by VarshaMitra.

---

## 1. Meteorological & Climate Intelligence

### 1.1 High-Resolution Numerical Weather Forecasts
- **Provider**: Open-Meteo Weather API (`open-meteo.com`)
- **Dataset**: Seamless combination of global (ECMWF IFS, GFS) and regional high-resolution atmospheric models.
- **Spatial Resolution**: ~1 km to 11 km downscaled atmospheric grid points.
- **Temporal Resolution**: Hourly and Daily aggregates (Precipitation sum in mm, Max/Min Temperature in °C, Precipitation Probability %).
- **License & Attribution**: Creative Commons Attribution 4.0 International (CC BY 4.0).
- **Provenance Disclosure**: Clearly labeled as numerical weather model forecasts; never misrepresented as in-situ rain gauge measurements.

### 1.2 Multi-Decadal Historical Weather & Climate Archive
- **Provider**: Open-Meteo Historical Weather API / Copernicus ERA5-Land Reanalysis.
- **Dataset**: ECMWF ERA5-Land Reanalysis (1994–2024, 30+ year climatological baseline).
- **Storage**: Local SQLite database (`backend/data/historical_climate.db`).
- **Use Case**: Climatological baseline calculation, historical dry-spell frequency, rainfall anomaly percentiles, and multi-decadal trend analytics.
- **Provenance Disclosure**: Identified as global reanalysis modeled observations.

---

## 2. Geospatial & Administrative Gazetteer

### 2.1 Maharashtra Statewide Administrative Directory
- **Authoritative Source**: Local Government Directory (LGD), Ministry of Panchayati Raj, Government of India.
- **Coverage**: 36 official districts across all 5 administrative divisions (Konkan, Western Maharashtra, Khandesh, Marathwada, Vidarbha) with ~160 monitored talukas/blocks.
- **Precision**: Centroids (WGS84 EPSG:4326) validated for administrative representation. Clearly disclosed that centroids do not represent farm cadastral boundaries.

### 2.2 Dynamic Reverse Geocoding & Search
- **Provider**: OpenStreetMap Nominatim (`nominatim.openstreetmap.org`)
- **Operational Boundaries**: Strictly bounded to Maharashtra ($15.60^\circ\text{N} - 22.15^\circ\text{N}$, $72.60^\circ\text{E} - 80.90^\circ\text{E}$).
- **Rate-Limiting & Caching**: 1 request per second client compliance; 2-hour TTL cache in-memory. User-Agent identified as `VarshaMitra/1.0`.
- **License & Attribution**: © OpenStreetMap contributors (ODbL).

---

## 3. Agronomic Science & Package of Practices

### 3.1 Maharashtra Agricultural University Recommendations
- **Mahatma Phule Krishi Vidyapeeth (MPKV), Rahuri**:
  - *Krishi Darshani & Package of Practices for Kharif and Rabi Crops*.
  - Sowing window guidelines (antecedent moisture requirements, "vapsa" condition: 75–100 mm cumulative monsoon rainfall).
  - Crop-stage sensitivity rules (vegetative, flowering, grain fill, harvest).
- **Dr. Panjabrao Deshmukh Krishi Vidyapeeth (PDKV), Akola**:
  - *Crop Weather Calendars for Vidarbha & Khandesh* (Cotton, Soybean, Tur).
- **Vasantrao Naik Marathwada Krishi Vidyapeeth (VNMKV), Parbhani**:
  - *Agrometeorological Contingency Plans for Marathwada* (Jowar, Bajra, Soybean).
- **ICAR-Central Research Institute for Dryland Agriculture (ICAR-CRIDA)**:
  - *Contingency Crop Planning Atlas for Maharashtra*.

### 3.2 Soil Characterization & Baselines
- **ICAR-National Bureau of Soil Survey and Land Use Planning (ICAR-NBSS&LUP)**:
  - Regional Maharashtra soil series classification (Deep Black Vertisols, Coastal Laterites, Medium Vertic Inceptisols).
  - Provenance Disclosure: Soil properties are regional agroclimatic baseline models; farmers are encouraged to cross-reference with their Soil Health Card (SHC) for plot-level chemical nutrient measurements (NPK, micronutrients).

---

## 4. NuGen AI Grounding & Explainability

- **Provider**: Google Gemini / DeepMind API (via server-side environment `GEMINI_API_KEY` or `NUGEN_API_KEY`).
- **Safety & Verification**: NuGen serves purely as an explanatory layer. It translates deterministic agronomic indicators into accessible plain-language Marathi or English.
- **Fail-Safe Mechanism**: If the AI explanation provider is unreachable or times out, the system automatically falls back to deterministic rule templates without compromising agricultural accuracy or crashing the user interface.
