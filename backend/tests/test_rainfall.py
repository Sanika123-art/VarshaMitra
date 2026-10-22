"""Tests for rainfall data provider integration, normalization, and quality flags."""

from datetime import date
from typing import Any, Dict
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
import httpx
import pytest
from app.schemas.rainfall import QualityStatus
from app.services.location_service import location_service
from app.services.rainfall.open_meteo import OpenMeteoRainfallProvider


def test_rainfall_source_status(client: TestClient) -> None:
    """Test GET /api/v1/rainfall/source-status reports configured providers and credentials."""
    response = client.get("/api/v1/rainfall/source-status")
    assert response.status_code == 200
    providers = response.json()
    assert len(providers) >= 2

    provider_ids = {p["provider_id"] for p in providers}
    assert "open-meteo" in provider_ids
    assert "imd" in provider_ids

    # Verify IMD honest credential state
    imd = next(p for p in providers if p["provider_id"] == "imd")
    assert imd["is_configured"] is False
    assert imd["status_code"] == "configuration_required"
    assert "IMD_API_KEY" in imd["required_credentials"]
    assert "IMD_API_BASE_URL" in imd["required_credentials"]


def test_request_unconfigured_imd_provider(client: TestClient) -> None:
    """Test requesting IMD provider without credentials returns honest 503."""
    response = client.get("/api/v1/rainfall/observations/baramati?provider=imd")
    assert response.status_code == 503
    assert "not configured" in response.json()["detail"].lower()
    assert "IMD_API_KEY" in response.json()["detail"]


def test_request_unknown_rainfall_provider(client: TestClient) -> None:
    """Test requesting non-existent provider returns 400."""
    response = client.get("/api/v1/rainfall/observations/baramati?provider=nonexistent_feed")
    assert response.status_code == 400
    assert "unknown rainfall provider" in response.json()["detail"].lower()


def test_request_rainfall_unknown_block(client: TestClient) -> None:
    """Test requesting observations for non-existent block returns 404."""
    response = client.get("/api/v1/rainfall/observations/unknown_block_404")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_request_rainfall_invalid_days_param(client: TestClient) -> None:
    """Test validation on 'days' parameter."""
    # Days < 1
    res1 = client.get("/api/v1/rainfall/observations/baramati?days=0")
    assert res1.status_code == 422

    # Days > 30
    res2 = client.get("/api/v1/rainfall/observations/baramati?days=35")
    assert res2.status_code == 422


@pytest.mark.asyncio
async def test_open_meteo_normalization_clean_data() -> None:
    """Test Open-Meteo adapter converts raw JSON into normalized series with mm units and fresh flags."""
    raw_response: Dict[str, Any] = {
        "latitude": 18.15,
        "longitude": 74.58,
        "timezone": "Asia/Kolkata",
        "daily_units": {
            "time": "iso8601",
            "precipitation_sum": "mm",
        },
        "daily": {
            "time": ["2026-10-15", "2026-10-16", "2026-10-17"],
            "precipitation_sum": [0.0, 14.5, 3.2],
        },
    }

    block = location_service.get_block("baramati")
    assert block is not None

    provider = OpenMeteoRainfallProvider()

    with patch("httpx.AsyncClient.get") as mock_get:
        mock_response = httpx.Response(
            status_code=200,
            json=raw_response,
            request=httpx.Request("GET", "https://api.open-meteo.com/v1/forecast"),
        )
        mock_get.return_value = mock_response

        series = await provider.get_recent_observations(block, days=3)

    assert series.block_id == "baramati"
    assert series.block_name == "Baramati"
    assert series.count == 3
    assert series.total_rainfall_mm == 17.7
    assert series.missing_days_count == 0
    assert series.provider.provider_id == "open-meteo"
    assert series.provider.license == "CC BY 4.0"

    # Verify individual observations
    assert series.observations[0].date == date(2026, 10, 15)
    assert series.observations[0].value_mm == 0.0
    assert series.observations[0].quality == QualityStatus.FRESH
    assert series.observations[0].unit == "mm"

    assert series.observations[1].value_mm == 14.5
    assert series.observations[1].quality == QualityStatus.FRESH


@pytest.mark.asyncio
async def test_open_meteo_normalization_with_missing_and_extreme_values() -> None:
    """Test Open-Meteo adapter handles nulls and physically impossible values as MISSING."""
    raw_response: Dict[str, Any] = {
        "latitude": 18.60,
        "longitude": 73.45,
        "timezone": "Asia/Kolkata",
        "daily_units": {
            "time": "iso8601",
            "precipitation_sum": "mm",
        },
        "daily": {
            "time": ["2026-10-15", "2026-10-16", "2026-10-17"],
            "precipitation_sum": [10.0, None, 9999.0],  # None is missing, 9999 is physically impossible
        },
    }

    block = location_service.get_block("maval")
    assert block is not None

    provider = OpenMeteoRainfallProvider()

    with patch("httpx.AsyncClient.get") as mock_get:
        mock_get.return_value = httpx.Response(
            status_code=200,
            json=raw_response,
            request=httpx.Request("GET", "https://api.open-meteo.com/v1/forecast"),
        )
        series = await provider.get_recent_observations(block, days=3)

    assert series.count == 3
    assert series.total_rainfall_mm == 10.0  # Only valid 10.0 added
    assert series.missing_days_count == 2

    # Point 1: Valid
    assert series.observations[0].value_mm == 10.0
    assert series.observations[0].quality == QualityStatus.FRESH

    # Point 2: Null / Missing
    assert series.observations[1].value_mm is None
    assert series.observations[1].quality == QualityStatus.MISSING
    assert "No precipitation value reported" in (series.observations[1].notes or "")

    # Point 3: Out of range
    assert series.observations[2].value_mm is None
    assert series.observations[2].quality == QualityStatus.MISSING
    assert "out of physical range" in (series.observations[2].notes or "")


@pytest.mark.asyncio
async def test_open_meteo_timeout_error_handling() -> None:
    """Test that provider timeouts map to 504 Gateway Timeout."""
    block = location_service.get_block("baramati")
    assert block is not None

    provider = OpenMeteoRainfallProvider(timeout_seconds=0.1, max_retries=0)

    with patch("httpx.AsyncClient.get", side_effect=httpx.TimeoutException("Connection timed out")):
        with pytest.raises(Exception) as exc_info:
            await provider.get_recent_observations(block, days=7)

    assert "timed out" in str(exc_info.value).lower()
