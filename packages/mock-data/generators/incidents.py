"""
incidents.py — Generates operational incident records.

Demo scenario guarantee
-----------------------
The first record is always the canonical demo incident:
  title                        = 'Checkout Service Payment Failure - Deployment abc123f'
  severity                     = 'critical'
  status                       = 'active'
  estimated_revenue_impact_daily = 42_000.0
  correlation_confidence       = 0.94
  affected_customer_count      = 424   (3 enterprise + 421 premium)
  root_cause_deployment        = 'abc123f'

Background incidents fill in realistic operational noise.
"""

import random
import uuid
from typing import Any

from .base import BaseGenerator


_BACKGROUND_INCIDENTS = [
    {
        "title": "Auth Service Timeout Spike",
        "severity": "high",
        "status": "investigating",
        "service": "auth-service",
        "estimated_revenue_impact_daily": 3_200.0,
        "correlation_confidence": 0.71,
        "affected_customer_count": 38,
        "summary": (
            "p99 latency on /oauth/token endpoint exceeded 2s SLA. "
            "Correlates with increased Redis eviction rate."
        ),
    },
    {
        "title": "Database Connection Pool Exhausted",
        "severity": "high",
        "status": "mitigated",
        "service": "api-gateway",
        "estimated_revenue_impact_daily": 8_500.0,
        "correlation_confidence": 0.88,
        "affected_customer_count": 112,
        "summary": (
            "PostgreSQL connection pool hit max_connections (200). "
            "Idle connections not released after analytics query surge."
        ),
    },
    {
        "title": "CDN Cache Miss Rate Elevated",
        "severity": "medium",
        "status": "monitoring",
        "service": "customer-portal",
        "estimated_revenue_impact_daily": 1_100.0,
        "correlation_confidence": 0.55,
        "affected_customer_count": 0,
        "summary": (
            "Cache hit rate dropped from 94% to 61% after static asset "
            "cache key change in last deploy. No revenue impact yet."
        ),
    },
    {
        "title": "Notification Service Email Delivery Delay",
        "severity": "low",
        "status": "monitoring",
        "service": "notification-service",
        "estimated_revenue_impact_daily": 0.0,
        "correlation_confidence": 0.42,
        "affected_customer_count": 0,
        "summary": (
            "Transactional email delivery delayed by 8–15 minutes. "
            "SendGrid queue backlog; no data loss."
        ),
    },
    {
        "title": "Analytics Pipeline Data Freshness Degraded",
        "severity": "medium",
        "status": "investigating",
        "service": "analytics-pipeline",
        "estimated_revenue_impact_daily": 0.0,
        "correlation_confidence": 0.33,
        "affected_customer_count": 5,
        "summary": (
            "Hourly ETL job exceeded time window. Dashboard metrics "
            "show data up to 3 hours old. Affecting enterprise SLA customers."
        ),
    },
    {
        "title": "Billing Service Invoice Generation Lag",
        "severity": "medium",
        "status": "resolved",
        "service": "billing-service",
        "estimated_revenue_impact_daily": 500.0,
        "correlation_confidence": 0.60,
        "affected_customer_count": 22,
        "summary": (
            "Month-end invoice batch job ran 4h over schedule due to "
            "unindexed query added in v2.11.0. Patched; rerunning."
        ),
    },
    {
        "title": "Payment Processor Webhook Delivery Failures",
        "severity": "high",
        "status": "resolved",
        "service": "payment-processor",
        "estimated_revenue_impact_daily": 6_200.0,
        "correlation_confidence": 0.82,
        "affected_customer_count": 67,
        "summary": (
            "Stripe webhooks failing with HTTP 408 on our receiver. "
            "Root cause: nginx upstream timeout too aggressive (5s)."
        ),
    },
]


