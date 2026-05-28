"""
Structured logging setup with Rich console handler for development
and JSON formatter for production.
"""
from __future__ import annotations

import logging
import sys
from typing import Any

try:
    from rich.logging import RichHandler
    _RICH_AVAILABLE = True
except ImportError:
    _RICH_AVAILABLE = False

from core.config import get_settings

_CONFIGURED = False


class _JsonFormatter(logging.Formatter):
    """Minimal JSON log formatter for production environments."""

    def format(self, record: logging.LogRecord) -> str:
        import json
        from datetime import datetime, timezone

        payload: dict[str, Any] = {
            "timestamp": datetime.fromtimestamp(
                record.created, tz=timezone.utc
            ).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        if hasattr(record, "extra"):
            payload.update(record.extra)  # type: ignore[arg-type]
        return json.dumps(payload)


def _configure_logging() -> None:
    global _CONFIGURED
    if _CONFIGURED:
        return

    settings = get_settings()
    level_name = "DEBUG" if settings.DEBUG else "INFO"
    level = getattr(logging, level_name, logging.INFO)

    root = logging.getLogger()
    root.setLevel(level)

    # Remove existing handlers to avoid duplicates
    root.handlers.clear()

    if settings.ENVIRONMENT == "development" and _RICH_AVAILABLE:
        handler: logging.Handler = RichHandler(
            level=level,
            rich_tracebacks=True,
            show_path=False,
        )
    else:
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(level)
        handler.setFormatter(_JsonFormatter())

    root.addHandler(handler)

    # Quieten noisy third-party loggers
    logging.getLogger("sqlalchemy.engine").setLevel(
        logging.INFO if settings.DEBUG else logging.WARNING
    )
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)

    _CONFIGURED = True


def get_logger(name: str) -> logging.Logger:
    """Return a configured logger for the given module name."""
    _configure_logging()
    return logging.getLogger(name)
