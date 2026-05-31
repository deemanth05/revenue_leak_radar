"""
Incidents router.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from core.database import get_db
from models.customer import Customer
from models.deployment import Deployment
from models.incident import Incident, IncidentSeverity, IncidentStatus
from models.payment_failure import PaymentFailure
from models.support_ticket import SupportTicket
from schemas.incident import (
    IncidentCreate,
    IncidentListResponse,
    IncidentResponse,
    IncidentSummary,
    IncidentUpdate,
    TimelineEvent,
)
from schemas.revenue import DashboardKpis, TrendPoint
from services.correlation_engine import (
    CorrelationResult,
    correlate_deployment_to_incident,
    correlate_incident_signals,
    correlate_and_update_incident,
)
from services.incident_memory import find_similar_incidents


router = APIRouter(prefix="/incidents", tags=["incidents"])


# ── Helper ─────────────────────────────────────────────────────────────────────

async def _get_incident_or_404(incident_id: uuid.UUID, db: AsyncSession) -> Incident:
    result = await db.execute(
        select(Incident)
        .where(Incident.id == incident_id)
        .options(
            selectinload(Incident.deployment),
            selectinload(Incident.alerts),
            selectinload(Incident.payment_failures),
            selectinload(Incident.support_tickets),
            selectinload(Incident.revenue_event),
            selectinload(Incident.remediation_actions),
        )
    )
    incident = result.scalar_one_or_none()
    if incident is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")
    return incident


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.get("/dashboard/kpis", response_model=DashboardKpis, summary="Dashboard KPIs")
async def get_dashboard_kpis(db: AsyncSession = Depends(get_db)) -> DashboardKpis:
    """Return aggregated KPIs for the executive dashboard."""

    # Total revenue at risk (active/investigating incidents only)
    active_statuses = [IncidentStatus.active, IncidentStatus.investigating, IncidentStatus.mitigating]

    rev_result = await db.execute(
        select(func.coalesce(func.sum(Incident.estimated_revenue_impact_daily), 0))
        .where(Incident.status.in_(active_statuses))
    )
    total_rev_risk = Decimal(str(rev_result.scalar_one() or 0))

    # Active incident count
    count_result = await db.execute(
        select(func.count(Incident.id)).where(Incident.status.in_(active_statuses))
    )
    active_count = count_result.scalar_one() or 0

    # Affected customers (deduplicated via payment failures + support tickets)
    pf_customers = await db.execute(
        select(func.count(func.distinct(PaymentFailure.customer_id)))
        .join(Incident, Incident.id == PaymentFailure.incident_id)
        .where(Incident.status.in_(active_statuses))
    )
    st_customers = await db.execute(
        select(func.count(func.distinct(SupportTicket.customer_id)))
        .join(Incident, Incident.id == SupportTicket.incident_id)
        .where(Incident.status.in_(active_statuses))
    )
    affected_customers = max(
        pf_customers.scalar_one() or 0,
        st_customers.scalar_one() or 0,
    )

    # Average resolution time (resolved incidents only)
    res_result = await db.execute(
        select(
            func.avg(
                func.extract("epoch", Incident.resolved_at - Incident.started_at) / 3600
            )
        ).where(
            Incident.status == IncidentStatus.resolved,
            Incident.resolved_at.is_not(None),
        )
    )
    avg_resolution = float(res_result.scalar_one() or 0.0)

    # Incidents by severity
    sev_result = await db.execute(
        select(Incident.severity, func.count(Incident.id))
        .where(Incident.status.in_(active_statuses))
        .group_by(Incident.severity)
    )
    incidents_by_severity: dict[str, int] = {
        row[0]: row[1] for row in sev_result.fetchall()
    }

    # Revenue trend (last 24h hourly) in-memory optimization
    now = datetime.now(tz=timezone.utc)
    revenue_trend: list[TrendPoint] = []
    incident_trend: list[TrendPoint] = []
    twenty_four_hours_ago = now - timedelta(hours=24)

    # Fetch all incidents from the last 24 hours in a single query
    trend_result = await db.execute(
        select(Incident.started_at, Incident.estimated_revenue_impact_daily)
        .where(Incident.started_at >= twenty_four_hours_ago)
    )
    incidents_24h = list(trend_result.all())

    for hours_ago in range(23, -1, -1):
        bucket_start = now - timedelta(hours=hours_ago + 1)
        bucket_end = now - timedelta(hours=hours_ago)

        # Filter in memory
        bucket_incidents = [
            inc for inc in incidents_24h
            if inc.started_at >= bucket_start and inc.started_at < bucket_end
        ]

        rev_val = sum(inc.estimated_revenue_impact_daily or 0 for inc in bucket_incidents)
        inc_val = len(bucket_incidents)

        revenue_trend.append(
            TrendPoint(timestamp=bucket_end, value=float(rev_val))
        )
        incident_trend.append(
            TrendPoint(timestamp=bucket_end, value=float(inc_val))
        )

    return DashboardKpis(
        total_revenue_at_risk_daily=total_rev_risk,
        active_incidents=active_count,
        affected_customers=affected_customers,
        avg_resolution_time_hours=round(avg_resolution, 2),
        incidents_by_severity=incidents_by_severity,
        revenue_trend_24h=revenue_trend,
        incident_trend_24h=incident_trend,
    )


@router.get("/", response_model=IncidentListResponse, summary="List incidents")
async def list_incidents(
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
    status_filter: Annotated[IncidentStatus | None, Query(alias="status")] = None,
    severity_filter: Annotated[IncidentSeverity | None, Query(alias="severity")] = None,
    db: AsyncSession = Depends(get_db),
) -> IncidentListResponse:
    """List incidents ordered by revenue impact descending."""

    query = select(Incident)
    if status_filter:
        query = query.where(Incident.status == status_filter)
    if severity_filter:
        query = query.where(Incident.severity == severity_filter)

    count_q = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_q)
    total = total_result.scalar_one() or 0

    query = (
        query.order_by(Incident.estimated_revenue_impact_daily.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    result = await db.execute(query)
    incidents = result.scalars().all()

    return IncidentListResponse(
        items=[IncidentSummary.model_validate(i) for i in incidents],
        total=total,
        page=page,
        page_size=page_size,
        has_next=(page * page_size) < total,
        has_prev=page > 1,
    )


@router.get("/{incident_id}", response_model=IncidentResponse, summary="Get incident")
async def get_incident(
    incident_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> IncidentResponse:
    incident = await _get_incident_or_404(incident_id, db)
    return IncidentResponse.model_validate(incident)


@router.get("/{incident_id}/similar", summary="Get similar resolved incidents")
async def get_similar_incidents(
    incident_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    """Retrieve similar resolved or closed incidents."""
    return await find_similar_incidents(db, incident_id)


@router.post("/", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED, summary="Create incident")
async def create_incident(
    payload: IncidentCreate,
    db: AsyncSession = Depends(get_db),
) -> IncidentResponse:
    incident = Incident(**payload.model_dump())
    db.add(incident)
    await db.flush()
    await db.refresh(incident)
    return IncidentResponse.model_validate(incident)


@router.patch("/{incident_id}", response_model=IncidentResponse, summary="Update incident")
async def update_incident(
    incident_id: uuid.UUID,
    payload: IncidentUpdate,
    db: AsyncSession = Depends(get_db),
) -> IncidentResponse:
    incident = await _get_incident_or_404(incident_id, db)
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(incident, key, value)
    await db.flush()
    await db.refresh(incident)
    return IncidentResponse.model_validate(incident)


@router.post("/{incident_id}/correlate", response_model=IncidentResponse, summary="Correlate incident")
async def correlate_incident(
    incident_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> IncidentResponse:
    """
    Run the deterministic correlation engine for this incident.
    Updates all related parameters: customer count, revenue impact, priority score, and remediation actions.
    """
    incident = await correlate_and_update_incident(db, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return IncidentResponse.model_validate(incident)


@router.get("/{incident_id}/timeline", response_model=list[TimelineEvent], summary="Get incident timeline")
async def get_incident_timeline(
    incident_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> list[TimelineEvent]:
    """Return a chronologically sequenced, correlated event list for the incident."""
    incident = await _get_incident_or_404(incident_id, db)
    timeline_events: list[TimelineEvent] = []

    # 1. Culprit Deployment
    if incident.deployment:
        timeline_events.append(
            TimelineEvent(
                timestamp=incident.deployment.deployed_at,
                type="deployment",
                severity="info",
                title=f"Deployment commit {incident.deployment.commit_hash[:7]} in {incident.deployment.repository}",
                message=f"Deployment by {incident.deployment.author} to {incident.deployment.environment} environment. Status: {incident.deployment.status}",
                metadata={
                    "commit_hash": incident.deployment.commit_hash,
                    "branch": incident.deployment.branch,
                    "repository": incident.deployment.repository,
                    "status": incident.deployment.status,
                }
            )
        )

    # 2. Alerts
    for alert in incident.alerts:
        timeline_events.append(
            TimelineEvent(
                timestamp=alert.triggered_at,
                type="alert",
                severity=alert.severity.value if hasattr(alert.severity, "value") else alert.severity,
                title=alert.title,
                message=alert.message,
                metadata={
                    "source": alert.source,
                    "acknowledged_at": alert.acknowledged_at.isoformat() if alert.acknowledged_at else None,
                }
            )
        )

    # 3. Payment Failures
    for pf in incident.payment_failures:
        timeline_events.append(
            TimelineEvent(
                timestamp=pf.failed_at,
                type="payment_failure",
                severity="high",
                title=f"Payment Failed - ${pf.amount:.2f}",
                message=f"Transaction failure (stripe intent: {pf.stripe_payment_intent_id[:10]}...) Reason: {pf.failure_reason}",
                metadata={
                    "amount": str(pf.amount),
                    "stripe_payment_intent_id": pf.stripe_payment_intent_id,
                    "customer_id": str(pf.customer_id),
                }
            )
        )

    # 4. Support Tickets
    for st in incident.support_tickets:
        timeline_events.append(
            TimelineEvent(
                timestamp=st.created_at,
                type="support_ticket",
                severity="medium",
                title=f"Customer Ticket: {st.subject}",
                message=f"Source: {st.source}. Priority: {st.priority}. Status: {st.status}",
                metadata={
                    "ticket_id": str(st.id),
                    "customer_id": str(st.customer_id),
                    "status": st.status,
                }
            )
        )

    # 5. Remediation Actions
    for act in incident.remediation_actions:
        # Suggested Event
        timeline_events.append(
            TimelineEvent(
                timestamp=act.created_at,
                type="remediation",
                severity="info",
                title=f"Workflow Triggered: {act.title}",
                message=f"Remediation action recommended: {act.description}",
                metadata={
                    "action_type": act.action_type,
                    "status": act.status,
                }
            )
        )
        # Completed Event (if any)
        if act.completed_at:
            timeline_events.append(
                TimelineEvent(
                    timestamp=act.completed_at,
                    type="remediation",
                    severity="info",
                    title=f"Action Completed: {act.title}",
                    message=f"Remediation step successfully completed. Assigned to: {act.assigned_to or 'System Controller'}",
                    metadata={
                        "action_type": act.action_type,
                        "status": act.status,
                    }
                )
            )

    # Sort chronologically
    timeline_events.sort(key=lambda x: x.timestamp)
    return timeline_events


class CommentCreate(BaseModel):
    author: str
    content: str


@router.get("/{incident_id}/comments", summary="Get incident triage comments")
async def get_incident_comments(
    incident_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    """Retrieve SRE collaborative triage comments."""
    from models.comment import IncidentComment

    result = await db.execute(
        select(IncidentComment)
        .where(IncidentComment.incident_id == incident_id)
        .order_by(IncidentComment.created_at)
    )
    return [
        {
            "id": str(c.id),
            "author": c.author,
            "content": c.content,
            "timestamp": c.created_at.isoformat(),
        }
        for c in result.scalars().all()
    ]


@router.post("/{incident_id}/comments", summary="Add incident triage comment")
async def add_incident_comment(
    incident_id: uuid.UUID,
    payload: CommentCreate,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Post collaborative triage comment to active bridge."""
    from models.comment import IncidentComment

    comment = IncidentComment(
        incident_id=incident_id,
        author=payload.author,
        content=payload.content,
    )
    db.add(comment)
    await db.flush()
    await db.refresh(comment)
    return {
        "id": str(comment.id),
        "author": comment.author,
        "content": comment.content,
        "timestamp": comment.created_at.isoformat(),
    }

