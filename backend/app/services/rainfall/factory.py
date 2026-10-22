"""Factory for selecting and instantiating rainfall providers."""

from typing import Dict, List
from fastapi import HTTPException, status
from app.services.rainfall.base import RainfallProvider
from app.services.rainfall.era5_land import CopernicusERA5LandProvider
from app.services.rainfall.imd import IMDRainfallProvider
from app.services.rainfall.open_meteo import OpenMeteoRainfallProvider
from app.services.rainfall.open_meteo_archive import OpenMeteoArchiveProvider

_PROVIDERS: Dict[str, RainfallProvider] = {
    "open-meteo": OpenMeteoRainfallProvider(),
    "open-meteo-archive": OpenMeteoArchiveProvider(),
    "imd": IMDRainfallProvider(),
    "copernicus-era5-land": CopernicusERA5LandProvider(),
}




def get_rainfall_provider(provider_id: str = "open-meteo") -> RainfallProvider:
    """Return requested rainfall provider instance or raise 400 for unknown provider."""
    key = provider_id.strip().lower()
    provider = _PROVIDERS.get(key)
    if not provider:
        allowed = list(_PROVIDERS.keys())
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown rainfall provider '{provider_id}'. Allowed providers: {allowed}",
        )
    return provider


def list_available_providers() -> List[RainfallProvider]:
    """Return list of all registered rainfall providers."""
    return list(_PROVIDERS.values())
