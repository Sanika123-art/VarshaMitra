"""Copernicus Climate Data Store (CDS) ERA5-Land Provider Adapter.

SPECIFICATION & INTEGRATION REQUIREMENTS:
- Primary Dataset: https://cds.climate.copernicus.eu/datasets/reanalysis-era5-land
- Time-series Catalogue: https://cds.climate.copernicus.eu/datasets/reanalysis-era5-land-timeseries
- Analysis-Ready Data: https://cds.climate.copernicus.eu/datasets/reanalysis-era5-land?tab=analysis_ready_data
- Authentication:
  * Requires Copernicus CDS user account registration
  * Environment variable: CDSAPI_KEY (or ~/.cdsapirc file with 'url' and 'key')
- Data Characteristics:
  * Variables: 'total_precipitation', 'volumetric_soil_water_layer_1', '2m_temperature'
  * Native Units: Precipitation in METERS (m), must be multiplied by 1000.0 to yield millimeters (mm)
  * Spatial: ~9 km (0.1°) global grid
  * Temporal: Hourly and daily accumulations from 1950 to within 2-5 days of present
  * License: Copernicus Open Access (free for commercial and research use with mandatory attribution)
"""

from datetime import date, datetime, timezone
import os
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status

from app.core.logging import logger
from app.schemas.location import BlockDetail
from app.schemas.rainfall import (
    DataType,
    ProviderMetadata,
    ProviderStatusResponse,
    QualityStatus,
    RainfallObservationItem,
    RainfallObservationSeries,
)
from app.services.rainfall.base import RainfallProvider


class CopernicusERA5LandProvider(RainfallProvider):
    """Direct provider boundary for ECMWF Copernicus ERA5-Land reanalysis."""

    def __init__(
        self,
        api_url: Optional[str] = None,
        api_key: Optional[str] = None,
    ) -> None:
        self._api_url = api_url or os.getenv("CDSAPI_URL", "https://cds.climate.copernicus.eu/api")
        self._api_key = api_key or os.getenv("CDSAPI_KEY")

    @property
    def provider_id(self) -> str:
        return "copernicus-era5-land"

    @property
    def provider_name(self) -> str:
        return "ECMWF Copernicus ERA5-Land Reanalysis"

    @property
    def is_configured(self) -> bool:
        """True if user has configured CDS API credentials."""
        return bool(self._api_key and self._api_key.strip())

    async def get_source_status(self) -> ProviderStatusResponse:
        """Report Copernicus CDS configuration and licensing readiness."""
        if not self.is_configured:
            return ProviderStatusResponse(
                provider_id=self.provider_id,
                provider_name=self.provider_name,
                is_configured=False,
                is_available=False,
                status_code="configuration_required",
                status_message=(
                    "Direct Copernicus CDS API access requires setting 'CDSAPI_KEY' in backend/.env "
                    "or ~/.cdsapirc after accepting dataset terms on https://cds.climate.copernicus.eu/. "
                    "Analysis-ready ERA5-Land reanalysis is currently accessible via 'open-meteo-archive'."
                ),
                required_credentials=["CDSAPI_KEY", "CDSAPI_URL"],
                documentation_url="https://cds.climate.copernicus.eu/datasets/reanalysis-era5-land",
                attribution="Generated using Copernicus Climate Change Service information (2026).",
            )

        return ProviderStatusResponse(
            provider_id=self.provider_id,
            provider_name=self.provider_name,
            is_configured=True,
            is_available=True,
            status_code="operational",
            status_message="Copernicus CDS credentials configured.",
            required_credentials=["CDSAPI_KEY", "CDSAPI_URL"],
            documentation_url="https://cds.climate.copernicus.eu/datasets/reanalysis-era5-land",
            attribution="Generated using Copernicus Climate Change Service information (2026).",
        )

    def normalize_era5_native_records(
        self,
        records: List[Dict[str, Any]],
        block: BlockDetail,
        retrieved_at: datetime,
    ) -> RainfallObservationSeries:
        """Normalize native ERA5 records. Crucially converts meters (m) to millimeters (mm)."""
        observations: List[RainfallObservationItem] = []
        total_mm = 0.0
        missing_count = 0

        for rec in records:
            d_str = rec.get("date") or rec.get("time")
            if not d_str:
                continue
            obs_date = date.fromisoformat(d_str[:10])

            # Native ERA5 total_precipitation is in meters
            val_m = rec.get("total_precipitation") if "total_precipitation" in rec else rec.get("tp")
            if val_m is None or val_m == "" or val_m == -9999.0:
                missing_count += 1
                observations.append(
                    RainfallObservationItem(
                        date=obs_date,
                        variable="precipitation",
                        value_mm=None,
                        unit="mm",
                        quality=QualityStatus.MISSING,
                        data_type=DataType.REANALYSIS,
                        notes="Missing reanalysis grid point",
                    )
                )
            else:
                # Convert meters to millimeters: mm = m * 1000.0
                val_mm = round(float(val_m) * 1000.0, 2)
                if val_mm < 0.0 or val_mm > 1500.0:
                    missing_count += 1
                    observations.append(
                        RainfallObservationItem(
                            date=obs_date,
                            variable="precipitation",
                            value_mm=None,
                            unit="mm",
                            quality=QualityStatus.MISSING,
                            data_type=DataType.REANALYSIS,
                            notes=f"Converted value {val_mm} mm out of range [0, 1500]",
                        )
                    )
                else:
                    total_mm += val_mm
                    observations.append(
                        RainfallObservationItem(
                            date=obs_date,
                            variable="precipitation",
                            value_mm=val_mm,
                            unit="mm",
                            quality=QualityStatus.FRESH,
                            data_type=DataType.REANALYSIS,
                            notes=None,
                        )
                    )

        if not observations:
            raise ValueError("Zero valid observations found in ERA5 payload")

        observations.sort(key=lambda x: x.date)

        provider_meta = ProviderMetadata(
            provider_id=self.provider_id,
            provider_name=self.provider_name,
            dataset_name="ECMWF Copernicus ERA5-Land Global Atmospheric Reanalysis",
            attribution="Copernicus Climate Change Service (C3S) / ECMWF (CC BY 4.0).",
            license="Copernicus Open Access License",
            spatial_resolution="0.1° (~9 km)",
            temporal_resolution="daily",
            timezone="UTC (day boundary 00:00 UTC)",
        )

        return RainfallObservationSeries(
            block_id=block.id,
            block_name=block.name,
            district_id=block.district_id,
            district_name=block.district_name,
            latitude=block.latitude,
            longitude=block.longitude,
            start_date=observations[0].date,
            end_date=observations[-1].date,
            observations=observations,
            count=len(observations),
            total_rainfall_mm=round(total_mm, 2),
            missing_days_count=missing_count,
            data_type=DataType.REANALYSIS,
            retrieved_at=retrieved_at,
            provider=provider_meta,
        )

    async def get_recent_observations(
        self,
        block: BlockDetail,
        days: int = 7,
    ) -> RainfallObservationSeries:
        """Fetch observations from Copernicus CDS direct API."""
        if not self.is_configured:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=(
                    "Direct Copernicus CDS API is not configured. Required credential: CDSAPI_KEY. "
                    "Please use 'provider=open-meteo-archive' to query analysis-ready ERA5-Land reanalysis without API keys."
                ),
            )

        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Direct asynchronous CDS NetCDF download queue integration requires background worker.",
        )
