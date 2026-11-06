"""Open-Meteo rainfall provider integration adapter.

API SPECIFICATION & PROVENANCE:
- Endpoint: https://api.open-meteo.com/v1/forecast
- Provenance: WMO Global Model Ensemble & Copernicus ERA5-Land Reanalysis
- Resolution: ~11 km (0.1°) spatial grid
- Units: millimeters (mm)
- Timezone: Asia/Kolkata (Indian Standard Time, UTC+05:30)
- License: Attribution required (CC BY 4.0 Open-Meteo & Copernicus)

DATA-TYPE NOTE:
- `get_recent_observations` uses the forecast endpoint's `past_days` window. Those values are
  model analysis output, NOT rain-gauge observations and NOT ERA5-Land reanalysis. They are
  labelled DataType.MODEL_ANALYSIS. The current calendar day (IST) is excluded because it is
  incomplete and forecast-derived.
"""

from datetime import date, datetime, timedelta, timezone
import json
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
import httpx
from app.core.logging import logger
from app.schemas.location import BlockDetail
from app.schemas.rainfall import (
    DataType,
    ForecastItem,
    ForecastSeries,
    ProviderMetadata,
    ProviderStatusResponse,
    QualityStatus,
    RainfallObservationItem,
    RainfallObservationSeries,
)
from app.services.rainfall.base import RainfallProvider

IST = timezone(timedelta(hours=5, minutes=30))


def today_ist() -> date:
    """Current calendar date in Indian Standard Time."""
    return datetime.now(IST).date()


