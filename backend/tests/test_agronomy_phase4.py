"""Comprehensive unit and integration test suite for Phase 4:
Soil intelligence, crop suitability, sowing readiness, and crop-stage-specific advisories.
"""

from datetime import date, datetime, timezone
import pytest
from fastapi.testclient import TestClient

from app.schemas.agronomy import (
    AdvisoryPriority,
    CropSeason,
    SowingReadinessStatus,
    SuitabilityStatus,
    WaterSourceType,
)
from app.schemas.climate import (
    AccumulationIndicator,
    DrySpellIndicator,
    HeavyRainIndicator,
)
from app.schemas.location import BlockDetail, CoordinatesPrecision, CoverageStatus
from app.schemas.rainfall import DataType, ForecastItem, ForecastSeries, ProviderMetadata
from app.schemas.soil import (
    FieldSoilTestSubmission,
    NutrientRating,
    RegionalSoilSummaryResponse,
    SoilDataSource,
    SoilTextureClass,
)
from app.services.agronomy.advisory_engine import generate_crop_advisories
from app.services.agronomy.crop_service import crop_service
from app.services.agronomy.soil_service import soil_service
from app.services.agronomy.sowing_engine import evaluate_sowing_readiness
from app.services.agronomy.suitability_engine import evaluate_crop_suitability


@pytest.fixture
def sample_block() -> BlockDetail:
    """Fixture for Baramati block."""
    return BlockDetail(
        id="baramati",
        name="Baramati",
        name_mr="बारामती",
        district_id="pune",
        district_name="Pune",
        latitude=18.15,
        longitude=74.58,
        coordinates_precision=CoordinatesPrecision.APPROXIMATE_CENTROID,
        coverage_status=CoverageStatus.CURATED_FOCUS_SUBSET,
        state_id="mh",
        state_name="Maharashtra",
        state_name_mr="महाराष्ट्र",
    )


class TestSoilIntelligence:
    """Tests for regional soil profiles, Soil Health Card submissions, and nutrient ratings."""

    def test_regional_soil_profile_lookup(self):
        profile = soil_service.get_regional_profile("baramati")
        assert profile.location_id == "baramati"
        assert profile.dominant_texture == SoilTextureClass.BLACK_COTTON_VERTISOL
        assert profile.topsoil_ph == 7.9
        assert profile.available_water_capacity_mm_m == 145.0
        assert profile.source == SoilDataSource.REGIONAL_ESTIMATE

    def test_soil_nutrient_diagnostic_ratings(self):
        # pH
        assert soil_service.classify_ph(6.0) == "acidic"
        assert soil_service.classify_ph(7.2) == "optimal_neutral"
        assert soil_service.classify_ph(8.2) == "moderately_alkaline"
        assert soil_service.classify_ph(8.8) == "highly_alkaline"

        # Salinity (EC)
        assert soil_service.classify_ec(0.5) == "normal_non_saline"
        assert soil_service.classify_ec(1.5) == "critical_for_sensitive_crops"
        assert soil_service.classify_ec(2.5) == "hazardous_saline"

        # Organic Carbon
        assert soil_service.rate_organic_carbon(0.35) == NutrientRating.LOW
        assert soil_service.rate_organic_carbon(0.50) == NutrientRating.MEDIUM
        assert soil_service.rate_organic_carbon(0.75) == NutrientRating.HIGH

        # Nitrogen (kg/ha)
        assert soil_service.rate_nitrogen(200.0) == NutrientRating.LOW
        assert soil_service.rate_nitrogen(350.0) == NutrientRating.MEDIUM
        assert soil_service.rate_nitrogen(600.0) == NutrientRating.HIGH

    def test_field_soil_test_submission_and_retrieval(self):
        sub = FieldSoilTestSubmission(
            location_id="baramati_unit",
            field_identifier="Survey-104",
            sampling_date=date(2026, 5, 20),
            laboratory_name="KVK Baramati Lab",
            ph=7.5,
            electrical_conductivity_ds_m=0.4,
            organic_carbon_pct=0.55,
            available_nitrogen_kg_ha=260.0,
            available_phosphorus_kg_ha=16.0,
            available_potassium_kg_ha=320.0,
        )

        res = soil_service.register_field_soil_test(sub)
        assert res.profile_id.startswith("soil_")
        assert res.ph_rating == "optimal_neutral"
        assert res.salinity_status == "normal_non_saline"
        assert res.nitrogen_rating == NutrientRating.LOW
        assert res.phosphorus_rating == NutrientRating.MEDIUM
        assert res.potassium_rating == NutrientRating.HIGH

        # Retrieve latest
        retrieved = soil_service.get_latest_field_test("baramati_unit")
        assert retrieved is not None
        assert retrieved.field_identifier == "Survey-104"
        assert retrieved.ph == 7.5


