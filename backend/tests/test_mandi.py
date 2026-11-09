"""Tests for honest, district-matched Agmarknet prices."""

from typing import Any

from fastapi.testclient import TestClient

from app.core.config import settings
from app.services.mandi import agmarknet


def test_malvan_gets_labeled_demo_prices_for_selected_crop_and_location(
    client: TestClient, monkeypatch: Any
) -> None:
    agmarknet._MANDI_CACHE.clear()
    monkeypatch.setattr(settings, "DATA_GOV_IN_API_KEY", None)

    response = client.get("/api/v1/mandi/rates?crop_id=onion&block_id=malvan")

    assert response.status_code == 200
    data = response.json()
    assert data["district"] == "Sindhudurg"
    assert data["taluka"] == "Malvan"
    assert data["data_mode"] == "demo"
    assert data["data_available"] is True
    assert data["availability_code"] == "api_key_missing"
    assert data["modal_price"] == agmarknet.DEMO_PRICES["onion"][0]
    assert "not a market quote" in data["market_name"]
    assert "प्रत्यक्ष बाजारभाव नाही" in data["market_name_mr"]
    assert data["arrival_date"] is None
    assert data["is_live_sync"] is False
    assert data["source_url"] == agmarknet.AGMARKNET_URL
    assert data["nearby_mandis"][0]["modal_price"] == data["modal_price"]

    rice_response = client.get("/api/v1/mandi/rates?crop_id=rice&block_id=malvan")
    rice_data = rice_response.json()
    assert rice_data["crop_id"] == "rice"
    assert rice_data["district"] == "Sindhudurg"
    assert rice_data["modal_price"] == agmarknet.DEMO_PRICES["rice"][0]
    assert rice_data["modal_price"] != data["modal_price"]


def test_agmarknet_prices_are_filtered_to_requested_crop_and_district(
    client: TestClient, monkeypatch: Any
) -> None:
    agmarknet._MANDI_CACHE.clear()
    monkeypatch.setattr(settings, "DATA_GOV_IN_API_KEY", "test-key")
    records = [
        {
            "state": "Maharashtra",
            "district": "Sindhudurg",
            "market": "Malvan",
            "commodity": "Onion",
            "variety": "Red",
            "arrival_date": "15/05/2025",
            "min_price": "1200",
            "max_price": "1800",
            "modal_price": "1500",
        },
        {
            "state": "Maharashtra",
            "district": "Nashik",
            "market": "Lasalgaon",
            "commodity": "Onion",
            "arrival_date": "15/05/2025",
            "min_price": "2000",
            "max_price": "4000",
            "modal_price": "3000",
        },
        {
            "state": "Maharashtra",
            "district": "Sindhudurg",
            "market": "Kudal",
            "commodity": "Rice",
            "arrival_date": "15/05/2025",
            "min_price": "1000",
            "max_price": "2000",
            "modal_price": "1500",
        },
    ]

    class FakeResponse:
        def raise_for_status(self) -> None:
            return None

        def json(self) -> dict[str, Any]:
            return {"records": records}

    class FakeClient:
        def __init__(self, **_: Any) -> None:
            pass

        async def __aenter__(self) -> "FakeClient":
            return self

        async def __aexit__(self, *_: Any) -> None:
            return None

        async def get(self, *_: Any, **__: Any) -> FakeResponse:
            return FakeResponse()

    monkeypatch.setattr(agmarknet.httpx, "AsyncClient", FakeClient)

    response = client.get("/api/v1/mandi/rates?crop_id=onion&block_id=malvan")

    assert response.status_code == 200
    data = response.json()
    assert data["district"] == "Sindhudurg"
    assert data["data_available"] is True
    assert data["data_mode"] == "official"
    assert data["market_name"] == "Malvan"
    assert data["modal_price"] == 1500
    assert [market["market_name"] for market in data["nearby_mandis"]] == ["Malvan"]
