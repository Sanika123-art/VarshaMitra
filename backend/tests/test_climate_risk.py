"""Comprehensive unit and integration test suite for Phase 3:
Climate indicators, explainable risk engine, and ML boundary contracts.
"""

from datetime import date, datetime, timezone
import pytest
from fastapi.testclient import TestClient

from app.core.climate_constants import (
    CRITICAL_DRY_SPELL_DAYS,
    HEAVY_RAIN_THRESHOLD_MM,
    IMD_DRY_DAY_THRESHOLD_MM,
    MILD_DRY_SPELL_DAYS,
    MINIMUM_DATA_COVERAGE_RATIO,
    SIGNIFICANT_DRY_SPELL_DAYS,
    VERY_HEAVY_RAIN_THRESHOLD_MM,
)
from app.schemas.climate import (
    AccumulationIndicator,
    AnomalyIndicator,
    ConfidenceLevel,
    DataQualitySummary,
    DrySpellIndicator,
    HeavyRainIndicator,
    MonsoonOnsetIndicator,
    RiskLevel,
)
from app.schemas.rainfall import QualityStatus, RainfallObservationItem
from app.services.climate.anomaly import compute_rainfall_anomaly
from app.services.climate.indicators import (
    compute_accumulation,
    compute_data_quality,
    compute_dry_spells,
    compute_heavy_rain,
)
from app.services.climate.onset import compute_monsoon_onset, is_in_onset_window
from app.services.climate.risk_engine import assess_climate_risk
from app.services.ml.boundary import get_ml_boundary_specification


def make_obs(date_str: str, val: float | None, quality: QualityStatus = QualityStatus.FRESH) -> RainfallObservationItem:
    """Helper to generate a validated observation item."""
    d = date.fromisoformat(date_str)
    return RainfallObservationItem(
        date=d,
        value_mm=val,
        variable="precipitation",
        unit="mm",
        quality=quality if val is not None else QualityStatus.MISSING,
        notes=None,
    )


class TestAccumulationIndicator:
    """Tests for rainfall accumulation and valid observation density."""

    def test_accumulation_normal_series(self):
        obs = [
            make_obs("2026-07-01", 10.5),
            make_obs("2026-07-02", 0.0),
            make_obs("2026-07-03", 22.0),
        ]
        res = compute_accumulation(obs)
        assert res.total_mm == 32.5
        assert res.valid_days_count == 3
        assert res.missing_days_count == 0
        assert res.daily_average_mm == round(32.5 / 3, 2)

    def test_accumulation_with_missing_days(self):
        obs = [
            make_obs("2026-07-01", 15.0),
            make_obs("2026-07-02", None, QualityStatus.MISSING),
            make_obs("2026-07-03", 5.0),
        ]
        res = compute_accumulation(obs)
        assert res.total_mm == 20.0
        assert res.valid_days_count == 2
        assert res.missing_days_count == 1
        assert res.daily_average_mm == 10.0

    def test_accumulation_empty_list(self):
        res = compute_accumulation([])
        assert res.total_mm == 0.0
        assert res.valid_days_count == 0
        assert res.missing_days_count == 0
        assert res.daily_average_mm == 0.0


