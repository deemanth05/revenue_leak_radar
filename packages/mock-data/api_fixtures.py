"""
api_fixtures.py — Mock API responses for Revenue Leak Radar.

Used when AI_MOCK_MODE=true or when developing the frontend without
a running backend. All functions return properly typed dicts that match
the TypeScript type definitions in packages/shared/types/.

Functions
---------
  get_mock_incidents()         -> list[dict]   8 incidents, revenue-impact order
  get_mock_dashboard_kpis()    -> dict          KPI summary numbers
  get_mock_system_health()     -> dict          Per-service health statuses
  get_mock_timeline_events()   -> list[dict]    Ordered event stream (demo scenario)
"""

from __future__ import annotations

from datetime import datetime, timezone

# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _utcnow() -> str:
    """Return current UTC time as ISO-8601 string."""
    return datetime.now(tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _minutes_ago(n: float) -> str:
    from datetime import timedelta
    dt = datetime.now(tz=timezone.utc) - timedelta(minutes=n)
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def _hours_ago(n: float) -> str:
    from datetime import timedelta
    dt = datetime.now(tz=timezone.utc) - timedelta(hours=n)
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def get_mock_incidents() -> list[dict]:
    """
    Return 8 mock incidents ordered by estimated_revenue_impact_daily descending.

    The first item is always the critical demo incident (commit abc123f).
    """
    return [
        {
            "id": "inc_checkout_abc123f",
            "title": "Checkout Service Payment Failure - Deployment abc123f",
            "severity": "critical",
            "status": "active",
            "service": "checkout-service",
            "root_cause_deployment": "abc123f",
            "correlation_confidence": 0.94,
            "estimated_revenue_impact_daily": 42_000.0,
            "estimated_revenue_impact_monthly": 1_260_000.0,
            "affected_customer_count": 424,
            "affected_enterprise_count": 3,
            "affected_premium_count": 421,
            "detected_at": _minutes_ago(85),
            "opened_at": _minutes_ago(83),
            "last_updated_at": _minutes_ago(2),
            "assigned_to": "alice.chen",
            "tags": ["deployment-caused", "stripe", "checkout", "revenue-critical"],
            "summary": (
                "Payment processing failures spiked 340% immediately after "
                "deployment abc123f on checkout-service. 89 Stripe payment "
                "intents failed in the first 55 minutes. 70% are processing_error."
            ),
            "recommended_actions": [
                {
                    "priority": 1,
                    "action": "Rollback deployment abc123f on checkout-service",
                    "estimated_recovery_minutes": 5,
                    "risk": "low",
                },
                {
                    "priority": 2,
                    "action": "Retry 89 failed payment intents via reconciliation job",
                    "estimated_recovery_minutes": 30,
                    "risk": "medium",
                },
                {
                    "priority": 3,
                    "action": "Proactively notify 3 enterprise customers",
                    "estimated_recovery_minutes": 15,
                    "risk": "low",
                },
            ],
            "metrics": {
                "payment_failures": 89,
                "support_tickets": 67,
                "alerts": 47,
                "failure_rate_percent": 34.0,
            },
        },
        {
            "id": "inc_db_connpool_001",
            "title": "Database Connection Pool Exhausted",
            "severity": "high",
            "status": "mitigated",
            "service": "api-gateway",
            "root_cause_deployment": None,
            "correlation_confidence": 0.88,
            "estimated_revenue_impact_daily": 8_500.0,
            "estimated_revenue_impact_monthly": 255_000.0,
            "affected_customer_count": 112,
            "affected_enterprise_count": 1,
            "affected_premium_count": 111,
            "detected_at": _hours_ago(6.5),
            "opened_at": _hours_ago(6.0),
            "last_updated_at": _hours_ago(1.0),
            "assigned_to": "bob.martinez",
            "tags": ["database", "connection-pool", "api-gateway"],
            "summary": "PostgreSQL connection pool hit max_connections (200). Idle connections not released after analytics query surge.",
            "recommended_actions": [],
            "metrics": {"failure_rate_percent": 8.2},
        },
        {
            "id": "inc_payment_webhook_002",
            "title": "Payment Processor Webhook Delivery Failures",
            "severity": "high",
            "status": "resolved",
            "service": "payment-processor",
            "root_cause_deployment": None,
            "correlation_confidence": 0.82,
            "estimated_revenue_impact_daily": 6_200.0,
            "estimated_revenue_impact_monthly": 186_000.0,
            "affected_customer_count": 67,
            "affected_enterprise_count": 0,
            "affected_premium_count": 67,
            "detected_at": _hours_ago(48),
            "opened_at": _hours_ago(47),
            "last_updated_at": _hours_ago(24),
            "assigned_to": "carol.johnson",
            "tags": ["webhook", "stripe", "payment-processor", "resolved"],
            "summary": "Stripe webhooks failing with HTTP 408. Root cause: nginx upstream timeout too aggressive (5s).",
            "recommended_actions": [],
            "metrics": {"failure_rate_percent": 12.5},
        },
        {
            "id": "inc_auth_timeout_003",
            "title": "Auth Service Timeout Spike",
            "severity": "high",
            "status": "investigating",
            "service": "auth-service",
            "root_cause_deployment": None,
            "correlation_confidence": 0.71,
            "estimated_revenue_impact_daily": 3_200.0,
            "estimated_revenue_impact_monthly": 96_000.0,
            "affected_customer_count": 38,
            "affected_enterprise_count": 0,
            "affected_premium_count": 38,
            "detected_at": _hours_ago(3.0),
            "opened_at": _hours_ago(3.0),
            "last_updated_at": _minutes_ago(30),
            "assigned_to": "dan.kim",
            "tags": ["auth", "latency", "redis"],
            "summary": "p99 latency on /oauth/token exceeded 2s SLA. Correlates with increased Redis eviction rate.",
            "recommended_actions": [],
            "metrics": {"failure_rate_percent": 4.1},
        },
        {
            "id": "inc_billing_invoice_004",
            "title": "Billing Service Invoice Generation Lag",
            "severity": "medium",
            "status": "resolved",
            "service": "billing-service",
            "root_cause_deployment": None,
            "correlation_confidence": 0.60,
            "estimated_revenue_impact_daily": 500.0,
            "estimated_revenue_impact_monthly": 15_000.0,
            "affected_customer_count": 22,
            "affected_enterprise_count": 0,
            "affected_premium_count": 22,
            "detected_at": _hours_ago(24),
            "opened_at": _hours_ago(24),
            "last_updated_at": _hours_ago(12),
            "assigned_to": "eve.okafor",
            "tags": ["billing", "invoices", "resolved"],
            "summary": "Month-end invoice batch job ran 4h over schedule due to unindexed query added in v2.11.0.",
            "recommended_actions": [],
            "metrics": {"failure_rate_percent": 2.3},
        },
        {
            "id": "inc_analytics_freshness_005",
            "title": "Analytics Pipeline Data Freshness Degraded",
            "severity": "medium",
            "status": "investigating",
            "service": "analytics-pipeline",
            "root_cause_deployment": None,
            "correlation_confidence": 0.33,
            "estimated_revenue_impact_daily": 0.0,
            "estimated_revenue_impact_monthly": 0.0,
            "affected_customer_count": 5,
            "affected_enterprise_count": 2,
            "affected_premium_count": 3,
            "detected_at": _hours_ago(12),
            "opened_at": _hours_ago(12),
            "last_updated_at": _hours_ago(2),
            "assigned_to": "frank.li",
            "tags": ["analytics", "etl", "sla"],
            "summary": "Hourly ETL job exceeded time window. Dashboard metrics show data up to 3 hours old.",
            "recommended_actions": [],
            "metrics": {"failure_rate_percent": 0.0},
        },
        {
            "id": "inc_cdn_cache_006",
            "title": "CDN Cache Miss Rate Elevated",
            "severity": "medium",
            "status": "monitoring",
            "service": "customer-portal",
            "root_cause_deployment": None,
            "correlation_confidence": 0.55,
            "estimated_revenue_impact_daily": 1_100.0,
            "estimated_revenue_impact_monthly": 33_000.0,
            "affected_customer_count": 0,
            "affected_enterprise_count": 0,
            "affected_premium_count": 0,
            "detected_at": _hours_ago(18),
            "opened_at": _hours_ago(18),
            "last_updated_at": _hours_ago(6),
            "assigned_to": "grace.patel",
            "tags": ["cdn", "cache", "performance"],
            "summary": "Cache hit rate dropped from 94% to 61% after static asset cache key change.",
            "recommended_actions": [],
            "metrics": {"failure_rate_percent": 0.0},
        },
        {
            "id": "inc_notify_smtp_007",
            "title": "Notification Service Email Delivery Delay",
            "severity": "low",
            "status": "monitoring",
            "service": "notification-service",
            "root_cause_deployment": None,
            "correlation_confidence": 0.42,
            "estimated_revenue_impact_daily": 0.0,
            "estimated_revenue_impact_monthly": 0.0,
            "affected_customer_count": 0,
            "affected_enterprise_count": 0,
            "affected_premium_count": 0,
            "detected_at": _hours_ago(36),
            "opened_at": _hours_ago(36),
            "last_updated_at": _hours_ago(24),
            "assigned_to": "henry.wang",
            "tags": ["email", "sendgrid", "notification"],
            "summary": "Transactional email delayed by 8–15 minutes. SendGrid queue backlog; no data loss.",
            "recommended_actions": [],
            "metrics": {"failure_rate_percent": 0.0},
        },
    ]


def get_mock_dashboard_kpis() -> dict:
    """
    Return KPI summary numbers for the main dashboard.

    These numbers are calibrated to make the demo look real:
    - MRR at a healthy $380k level (pre-incident)
    - Revenue at risk reflects live demo incident only
    """
    return {
        "generated_at": _utcnow(),
        "period": "last_30_days",

        # Revenue health
        "mrr_current": 382_400.0,
        "mrr_previous_month": 371_200.0,
        "mrr_growth_percent": 3.02,
        "arr_current": 4_588_800.0,

        # Active incidents summary
        "active_incidents": 3,
        "critical_incidents": 1,
        "high_incidents": 2,

        # Revenue at risk (live)
        "revenue_at_risk_daily": 45_200.0,       # demo incident + auth spike
        "revenue_at_risk_monthly": 1_356_000.0,
        "revenue_recovered_last_30d": 28_700.0,  # from resolved incidents

        # Payment health
        "payment_success_rate_percent": 97.1,    # degraded from 99.8% baseline
        "payment_failures_last_hour": 89,
        "stripe_error_rate_percent": 2.9,

        # Support
        "open_tickets": 94,
        "ticket_surge_active": True,
        "avg_first_reply_minutes": 14.2,

        # Alerts
        "active_sentry_alerts": 47,
        "critical_sentry_alerts": 3,
        "alerts_last_hour": 47,

        # Customers
        "total_customers": 48,
        "enterprise_customers": 7,
        "premium_customers": 15,
        "customers_at_churn_risk": 12,
        "customers_affected_by_active_incidents": 424,

        # System performance
        "p99_latency_ms": 2_840.0,               # elevated due to checkout issue
        "error_rate_percent": 3.4,
        "deployment_success_rate_percent": 92.5,

        # Correlation engine
        "incidents_auto_correlated_last_24h": 3,
        "avg_detection_time_seconds": 112.0,
        "correlation_accuracy_percent": 94.0,
    }


def get_mock_system_health() -> dict:
    """
    Return per-service health statuses for the system health panel.

    checkout-service is degraded to reflect the live demo incident.
    """
    return {
        "generated_at": _utcnow(),
        "overall_status": "degraded",
        "services": [
            {
                "name": "checkout-service",
                "status": "degraded",
                "health_score": 31,
                "uptime_percent_30d": 99.94,
                "p99_latency_ms": 6_240.0,
                "error_rate_percent": 34.0,
                "last_deploy": "abc123f",
                "last_deploy_at": _minutes_ago(90),
                "active_incidents": 1,
                "alerts": 47,
                "notes": "Degraded since deployment abc123f. Webhook retry timeout issue.",
            },
            {
                "name": "auth-service",
                "status": "degraded",
                "health_score": 68,
                "uptime_percent_30d": 99.98,
                "p99_latency_ms": 2_100.0,
                "error_rate_percent": 4.1,
                "last_deploy": None,
                "last_deploy_at": _hours_ago(8),
                "active_incidents": 1,
                "alerts": 5,
                "notes": "JWT validation p99 above SLA. Redis eviction investigation ongoing.",
            },
            {
                "name": "payment-processor",
                "status": "healthy",
                "health_score": 92,
                "uptime_percent_30d": 99.97,
                "p99_latency_ms": 340.0,
                "error_rate_percent": 0.4,
                "last_deploy": None,
                "last_deploy_at": _hours_ago(24),
                "active_incidents": 0,
                "alerts": 1,
                "notes": None,
            },
            {
                "name": "api-gateway",
                "status": "healthy",
                "health_score": 88,
                "uptime_percent_30d": 99.99,
                "p99_latency_ms": 85.0,
                "error_rate_percent": 0.2,
                "last_deploy": None,
                "last_deploy_at": _hours_ago(48),
                "active_incidents": 0,
                "alerts": 2,
                "notes": "Connection pool recovered after mitigation.",
            },
            {
                "name": "notification-service",
                "status": "healthy",
                "health_score": 95,
                "uptime_percent_30d": 99.99,
                "p99_latency_ms": 210.0,
                "error_rate_percent": 0.1,
                "last_deploy": None,
                "last_deploy_at": _hours_ago(72),
                "active_incidents": 0,
                "alerts": 1,
                "notes": "Email delay resolved. SendGrid queue cleared.",
            },
            {
                "name": "analytics-pipeline",
                "status": "degraded",
                "health_score": 72,
                "uptime_percent_30d": 99.90,
                "p99_latency_ms": 0.0,
                "error_rate_percent": 0.0,
                "last_deploy": None,
                "last_deploy_at": _hours_ago(36),
                "active_incidents": 1,
                "alerts": 3,
                "notes": "Data freshness SLA breached. ETL job 3h behind.",
            },
            {
                "name": "customer-portal",
                "status": "healthy",
                "health_score": 84,
                "uptime_percent_30d": 99.95,
                "p99_latency_ms": 520.0,
                "error_rate_percent": 0.6,
                "last_deploy": None,
                "last_deploy_at": _hours_ago(12),
                "active_incidents": 0,
                "alerts": 2,
                "notes": "CDN cache miss rate elevated but no customer impact.",
            },
            {
                "name": "billing-service",
                "status": "healthy",
                "health_score": 97,
                "uptime_percent_30d": 99.99,
                "p99_latency_ms": 180.0,
                "error_rate_percent": 0.05,
                "last_deploy": None,
                "last_deploy_at": _hours_ago(18),
                "active_incidents": 0,
                "alerts": 0,
                "notes": "Invoice generation backlog resolved.",
            },
        ],
    }


def get_mock_timeline_events() -> list[dict]:
    """
    Return an ordered event stream for the demo scenario.

    Events are sorted oldest-first so the frontend can replay them
    or display them in a timeline component.
    """
    t0 = _minutes_ago(90)   # deployment time

    def at(minutes_after: float) -> str:
        from datetime import timedelta
        base = datetime.now(tz=timezone.utc) - timedelta(minutes=90 - minutes_after)
        return base.strftime("%Y-%m-%dT%H:%M:%SZ")

    return [
        {
            "id": "ev_001",
            "timestamp": t0,
            "t_offset_minutes": 0,
            "type": "deployment",
            "severity": "info",
            "title": "Deployment abc123f pushed to production",
            "description": "feat(checkout): add retry logic for Stripe webhook delivery (PR #2847)",
            "actor": "alice.chen",
            "service": "checkout-service",
            "metadata": {
                "commit_hash": "abc123f",
                "branch": "main",
                "pr_number": 2847,
                "files_changed": 12,
            },
        },
        {
            "id": "ev_002",
            "timestamp": at(5),
            "t_offset_minutes": 5,
            "type": "alert",
            "severity": "critical",
            "title": "Sentry: PaymentProcessor.process() raised TimeoutError ×12",
            "description": "Error rate crossed critical threshold. Stack: checkout_service/payment/processor.py:187",
            "actor": "sentry",
            "service": "checkout-service",
            "metadata": {
                "sentry_issue_id": "CHECKOUT-1400",
                "error_count": 12,
                "fingerprint": "checkout-service-timeout-error-payment-processor",
            },
        },
        {
            "id": "ev_003",
            "timestamp": at(7),
            "t_offset_minutes": 7,
            "type": "alert",
            "severity": "critical",
            "title": "Sentry: CheckoutService HTTP 500 rate 340/min",
            "description": "HTTP 500 error rate spiked to 340/min on /api/v1/checkout/complete",
            "actor": "sentry",
            "service": "checkout-service",
            "metadata": {
                "sentry_issue_id": "CHECKOUT-1401",
                "error_rate": 340,
                "endpoint": "/api/v1/checkout/complete",
            },
        },
        {
            "id": "ev_004",
            "timestamp": at(9),
            "t_offset_minutes": 9,
            "type": "alert",
            "severity": "critical",
            "title": "Sentry: Stripe API response time > 5000ms",
            "description": "p99 Stripe API latency: 6240ms (SLA: 2000ms). Performance threshold exceeded.",
            "actor": "sentry",
            "service": "checkout-service",
            "metadata": {
                "sentry_issue_id": "CHECKOUT-1402",
                "p99_latency_ms": 6240,
                "threshold_ms": 5000,
            },
        },
        {
            "id": "ev_005",
            "timestamp": at(10),
            "t_offset_minutes": 10,
            "type": "payment",
            "severity": "critical",
            "title": "Stripe: payment failure rate crossed 5% threshold",
            "description": "89 PaymentIntent failures detected. 70% classified as processing_error.",
            "actor": "stripe-webhook",
            "service": "payment-processor",
            "metadata": {
                "failure_count": 89,
                "failure_rate_percent": 34.0,
                "dominant_reason": "processing_error",
                "estimated_lost_revenue": 42_873.50,
            },
        },
        {
            "id": "ev_006",
            "timestamp": at(10),
            "t_offset_minutes": 10,
            "type": "support",
            "severity": "high",
            "title": "Zendesk: first support tickets arrive",
            "description": "Subjects: 'Payment failed', 'Cannot complete purchase', 'Error during checkout'",
            "actor": "customers",
            "service": "zendesk",
            "metadata": {
                "ticket_count_initial": 5,
                "priority_distribution": {"urgent": 2, "high": 3},
            },
        },
        {
            "id": "ev_007",
            "timestamp": at(15),
            "t_offset_minutes": 15,
            "type": "correlation",
            "severity": "critical",
            "title": "Revenue Leak Radar: auto-correlation triggered",
            "description": "Correlated 3 Sentry alerts + 89 payment failures + 10 support tickets → deployment abc123f",
            "actor": "rlr-engine",
            "service": "rlr",
            "metadata": {
                "signals_correlated": ["sentry", "stripe", "zendesk"],
                "correlation_confidence": 0.94,
                "root_cause": "abc123f",
                "detection_time_seconds": 90,
            },
        },
        {
            "id": "ev_008",
            "timestamp": at(15.5),
            "t_offset_minutes": 15.5,
            "type": "incident",
            "severity": "critical",
            "title": "Revenue Leak Radar: incident created (inc_checkout_abc123f)",
            "description": "Critical incident opened. Estimated impact: $42,000/day. 424 customers affected.",
            "actor": "rlr-engine",
            "service": "rlr",
            "metadata": {
                "incident_id": "inc_checkout_abc123f",
                "estimated_revenue_impact_daily": 42_000.0,
                "affected_customers": 424,
                "correlation_confidence": 0.94,
            },
        },
        {
            "id": "ev_009",
            "timestamp": at(16),
            "t_offset_minutes": 16,
            "type": "recommendation",
            "severity": "info",
            "title": "RLR recommendation: rollback abc123f (5min, low risk)",
            "description": "Recommended action #1: Rollback deployment abc123f to restore checkout-service baseline.",
            "actor": "rlr-engine",
            "service": "rlr",
            "metadata": {
                "action": "rollback",
                "target_commit": "abc123f",
                "estimated_recovery_minutes": 5,
                "risk": "low",
            },
        },
        {
            "id": "ev_010",
            "timestamp": at(20),
            "t_offset_minutes": 20,
            "type": "support",
            "severity": "high",
            "title": "Zendesk surge: 15 new tickets in 10 minutes",
            "description": "Ticket volume accelerating. 67 total tickets now linked to incident.",
            "actor": "customers",
            "service": "zendesk",
            "metadata": {
                "total_tickets": 67,
                "surge_rate": "15/10min",
                "linked_incident_id": "inc_checkout_abc123f",
            },
        },
        {
            "id": "ev_011",
            "timestamp": at(25),
            "t_offset_minutes": 25,
            "type": "customer",
            "severity": "high",
            "title": "3 enterprise SLA customers flagged for proactive notification",
            "description": "Enterprise accounts at SLA breach risk. 30-minute notification window active.",
            "actor": "rlr-engine",
            "service": "rlr",
            "metadata": {
                "enterprise_count": 3,
                "sla_breach_risk": True,
                "notification_window_minutes": 30,
            },
        },
    ]
