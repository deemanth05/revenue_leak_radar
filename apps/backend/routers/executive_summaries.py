"""
Executive summaries router.
"""
from __future__ import annotations

import json
import os
import uuid
from datetime import datetime, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from core.database import get_db
from models.incident import Incident, IncidentStatus
from schemas.executive import ExecutiveSummaryRequest, ExecutiveSummaryResponse, RoleBriefingRequest
from services.ai_provider import get_ai_client

router = APIRouter(prefix="/executive", tags=["executive"])

# In-memory cache of the most recent summary (for demo purposes)
# In production this would be persisted to the database.
_latest_summary: ExecutiveSummaryResponse | None = None


def _build_incident_context(incidents: list[Incident]) -> str:
    """Serialise incidents to a compact JSON string for the AI prompt."""
    items = []
    for inc in incidents:
        items.append({
            "id": str(inc.id),
            "title": inc.title,
            "severity": inc.severity,
            "status": inc.status,
            "affected_customers": inc.affected_customer_count,
            "revenue_impact_daily": str(inc.estimated_revenue_impact_daily),
            "correlation_confidence": inc.correlation_confidence,
            "started_at": inc.started_at.isoformat(),
            "payment_failures": len(inc.payment_failures),
            "support_tickets": len(inc.support_tickets),
            "alerts": len(inc.alerts),
            "deployment": {
                "commit": inc.deployment.commit_hash,
                "branch": inc.deployment.branch,
                "repository": inc.deployment.repository,
            } if inc.deployment else None,
        })
    return json.dumps(items, indent=2)


_SYSTEM_PROMPT = """You are a senior SRE and revenue intelligence analyst.
You will be given incident data in JSON format.
Return ONLY valid JSON with this exact structure:
{
  "summary_text": "<2-3 paragraph executive summary>",
  "key_risks": ["<risk 1>", "<risk 2>", "<risk 3>"],
  "recommended_actions": ["<action 1>", "<action 2>", "<action 3>"],
  "operational_status": "<healthy|degraded|critical|down>",
  "total_revenue_at_risk_daily": "<decimal string>"
}"""


@router.post(
    "/generate",
    response_model=ExecutiveSummaryResponse,
    summary="Generate executive summary",
)
async def generate_executive_summary(
    payload: ExecutiveSummaryRequest,
    db: AsyncSession = Depends(get_db),
) -> ExecutiveSummaryResponse:
    """Fetch incidents, call the AI provider, and return a structured executive summary."""
    global _latest_summary

    # Fetch incidents
    result = await db.execute(
        select(Incident)
        .where(Incident.id.in_(payload.incident_ids))
        .options(
            selectinload(Incident.deployment),
            selectinload(Incident.payment_failures),
            selectinload(Incident.support_tickets),
            selectinload(Incident.alerts),
            selectinload(Incident.revenue_event),
        )
    )
    incidents = list(result.scalars().all())

    if not incidents:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No incidents found for provided IDs",
        )

    ai_client = get_ai_client()
    context = _build_incident_context(incidents)
    prompt = f"Analyse the following incidents and produce the executive summary:\n\n{context}"

    raw_response = await ai_client.generate(prompt=prompt, system=_SYSTEM_PROMPT)

    try:
        parsed = json.loads(raw_response)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI provider returned invalid JSON: {exc}",
        )

    summary = ExecutiveSummaryResponse(
        generated_at=datetime.now(tz=timezone.utc),
        provider=ai_client.provider_name,
        summary_text=parsed.get("summary_text", ""),
        key_risks=parsed.get("key_risks", []),
        recommended_actions=parsed.get("recommended_actions", []),
        operational_status=parsed.get("operational_status", "degraded"),
        total_revenue_at_risk_daily=Decimal(
            str(parsed.get("total_revenue_at_risk_daily", "0"))
        ),
        total_incidents_active=len(incidents),
    )

    _latest_summary = summary
    return summary