class TestDrySpellIndicator:
    """Tests for dry-spell boundaries and sequence streak tracking."""

    def test_dry_day_boundary_threshold(self):
        # 2.4 mm is dry (< 2.5 mm); 2.5 mm is rainy (>= 2.5 mm)
        obs = [
            make_obs("2026-07-01", 2.4),
            make_obs("2026-07-02", 2.5),
            make_obs("2026-07-03", 1.0),
        ]
        res = compute_dry_spells(obs, threshold_mm=IMD_DRY_DAY_THRESHOLD_MM)
        assert res.dry_days_count == 2
        assert res.max_consecutive_dry_days == 1
        assert res.current_consecutive_dry_days == 1
        assert res.severity == "none"

    def test_dry_spell_severity_classifications(self):
        # 5 consecutive dry days -> mild
        mild_obs = [make_obs(f"2026-07-{i:02d}", 0.0) for i in range(1, 6)]
        res_mild = compute_dry_spells(mild_obs)
        assert res_mild.max_consecutive_dry_days == 5
        assert res_mild.severity == "mild"

        # 7 consecutive dry days -> significant
        sig_obs = [make_obs(f"2026-07-{i:02d}", 0.0) for i in range(1, 8)]
        res_sig = compute_dry_spells(sig_obs)
        assert res_sig.max_consecutive_dry_days == 7
        assert res_sig.severity == "significant"

        # 14 consecutive dry days -> critical
        crit_obs = [make_obs(f"2026-07-{i:02d}", 0.0) for i in range(1, 15)]
        res_crit = compute_dry_spells(crit_obs)
        assert res_crit.max_consecutive_dry_days == 14
        assert res_crit.severity == "critical"

    def test_missing_day_breaks_streak(self):
        # Missing day should NOT be assumed dry, so it breaks the unbroken streak
        obs = [
            make_obs("2026-07-01", 0.0),
            make_obs("2026-07-02", 0.0),
            make_obs("2026-07-03", 0.0),
            make_obs("2026-07-04", None, QualityStatus.MISSING),
            make_obs("2026-07-05", 0.0),
            make_obs("2026-07-06", 0.0),
        ]
        res = compute_dry_spells(obs)
        assert res.dry_days_count == 5
        assert res.max_consecutive_dry_days == 3  # Streak was interrupted on day 4
        assert res.current_consecutive_dry_days == 2


class TestHeavyRainIndicator:
    """Tests for extreme precipitation thresholds."""

    def test_heavy_rain_boundary(self):
        # 64.4 mm is under threshold; 64.5 mm triggers heavy rain flag
        obs = [
            make_obs("2026-07-01", 64.4),
            make_obs("2026-07-02", 64.5),
            make_obs("2026-07-03", 115.6),
        ]
        res = compute_heavy_rain(obs, threshold_mm=HEAVY_RAIN_THRESHOLD_MM)
        assert res.heavy_rain_days_count == 2
        assert res.max_single_day_mm == 115.6
        assert res.has_heavy_rain_event is True
        assert date(2026, 7, 2) in res.event_dates
        assert date(2026, 7, 3) in res.event_dates

    def test_no_heavy_rain_recorded(self):
        obs = [
            make_obs("2026-07-01", 12.0),
            make_obs("2026-07-02", 25.0),
        ]
        res = compute_heavy_rain(obs)
        assert res.heavy_rain_days_count == 0
        assert res.max_single_day_mm == 25.0
        assert res.has_heavy_rain_event is False
        assert len(res.event_dates) == 0


class TestAnomalyIndicator:
    """Tests for departure calculation and missing baseline handling."""

    def test_missing_baseline_returns_insufficient_status(self):
        res = compute_rainfall_anomaly(observed_mm=55.0, baseline_normal_mm=None)
        assert res.status == "insufficient_baseline_data"
        assert res.departure_pct is None
        assert res.baseline_normal_mm is None

    def test_baseline_departure_categories(self):
        # Normal (within -19% to +19%)
        res_normal = compute_rainfall_anomaly(observed_mm=100.0, baseline_normal_mm=100.0)
        assert res_normal.status == "normal"
        assert res_normal.departure_pct == 0.0

        # Excess (+20% to +59%)
        res_excess = compute_rainfall_anomaly(observed_mm=130.0, baseline_normal_mm=100.0)
        assert res_excess.status == "excess"
        assert res_excess.departure_pct == 30.0

        # Large Excess (>= +60%)
        res_lexcess = compute_rainfall_anomaly(observed_mm=170.0, baseline_normal_mm=100.0)
        assert res_lexcess.status == "large_excess"
        assert res_lexcess.departure_pct == 70.0

        # Deficient (-20% to -59%)
        res_def = compute_rainfall_anomaly(observed_mm=70.0, baseline_normal_mm=100.0)
        assert res_def.status == "deficient"
        assert res_def.departure_pct == -30.0

        # Large Deficient (<= -60%)
        res_ldef = compute_rainfall_anomaly(observed_mm=30.0, baseline_normal_mm=100.0)
        assert res_ldef.status == "large_deficient"
        assert res_ldef.departure_pct == -70.0


