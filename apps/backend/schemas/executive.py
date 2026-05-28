"""
Executive summary Pydantic v2 schemas.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field


class ExecutiveSummaryRequest(BaseModel):
    incident_ids: list[uuid.UUID] = Field(..., min_length=1)


class ExecutiveSummaryResponse(BaseModel):
    generated_at: datetime
    provider: str
    summary_text: str
    key_risks: list[str]
    recommended_actions: list[str]
    operational_status: Literal["healthy", "degraded", "critical", "down"]
    total_revenue_at_risk_daily: Decimal
    total_incidents_active: int = 1
