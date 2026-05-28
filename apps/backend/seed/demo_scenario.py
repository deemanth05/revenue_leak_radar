"""
Demo scenario seeder.

Creates a full, realistic demo dataset:
  - 50 customers (5 enterprise, 15 premium, 25 standard, 5 trial)
  - 3 recent deployments (one is the culprit: commit 'abc123f', checkout-service)
  - 1 critical incident correlated to that deployment
  - 47 Sentry alerts (error spike)
  - 89 payment failures ($42k/day impact)
  - 67 support tickets (surge)
  - 1 revenue_event (calculated impact)
  - 3 remediation_actions

Usage:
    cd apps/backend
    python -m seed.demo_scenario
"""
from __future__ import annotations

import asyncio
import os
import sys
import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from random import Random

# ── Path setup ─────────────────────────────────────────────────────────────────
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

from faker import Faker
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import AsyncSessionFactory, engine, init_db
from models.alert import Alert, AlertSeverity, AlertSource
from models.customer import Customer, CustomerTier
from models.deployment import Deployment, DeploymentEnvironment, DeploymentStatus
from models.incident import Incident, IncidentSeverity, IncidentSource, IncidentStatus
from models.payment_failure import PaymentFailure
from models.remediation_action import ActionStatus, ActionType, RemediationAction
from models.revenue_event import RevenueEvent
from models.support_ticket import SupportTicket, TicketPriority, TicketSource, TicketStatus

# Deterministic seed
FAKER_SEED = 42
fake = Faker()
Faker.seed(FAKER_SEED)
rng = Random(FAKER_SEED)

# Reference time — incident started 2 hours ago
NOW = datetime.now(tz=timezone.utc)
INCIDENT_START = NOW - timedelta(hours=2)
DEPLOY_TIME = INCIDENT_START - timedelta(minutes=18)  # Deploy 18 min before spike


# ── Customer helpers ───────────────────────────────────────────────────────────

_TIER_CONFIG = [
    (CustomerTier.enterprise, 5,  Decimal("8500"),  Decimal("102000"), True,  "platinum"),
    (CustomerTier.premium,    15, Decimal("1200"),  Decimal("14400"),  True,  "gold"),
    (CustomerTier.standard,   25, Decimal("250"),   None,              False, None),
    (CustomerTier.trial,      5,  Decimal("0"),     None,              False, None),
]


def _make_customers() -> list[Customer]:
    customers: list[Customer] = []
    for tier, count, base_mrr, aca, is_sla, sla_tier in _TIER_CONFIG:
        for _ in range(count):
            # Add slight variation to MRR
            variance = Decimal(str(rng.uniform(0.8, 1.2)))
            mrr = (base_mrr * variance).quantize(Decimal("0.01")) if base_mrr > 0 else Decimal("0")
            customers.append(
                Customer(
                    id=uuid.uuid4(),
                    name=fake.company(),
                    email=fake.unique.company_email(),
                    tier=tier,
                    mrr=mrr,
                    contract_value_annual=aca,
                    is_sla_customer=is_sla,
                    sla_tier=sla_tier,
                )
            )
    rng.shuffle(customers)
    return customers


# ── Deployment helpers ─────────────────────────────────────────────────────────

def _make_deployments() -> list[Deployment]:
    # Culprit deployment
    culprit = Deployment(
        id=uuid.uuid4(),
        commit_hash="abc123f",
        branch="main",
        author="alex.chen@acme.com",
        repository="acme/checkout-service",
        environment=DeploymentEnvironment.production,
        status=DeploymentStatus.success,
        deployed_at=DEPLOY_TIME,
        duration_seconds=247,
    )
    # Innocent deploy 3 hours before
    safe_1 = Deployment(
        id=uuid.uuid4(),
        commit_hash="f9e8d7c",
        branch="main",
        author="priya.nair@acme.com",
        repository="acme/auth-service",
        environment=DeploymentEnvironment.production,
        status=DeploymentStatus.success,
        deployed_at=INCIDENT_START - timedelta(hours=3),
        duration_seconds=189,
    )
    # Staging deploy, irrelevant
    safe_2 = Deployment(
        id=uuid.uuid4(),
        commit_hash="b4d5e6f",
        branch="feature/new-pricing",
        author="jordan.lee@acme.com",
        repository="acme/billing-service",
        environment=DeploymentEnvironment.staging,
        status=DeploymentStatus.success,
        deployed_at=INCIDENT_START - timedelta(hours=1),
        duration_seconds=312,
    )
    return [culprit, safe_1, safe_2]


# ── Incident ───────────────────────────────────────────────────────────────────