class OpenMeteoRainfallProvider(RainfallProvider):
    """Adapter for fetching verified daily rainfall observations from Open-Meteo API."""

    def __init__(
        self,
        base_url: str = "https://api.open-meteo.com/v1/forecast",
        timeout_seconds: float = 5.0,
        max_retries: int = 2,
    ):
        self._base_url = base_url
        self._timeout_seconds = timeout_seconds
        self._max_retries = max_retries

    @property
    def provider_id(self) -> str:
        return "open-meteo"

    @property
    def provider_name(self) -> str:
        return "Open-Meteo Weather API"

    async def get_source_status(self) -> ProviderStatusResponse:
        """Verify Open-Meteo connectivity and report operational status."""
        is_available = False
        status_msg = "Provider configuration valid (Open Access, WMO/Copernicus license)"
        status_code = "operational"

        try:
            # Lightweight probe
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(
                    self._base_url,
                    params={
                        "latitude": 18.52,
                        "longitude": 73.85,
                        "daily": "precipitation_sum",
                        "forecast_days": 1,
                        "timezone": "Asia/Kolkata",
                    },
                )
                if res.status_code == 200:
                    is_available = True
                else:
                    status_code = "degraded"
                    status_msg = f"Provider returned unexpected HTTP {res.status_code}"
        except Exception as err:
            logger.warning(f"Open-Meteo status probe failed: {err}")
            status_code = "degraded"
            status_msg = f"Provider network probe failed: {type(err).__name__}"

        return ProviderStatusResponse(
            provider_id=self.provider_id,
            provider_name=self.provider_name,
            is_configured=True,
            is_available=is_available,
            status_code=status_code,
            status_message=status_msg,
            required_credentials=[],
            documentation_url="https://open-meteo.com/en/docs",
            attribution="Weather data by Open-Meteo.com under CC BY 4.0; includes Copernicus ERA5 data.",
        )

    def _normalize_raw_response(
        self,
        raw_data: Dict[str, Any],
        block: BlockDetail,
        retrieved_at: datetime,
        exclude_from: Optional[date] = None,
    ) -> RainfallObservationSeries:
        """Parse raw provider JSON into validated RainfallObservationSeries.

        Days on or after `exclude_from` (the incomplete current day) are dropped.
        """
        daily_units = raw_data.get("daily_units", {})
        precip_unit = daily_units.get("precipitation_sum", "mm")
        if precip_unit != "mm":
            raise ValueError(f"Unexpected precipitation unit '{precip_unit}', expected 'mm'")

        daily = raw_data.get("daily", {})
        time_list: List[str] = daily.get("time", [])
        precip_list: List[Optional[float]] = daily.get("precipitation_sum", [])

        if len(time_list) != len(precip_list):
            raise ValueError("Mismatched time and precipitation array lengths from provider")

        observations: List[RainfallObservationItem] = []
        total_mm = 0.0
        missing_count = 0

        for t_str, p_val in zip(time_list, precip_list):
            obs_date = date.fromisoformat(t_str)
            if exclude_from is not None and obs_date >= exclude_from:
                continue

            if p_val is None:
                missing_count += 1
                observations.append(
                    RainfallObservationItem(
                        date=obs_date,
                        variable="precipitation",
                        value_mm=None,
                        unit="mm",
                        quality=QualityStatus.MISSING,
                        data_type=DataType.MODEL_ANALYSIS,
                        notes="No precipitation value reported for this calendar day",
                    )
                )
            else:
                float_val = round(float(p_val), 2)
                # Physical bounds sanity check: precipitation >= 0 mm, <= 1500 mm (historical record)
                if float_val < 0.0 or float_val > 1500.0:
                    missing_count += 1
                    observations.append(
                        RainfallObservationItem(
                            date=obs_date,
                            variable="precipitation",
                            value_mm=None,
                            unit="mm",
                            quality=QualityStatus.MISSING,
                            data_type=DataType.MODEL_ANALYSIS,
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
                            data_type=DataType.MODEL_ANALYSIS,
                            notes=None,
                        )
                    )

        if not observations:
            raise ValueError("Provider returned zero observation points")

        provider_meta = ProviderMetadata(
            provider_id=self.provider_id,
            provider_name=self.provider_name,
            dataset_name="Open-Meteo recent-past model analysis (forecast-service past_days; not gauge observations)",
            attribution="Weather data by Open-Meteo.com under CC BY 4.0; includes Copernicus ERA5 data.",
            license="CC BY 4.0",
            spatial_resolution="0.1° (~11 km)",
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
            data_type=DataType.MODEL_ANALYSIS,
            retrieved_at=retrieved_at,
            provider=provider_meta,
        )

    async def get_recent_observations(
        self,
        block: BlockDetail,
        days: int = 7,
        client: Optional[httpx.AsyncClient] = None,
    ) -> RainfallObservationSeries:
        """Fetch and normalize daily observations for the given block and duration."""
        if days < 1 or days > 30:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Query parameter 'days' must be between 1 and 30, got {days}",
            )

        # Open-Meteo past_days parameter
        params = {
            "latitude": block.latitude,
            "longitude": block.longitude,
            "daily": "precipitation_sum",
            "past_days": days,
            "forecast_days": 1,  # today (incomplete) is requested but excluded during normalization
            "timezone": "Asia/Kolkata",
        }

        retrieved_at = datetime.now(timezone.utc)
        exclude_from = today_ist()
        last_error: Optional[Exception] = None

        for attempt in range(1 + self._max_retries):
            try:
                if client is not None:
                    response = await client.get(self._base_url, params=params)
                else:
                    async with httpx.AsyncClient(timeout=self._timeout_seconds) as temp_client:
                        response = await temp_client.get(self._base_url, params=params)

                if response.status_code == 200:
                    raw_json = response.json()
                    return self._normalize_raw_response(raw_json, block, retrieved_at, exclude_from=exclude_from)
                elif response.status_code == 429:
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail="Upstream weather provider rate limit reached. Please try again shortly.",
                    )
                else:
                    logger.warning(
                        f"Open-Meteo HTTP error (attempt {attempt + 1}): {response.status_code} - {response.text[:200]}"
                    )
                    last_error = HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail=f"Upstream rainfall provider returned HTTP {response.status_code}",
                    )

            except httpx.TimeoutException as err:
                logger.warning(f"Open-Meteo timeout on attempt {attempt + 1}: {err}")
                last_error = HTTPException(
                    status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                    detail="Rainfall provider request timed out. Please retry.",
                )
            except HTTPException:
                raise
            except Exception as err:
                logger.error(f"Open-Meteo request error on attempt {attempt + 1}: {err}")
                last_error = HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Unable to fetch data from rainfall provider: {type(err).__name__}",
                )

        if isinstance(last_error, HTTPException):
            raise last_error
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to retrieve rainfall data after retry attempts",
        )

    def _normalize_forecast_response(
        self,
        raw_data: Dict[str, Any],
        block: BlockDetail,
        requested_days: int,
        generated_at: datetime,
    ) -> ForecastSeries:
        """Parse raw forecast JSON into validated ForecastSeries."""
        daily = raw_data.get("daily", {})
        time_list: List[str] = daily.get("time", [])
        precip_list: List[Optional[float]] = daily.get("precipitation_sum", [])
        prob_list: List[Optional[float]] = daily.get("precipitation_probability_max", [])

        forecast_items: List[ForecastItem] = []
        lead_day = 1

        for i, t_str in enumerate(time_list):
            if lead_day > requested_days:
                break
            forecast_date = date.fromisoformat(t_str)
            p_val = precip_list[i] if i < len(precip_list) else None
            prob_val = prob_list[i] if i < len(prob_list) else None

            p_float = round(float(p_val), 2) if p_val is not None and 0.0 <= float(p_val) <= 1500.0 else None
            prob_float = round(float(prob_val), 1) if prob_val is not None and 0.0 <= float(prob_val) <= 100.0 else None

            forecast_items.append(
                ForecastItem(
                    date=forecast_date,
                    precipitation_sum_mm=p_float,
                    precipitation_probability_pct=prob_float,
                    unit="mm",
                    horizon_day=lead_day,
                    data_type=DataType.FORECAST,
                    notes=f"Day {lead_day} forecast (Open-Meteo High-Resolution Ensemble)",
                )
            )
            lead_day += 1

        provider_meta = ProviderMetadata(
            provider_id=self.provider_id,
            provider_name=self.provider_name,
            dataset_name="Open-Meteo Numerical Weather Prediction Ensemble (GFS/ECMWF Blend)",
            attribution="Weather forecast by Open-Meteo.com under CC BY 4.0; includes WMO numerical model runs.",
            license="CC BY 4.0",
            spatial_resolution="0.1° (~11 km)",
            temporal_resolution="daily",
            timezone=raw_data.get("timezone", "Asia/Kolkata"),
        )

        return ForecastSeries(
            block_id=block.id,
            block_name=block.name,
            district_id=block.district_id,
            district_name=block.district_name,
            latitude=block.latitude,
            longitude=block.longitude,
            forecast_generated_at=generated_at,
            forecast_days=requested_days,
            available_days=len(forecast_items),
            forecast=forecast_items,
            provider=provider_meta,
            data_type=DataType.FORECAST,
        )

    async def get_forecast(
        self,
        block: BlockDetail,
        days: int = 14,
    ) -> ForecastSeries:
        """Fetch future daily forecast for the specified block (1 to 14 days lead time)."""
        if days < 1 or days > 16:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Forecast horizon 'days' must be between 1 and 16, got {days}",
            )

        params = {
            "latitude": block.latitude,
            "longitude": block.longitude,
            "daily": "precipitation_sum,precipitation_probability_max",
            "forecast_days": days,
            "timezone": "Asia/Kolkata",
        }

        generated_at = datetime.now(timezone.utc)
        last_error: Optional[Exception] = None

        for attempt in range(1 + self._max_retries):
            try:
                async with httpx.AsyncClient(timeout=self._timeout_seconds) as client:
                    response = await client.get(self._base_url, params=params)

                if response.status_code == 200:
                    raw_json = response.json()
                    return self._normalize_forecast_response(raw_json, block, days, generated_at)
                elif response.status_code == 429:
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail="Upstream forecast provider rate limit reached. Please retry shortly.",
                    )
                else:
                    last_error = HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail=f"Upstream forecast provider returned HTTP {response.status_code}",
                    )
            except httpx.TimeoutException:
                last_error = HTTPException(
                    status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                    detail="Forecast provider request timed out. Please retry.",
                )
            except HTTPException:
                raise
            except Exception as err:
                last_error = HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Unable to fetch forecast data: {type(err).__name__}",
                )

        if isinstance(last_error, HTTPException):
            raise last_error
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to retrieve forecast data after retry attempts",
        )

