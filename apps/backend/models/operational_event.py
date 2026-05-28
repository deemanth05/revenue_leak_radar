"""
OperationalEvent model — raw event ingestion log.
"""
from __future__ import annotations

import enum
import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from models.base import TimestampedModel


class OperationalEventType(str, enum.Enum):
    deployment = "deployment"
    payment_failure = "payment_failure"
    support_ticket = "support_ticket"
    infrastructure_alert = "infrastructure_alert"
    error_spike = "error_spike"
    sla_violation = "sla_violation"
    customer_complaint = "customer_complaint"
    remediation_action = "remediation_action"


class OperationalEvent(TimestampedModel):
    __tablename__ = "operational_events"

    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), nullable=False)  # critical, high, medium, low, info
    service: Mapped[str] = mapped_column(String(100), nullable=False)
    correlation_metadata: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
    source_system: Mapped[str] = mapped_column(String(100), nullable=False)
    affected_customers: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list)  # List of customer UUID strings
    business_context: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
