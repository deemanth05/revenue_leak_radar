"""
Global Timeline router.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from models.operational_event import OperationalEvent
from schemas.operational_event import OperationalEventResponse

router = APIRouter(prefix="/timeline", tags=["timeline"])


@router.get("/", response_model=list[OperationalEventResponse], summary="Get global operational events timeline")
async def get_global_timeline(
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> list[OperationalEventResponse]:
    """Retrieve the recent list of raw ingested operational events."""
    stmt = select(OperationalEvent).order_by(OperationalEvent.timestamp.desc()).limit(limit)
    res = await db.execute(stmt)
    events = res.scalars().all()
    return [OperationalEventResponse.model_validate(e) for e in events]
