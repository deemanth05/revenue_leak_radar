"""
Customer model.
"""
from __future__ import annotations

import enum
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import TimestampedModel

if TYPE_CHECKING:
    from models.payment_failure import PaymentFailure
    from models.support_ticket import SupportTicket


class CustomerTier(str, enum.Enum):
    enterprise = "enterprise"
    premium = "premium"
    standard = "standard"
    trial = "trial"


class Customer(TimestampedModel):
    __tablename__ = "customers"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    tier: Mapped[CustomerTier] = mapped_column(
        String(20),
        nullable=False,
        default=CustomerTier.standard,
    )
    mrr: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=Decimal("0"))
    contract_value_annual: Mapped[Decimal | None] = mapped_column(
        Numeric(14, 2), nullable=True
    )
    is_sla_customer: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    sla_tier: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # ── Relationships ──────────────────────────────────────────────────────
    payment_failures: Mapped[list["PaymentFailure"]] = relationship(
        "PaymentFailure", back_populates="customer", lazy="selectin"
    )
    support_tickets: Mapped[list["SupportTicket"]] = relationship(
        "SupportTicket", back_populates="customer", lazy="selectin"
    )
