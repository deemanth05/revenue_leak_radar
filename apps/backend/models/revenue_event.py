"""
RevenueEvent model — calculated revenue impact snapshot for an incident.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Any

from sqlalchemy import DateTime, Float, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import TimestampedModel

if TYPE_CHECKING:
    from models.incident import Incident


class RevenueEvent(TimestampedModel):
    __tablename__ = "revenue_events"

    incident_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("incidents.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    revenue_at_risk_daily: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=Decimal("0")
    )
    revenue_at_risk_weekly: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=Decimal("0")
    )
    churn_probability: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    affected_mrr: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=Decimal("0")
    )
    calculation_method: Mapped[str] = mapped_column(String(100), nullable=False)
    breakdown: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
    calculated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    # ── Relationships ──────────────────────────────────────────────────────
    incident: Mapped["Incident"] = relationship(
        "Incident", back_populates="revenue_event"
    )
