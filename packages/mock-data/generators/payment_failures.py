"""
payment_failures.py — Generates Stripe-style payment failure records.

Demo scenario
-------------
89 failures clustered between T+5min and T+60min after deployment abc123f.
  • 70% are 'processing_error' — the smoking-gun signal of the bad deploy
  • Amounts range $50–$2,000 per transaction
  • Total estimated daily revenue risk: ~$42,000

Each record mimics a real Stripe PaymentIntent failure event.
"""

import random
import string
import uuid
from typing import Any

from .base import BaseGenerator


_FAILURE_REASONS = [
    # (reason_code, weight, stripe_decline_code, user_message)
    ("processing_error",    70, "processing_error",
     "An error occurred while processing your payment. Please try again."),
    ("card_declined",       12, "generic_decline",
     "Your card was declined."),
    ("insufficient_funds",   8, "insufficient_funds",
     "Your card has insufficient funds."),
    ("timeout",             10, "processing_error",
     "The payment request timed out. Please retry."),
]

_CURRENCIES = ["usd", "usd", "usd", "usd", "eur", "gbp", "cad"]  # weighted USD

_PAYMENT_METHODS = [
    "card", "card", "card", "card", "card",
    "us_bank_account",
    "sepa_debit",
]

_CARD_BRANDS = ["visa", "mastercard", "amex", "discover"]

_CHECKOUT_ENDPOINTS = [
    "/api/v1/checkout/complete",
    "/api/v1/checkout/confirm",
    "/api/v1/orders/pay",
    "/api/v2/checkout/process",
]


def _random_pi_id(rng: random.Random) -> str:
    """Generate a realistic Stripe PaymentIntent ID."""
    chars = string.ascii_letters + string.digits
    return "pi_" + "".join(rng.choice(chars) for _ in range(24))


def _random_customer_id(rng: random.Random) -> str:
    chars = string.ascii_letters + string.digits
    return "cus_" + "".join(rng.choice(chars) for _ in range(16))


def _pick_failure_reason(rng: random.Random) -> tuple[str, str, str]:
    """Weighted selection of (reason_code, decline_code, user_message)."""
    total = sum(w for _, w, _, _ in _FAILURE_REASONS)
    r = rng.uniform(0, total)
    cumulative = 0.0
    for code, weight, decline_code, message in _FAILURE_REASONS:
        cumulative += weight
        if r <= cumulative:
            return code, decline_code, message
    last = _FAILURE_REASONS[-1]
    return last[0], last[2], last[3]


class PaymentFailureGenerator(BaseGenerator):
    """
    Generates Stripe payment failure events correlated with deployment abc123f.

    By default generates 89 records (the demo count), but accepts any count.
    """

    def generate(self, count: int = 89) -> list[dict[str, Any]]:
        """
        Generate payment failure records.

        Parameters
        ----------
        count : int
            Number of failure events to generate (default 89 for demo).

        Returns
        -------
        list[dict[str, Any]]
            Payment failure records ordered chronologically (oldest first).
        """
        rng = random.Random(self.seed)
        deployment_time = self.past_datetime(1.5)  # abc123f deployed 90 min ago

        failures: list[dict[str, Any]] = []

        for i in range(count):
            # Cluster failures between T+5min and T+60min
            minutes_after_deploy = rng.uniform(5, 60)
            failed_at = self.past_datetime_from(deployment_time, -minutes_after_deploy)

            reason_code, decline_code, user_message = _pick_failure_reason(rng)
            amount_cents = rng.randint(5_000, 200_000)   # $50 – $2,000 in cents
            currency = rng.choice(_CURRENCIES)
            payment_method = rng.choice(_PAYMENT_METHODS)

            record: dict[str, Any] = {
                "id": str(uuid.UUID(int=rng.getrandbits(128))),
                "stripe_payment_intent_id": _random_pi_id(rng),
                "stripe_customer_id": _random_customer_id(rng),
                "amount_cents": amount_cents,
                "amount_display": f"${amount_cents / 100:,.2f}",
                "currency": currency,
                "failure_reason": reason_code,
                "stripe_decline_code": decline_code,
                "user_facing_message": user_message,
                "payment_method_type": payment_method,
                "failed_at": self.iso(failed_at),
                "minutes_after_deployment": round(minutes_after_deploy, 1),
                "correlated_deployment": "abc123f",
                "endpoint": rng.choice(_CHECKOUT_ENDPOINTS),
                "http_status": 402 if reason_code != "timeout" else 504,
                "retry_count": rng.randint(0, 2),
                "retriable": reason_code in ("processing_error", "timeout"),
                "metadata": {
                    "deployment_correlated": True,
                    "source": "stripe-webhook",
                    "region": rng.choice(["us-east-1", "us-west-2", "eu-west-1"]),
                },
            }

            if payment_method == "card":
                record["card_brand"] = rng.choice(_CARD_BRANDS)
                record["card_last4"] = str(rng.randint(1000, 9999))
                record["card_country"] = rng.choice(["US", "US", "US", "GB", "CA", "DE", "AU"])

            failures.append(record)

        # Sort chronologically
        failures.sort(key=lambda f: f["failed_at"])
        return failures
