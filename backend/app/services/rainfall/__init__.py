"""Rainfall services and provider implementations."""

from app.services.rainfall.base import RainfallProvider
from app.services.rainfall.factory import (
    get_rainfall_provider,
    list_available_providers,
)
from app.services.rainfall.era5_land import CopernicusERA5LandProvider
from app.services.rainfall.imd import IMDRainfallProvider
from app.services.rainfall.open_meteo import OpenMeteoRainfallProvider
from app.services.rainfall.open_meteo_archive import OpenMeteoArchiveProvider

__all__ = [
    "RainfallProvider",
    "OpenMeteoRainfallProvider",
    "OpenMeteoArchiveProvider",
    "IMDRainfallProvider",
    "CopernicusERA5LandProvider",
    "get_rainfall_provider",
    "list_available_providers",
]


