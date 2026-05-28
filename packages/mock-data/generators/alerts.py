"""
alerts.py — Generates Sentry-style error alert records.

Demo scenario
-------------
47 alerts fired starting T+5min after deployment abc123f on checkout-service.
  Primary alerts (severity=critical):
    • 'PaymentProcessor.process() raised TimeoutError'
    • 'CheckoutService: HTTP 500 rate 340/min'
    • 'Stripe API response time > 5000ms'

  Background alerts (severity=warning/info) provide realistic noise.

Each record mimics a real Sentry issue event with fingerprint, stack trace
snippet, affected URLs, and error count metadata.
"""

import random
import uuid
from typing import Any

from .base import BaseGenerator


# ---------------------------------------------------------------------------
# Demo alert definitions (always injected first)
# ---------------------------------------------------------------------------

_DEMO_ALERTS = [
    {
        "title": "PaymentProcessor.process() raised TimeoutError",
        "culprit": "checkout_service.payment.processor in process",
        "severity": "critical",
        "level": "error",
        "error_type": "TimeoutError",
        "error_value": "Stripe API call timed out after 5001ms (limit: 5000ms)",
        "fingerprint": "checkout-service-timeout-error-payment-processor",
        "affected_endpoint": "/api/v1/checkout/complete",
        "stack_trace_snippet": (
            "  File \"checkout_service/payment/processor.py\", line 187, in process\n"
            "    response = stripe.PaymentIntent.confirm(intent_id, timeout=5)\n"
            "  File \"stripe/api_resources/payment_intent.py\", line 94, in confirm\n"
            "    return cls._request(cls, 'post', url, params=params, **kwargs)\n"
            "TimeoutError: Request timed out after 5001ms"
        ),
    },
    {
        "title": "CheckoutService: HTTP 500 rate 340/min",
        "culprit": "checkout_service.views.checkout in complete_order",
        "severity": "critical",
        "level": "error",
        "error_type": "InternalServerError",
        "error_value": "Unhandled exception in complete_order: TimeoutError propagated from payment layer",
        "fingerprint": "checkout-service-http-500-rate-spike",
        "affected_endpoint": "/api/v1/checkout/complete",
        "stack_trace_snippet": (
            "  File \"checkout_service/views/checkout.py\", line 312, in complete_order\n"
            "    result = payment_service.process(cart, payment_method)\n"
            "  File \"checkout_service/payment/processor.py\", line 187, in process\n"
            "    response = stripe.PaymentIntent.confirm(intent_id, timeout=5)\n"
            "InternalServerError: Unhandled exception in complete_order"
        ),
    },
    {
        "title": "Stripe API response time > 5000ms",
        "culprit": "checkout_service.integrations.stripe_client in call_api",
        "severity": "critical",
        "level": "warning",
        "error_type": "PerformanceAlert",
        "error_value": "p99 Stripe API latency: 6240ms (SLA: 2000ms)",
        "fingerprint": "checkout-service-stripe-latency-alert",
        "affected_endpoint": "stripe.com/v1/payment_intents",
        "stack_trace_snippet": (
            "Performance threshold exceeded.\n"
            "Metric: stripe_api_response_time_ms\n"
            "Value: 6240ms\n"
            "Threshold: 5000ms\n"
            "Period: 60s rolling window"
        ),
    },
]

_BACKGROUND_ALERT_TEMPLATES = [
    {
        "title": "auth_service.jwt.validator raised ExpiredSignatureError",
        "culprit": "auth_service.jwt.validator in verify_token",
        "severity": "warning",
        "level": "warning",
        "error_type": "ExpiredSignatureError",
        "affected_endpoint": "/api/v1/auth/verify",
    },
    {
        "title": "Redis connection pool timeout (api-gateway)",
        "culprit": "api_gateway.cache.redis_client in get_connection",
        "severity": "warning",
        "level": "warning",
        "error_type": "ConnectionPoolTimeout",
        "affected_endpoint": "/api/v2/products",
    },
    {
        "title": "notification-service: SMTP connection refused",
        "culprit": "notification_service.email.sender in send",
        "severity": "low",
        "level": "info",
        "error_type": "SMTPConnectError",
        "affected_endpoint": "smtp.sendgrid.net:587",
    },
    {
        "title": "billing-service: invoice PDF generation failed",
        "culprit": "billing_service.invoices.generator in render_pdf",
        "severity": "warning",
        "level": "warning",
        "error_type": "PDFRenderError",
        "affected_endpoint": "/api/v1/invoices/generate",
    },
    {
        "title": "analytics-pipeline: Spark job exceeded memory limit",
        "culprit": "analytics_pipeline.jobs.daily_revenue in run",
        "severity": "warning",
        "level": "warning",
        "error_type": "SparkOutOfMemoryError",
        "affected_endpoint": "spark://analytics-cluster:7077",
    },
    {
        "title": "customer-portal: CDN origin timeout (static assets)",
        "culprit": "customer_portal.middleware.cdn in fetch_asset",
        "severity": "low",
        "level": "info",
        "error_type": "CDNOriginTimeout",
        "affected_endpoint": "/static/bundle.js",
    },
    {
        "title": "payment-processor: webhook signature verification failed",
        "culprit": "payment_processor.webhooks.handler in verify_signature",
        "severity": "high",
        "level": "error",
        "error_type": "WebhookSignatureError",
        "affected_endpoint": "/webhooks/stripe",
    },
]

