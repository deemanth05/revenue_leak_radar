"""
Deterministic correlation engine.

Correlates deployment events and multi-signal alert clusters to incidents.
No LLMs — purely rule-based time-window analysis.
"""
from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Sequence, Any

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from models.alert import Alert, AlertSeverity, AlertSource
from models.deployment import Deployment, DeploymentStatus
from models.payment_failure import PaymentFailure
from models.support_ticket import SupportTicket, TicketPriority, TicketStatus, TicketSource
from models.incident import Incident, IncidentSeverity, IncidentStatus, IncidentSource
from models.customer import Customer, CustomerTier
from models.revenue_event import RevenueEvent
from models.remediation_action import RemediationAction, ActionType, ActionStatus
from services.revenue_scorer import calculate_revenue_impact, calculate_incident_priority_score


# ── Result dataclass ───────────────────────────────────────────────────────────

@dataclass
class CorrelationResult:
    """Output of the multi-signal correlation analysis."""

    confidence: float                          # 0.0 – 1.0
    contributing_signals: list[str] = field(default_factory=list)
    deployment_id: uuid.UUID | None = None
    reasoning: str = ""


# ── Deployment → Incident correlation ─────────────────────────────────────────

def correlate_deployment_to_incident(
    deployment: Deployment,
    error_spike_time: datetime,
) -> float:
    """
    Return a confidence score (0–1) that a deployment caused an error spike.

    Rules
    -----
    - Deploy happened within 30 min before spike → HIGH (0.85)
    - Deploy happened within same hour  → MEDIUM (0.55)
    - Deploy happened within 2 h before spike → LOW (0.30)
    - Otherwise → VERY LOW (0.05)
    """
    deploy_time = deployment.deployed_at
    if deploy_time.tzinfo is None:
        deploy_time = deploy_time.replace(tzinfo=timezone.utc)
    if error_spike_time.tzinfo is None:
        error_spike_time = error_spike_time.replace(tzinfo=timezone.utc)

    delta: timedelta = error_spike_time - deploy_time

    # Deploy must precede the spike
    if delta.total_seconds() < 0:
        return 0.0

    minutes = delta.total_seconds() / 60.0

    if minutes <= 30:
        return 0.85
    if minutes <= 60:
        return 0.55
    if minutes <= 120:
        return 0.30
    return 0.05


# ── Multi-signal incident correlation ─────────────────────────────────────────

_SIGNAL_WINDOW_MINUTES = 60  # analyse signals within this rolling window


