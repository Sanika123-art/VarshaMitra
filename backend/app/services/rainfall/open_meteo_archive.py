"""Open-Meteo Historical Weather Archive Provider (ERA5-Land Reanalysis).

API SPECIFICATION & PROVENANCE:
- Endpoint: https://archive-api.open-meteo.com/v1/archive
- Dataset: Copernicus ERA5-Land Global Atmospheric Reanalysis (ECMWF)
- Temporal Span: 1940-01-01 to within 2-5 days of present
- Spatial Grid: ~9 km / 0.1° resolution
- Units: Precipitation sum in millimeters (mm)
- Timezone: Asia/Kolkata (Indian Standard Time)
- License: Open access under CC BY 4.0 (requires Copernicus ERA5 citation)
"""

from datetime import date, datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
import httpx

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


class OpenMeteoArchiveProvider(RainfallProvider):
    """Adapter for ingesting verified historical ERA5-Land reanalysis from Open-Meteo Archive."""

    def __init__(
        self,
        base_url: str = "https://archive-api.open-meteo.com/v1/archive",
        timeout_seconds: float = 12.0,
        max_retries: int = 2,
    ):
        self._base_url = base_url
        self._timeout_seconds = timeout_seconds
        self._max_retries = max_retries

    @property
    def provider_id(self) -> str:
        return "open-meteo-archive"

    @property
    def provider_name(self) -> str:
        return "Open-Meteo Historical Archive (ERA5-Land)"

    async def get_source_status(self) -> ProviderStatusResponse:
        """Verify reachability of the historical archive endpoint."""
        is_available = False
        status_code = "operational"
        status_msg = "Historical ERA5-Land archive operational."

        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.get(
                    self._base_url,
                    params={
                        "latitude": 18.52,
                        "longitude": 73.85,
                        "start_date": "2023-01-01",
                        "end_date": "2023-01-02",
                        "daily": "precipitation_sum",
                        "timezone": "Asia/Kolkata",
                    },
                )
                if res.status_code == 200:
                    is_available = True
                else:
                    status_code = "degraded"
                    status_msg = f"Archive endpoint returned HTTP {res.status_code}"
        except Exception as err:
            logger.warning(f"Open-Meteo archive probe failed: {err}")
            status_code = "unavailable"
            status_msg = f"Network probe to historical archive failed: {type(err).__name__}"

        return ProviderStatusResponse(
            provider_id=self.provider_id,
            provider_name=self.provider_name,
            is_configured=True,
            is_available=is_available,
            status_code=status_code,
            status_message=status_msg,
            required_credentials=[],
            documentation_url="https://open-meteo.com/en/docs/historical-weather-api",
            attribution="Copernicus ERA5-Land data accessed via Open-Meteo.com under CC BY 4.0.",
        )

    def normalize_raw_archive_response(
        self,
        raw_data: Dict[str, Any],
        block: BlockDetail,
        retrieved_at: datetime,
    ) -> RainfallObservationSeries:
        """Parse raw historical archive JSON into normalized series."""
        daily = raw_data.get("daily", {})
        time_list: List[str] = daily.get("time", [])
        precip_list: List[Optional[float]] = daily.get("precipitation_sum", [])

        if len(time_list) != len(precip_list):
            raise ValueError("Mismatched time and precipitation arrays from historical archive")

        observations: List[RainfallObservationItem] = []
        total_mm = 0.0
        missing_count = 0

        for t_str, p_val in zip(time_list, precip_list):
            obs_date = date.fromisoformat(t_str)

            if p_val is None:
                missing_count += 1
                observations.append(
                    RainfallObservationItem(
                        date=obs_date,
                        variable="precipitation",
                        value_mm=None,
                        unit="mm",
                        quality=QualityStatus.MISSING,
                        data_type=DataType.REANALYSIS,
                        notes="No reanalysis value reported for this calendar day",
                    )
                )
            else:
                float_val = round(float(p_val), 2)
                if float_val < 0.0 or float_val > 1500.0:
                    missing_count += 1
                    observations.append(
                        RainfallObservationItem(
                            date=obs_date,
                            variable="precipitation",
                            value_mm=None,
                            unit="mm",
                            quality=QualityStatus.MISSING,
                            data_type=DataType.REANALYSIS,
                            notes=f"Value {float_val} mm out of physical range [0, 1500]",
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
                            data_type=DataType.REANALYSIS,
                            notes=None,
                        )
                    )

        if not observations:
            raise ValueError("Historical archive returned zero data points")

        provider_meta = ProviderMetadata(
            provider_id=self.provider_id,
            provider_name=self.provider_name,
            dataset_name="Copernicus ERA5-Land High-Resolution Reanalysis",
            attribution="Copernicus Climate Change Service (C3S) & Open-Meteo under CC BY 4.0.",
            license="CC BY 4.0",
            spatial_resolution="0.1° (~9-11 km)",
            temporal_resolution="daily",
            timezone=raw_data.get("timezone", "Asia/Kolkata"),
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
        """Fetch recent historical days from archive."""
        today = date.today()
        # ERA5-Land archive typically trails by 2-5 days
        end_date = today
        start_date = end_date.fromordinal(end_date.toordinal() - days + 1)
        return await self.get_historical_range(block, start_date, end_date)

    async def get_historical_range(
        self,
        block: BlockDetail,
        start_date: date,
        end_date: date,
    ) -> RainfallObservationSeries:
        """Fetch historical reanalysis for any calendar date window."""
        if start_date > end_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"start_date ({start_date}) must be prior or equal to end_date ({end_date})",
            )

        span_days = (end_date - start_date).days + 1
        if span_days > 1826:  # 5 years max per request
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Requested historical range ({span_days} days) exceeds maximum batch window of 5 years (1826 days).",
            )

        params = {
            "latitude": block.latitude,
            "longitude": block.longitude,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "daily": "precipitation_sum",
            "timezone": "Asia/Kolkata",
        }

        retrieved_at = datetime.now(timezone.utc)
        last_error: Optional[Exception] = None

        for attempt in range(1 + self._max_retries):
            try:
                async with httpx.AsyncClient(timeout=self._timeout_seconds) as client:
                    response = await client.get(self._base_url, params=params)

                if response.status_code == 200:
                    raw_json = response.json()
                    return self.normalize_raw_archive_response(raw_json, block, retrieved_at)
                elif response.status_code == 429:
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail="Historical archive rate limit reached. Please retry shortly.",
                    )
                else:
                    last_error = HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail=f"Historical archive provider returned HTTP {response.status_code}: {response.text[:200]}",
                    )
            except httpx.TimeoutException:
                last_error = HTTPException(
                    status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                    detail="Historical archive request timed out. Please retry.",
                )
            except HTTPException:
                raise
            except Exception as err:
                last_error = HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Unable to fetch historical archive data: {type(err).__name__}",
                )

        if isinstance(last_error, HTTPException):
            raise last_error
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to retrieve historical rainfall data after retry attempts",
        )
