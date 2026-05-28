"""
Support tickets router.
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
from models.support_ticket import SupportTicket, TicketPriority, TicketSource, TicketStatus

router = APIRouter(prefix="/support-tickets", tags=["support-tickets"])


# ── Inline schemas ─────────────────────────────────────────────────────────────

class SupportTicketCreate(BaseModel):
    incident_id: uuid.UUID | None = None
    customer_id: uuid.UUID
    subject: str = Field(..., min_length=1, max_length=500)
    priority: TicketPriority = TicketPriority.normal
    status: TicketStatus = TicketStatus.open
    source: TicketSource = TicketSource.zendesk


class SupportTicketStatusUpdate(BaseModel):
    status: TicketStatus


class SupportTicketResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    incident_id: uuid.UUID | None = None
    customer_id: uuid.UUID
    subject: str
    priority: TicketPriority
    status: TicketStatus
    source: TicketSource
    resolved_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


# ── Routes ─────────────────────────────────────────────────────────────────────

async def _get_ticket_or_404(ticket_id: uuid.UUID, db: AsyncSession) -> SupportTicket:
    result = await db.execute(select(SupportTicket).where(SupportTicket.id == ticket_id))
    ticket = result.scalar_one_or_none()
    if ticket is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Support ticket not found")
    return ticket


@router.get("/", response_model=list[SupportTicketResponse], summary="List support tickets")
async def list_tickets(
    incident_id: Annotated[uuid.UUID | None, Query()] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=200)] = 50,
    db: AsyncSession = Depends(get_db),
) -> list[SupportTicketResponse]:
    query = select(SupportTicket).order_by(SupportTicket.created_at.desc())
    if incident_id is not None:
        query = query.where(SupportTicket.incident_id == incident_id)
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    return [SupportTicketResponse.model_validate(t) for t in result.scalars().all()]


@router.post(
    "/",
    response_model=SupportTicketResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create support ticket",
)
async def create_ticket(
    payload: SupportTicketCreate,
    db: AsyncSession = Depends(get_db),
) -> SupportTicketResponse:
    ticket = SupportTicket(**payload.model_dump())
    db.add(ticket)
    await db.flush()
    await db.refresh(ticket)
    return SupportTicketResponse.model_validate(ticket)


@router.patch("/{ticket_id}/status", response_model=SupportTicketResponse, summary="Update ticket status")
async def update_ticket_status(
    ticket_id: uuid.UUID,
    payload: SupportTicketStatusUpdate,
    db: AsyncSession = Depends(get_db),
) -> SupportTicketResponse:
    ticket = await _get_ticket_or_404(ticket_id, db)
    ticket.status = payload.status
    if payload.status in (TicketStatus.resolved, TicketStatus.closed):
        ticket.resolved_at = ticket.resolved_at or datetime.now(tz=timezone.utc)
    await db.flush()
    await db.refresh(ticket)
    return SupportTicketResponse.model_validate(ticket)
