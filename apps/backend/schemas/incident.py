"""
Incident Pydantic v2 schemas.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from models.incident import IncidentSeverity, IncidentSource, IncidentStatus


# ── Nested lightweight schemas ─────────────────────────────────────────────────

class DeploymentRef(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    commit_hash: str
    branch: str
    author: str
    repository: str
    environment: str
    status: str
    deployed_at: datetime


class AlertRef(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    source: str
    title: str
    severity: str
    triggered_at: datetime
    acknowledged_at: datetime | None = None


class PaymentFailureRef(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    customer_id: uuid.UUID
    amount: Decimal
    currency: str
    failure_reason: str
    failed_at: datetime


class SupportTicketRef(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    customer_id: uuid.UUID
    subject: str
    priority: str
    status: str
    source: str


class RevenueEventRef(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    revenue_at_risk_daily: Decimal
    revenue_at_risk_weekly: Decimal
    churn_probability: float
    affected_mrr: Decimal
    calculation_method: str
    calculated_at: datetime


class RemediationActionRef(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    action_type: str
    title: str
    status: str
    priority_order: int
    assigned_to: str | None = None
    completed_at: datetime | None = None


# ── Create / Update ────────────────────────────────────────────────────────────

class IncidentCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: str = Field(default="")
    severity: IncidentSeverity
    status: IncidentStatus = IncidentStatus.active
    source: IncidentSource = IncidentSource.manual
    deployment_id: uuid.UUID | None = None
    error_rate: float = Field(default=0.0, ge=0.0)
    affected_customer_count: int = Field(default=0, ge=0)
    estimated_revenue_impact_daily: Decimal = Field(default=Decimal("0"), ge=0)
    correlation_confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    started_at: datetime


class IncidentUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=500)
    description: str | None = None
    severity: IncidentSeverity | None = None
    status: IncidentStatus | None = None
    error_rate: float | None = None
    affected_customer_count: int | None = None
    estimated_revenue_impact_daily: Decimal | None = None
    correlation_confidence: float | None = None
    resolved_at: datetime | None = None


# ── Response ───────────────────────────────────────────────────────────────────

class IncidentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    description: str
    severity: IncidentSeverity
    status: IncidentStatus
    source: IncidentSource
    deployment_id: uuid.UUID | None = None
    error_rate: float
    affected_customer_count: int
    estimated_revenue_impact_daily: Decimal
    correlation_confidence: float
    started_at: datetime
    resolved_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    deployment: DeploymentRef | None = None
    alerts: list[AlertRef] = []
    payment_failures: list[PaymentFailureRef] = []
    support_tickets: list[SupportTicketRef] = []
    revenue_event: RevenueEventRef | None = None
    remediation_actions: list[RemediationActionRef] = []


class IncidentSummary(BaseModel):
    """Lightweight incident representation for list views."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    severity: IncidentSeverity
    status: IncidentStatus
    source: IncidentSource
    affected_customer_count: int
    estimated_revenue_impact_daily: Decimal
    correlation_confidence: float
    started_at: datetime
    resolved_at: datetime | None = None
    created_at: datetime


class IncidentListResponse(BaseModel):
    items: list[IncidentSummary]
    total: int
    page: int
    page_size: int
    has_next: bool
    has_prev: bool


class TimelineEvent(BaseModel):
    timestamp: datetime
    type: str  # "deployment", "alert", "payment_failure", "support_ticket", "remediation", "executive_alert"
    severity: str
    title: str
    message: str
    metadata: dict[str, Any] = {}

