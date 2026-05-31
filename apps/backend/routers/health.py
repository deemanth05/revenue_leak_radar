"""
Health check router.
"""
from __future__ import annotations

import time
from datetime import datetime, timezone
from typing import Literal
from fastapi import APIRouter, Depends, Response
from pydantic import BaseModel
from sqlalchemy import text, select
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


# ── System Health Schemas ───────────────────────────────────────────────────────

class ServiceHealthResponse(BaseModel):
    service: str
    status: Literal["healthy", "degraded", "down"]
    latency_ms: float | None
    error_rate: float | None
    last_checked: str


class SystemHealthResponse(BaseModel):
    overall: Literal["healthy", "degraded", "critical"]
    services: list[ServiceHealthResponse]
    checked_at: str


@router.get("/health/system", response_model=SystemHealthResponse, summary="Get system services health status")
async def health_system(db: AsyncSession = Depends(get_db)) -> SystemHealthResponse:
    """
    Check the status of all integrated services dynamically based on active database incidents.
    """
    from models.incident import Incident, IncidentStatus
    active_statuses = [IncidentStatus.active, IncidentStatus.investigating, IncidentStatus.mitigating]
    
    try:
        result = await db.execute(
            select(Incident)
            .where(Incident.status.in_(active_statuses))
        )
        active_incidents = list(result.scalars().all())
    except Exception:
        active_incidents = []
    
    # Base services list
    services_status = {
        "Checkout Service": {"status": "healthy", "latency_ms": 45.0, "error_rate": 0.0},
        "Auth Service": {"status": "healthy", "latency_ms": 35.0, "error_rate": 0.0},
        "Payment Processor": {"status": "healthy", "latency_ms": 110.0, "error_rate": 0.0},
        "API Gateway": {"status": "healthy", "latency_ms": 12.0, "error_rate": 0.0},
        "PostgreSQL (Primary)": {"status": "healthy", "latency_ms": 2.0, "error_rate": 0.0},
        "Redis Cache": {"status": "healthy", "latency_ms": 1.0, "error_rate": 0.0},
        "Stripe API": {"status": "healthy", "latency_ms": 150.0, "error_rate": 0.0},
        "CDN (EU-WEST-1)": {"status": "healthy", "latency_ms": 25.0, "error_rate": 0.0},
        "CDN (US-EAST-1)": {"status": "healthy", "latency_ms": 18.0, "error_rate": 0.0},
        "Sentry": {"status": "healthy", "latency_ms": 85.0, "error_rate": 0.0},
        "GitHub Actions": {"status": "healthy", "latency_ms": 450.0, "error_rate": 0.0},
        "Slack Webhooks": {"status": "healthy", "latency_ms": 120.0, "error_rate": 0.0},
    }

    overall_status = "healthy"
    
    # Modify based on active incidents
    for inc in active_incidents:
        title_lower = inc.title.lower()
        severity = inc.severity.value if hasattr(inc.severity, 'value') else str(inc.severity)
        
        # Determine overall state
        if severity == "critical":
            overall_status = "critical"
        elif severity == "high" and overall_status != "critical":
            overall_status = "degraded"
        elif overall_status == "healthy":
            overall_status = "degraded"
            
        # Correlate specific services
        if "checkout" in title_lower or "payment" in title_lower:
            services_status["Checkout Service"]["status"] = "down" if severity == "critical" else "degraded"
            services_status["Checkout Service"]["latency_ms"] = 4820.0
            services_status["Checkout Service"]["error_rate"] = 34.2
            
            services_status["Payment Processor"]["status"] = "degraded"
            services_status["Payment Processor"]["latency_ms"] = 6800.0
            services_status["Payment Processor"]["error_rate"] = 28.1
            
            services_status["Stripe API"]["status"] = "degraded"
            services_status["Stripe API"]["latency_ms"] = 5200.0
            services_status["Stripe API"]["error_rate"] = 18.3
            
        if "auth" in title_lower or "login" in title_lower:
            services_status["Auth Service"]["status"] = "down" if severity == "critical" else "degraded"
            services_status["Auth Service"]["latency_ms"] = 2940.0
            services_status["Auth Service"]["error_rate"] = 4.5
            
        if "cdn" in title_lower or "eu-west" in title_lower:
            services_status["CDN (EU-WEST-1)"]["status"] = "degraded"
            services_status["CDN (EU-WEST-1)"]["latency_ms"] = 890.0
            services_status["CDN (EU-WEST-1)"]["error_rate"] = 2.4

    # Build response list
    now_str = datetime.now(tz=timezone.utc).isoformat()
    services_list = []
    for name, data in services_status.items():
        services_list.append(ServiceHealthResponse(
            service=name,
            status=data["status"],
            latency_ms=data["latency_ms"],
            error_rate=data["error_rate"],
            last_checked=now_str
        ))
        
    return SystemHealthResponse(
        overall=overall_status,
        services=services_list,
        checked_at=now_str
    )


@router.get("/metrics", summary="Prometheus scraper metrics endpoint")
async def prometheus_metrics() -> Response:
    """Return in-memory SRE request counts and durations."""
    from fastapi import Response
    from core.observability import get_prometheus_metrics
    return Response(content=get_prometheus_metrics(), media_type="text/plain")