class TestCropCatalogue:
    """Tests for crop catalogue requirements, phenology, and sowing calendars."""

    def test_catalogue_contains_core_crops(self):
        crops = crop_service.list_crops()
        crop_ids = {c.crop_id for c in crops}
        assert "soybean" in crop_ids
        assert "cotton" in crop_ids
        assert "pigeonpea" in crop_ids
        assert "pearl_millet" in crop_ids
        assert "sorghum" in crop_ids
        assert "onion" in crop_ids
        assert "chickpea" in crop_ids
        assert "sugarcane" in crop_ids

    def test_filter_by_season(self):
        kharif_crops = crop_service.list_crops(CropSeason.KHARIF)
        for c in kharif_crops:
            assert c.season in (CropSeason.KHARIF, CropSeason.PERENNIAL)

    def test_crop_growth_stages_and_sensitivities(self):
        crop = crop_service.get_crop("soybean")
        assert crop is not None
        stage_ids = [s.stage_id for s in crop.growth_stages]
        assert "sowing" in stage_ids
        assert "vegetative" in stage_ids
        assert "flowering" in stage_ids
        assert "pod_development" in stage_ids
        assert "maturity" in stage_ids

        flowering_stage = crop_service.get_stage("soybean", "flowering")
        assert flowering_stage is not None
        assert flowering_stage.is_critical_moisture_stage is True


class TestCropSuitabilityEngine:
    """Tests for explainable crop suitability assessment."""

    def test_sugarcane_unsuitable_under_rainfed(self, sample_block: BlockDetail):
        sugarcane = crop_service.get_crop("sugarcane")
        assert sugarcane is not None
        soil = soil_service.get_regional_profile("baramati")

        res_rainfed = evaluate_crop_suitability(
            crop=sugarcane,
            soil_profile=soil,
            field_test=None,
            water_source=WaterSourceType.RAINFED,
            block=sample_block,
        )
        assert res_rainfed.status == SuitabilityStatus.UNSUITABLE
        assert any("pure rainfed" in l.lower() for l in res_rainfed.limiting_factors)

    def test_sugarcane_suitable_under_assured_irrigation(self, sample_block: BlockDetail):
        sugarcane = crop_service.get_crop("sugarcane")
        assert sugarcane is not None
        soil = soil_service.get_regional_profile("baramati")

        res_irrigated = evaluate_crop_suitability(
            crop=sugarcane,
            soil_profile=soil,
            field_test=None,
            water_source=WaterSourceType.ASSURED_IRRIGATION,
            block=sample_block,
        )
        assert res_irrigated.status == SuitabilityStatus.SUITABLE
        assert res_irrigated.suitability_score >= 75

    def test_drought_hardy_crops_suitable_rainfed(self, sample_block: BlockDetail):
        bajra = crop_service.get_crop("pearl_millet")
        assert bajra is not None
        soil = soil_service.get_regional_profile("baramati")

        res = evaluate_crop_suitability(
            crop=bajra,
            soil_profile=soil,
            field_test=None,
            water_source=WaterSourceType.RAINFED,
            block=sample_block,
        )
        assert res.status in (SuitabilityStatus.SUITABLE, SuitabilityStatus.CONDITIONALLY_SUITABLE)
        assert any("drought tolerance" in s.lower() for s in res.supporting_factors)


