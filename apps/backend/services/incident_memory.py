"""
Incident Memory service for calculating deterministic incident similarity.
"""
from __future__ import annotations

import uuid
from typing import Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from models.incident import Incident, IncidentStatus
from models.deployment import Deployment
from models.alert import Alert


async def find_similar_incidents(
    db: AsyncSession,
    incident_id: uuid.UUID,
) -> list[dict[str, Any]]:
    """
    Find resolved incidents that match the target incident based on deterministic heuristics.
    """
    # Fetch target incident
    stmt = (
        select(Incident)
        .where(Incident.id == incident_id)
        .options(
            selectinload(Incident.alerts),
            selectinload(Incident.deployment),
            selectinload(Incident.payment_failures),
        )
    )
    res = await db.execute(stmt)
    target = res.scalar_one_or_none()
    if not target:
        return []

    # Fetch past resolved/closed incidents
    resolved_stmt = (
        select(Incident)
        .where(
            Incident.id != incident_id,
            Incident.status.in_([IncidentStatus.resolved, IncidentStatus.closed]),
        )
        .options(
            selectinload(Incident.alerts),
            selectinload(Incident.deployment),
            selectinload(Incident.payment_failures),
        )
        .limit(10)
    )
    resolved_res = await db.execute(resolved_stmt)
    past_incidents = resolved_res.scalars().all()

    matches = []

    for past in past_incidents:
        score = 0.0
        reasons = []

        # 1. Deployment overlap (max 0.4)
        if target.deployment and past.deployment:
            if target.deployment.repository == past.deployment.repository:
                score += 0.3
                reasons.append("same repository codebase (" + target.deployment.repository + ")")
                if target.deployment.author == past.deployment.author:
                    score += 0.1
                    reasons.append("same deploying author (" + target.deployment.author + ")")
        elif target.deployment_id is None and past.deployment_id is None:
            score += 0.2
            reasons.append("both occurred without any deployment trigger event")

        # 2. Alert/Error signature overlap (max 0.4)
        target_alert_titles = {a.title.lower() for a in target.alerts}
        past_alert_titles = {a.title.lower() for a in past.alerts}
        
        if target_alert_titles and past_alert_titles:
            overlap = target_alert_titles.intersection(past_alert_titles)
            if overlap:
                score += 0.3
                reasons.append(f"exact matching alert titles: {list(overlap)[0]}")
            else:
                keywords = {"timeout", "500", "signature", "database", "latency", "exhausted"}
                target_keys = {w for t in target_alert_titles for w in t.split() if w in keywords}
                past_keys = {w for t in past_alert_titles for w in t.split() if w in keywords}
                key_overlap = target_keys.intersection(past_keys)
                if key_overlap:
                    score += 0.15
                    reasons.append(f"overlapping error keywords: {', '.join(key_overlap)}")

        # 3. Payment failures presence (max 0.2)
        target_has_pf = len(target.payment_failures) > 0
        past_has_pf = len(past.payment_failures) > 0
        if target_has_pf == past_has_pf:
            score += 0.1
            if target_has_pf:
                reasons.append("both impacted payment conversion directly")

        score = round(min(score, 1.0), 2)
        if score >= 0.25:
            matches.append({
                "id": str(past.id),
                "title": past.title,
                "similarity_score": score,
                "reasoning": "Identified recurrence based on: " + ", ".join(reasons) + "."
            })

    matches.sort(key=lambda x: x["similarity_score"], reverse=True)
    return matches
