"""Application configuration management using Pydantic Settings."""

import json
from pathlib import Path
from typing import List, Union
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Resolve backend/.env independent of the process working directory
# (the app may be launched from backend/ or from the repository root).
BACKEND_DIR = Path(__file__).resolve().parents[2]
ENV_FILE = BACKEND_DIR / ".env"


class Settings(BaseSettings):
    """Application runtime settings loaded from environment or defaults."""

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )

    # Service Metadata
    PROJECT_NAME: str = "VarshaMitra API"
    VERSION: str = "0.1.0"
    DESCRIPTION: str = (
        "Hyperlocal climate-risk intelligence and agricultural decision-support "
        "service for Maharashtra."
    )

    # Environment & Debug
    ENVIRONMENT: str = Field(default="development", description="Runtime environment: development | staging | production")
    DEBUG: bool = Field(default=False, description="Enable debug mode")

    # Networking
    HOST: str = Field(default="127.0.0.1", description="Server bind host")
    PORT: int = Field(default=8000, description="Server bind port")

    # CORS
    CORS_ORIGINS: Union[List[str], str] = Field(
        default=["http://localhost:3000", "http://127.0.0.1:3000"],
        description="Allowed CORS origins for the application.",
    )

    # API Prefix
    API_V1_PREFIX: str = Field(default="/api/v1", description="Prefix for v1 routes")

    # Logging
    LOG_LEVEL: str = Field(default="INFO", description="Logging verbosity level")

    # Optional external meteorological providers (credentials never leave the backend)
    IMD_API_KEY: Union[str, None] = Field(default=None, description="Institutional IMD gateway API key")
    IMD_API_BASE_URL: str = Field(default="https://api.imd.gov.in", description="IMD gateway base URL")
    CDSAPI_KEY: Union[str, None] = Field(default=None, description="Copernicus CDS personal access token")
    CDSAPI_URL: str = Field(default="https://cds.climate.copernicus.eu/api", description="Copernicus CDS API URL")
    DATA_GOV_IN_API_KEY: Union[str, None] = Field(default=None, description="Data.gov.in API key for verified Agmarknet market prices")

    # Map overview (bulk risk) tuning
    RISK_SUMMARY_CACHE_TTL_SECONDS: int = Field(default=900, description="In-memory cache lifetime for the bulk risk summary")
    RISK_SUMMARY_CONCURRENCY: int = Field(default=8, description="Max concurrent upstream weather requests for the bulk summary")

    # NuGen LLM Explanation Integration
    NUGEN_ENABLED: bool = Field(default=False, description="Enable NuGen LLM explanation integration")
    NUGEN_API_KEY: Union[str, None] = Field(default=None, description="API key for NuGen Intelligence")
    NUGEN_BASE_URL: str = Field(default="https://api.nugen.in", description="NuGen API root domain")
    NUGEN_INFERENCE_PATH: str = Field(default="/api/v3/inference/chat/completions", description="NuGen chat completions path")
    NUGEN_MODEL: str = Field(default="Qwen/Qwen2.5-0.5B-Instruct", description="NuGen model identifier")
    NUGEN_TIMEOUT_SECONDS: float = Field(default=12.0, description="HTTP request timeout in seconds")
    NUGEN_MAX_RETRIES: int = Field(default=2, description="Bounded retry attempts for transient HTTP 429/5xx errors")

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        """Parse CORS origins from JSON string, comma-separated string, or list."""
        if isinstance(v, str):
            v_trimmed = v.strip()
            if v_trimmed.startswith("[") and v_trimmed.endswith("]"):
                try:
                    parsed = json.loads(v_trimmed)
                    if isinstance(parsed, list):
                        return [str(origin).strip() for origin in parsed if str(origin).strip()]
                except json.JSONDecodeError:
                    pass
            # Comma-separated fallback
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        elif isinstance(v, list):
            return [str(origin).strip() for origin in v if str(origin).strip()]
        return ["http://localhost:3000", "http://127.0.0.1:3000"]

    @field_validator("ENVIRONMENT")
    @classmethod
    def validate_environment(cls, v: str) -> str:
        valid_envs = {"development", "staging", "production", "test"}
        cleaned = v.strip().lower()
        if cleaned not in valid_envs:
            raise ValueError(f"ENVIRONMENT must be one of {valid_envs}, got '{v}'")
        return cleaned

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @property
    def docs_url(self) -> Union[str, None]:
        """Swagger docs URL; available in non-production environments or if debug is True."""
        if self.is_production and not self.DEBUG:
            return None
        return "/docs"

    @property
    def redoc_url(self) -> Union[str, None]:
        """ReDoc URL; available in non-production environments or if debug is True."""
        if self.is_production and not self.DEBUG:
            return None
        return "/redoc"

    @property
    def openapi_url(self) -> Union[str, None]:
        """OpenAPI JSON spec URL; available in non-production environments or if debug is True."""
        if self.is_production and not self.DEBUG:
            return None
        return "/openapi.json"


settings = Settings()
