"""Structured logging configuration without sensitive content leakage."""

import logging
import sys
from app.core.config import settings


def setup_logging() -> None:
    """Configure application logging with safe formats."""
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    log_format = (
        "%(asctime)s [%(levelname)s] %(name)s (%(filename)s:%(lineno)d): %(message)s"
    )

    logging.basicConfig(
        level=log_level,
        format=log_format,
        handlers=[logging.StreamHandler(sys.stdout)],
        force=True,
    )

    # Set specific levels for third-party loggers
    logging.getLogger("uvicorn.access").setLevel(log_level)
    logging.getLogger("uvicorn.error").setLevel(log_level)


logger = logging.getLogger("varshamitra")
