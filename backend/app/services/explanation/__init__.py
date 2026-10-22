"""Explanation service module for NuGen LLM integration and deterministic fallbacks."""

from app.services.explanation.fallback_templates import generate_deterministic_explanation
from app.services.explanation.nugen_client import (
    NuGenClient,
    NuGenClientError,
    NuGenAuthenticationError,
    NuGenRateLimitError,
    NuGenTimeoutError,
    nugen_client,
    redact_secret,
)
from app.services.explanation.explanation_service import (
    ExplanationService,
    explanation_service,
)

__all__ = [
    "generate_deterministic_explanation",
    "NuGenClient",
    "NuGenClientError",
    "NuGenAuthenticationError",
    "NuGenRateLimitError",
    "NuGenTimeoutError",
    "nugen_client",
    "redact_secret",
    "ExplanationService",
    "explanation_service",
]
