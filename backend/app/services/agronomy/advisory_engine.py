"""Crop-stage-specific agricultural advisory engine.

Synthesizes phenological growth stages, Phase 3 climate risk indicators,
and verified university package of practices into prioritized actions.
"""

from datetime import datetime, timezone
import uuid
from typing import Any, Dict, List, Optional

from app.data.crops_catalogue import get_crop_requirement
from app.schemas.agronomy import (
    AdvisoryPriority,
    CropAdvisoryItem,
    CropAdvisoryResponse,
    CropRequirement,
    GrowthStageItem,
)
from app.schemas.climate import (
    AccumulationIndicator,
    DrySpellIndicator,
    HeavyRainIndicator,
    RiskAssessmentResponse,
    RiskLevel,
)
from app.schemas.location import BlockDetail


def generate_crop_advisories(
    block: BlockDetail,
    crop: CropRequirement,
    stage: GrowthStageItem,
    climate_risk: Optional[RiskAssessmentResponse],
    accumulation: AccumulationIndicator,
    dry_spell: DrySpellIndicator,
    heavy_rain: HeavyRainIndicator,
    language: str = "en",
) -> CropAdvisoryResponse:
    """Generate prioritized, evidence-backed crop advisories in English and Marathi."""
    now = datetime.now(timezone.utc)
    lang = language.strip().lower()

    advisories: List[CropAdvisoryItem] = []

    # -------------------------------------------------------------------------
    # RULE SET 1: CRITICAL DELUGE & EXCESS RAIN HAZARDS
    # -------------------------------------------------------------------------
    if heavy_rain.has_heavy_rain_event or heavy_rain.max_single_day_mm >= 64.5:
        max_mm = heavy_rain.max_single_day_mm
        advisories.append(
            CropAdvisoryItem(
                advisory_id=f"adv_deluge_{uuid.uuid4().hex[:8]}",
                crop_id=crop.crop_id,
                crop_name=crop.name,
                crop_name_mr=crop.name_mr,
                stage_id=stage.stage_id,
                stage_name=stage.name,
                stage_name_mr=stage.name_mr,
                priority=AdvisoryPriority.CRITICAL,
                primary_action_en=(
                    f"Immediately clear drainage channels and open excess water outlets to drain standing water from {crop.name} fields."
                ),
                primary_action_mr=(
                    f"{crop.name_mr} पिकाच्या शेतात साचलेले अतिरिक्त पाणी तात्काळ बाहेर काढण्यासाठी चर काढून निचरा करावा."
                ),
                secondary_actions_en=[
                    "Postpone any planned fertilizer, pesticide, or herbicide spraying until soil surface dries (vapsa condition).",
                    "After flood water recedes, apply a drenching of copper oxychloride (30g/10L) to prevent root rot and collar rot.",
                ],
                secondary_actions_mr=[
                    "वाफसा येईपर्यंत कोणतेही खत किंवा कीटकनाशक फवारणीचे काम पुढे ढकलावे.",
                    "पाण्याचा निचरा झाल्यानंतर मुळकुज टाळण्यासाठी कॉपर ऑक्सिक्लोराईडची (३० ग्रॅम/१० लिटर) आळवणी करावी.",
                ],
                plain_language_reason_en=(
                    f"Excessive precipitation ({max_mm:.1f} mm recorded) creates root-zone waterlogging, cutting off oxygen "
                    f"to roots and predisposing the crop to fungal wilt and damping-off."
                ),
                plain_language_reason_mr=(
                    f"झालेल्या मुसळधार पावसामुळे ({max_mm:.1f} मिमी) मुळांना ऑक्सिजन मिळणे बंद होते व मूळकूज रोगाचा प्रादुर्भाव वाढतो."
                ),
                supporting_signals=[
                    f"Heavy rain event detected: {max_mm:.1f} mm single-day accumulation (IMD threshold: >= 64.5 mm)",
                    f"{heavy_rain.heavy_rain_days_count} deluge day(s) recorded in window",
                ],
                rule_id="RULE-DELUGE-01",
                rule_version="advisory-v1.0.0",
                validity_days=3,
                caveats="Water drainage must be executed before applying any chemical drenching.",
                provenance=crop.source_citation,
            )
        )

    # -------------------------------------------------------------------------
    # RULE SET 2: PROLONGED DRY SPELL & MOISTURE STRESS
    # -------------------------------------------------------------------------
    streak = max(dry_spell.max_consecutive_dry_days, dry_spell.current_consecutive_dry_days)
    if streak >= 7:
        is_crit_stage = stage.is_critical_moisture_stage
        prio = AdvisoryPriority.CRITICAL if is_crit_stage else AdvisoryPriority.WARNING

        advisories.append(
            CropAdvisoryItem(
                advisory_id=f"adv_dryspell_{uuid.uuid4().hex[:8]}",
                crop_id=crop.crop_id,
                crop_name=crop.name,
                crop_name_mr=crop.name_mr,
                stage_id=stage.stage_id,
                stage_name=stage.name,
                stage_name_mr=stage.name_mr,
                priority=prio,
                primary_action_en=(
                    f"Apply protective irrigation through drip, sprinkler, or alternate furrows to sustain {crop.name} during this {streak}-day dry spell."
                ),
                primary_action_mr=(
                    f"{streak} दिवसांचा खंड पडल्याने {crop.name_mr} पिकास तुषार किंवा ठिबक सिंचनाने / एकाआड एक सरीने संरक्षित पाणी द्यावे."
                ),
                secondary_actions_en=[
                    "Spray 1% Potassium Nitrate (13:0:45) at 100g per 10 liters of water to induce osmotic stress tolerance.",
                    "Spread crop residue, straw, or sugarcane trash mulch (5 tonnes/ha) between crop rows to conserve soil moisture.",
                ],
                secondary_actions_mr=[
                    "पाण्याचा ताण सहन करण्यासाठी १% पोटॅशियम नायट्रेट (१३:०:४५) १०० ग्रॅम प्रति १० लिटर पाण्यात मिसळून फवारणी करावी.",
                    "ओलावा टिकवून ठेवण्यासाठी पिकांच्या ओळीत शेतातील काडीकचरा किंवा उसाचे पाचट यांचे आच्छादन (मल्चिंग) करावे.",
                ],
                plain_language_reason_en=(
                    f"{crop.name} is in '{stage.name}' stage and has experienced {streak} consecutive rainless days. "
                    f"Moisture stress at this juncture causes irreversible flower drop, poor pod/boll setting, or reduced grain size."
                ),
                plain_language_reason_mr=(
                    f"{crop.name_mr} पीक '{stage.name_mr}' अवस्थेत असताना {streak} दिवसांचा खंड पडल्याने फुलगळ व शेंगा न भरण्याचा धोका आहे."
                ),
                supporting_signals=[
                    f"{streak} consecutive dry days (daily rain < {dry_spell.threshold_mm} mm)",
                    f"Stage critical moisture sensitivity: {stage.is_critical_moisture_stage}",
                ],
                rule_id="RULE-DRYSPELL-02",
                rule_version="advisory-v1.0.0",
                validity_days=5,
                caveats="Protective irrigation should be applied during early morning or evening hours to minimize evaporation.",
                provenance=crop.source_citation,
            )
        )

    # -------------------------------------------------------------------------
    # RULE SET 3: STAGE-SPECIFIC AGRONOMIC ROUTINE GUIDANCE
    # -------------------------------------------------------------------------
    if stage.stage_id == "sowing":
        advisories.append(
            CropAdvisoryItem(
                advisory_id=f"adv_sowing_{uuid.uuid4().hex[:8]}",
                crop_id=crop.crop_id,
                crop_name=crop.name,
                crop_name_mr=crop.name_mr,
                stage_id=stage.stage_id,
                stage_name=stage.name,
                stage_name_mr=stage.name_mr,
                priority=AdvisoryPriority.ADVISORY,
                primary_action_en=(
                    f"Ensure seed treatment with Trichoderma viride (4g/kg) and Rhizobium/Azotobacter culture (25g/kg) before sowing {crop.name}."
                ),
                primary_action_mr=(
                    f"{crop.name_mr} पेरणीपूर्वी ट्रायकोडर्मा विरिडी (४ ग्रॅम/किलो) व रायझोबियम/अझोटोबॅक्टर (२५ ग्रॅम/किलो) यांची बीजप्रक्रिया करावी."
                ),
                secondary_actions_en=[
                    "Maintain recommended row-to-row and plant-to-plant spacing to optimize plant population.",
                    "Adopt Broad Bed Furrow (BBF) or ridge-and-furrow method for effective moisture conservation.",
                ],
                secondary_actions_mr=[
                    "शिफारशीत अंतर ठेवून पेरणी करावी जेणेकरून रोपांची संख्या योग्य राहील.",
                    "जमिनीत ओलावा टिकवण्यासाठी व अतिरिक्त पाण्याचा निचरा होण्यासाठी रुंद वरंबा सरी (BBF) पद्धत वापरावी.",
                ],
                plain_language_reason_en=(
                    "Biological seed treatment protects germinating seedlings from seed-borne fungal wilt and improves atmospheric nitrogen fixation."
                ),
                plain_language_reason_mr=(
                    "बीजप्रक्रियेमुळे बुरशीजन्य रोगांपासून संरक्षण होते आणि नत्र स्थिरीकरणास मदत होऊन रोपांची जोमदार वाढ होते."
                ),
                supporting_signals=["Standard sowing stage phenological protocol"],
                rule_id="RULE-STAGE-SOWING-03",
                rule_version="advisory-v1.0.0",
                validity_days=7,
                caveats="Do not mix chemical fungicides and bio-fertilizer cultures simultaneously; apply chemical treatment 24h prior.",
                provenance=crop.source_citation,
            )
        )
    elif stage.stage_id in ("vegetative", "tillering"):
        advisories.append(
            CropAdvisoryItem(
                advisory_id=f"adv_veg_{uuid.uuid4().hex[:8]}",
                crop_id=crop.crop_id,
                crop_name=crop.name,
                crop_name_mr=crop.name_mr,
                stage_id=stage.stage_id,
                stage_name=stage.name,
                stage_name_mr=stage.name_mr,
                priority=AdvisoryPriority.ADVISORY,
                primary_action_en=(
                    f"Perform timely hand weeding or intercultural hoeing (kolapani) at 20-25 days after sowing {crop.name}."
                ),
                primary_action_mr=(
                    f"{crop.name_mr} पिकात पेरणीनंतर २० ते २५ दिवसांनी पहिली खुरपणी व कोळपणी करून शेत तणमुक्त ठेवावे."
                ),
                secondary_actions_en=[
                    "Monitor underside of leaves for early sucking pest attack (aphids, thrips, jassids).",
                    "Apply top-dressed nitrogen fertilizer only when adequate soil moisture (vapsa) is present.",
                ],
                secondary_actions_mr=[
                    "रसशोषक किडींच्या (मावा, तुडतुडे, फुलकिडे) प्रादुर्भावासाठी पानांच्या खालच्या बाजूचे निरीक्षण करावे.",
                    "जमिनीत पुरेसा ओलावा असतानाच नत्राचा दुसरा हप्ता द्यावा.",
                ],
                plain_language_reason_en=(
                    "Weed competition during the first 30-40 days causes the most severe yield loss in Kharif crops."
                ),
                plain_language_reason_mr=(
                    "पिकाच्या सुरुवातीच्या ३० ते ४० दिवसांत तणांची स्पर्धा सर्वाधिक असते, त्यामुळे वेळेवर तणनियंत्रण गरजेचे आहे."
                ),
                supporting_signals=["Standard vegetative stage phenological protocol"],
                rule_id="RULE-STAGE-VEG-04",
                rule_version="advisory-v1.0.0",
                validity_days=7,
                caveats="Avoid deep hoeing in black cotton soil when moist to prevent root damage.",
                provenance=crop.source_citation,
            )
        )
    elif stage.stage_id in ("flowering", "pod_development", "boll_development"):
        advisories.append(
            CropAdvisoryItem(
                advisory_id=f"adv_flowering_{uuid.uuid4().hex[:8]}",
                crop_id=crop.crop_id,
                crop_name=crop.name,
                crop_name_mr=crop.name_mr,
                stage_id=stage.stage_id,
                stage_name=stage.name,
                stage_name_mr=stage.name_mr,
                priority=AdvisoryPriority.ADVISORY,
                primary_action_en=(
                    f"Install pheromone traps (5 per hectare) and monitor for pod borer / bollworm infestation in {crop.name}."
                ),
                primary_action_mr=(
                    f"{crop.name_mr} पिकात शेंगा पोखरणाऱ्या अळीच्या / बोंडअळीच्या सर्वेक्षणासाठी एकरी २ कामगंध सापळे लावावेत."
                ),
                secondary_actions_en=[
                    "Avoid applying chemical insecticides during peak morning pollinator activity (08:00 to 11:00 AM).",
                    "Maintain uniform soil moisture; avoid fluctuating wet-dry cycles which induce flower and fruit drop.",
                ],
                secondary_actions_mr=[
                    "मधमाश्यांच्या परागीभवनाच्या वेळेत (सकाळी ८ ते ११) कोणतीही विषारी रासायनिक फवारणी टाळावी.",
                    "जमिनीतील ओलावा एकसमान ठेवावा; पाण्याचा अति ताण अथवा अति पाणी यामुळे फुलगळ होते.",
                ],
                plain_language_reason_en=(
                    "The reproductive stage determines ultimate grain number and boll retention. Integrated pest management preserves natural predators."
                ),
                plain_language_reason_mr=(
                    "फुलधारणा व शेंगा/बोंड भरणे ही पिकाची संवेदनशील अवस्था असून एकात्मिक कीड व्यवस्थापनाने मित्रकिडींचे रक्षण होते."
                ),
                supporting_signals=["Standard reproductive stage phenological protocol"],
                rule_id="RULE-STAGE-REPRO-05",
                rule_version="advisory-v1.0.0",
                validity_days=7,
                caveats="Chemical pesticides must only be applied when pest population crosses Economic Threshold Level (ETL).",
                provenance=crop.source_citation,
            )
        )
    else:
        advisories.append(
            CropAdvisoryItem(
                advisory_id=f"adv_harvest_{uuid.uuid4().hex[:8]}",
                crop_id=crop.crop_id,
                crop_name=crop.name,
                crop_name_mr=crop.name_mr,
                stage_id=stage.stage_id,
                stage_name=stage.name,
                stage_name_mr=stage.name_mr,
                priority=AdvisoryPriority.INFO,
                primary_action_en=(
                    f"Harvest {crop.name} when 85-90% of pods/canes turn golden brown and dry harvested produce to <10% moisture before bagging."
                ),
                primary_action_mr=(
                    f"{crop.name_mr} पिकाच्या ८५ ते ९०% शेंगा पिवळसर तपकिरी झाल्यावर काढणी करावी व धान्य उन्हात चांगले वाळवून साठवावे."
                ),
                secondary_actions_en=[
                    "Check weather forecast prior to cutting to prevent unseasonal rain damage on threshing floor.",
                ],
                secondary_actions_mr=[
                    "काढणी व मळणी करण्यापूर्वी हवामानाचा अंदाज तपासावा जेणेकरून अवकाळी पावसामुळे नुकसान होणार नाही.",
                ],
                plain_language_reason_en=(
                    "Delayed harvest leads to pod shattering in pulses/oilseeds, while premature harvest lowers test weight and seed germination."
                ),
                plain_language_reason_mr=(
                    "उशिरा काढणी केल्यास शेंगा तडकून नुकसान होते, तर लवकर काढणी केल्यास दाणे बारीक राहतात."
                ),
                supporting_signals=["Standard physiological maturity protocol"],
                rule_id="RULE-STAGE-HARVEST-06",
                rule_version="advisory-v1.0.0",
                validity_days=7,
                caveats="Ensure proper threshing yard cleanliness to avoid fungal contamination.",
                provenance=crop.source_citation,
            )
        )

    # Sort advisories by priority tier
    prio_order = {
        AdvisoryPriority.CRITICAL: 1,
        AdvisoryPriority.WARNING: 2,
        AdvisoryPriority.ADVISORY: 3,
        AdvisoryPriority.INFO: 4,
    }
    advisories.sort(key=lambda x: prio_order[x.priority])

    primary = advisories[0]
    secondary = advisories[1:] if len(advisories) > 1 else []

    climate_context: Dict[str, Any] = {
        "cumulative_rainfall_mm": accumulation.total_mm,
        "consecutive_dry_days": streak,
        "heavy_rain_max_single_day_mm": heavy_rain.max_single_day_mm,
        "overall_risk_level": climate_risk.overall_risk.value if climate_risk else "unknown",
    }

    return CropAdvisoryResponse(
        location_id=block.id,
        block_name=block.name,
        district_name=block.district_name,
        crop_id=crop.crop_id,
        stage_id=stage.stage_id,
        language=lang,
        generated_at=now,
        primary_advisory=primary,
        secondary_advisories=secondary,
        climate_context=climate_context,
    )