def correlate_incident_signals(
    payment_failures: Sequence[PaymentFailure],
    support_tickets: Sequence[SupportTicket],
    alerts: Sequence[Alert],
    window_minutes: int = _SIGNAL_WINDOW_MINUTES,
) -> CorrelationResult:
    """
    Correlate multiple signal types to assess incident confidence.

    Strategy
    --------
    1. Find the most signal-dense time window.
    2. Count each signal type inside that window.
    3. Compute a weighted confidence from the counts.
    4. Build a human-readable reasoning string.
    """
    if not (payment_failures or support_tickets or alerts):
        return CorrelationResult(
            confidence=0.0,
            reasoning="No signals provided.",
        )

    # ── Collect all event timestamps ───────────────────────────────────────
    events: list[tuple[datetime, str]] = []

    for pf in payment_failures:
        ts = pf.failed_at
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        events.append((ts, "payment_failure"))

    for st in support_tickets:
        ts = st.created_at
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        events.append((ts, "support_ticket"))

    for al in alerts:
        ts = al.triggered_at
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        events.append((ts, "alert"))

    if not events:
        return CorrelationResult(confidence=0.0, reasoning="No timestamped events.")

    events.sort(key=lambda x: x[0])

    # ── Sliding window to find peak density ───────────────────────────────
    best_window_start = events[0][0]
    best_count = 0
    window_delta = timedelta(minutes=window_minutes)

    for i, (ts, _) in enumerate(events):
        count = sum(1 for t, _ in events if ts <= t < ts + window_delta)
        if count > best_count:
            best_count = count
            best_window_start = ts

    # Signals inside best window
    window_end = best_window_start + window_delta
    window_events = [
        (ts, kind) for ts, kind in events if best_window_start <= ts < window_end
    ]

    pf_count = sum(1 for _, k in window_events if k == "payment_failure")
    st_count = sum(1 for _, k in window_events if k == "support_ticket")
    al_count = sum(1 for _, k in window_events if k == "alert")

    # ── Confidence formula ────────────────────────────────────────────────
    # Payment failures carry the highest weight (direct revenue signal)
    pf_score = min(pf_count / 20, 1.0) * 0.50
    st_score = min(st_count / 30, 1.0) * 0.30
    al_score = min(al_count / 10, 1.0) * 0.20

    confidence = round(pf_score + st_score + al_score, 4)

    # ── Contributing signals ───────────────────────────────────────────────
    contributing: list[str] = []
    if pf_count:
        contributing.append(f"{pf_count} payment failures")
    if st_count:
        contributing.append(f"{st_count} support tickets")
    if al_count:
        contributing.append(f"{al_count} alerts")

    reasoning = (
        f"Within a {window_minutes}-minute window starting "
        f"{best_window_start.isoformat()}, detected: "
        + ", ".join(contributing)
        + f". Correlation confidence: {confidence:.0%}."
    )

    return CorrelationResult(
        confidence=confidence,
        contributing_signals=contributing,
        reasoning=reasoning,
    )


# ── Dynamic Correlation Update ──────────────────────────────────────────────────

