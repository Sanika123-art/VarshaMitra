"""Comprehensive test suite for historical dataset discovery, data acquisition, and forecast integration."""

from datetime import date, datetime, timezone
import os
import tempfile
from typing import Any, Dict, List
import pytest
from fastapi.testclient import TestClient

from app.schemas.location import BlockDetail
from app.schemas.rainfall import (
    DataType,
    ForecastSeries,
    HistoricalRainfallRecord,
    QualityStatus,
    RainfallObservationSeries,
)
from app.services.dataset.inventory import get_source_inventory
from app.services.dataset.storage import HistoricalDatasetStorage
from app.services.location_service import location_service
from app.services.rainfall.era5_land import CopernicusERA5LandProvider
from app.services.rainfall.factory import get_rainfall_provider, list_available_providers
from app.services.rainfall.imd import IMDRainfallProvider
from app.services.rainfall.open_meteo import OpenMeteoRainfallProvider
from app.services.rainfall.open_meteo_archive import OpenMeteoArchiveProvider


@pytest.fixture
def temp_storage():
    """Create a temporary SQLite database for testing."""
    with tempfile.NamedTemporaryFile(suffix=".sqlite", delete=False) as f:
        temp_path = f.name
    storage = HistoricalDatasetStorage(db_path=temp_path)
    yield storage
    try:
        if os.path.exists(temp_path):
            os.remove(temp_path)
    except OSError:
        pass



def test_source_inventory_evaluation():
    """Test source inventory evaluation contains all candidate datasets with verified properties."""
    inventory = get_source_inventory()
    assert len(inventory) >= 7

    source_ids = {s.source_id for s in inventory}
    assert "imd-mausam-api" in source_ids
    assert "copernicus-era5-land" in source_ids
    assert "open-meteo-archive" in source_ids
    assert "open-meteo-forecast" in source_ids
    assert "nasa-gpm-imerg" in source_ids
    assert "isric-soilgrids" in source_ids
    assert "nwic-district-boundaries" in source_ids

    # Verify licensing and provenance are populated
    for item in inventory:
        assert item.licensing is not None and len(item.licensing) > 0
        assert item.documentation_url.startswith("https://")
        assert item.current_reachability in ["operational", "configuration_required", "reference_catalog"]


class TestDatasetStorage:
    """Tests for persistent SQLite dataset storage, idempotency, and deduplication."""

    def test_insert_and_deduplicate(self, temp_storage: HistoricalDatasetStorage):
        rec1 = HistoricalRainfallRecord(
            location_id="baramati",
            district_id="pune",
            latitude=18.15,
            longitude=74.58,
            date=date(2023, 7, 1),
            precipitation_mm=12.4,
            data_type=DataType.REANALYSIS,
            source_provider="open-meteo-archive",
            dataset_product="ERA5-Land",
            quality_status=QualityStatus.FRESH,
            retrieved_at=datetime.now(timezone.utc),
        )

        inserted, skipped = temp_storage.insert_records([rec1])
        assert inserted == 1
        assert skipped == 0

        # Exact duplicate insertion: should be skipped
        inserted2, skipped2 = temp_storage.insert_records([rec1])
        assert inserted2 == 0
        assert skipped2 == 1

        # Query records
        records = temp_storage.query_records("baramati")
        assert len(records) == 1
        assert records[0].precipitation_mm == 12.4

        # Update record with modified value
        rec1_updated = rec1.model_copy(update={"precipitation_mm": 18.0})
        inserted3, skipped3 = temp_storage.insert_records([rec1_updated])
        assert inserted3 == 1
        assert skipped3 == 0

        records_after = temp_storage.query_records("baramati")
        assert len(records_after) == 1
        assert records_after[0].precipitation_mm == 18.0

    def test_missing_data_representation(self, temp_storage: HistoricalDatasetStorage):
        rec_missing = HistoricalRainfallRecord(
            location_id="baramati",
            district_id="pune",
            latitude=18.15,
            longitude=74.58,
            date=date(2023, 7, 2),
            precipitation_mm=None,  # Explicit missing representation
            data_type=DataType.OBSERVATION,
            source_provider="imd",
            dataset_product="IMD AWS",
            quality_status=QualityStatus.MISSING,
            retrieved_at=datetime.now(timezone.utc),
        )
        temp_storage.insert_records([rec_missing])

        records = temp_storage.query_records("baramati")
        assert len(records) == 1
        assert records[0].precipitation_mm is None
        assert records[0].quality_status == QualityStatus.MISSING

        summary = temp_storage.get_dataset_summary("baramati")
        assert summary["total_records"] == 1
        assert summary["valid_records"] == 0
        assert summary["missing_records"] == 1


class TestIMDProviderAdapter:
    """Tests for IMD provider credentials gate and payload normalization."""

    def test_unconfigured_source_status(self):
        provider = IMDRainfallProvider(api_key=None)
        assert provider.is_configured is False

    @pytest.mark.asyncio
    async def test_unconfigured_status_report(self):
        provider = IMDRainfallProvider(api_key=None)
        status_res = await provider.get_source_status()
        assert status_res.is_configured is False
        assert status_res.status_code == "configuration_required"
        assert "IMD_API_KEY" in status_res.required_credentials

    def test_imd_payload_normalization(self):
        provider = IMDRainfallProvider(api_key="mock_key")
        block = location_service.get_block("baramati")
        assert block is not None

        raw_payload = {
            "data": [
                {"date": "2026-07-01", "rainfall_mm": 15.2},
                {"date": "2026-07-02", "rainfall_mm": -999.0},  # Standard IMD missing sentinel
                {"date": "2026-07-03", "rainfall_mm": 0.0},
            ]
        }

        retrieved_at = datetime.now(timezone.utc)
        series = provider.normalize_raw_imd_response(raw_payload, block, retrieved_at)

        assert series.count == 3
        assert series.data_type == DataType.OBSERVATION
        assert series.observations[0].value_mm == 15.2
        assert series.observations[0].quality == QualityStatus.FRESH
        assert series.observations[1].value_mm is None
        assert series.observations[1].quality == QualityStatus.MISSING
        assert series.observations[2].value_mm == 0.0
        assert series.total_rainfall_mm == 15.2
        assert "GODL-India" in series.provider.license


