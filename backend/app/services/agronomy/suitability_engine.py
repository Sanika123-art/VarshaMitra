"""Explainable, deterministic crop suitability assessment engine.

Synthesizes agroclimatic zones, soil properties (measured or regional),
water availability, and university crop requirements into transparent suitability tiers.
"""

from datetime import date
from typing import Any, Dict, List, Optional

from app.data.crops_catalogue import list_supported_crops
from app.schemas.agronomy import (
    CropRequirement,
    CropSeason,
    CropSuitabilityResult,
    SuitabilityAssessmentResponse,
    SuitabilityStatus,
    WaterSourceType,
)
from app.schemas.location import BlockDetail
from app.schemas.soil import (
    FieldSoilTestResponse,
    RegionalSoilSummaryResponse,
    SoilDataSource,
    SoilTextureClass,
)


def evaluate_crop_suitability(
    crop: CropRequirement,
    soil_profile: RegionalSoilSummaryResponse,
    field_test: Optional[FieldSoilTestResponse],
    water_source: WaterSourceType,
    block: BlockDetail,
) -> CropSuitabilityResult:
    """Evaluate suitability of a candidate crop against soil, water, and climate parameters."""
    supporting: List[str] = []
    limiting: List[str] = []
    interventions: List[str] = []
    missing: List[str] = []

    # 1. Determine active soil inputs (prefer field test if available, else regional estimate)
    active_ph = field_test.ph if field_test else soil_profile.topsoil_ph
    active_texture = soil_profile.dominant_texture  # Texture predominantly from regional survey
    is_measured_soil = field_test is not None

    if not is_measured_soil:
        missing.append("Field-specific soil test (using regional SoilGrids/ICAR estimate)")

    # 2. Evaluate Soil Texture & Depth (30 pts)
    texture_score = 0
    if active_texture in crop.suitable_textures:
        texture_score = 30
        supporting.append(f"Soil texture ({active_texture.value}) matches crop root-zone requirements")
    elif active_texture in (SoilTextureClass.LOAM, SoilTextureClass.CLAY_LOAM):
        texture_score = 20
        supporting.append(f"Soil texture ({active_texture.value}) is moderately compatible")
    else:
        texture_score = 10
        limiting.append(f"Soil texture ({active_texture.value}) deviates from preferred textures: {[t.value for t in crop.suitable_textures]}")
        interventions.append("Apply organic farmyard manure (FYM) or green manuring to improve soil physical condition")

    # 3. Evaluate Soil Reaction / pH (20 pts)
    ph_score = 0
    if crop.min_soil_ph <= active_ph <= crop.max_soil_ph:
        ph_score = 20
        supporting.append(f"Soil pH ({active_ph:.1f}) is within optimal physiological range ({crop.min_soil_ph} - {crop.max_soil_ph})")
    elif (crop.min_soil_ph - 0.4) <= active_ph <= (crop.max_soil_ph + 0.4):
        ph_score = 12
        limiting.append(f"Soil pH ({active_ph:.1f}) is marginally outside optimal range ({crop.min_soil_ph} - {crop.max_soil_ph})")
        if active_ph > crop.max_soil_ph:
            interventions.append("Apply agricultural gypsum or press-mud to manage alkaline pH tendencies")
        else:
            interventions.append("Apply agricultural lime (calcium carbonate) to buffer acidic tendencies")
    else:
        ph_score = 0
        limiting.append(f"Soil pH ({active_ph:.1f}) presents severe physiological stress for {crop.name}")

    # 4. Evaluate Water Source & Moisture Demand (30 pts)
    water_score = 0
    if water_source == WaterSourceType.ASSURED_IRRIGATION:
        water_score = 30
        supporting.append("Assured perennial irrigation satisfies all critical growth stage moisture requirements")
    elif water_source == WaterSourceType.PROTECTIVE_IRRIGATION:
        if crop.crop_id in ("sugarcane", "banana"):
            water_score = 10
            limiting.append(f"{crop.name} requires continuous assured irrigation; protective irrigation alone is insufficient")
            interventions.append("Adopt subsurface drip irrigation with fertigation to maximize water-use efficiency")
        elif crop.crop_category in ("horticulture", "vegetable"):
            water_score = 24
            supporting.append(f"Protective irrigation supports {crop.name} during dry spells, though drip irrigation is recommended for commercial yields")
        else:
            water_score = 28
            supporting.append("Protective irrigation (farm pond/well) provides effective insurance against intermittent dry spells")
    else:  # RAINFED
        if crop.crop_id in ("sugarcane", "banana"):
            water_score = 0
            limiting.append(f"{crop.name} cannot be cultivated under pure rainfed conditions in Maharashtra")
        elif crop.crop_category == "horticulture":
            water_score = 8
            limiting.append(f"Perennial fruit orchards ({crop.name}) face severe defoliation/dieback under pure rainfed drought conditions")
            interventions.append("Establish a farm pond (shettale) and drip irrigation network before orchard plantation")
        elif crop.crop_id in ("wheat", "potato"):
            water_score = 5
            limiting.append(f"{crop.name} cannot produce viable yield under purely rainfed Rabi conditions in Maharashtra")
            interventions.append("Assured irrigation is mandatory for Rabi wheat/potato cultivation")
        elif crop.crop_id in ("pearl_millet", "pigeonpea", "sorghum", "finger_millet", "green_gram", "black_gram", "safflower"):
            water_score = 28
            supporting.append(f"{crop.name} possesses high drought tolerance suitable for rainfed cultivation")
        elif crop.crop_id in ("soybean", "cotton", "groundnut", "sunflower", "sesame"):
            water_score = 20
            limiting.append(f"{crop.name} is vulnerable to moisture stress during flowering/pod development without protective irrigation")
            interventions.append("Implement Broad Bed Furrow (BBF) or contour bunding for in-situ soil moisture conservation")
        elif crop.crop_id in ("rice", "tomato", "chilli", "onion"):
            water_score = 12
            limiting.append(f"{crop.name} has high moisture sensitivity; pure rainfed cultivation carries substantial risk during dry spells")
            interventions.append("Adopt protective irrigation schedule or mulching with drip")
        else:
            water_score = 15
            limiting.append(f"{crop.name} has moderate water requirements and may experience yield penalties under rainfed dry spells")

    # 5. Agroclimatic Zone Compatibility (20 pts)
    zone_score = 20
    supporting.append(f"Recommended for Maharashtra agro-ecological conditions ({crop.publisher})")

    total_score = texture_score + ph_score + water_score + zone_score

    # Determine status
    if (crop.crop_id in ("sugarcane", "banana") or crop.crop_category == "horticulture" or crop.crop_id in ("wheat", "potato")) and water_source == WaterSourceType.RAINFED:
        status = SuitabilityStatus.UNSUITABLE
        total_score = min(total_score, 35)
    elif total_score >= 75:
        status = SuitabilityStatus.SUITABLE
    elif total_score >= 50:
        status = SuitabilityStatus.CONDITIONALLY_SUITABLE
    else:
        status = SuitabilityStatus.UNSUITABLE

    return CropSuitabilityResult(
        crop_id=crop.crop_id,
        name=crop.name,
        name_mr=crop.name_mr,
        season=crop.season,
        status=status,
        suitability_score=total_score,
        supporting_factors=supporting,
        limiting_factors=limiting,
        required_interventions=interventions,
        missing_inputs=missing,
        citations=[crop.source_citation],
    )