async def correlate_and_update_incident(db: AsyncSession, incident_id: uuid.UUID) -> Incident | None:
    """
    Fetch incident with all signals, recalculate revenue impact, correlation confidence,
    priority score, and update its database state.
    """
    # Fetch incident with relations
    stmt = (
        select(Incident)
        .where(Incident.id == incident_id)
        .options(
            selectinload(Incident.alerts),
            selectinload(Incident.payment_failures),
            selectinload(Incident.support_tickets),
            selectinload(Incident.deployment),
            selectinload(Incident.revenue_event),
            selectinload(Incident.remediation_actions),
        )
    )
    res = await db.execute(stmt)
    incident = res.scalar_one_or_none()
    if not incident:
        return None

    # Load all unique customers related to this incident's signals
    customer_ids = set()
    for pf in incident.payment_failures:
        customer_ids.add(pf.customer_id)
    for st in incident.support_tickets:
        customer_ids.add(st.customer_id)

    customers: list[Customer] = []
    if customer_ids:
        c_stmt = (
            select(Customer)
            .where(Customer.id.in_(list(customer_ids)))
            .options(selectinload(Customer.support_tickets))
        )
        c_res = await db.execute(c_stmt)
        customers = list(c_res.scalars().all())

    # 1. Recalculate signal correlation
    sig_result = correlate_incident_signals(
        incident.payment_failures,
        incident.support_tickets,
        incident.alerts,
    )

    # 2. Recalculate deployment correlation
    deploy_confidence = 0.0
    if incident.deployment:
        deploy_confidence = correlate_deployment_to_incident(
            incident.deployment,
            incident.started_at,
        )
        # Combination logic: weighted deployment and signal correlation
        combined_conf = 0.7 * deploy_confidence + 0.3 * sig_result.confidence
        incident.correlation_confidence = round(min(combined_conf, 0.99), 2)
    else:
        incident.correlation_confidence = sig_result.confidence

    # 3. Recalculate revenue impact
    rev_impact = calculate_revenue_impact(incident, incident.payment_failures, customers)

    # 4. Save/Update Revenue Event
    rev_event = incident.revenue_event
    if not rev_event:
        rev_event = RevenueEvent(
            incident_id=incident.id,
            revenue_at_risk_daily=rev_impact.revenue_at_risk_daily,
            revenue_at_risk_weekly=rev_impact.revenue_at_risk_weekly,
            churn_probability=rev_impact.churn_probability,
            affected_mrr=rev_impact.affected_mrr,
            calculation_method=rev_impact.calculation_method,
            breakdown=rev_impact.breakdown,
            calculated_at=datetime.now(timezone.utc),
        )
        db.add(rev_event)
    else:
        rev_event.revenue_at_risk_daily = rev_impact.revenue_at_risk_daily
        rev_event.revenue_at_risk_weekly = rev_impact.revenue_at_risk_weekly
        rev_event.churn_probability = rev_impact.churn_probability
        rev_event.affected_mrr = rev_impact.affected_mrr
        rev_event.calculation_method = rev_impact.calculation_method
        rev_event.breakdown = rev_impact.breakdown
        rev_event.calculated_at = datetime.now(timezone.utc)

    # 5. Update incident fields
    incident.estimated_revenue_impact_daily = rev_impact.revenue_at_risk_daily
    incident.affected_customer_count = len(customers)

    # 6. Recalculate Priority and Severity
    priority_score = calculate_incident_priority_score(incident, rev_impact)
    if priority_score >= 80 or rev_impact.revenue_at_risk_daily >= 10000:
        incident.severity = IncidentSeverity.critical
    elif priority_score >= 50 or rev_impact.revenue_at_risk_daily >= 1000:
        incident.severity = IncidentSeverity.high
    elif priority_score >= 25 or rev_impact.revenue_at_risk_daily >= 100:
        incident.severity = IncidentSeverity.medium
    else:
        incident.severity = IncidentSeverity.low

    # Update description to be helpful
    incident.description = (
        f"Automated correlation detected {len(incident.alerts)} alerts, "
        f"{len(incident.payment_failures)} payment failures, and "
        f"{len(incident.support_tickets)} support tickets affecting {len(customers)} customers. "
        f"Priority Score: {priority_score:.1f}/100. "
        f"Reasoning: {sig_result.reasoning}"
    )

    # 7. Auto-workflow rules (Remediation actions)
    # Trigger rollback if culprit deployment exists and severity is Critical/High and rollback not already recommended
    has_rollback = any(act.action_type == ActionType.rollback for act in incident.remediation_actions)
    if (incident.severity in [IncidentSeverity.critical, IncidentSeverity.high] and 
        incident.deployment and not has_rollback):
        
        rollback_action = RemediationAction(
            incident_id=incident.id,
            action_type=ActionType.rollback,
            title=f"Rollback deployment {incident.deployment.commit_hash} in {incident.deployment.repository}",
            description=(
                f"Critical revenue risk of ${rev_impact.revenue_at_risk_daily}/day detected. "
                f"Automatically recommending rollback of commit {incident.deployment.commit_hash} "
                f"deployed to production on {incident.deployment.deployed_at.isoformat()}."
            ),
            status=ActionStatus.pending,
            priority_order=1,
        )
        db.add(rollback_action)
        incident.remediation_actions.append(rollback_action)

    # Trigger slack notification if not already done
    has_slack = any(act.action_type == ActionType.notify_slack for act in incident.remediation_actions)
    if not has_slack:
        slack_action = RemediationAction(
            incident_id=incident.id,
            action_type=ActionType.notify_slack,
            title="Send executive alert to #incident-response",
            description=(
                f"Escalated alert dispatched to Slack. Revenue risk: ${rev_impact.revenue_at_risk_daily}/day. "
                f"Affected Customers: {len(customers)}. Severity: {incident.severity.upper()}."
            ),
            status=ActionStatus.completed,
            priority_order=2,
            completed_at=datetime.now(timezone.utc),
        )
        db.add(slack_action)
        incident.remediation_actions.append(slack_action)

    # Trigger Jira creation if severity is Critical/High and not already done
    has_jira = any(act.action_type == ActionType.create_jira for act in incident.remediation_actions)
    if incident.severity in [IncidentSeverity.critical, IncidentSeverity.high] and not has_jira:
        jira_action = RemediationAction(
            incident_id=incident.id,
            action_type=ActionType.create_jira,
            title=f"Create High-Priority Jira Ticket for {incident.title}",
            description=(
                f"Jira issue generated for incident. Revenue risk: ${rev_impact.revenue_at_risk_daily}/day. "
                f"Linked Culprit Deployment: {incident.deployment.commit_hash if incident.deployment else 'None'}."
            ),
            status=ActionStatus.completed,
            priority_order=3,
            completed_at=datetime.now(timezone.utc),
        )
        db.add(jira_action)
        incident.remediation_actions.append(jira_action)

    await db.commit()
    return incident


