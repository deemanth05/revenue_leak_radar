"""
Revenue Pydantic v2 schemas.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, ConfigDict


class RevenueBreakdown(BaseModel):
    """Per-tier revenue breakdown."""
    enterprise_mrr: Decimal = Decimal("0")
    premium_mrr: Decimal = Decimal("0")
    standard_mrr: Decimal = Decimal("0")
    payment_failure_daily: Decimal = Decimal("0")
    churn_risk_daily: Decimal = Decimal("0")
    details: dict[str, Any] = {}


class RevenueEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    incident_id: uuid.UUID
    revenue_at_risk_daily: Decimal
    revenue_at_risk_weekly: Decimal
    churn_probability: float
    affected_mrr: Decimal
    calculation_method: str
    breakdown: dict[str, Any]
    calculated_at: datetime
    created_at: datetime
    updated_at: datetime


class TrendPoint(BaseModel):
    """A single data point on a time-series trend."""
    timestamp: datetime
    value: float


class DashboardKpis(BaseModel):
    """Top-level KPI aggregates for the executive dashboard."""
    total_revenue_at_risk_daily: Decimal
    active_incidents: int
    affected_customers: int
    avg_resolution_time_hours: float
    incidents_by_severity: dict[str, int]
    revenue_trend_24h: list[TrendPoint]
    incident_trend_24h: list[TrendPoint]
