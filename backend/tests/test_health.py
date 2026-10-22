"""Tests for health check endpoints, documentation, CORS, and basic behavior."""

from fastapi.testclient import TestClient
from app.core.config import settings


def test_root_endpoint(client: TestClient) -> None:
    """Test that GET / returns service information."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == settings.PROJECT_NAME
    assert data["version"] == settings.VERSION
    assert data["status"] == "operational"
    assert data["health"] == "/health"
    assert data["api_v1"] == settings.API_V1_PREFIX


def test_unversioned_health_endpoint(client: TestClient) -> None:
    """Test that GET /health returns 200 with stable status and version."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "varshamitra-backend"
    assert data["version"] == settings.VERSION
    assert data["environment"] == settings.ENVIRONMENT


def test_versioned_health_endpoint(client: TestClient) -> None:
    """Test that GET /api/v1/health returns identical healthy response."""
    response = client.get(f"{settings.API_V1_PREFIX}/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "varshamitra-backend"
    assert data["version"] == settings.VERSION


def test_openapi_json(client: TestClient) -> None:
    """Test that /openapi.json is accessible and matches app metadata."""
    response = client.get("/openapi.json")
    assert response.status_code == 200
    spec = response.json()
    assert spec["info"]["title"] == settings.PROJECT_NAME
    assert spec["info"]["version"] == settings.VERSION
    assert "/health" in spec["paths"]
    assert f"{settings.API_V1_PREFIX}/health" in spec["paths"]


def test_docs_page(client: TestClient) -> None:
    """Test that /docs Swagger UI is accessible in development."""
    response = client.get("/docs")
    assert response.status_code == 200
    assert "text/html" in response.headers.get("content-type", "")


def test_not_found_safe_error(client: TestClient) -> None:
    """Test that requesting an unknown path returns a clean, safe 404."""
    response = client.get("/api/v1/nonexistent-route")
    assert response.status_code == 404
    data = response.json()
    assert "detail" in data
    assert data["detail"] == "Not Found"


def test_cors_headers_allowed_origin(client: TestClient) -> None:
    """Test that CORS headers are returned for configured origin."""
    allowed_origin = settings.CORS_ORIGINS[0]
    response = client.get(
        "/health",
        headers={"Origin": allowed_origin},
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == allowed_origin