@router.get("/{incident_id}/postmortem", summary="Generate SRE Markdown Postmortem")
async def get_incident_postmortem(
    incident_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
) -> dict[str, str]:
    """Generate structured Post-Mortem SRE report for SRE reviews."""
    incident = await _get_incident_or_404(incident_id, db)
    timeline = await get_incident_timeline(incident_id, db)
    
    # Render postmortem markdown
    md = f"""# SRE Incident Post-Mortem: {incident.title}

## Executive Summary
- **Incident ID**: {incident.id}
- **Status**: {incident.status.upper()}
- **Severity**: {incident.severity.upper()}
- **Exposure Duration**: {incident.started_at.isoformat()} to {incident.resolved_at.isoformat() if incident.resolved_at else "Active"}

## Business & Financial Impact
- **Peak Revenue Risk**: ${incident.estimated_revenue_impact_daily}/day MRR
- **Affected Customers**: {incident.affected_customer_count} B2B SaaS accounts
- **Correlation Confidence**: {incident.correlation_confidence * 100:.0f}%

## Timeline of Events
"""
    for event in timeline:
        md += f"- **{event.timestamp.strftime('%H:%M:%S')}** [{event.type.upper()}] {event.title} — {event.message}\n"
        
    md += "\n## Remediation Actions Taken\n"
    for action in incident.remediation_actions:
        md += f"- [{ 'x' if action.status == 'completed' else ' ' }] **{action.title}** ({action.action_type}): {action.description}\n"
        
    return {"postmortem_md": md}


