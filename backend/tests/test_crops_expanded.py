"""Tests for expanded Maharashtra crop catalogue, search, and suitability."""

import pytest
from httpx import AsyncClient, ASGITransport

from app.data.crops_catalogue import (
    RAW_CROPS,
    get_crop_requirement,
    list_supported_crops,
)
from app.main import app
from app.schemas.agronomy import CropSeason, SuitabilityStatus, WaterSourceType


class TestExpandedCropCatalogue:
    """Verifies that the crop catalogue satisfies the 20+ authentic Maharashtra crop requirement."""

    def test_catalogue_contains_at_least_20_crops(self):
        assert len(RAW_CROPS) >= 20
        # Verify 24 crops are present
        expected_crops = [
            "soybean", "cotton", "pigeonpea", "pearl_millet", "sorghum",
            "rice", "wheat", "maize", "finger_millet", "chickpea",
            "green_gram", "black_gram", "groundnut", "sunflower", "sesame",
            "safflower", "onion", "tomato", "chilli", "potato",
            "sugarcane", "pomegranate", "grapes", "banana",
        ]
        for cid in expected_crops:
            assert cid in RAW_CROPS, f"Missing expected crop: {cid}"

    def test_every_crop_has_complete_agronomic_specs(self):
        for cid, crop in RAW_CROPS.items():
            assert crop.crop_id == cid
            assert crop.name and len(crop.name) > 0
            assert crop.name_mr and len(crop.name_mr) > 0
            assert crop.scientific_name and len(crop.scientific_name) > 0
            assert crop.crop_category in ["cereal", "pulse", "oilseed", "fibre", "commercial", "vegetable", "horticulture"]
            assert len(crop.suitable_textures) > 0
            assert crop.min_soil_ph < crop.max_soil_ph
            assert crop.duration_days_min <= crop.duration_days_max
            assert len(crop.growth_stages) >= 3
            assert crop.sowing_window is not None
            assert len(crop.recommended_varieties) > 0
            assert "MPKV" in crop.source_citation or "PDKV" in crop.source_citation or "VNMKV" in crop.source_citation or "BSKKV" in crop.source_citation or "ICAR" in crop.source_citation or "VSI" in crop.source_citation

    def test_category_filtering(self):
        cereals = list_supported_crops(category="cereal")
        assert len(cereals) >= 5
        assert all(c.crop_category == "cereal" for c in cereals)

        pulses = list_supported_crops(category="pulse")
        assert len(pulses) >= 4
        assert all(c.crop_category == "pulse" for c in pulses)

        oilseeds = list_supported_crops(category="oilseed")
        assert len(oilseeds) >= 4
        assert all(c.crop_category == "oilseed" for c in oilseeds)

        horticulture = list_supported_crops(category="horticulture")
        assert len(horticulture) >= 3
        assert all(c.crop_category == "horticulture" for c in horticulture)

    def test_search_filtering(self):
        # Search by Marathi name
        mr_results = list_supported_crops(search="सोयाबीन")
        assert any(c.crop_id == "soybean" for c in mr_results)

        # Search by variety name
        var_results = list_supported_crops(search="Bhagwa")
        assert any(c.crop_id == "pomegranate" for c in var_results)

        # Search by English partial
        paddy_results = list_supported_crops(search="paddy")
        assert any(c.crop_id == "rice" for c in paddy_results)

    def test_alias_resolution(self):
        assert get_crop_requirement("tur").crop_id == "pigeonpea"
        assert get_crop_requirement("jowar").crop_id == "sorghum"
        assert get_crop_requirement("bajra").crop_id == "pearl_millet"
        assert get_crop_requirement("harbara").crop_id == "chickpea"
        assert get_crop_requirement("moong").crop_id == "green_gram"
        assert get_crop_requirement("urad").crop_id == "black_gram"
        assert get_crop_requirement("keli").crop_id == "banana"
        assert get_crop_requirement("dalimb").crop_id == "pomegranate"
        assert get_crop_requirement("bhat").crop_id == "rice"


@pytest.mark.asyncio
class TestCropsAPIEndpoints:
    """Verifies the HTTP endpoints for listing and querying crops."""

    async def test_list_crops_endpoint_returns_expanded_catalogue(self):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            res = await ac.get("/api/v1/crops")
            assert res.status_code == 200
            data = res.json()
            assert len(data) >= 20

    async def test_list_crops_category_filter(self):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            res = await ac.get("/api/v1/crops?category=pulse")
            assert res.status_code == 200
            data = res.json()
            assert len(data) >= 4
            assert all(item["crop_category"] == "pulse" for item in data)

    async def test_list_crops_search_query(self):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            res = await ac.get("/api/v1/crops?search=cotton")
            assert res.status_code == 200
            data = res.json()
            assert len(data) >= 1
            assert data[0]["crop_id"] == "cotton"

    async def test_specific_crop_suitability_evaluation(self):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            # Query suitability for Baramati with target crop banana under rainfed
            res = await ac.get("/api/v1/crops/suitability/baramati?crop_id=banana&water_source=rainfed")
            assert res.status_code == 200
            data = res.json()
            # Top candidate should be banana and marked unsuitable under pure rainfed
            first_crop = data["candidate_crops"][0]
            assert first_crop["crop_id"] == "banana"
            assert first_crop["status"] == "unsuitable"
