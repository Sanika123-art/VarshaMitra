"""Explainable sowing window and real-time sowing readiness assessment engine."""

from datetime import date, timedelta
from typing import List, Optional

from app.schemas.agronomy import (
    CropRequirement,
    CropSeason,
    SowingAssessmentResponse,
    SowingReadinessStatus,
)
from app.schemas.climate import AccumulationIndicator, DrySpellIndicator, HeavyRainIndicator
from app.schemas.location import BlockDetail
from app.schemas.rainfall import ForecastSeries


def is_date_in_window(d: date, start_month: int, start_day: int, end_month: int, end_day: int) -> bool:
    """Check if calendar date falls within specified month/day bounds."""
    start_tuple = (start_month, start_day)
    end_tuple = (end_month, end_day)
    curr_tuple = (d.month, d.day)

    if start_tuple <= end_tuple:
        return start_tuple <= curr_tuple <= end_tuple
    else:
        # Crosses calendar year boundary (e.g. October to February)
        return curr_tuple >= start_tuple or curr_tuple <= end_tuple


def evaluate_sowing_readiness(
    block: BlockDetail,
    crop: CropRequirement,
    target_date: date,
    accumulation: AccumulationIndicator,
    forecast: Optional[ForecastSeries],
    dry_spell: Optional[DrySpellIndicator] = None,
    heavy_rain: Optional[HeavyRainIndicator] = None,
) -> SowingAssessmentResponse:
    """Assess whether weather, calendar window, and soil moisture support sowing now."""
    w = crop.sowing_window

    optimal_open = is_date_in_window(
        target_date,
        w.optimal_start_month,
        w.optimal_start_day,
        w.optimal_end_month,
        w.optimal_end_day,
    )
    delayed_open = is_date_in_window(
        target_date,
        w.optimal_end_month,
        w.optimal_end_day,
        w.delayed_cutoff_month,
        w.delayed_cutoff_day,
    )

    if optimal_open:
        window_status = "optimal"
        window_desc = f"Optimal sowing window ({w.optimal_start_month:02d}/{w.optimal_start_day:02d} to {w.optimal_end_month:02d}/{w.optimal_end_day:02d})"
    elif delayed_open:
        window_status = "delayed"
        window_desc = f"Delayed sowing window (Cutoff: {w.delayed_cutoff_month:02d}/{w.delayed_cutoff_day:02d})"
    else:
        curr_tuple = (target_date.month, target_date.day)
        start_tuple = (w.optimal_start_month, w.optimal_start_day)
        if curr_tuple < start_tuple:
            window_status = "early"
            window_desc = f"Pre-season / Early (Optimal window opens {w.optimal_start_month:02d}/{w.optimal_start_day:02d})"
        else:
            window_status = "outside_season"
            window_desc = f"Outside recommended sowing window (Cutoff was {w.delayed_cutoff_month:02d}/{w.delayed_cutoff_day:02d})"

    supporting: List[str] = []
    risks: List[str] = []

    # 1. Evaluate Antecedent Rainfall (Soil Moisture Proxy)
    recent_rain = accumulation.total_mm
    required_rain = crop.sowing_soil_moisture_min_mm

    if recent_rain >= required_rain:
        supporting.append(
            f"Antecedent rainfall ({recent_rain:.1f} mm) exceeds minimum germination threshold ({required_rain:.1f} mm), indicating vapsa condition"
        )
    else:
        risks.append(
            f"Antecedent rainfall ({recent_rain:.1f} mm) is below required sowing threshold ({required_rain:.1f} mm); sowing in dry soil risks seed mortality"
        )

    # 2. Evaluate Forward Forecast Hazards (1 to 14 days)
    forecast_hazard = False
    forecast_evidence = "Forward forecast unavailable"

    if forecast and forecast.forecast:
        future_deluge = [f for f in forecast.forecast[:5] if (f.precipitation_sum_mm or 0) >= 64.5]
        future_dry_days = sum(1 for f in forecast.forecast[:7] if (f.precipitation_sum_mm or 0) < 2.5)

        if future_deluge:
            forecast_hazard = True
            event_d = future_deluge[0].date
            event_mm = future_deluge[0].precipitation_sum_mm
            risks.append(f"Imminent heavy rain forecast ({event_mm:.1f} mm on {event_d}) risks seedling washaway and soil compaction")
            forecast_evidence = f"Heavy deluge warning on {event_d} ({event_mm:.1f} mm)"
        elif future_dry_days >= 6:
            forecast_hazard = True
            risks.append("Forecast indicates 6+ dry days ahead; germinating seedlings risk scorching without protective irrigation")
            forecast_evidence = f"{future_dry_days} rainless days forecast in upcoming 7-day window"
        else:
            supporting.append("Forward 7-day forecast shows favorable intermittent moisture without extreme storm events")
            forecast_evidence = "Favorable weather window with moderate rain showers"

    # 3. Determine Overall Status & Actionable Message
    if window_status == "outside_season":
        status = SowingReadinessStatus.UNFAVORABLE
        summary_en = f"Sowing {crop.name} now is strongly discouraged as the optimal agronomic window has closed. Consider alternate contingency crops."
        summary_mr = f"{crop.name_mr} पेरणीची शिफारस केलेली मुदत संपली आहे. आता पेरणी केल्यास उत्पादनात मोठी घट होऊ शकते. पर्यायी पिकांचा विचार करावा."
        next_date = target_date + timedelta(days=15)
    elif window_status == "early":
        status = SowingReadinessStatus.WAIT_AND_REASSESS
        summary_en = f"Optimal sowing window has not yet opened for {crop.name}. Complete land preparation and wait for monsoon onset."
        summary_mr = f"{crop.name_mr} पिकासाठी पेरणीचा कालावधी अद्याप सुरू झालेला नाही. पूर्वमशागत पूर्ण करून मान्सूनच्या पुरेशा पावसाची वाट पहावी."
        next_date = target_date + timedelta(days=7)
    elif recent_rain < required_rain:
        status = SowingReadinessStatus.WAIT_AND_REASSESS
        summary_en = f"Do not sow in dry soil. Wait for cumulative rainfall to reach at least {required_rain:.1f} mm (vapsa condition) before sowing {crop.name}."
        summary_mr = f"धुळवाफ पेरणी टाळावी. जमिनीत किमान {required_rain:.1f} मिमी पाऊस होऊन पुरेशी ओल (वाफसा स्थिती) आल्याशिवाय {crop.name_mr} पेरणी करू नये."
        next_date = target_date + timedelta(days=3)
    elif forecast_hazard:
        status = SowingReadinessStatus.WAIT_AND_REASSESS
        summary_en = f"Soil moisture is adequate, but forward forecast indicates imminent weather hazard ({forecast_evidence}). Delay sowing until hazard passes."
        summary_mr = f"वाफसा स्थिती आहे, परंतु पुढील हवामान अंदाजात धोका दर्शविला आहे ({forecast_evidence}). पेरणी २-३ दिवस पुढे ढकलावी."
        next_date = target_date + timedelta(days=3)
    else:
        status = SowingReadinessStatus.FAVORABLE
        summary_en = f"Conditions support considering sowing {crop.name}. Adequate soil moisture ({recent_rain:.1f} mm) and favorable weather window ahead."
        summary_mr = f"{crop.name_mr} पेरणीसाठी हवामान व वाफसा स्थिती अनुकूल आहे ({recent_rain:.1f} मिमी पाऊस). बियाण्यास शिफारशीत बीजप्रक्रिया करून पेरणी करावी."
        next_date = target_date + timedelta(days=5)

    return SowingAssessmentResponse(
        location_id=block.id,
        location_name=block.name,
        district_name=block.district_name,
        crop_id=crop.crop_id,
        crop_name=crop.name,
        crop_name_mr=crop.name_mr,
        season=crop.season,
        assessment_date=target_date,
        status=status,
        window_status=window_status,
        optimal_window_description=window_desc,
        sowing_readiness_summary_en=summary_en,
        sowing_readiness_summary_mr=summary_mr,
        supporting_factors=supporting,
        risk_factors=risks,
        antecedent_rainfall_7d_mm=recent_rain,
        antecedent_rainfall_14d_mm=recent_rain,
        forecast_14d_hazard_flag=forecast_hazard,
        forecast_summary=forecast_evidence,
        next_reassessment_date=next_date,
        rule_version="sowing-engine-v1.0.0",
        provenance=crop.source_citation,
    )