class TestSowingReadinessEngine:
    """Tests for sowing window verification, rainfall thresholds, and forward forecast hazards."""

    def test_favorable_sowing_conditions(self, sample_block: BlockDetail):
        soybean = crop_service.get_crop("soybean")
        assert soybean is not None

        # Adequate rainfall (85 mm), optimal date (June 28), benign forecast
        acc = AccumulationIndicator(total_mm=85.0, valid_days_count=14, missing_days_count=0, daily_average_mm=6.0)
        target_d = date(2026, 6, 28)

        provider_meta = ProviderMetadata(
            provider_id="open-meteo",
            provider_name="Open-Meteo",
            dataset_name="NWP Ensemble",
            attribution="CC BY 4.0",
            license="CC BY 4.0",
            spatial_resolution="0.1°",
        )
        benign_forecast = ForecastSeries(
            block_id="baramati",
            block_name="Baramati",
            district_id="pune",
            district_name="Pune",
            latitude=18.15,
            longitude=74.58,
            forecast_generated_at=datetime.now(timezone.utc),
            forecast_days=7,
            available_days=7,
            forecast=[
                ForecastItem(date=date(2026, 6, 29), precipitation_sum_mm=10.0, horizon_day=1),
                ForecastItem(date=date(2026, 6, 30), precipitation_sum_mm=5.0, horizon_day=2),
                ForecastItem(date=date(2026, 7, 1), precipitation_sum_mm=12.0, horizon_day=3),
                ForecastItem(date=date(2026, 7, 2), precipitation_sum_mm=8.0, horizon_day=4),
                ForecastItem(date=date(2026, 7, 3), precipitation_sum_mm=4.0, horizon_day=5),
                ForecastItem(date=date(2026, 7, 4), precipitation_sum_mm=6.0, horizon_day=6),
                ForecastItem(date=date(2026, 7, 5), precipitation_sum_mm=10.0, horizon_day=7),
            ],
            provider=provider_meta,
        )

        res = evaluate_sowing_readiness(
            block=sample_block,
            crop=soybean,
            target_date=target_d,
            accumulation=acc,
            forecast=benign_forecast,
        )

        assert res.status == SowingReadinessStatus.FAVORABLE
        assert res.window_status == "optimal"
        assert res.forecast_14d_hazard_flag is False
        assert "वाफसा स्थिती अनुकूल" in res.sowing_readiness_summary_mr

    def test_wait_when_antecedent_rainfall_insufficient(self, sample_block: BlockDetail):
        soybean = crop_service.get_crop("soybean")
        assert soybean is not None

        # Only 20 mm rainfall (< 75 mm threshold required for soybean)
        acc = AccumulationIndicator(total_mm=20.0, valid_days_count=14, missing_days_count=0, daily_average_mm=1.4)
        target_d = date(2026, 6, 25)

        res = evaluate_sowing_readiness(
            block=sample_block,
            crop=soybean,
            target_date=target_d,
            accumulation=acc,
            forecast=None,
        )

        assert res.status == SowingReadinessStatus.WAIT_AND_REASSESS
        assert any("dry soil" in r.lower() for r in res.risk_factors)
        assert "धुळवाफ" in res.sowing_readiness_summary_mr

    def test_unfavorable_when_outside_sowing_season(self, sample_block: BlockDetail):
        soybean = crop_service.get_crop("soybean")
        assert soybean is not None

        acc = AccumulationIndicator(total_mm=120.0, valid_days_count=14, missing_days_count=0, daily_average_mm=8.5)
        # August 20 is well past July 25 cutoff for soybean
        target_d = date(2026, 8, 20)

        res = evaluate_sowing_readiness(
            block=sample_block,
            crop=soybean,
            target_date=target_d,
            accumulation=acc,
            forecast=None,
        )

        assert res.status == SowingReadinessStatus.UNFAVORABLE
        assert res.window_status == "outside_season"


class TestCropAdvisoryEngine:
    """Tests for prioritized crop-stage advisories and bilingual output."""

    def test_heavy_deluge_triggers_critical_drainage_advisory(self, sample_block: BlockDetail):
        soybean = crop_service.get_crop("soybean")
        assert soybean is not None
        stage = crop_service.get_stage("soybean", "sowing")
        assert stage is not None

        acc = AccumulationIndicator(total_mm=95.0, valid_days_count=7, missing_days_count=0, daily_average_mm=13.5)
        dry = DrySpellIndicator(threshold_mm=2.5, dry_days_count=0, max_consecutive_dry_days=0, current_consecutive_dry_days=0, severity="none")
        heavy = HeavyRainIndicator(threshold_mm=64.5, heavy_rain_days_count=1, max_single_day_mm=82.0, event_dates=[date(2026, 7, 2)], has_heavy_rain_event=True)

        res = generate_crop_advisories(
            block=sample_block,
            crop=soybean,
            stage=stage,
            climate_risk=None,
            accumulation=acc,
            dry_spell=dry,
            heavy_rain=heavy,
            language="mr",
        )

        assert res.primary_advisory.priority == AdvisoryPriority.CRITICAL
        assert "निचरा" in res.primary_advisory.primary_action_mr
        assert "drainage" in res.primary_advisory.primary_action_en.lower()

    def test_prolonged_dry_spell_in_flowering_triggers_critical_protective_irrigation(self, sample_block: BlockDetail):
        soybean = crop_service.get_crop("soybean")
        assert soybean is not None
        stage = crop_service.get_stage("soybean", "flowering")
        assert stage is not None

        acc = AccumulationIndicator(total_mm=0.0, valid_days_count=10, missing_days_count=0, daily_average_mm=0.0)
        dry = DrySpellIndicator(threshold_mm=2.5, dry_days_count=10, max_consecutive_dry_days=10, current_consecutive_dry_days=10, severity="significant")
        heavy = HeavyRainIndicator(threshold_mm=64.5, heavy_rain_days_count=0, max_single_day_mm=0.0, event_dates=[], has_heavy_rain_event=False)

        res = generate_crop_advisories(
            block=sample_block,
            crop=soybean,
            stage=stage,
            climate_risk=None,
            accumulation=acc,
            dry_spell=dry,
            heavy_rain=heavy,
            language="en",
        )

        assert res.primary_advisory.priority == AdvisoryPriority.CRITICAL
        assert "protective irrigation" in res.primary_advisory.primary_action_en.lower()
        assert "संरक्षित पाणी" in res.primary_advisory.primary_action_mr


