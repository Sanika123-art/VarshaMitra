"""FastAPI application entrypoint for VarshaMitra Backend Service."""

from contextlib import asynccontextmanager
import sys
from pathlib import Path
from typing import AsyncGenerator, Dict

# Ensure backend directory and repo root are in sys.path for seamless resolution
_backend_dir = str(Path(__file__).resolve().parent.parent)
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)
_repo_root = str(Path(__file__).resolve().parent.parent.parent)
if _repo_root not in sys.path:
    sys.path.insert(0, _repo_root)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import health
from app.api.v1.router import api_v1_router
from app.core.config import settings
from app.core.errors import register_exception_handlers
from app.core.logging import logger, setup_logging


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifecycle management."""
    setup_logging()
    logger.info(
        f"Starting {settings.PROJECT_NAME} v{settings.VERSION} "
        f"[environment={settings.ENVIRONMENT}, debug={settings.DEBUG}]"
    )
    yield
    logger.info(f"Stopping {settings.PROJECT_NAME}")


def create_application() -> FastAPI:
    """Application factory for VarshaMitra FastAPI service."""
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description=settings.DESCRIPTION,
        docs_url=settings.docs_url,
        redoc_url=settings.redoc_url,
        openapi_url=settings.openapi_url,
        lifespan=lifespan,
    )

    # Register safe exception handlers (no leaked stack traces or credentials)
    register_exception_handlers(app)

    # Configure CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allow_headers=["*"],
    )

    # Mount unversioned health check (/health)
    app.include_router(health.router)

    # Mount versioned API routes (/api/v1)
    app.include_router(api_v1_router, prefix=settings.API_V1_PREFIX)

    # Informative root route
    @app.get("/", tags=["Root"], summary="Service Metadata")
    async def root() -> Dict[str, str]:
        return {
            "name": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "status": "operational",
            "docs": settings.docs_url or "disabled",
            "health": "/health",
            "api_v1": settings.API_V1_PREFIX,
        }

    return app


app = create_application()
