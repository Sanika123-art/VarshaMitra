"""Deterministic, agronomist-aligned explanation fallback templates for VarshaMitra.

Used when NuGen LLM is disabled, unavailable, times out, or when model output
violates decision-integrity invariants.
"""

from typing import Dict, Any, Tuple
from app.schemas.agronomy import CropAdvisoryResponse, AdvisoryPriority


def generate_deterministic_explanation(
    advisory: CropAdvisoryResponse,
    language: str = "en",
) -> Dict[str, str]:
    """Generate grounded, non-hallucinating explanations in English or Marathi.
    
    Guarantees:
    - Zero invented facts, dosages, or probabilities.
    - Exact preservation of validated primary action and priority.
    - Transparent statement of data uncertainty and required field checks.
    """
    is_mr = language.lower() == "mr"
    primary = advisory.primary_advisory
    crop_name = primary.crop_name_mr if is_mr else primary.crop_name
    stage_name = primary.stage_name_mr if is_mr else primary.stage_name
    block_name = advisory.block_name
    district_name = advisory.district_name
    priority_val = primary.priority.value
    
    # Extract climate context signals
    ctx = advisory.climate_context
    dry_spell_days = ctx.get("dry_spell_longest_days", ctx.get("dry_spell_current_days", 0)) or 0
    rain_14d = ctx.get("accumulation_14d_mm", 0.0) or 0.0
    heavy_rain_days = ctx.get("heavy_rain_days_count", 0) or 0
    in_season = bool(ctx.get("in_monsoon_season", True))

    # 1. SUMMARY
    if is_mr:
        if primary.priority == AdvisoryPriority.CRITICAL:
            summary = (
                f"{district_name} जिल्ह्यातील {block_name} विभागामध्ये {crop_name} पिकासाठी "
                f"सध्या {stage_name} अवस्थेत तातडीची कृती आवश्यक आहे. {primary.primary_action_mr}"
            )
        else:
            summary = (
                f"{block_name} येथे {crop_name} पिकाच्या {stage_name} अवस्थेसाठी "
                f"हवामान व जमिनीच्या स्थितीनुसार प्रमाणित शिफारस जारी करण्यात आली आहे."
            )
    else:
        if primary.priority == AdvisoryPriority.CRITICAL:
            summary = (
                f"Urgent management action is required for {crop_name} at {stage_name} stage in "
                f"{block_name}, {district_name}. {primary.primary_action_en}"
            )
        else:
            summary = (
                f"Standard agro-climatic guidance for {crop_name} at {stage_name} stage in "
                f"{block_name}, {district_name} based on verified local conditions."
            )

    # 2. SIGNAL EXPLANATION
    if is_mr:
        signals_list = []
        if dry_spell_days >= 7:
            signals_list.append(
                f"मागील १४ दिवसांत सलग {dry_spell_days} दिवस पावसाचा खंड"
                + ("" if in_season else " (मान्सूननंतरच्या कोरड्या हंगामात हे सामान्य आहे)")
            )
        if rain_14d > 0:
            signals_list.append(f"मागील १४ दिवसांचा एकूण पाऊस {rain_14d:.1f} मि.मी.")
        if heavy_rain_days > 0:
            signals_list.append(f"अतिवृष्टीचे दिवस: {heavy_rain_days}")
        if not signals_list:
            signals_list.append("गेल्या १४ दिवसांत कोणताही विशेष पावसाचा संकेत नाही")
        
        signal_explanation = (
            f"स्थानिक हवामान निर्देशकांनुसार: " + "; ".join(signals_list) + f". "
            f"{crop_name} पिकाच्या {stage_name} अवस्थेसाठी हा हवामान संकेत संवेदनशील मानला जातो."
        )
    else:
        signals_list = []
        if dry_spell_days >= 7:
            signals_list.append(
                f"Longest rainless spell in the last 14 days: {dry_spell_days} days"
                + ("" if in_season else " (normal in the post-monsoon dry season)")
            )
        if rain_14d > 0:
            signals_list.append(f"14-day rainfall accumulation of {rain_14d:.1f} mm")
        if heavy_rain_days > 0:
            signals_list.append(f"{heavy_rain_days} day(s) of heavy rainfall (>64.5 mm/day)")
        if not signals_list:
            signals_list.append("No notable rainfall signal in the last 14 days")

        signal_explanation = (
            f"Recent weather (model-based estimate, not a rain-gauge reading): " + "; ".join(signals_list) + f". "
            f"This is background for the {crop_name} {stage_name} stage."
        )

    # 3. REASONING SUMMARY
    if is_mr:
        reasoning_summary = primary.plain_language_reason_mr
    else:
        reasoning_summary = primary.plain_language_reason_en

    # 4. ACTION EXPLANATION
    if is_mr:
        action_explanation = (
            f"प्राथमिक कृती: {primary.primary_action_mr} "
            f"या शिफारशीचे पालन केल्याने पिकाचे होणारे नुकसान टाळता येते. "
            f"नियम संदर्भ: {primary.rule_id} ({primary.provenance})."
        )
    else:
        action_explanation = (
            f"Primary action: {primary.primary_action_en} "
            f"This is a rule-based recommendation, not a guarantee of yield. "
            f"Agronomic source: {primary.rule_id} ({primary.provenance})."
        )

    # 5. UNCERTAINTY & CAVEATS
    if is_mr:
        uncertainty = (
            f"मर्यादा व दक्षता: ही शिफारस क्षेत्रीय पर्जन्य व मॉडेल अंदाजावर आधारित आहे. "
            f"शेतकऱ्यांनी प्रत्यक्ष शेतातील मातीचा ओलावा (वाफसा स्थिती) तपासावा. "
            f"अधिक मार्गदर्शनासाठी स्थानिक तालुका कृषी अधिकारी (TKA) किंवा कृषी विज्ञान केंद्राशी (KVK) संपर्क साधावा."
        )
    else:
        uncertainty = (
            f"Limitations & verification: This guidance is derived from meteorological indicators and verified agronomic rules. "
            f"Farmers must physically inspect in-situ field soil moisture (Vapsa condition) before executing interventions. "
            f"For chemical/dosage specifics, consult the local Taluka Krishi Adhikari or Krishi Vigyan Kendra (KVK)."
        )

    return {
        "summary": summary,
        "signal_explanation": signal_explanation,
        "reasoning_summary": reasoning_summary,
        "action_explanation": action_explanation,
        "uncertainty": uncertainty,
    }
