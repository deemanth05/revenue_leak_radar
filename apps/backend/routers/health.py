"""
Health check router.
"""
from __future__ import annotations

import time

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from schemas.common import HealthResponse

router = APIRouter(tags=["health"])

# Populated at startup by main.py
_start_time: float = time.time()


def set_start_time(t: float) -> None:
    global _start_time
    _start_time = t


@router.get("/health", response_model=HealthResponse, summary="Health check")
async def health_check(db: AsyncSession = Depends(get_db)) -> HealthResponse:
    """
    Checks database connectivity and returns service status.
    """
    db_status = "ok"
    try:
        await db.execute(text("SELECT 1"))
    except Exception:
        db_status = "error"

    from core.config import get_settings
    settings = get_settings()

    return HealthResponse(
        status="ok" if db_status == "ok" else "degraded",
        db_status=db_status,
        version=settings.VERSION,
        uptime_seconds=round(time.time() - _start_time, 2),
    )


@router.get("/metrics", summary="Prometheus scraper metrics endpoint")
async def prometheus_metrics() -> Response:
    """Return in-memory SRE request counts and durations."""
    from fastapi import Response
    from core.observability import get_prometheus_metrics
    return Response(content=get_prometheus_metrics(), media_type="text/plain")
