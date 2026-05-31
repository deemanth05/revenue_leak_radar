"""
Coral joint-query router — cross-signal correlation queries.

Coral is the intelligence engine that powers Revenue Leak Radar's
cross-source correlation: querying deployments, payment failures,
support tickets, and alerts within a unified time window.
"""
from __future__ import annotations

import time
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from models.alert import Alert
from models.deployment import Deployment
from models.payment_failure import PaymentFailure
from models.support_ticket import SupportTicket

router = APIRouter(prefix="/coral", tags=["coral"])

# ── Coral data sources registry ──────────────────────────────────────────────

CORAL_SOURCES = [
    {
        "id": "deployments",
        "name": "Deployment Pipeline",
        "provider": "GitHub / CI-CD",
        "description": "Production deployment events with commit tracking",
        "icon": "git-branch",
    },
    {
        "id": "payment_failures",
        "name": "Payment Gateway",
        "provider": "Stripe",
        "description": "Card declines, processing errors, and billing failures",
        "icon": "dollar-sign",
    },
    {
        "id": "support_tickets",
        "name": "Customer Support Queue",
        "provider": "Zendesk / Intercom",
        "description": "Customer complaints and escalation tickets",
        "icon": "message-square",
    },
    {
        "id": "alerts",
        "name": "Infrastructure Monitoring",
        "provider": "Sentry / Datadog / Grafana",
        "description": "Error spikes, latency alerts, and SLA violations",
        "icon": "alert-triangle",
    },
]


def _serialize_row(row: object, fields: list[str]) -> dict:
    result: dict = {}
    for f in fields:
        val = getattr(row, f, None)
        if isinstance(val, datetime):
            result[f] = val.isoformat()
        else:
            result[f] = str(val) if val is not None else None
    return result


@router.get("/sources", summary="List Coral data sources")
async def list_sources() -> dict:
    """Return metadata about all data sources available to the Coral engine."""
    return {
        "engine": "coral_v1",
        "source_count": len(CORAL_SOURCES),
        "sources": CORAL_SOURCES,
    }


@router.post("/joint-query", summary="Coral cross-signal joint query")
async def joint_query(
    window_hours: int = Query(default=24, ge=1),
    db: AsyncSession = Depends(get_db),
) -> dict:
    start_time = time.monotonic()
    cutoff = datetime.now(tz=timezone.utc) - timedelta(hours=window_hours)

    # Recent production deployments
    dep_result = await db.execute(
        select(Deployment)
        .where(Deployment.environment == "production", Deployment.deployed_at >= cutoff)
        .order_by(Deployment.deployed_at.desc())
    )
    deployments = [
        _serialize_row(d, ["id", "commit_hash", "branch", "author", "repository", "environment", "status", "deployed_at"])
        for d in dep_result.scalars().all()
    ]

    # Payment failures
    pf_result = await db.execute(
        select(PaymentFailure)
        .where(PaymentFailure.failed_at >= cutoff)
        .order_by(PaymentFailure.failed_at.desc())
    )
    payment_failures = [
        _serialize_row(pf, ["id", "incident_id", "customer_id", "amount", "currency", "failure_reason", "failed_at"])
        for pf in pf_result.scalars().all()
    ]

    # Support tickets
    st_result = await db.execute(
        select(SupportTicket)
        .where(SupportTicket.created_at >= cutoff)
        .order_by(SupportTicket.created_at.desc())
    )
    support_tickets = [
        _serialize_row(st, ["id", "incident_id", "customer_id", "subject", "priority", "status", "source", "created_at"])
        for st in st_result.scalars().all()
    ]

    # Alerts
    alert_result = await db.execute(
        select(Alert)
        .where(Alert.triggered_at >= cutoff)
        .order_by(Alert.triggered_at.desc())
    )
    alerts = [
        _serialize_row(a, ["id", "incident_id", "source", "title", "severity", "triggered_at"])
        for a in alert_result.scalars().all()
    ]

    elapsed_ms = round((time.monotonic() - start_time) * 1000, 2)

    total_signals = len(deployments) + len(payment_failures) + len(support_tickets) + len(alerts)
    confidence = round(min(0.5 + total_signals * 0.02, 0.99), 2) if total_signals > 0 else 0.0

    if total_signals == 0:
        recommendation = "No signals detected in the time window."
    elif total_signals <= 3:
        recommendation = "Low signal volume — continue monitoring."
    elif total_signals <= 10:
        recommendation = "Moderate correlation detected — investigate deployment-to-failure linkage."
    else:
        recommendation = "High signal density — immediate cross-team triage recommended."

    # Build active sources list (only sources that returned data)
    active_sources: list[str] = []
    if deployments:
        active_sources.append("deployments")
    if payment_failures:
        active_sources.append("payment_failures")
    if support_tickets:
        active_sources.append("support_tickets")
    if alerts:
        active_sources.append("alerts")

    return {
        "query_engine": "coral_v1",
        "window_hours": window_hours,
        "executed_at": datetime.now(tz=timezone.utc).isoformat(),
        "query_duration_ms": elapsed_ms,
        "sources_queried": len(CORAL_SOURCES),
        "sources_with_data": active_sources,
        "results": {
            "deployments": deployments,
            "payment_failures": payment_failures,
            "support_tickets": support_tickets,
            "alerts": alerts,
        },
        "signal_counts": {
            "deployments": len(deployments),
            "payment_failures": len(payment_failures),
            "support_tickets": len(support_tickets),
            "alerts": len(alerts),
            "total": total_signals,
        },
        "correlation_summary": {
            "total_signals": total_signals,
            "confidence": confidence,
            "recommendation": recommendation,
        },
    }