class TestMonsoonOnsetIndicator:
    """Tests for Kharif monsoon onset surveillance."""

    def test_outside_onset_window(self):
        obs = [
            make_obs("2026-10-01", 20.0),
            make_obs("2026-10-02", 30.0),
        ]
        res = compute_monsoon_onset(obs)
        assert res.status == "outside_onset_window"
        assert res.onset_date is None

    def test_inside_window_pending(self):
        # Insufficient rain in June
        obs = [
            make_obs("2026-06-10", 1.0),
            make_obs("2026-06-11", 5.0),
            make_obs("2026-06-12", 2.0),
        ]
        res = compute_monsoon_onset(obs)
        assert res.status == "pending"
        assert res.onset_date is None

    def test_inside_window_confirmed(self):
        # 2 consecutive days >= 2.5 mm with cumulative >= 25.0 mm
        obs = [
            make_obs("2026-06-10", 0.0),
            make_obs("2026-06-11", 12.0),
            make_obs("2026-06-12", 18.0),
        ]
        res = compute_monsoon_onset(obs)
        assert res.status == "confirmed"
        assert res.onset_date == date(2026, 6, 12)


class TestDataQualitySummary:
    """Tests for coverage ratio and freshness."""

    def test_sufficient_coverage(self):
        obs = [make_obs(f"2026-07-{i:02d}", 5.0) for i in range(1, 11)]
        res = compute_data_quality(obs)
        assert res.coverage_ratio == 1.0
        assert res.is_sufficient is True
        assert res.missing_days_count == 0

    def test_insufficient_coverage_under_75_percent(self):
        obs = [
            make_obs("2026-07-01", 5.0),
            make_obs("2026-07-02", None, QualityStatus.MISSING),
            make_obs("2026-07-03", None, QualityStatus.MISSING),
            make_obs("2026-07-04", 5.0),
        ]
        res = compute_data_quality(obs)
        assert res.coverage_ratio == 0.50
        assert res.is_sufficient is False
        assert res.missing_days_count == 2


