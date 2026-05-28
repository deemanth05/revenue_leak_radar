"""
OperationalEvent Pydantic v2 schemas.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from models.operational_event import OperationalEventType


class OperationalEventCreate(BaseModel):
    event_type: OperationalEventType
    timestamp: datetime
    severity: str = Field(..., description="critical, high, medium, low, info")
    service: str
    correlation_metadata: dict[str, Any] = Field(default_factory=dict)
    source_system: str
    affected_customers: list[str] = Field(default_factory=list)  # List of customer UUID strings
    business_context: dict[str, Any] = Field(default_factory=dict)


class OperationalEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    event_type: str
    timestamp: datetime
    severity: str
    service: str
    correlation_metadata: dict[str, Any]
    source_system: str
    affected_customers: list[str]
    business_context: dict[str, Any]
    created_at: datetime
    updated_at: datetime
