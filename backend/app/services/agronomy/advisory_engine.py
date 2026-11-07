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


# Crop groups used to keep routine stage guidance crop-appropriate.
LEGUME_CROPS = frozenset({"soybean", "groundnut", "pigeonpea", "chickpea", "green_gram", "black_gram"})
VEGETATIVELY_PROPAGATED = frozenset({"sugarcane", "banana", "pomegranate", "grapes", "potato"})
BBF_SUITABLE_CROPS = frozenset(
    {"soybean", "cotton", "pigeonpea", "green_gram", "black_gram", "groundnut", "sunflower", "chickpea", "safflower", "maize", "sorghum"}
)
HELICOVERPA_HOSTS = frozenset({"pigeonpea", "chickpea", "soybean", "tomato"})


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
                caveats_mr="रासायनिक आळवणी करण्यापूर्वी शेतातील साचलेल्या पाण्याचा पूर्ण निचरा करणे अनिवार्य आहे.",
                provenance=crop.source_citation,
            )
        )

    # -------------------------------------------------------------------------
    # RULE SET 2: DRY SPELL & MOISTURE STRESS (season- and crop-aware)
    # -------------------------------------------------------------------------
    streak = max(dry_spell.max_consecutive_dry_days, dry_spell.current_consecutive_dry_days)
    in_season = climate_risk.in_monsoon_season if climate_risk is not None else True

    if streak >= 7 and in_season:
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
                    "Spread crop residue, straw, or sugarcane trash mulch between crop rows to conserve soil moisture.",
                    "A 1% potassium nitrate (13:0:45) foliar spray is sometimes recommended to help crops tolerate moisture stress; confirm the product and dose with your local KVK first.",
                ],
                secondary_actions_mr=[
                    "ओलावा टिकवून ठेवण्यासाठी पिकांच्या ओळीत शेतातील काडीकचरा किंवा उसाचे पाचट यांचे आच्छादन (मल्चिंग) करावे.",
                    "पाण्याचा ताण सहन करण्यासाठी १% पोटॅशियम नायट्रेट (१३:०:४५) फवारणी काही वेळा सुचवली जाते; वापरण्यापूर्वी स्थानिक कृषी विज्ञान केंद्राकडून उत्पादन व मात्रा निश्चित करावी.",
                ],
                plain_language_reason_en=(
                    f"{crop.name} is in '{stage.name}' stage and the last {streak} days were rainless. "
                    + (
                        "This stage is highly sensitive to moisture stress, which can cause flower drop, poor pod/boll setting, or smaller grain."
                        if stage.is_critical_moisture_stage
                        else "Prolonged dryness can slow growth and reduce yield if the soil dries out."
                    )
                ),
                plain_language_reason_mr=(
                    f"{crop.name_mr} पीक '{stage.name_mr}' अवस्थेत असताना गेले {streak} दिवस पाऊस झालेला नाही. "
                    + (
                        "ही अवस्था पाण्याच्या ताणास अतिसंवेदनशील असल्याने फुलगळ किंवा शेंगा/बोंड न भरण्याचा धोका आहे."
                        if stage.is_critical_moisture_stage
                        else "दीर्घकाळ कोरडेपणामुळे वाढ मंदावून उत्पादन घटू शकते."
                    )
                ),
                supporting_signals=[
                    f"{streak} consecutive dry days (daily rain < {dry_spell.threshold_mm} mm)",
                    f"Stage critical moisture sensitivity: {stage.is_critical_moisture_stage}",
                ],
                rule_id="RULE-DRYSPELL-02",
                rule_version="advisory-v1.1.0",
                validity_days=5,
                caveats=(
                    "Provisional rule. Apply protective irrigation in early morning or evening to reduce evaporation, "
                    "and only if water is available."
                ),
                caveats_mr="पाण्याचा अपव्यय टाळण्यासाठी संरक्षित पाणी सकाळी लवकर किंवा संध्याकाळी द्यावे; पाणी उपलब्ध असेल तरच सिंचन करावे.",
                provenance=crop.source_citation,
            )
        )
    elif streak >= 7:
        # Outside the June-September monsoon a rainless spell is normal; do not present it as an emergency.
        kharif_crop = crop.season.value == "kharif"
        if kharif_crop:
            action_en = (
                f"{crop.name} is a Kharif (rainy-season) crop and is not normally in the field now. "
                "Dry weather at this time of year is normal; use it for field preparation and plan the next sowing window."
            )
            action_mr = (
                f"{crop.name_mr} हे खरीप (पावसाळी) पीक असून या काळात सहसा शेतात नसते. "
                "या काळात कोरडे हवामान सामान्य आहे; शेतीची पूर्वमशागत करावी व पुढील पेरणी कालावधीचे नियोजन करावे."
            )
            reason_en = f"No rain for {streak} days is normal in the dry season and does not harm a crop that is not growing."
            reason_mr = f"कोरड्या हंगामात {streak} दिवस पाऊस नसणे सामान्य आहे; शेतात पीक नसल्यास त्याचा धोका नाही."
        else:
            action_en = (
                f"Dry weather is normal at this time of year. Water {crop.name} by your planned irrigation schedule "
                "rather than waiting for rain."
            )
            action_mr = (
                f"या काळात कोरडे हवामान सामान्य आहे. {crop.name_mr} पिकास पावसाची वाट न पाहता ठरलेल्या सिंचन वेळापत्रकानुसार पाणी द्यावे."
            )
            reason_en = (
                f"No rain for {streak} days is normal outside the monsoon. {crop.name} depends on irrigation in this season, "
                "so what matters is whether your water source is available, not the rainless days themselves."
            )
            reason_mr = (
                f"मान्सूननंतर {streak} दिवस पाऊस नसणे सामान्य आहे. या हंगामात {crop.name_mr} पिकास सिंचनावर अवलंबून राहावे लागते; "
                "त्यामुळे पाण्याचा स्रोत उपलब्ध आहे का हे महत्त्वाचे."
            )
        advisories.append(
            CropAdvisoryItem(
                advisory_id=f"adv_drydry_{uuid.uuid4().hex[:8]}",
                crop_id=crop.crop_id,
                crop_name=crop.name,
                crop_name_mr=crop.name_mr,
                stage_id=stage.stage_id,
                stage_name=stage.name,
                stage_name_mr=stage.name_mr,
                priority=(
                    AdvisoryPriority.ADVISORY
                    if (stage.is_critical_moisture_stage and not kharif_crop)
                    else AdvisoryPriority.INFO
                ),
                primary_action_en=action_en,
                primary_action_mr=action_mr,
                secondary_actions_en=[],
                secondary_actions_mr=[],
                plain_language_reason_en=reason_en,
                plain_language_reason_mr=reason_mr,
                supporting_signals=[
                    f"{streak} consecutive dry days (daily rain < {dry_spell.threshold_mm} mm)",
                    "Window ends outside the June-September monsoon season",
                ],
                rule_id="RULE-DRYSPELL-OFFSEASON-02B",
                rule_version="advisory-v1.1.0",
                validity_days=5,
                caveats="Provisional rule. Check your irrigation source and the crop calendar for your area.",
                caveats_mr="हंगामी अंदाज. आपल्या भागातील सिंचन उपलब्धता व पीक दिनदर्शिकेनुसार नियोजन करावे.",
                provenance=crop.source_citation,
            )
        )

    # -------------------------------------------------------------------------
    # RULE SET 3: STAGE-SPECIFIC AGRONOMIC ROUTINE GUIDANCE (crop-aware)
    # -------------------------------------------------------------------------
    is_legume = crop.crop_id in LEGUME_CROPS
    is_vegetative_planting = crop.crop_id in VEGETATIVELY_PROPAGATED
    confirm_note = " Confirm products and doses with your local KVK or Taluka Krishi Adhikari."

    if stage.stage_id == "sowing":
        if is_vegetative_planting:
            action_en = (
                f"Use healthy, disease-free planting material for {crop.name} and treat it as recommended in the "
                "MPKV/PDKV package of practices before planting."
            )
            action_mr = (
                f"{crop.name_mr} लागवडीसाठी निरोगी, रोगमुक्त लागवड साहित्य वापरावे व लागवडीपूर्वी कृषी विद्यापीठाच्या शिफारशीनुसार प्रक्रिया करावी."
            )
            reason_en = "Clean planting material and treatment reduce disease carried into the new crop."
            reason_mr = "निरोगी लागवड साहित्य व प्रक्रियेमुळे नव्या पिकात रोगाचा प्रसार कमी होतो."
        elif is_legume:
            action_en = (
                f"Treat {crop.name} seed with Trichoderma viride (4 g/kg) and Rhizobium culture (25 g/kg) before sowing."
            )
            action_mr = (
                f"{crop.name_mr} पेरणीपूर्वी बियाण्यास ट्रायकोडर्मा विरिडी (४ ग्रॅम/किलो) व रायझोबियम (२५ ग्रॅम/किलो) यांची बीजप्रक्रिया करावी."
            )
            reason_en = "Seed treatment protects seedlings from seed-borne fungal disease; Rhizobium helps legumes fix nitrogen."
            reason_mr = "बीजप्रक्रियेमुळे बुरशीजन्य रोगांपासून संरक्षण होते; रायझोबियममुळे कडधान्य/शेंगावर्गीय पिकांना नत्र स्थिरीकरणास मदत होते."
        else:
            action_en = (
                f"Treat {crop.name} seed with Trichoderma viride (4 g/kg) and Azotobacter culture (25 g/kg) before sowing."
            )
            action_mr = (
                f"{crop.name_mr} पेरणीपूर्वी बियाण्यास ट्रायकोडर्मा विरिडी (४ ग्रॅम/किलो) व अझोटोबॅक्टर (२५ ग्रॅम/किलो) यांची बीजप्रक्रिया करावी."
            )
            reason_en = "Seed treatment protects seedlings from seed-borne fungal disease and supports early growth."
            reason_mr = "बीजप्रक्रियेमुळे बुरशीजन्य रोगांपासून संरक्षण होते व सुरुवातीची वाढ चांगली होते."

        secondary_en = ["Keep the row and plant spacing recommended for this crop to get the right plant population."]
        secondary_mr = ["पिकासाठी शिफारशीत ओळीतील व रोपांतील अंतर ठेवून पेरणी करावी."]
        if crop.crop_id in BBF_SUITABLE_CROPS:
            secondary_en.append(
                "On black soil, a Broad Bed Furrow (BBF) or ridge-and-furrow layout helps conserve moisture and drain excess water."
            )
            secondary_mr.append(
                "काळ्या जमिनीत रुंद वरंबा सरी (BBF) किंवा सरी-वरंबा पद्धतीने ओलावा टिकतो व अतिरिक्त पाण्याचा निचरा होतो."
            )

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
                primary_action_en=action_en,
                primary_action_mr=action_mr,
                secondary_actions_en=secondary_en,
                secondary_actions_mr=secondary_mr,
                plain_language_reason_en=reason_en,
                plain_language_reason_mr=reason_mr,
                supporting_signals=["Standard sowing-stage practice (not weather-triggered)"],
                rule_id="RULE-STAGE-SOWING-03",
                rule_version="advisory-v1.1.0",
                validity_days=7,
                caveats=(
                    "Routine stage practice, not triggered by today's weather. Do not mix chemical fungicides and "
                    "bio-culture at the same time; apply the chemical treatment 24 hours earlier." + confirm_note
                ),
                caveats_mr="रासायनिक बुरशीनाशक व जैविक खते एकत्र मिसळू नयेत; रासायनिक बीजप्रक्रिया २४ तास आधी करावी.",
                provenance=crop.source_citation,
            )
        )
    elif stage.stage_id in ("vegetative", "tillering"):
        weeding_en = (
            f"Keep the {crop.name} field weed-free, especially in the first 30-40 days after sowing/planting, by hand weeding or inter-row hoeing."
        )
        weeding_mr = (
            f"{crop.name_mr} पिकात सुरुवातीच्या ३० ते ४० दिवसांत खुरपणी/कोळपणी करून शेत तणमुक्त ठेवावे."
        )
        if crop.season.value == "kharif" and not is_vegetative_planting:
            weeding_en += " For most Kharif field crops the first weeding is due around 20-25 days after sowing."
            weeding_mr += " बहुतेक खरीप पिकांत पहिली खुरपणी साधारण २० ते २५ दिवसांनी करावी."
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
                primary_action_en=weeding_en,
                primary_action_mr=weeding_mr,
                secondary_actions_en=[
                    "Check the underside of leaves regularly for early sucking pests (aphids, thrips, jassids).",
                    "Apply top-dressed nitrogen only when the soil has enough moisture (vapsa).",
                ],
                secondary_actions_mr=[
                    "रसशोषक किडींच्या (मावा, तुडतुडे, फुलकिडे) प्रादुर्भावासाठी पानांच्या खालच्या बाजूचे नियमित निरीक्षण करावे.",
                    "जमिनीत पुरेसा ओलावा (वाफसा) असतानाच नत्राचा दुसरा हप्ता द्यावा.",
                ],
                plain_language_reason_en=(
                    "Weeds compete with the young crop for water and nutrients; early weed control protects yield."
                ),
                plain_language_reason_mr=(
                    "तण पिकाशी पाणी व अन्नद्रव्यांसाठी स्पर्धा करते; सुरुवातीला तणनियंत्रण केल्यास उत्पादन टिकते."
                ),
                supporting_signals=["Standard vegetative-stage practice (not weather-triggered)"],
                rule_id="RULE-STAGE-VEG-04",
                rule_version="advisory-v1.1.0",
                validity_days=7,
                caveats="Routine stage practice, not triggered by today's weather. Avoid deep hoeing in moist black cotton soil to prevent root damage.",
                caveats_mr="हवामानाचा कोणताही प्रतिकूल इशारा नाही. मात्र भारी काळ्या जमिनीत ओल असताना खोल कोळपणी करू नये, अन्यथा मुळांना इजा होऊ शकते.",
                provenance=crop.source_citation,
            )
        )
    elif stage.stage_id in ("flowering", "pod_development", "boll_development"):
        if crop.crop_id == "cotton":
            pest_en = "bollworm"
            pest_mr = "बोंडअळी"
        elif crop.crop_id in HELICOVERPA_HOSTS:
            pest_en = "pod / fruit borer (Helicoverpa)"
            pest_mr = "शेंग/फळ पोखरणारी अळी (हेलिकोव्हर्पा)"
        else:
            pest_en = None
            pest_mr = None

        if pest_en:
            action_en = (
                f"Install pheromone traps (about 5 per hectare) and check {crop.name} regularly for {pest_en}."
            )
            action_mr = (
                f"{crop.name_mr} पिकात {pest_mr} च्या सर्वेक्षणासाठी हेक्टरी सुमारे ५ कामगंध सापळे लावावेत व नियमित निरीक्षण करावे."
            )
        else:
            action_en = (
                f"Scout the {crop.name} crop at least weekly for pests and disease at this sensitive stage; "
                "use pheromone traps only for pests recommended for this crop."
            )
            action_mr = (
                f"{crop.name_mr} पिकाच्या या संवेदनशील अवस्थेत किमान आठवड्यातून एकदा कीड-रोगांचे निरीक्षण करावे; "
                "फक्त या पिकासाठी शिफारस केलेल्या किडींसाठीच कामगंध सापळे वापरावेत."
            )
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
                primary_action_en=action_en,
                primary_action_mr=action_mr,
                secondary_actions_en=[
                    "Avoid insecticide spraying during peak pollinator activity (about 8 to 11 AM).",
                    "Keep soil moisture even; large swings between wet and dry can cause flower and fruit drop.",
                ],
                secondary_actions_mr=[
                    "मधमाश्यांच्या परागीभवनाच्या वेळेत (सकाळी सुमारे ८ ते ११) कीटकनाशक फवारणी टाळावी.",
                    "जमिनीतील ओलावा एकसमान ठेवावा; पाण्याचा अति ताण अथवा अति पाणी यामुळे फुलगळ होते.",
                ],
                plain_language_reason_en=(
                    "The flowering and fruiting stage decides how much grain, pod or fruit the crop sets, "
                    "and early pest detection lets you act before damage spreads."
                ),
                plain_language_reason_mr=(
                    "फुलधारणा व फळधारणेची अवस्था उत्पादन ठरवते; किडीचा लवकर शोध घेतल्यास नुकसान पसरण्यापूर्वी उपाय करता येतो."
                ),
                supporting_signals=["Standard reproductive-stage practice (not weather-triggered)"],
                rule_id="RULE-STAGE-REPRO-05",
                rule_version="advisory-v1.1.0",
                validity_days=7,
                caveats=(
                    "Routine stage practice, not triggered by today's weather. Spray chemical pesticides only when pest "
                    "numbers cross the Economic Threshold Level (ETL)." + confirm_note
                ),
                caveats_mr="किडींची संख्या आर्थिक नुकसान पातळी (ETL) ओलांडल्याशिवाय रासायनिक कीटकनाशकांची फवारणी करू नये.",
                provenance=crop.source_citation,
            )
        )
    else:
        # Maturity (and any unrecognised stage): generic, crop-neutral harvest guidance.
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
                    f"Harvest {crop.name} at physiological maturity as described in the MPKV/PDKV package of practices, "
                    "and dry the produce to safe storage moisture before bagging."
                ),
                primary_action_mr=(
                    f"{crop.name_mr} पिकाची काढणी कृषी विद्यापीठाच्या शिफारशीनुसार परिपक्वतेच्या अवस्थेत करावी व साठवणुकीपूर्वी माल योग्य प्रमाणात वाळवावा."
                ),
                secondary_actions_en=[
                    "Check the weather forecast before cutting and threshing so unseasonal rain does not damage the produce.",
                ],
                secondary_actions_mr=[
                    "काढणी व मळणी करण्यापूर्वी हवामानाचा अंदाज तपासावा जेणेकरून अवकाळी पावसामुळे नुकसान होणार नाही.",
                ],
                plain_language_reason_en=(
                    "Harvesting too late can cause shattering and losses; harvesting too early lowers grain quality."
                ),
                plain_language_reason_mr=(
                    "उशिरा काढणी केल्यास दाणे गळून नुकसान होते, तर लवकर काढणी केल्यास दाण्याची प्रत खालावते."
                ),
                supporting_signals=["Standard maturity-stage practice (not weather-triggered)"],
                rule_id="RULE-STAGE-HARVEST-06",
                rule_version="advisory-v1.1.0",
                validity_days=7,
                caveats="Routine stage practice, not triggered by today's weather. Maturity signs differ by crop; follow the crop-specific package of practices.",
                caveats_mr="पिकाची काढणी योग्य परिपक्वतेच्या लक्षणांनंतरच करावी; काढणीनंतर धान्य उन्हात चांगले वाळवून साठवावे.",
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
        "accumulation_14d_mm": accumulation.total_mm,
        "dry_spell_current_days": dry_spell.current_consecutive_dry_days,
        "dry_spell_longest_days": streak,
        "dry_spell_severity": dry_spell.severity,
        "heavy_rain_days_count": heavy_rain.heavy_rain_days_count,
        "cumulative_rainfall_mm": accumulation.total_mm,
        "consecutive_dry_days": streak,
        "heavy_rain_max_single_day_mm": heavy_rain.max_single_day_mm,
        "overall_risk_level": climate_risk.overall_risk.value if climate_risk else "unknown",
        "in_monsoon_season": in_season,
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
