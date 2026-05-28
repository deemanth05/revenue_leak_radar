"""
Alerts router.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, ConfigDict, Field

from core.database import get_db
from models.alert import Alert, AlertSeverity, AlertSource

router = APIRouter(prefix="/alerts", tags=["alerts"])


# ── Schemas (inline to keep alert schema close to the router) ─────────────────

class AlertCreate(BaseModel):
    incident_id: uuid.UUID | None = None
    source: AlertSource
    title: str = Field(..., min_length=1, max_length=500)
    message: str = Field(default="")
    severity: AlertSeverity
    metadata: dict = Field(default_factory=dict)
    triggered_at: datetime


class AlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: uuid.UUID
    incident_id: uuid.UUID | None = None
    source: AlertSource
    title: str
    message: str
    severity: AlertSeverity
    metadata: dict = Field(validation_alias="alert_metadata")
    triggered_at: datetime
    acknowledged_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


# ── Routes ─────────────────────────────────────────────────────────────────────

async def _get_alert_or_404(alert_id: uuid.UUID, db: AsyncSession) -> Alert:
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if alert is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
    return alert


@router.get("/", response_model=list[AlertResponse], summary="List alerts")
async def list_alerts(
    incident_id: Annotated[uuid.UUID | None, Query()] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=200)] = 50,
    db: AsyncSession = Depends(get_db),
) -> list[AlertResponse]:
    query = select(Alert).order_by(Alert.triggered_at.desc())
    if incident_id is not None:
        query = query.where(Alert.incident_id == incident_id)
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    return [AlertResponse.model_validate(a) for a in result.scalars().all()]


@router.post(
    "/",
    response_model=AlertResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ingest alert",
)
async def create_alert(
    payload: AlertCreate,
    db: AsyncSession = Depends(get_db),
) -> AlertResponse:
    data = payload.model_dump()
    if "metadata" in data:
        data["alert_metadata"] = data.pop("metadata")
    alert = Alert(**data)
    db.add(alert)
    await db.flush()
    await db.refresh(alert)
    return AlertResponse.model_validate(alert)


@router.patch("/{alert_id}/acknowledge", response_model=AlertResponse, summary="Acknowledge alert")
async def acknowledge_alert(
    alert_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> AlertResponse:
    alert = await _get_alert_or_404(alert_id, db)
    if alert.acknowledged_at is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Alert already acknowledged",
        )
    alert.acknowledged_at = datetime.now(tz=timezone.utc)
    await db.flush()
    await db.refresh(alert)
    return AlertResponse.model_validate(alert)
