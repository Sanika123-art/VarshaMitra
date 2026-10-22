"""API routes for rainfall observations, future forecasts, and source status."""

from datetime import date
from typing import List
from fastapi import APIRouter, HTTPException, Query, status

from app.schemas.rainfall import (
    ForecastSeries,
    ProviderStatusResponse,
    RainfallObservationSeries,
)
from app.services.location_service import location_service
from app.services.rainfall.factory import (
    get_rainfall_provider,
    list_available_providers,
)
from app.services.rainfall.open_meteo import OpenMeteoRainfallProvider
from app.services.rainfall.open_meteo_archive import OpenMeteoArchiveProvider

router = APIRouter(prefix="/rainfall", tags=["Rainfall Intelligence"])


@router.get(
    "/observations/{block_id}",
    response_model=RainfallObservationSeries,
    status_code=status.HTTP_200_OK,
    summary="Get Rainfall Observation Series",
    description="Fetch recent daily rainfall observations/reanalysis for an administrative block with quality flags and source attribution.",
)
async def get_block_rainfall_observations(
    block_id: str,
    days: int = Query(
        default=7,
        ge=1,
        le=30,
        description="Number of preceding calendar days to retrieve",
        examples=[7],
    ),
    provider: str = Query(
        default="open-meteo",
        description="Provider key for rainfall data ('open-meteo' or 'imd')",
        examples=["open-meteo"],
    ),
) -> RainfallObservationSeries:
    """Retrieve normalized rainfall observations for a validated block."""
    block = location_service.get_block(block_id)
    if not block:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Block '{block_id}' not found in curated Maharashtra dataset.",
        )

    provider_instance = get_rainfall_provider(provider)
    return await provider_instance.get_recent_observations(block=block, days=days)


@router.get(
    "/forecast/{block_id}",
    response_model=ForecastSeries,
    status_code=status.HTTP_200_OK,
    summary="Get Future Rainfall Forecast (1 to 14 Days)",
    description="Fetch future numerical weather prediction outlook. Distinct from historical observations and labeled explicitly as forecast.",
)
async def get_block_rainfall_forecast(
    block_id: str,
    days: int = Query(
        default=14,
        ge=1,
        le=16,
        description="Forecast horizon in days (1 to 14 standard, up to 16 maximum)",
        examples=[14],
    ),
    provider: str = Query(
        default="open-meteo",
        description="Forecast provider key ('open-meteo')",
        examples=["open-meteo"],
    ),
) -> ForecastSeries:
    """Retrieve forward-looking weather forecast for a block."""
    block = location_service.get_block(block_id)
    if not block:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Block '{block_id}' not found in curated Maharashtra dataset.",
        )

    provider_instance = get_rainfall_provider(provider)
    if not isinstance(provider_instance, OpenMeteoRainfallProvider):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Provider '{provider}' does not support future forward forecasts. Use 'provider=open-meteo'.",
        )

    return await provider_instance.get_forecast(block=block, days=days)


@router.get(
    "/historical/{block_id}",
    response_model=RainfallObservationSeries,
    status_code=status.HTTP_200_OK,
    summary="Get Historical ERA5-Land Reanalysis Window",
    description="Query historical multi-month or multi-year reanalysis data for a block centroid.",
)
async def get_block_historical_reanalysis(
    block_id: str,
    start_date: date = Query(
        ...,
        description="Historical start date (YYYY-MM-DD)",
        examples=["2023-06-01"],
    ),
    end_date: date = Query(
        ...,
        description="Historical end date (YYYY-MM-DD)",
        examples=["2023-10-31"],
    ),
    provider: str = Query(
        default="open-meteo-archive",
        description="Historical archive provider ('open-meteo-archive')",
        examples=["open-meteo-archive"],
    ),
) -> RainfallObservationSeries:
    """Query arbitrary historical date window for a block."""
    block = location_service.get_block(block_id)
    if not block:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Block '{block_id}' not found in curated Maharashtra dataset.",
        )

    provider_instance = get_rainfall_provider(provider)
    if not isinstance(provider_instance, OpenMeteoArchiveProvider):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Provider '{provider}' does not support arbitrary historical date range queries. Use 'provider=open-meteo-archive'.",
        )

    return await provider_instance.get_historical_range(block=block, start_date=start_date, end_date=end_date)


@router.get(
    "/source-status",
    response_model=List[ProviderStatusResponse],
    status_code=status.HTTP_200_OK,
    summary="Rainfall Providers Operational Status",
    description="Reports the live operational readiness, credentials requirement, and documentation for all supported rainfall providers.",
)
async def get_source_status() -> List[ProviderStatusResponse]:
    """Inspect and report all provider statuses."""
    providers = list_available_providers()
    statuses = []
    for p in providers:
        st = await p.get_source_status()
        statuses.append(st)
    return statuses
