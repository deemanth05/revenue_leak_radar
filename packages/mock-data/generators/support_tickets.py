"""
support_tickets.py — Generates Zendesk-style support ticket records.

Demo scenario
-------------
67 tickets surge beginning T+10min after deployment abc123f.
  • Subject pool: payment-related frustration phrases
  • Priority: 20% urgent | 40% high | 30% normal | 10% low
  • Source: mostly zendesk (web/email fallback)

Ticket volume mirrors the payment failure spike, with a realistic
10-minute lag (customers trying first, then contacting support).
"""

import random
import uuid
from typing import Any

from .base import BaseGenerator


_SUBJECTS = [
    "Payment failed",
    "Cannot complete purchase",
    "Error during checkout",
    "Transaction declined",
    "My order won't go through",
    "Checkout is broken",
    "Keep getting payment error",
    "Card getting declined but funds available",
    "Unable to complete payment",
    "Purchase error - please help",
    "Payment processing error on checkout",
    "Getting 'payment failed' message",
    "Can't pay for my subscription",
    "Renewal payment failed",
    "Upgrade payment not working",
]

_BODY_TEMPLATES = [
    (
        "Hi, I've been trying to {action} for the past {minutes} minutes "
        "and keep getting an error that says '{error_msg}'. "
        "I've tried {retry_times} times. Please help!"
    ),
    (
        "Hello, I'm getting a payment error every time I try to {action}. "
        "The error says '{error_msg}'. My card details are correct — "
        "I've double-checked. This is urgent as I need access now."
    ),
    (
        "I'm unable to {action}. The website shows '{error_msg}'. "
        "I've cleared my cache and tried a different browser. "
        "Same issue. Please investigate."
    ),
    (
        "Hi team, getting a '{error_msg}' error when trying to {action}. "
        "Order total is ${amount}. Please advise ASAP."
    ),
]

_ACTIONS = [
    "complete my purchase", "upgrade my plan", "pay for my subscription",
    "add my payment method", "renew my account", "complete checkout",
    "process my order",
]

_ERROR_MESSAGES = [
    "An error occurred while processing your payment. Please try again.",
    "Payment failed. Please check your payment details.",
    "Your card was declined.",
    "Transaction declined — please contact your bank.",
    "Payment processing error. Please retry.",
    "Something went wrong. Please try again later.",
]

_RETRY_TIMES = ["2", "3", "4", "5", "several"]
_MINUTES_STRUGGLING = ["5", "10", "15", "20", "30"]

_PRIORITIES = [
    ("urgent", 20),
    ("high", 40),
    ("normal", 30),
    ("low", 10),
]

_SOURCES = [
    ("zendesk", 70),
    ("email", 20),
    ("web", 10),
]

_AGENT_NAMES = [
    "Sarah K.", "James L.", "Maria G.", "Tom B.", "Priya S.",
    "Alex M.", "Chen W.", "Fatima A.",
]

_TAGS = [
    ["payment", "checkout", "urgent"],
    ["billing", "payment-failure"],
    ["checkout", "card-declined"],
    ["payment", "deployment-impact"],
    ["subscription", "renewal", "failed"],
]


def _weighted_choice(rng: random.Random, options: list[tuple]) -> str:
    total = sum(w for _, w in options)
    r = rng.uniform(0, total)
    cumulative = 0.0
    for value, weight in options:
        cumulative += weight
        if r <= cumulative:
            return value
    return options[-1][0]


class SupportTicketGenerator(BaseGenerator):
    """
    Generates support ticket records mimicking a Zendesk surge.

    By default generates 67 records (demo scenario count).
    """

    def generate(self, count: int = 67) -> list[dict[str, Any]]:
        """
        Generate support ticket records.

        Parameters
        ----------
        count : int
            Number of tickets to generate (default 67 for demo).

        Returns
        -------
        list[dict[str, Any]]
            Ticket records ordered chronologically (oldest first).
        """
        rng = random.Random(self.seed)
        deployment_time = self.past_datetime(1.5)  # T=0

        tickets: list[dict[str, Any]] = []

        for i in range(count):
            # Tickets start arriving T+10min, peak around T+20–40min
            minutes_after_deploy = rng.uniform(10, 80)
            created_at = self.past_datetime_from(deployment_time, -minutes_after_deploy)

            # Some tickets already have replies
            has_reply = rng.random() > 0.6
            first_reply_minutes = rng.uniform(5, 45) if has_reply else None
            first_reply_at = (
                self.past_datetime_from(created_at, -first_reply_minutes)
                if first_reply_minutes else None
            )

            priority = _weighted_choice(rng, _PRIORITIES)
            source = _weighted_choice(rng, _SOURCES)
            subject = rng.choice(_SUBJECTS)
            action = rng.choice(_ACTIONS)
            error_msg = rng.choice(_ERROR_MESSAGES)
            amount = rng.randint(20, 500)

            body_template = rng.choice(_BODY_TEMPLATES)
            body = body_template.format(
                action=action,
                minutes=rng.choice(_MINUTES_STRUGGLING),
                error_msg=error_msg,
                retry_times=rng.choice(_RETRY_TIMES),
                amount=amount,
            )

            ticket: dict[str, Any] = {
                "id": f"ZD-{rng.randint(100_000, 999_999)}",
                "uuid": str(uuid.UUID(int=rng.getrandbits(128))),
                "subject": subject,
                "body": body,
                "priority": priority,
                "status": rng.choice(["open", "open", "open", "pending", "solved"]),
                "source": source,
                "created_at": self.iso(created_at),
                "updated_at": self.iso(
                    self.past_datetime_from(created_at, -rng.uniform(0, 30))
                ),
                "first_reply_at": self.iso(first_reply_at) if first_reply_at else None,
                "minutes_after_deployment": round(minutes_after_deploy, 1),
                "correlated_deployment": "abc123f",
                "requester_name": self.faker.name(),
                "requester_email": self.faker.email(),
                "assigned_agent": rng.choice(_AGENT_NAMES) if has_reply else None,
                "tags": rng.choice(_TAGS),
                "satisfaction_rating": None,
                "channel": source,
                "metadata": {
                    "deployment_correlated": True,
                    "auto_tagged": True,
                    "rlr_incident_id": "inc_checkout_abc123f",
                },
            }

            tickets.append(ticket)

        # Sort chronologically
        tickets.sort(key=lambda t: t["created_at"])
        return tickets