class TestAPIEndpointsIntegrationPhase4:
    """HTTP integration tests for Phase 4 routes."""

    def test_get_soil_profile_endpoint(self, client: TestClient):
        res = client.get("/api/v1/soil/baramati")
        assert res.status_code == 200
        data = res.json()
        assert data["location_id"] == "baramati"
        assert data["dominant_texture"] == "black_cotton_vertisol"
        assert data["topsoil_ph"] == 7.9
        assert "limitations" in data

    def test_submit_and_get_soil_test_profile(self, client: TestClient):
        payload = {
            "location_id": "baramati",
            "field_identifier": "Plot-Phase4-Test",
            "sampling_date": "2026-06-01",
            "laboratory_name": "Rahuri Soil Testing Lab",
            "ph": 7.8,
            "electrical_conductivity_ds_m": 0.5,
            "organic_carbon_pct": 0.52,
            "available_nitrogen_kg_ha": 290.0,
            "available_phosphorus_kg_ha": 20.0,
            "available_potassium_kg_ha": 350.0,
        }
        res_post = client.post("/api/v1/soil/test-profile", json=payload)
        assert res_post.status_code == 201
        data = res_post.json()
        assert data["profile_id"].startswith("soil_")
        assert data["nitrogen_rating"] == "medium"

        # Query latest
        res_get = client.get("/api/v1/soil/test-profile/baramati")
        assert res_get.status_code == 200
        assert res_get.json()["field_identifier"] == "Plot-Phase4-Test"

    def test_list_crops_endpoint(self, client: TestClient):
        res = client.get("/api/v1/crops?season=kharif")
        assert res.status_code == 200
        crops = res.json()
        assert len(crops) >= 5
        ids = [c["crop_id"] for c in crops]
        assert "soybean" in ids
        assert "cotton" in ids

    def test_get_crop_details_endpoint(self, client: TestClient):
        res = client.get("/api/v1/crops/details/cotton")
        assert res.status_code == 200
        data = res.json()
        assert data["crop_id"] == "cotton"
        assert data["scientific_name"] == "Gossypium hirsutum"
        assert len(data["growth_stages"]) >= 4

    def test_crop_suitability_endpoint(self, client: TestClient):
        res = client.get("/api/v1/crops/suitability/baramati?season=kharif&water_source=rainfed")
        assert res.status_code == 200
        data = res.json()
        assert data["location_id"] == "baramati"
        assert len(data["candidate_crops"]) >= 5
        # Check Sugarcane is evaluated as unsuitable under rainfed
        sc = next(c for c in data["candidate_crops"] if c["crop_id"] == "sugarcane")
        assert sc["status"] == "unsuitable"

    def test_sowing_readiness_endpoint(self, client: TestClient):
        res = client.get("/api/v1/crops/sowing-readiness/baramati?crop_id=soybean&target_date=2026-06-25")
        assert res.status_code == 200
        data = res.json()
        assert data["crop_id"] == "soybean"
        assert data["status"] in ["favorable", "wait_and_reassess", "unfavorable", "insufficient_data"]
        assert "sowing_readiness_summary_en" in data
        assert "sowing_readiness_summary_mr" in data

    def test_advisories_endpoint(self, client: TestClient):
        res = client.get("/api/v1/advisories?location_id=baramati&crop_id=soybean&stage_id=flowering&language=mr")
        assert res.status_code == 200
        data = res.json()
        assert data["crop_id"] == "soybean"
        assert data["stage_id"] == "flowering"
        assert "primary_advisory" in data
        assert data["primary_advisory"]["primary_action_mr"] is not None
        assert "climate_context" in data
        assert "official_warning_disclaimer" in data
