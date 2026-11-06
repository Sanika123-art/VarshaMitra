"""Explainable, deterministic agro-climatic risk engine.

Synthesizes validated climate indicators into calibrated risk levels and explicit risk drivers.
Complies with IMD classification standards and transparent rule boundaries.
"""

from datetime import date, datetime, timezone
from typing import Any, Dict, List, Optional
from app.core.climate_constants import (
    CRITICAL_DRY_SPELL_DAYS,
    HEAVY_RAIN_THRESHOLD_MM,
    MILD_DRY_SPELL_DAYS,
    MINIMUM_DATA_COVERAGE_RATIO,
    MONSOON_SEASON_MONTHS,
    RISK_ENGINE_METHOD_VERSION,
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
    RiskAssessmentResponse,
    RiskDriver,
    RiskLevel,
)
from app.schemas.rainfall import QualityStatus


def assess_climate_risk(
    block_id: str,
    block_name: str,
    district_name: str,
    start_date: date,
    end_date: date,
    accumulation: AccumulationIndicator,
    dry_spell: DrySpellIndicator,
    heavy_rain: HeavyRainIndicator,
    anomaly: AnomalyIndicator,
    monsoon_onset: MonsoonOnsetIndicator,
    data_quality: DataQualitySummary,
    custom_assessment_time: Optional[datetime] = None,
) -> RiskAssessmentResponse:
    """Evaluate deterministic agro-climatic risk from structured climate indicators."""
    assessment_time = custom_assessment_time or datetime.now(timezone.utc)
    window_days = (end_date - start_date).days + 1

    supporting_measurements: Dict[str, Any] = {
        "total_accumulation_mm": accumulation.total_mm,
        "daily_average_mm": accumulation.daily_average_mm,
        "valid_days_count": accumulation.valid_days_count,
        "missing_days_count": accumulation.missing_days_count,
        "max_consecutive_dry_days": dry_spell.max_consecutive_dry_days,
        "current_consecutive_dry_days": dry_spell.current_consecutive_dry_days,
        "heavy_rain_days_count": heavy_rain.heavy_rain_days_count,
        "max_single_day_mm": heavy_rain.max_single_day_mm,
        "anomaly_status": anomaly.status,
        "departure_pct": anomaly.departure_pct,
        "monsoon_onset_status": monsoon_onset.status,
        "coverage_ratio": data_quality.coverage_ratio,
        "freshness_status": data_quality.freshness_status.value,
    }

    # 1. Gate: Insufficient Data Coverage
    if not data_quality.is_sufficient:
        conf = ConfidenceLevel.NONE if data_quality.coverage_ratio < 0.60 else ConfidenceLevel.LOW
        return RiskAssessmentResponse(
            block_id=block_id,
            block_name=block_name,
            district_name=district_name,
            assessment_time=assessment_time,
            window_days=window_days,
            start_date=start_date,
            end_date=end_date,
            overall_risk=RiskLevel.INSUFFICIENT_DATA,
            confidence=conf,
            confidence_rationale=(
                f"Data completeness is below acceptable threshold: {data_quality.coverage_ratio * 100:.1f}% valid data "
                f"({data_quality.missing_days_count} missing days out of {window_days}). "
                f"Minimum required coverage is {MINIMUM_DATA_COVERAGE_RATIO * 100:.0f}%."
            ),
            risk_drivers=[
                RiskDriver(
                    code="insufficientDataCoverage",
                    name="Data Completeness Deficit",
                    evidence=f"{data_quality.missing_days_count} of {window_days} observation days missing",
                    contribution="primary",
                )
            ],
            supporting_measurements=supporting_measurements,
            method_version=RISK_ENGINE_METHOD_VERSION,
            provisional_notice=(
                "Provisional Heuristic Model: Risk cannot be authoritatively calculated without minimum 75% valid data points."
            ),
            limitations=(
                "Assessment withheld: too few valid daily values in the window (provider outage or missing records). "
                "Risk evaluation is withheld to prevent false alarms or missed hazard warnings."
            ),
        )

    # 2. Determine Confidence Level
    if data_quality.coverage_ratio >= 0.90 and data_quality.freshness_status == QualityStatus.FRESH:
        confidence = ConfidenceLevel.HIGH
        conf_rationale = (
            f"High confidence: {data_quality.coverage_ratio * 100:.1f}% continuous data coverage; latest day flagged fresh. "
            "Confidence reflects data completeness only, not the accuracy of the underlying source."
        )
    elif data_quality.coverage_ratio >= 0.75:
        confidence = ConfidenceLevel.MEDIUM
        conf_rationale = (
            f"Medium confidence: {data_quality.coverage_ratio * 100:.1f}% data coverage with {data_quality.missing_days_count} missing days."
        )
    else:
        confidence = ConfidenceLevel.LOW
        conf_rationale = (
            f"Low confidence: marginally sufficient data coverage ({data_quality.coverage_ratio * 100:.1f}%)."
        )

    # 3. Rule Evaluation & Driver Assembly
    drivers: List[RiskDriver] = []
    overall_level = RiskLevel.LOW

    # Season context. Dry-spell and rainfall-departure rules were written for in-season (June-September)
    # monitoring. Outside the monsoon a rainless spell is normal dry-season weather, not crop stress, so those
    # rules are not applied. Heavy-rain rules apply in every month.
    in_season = end_date.month in MONSOON_SEASON_MONTHS

    # Consecutive dry day indicators
    streak = max(dry_spell.max_consecutive_dry_days, dry_spell.current_consecutive_dry_days)

    # Deluge indicators
    max_rain = heavy_rain.max_single_day_mm
    deluge_days = heavy_rain.heavy_rain_days_count

    # Anomaly indicator (departure only meaningful for the in-season rainfall pattern)
    dep = anomaly.departure_pct if in_season else None

    # --- Rule Tier A: CRITICAL ---
    if in_season and streak >= CRITICAL_DRY_SPELL_DAYS:
        overall_level = RiskLevel.CRITICAL
        drivers.append(
            RiskDriver(
                code="criticalDrySpell",
                name="Severe Prolonged Dry Spell",
                evidence=f"{streak} consecutive rainless days (< {dry_spell.threshold_mm} mm) exceeding critical threshold of {CRITICAL_DRY_SPELL_DAYS} days",
                contribution="primary",
            )
        )
    elif max_rain >= VERY_HEAVY_RAIN_THRESHOLD_MM or deluge_days >= 2:
        overall_level = RiskLevel.CRITICAL
        drivers.append(
            RiskDriver(
                code="delugeFloodRisk",
                name="Extreme Precipitation & Waterlogging",
                evidence=(
                    f"Peak single-day precipitation of {max_rain:.1f} mm exceeds very heavy threshold "
                    f"({VERY_HEAVY_RAIN_THRESHOLD_MM} mm) with {deluge_days} deluge days"
                ),
                contribution="primary",
            )
        )
    elif in_season and streak >= 10 and dep is not None and dep <= -50.0:
        overall_level = RiskLevel.CRITICAL
        drivers.append(
            RiskDriver(
                code="compoundDroughtStress",
                name="Compound Moisture Stress",
                evidence=f"{streak} consecutive dry days combined with severe rainfall deficit ({dep:+.1f}%)",
                contribution="primary",
            )
        )

    # --- Rule Tier B: HIGH ---
    if overall_level != RiskLevel.CRITICAL:
        if in_season and streak >= SIGNIFICANT_DRY_SPELL_DAYS:
            overall_level = RiskLevel.HIGH
            drivers.append(
                RiskDriver(
                    code="drySpellAhead",
                    name="Extended Dry Spell",
                    evidence=f"{streak} consecutive dry days exceeding significant threshold of {SIGNIFICANT_DRY_SPELL_DAYS} days",
                    contribution="primary" if not drivers else "contributing",
                )
            )
        elif max_rain >= HEAVY_RAIN_THRESHOLD_MM:
            overall_level = RiskLevel.HIGH
            drivers.append(
                RiskDriver(
                    code="heavySoilSaturation",
                    name="Heavy Rain Inundation Hazard",
                    evidence=f"Single-day precipitation of {max_rain:.1f} mm exceeds IMD heavy rain mark ({HEAVY_RAIN_THRESHOLD_MM} mm)",
                    contribution="primary" if not drivers else "contributing",
                )
            )
        elif dep is not None and dep <= -30.0:
            overall_level = RiskLevel.HIGH
            drivers.append(
                RiskDriver(
                    code="severeRainfallDeficit",
                    name="Severe Cumulative Rainfall Deficit",
                    evidence=f"Precipitation departure of {dep:+.1f}% represents severe seasonal shortfall",
                    contribution="primary" if not drivers else "contributing",
                )
            )
        elif dep is not None and dep >= 60.0:
            overall_level = RiskLevel.HIGH
            drivers.append(
                RiskDriver(
                    code="largeExcessRainfall",
                    name="Large Excess Rainfall Surplus",
                    evidence=f"Cumulative rainfall departure of {dep:+.1f}% creates root-zone waterlogging risk",
                    contribution="primary" if not drivers else "contributing",
                )
            )

    # --- Rule Tier C: MODERATE ---
    if overall_level not in (RiskLevel.CRITICAL, RiskLevel.HIGH):
        if in_season and streak >= MILD_DRY_SPELL_DAYS:
            overall_level = RiskLevel.MODERATE
            drivers.append(
                RiskDriver(
                    code="mildDrySpell",
                    name="Mild Dry Spell Incipient Stress",
                    evidence=f"{streak} consecutive dry days reached mild threshold ({MILD_DRY_SPELL_DAYS} days)",
                    contribution="primary" if not drivers else "contributing",
                )
            )
        elif dep is not None and dep <= -20.0:
            overall_level = RiskLevel.MODERATE
            drivers.append(
                RiskDriver(
                    code="subNormalRainfall",
                    name="Deficient Rainfall Pattern",
                    evidence=f"Precipitation departure of {dep:+.1f}% categorized as IMD deficient",
                    contribution="primary" if not drivers else "contributing",
                )
            )
        elif (
            monsoon_onset.status == "pending"
            and end_date.month == 6
            and end_date.day >= 20
        ):
            overall_level = RiskLevel.MODERATE
            drivers.append(
                RiskDriver(
                    code="delayedMonsoonOnset",
                    name="Delayed Monsoon Onset",
                    evidence="Monsoon onset criteria pending beyond June 20, threatening Kharif sowing calendar",
                    contribution="primary" if not drivers else "contributing",
                )
            )

    # --- Rule Tier D: LOW ---
    if overall_level == RiskLevel.LOW:
        if not in_season and streak >= MILD_DRY_SPELL_DAYS:
            drivers.append(
                RiskDriver(
                    code="offSeasonDryWeather",
                    name="Normal Dry-Season Weather",
                    evidence=(
                        f"{streak} consecutive dry days, but the June-September monsoon has ended; "
                        "dry weather is normal in this season and is not treated as crop stress"
                    ),
                    contribution="primary",
                )
            )
        elif not in_season:
            drivers.append(
                RiskDriver(
                    code="offSeasonStable",
                    name="Quiet Off-Season Window",
                    evidence=(
                        f"Cumulative {accumulation.total_mm:.1f} mm across {window_days} days outside the "
                        "June-September monsoon; no heavy-rain event"
                    ),
                    contribution="primary",
                )
            )
        else:
            drivers.append(
                RiskDriver(
                    code="adequateRainfallBalance",
                    name="Stable Agro-Climatic Window",
                    evidence=(
                        f"Cumulative {accumulation.total_mm:.1f} mm across {window_days} days; "
                        f"longest dry spell was {streak} days with no heavy deluge events"
                    ),
                    contribution="primary",
                )
            )

    return RiskAssessmentResponse(
        block_id=block_id,
        block_name=block_name,
        district_name=district_name,
        assessment_time=assessment_time,
        window_days=window_days,
        start_date=start_date,
        end_date=end_date,
        overall_risk=overall_level,
        confidence=confidence,
        confidence_rationale=conf_rationale,
        risk_drivers=drivers,
        supporting_measurements=supporting_measurements,
        method_version=RISK_ENGINE_METHOD_VERSION,
        in_monsoon_season=in_season,
        provisional_notice=(
            "Provisional Heuristic Model: Agro-climatic thresholds are derived from IMD agrometeorological rules "
            "and require verification by local Krishi Vigyan Kendra (KVK) agronomists before field operational deployment."
        ),
        limitations=(
            "Derived from recent daily precipitation only (see data_provenance for the source and data type). "
            "Soil moisture retention, crop phenology, "
            "evapotranspiration (PET), and local canal/well irrigation are not incorporated into this pure precipitation assessment. "
            "Past rainfall does not represent a future weather forecast."
        ),
    )
