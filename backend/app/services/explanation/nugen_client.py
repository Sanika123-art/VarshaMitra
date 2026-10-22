"""NuGen Intelligence API client adapter for LLM explanations.

Provides secure HTTP communication with NuGen inference endpoints,
bounded retries on transient errors, strict timeouts, and credential redaction.
Reference: https://docs.nugen.in/api-reference/inference/generate-chat-completions
"""

import logging
import time
from typing import Any, Dict, List, Optional
import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


def redact_secret(text: str, secret: Optional[str]) -> str:
    """Sanitize any occurrence of an API key or auth token in strings."""
    if not secret or len(secret) < 4:
        return text
    return text.replace(secret, "***REDACTED***")


class NuGenClientError(Exception):
    """Base exception for NuGen provider errors."""
    pass


class NuGenAuthenticationError(NuGenClientError):
    """Raised on HTTP 401/403 credential or permission errors."""
    pass


class NuGenRateLimitError(NuGenClientError):
    """Raised on HTTP 429 quota or rate limits."""
    pass


class NuGenTimeoutError(NuGenClientError):
    """Raised when request exceeds configured timeout."""
    pass


class NuGenClient:
    """Secure HTTP client adapter for NuGen Intelligence chat completions."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        inference_path: Optional[str] = None,
        model: Optional[str] = None,
        timeout_seconds: Optional[float] = None,
        max_retries: Optional[int] = None,
    ):
        self.api_key = api_key if api_key is not None else settings.NUGEN_API_KEY
        self.base_url = (base_url or settings.NUGEN_BASE_URL).rstrip("/")
        self.inference_path = inference_path or settings.NUGEN_INFERENCE_PATH
        if not self.inference_path.startswith("/"):
            self.inference_path = "/" + self.inference_path
        self.model = model or settings.NUGEN_MODEL
        self.timeout_seconds = timeout_seconds if timeout_seconds is not None else settings.NUGEN_TIMEOUT_SECONDS
        self.max_retries = max_retries if max_retries is not None else settings.NUGEN_MAX_RETRIES

    @property
    def effective_api_key(self) -> Optional[str]:
        return self.api_key if self.api_key is not None else settings.NUGEN_API_KEY

    @property
    def is_configured(self) -> bool:
        """Return True if NuGen is enabled and an API key is present."""
        key = self.effective_api_key
        return bool(settings.NUGEN_ENABLED and key and key.strip())

    @property
    def endpoint_url(self) -> str:
        return f"{self.base_url}{self.inference_path}"

    def generate_chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.2,
        max_tokens: int = 700,
    ) -> Dict[str, Any]:
        """Execute chat completion request to NuGen with bounded retries."""
        if not self.is_configured:
            raise NuGenClientError("NuGen client is disabled or unconfigured.")

        key = self.effective_api_key
        headers = {
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "User-Agent": "VarshaMitra-AgronomyEngine/1.0",
        }

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": False,
        }

        attempts = 0
        last_error: Optional[Exception] = None

        while attempts <= self.max_retries:
            attempts += 1
            try:
                with httpx.Client(timeout=self.timeout_seconds) as client:
                    response = client.post(
                        self.endpoint_url,
                        headers=headers,
                        json=payload,
                    )

                if response.status_code == 200:
                    return response.json()

                if response.status_code in (401, 403):
                    msg = f"Authentication failure with NuGen API (HTTP {response.status_code})"
                    logger.warning(redact_secret(msg, self.api_key))
                    raise NuGenAuthenticationError(msg)

                if response.status_code == 429:
                    msg = "NuGen API rate limit reached (HTTP 429)"
                    if attempts <= self.max_retries:
                        time.sleep(0.5 * attempts)
                        continue
                    raise NuGenRateLimitError(msg)

                if response.status_code in (500, 502, 503, 504):
                    msg = f"NuGen service transient error (HTTP {response.status_code})"
                    if attempts <= self.max_retries:
                        time.sleep(0.4 * attempts)
                        continue
                    raise NuGenClientError(msg)

                # Other HTTP errors
                raise NuGenClientError(f"NuGen HTTP error: {response.status_code}")

            except httpx.TimeoutException as exc:
                last_error = NuGenTimeoutError(f"NuGen request timed out after {self.timeout_seconds}s")
                if attempts <= self.max_retries:
                    time.sleep(0.3 * attempts)
                    continue
                raise last_error

            except (NuGenAuthenticationError, NuGenRateLimitError):
                raise

            except Exception as exc:
                safe_msg = redact_secret(str(exc), self.api_key)
                last_error = NuGenClientError(f"Network error connecting to NuGen: {safe_msg}")
                if attempts <= self.max_retries:
                    time.sleep(0.3 * attempts)
                    continue
                raise last_error

        if last_error:
            raise last_error
        raise NuGenClientError("NuGen chat completion failed after maximum retry attempts")


nugen_client = NuGenClient()
