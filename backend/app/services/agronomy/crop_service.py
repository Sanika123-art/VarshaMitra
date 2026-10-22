"""Crop requirements and growth stage metadata service."""

from typing import List, Optional
from app.data.crops_catalogue import get_crop_requirement, list_supported_crops
from app.schemas.agronomy import CropRequirement, CropSeason, GrowthStageItem


class CropService:
    """Provides access to verified agronomic requirements and crop growth stages."""

    @staticmethod
    def get_crop(crop_id: str) -> Optional[CropRequirement]:
        """Fetch crop requirements by ID."""
        return get_crop_requirement(crop_id)

    @staticmethod
    def list_crops(season: Optional[CropSeason] = None) -> List[CropRequirement]:
        """List supported crops, optionally filtered by season."""
        return list_supported_crops(season)

    @staticmethod
    def get_stage(crop_id: str, stage_id: str) -> Optional[GrowthStageItem]:
        """Fetch specific growth stage specification for a crop."""
        crop = get_crop_requirement(crop_id)
        if not crop:
            return None
        for st in crop.growth_stages:
            if st.stage_id == stage_id.strip().lower():
                return st
        return None


crop_service = CropService()