class IncidentGenerator(BaseGenerator):
    """
    Generates operational incident records.

    The canonical demo incident is always at index 0; background incidents
    follow in descending estimated-revenue-impact order.
    """

    def generate(self, count: int = 0) -> list[dict[str, Any]]:  # type: ignore[override]
        """
        Generate incident records.

        Parameters
        ----------
        count : int
            Ignored — the full set (1 demo + 7 background) is always returned
            to keep the dashboard KPIs consistent.

        Returns
        -------
        list[dict[str, Any]]
            All incident records, demo incident first.
        """
        rng = random.Random(self.seed)

        deployment_time = self.past_datetime(1.5)  # 90 min ago

        # --- Demo / primary incident ---
        demo_incident: dict[str, Any] = {
            "id": "inc_checkout_abc123f",
            "title": "Checkout Service Payment Failure - Deployment abc123f",
            "severity": "critical",
            "status": "active",
            "service": "checkout-service",
            "root_cause_deployment": "abc123f",
            "correlation_confidence": 0.94,
            "estimated_revenue_impact_daily": 42_000.0,
            "estimated_revenue_impact_monthly": 42_000.0 * 30,
            "affected_customer_count": 424,
            "affected_enterprise_count": 3,
            "affected_premium_count": 421,
            "summary": (
                "Payment processing failures spiked 340% immediately after "
                "deployment abc123f on checkout-service. 89 Stripe payment "
                "intents failed in the first 55 minutes. 70% of failures "
                "classified as processing_error — strongly correlated with "
                "the Stripe webhook retry logic change in PR #2847."
            ),
            "detected_at": self.iso(self.past_datetime_from(deployment_time, -5)),   # T+5 min
            "opened_at": self.iso(self.past_datetime_from(deployment_time, -6.5)),   # T+6.5 min
            "last_updated_at": self.iso(self.past_datetime(0.1)),
            "assigned_to": "alice.chen",
            "runbook_url": "https://wiki.company.internal/runbooks/checkout-payment-failure",
            "postmortem_url": None,
            "tags": ["deployment-caused", "stripe", "checkout", "revenue-critical"],
            "timeline": [
                {
                    "ts": self.iso(deployment_time),
                    "event": "Deployment abc123f pushed to production",
                    "actor": "alice.chen",
                    "type": "deployment",
                },
                {
                    "ts": self.iso(self.past_datetime_from(deployment_time, -5)),
                    "event": "Sentry alert: PaymentProcessor.process() raised TimeoutError (×12)",
                    "actor": "system",
                    "type": "alert",
                },
                {
                    "ts": self.iso(self.past_datetime_from(deployment_time, -10)),
                    "event": "Stripe payment failure rate crossed 5% threshold",
                    "actor": "system",
                    "type": "metric",
                },
                {
                    "ts": self.iso(self.past_datetime_from(deployment_time, -20)),
                    "event": "Zendesk ticket surge: 15 tickets in 10 minutes",
                    "actor": "system",
                    "type": "support",
                },
                {
                    "ts": self.iso(self.past_datetime_from(deployment_time, -6.5)),
                    "event": "Revenue Leak Radar auto-correlated incident (confidence 0.94)",
                    "actor": "rlr-engine",
                    "type": "correlation",
                },
            ],
            "recommended_actions": [
                {
                    "priority": 1,
                    "action": "Rollback deployment abc123f on checkout-service",
                    "estimated_recovery_minutes": 5,
                    "risk": "low",
                },
                {
                    "priority": 2,
                    "action": "Retry 89 failed Stripe payment intents via reconciliation job",
                    "estimated_recovery_minutes": 30,
                    "risk": "medium",
                },
                {
                    "priority": 3,
                    "action": "Proactively notify 3 enterprise customers (SLA breach risk)",
                    "estimated_recovery_minutes": 15,
                    "risk": "low",
                },
            ],
        }

        incidents: list[dict[str, Any]] = [demo_incident]

        # --- Background incidents ---
        hours_offsets = [3.0, 6.5, 12.0, 18.0, 24.0, 36.0, 48.0]
        for i, bg in enumerate(_BACKGROUND_INCIDENTS):
            h_ago = hours_offsets[i % len(hours_offsets)]
            inc_id = str(uuid.UUID(int=rng.getrandbits(128)))[:8]

            entry: dict[str, Any] = {
                "id": f"inc_{inc_id}",
                **bg,
                "root_cause_deployment": None,
                "estimated_revenue_impact_monthly": bg["estimated_revenue_impact_daily"] * 30,
                "detected_at": self.iso(self.past_datetime(h_ago + rng.uniform(0, 0.5))),
                "opened_at": self.iso(self.past_datetime(h_ago)),
                "last_updated_at": self.iso(self.past_datetime(rng.uniform(0.1, h_ago))),
                "assigned_to": rng.choice(["bob.martinez", "carol.johnson", "dan.kim", "eve.okafor"]),
                "runbook_url": f"https://wiki.company.internal/runbooks/{bg['service']}",
                "postmortem_url": (
                    f"https://wiki.company.internal/postmortems/inc_{inc_id}"
                    if bg["status"] == "resolved" else None
                ),
                "tags": [bg["service"], bg["severity"]],
                "timeline": [],
                "recommended_actions": [],
            }
            incidents.append(entry)

        return incidents