def assess_block_suitability(
    block: BlockDetail,
    soil_profile: RegionalSoilSummaryResponse,
    field_test: Optional[FieldSoilTestResponse],
    season: CropSeason,
    water_source: WaterSourceType = WaterSourceType.RAINFED,
    custom_date: Optional[date] = None,
    target_crop_id: Optional[str] = None,
) -> SuitabilityAssessmentResponse:
    """Assess suitability for all candidate crops for a block and season, optionally prioritizing a specific crop."""
    eval_date = custom_date or date.today()
    candidate_crops = list_supported_crops(season)

    # If a specific target crop is requested (even if from another season, e.g. perennial fruit or Rabi crop), include it
    if target_crop_id:
        from app.data.crops_catalogue import get_crop_requirement
        specific_crop = get_crop_requirement(target_crop_id)
        if specific_crop and specific_crop.crop_id not in [c.crop_id for c in candidate_crops]:
            candidate_crops.insert(0, specific_crop)

    results: List[CropSuitabilityResult] = []
    for crop in candidate_crops:
        res = evaluate_crop_suitability(
            crop=crop,
            soil_profile=soil_profile,
            field_test=field_test,
            water_source=water_source,
            block=block,
        )
        results.append(res)

    # Sort results by suitability score descending, but keep requested target crop at front if specified
    if target_crop_id:
        from app.data.crops_catalogue import CROP_ALIASES
        target_canonical = CROP_ALIASES.get(target_crop_id.lower().strip(), target_crop_id.lower().strip())
        results.sort(key=lambda x: (x.crop_id == target_canonical, x.suitability_score or 0), reverse=True)
    else:
        results.sort(key=lambda x: (x.suitability_score or 0), reverse=True)

    soil_source = SoilDataSource.FARMER_LAB_TEST if field_test else SoilDataSource.REGIONAL_ESTIMATE

    soil_summary: Dict[str, Any] = {
        "source": soil_source.value,
        "texture": soil_profile.dominant_texture.value,
        "ph": field_test.ph if field_test else soil_profile.topsoil_ph,
        "organic_carbon_pct": field_test.organic_carbon_pct if field_test and field_test.organic_carbon_pct is not None else soil_profile.organic_carbon_pct,
        "available_water_capacity_mm_m": soil_profile.available_water_capacity_mm_m,
        "drainage": soil_profile.drainage_class,
    }

    return SuitabilityAssessmentResponse(
        location_id=block.id,
        location_name=block.name,
        district_name=block.district_name,
        agroclimatic_zone="Maharashtra Agro-Ecological Sub-Region",
        season=season,
        evaluation_date=eval_date,
        water_source=water_source,
        soil_source_used=soil_source,
        soil_summary=soil_summary,
        candidate_crops=results,
        version="heuristic-suitability-v1.0.0",
    )