class TestRiskEngine:
    """Tests for explainable risk assessment and driver matching."""

    def test_insufficient_data_returns_insufficient_data_risk(self):
        acc = AccumulationIndicator(total_mm=10.0, valid_days_count=2, missing_days_count=4, daily_average_mm=5.0)
        dry = DrySpellIndicator(threshold_mm=2.5, dry_days_count=2, max_consecutive_dry_days=2, current_consecutive_dry_days=2, severity="none")
        heavy = HeavyRainIndicator(threshold_mm=64.5, heavy_rain_days_count=0, max_single_day_mm=5.0, event_dates=[], has_heavy_rain_event=False)
        anomaly = AnomalyIndicator(observed_mm=10.0, status="insufficient_baseline_data", baseline_provenance="none")
        onset = MonsoonOnsetIndicator(status="outside_onset_window", criteria_summary="test")
        quality = DataQualitySummary(coverage_ratio=0.33, is_sufficient=False, freshness_status=QualityStatus.MISSING, missing_days_count=4)

        res = assess_climate_risk(
            block_id="pune_haveli",
            block_name="Haveli",
            district_name="Pune",
            start_date=date(2026, 7, 1),
            end_date=date(2026, 7, 6),
            accumulation=acc,
            dry_spell=dry,
            heavy_rain=heavy,
            anomaly=anomaly,
            monsoon_onset=onset,
            data_quality=quality,
        )
        assert res.overall_risk == RiskLevel.INSUFFICIENT_DATA
        assert res.confidence == ConfidenceLevel.NONE
        assert any(d.code == "insufficientDataCoverage" for d in res.risk_drivers)

    @pytest.mark.parametrize(
        "freshness",
        [QualityStatus.STALE, QualityStatus.MISSING, QualityStatus.SYNTHETIC_STAGING],
    )
    def test_stale_or_synthetic_data_is_withheld_even_with_full_coverage(self, freshness):
        quality = DataQualitySummary(
            coverage_ratio=1.0,
            is_sufficient=True,
            freshness_status=freshness,
            missing_days_count=0,
        )
        res = assess_climate_risk(
            block_id="pune_haveli",
            block_name="Haveli",
            district_name="Pune",
            start_date=date(2026, 7, 1),
            end_date=date(2026, 7, 6),
            accumulation=AccumulationIndicator(total_mm=10.0, valid_days_count=6, missing_days_count=0, daily_average_mm=1.67),
            dry_spell=DrySpellIndicator(threshold_mm=2.5, dry_days_count=6, max_consecutive_dry_days=6, current_consecutive_dry_days=6, severity="mild"),
            heavy_rain=HeavyRainIndicator(threshold_mm=64.5, heavy_rain_days_count=0, max_single_day_mm=5.0, event_dates=[], has_heavy_rain_event=False),
            anomaly=AnomalyIndicator(observed_mm=10.0, status="normal", departure_pct=0.0, baseline_provenance="test"),
            monsoon_onset=MonsoonOnsetIndicator(status="pending", criteria_summary="test"),
            data_quality=quality,
        )

        assert res.overall_risk == RiskLevel.INSUFFICIENT_DATA
        assert res.risk_drivers[0].code == "staleClimateData"

    def test_critical_risk_due_to_prolonged_dry_spell(self):
        acc = AccumulationIndicator(total_mm=0.0, valid_days_count=14, missing_days_count=0, daily_average_mm=0.0)
        dry = DrySpellIndicator(threshold_mm=2.5, dry_days_count=14, max_consecutive_dry_days=14, current_consecutive_dry_days=14, severity="critical")
        heavy = HeavyRainIndicator(threshold_mm=64.5, heavy_rain_days_count=0, max_single_day_mm=0.0, event_dates=[], has_heavy_rain_event=False)
        anomaly = AnomalyIndicator(observed_mm=0.0, departure_pct=-100.0, status="large_deficient", baseline_provenance="test")
        onset = MonsoonOnsetIndicator(status="outside_onset_window", criteria_summary="test")
        quality = DataQualitySummary(coverage_ratio=1.0, is_sufficient=True, freshness_status=QualityStatus.FRESH, missing_days_count=0)

        res = assess_climate_risk(
            block_id="solapur_north",
            block_name="North Solapur",
            district_name="Solapur",
            start_date=date(2026, 7, 1),
            end_date=date(2026, 7, 14),
            accumulation=acc,
            dry_spell=dry,
            heavy_rain=heavy,
            anomaly=anomaly,
            monsoon_onset=onset,
            data_quality=quality,
        )
        assert res.overall_risk == RiskLevel.CRITICAL
        assert res.confidence == ConfidenceLevel.HIGH
        assert any(d.code == "criticalDrySpell" for d in res.risk_drivers)

    def test_high_risk_due_to_heavy_rain(self):
        acc = AccumulationIndicator(total_mm=80.0, valid_days_count=7, missing_days_count=0, daily_average_mm=11.4)
        dry = DrySpellIndicator(threshold_mm=2.5, dry_days_count=2, max_consecutive_dry_days=2, current_consecutive_dry_days=0, severity="none")
        heavy = HeavyRainIndicator(threshold_mm=64.5, heavy_rain_days_count=1, max_single_day_mm=72.0, event_dates=[date(2026, 7, 4)], has_heavy_rain_event=True)
        anomaly = AnomalyIndicator(observed_mm=80.0, status="normal", departure_pct=5.0, baseline_provenance="test")
        onset = MonsoonOnsetIndicator(status="outside_onset_window", criteria_summary="test")
        quality = DataQualitySummary(coverage_ratio=1.0, is_sufficient=True, freshness_status=QualityStatus.FRESH, missing_days_count=0)

        res = assess_climate_risk(
            block_id="kolhapur_karvir",
            block_name="Karvir",
            district_name="Kolhapur",
            start_date=date(2026, 7, 1),
            end_date=date(2026, 7, 7),
            accumulation=acc,
            dry_spell=dry,
            heavy_rain=heavy,
            anomaly=anomaly,
            monsoon_onset=onset,
            data_quality=quality,
        )
        assert res.overall_risk == RiskLevel.HIGH
        assert any(d.code == "heavySoilSaturation" for d in res.risk_drivers)

    def test_low_risk_balanced_window(self):
        acc = AccumulationIndicator(total_mm=35.0, valid_days_count=7, missing_days_count=0, daily_average_mm=5.0)
        dry = DrySpellIndicator(threshold_mm=2.5, dry_days_count=2, max_consecutive_dry_days=2, current_consecutive_dry_days=1, severity="none")
        heavy = HeavyRainIndicator(threshold_mm=64.5, heavy_rain_days_count=0, max_single_day_mm=18.0, event_dates=[], has_heavy_rain_event=False)
        anomaly = AnomalyIndicator(observed_mm=35.0, status="normal", departure_pct=2.0, baseline_provenance="test")
        onset = MonsoonOnsetIndicator(status="outside_onset_window", criteria_summary="test")
        quality = DataQualitySummary(coverage_ratio=1.0, is_sufficient=True, freshness_status=QualityStatus.FRESH, missing_days_count=0)

        res = assess_climate_risk(
            block_id="nashik_dindori",
            block_name="Dindori",
            district_name="Nashik",
            start_date=date(2026, 7, 1),
            end_date=date(2026, 7, 7),
            accumulation=acc,
            dry_spell=dry,
            heavy_rain=heavy,
            anomaly=anomaly,
            monsoon_onset=onset,
            data_quality=quality,
        )
        assert res.overall_risk == RiskLevel.LOW
        assert any(d.code == "adequateRainfallBalance" for d in res.risk_drivers)


