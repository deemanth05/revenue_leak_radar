"""
PaymentFailure model — individual failed payment events.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import TimestampedModel

if TYPE_CHECKING:
    from models.customer import Customer
    from models.incident import Incident


class PaymentFailure(TimestampedModel):
    __tablename__ = "payment_failures"

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
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="USD")
    failure_reason: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    stripe_payment_intent_id: Mapped[str] = mapped_column(
        String(255), nullable=False, default="", index=True
    )
    failed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    # ── Relationships ──────────────────────────────────────────────────────
    incident: Mapped["Incident | None"] = relationship(
        "Incident", back_populates="payment_failures"
    )
    customer: Mapped["Customer"] = relationship(
        "Customer", back_populates="payment_failures"
    )