@router.get(
    "/latest",
    response_model=ExecutiveSummaryResponse,
    summary="Get latest cached summary",
)
async def get_latest_summary(db: AsyncSession = Depends(get_db)) -> ExecutiveSummaryResponse:
    """Return the most recently generated executive summary.
    If none exists, auto-generate one for active incidents.
    """
    global _latest_summary
    if _latest_summary is not None:
        return _latest_summary

    # Find active incidents
    active_statuses = [IncidentStatus.active, IncidentStatus.investigating, IncidentStatus.mitigating]
    result = await db.execute(
        select(Incident)
        .where(Incident.status.in_(active_statuses))
        .order_by(Incident.estimated_revenue_impact_daily.desc())
    )
    incidents = list(result.scalars().all())

    if not incidents:
        return ExecutiveSummaryResponse(
            generated_at=datetime.now(tz=timezone.utc),
            provider="system",
            summary_text="OPERATIONAL STATUS: NOMINAL. All services are operating within normal parameters. No active incidents detected.",
            key_risks=[],
            recommended_actions=[],
            operational_status="nominal",
            total_revenue_at_risk_daily=Decimal("0.00"),
            total_incidents_active=0,
        )

    # Generate one automatically
    payload = ExecutiveSummaryRequest(incident_ids=[inc.id for inc in incidents])
    _latest_summary = await generate_executive_summary(payload, db)
    return _latest_summary


def _load_prompt_template(role: str) -> tuple[str, str]:
    """Helper to load system and user prompt templates for a specific role."""
    if role == "customer":
        filename = "customer_update.md"
    elif role == "board":
        filename = "board_briefing.md"
    else:
        filename = f"{role}_summary.md"
    default_systems = {
        "cto": "You are the Technical Incident Summarizer for Revenue Leak Radar. Focus on technical causes and system impact. Return ONLY JSON.",
        "board": "You are the Business Incident Analyst for Revenue Leak Radar. Focus on commercial exposure, MRR risk and SLA breaches. Return ONLY JSON.",
        "customer": "You are the Customer Support Communicator for Revenue Leak Radar. Write apologetic status messages. Return ONLY JSON."
    }
    default_users = {
        "cto": "Analyse these incidents: {{incidents_json}}",
        "board": "Analyse these incidents: {{incidents_json}}",
        "customer": "Analyse this incident: {{incident_title}}, status: {{status}}"
    }
    
    try:
        root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        filepath = os.path.join(root_dir, "packages", "agent-prompts", "prompts", filename)
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
        
        parts = content.split("## SYSTEM PROMPT")
        if len(parts) > 1:
            subparts = parts[1].split("## USER PROMPT TEMPLATE")
            system_prompt = subparts[0].strip().replace("---", "").strip()
            user_prompt = subparts[1].split("## EXAMPLE")[0].strip().replace("---", "").strip()
            return system_prompt, user_prompt
    except Exception:
        pass
        
    return default_systems.get(role, "Return ONLY valid JSON"), default_users.get(role, "Analyse: {{incidents_json}}")


@router.post(
    "/generate-briefing",
    summary="Generate role-specific briefing",
)
async def generate_role_briefing(
    payload: RoleBriefingRequest,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Fetch incidents, parse role templates, call AI provider, and return role-customized briefings."""
    result = await db.execute(
        select(Incident)
        .where(Incident.id.in_(payload.incident_ids))
        .options(
            selectinload(Incident.deployment),
            selectinload(Incident.payment_failures),
            selectinload(Incident.support_tickets),
            selectinload(Incident.alerts),
            selectinload(Incident.revenue_event),
        )
    )
    incidents = list(result.scalars().all())

    if not incidents:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No incidents found for provided IDs",
        )

    system_prompt, user_prompt_template = _load_prompt_template(payload.role)
    
    # Perform placeholders replacement
    context_json = _build_incident_context(incidents)
    
    user_prompt = user_prompt_template.replace("{{incidents_json}}", context_json)
    user_prompt = user_prompt.replace("{{current_timestamp}}", datetime.now(timezone.utc).isoformat())
    
    if payload.role == "customer" and incidents:
        inc = incidents[0]
        user_prompt = user_prompt.replace("{{incident_title}}", inc.title)
        user_prompt = user_prompt.replace("{{severity}}", inc.severity)
        user_prompt = user_prompt.replace("{{status}}", inc.status)
        user_prompt = user_prompt.replace("{{started_at}}", inc.started_at.isoformat())

    # Call AI Provider
    ai_client = get_ai_client()
    raw_response = await ai_client.generate(prompt=user_prompt, system=system_prompt)

    try:
        parsed = json.loads(raw_response)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI provider returned invalid JSON: {exc}",
        )

    return parsed

