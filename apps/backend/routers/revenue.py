"""
Revenue router.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from core.database import get_db
from models.customer import Customer
from models.incident import Incident, IncidentStatus
from models.revenue_event import RevenueEvent
from schemas.revenue import DashboardKpis, RevenueEventResponse, TrendPoint
from services.revenue_scorer import RevenueImpactResult, calculate_revenue_impact

router = APIRouter(prefix="/revenue", tags=["revenue"])


@router.get("/events", response_model=list[RevenueEventResponse], summary="List revenue events")
async def list_revenue_events(
    db: AsyncSession = Depends(get_db),
) -> list[RevenueEventResponse]:
    result = await db.execute(
        select(RevenueEvent).order_by(RevenueEvent.calculated_at.desc()).limit(50)
    )
    return [RevenueEventResponse.model_validate(e) for e in result.scalars().all()]


@router.get("/at-risk", summary="Total revenue at risk")
async def total_at_risk(db: AsyncSession = Depends(get_db)) -> dict[str, object]:
    """Return a simple summary of total daily revenue at risk."""
    active_statuses = [IncidentStatus.active, IncidentStatus.investigating, IncidentStatus.mitigating]
    result = await db.execute(
        select(
            func.coalesce(func.sum(Incident.estimated_revenue_impact_daily), 0).label("daily"),
            func.count(Incident.id).label("incident_count"),
        ).where(Incident.status.in_(active_statuses))
    )
    row = result.one()
    daily = Decimal(str(row.daily or 0))
    return {
        "total_revenue_at_risk_daily": daily,
        "total_revenue_at_risk_weekly": daily * 7,
        "active_incident_count": row.incident_count,
        "calculated_at": datetime.now(tz=timezone.utc).isoformat(),
    }


@router.get("/trend", response_model=list[TrendPoint], summary="24h revenue risk trend")
async def revenue_trend(db: AsyncSession = Depends(get_db)) -> list[TrendPoint]:
    """Return hourly revenue risk data points over the past 24 hours."""
    now = datetime.now(tz=timezone.utc)
    trend: list[TrendPoint] = []

    for hours_ago in range(23, -1, -1):
        bucket_start = now - timedelta(hours=hours_ago + 1)
        bucket_end = now - timedelta(hours=hours_ago)

        result = await db.execute(
            select(func.coalesce(func.sum(Incident.estimated_revenue_impact_daily), 0))
            .where(
                Incident.started_at >= bucket_start,
                Incident.started_at < bucket_end,
            )
        )
        trend.append(TrendPoint(timestamp=bucket_end, value=float(result.scalar_one() or 0)))

    return trend


@router.post("/calculate/{incident_id}", response_model=RevenueEventResponse, summary="Calculate revenue impact")
async def calculate_revenue_event(
    incident_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> RevenueEventResponse:
    """Run the deterministic revenue scorer and persist/update the RevenueEvent."""

    result = await db.execute(
        select(Incident)
        .where(Incident.id == incident_id)
        .options(
            selectinload(Incident.payment_failures),
            selectinload(Incident.support_tickets),
        )
    )
    incident = result.scalar_one_or_none()
    if incident is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")

    # Gather unique affected customers
    customer_ids: set[uuid.UUID] = {pf.customer_id for pf in incident.payment_failures}
    customer_ids.update(st.customer_id for st in incident.support_tickets)

    customers: list[Customer] = []
    if customer_ids:
        cust_result = await db.execute(
            select(Customer)
            .where(Customer.id.in_(list(customer_ids)))
            .options(
                selectinload(Customer.payment_failures),
                selectinload(Customer.support_tickets),
            )
        )
        customers = list(cust_result.scalars().all())

    impact: RevenueImpactResult = calculate_revenue_impact(
        incident=incident,
        payment_failures=list(incident.payment_failures),
        customers=customers,
    )

    # Upsert revenue event
    existing_result = await db.execute(
        select(RevenueEvent).where(RevenueEvent.incident_id == incident_id)
    )
    rev_event = existing_result.scalar_one_or_none()

    now = datetime.now(tz=timezone.utc)
    if rev_event is None:
        rev_event = RevenueEvent(
            incident_id=incident_id,
            calculated_at=now,
        )
        db.add(rev_event)

    rev_event.revenue_at_risk_daily = impact.revenue_at_risk_daily
    rev_event.revenue_at_risk_weekly = impact.revenue_at_risk_weekly
    rev_event.churn_probability = impact.churn_probability
    rev_event.affected_mrr = impact.affected_mrr
    rev_event.calculation_method = impact.calculation_method
    rev_event.breakdown = impact.breakdown
    rev_event.calculated_at = now

    # Also update incident's estimated impact
    incident.estimated_revenue_impact_daily = impact.revenue_at_risk_daily

    await db.flush()
    await db.refresh(rev_event)
    return RevenueEventResponse.model_validate(rev_event)
