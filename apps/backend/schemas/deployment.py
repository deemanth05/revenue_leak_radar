"""
Deployment Pydantic v2 schemas.
"""
from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from models.deployment import DeploymentEnvironment, DeploymentStatus


class DeploymentCreate(BaseModel):
    commit_hash: str = Field(..., min_length=1, max_length=64)
    branch: str = Field(..., min_length=1, max_length=255)
    author: str = Field(..., min_length=1, max_length=255)
    repository: str = Field(..., min_length=1, max_length=255)
    environment: DeploymentEnvironment = DeploymentEnvironment.production
    status: DeploymentStatus = DeploymentStatus.in_progress
    deployed_at: datetime
    duration_seconds: int | None = None
    rollback_of: uuid.UUID | None = None


class DeploymentUpdate(BaseModel):
    status: DeploymentStatus | None = None
    duration_seconds: int | None = None


class DeploymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    commit_hash: str
    branch: str
    author: str
    repository: str
    environment: DeploymentEnvironment
    status: DeploymentStatus
    deployed_at: datetime
    duration_seconds: int | None = None
    rollback_of: uuid.UUID | None = None
    created_at: datetime
    updated_at: datetime
