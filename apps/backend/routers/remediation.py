"""
Remediation actions router.
"""
from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, ConfigDict

from core.database import get_db
from models.incident import Incident, IncidentSeverity
from models.remediation_action import ActionStatus, ActionType, RemediationAction
from services.ai_provider import get_ai_client

router = APIRouter(prefix="/remediation", tags=["remediation"])


# ── Inline schemas ─────────────────────────────────────────────────────────────

class RemediationActionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    incident_id: uuid.UUID
    action_type: ActionType
    title: str
    description: str
    status: ActionStatus
    assigned_to: str | None = None
    priority_order: int
    completed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class ActionStatusUpdate(BaseModel):
    status: ActionStatus


# ── Deterministic action templates ────────────────────────────────────────────

_ROLLBACK_ACTION = {
    "action_type": ActionType.rollback,
    "title": "Roll back to previous stable deployment",
    "description": (
        "Identify the last known-good commit and trigger an immediate rollback. "
        "Estimated recovery time: 5–10 minutes."
    ),
    "priority_order": 1,
}

_SLACK_ACTION = {
    "action_type": ActionType.notify_slack,
    "title": "Notify #incidents Slack channel",
    "description": "Post P0 incident card to #incidents with impact summary and ETA.",
    "priority_order": 2,
}

_JIRA_ACTION = {
    "action_type": ActionType.create_jira,
    "title": "Create post-mortem Jira ticket",
    "description": "Track RCA, timeline, and follow-up action items.",
    "priority_order": 3,
}

_SCALE_ACTION = {
    "action_type": ActionType.scale_up,
    "title": "Scale up payment service replicas",
    "description": "Increase replica count from 3 to 8 to reduce per-pod load.",
    "priority_order": 2,
}


def _build_deterministic_actions(incident: Incident) -> list[dict]:
    """Return baseline action plan based on severity and source."""
    actions = [_SLACK_ACTION, _JIRA_ACTION]

    if incident.severity in (IncidentSeverity.critical, IncidentSeverity.high):
        actions.insert(0, _ROLLBACK_ACTION)
    else:
        actions.insert(1, _SCALE_ACTION)

    # Re-sort by priority_order
    actions.sort(key=lambda a: a["priority_order"])
    return actions


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.get("/{incident_id}", response_model=list[RemediationActionResponse], summary="List remediation actions")
async def list_remediation_actions(
    incident_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> list[RemediationActionResponse]:
    result = await db.execute(
        select(RemediationAction)
        .where(RemediationAction.incident_id == incident_id)
        .order_by(RemediationAction.priority_order)
    )
    return [RemediationActionResponse.model_validate(a) for a in result.scalars().all()]


@router.post("/{incident_id}/generate", response_model=list[RemediationActionResponse], summary="Generate remediation plan")
async def generate_remediation_plan(
    incident_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> list[RemediationActionResponse]:
    """
    Auto-generate a remediation plan.
    Deterministic base actions are created first; AI enriches descriptions.
    """
    result = await db.execute(select(Incident).where(Incident.id == incident_id))
    incident = result.scalar_one_or_none()
    if incident is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")

    # Remove existing auto-generated actions before regenerating
    existing = await db.execute(
        select(RemediationAction).where(RemediationAction.incident_id == incident_id)
    )
    for action in existing.scalars().all():
        await db.delete(action)

    base_actions = _build_deterministic_actions(incident)

    # Optionally enrich with AI
    ai_client = get_ai_client()
    prompt = (
        f"Given a {incident.severity} incident titled '{incident.title}' "
        f"with {incident.affected_customer_count} affected customers and "
        f"${incident.estimated_revenue_impact_daily}/day revenue impact, "
        f"refine the descriptions of these remediation actions and return JSON:\n"
        f"{json.dumps(base_actions, indent=2, default=str)}\n\n"
        "Return an 'actions' array with the same structure but improved descriptions."
    )

    try:
        raw = await ai_client.generate(prompt=prompt, system="You are an SRE expert. Return only valid JSON.")
        parsed = json.loads(raw)
        enriched = parsed.get("actions", base_actions)
    except Exception:
        enriched = base_actions

    created: list[RemediationAction] = []
    for action_data in enriched:
        # Handle both dict and Enum for action_type
        action_type_raw = action_data.get("action_type", ActionType.manual)
        if isinstance(action_type_raw, str):
            try:
                action_type = ActionType(action_type_raw)
            except ValueError:
                action_type = ActionType.manual
        else:
            action_type = action_type_raw

        action = RemediationAction(
            incident_id=incident_id,
            action_type=action_type,
            title=action_data.get("title", "Action"),
            description=action_data.get("description", ""),
            status=ActionStatus.pending,
            priority_order=action_data.get("priority_order", 99),
        )
        db.add(action)
        created.append(action)

    await db.flush()
    for action in created:
        await db.refresh(action)

    return [RemediationActionResponse.model_validate(a) for a in created]


@router.patch("/actions/{action_id}/status", response_model=RemediationActionResponse, summary="Update action status")
async def update_action_status(
    action_id: uuid.UUID,
    payload: ActionStatusUpdate,
    db: AsyncSession = Depends(get_db),
) -> RemediationActionResponse:
    result = await db.execute(
        select(RemediationAction).where(RemediationAction.id == action_id)
    )
    action = result.scalar_one_or_none()
    if action is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Remediation action not found")

    action.status = payload.status
    if payload.status == ActionStatus.completed:
        action.completed_at = action.completed_at or datetime.now(tz=timezone.utc)

    await db.flush()
    await db.refresh(action)
    return RemediationActionResponse.model_validate(action)