async def run_correlation_for_new_event(
    db: AsyncSession,
    event_type: str,
    event_obj: Any,
    service: str,
) -> Incident | None:
    """
    Called when a new event (Alert, PaymentFailure, SupportTicket) is ingested.
    Correlates the event to an existing active incident, or creates a new one.
    """
    event_time = getattr(event_obj, "triggered_at", None) or getattr(event_obj, "failed_at", None) or getattr(event_obj, "created_at", None)
    if not event_time:
        event_time = datetime.now(timezone.utc)
    if event_time.tzinfo is None:
        event_time = event_time.replace(tzinfo=timezone.utc)

    # Look for active incidents within a 30-minute window of the event
    window_start = event_time - timedelta(minutes=30)
    window_end = event_time + timedelta(minutes=30)

    stmt = (
        select(Incident)
        .where(
            Incident.status.in_([IncidentStatus.active, IncidentStatus.investigating, IncidentStatus.mitigating]),
            Incident.started_at >= window_start,
            Incident.started_at <= window_end,
        )
        .order_by(Incident.started_at.desc())
    )
    res = await db.execute(stmt)
    active_incidents = res.scalars().all()

    # Find the best match incident based on service/repository (via associated deployment or title)
    matched_incident: Incident | None = None
    for inc in active_incidents:
        if inc.deployment_id:
            dep_stmt = select(Deployment).where(Deployment.id == inc.deployment_id)
            dep_res = await db.execute(dep_stmt)
            dep = dep_res.scalar_one_or_none()
            if dep and (dep.repository.lower() in service.lower() or service.lower() in dep.repository.lower()):
                matched_incident = inc
                break
        if service.lower() in inc.title.lower() or inc.title.lower() in service.lower():
            matched_incident = inc
            break

    if not matched_incident and active_incidents:
        matched_incident = active_incidents[0]

    if matched_incident:
        event_obj.incident_id = matched_incident.id
        await db.commit()
        return await correlate_and_update_incident(db, matched_incident.id)

    # If no active incident, create a new one.
    # First, look for a deployment for the service in the last 60 minutes.
    dep_window_start = event_time - timedelta(minutes=60)
    dep_stmt = (
        select(Deployment)
        .where(
            Deployment.deployed_at >= dep_window_start,
            Deployment.deployed_at <= event_time,
        )
        .order_by(Deployment.deployed_at.desc())
    )
    dep_res = await db.execute(dep_stmt)
    deployments = dep_res.scalars().all()

    culprit_dep: Deployment | None = None
    for dep in deployments:
        if dep.repository.lower() in service.lower() or service.lower() in dep.repository.lower():
            culprit_dep = dep
            break

    title = f"{service.replace('-', ' ').title()} Service Disruption"
    if culprit_dep:
        title = f"{service.replace('-', ' ').title()} Failure after Deployment {culprit_dep.commit_hash}"

    incident = Incident(
        title=title,
        severity=IncidentSeverity.medium,  # Will be recalculated
        status=IncidentStatus.active,
        source=IncidentSource.correlation_engine,
        deployment_id=culprit_dep.id if culprit_dep else None,
        started_at=event_time,
    )
    db.add(incident)
    await db.flush()  # Get the incident ID

    event_obj.incident_id = incident.id
    await db.commit()

    return await correlate_and_update_incident(db, incident.id)
