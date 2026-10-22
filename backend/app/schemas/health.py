"""Health check response schema."""

from pydantic import BaseModel, ConfigDict, Field


class HealthResponse(BaseModel):
    """Schema for service health status."""

    model_config = ConfigDict(extra="forbid")

    status: str = Field(
        default="healthy",
        description="Overall service status indicator",
        examples=["healthy"],
    )
    service: str = Field(
        default="varshamitra-backend",
        description="Service identifier name",
        examples=["varshamitra-backend"],
    )
    version: str = Field(
        ...,
        description="Semantic version of the running service",
        examples=["0.1.0"],
    )
    environment: str = Field(
        ...,
        description="Active runtime environment",
        examples=["development"],
    )