def _make_incident(culprit_deployment: Deployment) -> Incident:
    return Incident(
        id=uuid.uuid4(),
        title="Critical: Payment processing failures spiking — checkout-service degraded",
        description=(
            "Sentry error rate spiked from 0.2% to 18.7% at 14:32 UTC immediately following "
            "the checkout-service deployment (commit abc123f). Payment intent creation is "
            "failing with a NullPointerException in the Stripe SDK wrapper. 89 payment "
            "failures detected in the last 2 hours across 67 affected customers. "
            "Enterprise SLA breach imminent."
        ),
        severity=IncidentSeverity.critical,
        status=IncidentStatus.investigating,
        source=IncidentSource.correlation_engine,
        deployment_id=culprit_deployment.id,
        error_rate=18.7,
        affected_customer_count=67,
        estimated_revenue_impact_daily=Decimal("42180.00"),
        correlation_confidence=0.87,
        started_at=INCIDENT_START,
        resolved_at=None,
    )


# ── Alerts ─────────────────────────────────────────────────────────────────────

def _make_alerts(incident: Incident) -> list[Alert]:
    alerts: list[Alert] = []
    severities = [AlertSeverity.critical] * 8 + [AlertSeverity.high] * 20 + [AlertSeverity.medium] * 19

    sentry_titles = [
        "NullPointerException in StripePaymentIntentService",
        "PaymentProcessingException: card_declined rate >15%",
        "CheckoutController: Unhandled exception in /api/checkout/confirm",
        "Database connection pool exhausted in payment-service",
        "Stripe SDK timeout after 30s",
    ]

    for i in range(47):
        triggered = INCIDENT_START + timedelta(minutes=rng.randint(0, 115))
        title = rng.choice(sentry_titles)
        sev = severities[i]
        alerts.append(
            Alert(
                id=uuid.uuid4(),
                incident_id=incident.id,
                source=AlertSource.sentry,
                title=title,
                message=f"Error count: {rng.randint(50, 2000)}. Affecting {rng.randint(5, 80)} users/min.",
                severity=sev,
                alert_metadata={
                    "sentry_issue_id": f"CHECKOUT-{1000 + i}",
                    "error_count": rng.randint(50, 2000),
                    "fingerprint": fake.md5(),
                },
                triggered_at=triggered,
            )
        )
    return alerts


# ── Payment failures ───────────────────────────────────────────────────────────

_FAILURE_REASONS = [
    "stripe_error: payment_intent_creation_failed",
    "stripe_error: card_declined",
    "stripe_error: insufficient_funds",
    "internal_error: null_pointer_in_stripe_wrapper",
    "timeout: stripe_api_timeout_30s",
]


def _make_payment_failures(
    incident: Incident,
    customers: list[Customer],
) -> list[PaymentFailure]:
    # Pick 40 distinct customers to have failures
    affected = customers[:40]
    failures: list[PaymentFailure] = []

    for i in range(89):
        customer = rng.choice(affected)
        amount = Decimal(str(rng.uniform(29.99, 1499.00))).quantize(Decimal("0.01"))
        failed_at = INCIDENT_START + timedelta(minutes=rng.randint(0, 118))
        failures.append(
            PaymentFailure(
                id=uuid.uuid4(),
                incident_id=incident.id,
                customer_id=customer.id,
                amount=amount,
                currency="USD",
                failure_reason=rng.choice(_FAILURE_REASONS),
                stripe_payment_intent_id=f"pi_{fake.lexify('?' * 24)}",
                failed_at=failed_at,
            )
        )
    return failures


# ── Support tickets ────────────────────────────────────────────────────────────

_TICKET_SUBJECTS = [
    "Payment failed — cannot complete subscription renewal",
    "Getting 'Something went wrong' on checkout",
    "Unable to upgrade our plan — payment not going through",
    "Critical: Our team is blocked — checkout page broken",
    "Invoice payment failed — please help urgently",
    "Error during checkout: please fix ASAP",
    "Cannot process payment for annual contract",
]


def _make_support_tickets(
    incident: Incident,
    customers: list[Customer],
) -> list[SupportTicket]:
    # 67 tickets from first 45 customers
    affected = customers[:45]
    tickets: list[SupportTicket] = []
    priorities = (
        [TicketPriority.urgent] * 20
        + [TicketPriority.high] * 25
        + [TicketPriority.normal] * 22
    )

    for i in range(67):
        customer = rng.choice(affected)
        created_at = INCIDENT_START + timedelta(minutes=rng.randint(5, 120))
        tickets.append(
            SupportTicket(
                id=uuid.uuid4(),
                incident_id=incident.id,
                customer_id=customer.id,
                subject=rng.choice(_TICKET_SUBJECTS),
                priority=priorities[i],
                status=TicketStatus.open,
                source=rng.choice([TicketSource.zendesk, TicketSource.intercom, TicketSource.email]),
                resolved_at=None,
                created_at=created_at,
                updated_at=created_at,
            )
        )
    return tickets


# ── Revenue event ──────────────────────────────────────────────────────────────

