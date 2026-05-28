"""
Coral joint-query router — cross-signal correlation queries.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from models.alert import Alert
from models.deployment import Deployment
from models.payment_failure import PaymentFailure
from models.support_ticket import SupportTicket

router = APIRouter(prefix="/coral", tags=["coral"])


def _serialize_row(row: object, fields: list[str]) -> dict:
    result: dict = {}
    for f in fields:
        val = getattr(row, f, None)
        if isinstance(val, datetime):
            result[f] = val.isoformat()
        else:
            result[f] = str(val) if val is not None else None
    return result


@router.post("/joint-query", summary="Coral cross-signal joint query")
async def joint_query(
    window_hours: int = Query(default=24, ge=1),
    db: AsyncSession = Depends(get_db),
) -> dict:
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

    return {
        "query_engine": "coral_v1",
        "window_hours": window_hours,
        "results": {
            "deployments": deployments,
            "payment_failures": payment_failures,
            "support_tickets": support_tickets,
            "alerts": alerts,
        },
        "correlation_summary": {
            "total_signals": total_signals,
            "confidence": confidence,
            "recommendation": recommendation,
        },
    }