class TestMLBoundarySpecification:
    """Tests for ML boundary integrity and contract declaration."""

    def test_spec_honesty_no_fabricated_metrics(self):
        spec = get_ml_boundary_specification()
        assert spec.service_state == "heuristic_baseline_operational"
        assert "No trained model deployed" in spec.model_status
        assert "INTEGRITY NOTICE" in spec.no_fabricated_metrics_notice
        assert "temporal_split" in spec.evaluation_protocol
        assert "rolling_rainfall_7d_mm" in spec.feature_contract
        assert "dry_spell_next_7d_flag" in spec.target_contract


class TestAPIEndpoints:
    """Integration tests for climate and risk endpoints."""

    def test_get_indicators_valid_block(self, client: TestClient):
        response = client.get("/api/v1/climate/indicators/baramati?window_days=7")
        assert response.status_code == 200
        data = response.json()
        assert data["block_id"] == "baramati"
        assert data["window_days"] == 7
        assert "accumulation" in data
        assert "dry_spell" in data
        assert "heavy_rain" in data
        assert "anomaly" in data
        assert "data_quality" in data
        assert data["method_version"] is not None

    def test_get_indicators_invalid_block(self, client: TestClient):
        response = client.get("/api/v1/climate/indicators/non_existent_block")
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_get_indicators_invalid_window_validation(self, client: TestClient):
        # Window days must be ge=3 and le=60
        response = client.get("/api/v1/climate/indicators/baramati?window_days=1")
        assert response.status_code == 422

    def test_get_risk_assessment_valid_block(self, client: TestClient):
        response = client.get("/api/v1/risk/barshi?window_days=14")
        assert response.status_code == 200
        data = response.json()
        assert data["block_id"] == "barshi"
        assert data["overall_risk"] in ["low", "moderate", "high", "critical", "insufficient_data"]
        assert data["confidence"] in ["high", "medium", "low", "none"]
        assert len(data["risk_drivers"]) >= 1
        assert "supporting_measurements" in data
        assert "Provisional" in data["provisional_notice"]
        assert "limitations" in data

    def test_get_risk_invalid_block(self, client: TestClient):
        response = client.get("/api/v1/risk/unknown_block_id")
        assert response.status_code == 404

    def test_get_ml_boundary_endpoint(self, client: TestClient):
        response = client.get("/api/v1/climate/ml-boundary")
        assert response.status_code == 200
        data = response.json()
        assert data["service_state"] == "heuristic_baseline_operational"
        assert "no_fabricated_metrics_notice" in data
