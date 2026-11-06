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

# A window opening within this many days counts as "early / get ready"; further away is "outside the season".
EARLY_LOOKAHEAD_DAYS = 45

# Minimum valid daily values (of the 14-day trailing window) needed to judge soil-moisture readiness.
MIN_VALID_RAIN_DAYS = 10


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


def next_window_open(d: date, start_month: int, start_day: int) -> date:
    """First date on or after `d` on which the (month, day) window start occurs."""
    candidate = date(d.year, start_month, min(start_day, 28) if start_month == 2 else start_day)
    if candidate < d:
        candidate = date(d.year + 1, start_month, min(start_day, 28) if start_month == 2 else start_day)
    return candidate


def evaluate_sowing_readiness(
    block: BlockDetail,
    crop: CropRequirement,
    target_date: date,
    accumulation: AccumulationIndicator,
    forecast: Optional[ForecastSeries],
    dry_spell: Optional[DrySpellIndicator] = None,
    heavy_rain: Optional[HeavyRainIndicator] = None,
    accumulation_7d: Optional[AccumulationIndicator] = None,
) -> SowingAssessmentResponse:
    """Assess whether weather, calendar window, and soil moisture support sowing now.

    `accumulation` is the trailing 14-day rainfall; `accumulation_7d` (optional) is the trailing 7 days.
    Rainfall over the last 14 days is only a proxy for soil moisture (vapsa); the farmer must still check the field.
    """
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

    next_open = next_window_open(target_date, w.optimal_start_month, w.optimal_start_day)
    days_to_open = (next_open - target_date).days
    cutoff_txt = f"{w.delayed_cutoff_day:02d}/{w.delayed_cutoff_month:02d}"
    next_open_txt = f"{next_open.day:02d}/{next_open.month:02d}"

    if optimal_open:
        window_status = "optimal"
        window_desc = f"Optimal sowing window ({w.optimal_start_day:02d}/{w.optimal_start_month:02d} to {w.optimal_end_day:02d}/{w.optimal_end_month:02d}, dd/mm)"
    elif delayed_open:
        window_status = "delayed"
        window_desc = f"Delayed sowing window (late sowing; cutoff {cutoff_txt}, dd/mm)"
    elif days_to_open <= EARLY_LOOKAHEAD_DAYS:
        window_status = "early"
        window_desc = f"Pre-season: optimal window opens {w.optimal_start_day:02d}/{w.optimal_start_month:02d} (dd/mm), in {days_to_open} days"
    else:
        window_status = "outside_season"
        window_desc = f"Outside the recommended sowing window (closed {cutoff_txt}; next opens {next_open_txt}, dd/mm)"

    supporting: List[str] = []
    risks: List[str] = []

    # 1. Evaluate Antecedent Rainfall (Soil Moisture Proxy)
    recent_rain = accumulation.total_mm
    required_rain = crop.sowing_soil_moisture_min_mm
    rainfall_data_ok = accumulation.valid_days_count >= MIN_VALID_RAIN_DAYS

    if not rainfall_data_ok:
        risks.append(
            f"Only {accumulation.valid_days_count} of the last 14 days have valid rainfall values; "
            "soil moisture cannot be judged reliably."
        )
    elif recent_rain >= required_rain:
        supporting.append(
            f"Rain in the last 14 days ({recent_rain:.1f} mm) meets the {required_rain:.1f} mm commonly advised before sowing {crop.name} "
            "(a proxy for vapsa; confirm moisture in your own field)"
        )
    else:
        risks.append(
            f"Rain in the last 14 days ({recent_rain:.1f} mm) is below the {required_rain:.1f} mm commonly advised before sowing; "
            "sowing into dry soil risks poor germination"
        )

    # 2. Evaluate Forward Forecast Hazards
    forecast_hazard = False
    forecast_available = bool(forecast and forecast.forecast)
    forecast_evidence = "Weather forecast unavailable"

    if forecast_available:
        assert forecast is not None
        future_deluge = [f for f in forecast.forecast[:5] if (f.precipitation_sum_mm or 0) >= 64.5]
        week = forecast.forecast[:7]
        future_dry_days = sum(1 for f in week if (f.precipitation_sum_mm or 0) < 2.5)

        if future_deluge:
            forecast_hazard = True
            event_d = future_deluge[0].date
            event_mm = future_deluge[0].precipitation_sum_mm or 0.0
            risks.append(f"Heavy rain forecast ({event_mm:.1f} mm on {event_d}) can wash away seed and compact the soil")
            forecast_evidence = f"Heavy rain forecast on {event_d} ({event_mm:.1f} mm)"
        elif len(week) >= 6 and future_dry_days >= 6:
            forecast_hazard = True
            risks.append("Forecast shows 6 or more dry days in the next week; young seedlings may dry out without irrigation")
            forecast_evidence = f"{future_dry_days} of the next {len(week)} days forecast with little or no rain"
        else:
            supporting.append("The next-7-day forecast shows no extreme storm and no long dry stretch")
            forecast_evidence = "No heavy-rain or long-dry hazard in the next 7-day forecast"

    # 3. Determine Overall Status & Actionable Message
    cutoff_closed_en = (
        f"The recommended sowing window for {crop.name} has closed for this season (it ended {cutoff_txt}, dd/mm). "
        f"The next recommended window opens around {next_open_txt}. Sowing now is not advised."
    )
    cutoff_closed_mr = (
        f"{crop.name_mr} पेरणीसाठीची शिफारस केलेली मुदत या हंगामासाठी संपली आहे (मुदत {cutoff_txt}). "
        f"पुढील शिफारस केलेला कालावधी सुमारे {next_open_txt} पासून सुरू होतो. आता पेरणी करू नये."
    )

    if window_status == "outside_season":
        status = SowingReadinessStatus.UNFAVORABLE
        summary_en = cutoff_closed_en
        summary_mr = cutoff_closed_mr
        next_date = next_open
    elif window_status == "early":
        status = SowingReadinessStatus.WAIT_AND_REASSESS
        if crop.season == CropSeason.KHARIF:
            summary_en = (
                f"The sowing window for {crop.name} has not opened yet (opens {next_open_txt}). "
                "Finish land preparation and wait for enough monsoon rain."
            )
            summary_mr = (
                f"{crop.name_mr} पिकासाठी पेरणीचा कालावधी अद्याप सुरू झालेला नाही ({next_open_txt} पासून). "
                "पूर्वमशागत पूर्ण करून मान्सूनच्या पुरेशा पावसाची वाट पहावी."
            )
        else:
            summary_en = (
                f"The sowing window for {crop.name} has not opened yet (opens {next_open_txt}). "
                "Finish land preparation and plan irrigation."
            )
            summary_mr = (
                f"{crop.name_mr} पिकासाठी पेरणीचा कालावधी अद्याप सुरू झालेला नाही ({next_open_txt} पासून). "
                "पूर्वमशागत पूर्ण करून सिंचनाचे नियोजन करावे."
            )
        next_date = target_date + timedelta(days=7)
    elif not rainfall_data_ok:
        status = SowingReadinessStatus.INSUFFICIENT_DATA
        summary_en = (
            "Recent rainfall data is incomplete, so soil moisture cannot be judged. "
            "Check moisture in your field by hand and ask your local KVK before sowing."
        )
        summary_mr = (
            "अलीकडील पावसाची माहिती अपुरी असल्याने जमिनीतील ओलावा ठरवता येत नाही. "
            "पेरणीपूर्वी शेतातील ओलावा स्वतः तपासावा व स्थानिक KVK चा सल्ला घ्यावा."
        )
        next_date = target_date + timedelta(days=2)
    elif recent_rain < required_rain:
        status = SowingReadinessStatus.WAIT_AND_REASSESS
        summary_en = (
            f"Do not sow into dry soil. Wait until the soil is moist enough (vapsa); about {required_rain:.0f} mm of rain "
            f"is commonly advised before sowing {crop.name}, and only {recent_rain:.0f} mm fell in the last 14 days."
        )
        summary_mr = (
            f"धुळवाफ पेरणी टाळावी. जमिनीत किमान {required_rain:.0f} मिमी पाऊस होऊन पुरेशी ओल (वाफसा स्थिती) आल्याशिवाय {crop.name_mr} पेरणी करू नये."
        )
        next_date = target_date + timedelta(days=3)
    elif forecast_hazard:
        status = SowingReadinessStatus.WAIT_AND_REASSESS
        summary_en = (
            f"Soil moisture looks adequate, but the forecast shows a hazard ({forecast_evidence}). "
            "Consider delaying sowing by 2-3 days and check again."
        )
        summary_mr = (
            f"वाफसा स्थिती दिसते, परंतु हवामान अंदाजात धोका आहे ({forecast_evidence}). "
            "पेरणी २-३ दिवस पुढे ढकलून पुन्हा तपासावे."
        )
        next_date = target_date + timedelta(days=3)
    elif not forecast_available:
        status = SowingReadinessStatus.INSUFFICIENT_DATA
        summary_en = (
            f"Recent rain ({recent_rain:.0f} mm) looks adequate, but the weather forecast could not be retrieved, "
            "so the coming days cannot be checked. Check the forecast and your field moisture before sowing."
        )
        summary_mr = (
            f"अलीकडील पाऊस ({recent_rain:.0f} मिमी) पुरेसा दिसतो, परंतु हवामान अंदाज मिळू शकला नाही, "
            "त्यामुळे पुढील दिवसांचा आढावा घेता आला नाही. पेरणीपूर्वी अंदाज व शेतातील ओलावा तपासावा."
        )
        next_date = target_date + timedelta(days=1)
    else:
        status = SowingReadinessStatus.FAVORABLE
        late_en = " This is the delayed part of the window, so sow soon and prefer shorter-duration varieties." if window_status == "delayed" else ""
        late_mr = " ही मुदतीतील उशिराची वेळ आहे; लवकर पेरणी करावी व कमी कालावधीचे वाण निवडावेत." if window_status == "delayed" else ""
        summary_en = (
            f"Conditions support considering sowing {crop.name}: {recent_rain:.0f} mm of rain in the last 14 days and no major "
            f"hazard in the 7-day forecast.{late_en} Confirm moisture in your own field first."
        )
        summary_mr = (
            f"{crop.name_mr} पेरणीसाठी हवामान व वाफसा स्थिती अनुकूल आहे ({recent_rain:.0f} मिमी पाऊस).{late_mr} "
            "बियाण्यास शिफारशीत बीजप्रक्रिया करून पेरणी करावी."
        )
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
        antecedent_rainfall_7d_mm=accumulation_7d.total_mm if accumulation_7d is not None else None,
        antecedent_rainfall_14d_mm=recent_rain,
        forecast_14d_hazard_flag=forecast_hazard,
        forecast_summary=forecast_evidence,
        next_reassessment_date=next_date,
        rule_version="sowing-engine-v1.1.0",
        provenance=crop.source_citation,
    )