class TestCopernicusERA5LandAdapter:
    """Tests for native Copernicus ERA5 unit conversion (meters to millimeters)."""

    def test_era5_meter_to_millimeter_conversion(self):
        provider = CopernicusERA5LandProvider(api_key="mock_key")
        block = location_service.get_block("baramati")
        assert block is not None

        raw_records = [
            {"date": "2023-07-01", "total_precipitation": 0.0254},  # 0.0254 m = 25.4 mm
            {"date": "2023-07-02", "total_precipitation": 0.0},     # 0.0 mm
            {"date": "2023-07-03", "total_precipitation": None},    # Missing
        ]

        retrieved_at = datetime.now(timezone.utc)
        series = provider.normalize_era5_native_records(raw_records, block, retrieved_at)

        assert series.count == 3
        assert series.observations[0].value_mm == 25.4
        assert series.observations[0].unit == "mm"
        assert series.observations[1].value_mm == 0.0
        assert series.observations[2].value_mm is None
        assert series.observations[2].quality == QualityStatus.MISSING
        assert series.total_rainfall_mm == 25.4


class TestOpenMeteoForecastAdapter:
    """Tests for forward-looking forecast normalization and horizon limits."""

    def test_forecast_normalization(self):
        provider = OpenMeteoRainfallProvider()
        block = location_service.get_block("baramati")
        assert block is not None

        raw_forecast = {
            "timezone": "Asia/Kolkata",
            "daily": {
                "time": ["2026-10-23", "2026-10-24", "2026-10-25"],
                "precipitation_sum": [0.0, 5.2, 12.0],
                "precipitation_probability_max": [10, 45, 80],
            },
        }

        series = provider._normalize_forecast_response(
            raw_data=raw_forecast,
            block=block,
            requested_days=3,
            generated_at=datetime.now(timezone.utc),
        )

        assert series.forecast_days == 3
        assert series.available_days == 3
        assert series.data_type == DataType.FORECAST
        assert series.forecast[0].horizon_day == 1
        assert series.forecast[0].precipitation_sum_mm == 0.0
        assert series.forecast[0].precipitation_probability_pct == 10.0
        assert series.forecast[1].horizon_day == 2
        assert series.forecast[1].precipitation_sum_mm == 5.2
        assert series.forecast[2].horizon_day == 3
        assert series.forecast[2].precipitation_sum_mm == 12.0
        assert "disclaimer" in series.model_dump()


class TestAPIEndpointsIntegration:
    """Live and mocked HTTP integration tests for Phase 3 Data Discovery routes."""

    def test_get_dataset_inventory(self, client: TestClient):
        res = client.get("/api/v1/dataset/inventory")
        assert res.status_code == 200
        data = res.json()
        assert len(data) >= 7
        ids = [item["source_id"] for item in data]
        assert "open-meteo-archive" in ids
        assert "imd-mausam-api" in ids

    def test_get_forecast_endpoint(self, client: TestClient):
        # Queries live Open-Meteo forecast API for Baramati
        res = client.get("/api/v1/rainfall/forecast/baramati?days=7")
        assert res.status_code == 200
        data = res.json()
        assert data["block_id"] == "baramati"
        assert data["data_type"] == "forecast"
        assert len(data["forecast"]) == 7
        assert data["forecast"][0]["horizon_day"] == 1
        assert "disclaimer" in data

    def test_get_forecast_invalid_horizon(self, client: TestClient):
        # Days must be between 1 and 16
        res = client.get("/api/v1/rainfall/forecast/baramati?days=25")
        assert res.status_code == 422

    def test_get_historical_reanalysis_endpoint(self, client: TestClient):
        # Queries live Open-Meteo archive API for Baramati in July 2023
        res = client.get("/api/v1/rainfall/historical/baramati?start_date=2023-07-01&end_date=2023-07-07")
        assert res.status_code == 200
        data = res.json()
        assert data["block_id"] == "baramati"
        assert data["data_type"] == "reanalysis"
        assert data["count"] == 7
        assert data["total_rainfall_mm"] >= 0.0

    def test_historical_ingestion_api(self, client: TestClient):
        payload = {
            "block_id": "baramati",
            "start_date": "2023-08-01",
            "end_date": "2023-08-05",
            "provider": "open-meteo-archive",
        }
        res = client.post("/api/v1/dataset/ingest", json=payload)
        assert res.status_code == 201
        data = res.json()
        assert data["location_id"] == "baramati"
        assert data["total_days"] == 5
        assert data["ingested_count"] + data["skipped_count"] == 5

        # Query stored records
        res_records = client.get("/api/v1/dataset/records/baramati?start_date=2023-08-01&end_date=2023-08-05")
        assert res_records.status_code == 200
        records = res_records.json()
        assert len(records) == 5
        assert records[0]["location_id"] == "baramati"
        assert records[0]["data_type"] == "reanalysis"

    def test_dataset_storage_summary_endpoint(self, client: TestClient):
        res = client.get("/api/v1/dataset/summary")
        assert res.status_code == 200
        summary = res.json()
        assert "total_records" in summary
        assert "storage_file" in summary
