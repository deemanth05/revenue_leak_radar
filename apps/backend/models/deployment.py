"""
Deployment model.
"""
from __future__ import annotations

import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import TimestampedModel

if TYPE_CHECKING:
    from models.incident import Incident


class DeploymentEnvironment(str, enum.Enum):
    staging = "staging"
    production = "production"


class DeploymentStatus(str, enum.Enum):
    in_progress = "in_progress"
    success = "success"
    failed = "failed"
    rolled_back = "rolled_back"


class Deployment(TimestampedModel):
    __tablename__ = "deployments"

    commit_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    branch: Mapped[str] = mapped_column(String(255), nullable=False)
    author: Mapped[str] = mapped_column(String(255), nullable=False)
    repository: Mapped[str] = mapped_column(String(255), nullable=False)
    environment: Mapped[DeploymentEnvironment] = mapped_column(
        String(20), nullable=False, default=DeploymentEnvironment.production
    )
    status: Mapped[DeploymentStatus] = mapped_column(
        String(20), nullable=False, default=DeploymentStatus.in_progress
    )
    deployed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    rollback_of: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("deployments.id", ondelete="SET NULL"),
        nullable=True,
    )

    # ── Relationships ──────────────────────────────────────────────────────
    incidents: Mapped[list["Incident"]] = relationship(
        "Incident", back_populates="deployment", lazy="selectin"
    )
