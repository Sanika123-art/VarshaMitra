"""Centralized safe exception handlers."""

from typing import Any, Dict
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.core.logging import logger


def register_exception_handlers(app: FastAPI) -> None:
    """Register safe, uniform error handlers on the FastAPI application."""

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
            headers=getattr(exc, "headers", None),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        # Sanitize validation errors to avoid exposing internal schemas/secrets
        sanitized_errors = []
        for error in exc.errors():
            loc = [str(x) for x in error.get("loc", []) if x != "body"]
            sanitized_errors.append(
                {
                    "field": ".".join(loc) if loc else "body",
                    "message": error.get("msg", "Invalid value"),
                    "type": error.get("type", "value_error"),
                }
            )

        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "detail": "Request validation failed",
                "errors": sanitized_errors,
            },
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        # Log complete exception details securely on the server
        logger.error(
            f"Unhandled exception on {request.method} {request.url.path}: {exc}",
            exc_info=True,
        )

        # Return sanitized message without stack traces or internal paths
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "An internal server error occurred."},
        )
