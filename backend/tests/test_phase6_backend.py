"""Phase 6 backend integration and integrity tests.

Verifies:
1. /api/v1/risk/summary endpoint structure, bulk resolution, and caching.
2. Data provenance and seasonal context metadata.
3. Dataset ingestion provider validation (rejecting non-archive providers).
4. Storage summary reporting relative basename.
5. Ingestion CLI exit codes.
"""

from datetime import date
import sys
import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app
from app.services.dataset.ingest import ingest_historical_data, main as ingest_main
from app.services.dataset.storage import dataset_storage
from app.schemas.rainfall import DataType


@pytest.fixture
def test_client():
    return TestClient(app)


def test_risk_summary_endpoint(test_client):
    """Test /api/v1/risk/summary returns all curated blocks with valid structure."""
    response = test_client.get("/api/v1/risk/summary?window_days=14")
    assert response.status_code == 200
    data = response.json()
    assert "count" in data
    assert "available_count" in data
    assert "items" in data
    assert data["count"] > 0
    assert len(data["items"]) == data["count"]
    assert data["available_count"] > 0

    # Check structure of each item
    for item in data["items"]:
        assert "block_id" in item
        assert "block_name" in item
        assert "district_id" in item
        assert "district_name" in item
        assert "latitude" in item
        assert "longitude" in item
        assert "status" in item
        assert item["status"] in ["ok", "unavailable"]
        if item["status"] == "ok":
            assert "overall_risk" in item
            assert item["overall_risk"] in ["low", "moderate", "high", "critical", "insufficient_data"]
            assert "dry_spell_severity" in item
            assert "heavy_rain_event" in item
            assert "monsoon_onset_status" in item


def test_risk_summary_window_days_validation(test_client):
    """Test /api/v1/risk/summary rejects window_days outside 3..30 range."""
    # Window days > 30 should fail validation
    resp_large = test_client.get("/api/v1/risk/summary?window_days=45")
    assert resp_large.status_code == 422

    # Window days < 3 should fail validation
    resp_small = test_client.get("/api/v1/risk/summary?window_days=1")
    assert resp_small.status_code == 422


def test_risk_summary_unknown_provider(test_client):
    """Test /api/v1/risk/summary returns 400 for unsupported rainfall provider."""
    response = test_client.get("/api/v1/risk/summary?provider=unknown_provider")
    assert response.status_code == 400
    assert "Unknown rainfall provider" in response.json()["detail"]


def test_climate_and_risk_provenance_metadata(test_client):
    """Test that risk and climate indicators endpoints return data_provenance and season_note."""
    risk_resp = test_client.get("/api/v1/risk/baramati?window_days=14")
    assert risk_resp.status_code == 200
    risk_data = risk_resp.json()
    assert "data_provenance" in risk_data
    prov = risk_data["data_provenance"]
    assert "provider_id" in prov
    assert "data_type" in prov
    assert "dataset_name" in prov
    assert "attribution" in prov
    assert "spatial_resolution" in prov
    assert "is_station_observation" in prov
    assert prov["is_station_observation"] is False

    # Season note should be present
    assert "season_note" in risk_data

    # Indicators response should also have provenance
    ind_resp = test_client.get("/api/v1/climate/indicators/baramati?window_days=14")
    assert ind_resp.status_code == 200
    ind_data = ind_resp.json()
    assert "data_provenance" in ind_data
    assert ind_data["data_provenance"]["provider_id"] == "open-meteo"


@pytest.mark.anyio
async def test_ingestion_rejects_non_archive_provider():
    """Historical ingestion must reject non-archive providers with HTTPException 400."""
    from fastapi import HTTPException
    today = date.today()

    with pytest.raises(HTTPException) as exc_info:
        await ingest_historical_data(
            block_id="baramati",
            start_date=today,
            end_date=today,
            provider_key="open-meteo",
        )
    assert exc_info.value.status_code == 400
    assert "historical date-range ingestion" in exc_info.value.detail


def test_storage_summary_returns_basename():
    """Dataset summary should return filename basename for storage_file."""
    summary = dataset_storage.get_dataset_summary()
    assert "storage_file" in summary
    assert "/" not in summary["storage_file"]
    assert "\\" not in summary["storage_file"]
    assert summary["storage_file"].endswith(".sqlite")


def test_ingest_cli_bad_args(monkeypatch):
    """Test CLI exits with code 2 on invalid arguments."""
    monkeypatch.setattr(sys, "argv", ["ingest", "--start", "invalid-date"])
    with pytest.raises(SystemExit) as exc_info:
        ingest_main()
    assert exc_info.value.code == 2
