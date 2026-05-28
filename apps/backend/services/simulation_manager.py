"""
Simulation manager for running demo scenarios.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone, timedelta
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from models.customer import Customer, CustomerTier
from models.deployment import Deployment, DeploymentStatus
from models.incident import Incident, IncidentStatus, IncidentSeverity
from models.remediation_action import RemediationAction, ActionStatus, ActionType
from schemas.operational_event import OperationalEventCreate
from models.operational_event import OperationalEventType
from services.event_ingestion import ingest_operational_event
from services.correlation_engine import correlate_and_update_incident


_SCENARIO_STATES: dict[str, int] = {
    "checkout_failure": 0,
    "auth_outage": 0,
    "gateway_degradation": 0,
    "enterprise_sla_violation": 0,
    "silent_churn_leak": 0,
    "latency_spike": 0,
}


def get_scenario_states() -> dict[str, int]:
    return _SCENARIO_STATES


def reset_scenario_states() -> None:
    for k in _SCENARIO_STATES:
        _SCENARIO_STATES[k] = 0


async def trigger_scenario_step(db: AsyncSession, scenario_id: str, step_num: int) -> dict[str, Any]:
    """
    Executes a specific step of a simulation scenario.
    Ingests corresponding operational events.
    """
    # Verify/load customers
    c_res = await db.execute(select(Customer))
    customers = c_res.scalars().all()
    if not customers:
        return {"status": "error", "message": "No customers found in database. Please run the seeder first."}

    # Group customers by tier
    enterprise_custs = [c for c in customers if c.tier == CustomerTier.enterprise]
    premium_custs = [c for c in customers if c.tier == CustomerTier.premium]
    standard_custs = [c for c in customers if c.tier == CustomerTier.standard]

    # Defaults in case empty
    ent_id = str(enterprise_custs[0].id) if enterprise_custs else str(customers[0].id)
    prem_id = str(premium_custs[0].id) if premium_custs else str(customers[0].id)
    std_id = str(standard_custs[0].id) if standard_custs else str(customers[0].id)

    now = datetime.now(timezone.utc)

    events_to_ingest: list[OperationalEventCreate] = []

    # ── 1. CHECKOUT FAILURE SCENARIO ──────────────────────────────────────────
    if scenario_id == "checkout_failure":
        if step_num == 1:
            events_to_ingest.append(
                OperationalEventCreate(
                    event_type=OperationalEventType.deployment,
                    timestamp=now - timedelta(minutes=5),
                    severity="info",
                    service="checkout-service",
                    source_system="GitHub Actions",
                    affected_customers=[],
                    correlation_metadata={
                        "commit_hash": "abc123f",
                        "branch": "main",
                        "author": "Sarah Chen (Lead Engineer)",
                        "environment": "production",
                        "status": "success",
                        "duration_seconds": 145,
                    },
                    business_context={
                        "repository": "checkout-service",
                        "change_log": "Optimise stripe api integration & payment routing",
                    }
                )
            )
        elif step_num == 2:
            events_to_ingest.append(
                OperationalEventCreate(
                    event_type=OperationalEventType.error_spike,
                    timestamp=now,
                    severity="critical",
                    service="checkout-service",
                    source_system="Sentry",
                    affected_customers=[],
                    correlation_metadata={
                        "title": "CheckoutService: HTTP 500 rate 340/min",
                        "message": "PaymentProcessor.process() raised StripeAPIError: Invalid signature",
                        "error_rate": 8.4,
                    },
                    business_context={
                        "impact": "Customers are getting 500 Internal Server Errors during payment confirmation"
                    }
                )
            )
        elif step_num == 3:
            pf_customers = [ent_id, prem_id, std_id]
            amounts = [4500.00, 799.00, 49.00]
            for c_id, amt in zip(pf_customers, amounts):
                events_to_ingest.append(
                    OperationalEventCreate(
                        event_type=OperationalEventType.payment_failure,
                        timestamp=now,
                        severity="high",
                        service="checkout-service",
                        source_system="Stripe Gateway",
                        affected_customers=[c_id],
                        correlation_metadata={
                            "amount": amt,
                            "currency": "USD",
                            "failure_reason": "processing_error",
                            "stripe_payment_intent_id": f"pi_{uuid.uuid4().hex[:20]}",
                        },
                        business_context={"reason": "Stripe API payload signature mismatch"}
                    )
                )
        elif step_num == 4:
            events_to_ingest.append(
                OperationalEventCreate(
                    event_type=OperationalEventType.support_ticket,
                    timestamp=now,
                    severity="high",
                    service="checkout-service",
                    source_system="Zendesk",
                    affected_customers=[ent_id],
                    correlation_metadata={
                        "subject": "CRITICAL: Cannot checkout. Getting invalid payment error at checkout.",
                        "priority": "urgent",
                        "status": "open",
                    },
                    business_context={"sla_risk": "Enterprise Customer SLA breach warning"}
                )
            )
            events_to_ingest.append(
                OperationalEventCreate(
                    event_type=OperationalEventType.customer_complaint,
                    timestamp=now,
                    severity="medium",
                    service="checkout-service",
                    source_system="Intercom Chat",
                    affected_customers=[prem_id],
                    correlation_metadata={
                        "subject": "Subscription billing decline",
                        "priority": "high",
                        "status": "open",
                    },
                    business_context={"mrr_affected": 299}
                )
            )
        elif step_num == 5:
            # Trigger correlation analysis
            stmt = select(Incident).where(Incident.title.ilike("%Checkout%")).order_by(Incident.created_at.desc())
            res = await db.execute(stmt)
            inc = res.scalars().first()
            if inc:
                await correlate_and_update_incident(db, inc.id)
        elif step_num == 6:
            # Perform rollback and resolution
            stmt = select(Incident).where(Incident.title.ilike("%Checkout%")).order_by(Incident.created_at.desc())
            res = await db.execute(stmt)
            inc = res.scalars().first()
            if inc:
                for act in inc.remediation_actions:
                    if act.action_type in [ActionType.rollback, "rollback"]:
                        act.status = ActionStatus.completed
                        act.completed_at = now
                
                if inc.deployment:
                    inc.deployment.status = DeploymentStatus.rolled_back
                
                inc.status = IncidentStatus.resolved
                inc.resolved_at = now
                await db.commit()

    # ── 2. AUTH OUTAGE SCENARIO ───────────────────────────────────────────────
    elif scenario_id == "auth_outage":
        if step_num == 1:
            events_to_ingest.append(
                OperationalEventCreate(
                    event_type=OperationalEventType.infrastructure_alert,
                    timestamp=now - timedelta(minutes=10),
                    severity="critical",
                    service="auth-service",
                    source_system="Datadog APM",
                    affected_customers=[],
                    correlation_metadata={
                        "title": "Auth latency spike: p99 > 8500ms",
                        "message": "Auth API response times degraded. Database pool connections saturated.",
                    },
                    business_context={"service": "auth-service"}
                )
            )
        elif step_num == 2:
            events_to_ingest.append(
                OperationalEventCreate(
                    event_type=OperationalEventType.support_ticket,
                    timestamp=now,
                    severity="high",
                    service="auth-service",
                    source_system="Zendesk",
                    affected_customers=[std_id],
                    correlation_metadata={
                        "subject": "Unable to log in to dashboard",
                        "priority": "high",
                        "status": "open",
                    },
                    business_context={"symptom": "Dashboard timeout during login"}
                )
            )
        elif step_num == 3:
            stmt = select(Incident).where(Incident.title.ilike("%Auth%")).order_by(Incident.created_at.desc())
            res = await db.execute(stmt)
            inc = res.scalars().first()
            if inc:
                action = RemediationAction(
                    incident_id=inc.id,
                    action_type=ActionType.scale_up,
                    title="Scale up auth-service replicas from 3 to 10",
                    description="Increased auth service container pool capacity by 230% to alleviate database lock saturation.",
                    status=ActionStatus.completed,
                    assigned_to="K8s AutoScaler",
                    completed_at=now,
                )
                db.add(action)
                inc.status = IncidentStatus.mitigating
                await db.commit()
                await correlate_and_update_incident(db, inc.id)

    # ── 3. GATEWAY DEGRADATION SCENARIO ───────────────────────────────────────
    elif scenario_id == "gateway_degradation":
        if step_num == 1:
            events_to_ingest.append(
                OperationalEventCreate(
                    event_type=OperationalEventType.infrastructure_alert,
                    timestamp=now - timedelta(minutes=15),
                    severity="high",
                    service="payment-processor",
                    source_system="Grafana Metrics",
                    affected_customers=[],
                    correlation_metadata={
                        "title": "Stripe Gateway degradation detected",
                        "message": "Stripe API webhook timeouts. Gateway processing rate dropped by 45%.",
                    },
                    business_context={"gateway": "Stripe Connect"}
                )
            )
        elif step_num == 2:
            events_to_ingest.append(
                OperationalEventCreate(
                    event_type=OperationalEventType.payment_failure,
                    timestamp=now,
                    severity="high",
                    service="payment-processor",
                    source_system="Stripe API",
                    affected_customers=[prem_id],
                    correlation_metadata={
                        "amount": 199.00,
                        "currency": "USD",
                        "failure_reason": "timeout",
                        "stripe_payment_intent_id": f"pi_{uuid.uuid4().hex[:20]}",
                    },
                    business_context={"gateway_error": "ReadTimeout"}
                )
            )

    # ── 4. ENTERPRISE SLA VIOLATION SCENARIO ──────────────────────────────────
    elif scenario_id == "enterprise_sla_violation":
        if step_num == 1:
            events_to_ingest.append(
                OperationalEventCreate(
                    event_type=OperationalEventType.sla_violation,
                    timestamp=now - timedelta(minutes=5),
                    severity="critical",
                    service="api-gateway",
                    source_system="Datadog SLA Monitors",
                    affected_customers=[ent_id],
                    correlation_metadata={
                        "title": "Enterprise Cluster API Latency SLA breached",
                        "message": "Latency threshold > 500ms for enterprise client routing.",
                    },
                    business_context={"sla_target": "99.9% under 200ms"}
                )
            )
        elif step_num == 2:
            events_to_ingest.append(
                OperationalEventCreate(
                    event_type=OperationalEventType.support_ticket,
                    timestamp=now,
                    severity="critical",
                    service="api-gateway",
                    source_system="Zendesk",
                    affected_customers=[ent_id],
                    correlation_metadata={
                        "subject": "URGENT: API response times are unacceptable (> 2 seconds)",
                        "priority": "urgent",
                        "status": "open",
                    },
                    business_context={"escalated": True}
                )
            )

    # ── 5. SILENT CHURN LEAK SCENARIO ─────────────────────────────────────────
    elif scenario_id == "silent_churn_leak":
        if step_num == 1:
            pf_custs = [prem_id, std_id]
            for c_id in pf_custs:
                events_to_ingest.append(
                    OperationalEventCreate(
                        event_type=OperationalEventType.payment_failure,
                        timestamp=now - timedelta(hours=2),
                        severity="medium",
                        service="billing-service",
                        source_system="Stripe Billing",
                        affected_customers=[c_id],
                        correlation_metadata={
                            "amount": 99.00,
                            "currency": "USD",
                            "failure_reason": "card_declined",
                            "stripe_payment_intent_id": f"pi_{uuid.uuid4().hex[:20]}",
                        },
                        business_context={"type": "subscription_renewal"}
                    )
                )
        elif step_num == 2:
            events_to_ingest.append(
                OperationalEventCreate(
                    event_type=OperationalEventType.support_ticket,
                    timestamp=now,
                    severity="medium",
                    service="billing-service",
                    source_system="Email Support",
                    affected_customers=[prem_id],
                    correlation_metadata={
                        "subject": "Subscription canceled after payment issues",
                        "priority": "normal",
                        "status": "open",
                    },
                    business_context={"churn_risk": "silent cancellation"}
                )
            )

    # ── 6. LATENCY SPIKE SCENARIO ─────────────────────────────────────────────
    elif scenario_id == "latency_spike":
        if step_num == 1:
            events_to_ingest.append(
                OperationalEventCreate(
                    event_type=OperationalEventType.infrastructure_alert,
                    timestamp=now - timedelta(minutes=8),
                    severity="medium",
                    service="checkout-service",
                    source_system="Grafana",
                    affected_customers=[],
                    correlation_metadata={
                        "title": "p95 checkout response latency > 3200ms",
                        "message": "High service response times on order creation endpoint.",
                    },
                    business_context={"latency": 3214}
                )
            )
        elif step_num == 2:
            events_to_ingest.append(
                OperationalEventCreate(
                    event_type=OperationalEventType.support_ticket,
                    timestamp=now,
                    severity="medium",
                    service="checkout-service",
                    source_system="Zendesk",
                    affected_customers=[std_id],
                    correlation_metadata={
                        "subject": "Checkout page takes forever to load",
                        "priority": "normal",
                        "status": "open",
                    },
                    business_context={"performance": "slow checkout"}
                )
            )

    # Ingest the events
    ingested_raw = []
    for ev in events_to_ingest:
        raw_ev = await ingest_operational_event(db, ev)
        ingested_raw.append(raw_ev)

    # Update scenario state
    _SCENARIO_STATES[scenario_id] = step_num

    return {
        "status": "success",
        "scenario": scenario_id,
        "step": step_num,
        "events_ingested_count": len(ingested_raw),
        "events": [
            {
                "id": str(e.id),
                "event_type": e.event_type,
                "timestamp": e.timestamp.isoformat(),
                "severity": e.severity,
                "service": e.service,
                "source_system": e.source_system,
            }
            for e in ingested_raw
        ],
    }
