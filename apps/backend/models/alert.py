"""
Alert model — inbound signals from Sentry, Datadog, Grafana, etc.
"""
from __future__ import annotations

import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import TimestampedModel

if TYPE_CHECKING:
    from models.incident import Incident


class AlertSource(str, enum.Enum):
    sentry = "sentry"
    datadog = "datadog"
    grafana = "grafana"
    custom = "custom"


class AlertSeverity(str, enum.Enum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"
    info = "info"


class Alert(TimestampedModel):
    __tablename__ = "alerts"

    incident_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("incidents.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    source: Mapped[AlertSource] = mapped_column(String(20), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False, default="")
    severity: Mapped[AlertSeverity] = mapped_column(String(20), nullable=False)
    alert_metadata: Mapped[dict[str, Any]] = mapped_column(
        "metadata", JSONB, nullable=False, default=dict
    )
    triggered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    acknowledged_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # ── Relationships ──────────────────────────────────────────────────────
    incident: Mapped["Incident | None"] = relationship(
        "Incident", back_populates="alerts"
    )
