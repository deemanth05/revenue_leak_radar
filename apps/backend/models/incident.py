"""
Incident model — the central entity of Revenue Leak Radar.
"""
from __future__ import annotations

import enum
import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Float, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import TimestampedModel

if TYPE_CHECKING:
    from models.alert import Alert
    from models.deployment import Deployment
    from models.payment_failure import PaymentFailure
    from models.remediation_action import RemediationAction
    from models.revenue_event import RevenueEvent
    from models.support_ticket import SupportTicket


class IncidentSeverity(str, enum.Enum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"


class IncidentStatus(str, enum.Enum):
    active = "active"
    investigating = "investigating"
    mitigating = "mitigating"
    resolved = "resolved"
    closed = "closed"


class IncidentSource(str, enum.Enum):
    sentry = "sentry"
    datadog = "datadog"
    manual = "manual"
    correlation_engine = "correlation_engine"


class Incident(TimestampedModel):
    __tablename__ = "incidents"

    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    severity: Mapped[IncidentSeverity] = mapped_column(
        String(20), nullable=False, index=True
    )
    status: Mapped[IncidentStatus] = mapped_column(
        String(20), nullable=False, default=IncidentStatus.active, index=True
    )
    source: Mapped[IncidentSource] = mapped_column(
        String(30), nullable=False, default=IncidentSource.manual
    )
    deployment_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("deployments.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    error_rate: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    affected_customer_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    estimated_revenue_impact_daily: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=Decimal("0"), index=True
    )
    correlation_confidence: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    resolved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # ── Relationships ──────────────────────────────────────────────────────
    deployment: Mapped["Deployment | None"] = relationship(
        "Deployment", back_populates="incidents", lazy="selectin"
    )
    alerts: Mapped[list["Alert"]] = relationship(
        "Alert", back_populates="incident", lazy="selectin"
    )
    payment_failures: Mapped[list["PaymentFailure"]] = relationship(
        "PaymentFailure", back_populates="incident", lazy="selectin"
    )
    support_tickets: Mapped[list["SupportTicket"]] = relationship(
        "SupportTicket", back_populates="incident", lazy="selectin"
    )
    revenue_event: Mapped["RevenueEvent | None"] = relationship(
        "RevenueEvent", back_populates="incident", uselist=False, lazy="selectin"
    )
    remediation_actions: Mapped[list["RemediationAction"]] = relationship(
        "RemediationAction",
        back_populates="incident",
        order_by="RemediationAction.priority_order",
        lazy="selectin",
    )
