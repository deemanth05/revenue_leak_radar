"""
SupportTicket model — customer support tickets linked to incidents.
"""
from __future__ import annotations

import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import TimestampedModel

if TYPE_CHECKING:
    from models.customer import Customer
    from models.incident import Incident


class TicketPriority(str, enum.Enum):
    low = "low"
    normal = "normal"
    high = "high"
    urgent = "urgent"


class TicketStatus(str, enum.Enum):
    open = "open"
    pending = "pending"
    resolved = "resolved"
    closed = "closed"


class TicketSource(str, enum.Enum):
    zendesk = "zendesk"
    intercom = "intercom"
    email = "email"
    manual = "manual"


class SupportTicket(TimestampedModel):
    __tablename__ = "support_tickets"

    incident_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("incidents.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("customers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    subject: Mapped[str] = mapped_column(String(500), nullable=False)
    priority: Mapped[TicketPriority] = mapped_column(
        String(20), nullable=False, default=TicketPriority.normal
    )
    status: Mapped[TicketStatus] = mapped_column(
        String(20), nullable=False, default=TicketStatus.open
    )
    source: Mapped[TicketSource] = mapped_column(
        String(20), nullable=False, default=TicketSource.zendesk
    )
    resolved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # ── Relationships ──────────────────────────────────────────────────────
    incident: Mapped["Incident | None"] = relationship(
        "Incident", back_populates="support_tickets"
    )
    customer: Mapped["Customer"] = relationship(
        "Customer", back_populates="support_tickets"
    )
