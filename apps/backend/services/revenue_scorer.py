"""
Deterministic revenue scoring engine.

All calculations are rule-based — no LLMs involved.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from datetime import datetime, timezone
from decimal import Decimal
from typing import Sequence

from models.customer import Customer, CustomerTier
from models.incident import Incident, IncidentSeverity
from models.payment_failure import PaymentFailure
from models.support_ticket import SupportTicket


# ── Tier weights ───────────────────────────────────────────────────────────────
_TIER_WEIGHT: dict[str, float] = {
    CustomerTier.enterprise: 10.0,
    CustomerTier.premium: 3.0,
    CustomerTier.standard: 1.0,
    CustomerTier.trial: 0.1,
}

# ── Severity baseline multipliers ─────────────────────────────────────────────
_SEVERITY_WEIGHT: dict[str, float] = {
    IncidentSeverity.critical: 1.0,
    IncidentSeverity.high: 0.75,
    IncidentSeverity.medium: 0.45,
    IncidentSeverity.low: 0.15,
}


@dataclass
class RevenueImpactResult:
    """Structured result from `calculate_revenue_impact`."""

    revenue_at_risk_daily: Decimal
    revenue_at_risk_weekly: Decimal
    churn_probability: float
    affected_mrr: Decimal
    calculation_method: str
    breakdown: dict[str, object] = field(default_factory=dict)


def get_severity_multiplier(severity: str) -> float:
    """Return a 0–1 weighting for the given severity string."""
    return _SEVERITY_WEIGHT.get(severity, 0.1)


def _daily_payment_failure_rate(
    payment_failures: Sequence[PaymentFailure],
    incident: Incident,
) -> Decimal:
    """Annualise observed payment failures → daily loss rate."""
    if not payment_failures:
        return Decimal("0")

    total_failed = sum(pf.amount for pf in payment_failures)

    # Duration of incident exposure in days (floor at 1 day)
    now = datetime.now(tz=timezone.utc)
    start = incident.started_at
    if start.tzinfo is None:
        start = start.replace(tzinfo=timezone.utc)
    duration_hours = max((now - start).total_seconds() / 3600, 1.0)
    duration_days = duration_hours / 24.0

    return Decimal(str(total_failed / Decimal(str(duration_days))))


def _calculate_churn_probability(
    incident: Incident,
    payment_failures: Sequence[PaymentFailure],
    support_tickets: Sequence[SupportTicket],
    customers: Sequence[Customer],
) -> float:
    """
    Heuristic churn probability (0–1).

    Factors:
    - Support ticket surge (tickets per affected customer)
    - Payment failure rate
    - Incident duration (hours)
    - Severity
    """
    score = 0.0

    # ── Support ticket surge ───────────────────────────────────────────────
    affected = max(incident.affected_customer_count, 1)
    ticket_ratio = len(support_tickets) / affected
    score += min(ticket_ratio * 0.05, 0.25)  # max 0.25

    # ── Payment failure signal ─────────────────────────────────────────────
    pf_ratio = len(payment_failures) / affected
    score += min(pf_ratio * 0.1, 0.30)  # max 0.30

    # ── Duration pressure ──────────────────────────────────────────────────
    now = datetime.now(tz=timezone.utc)
    start = incident.started_at
    if start.tzinfo is None:
        start = start.replace(tzinfo=timezone.utc)
    duration_hours = (now - start).total_seconds() / 3600
    # Sigmoid-like: every 4h adds ≈ 0.025, capped at 0.25
    duration_score = min(0.025 * math.log1p(duration_hours / 4.0) * 4, 0.25)
    score += duration_score

    # ── Severity ───────────────────────────────────────────────────────────
    score += get_severity_multiplier(incident.severity) * 0.20

    return round(min(score, 1.0), 4)


def calculate_revenue_impact(
    incident: Incident,
    payment_failures: Sequence[PaymentFailure],
    customers: Sequence[Customer],
) -> RevenueImpactResult:
    """
    Calculate the daily and weekly revenue impact for an incident.

    Algorithm:
    1. For each affected customer, compute a tier-weighted MRR daily rate.
    2. Add the daily payment failure run-rate.
    3. Apply severity multiplier to the combined figure.
    4. Churn probability adds an additional forward-looking risk component.
    """
    support_tickets: list[SupportTicket] = []
    for c in customers:
        support_tickets.extend(c.support_tickets)

    # ── 1. Weighted MRR at risk ────────────────────────────────────────────
    total_weighted_mrr = Decimal("0")
    enterprise_mrr = Decimal("0")
    premium_mrr = Decimal("0")
    standard_mrr = Decimal("0")

    for customer in customers:
        daily_mrr = customer.mrr / Decimal("30")
        weight = Decimal(str(_TIER_WEIGHT.get(customer.tier, 1.0)))
        total_weighted_mrr += daily_mrr * weight

        if customer.tier == CustomerTier.enterprise:
            enterprise_mrr += daily_mrr
        elif customer.tier == CustomerTier.premium:
            premium_mrr += daily_mrr
        else:
            standard_mrr += daily_mrr

    # ── 2. Payment failure daily rate ──────────────────────────────────────
    pf_daily = _daily_payment_failure_rate(payment_failures, incident)

    # ── 3. Severity multiplier ─────────────────────────────────────────────
    sev_mult = Decimal(str(get_severity_multiplier(incident.severity)))

    base_daily = (total_weighted_mrr + pf_daily) * sev_mult

    # ── 4. Churn risk premium ──────────────────────────────────────────────
    churn_prob = _calculate_churn_probability(
        incident, payment_failures, support_tickets, customers
    )
    affected_mrr = sum((c.mrr for c in customers), Decimal("0"))
    churn_risk_daily = affected_mrr * Decimal(str(churn_prob)) / Decimal("30")

    revenue_at_risk_daily = (base_daily + churn_risk_daily).quantize(Decimal("0.01"))
    revenue_at_risk_weekly = (revenue_at_risk_daily * 7).quantize(Decimal("0.01"))

    return RevenueImpactResult(
        revenue_at_risk_daily=revenue_at_risk_daily,
        revenue_at_risk_weekly=revenue_at_risk_weekly,
        churn_probability=churn_prob,
        affected_mrr=affected_mrr.quantize(Decimal("0.01")),
        calculation_method="weighted_mrr_v1",
        breakdown={
            "enterprise_mrr_daily": str(enterprise_mrr.quantize(Decimal("0.01"))),
            "premium_mrr_daily": str(premium_mrr.quantize(Decimal("0.01"))),
            "standard_mrr_daily": str(standard_mrr.quantize(Decimal("0.01"))),
            "payment_failure_daily": str(pf_daily.quantize(Decimal("0.01"))),
            "churn_risk_daily": str(churn_risk_daily.quantize(Decimal("0.01"))),
            "severity_multiplier": str(sev_mult),
            "payment_failures_count": len(payment_failures),
            "affected_customers_count": len(customers),
        },
    )


def calculate_incident_priority_score(
    incident: Incident,
    revenue_event: "RevenueImpactResult | None" = None,
) -> float:
    """
    Return a 0–100 priority score for the incident.

    Weights:
    - Revenue impact  40 %
    - Severity        30 %
    - Customer tier   20 %  (based on affected_customer_count proxy)
    - Duration        10 %
    """
    # ── Revenue component (40) ─────────────────────────────────────────────
    if revenue_event and revenue_event.revenue_at_risk_daily > 0:
        # Log-scale: $10k/day → 40 pts, $1M → ~80 pts clipped to 40
        rev_score = min(math.log10(float(revenue_event.revenue_at_risk_daily) + 1) * 10, 40.0)
    else:
        daily = float(incident.estimated_revenue_impact_daily or 0)
        rev_score = min(math.log10(daily + 1) * 10, 40.0) if daily > 0 else 0.0

    # ── Severity component (30) ────────────────────────────────────────────
    sev_score = get_severity_multiplier(incident.severity) * 30.0

    # ── Customer tier component (20) ───────────────────────────────────────
    # Proxy: affected_customer_count scaled; >100 gets full 20 pts
    affected = incident.affected_customer_count or 0
    tier_score = min(affected / 100 * 20, 20.0)

    # ── Duration component (10) ────────────────────────────────────────────
    now = datetime.now(tz=timezone.utc)
    start = incident.started_at
    if start.tzinfo is None:
        start = start.replace(tzinfo=timezone.utc)
    hours = (now - start).total_seconds() / 3600
    # Each hour adds ~0.5 pts, capped at 10
    dur_score = min(hours * 0.5, 10.0)

    total = rev_score + sev_score + tier_score + dur_score
    return round(min(total, 100.0), 2)