def _make_revenue_event(incident: Incident) -> RevenueEvent:
    return RevenueEvent(
        id=uuid.uuid4(),
        incident_id=incident.id,
        revenue_at_risk_daily=Decimal("42180.00"),
        revenue_at_risk_weekly=Decimal("295260.00"),
        churn_probability=0.23,
        affected_mrr=Decimal("183400.00"),
        calculation_method="weighted_mrr_v1",
        breakdown={
            "enterprise_mrr_daily": "1416.67",
            "premium_mrr_daily": "600.00",
            "standard_mrr_daily": "208.33",
            "payment_failure_daily": "36500.00",
            "churn_risk_daily": "3455.00",
            "severity_multiplier": "1.0",
            "payment_failures_count": 89,
            "affected_customers_count": 67,
        },
        calculated_at=NOW - timedelta(minutes=5),
    )


# ── Remediation actions ────────────────────────────────────────────────────────

def _make_remediation_actions(incident: Incident) -> list[RemediationAction]:
    return [
        RemediationAction(
            id=uuid.uuid4(),
            incident_id=incident.id,
            action_type=ActionType.rollback,
            title="Roll back checkout-service to commit f9e8d7c",
            description=(
                "Immediately roll back checkout-service to the previous stable build (f9e8d7c). "
                "This will restore payment processing. Estimated recovery: 5–8 minutes. "
                "Use: kubectl rollout undo deployment/checkout-service -n production"
            ),
            status=ActionStatus.in_progress,
            assigned_to="sre-oncall@acme.com",
            priority_order=1,
        ),
        RemediationAction(
            id=uuid.uuid4(),
            incident_id=incident.id,
            action_type=ActionType.create_jira,
            title="Create P0 Jira ticket for RCA",
            description=(
                "Open a P0 Jira ticket in the CHECKOUT project. Include: timeline of events, "
                "deployment details, error traces, and revenue impact. Assign to checkout-service team lead."
            ),
            status=ActionStatus.completed,
            assigned_to="eng-manager@acme.com",
            priority_order=2,
            completed_at=NOW - timedelta(minutes=45),
        ),
        RemediationAction(
            id=uuid.uuid4(),
            incident_id=incident.id,
            action_type=ActionType.notify_slack,
            title="Post incident update to #incidents and #enterprise-csm",
            description=(
                "Send P0 incident card to #incidents with current status, ETA, and impact. "
                "Also notify #enterprise-csm so account managers can proactively reach out to enterprise customers."
            ),
            status=ActionStatus.completed,
            assigned_to="comms-lead@acme.com",
            priority_order=3,
            completed_at=NOW - timedelta(minutes=90),
        ),
    ]


# ── Main seeder ────────────────────────────────────────────────────────────────

async def seed() -> None:
    print("🌱 Initialising database schema...")
    await init_db()

    async with AsyncSessionFactory() as session:
        # Clear existing demo data
        print("🧹 Clearing existing data...")
        for table in [
            "remediation_actions", "revenue_events", "support_tickets",
            "payment_failures", "alerts", "incidents", "deployments", "customers",
        ]:
            await session.execute(text(f"DELETE FROM {table}"))
        await session.commit()

        print("👥 Creating 50 customers...")
        customers = _make_customers()
        session.add_all(customers)
        await session.flush()

        print("🚀 Creating 3 deployments...")
        deployments = _make_deployments()
        session.add_all(deployments)
        await session.flush()

        culprit_deployment = deployments[0]  # abc123f — checkout-service

        print("🔥 Creating critical incident...")
        incident = _make_incident(culprit_deployment)
        session.add(incident)
        await session.flush()

        print("🚨 Creating 47 Sentry alerts...")
        alerts = _make_alerts(incident)
        session.add_all(alerts)
        await session.flush()

        print("💳 Creating 89 payment failures...")
        payment_failures = _make_payment_failures(incident, customers)
        session.add_all(payment_failures)
        await session.flush()

        print("🎫 Creating 67 support tickets...")
        support_tickets = _make_support_tickets(incident, customers)
        session.add_all(support_tickets)
        await session.flush()

        print("💰 Creating revenue event...")
        revenue_event = _make_revenue_event(incident)
        session.add(revenue_event)
        await session.flush()

        print("🔧 Creating 3 remediation actions...")
        actions = _make_remediation_actions(incident)
        session.add_all(actions)
        await session.flush()

        await session.commit()

    print("\n✅ Demo scenario seeded successfully!")
    print(f"   Incident ID: {incident.id}")
    print(f"   Culprit deployment: {culprit_deployment.id} (commit: abc123f)")
    print(f"   Revenue at risk: $42,180/day")
    print(f"   Customers affected: 67")
    print(f"   Payment failures: 89")
    print(f"   Support tickets: 67")
    print(f"   Alerts: 47")
    print("\n   Run the API and visit http://localhost:8000/docs to explore!")


if __name__ == "__main__":
    asyncio.run(seed())
