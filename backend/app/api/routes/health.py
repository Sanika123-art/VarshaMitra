"""Health check endpoint handler."""

from fastapi import APIRouter, status
from app.core.config import settings
from app.schemas.health import HealthResponse

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Service Health Check",
    description="Returns current service status, identifier, version, and running environment.",
)
async def get_health() -> HealthResponse:
    """Return stable JSON with service status and version."""
    return HealthResponse(
        status="healthy",
        service="varshamitra-backend",
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
    )
