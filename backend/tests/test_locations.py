"""Tests for Maharashtra administrative locations, statewide geocoding, and dynamic resolution."""

from fastapi.testclient import TestClient


def test_list_districts(client: TestClient) -> None:
    """Test GET /api/v1/locations/districts returns all 36 Maharashtra districts."""
    response = client.get("/api/v1/locations/districts")
    assert response.status_code == 200
    districts = response.json()
    assert len(districts) == 36

    # Verify key districts across divisions are present
    ids = {d["id"] for d in districts}
    assert "pune" in ids
    assert "nashik" in ids
    assert "raigad" in ids
    assert "ratnagiri" in ids
    assert "nagpur" in ids
    assert "amravati" in ids
    assert "nanded" in ids
    assert "chhatrapati_sambhajinagar" in ids

    # Verify Pune fields
    pune = next(d for d in districts if d["id"] == "pune")
    assert pune["name"] == "Pune"
    assert pune["name_mr"] == "पुणे"
    assert pune["state_id"] == "mh"
    assert pune["block_count"] >= 3


def test_get_district_detail(client: TestClient) -> None:
    """Test GET /api/v1/locations/districts/{district_id} returns district with member blocks."""
    response = client.get("/api/v1/locations/districts/pune")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "pune"
    assert data["name"] == "Pune"
    assert len(data["blocks"]) >= 3

    block_ids = [b["id"] for b in data["blocks"]]
    assert "baramati" in block_ids
    assert "maval" in block_ids


def test_get_unknown_district(client: TestClient) -> None:
    """Test GET /api/v1/locations/districts/{unknown} returns 404."""
    response = client.get("/api/v1/locations/districts/nonexistent_dist")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_list_all_blocks(client: TestClient) -> None:
    """Test GET /api/v1/locations/blocks returns all Maharashtra blocks."""
    response = client.get("/api/v1/locations/blocks")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] >= 36
    assert len(data["items"]) >= 36
    assert "coverage_notice" in data


def test_filter_blocks_by_district(client: TestClient) -> None:
    """Test GET /api/v1/locations/blocks?district_id=kolhapur filters correctly."""
    response = client.get("/api/v1/locations/blocks?district_id=kolhapur")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] >= 2
    block_ids = {b["id"] for b in data["items"]}
    assert "karveer" in block_ids
    assert "panhala" in block_ids


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
    assert data["curated_districts_count"] == 36
    assert data["statewide_coverage_pct"] == 100.0


def test_search_locations_gazetteer(client: TestClient) -> None:
    """Test GET /api/v1/locations/search matches local gazetteer items."""
    response = client.get("/api/v1/locations/search?q=baramati")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] >= 1
    top = data["results"][0]
    assert top["id"] == "baramati"
    assert top["district_id"] == "pune"


def test_reverse_geocode_inside_maharashtra(client: TestClient) -> None:
    """Test GET /api/v1/locations/reverse for valid Maharashtra coordinates."""
    # Central Pune coordinates
    response = client.get("/api/v1/locations/reverse?lat=18.5204&lon=73.8567")
    assert response.status_code == 200
    data = response.json()
    assert data["state_name"] == "Maharashtra"
    assert data["latitude"] == 18.5204
    assert data["longitude"] == 73.8567


def test_reverse_geocode_outside_maharashtra(client: TestClient) -> None:
    """Test GET /api/v1/locations/reverse for coordinates outside Maharashtra returns 400."""
    # London coordinates
    response = client.get("/api/v1/locations/reverse?lat=51.5074&lon=-0.1278")
    assert response.status_code == 400
    assert "outside maharashtra" in response.json()["detail"].lower()


def test_resolve_location_direct_coordinates(client: TestClient) -> None:
    """Test POST /api/v1/locations/resolve with coordinates registers a dynamic location."""
    payload = {"latitude": 18.6498, "longitude": 72.8765}
    response = client.post("/api/v1/locations/resolve", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["state_name"] == "Maharashtra"
    assert data["latitude"] == 18.6498
    assert data["longitude"] == 72.8765

    # Verify that the registered location is now retrievable by ID
    block_id = data["id"]
    get_res = client.get(f"/api/v1/locations/blocks/{block_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == block_id
