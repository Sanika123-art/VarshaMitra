"""Tests for Maharashtra administrative locations endpoints."""

from fastapi.testclient import TestClient


def test_list_districts(client: TestClient) -> None:
    """Test GET /api/v1/locations/districts returns all 7 curated districts."""
    response = client.get("/api/v1/locations/districts")
    assert response.status_code == 200
    districts = response.json()
    assert len(districts) == 7

    # Verify stable IDs matching frontend data
    ids = {d["id"] for d in districts}
    expected = {"pune", "nashik", "ahilyanagar", "kolhapur", "satara", "solapur", "nandurbar"}
    assert ids == expected

    # Verify fields
    pune = next(d for d in districts if d["id"] == "pune")
    assert pune["name"] == "Pune"
    assert pune["name_mr"] == "पुणे"
    assert pune["state_id"] == "mh"
    assert pune["block_count"] == 3
    assert pune["coverage_status"] == "curated_focus_subset"


def test_get_district_detail(client: TestClient) -> None:
    """Test GET /api/v1/locations/districts/{district_id} returns district with member blocks."""
    response = client.get("/api/v1/locations/districts/pune")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "pune"
    assert data["name"] == "Pune"
    assert len(data["blocks"]) == 3

    block_ids = [b["id"] for b in data["blocks"]]
    assert block_ids == ["maval", "baramati", "daund"]


def test_get_unknown_district(client: TestClient) -> None:
    """Test GET /api/v1/locations/districts/{unknown} returns 404."""
    response = client.get("/api/v1/locations/districts/nonexistent_dist")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_list_all_blocks(client: TestClient) -> None:
    """Test GET /api/v1/locations/blocks returns all 15 curated blocks."""
    response = client.get("/api/v1/locations/blocks")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 15
    assert len(data["items"]) == 15
    assert "coverage_notice" in data


def test_filter_blocks_by_district(client: TestClient) -> None:
    """Test GET /api/v1/locations/blocks?district_id=kolhapur filters correctly."""
    response = client.get("/api/v1/locations/blocks?district_id=kolhapur")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 2
    block_ids = {b["id"] for b in data["items"]}
    assert block_ids == {"karvir", "panhala"}


def test_filter_blocks_by_unknown_district(client: TestClient) -> None:
    """Test GET /api/v1/locations/blocks?district_id=unknown returns 404."""
    response = client.get("/api/v1/locations/blocks?district_id=unknown_xyz")
    assert response.status_code == 404
    assert "does not match" in response.json()["detail"].lower()


def test_get_block_detail(client: TestClient) -> None:
    """Test GET /api/v1/locations/blocks/baramati returns complete hierarchy and coordinates."""
    response = client.get("/api/v1/locations/blocks/baramati")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "baramati"
    assert data["name"] == "Baramati"
    assert data["name_mr"] == "बारामती"
    assert data["district_id"] == "pune"
    assert data["district_name"] == "Pune"
    assert data["state_id"] == "mh"
    assert data["state_name"] == "Maharashtra"
    assert data["latitude"] == 18.15
    assert data["longitude"] == 74.58
    assert data["coordinates_precision"] == "approximate_centroid"
    assert data["coverage_status"] == "curated_focus_subset"


def test_get_unknown_block(client: TestClient) -> None:
    """Test GET /api/v1/locations/blocks/unknown returns 404."""
    response = client.get("/api/v1/locations/blocks/unknown_block_999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_coverage_metadata_endpoint(client: TestClient) -> None:
    """Test GET /api/v1/locations/coverage reports honest scope limitations."""
    response = client.get("/api/v1/locations/coverage")
    assert response.status_code == 200
    data = response.json()
    assert data["total_state_districts"] == 36
    assert data["curated_districts_count"] == 7
    assert data["curated_blocks_count"] == 15
    assert data["statewide_coverage_pct"] == 19.4
    assert data["coordinates_precision"] == "approximate_centroid"
    assert "7 of 36" in data["coverage_limitation_statement"]