_SERVICES = [
    "checkout-service", "auth-service", "payment-processor",
    "api-gateway", "notification-service", "analytics-pipeline",
    "customer-portal", "billing-service",
]


class AlertGenerator(BaseGenerator):
    """
    Generates Sentry-style error alert records.

    The first 3 records are always the critical demo alerts tied to abc123f.
    The remainder are background noise across other services.
    """

    def generate(self, count: int = 47) -> list[dict[str, Any]]:
        """
        Generate alert records.

        Parameters
        ----------
        count : int
            Total number of alerts to generate (default 47 for demo).
            The first 3 are always the critical checkout-service alerts.

        Returns
        -------
        list[dict[str, Any]]
            Alert records ordered chronologically (oldest first).
        """
        rng = random.Random(self.seed)
        deployment_time = self.past_datetime(1.5)

        alerts: list[dict[str, Any]] = []

        # --- Demo (critical) alerts ---
        for idx, tmpl in enumerate(_DEMO_ALERTS):
            # Each critical alert fires a few minutes after deploy
            minutes_after = 5.0 + idx * 1.5
            fired_at = self.past_datetime_from(deployment_time, -minutes_after)
            event_count = rng.randint(40, 200)
            user_count = rng.randint(15, event_count)

            alert: dict[str, Any] = {
                "id": f"sentry_demo_{idx + 1:03d}",
                "sentry_issue_id": f"CHECKOUT-{1400 + idx}",
                "title": tmpl["title"],
                "culprit": tmpl["culprit"],
                "severity": tmpl["severity"],
                "level": tmpl["level"],
                "error_type": tmpl["error_type"],
                "error_value": tmpl.get("error_value", tmpl["title"]),
                "fingerprint": tmpl["fingerprint"],
                "service": "checkout-service",
                "environment": "production",
                "correlated_deployment": "abc123f",
                "first_seen": self.iso(fired_at),
                "last_seen": self.iso(self.past_datetime(0.05)),
                "fired_at": self.iso(fired_at),
                "minutes_after_deployment": round(minutes_after, 1),
                "event_count": event_count,
                "user_count": user_count,
                "affected_endpoint": tmpl["affected_endpoint"],
                "stack_trace_snippet": tmpl.get("stack_trace_snippet", ""),
                "status": "unresolved",
                "is_regression": False,
                "assignee": "alice.chen",
                "tags": {
                    "release": "abc123f",
                    "environment": "production",
                    "server_name": rng.choice(["checkout-prod-01", "checkout-prod-02", "checkout-prod-03"]),
                },
                "metadata": {
                    "deployment_correlated": True,
                    "rlr_incident_id": "inc_checkout_abc123f",
                    "auto_assigned": True,
                },
            }
            alerts.append(alert)

        # --- Background alerts ---
        background_count = max(0, count - len(_DEMO_ALERTS))
        for i in range(background_count):
            tmpl = rng.choice(_BACKGROUND_ALERT_TEMPLATES)
            hours_ago = rng.uniform(0.5, 24.0)
            fired_at = self.past_datetime(hours_ago)
            event_count = rng.randint(1, 80)
            service = tmpl.get("service", rng.choice(_SERVICES))

            alert = {
                "id": str(uuid.UUID(int=rng.getrandbits(128)))[:8],
                "sentry_issue_id": f"{service.upper().replace('-', '')[:8]}-{rng.randint(100, 9999)}",
                "title": tmpl["title"],
                "culprit": tmpl["culprit"],
                "severity": tmpl["severity"],
                "level": tmpl["level"],
                "error_type": tmpl["error_type"],
                "error_value": self.faker.sentence(nb_words=8),
                "fingerprint": f"{service}-{tmpl['error_type'].lower()}-{rng.randint(1000, 9999)}",
                "service": service,
                "environment": rng.choice(["production", "staging"]),
                "correlated_deployment": None,
                "first_seen": self.iso(fired_at),
                "last_seen": self.iso(self.past_datetime(rng.uniform(0.01, hours_ago))),
                "fired_at": self.iso(fired_at),
                "minutes_after_deployment": None,
                "event_count": event_count,
                "user_count": rng.randint(0, event_count),
                "affected_endpoint": tmpl["affected_endpoint"],
                "stack_trace_snippet": "",
                "status": rng.choice(["unresolved", "resolved", "ignored"]),
                "is_regression": rng.random() > 0.85,
                "assignee": None,
                "tags": {
                    "environment": "production",
                    "server_name": f"{service}-prod-{rng.randint(1, 5):02d}",
                },
                "metadata": {
                    "deployment_correlated": False,
                    "auto_assigned": False,
                },
            }
            alerts.append(alert)

        # Sort chronologically
        alerts.sort(key=lambda a: a["fired_at"])
        return alerts
