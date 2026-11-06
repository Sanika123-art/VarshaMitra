"""India Meteorological Department (IMD) provider integration adapter.

SPECIFICATION & INTEGRATION REQUIREMENTS:
- Primary API Reference: https://api.imd.gov.in/public/api_reference.html
- Endpoints:
  * District Rainfall: https://api.imd.gov.in/api/v1/districtrainfall
  * State Rainfall: https://api.imd.gov.in/api/v1/staterainfall
  * NWDP Open Data Catalog: https://nwdp.nwic.gov.in/dataset/rainfall-daily-imd
- Authentication:
  * Header 'x-api-key' containing institutional token issued by IMD / MoES
- Data Characteristics:
  * Type: Observational ground-truth (AWS station reports and 0.25° x 0.25° gridded daily rainfall)
  * Spatial: District and block/taluka level aggregations for Maharashtra
  * Temporal: Daily 24-hour accumulation (08:30 IST to 08:30 IST)
  * Units: Millimeters (mm)
  * Attribution: India Meteorological Department, Ministry of Earth Sciences, Government of India
"""

from datetime import date, datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
import httpx

from app.core.config import settings
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


class IMDRainfallProvider(RainfallProvider):
    """Provider adapter for India Meteorological Department (IMD) observation feeds."""

    def __init__(
        self,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        timeout_seconds: float = 6.0,
    ) -> None:
        self._base_url = (base_url or settings.IMD_API_BASE_URL).rstrip("/")
        self._api_key = api_key or settings.IMD_API_KEY
        self._timeout_seconds = timeout_seconds

    @property
    def provider_id(self) -> str:
        return "imd"

    @property
    def provider_name(self) -> str:
        return "India Meteorological Department (IMD)"

    @property
    def is_configured(self) -> bool:
        """True if official institutional API key is provided."""
        return bool(self._api_key and self._api_key.strip())

    async def get_source_status(self) -> ProviderStatusResponse:
        """Verify IMD connectivity and report credentials readiness."""
        if not self.is_configured:
            return ProviderStatusResponse(
                provider_id=self.provider_id,
                provider_name=self.provider_name,
                is_configured=False,
                is_available=False,
                status_code="configuration_required",
                status_message=(
                    "Official IMD API gateway credentials are not configured in this environment. "
                    "Institutional access requires setting 'IMD_API_KEY' in backend/.env. "
                    "See documentation at https://api.imd.gov.in/public/api_reference.html"
                ),
                required_credentials=["IMD_API_KEY", "IMD_API_BASE_URL"],
                documentation_url="https://api.imd.gov.in/public/api_reference.html",
                attribution="India Meteorological Department (IMD), Ministry of Earth Sciences, Government of India.",
                integration_status="implemented_unverified",
            )

        # Probe with configured API key
        is_available = False
        status_code = "operational"
        status_msg = "IMD API gateway authenticated and operational."

        try:
            async with httpx.AsyncClient(timeout=self._timeout_seconds) as client:
                res = await client.get(
                    f"{self._base_url}/api/v1/districtrainfall",
                    headers={"x-api-key": self._api_key},
                    params={"district": "Pune"},
                )
                if res.status_code == 200:
                    is_available = True
                elif res.status_code in (401, 403):
                    status_code = "configuration_required"
                    status_msg = f"IMD API key rejected by gateway (HTTP {res.status_code})"
                else:
                    status_code = "degraded"
                    status_msg = f"IMD endpoint returned HTTP {res.status_code}"
        except Exception as err:
            logger.warning(f"IMD connectivity probe failed: {err}")
            status_code = "unavailable"
            status_msg = f"Network connection to IMD gateway failed: {type(err).__name__}"

        return ProviderStatusResponse(
            provider_id=self.provider_id,
            provider_name=self.provider_name,
            is_configured=True,
            is_available=is_available,
            status_code=status_code,
            status_message=status_msg,
            required_credentials=["IMD_API_KEY", "IMD_API_BASE_URL"],
            documentation_url="https://api.imd.gov.in/public/api_reference.html",
            attribution="India Meteorological Department (IMD), Ministry of Earth Sciences, Government of India.",
            integration_status="implemented_unverified",
        )

    def normalize_raw_imd_response(
        self,
        raw_data: Dict[str, Any],
        block: BlockDetail,
        retrieved_at: datetime,
    ) -> RainfallObservationSeries:
        """Parse structured IMD district/station payload into validated observation series."""
        records = raw_data.get("data", []) or raw_data.get("records", [])
        if not records and "daily" in raw_data:
            # Handle standardized mock or alternative envelope
            records = raw_data["daily"]

        observations: List[RainfallObservationItem] = []
        total_mm = 0.0
        missing_count = 0

        for rec in records:
            # Accept ISO date or YYYY-MM-DD
            d_str = rec.get("date") or rec.get("time") or rec.get("Observation_Date")
            if not d_str:
                continue
            obs_date = date.fromisoformat(d_str[:10])

            val = rec.get("rainfall_mm") if "rainfall_mm" in rec else rec.get("rainfall", rec.get("value"))
            if val is None or val == "" or val == -999.0:
                missing_count += 1
                observations.append(
                    RainfallObservationItem(
                        date=obs_date,
                        variable="precipitation",
                        value_mm=None,
                        unit="mm",
                        quality=QualityStatus.MISSING,
                        data_type=DataType.OBSERVATION,
                        notes="IMD missing or null station report",
                    )
                )
            else:
                float_val = round(float(val), 2)
                if float_val < 0.0 or float_val > 1500.0:
                    missing_count += 1
                    observations.append(
                        RainfallObservationItem(
                            date=obs_date,
                            variable="precipitation",
                            value_mm=None,
                            unit="mm",
                            quality=QualityStatus.MISSING,
                            data_type=DataType.OBSERVATION,
                            notes=f"Value {float_val} mm outside physical bounds [0, 1500]",
                        )
                    )
                else:
                    total_mm += float_val
                    observations.append(
                        RainfallObservationItem(
                            date=obs_date,
                            variable="precipitation",
                            value_mm=float_val,
                            unit="mm",
                            quality=QualityStatus.FRESH,
                            data_type=DataType.OBSERVATION,
                            notes=None,
                        )
                    )

        if not observations:
            raise ValueError("IMD response contained no valid daily observation records.")

        observations.sort(key=lambda x: x.date)

        provider_meta = ProviderMetadata(
            provider_id=self.provider_id,
            provider_name=self.provider_name,
            dataset_name="IMD Daily Gridded & AWS Observational Network",
            attribution="India Meteorological Department (IMD), Ministry of Earth Sciences, Government of India.",
            license="Government of India Open Data License (GODL-India)",
            spatial_resolution="0.25° (~25 km) gridded / Station Point",
            temporal_resolution="daily",
            timezone="Asia/Kolkata",
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
            data_type=DataType.OBSERVATION,
            retrieved_at=retrieved_at,
            provider=provider_meta,
        )

    async def get_recent_observations(
        self,
        block: BlockDetail,
        days: int = 7,
        client: Optional[object] = None,
    ) -> RainfallObservationSeries:
        """Fetch observations from official IMD API gateway."""
        if not self.is_configured:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=(
                    "Official IMD live observational gateway is not configured in this environment. "
                    "Required credentials: IMD_API_KEY. "
                    "Please set 'IMD_API_KEY' in backend/.env or query using 'provider=open-meteo'."
                ),
            )

        retrieved_at = datetime.now(timezone.utc)
        url = f"{self._base_url}/api/v1/districtrainfall"
        headers = {"x-api-key": self._api_key}
        params = {"district": block.district_name, "days": days}

        try:
            async with httpx.AsyncClient(timeout=self._timeout_seconds) as client:
                res = await client.get(url, headers=headers, params=params)

            if res.status_code == 200:
                raw_json = res.json()
                return self.normalize_raw_imd_response(raw_json, block, retrieved_at)
            elif res.status_code in (401, 403):
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"IMD API gateway authentication failure (HTTP {res.status_code}). Please verify IMD_API_KEY.",
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"IMD gateway returned upstream error HTTP {res.status_code}",
                )
        except httpx.RequestError as err:
            logger.error(f"Failed to communicate with IMD gateway: {err}")
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail=f"Upstream timeout or connection error contacting IMD gateway: {type(err).__name__}",
            )
