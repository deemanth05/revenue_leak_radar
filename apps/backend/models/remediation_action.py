"""
RemediationAction model — recommended or executed remediation steps for an incident.
"""
from __future__ import annotations

import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import TimestampedModel

if TYPE_CHECKING:
    from models.incident import Incident


class ActionType(str, enum.Enum):
    rollback = "rollback"
    scale_up = "scale_up"
    notify_slack = "notify_slack"
    create_jira = "create_jira"
    hotfix = "hotfix"
    manual = "manual"


class ActionStatus(str, enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"
    failed = "failed"
    skipped = "skipped"


class RemediationAction(TimestampedModel):
    __tablename__ = "remediation_actions"

    incident_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("incidents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    action_type: Mapped[ActionType] = mapped_column(String(30), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    status: Mapped[ActionStatus] = mapped_column(
        String(20), nullable=False, default=ActionStatus.pending
    )
    assigned_to: Mapped[str | None] = mapped_column(String(255), nullable=True)
    priority_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # ── Relationships ──────────────────────────────────────────────────────
    incident: Mapped["Incident"] = relationship(
        "Incident", back_populates="remediation_actions"
    )
