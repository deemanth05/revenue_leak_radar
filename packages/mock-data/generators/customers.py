"""
customers.py — Generates realistic B2B SaaS customer accounts.

Tier distribution
-----------------
  Enterprise : 5–10  accounts  | MRR $5,000–$50,000 | SLA = True
  Premium    : 10–20 accounts  | MRR $500–$5,000    | SLA = False
  Standard   : 20–50 accounts  | MRR $50–$500       | SLA = False
  Trial      : 5–10  accounts  | MRR $0             | SLA = False

The first 3 enterprise customers and first 421 premium customers are
flagged as 'affected' by the demo incident (commit abc123f).
"""

import random
import uuid
from datetime import timezone
from typing import Any

from .base import BaseGenerator


# ---------------------------------------------------------------------------
# Realistic B2B company name components
# ---------------------------------------------------------------------------

_COMPANY_PREFIXES = [
    "Apex", "Atlas", "Beacon", "Blue", "Bridge", "Cascade", "Cedar",
    "Clarity", "Cloud", "Cobalt", "Crest", "Crystal", "Cyber", "Delta",
    "Echo", "Edge", "Elevate", "Ember", "Epoch", "Falcon", "Finch",
    "Forge", "Frontier", "Fusion", "Granite", "Harbor", "Helix", "Horizon",
    "Ionic", "Iron", "Ivy", "Jade", "Keystone", "Kite", "Lancer", "Lattice",
    "Layer", "Leaf", "Lighthouse", "Lynx", "Maple", "Matrix", "Mercury",
    "Mesa", "Meteor", "Mosaic", "Nautilus", "Nexus", "Nordic", "Nova",
    "Obsidian", "Omega", "Onyx", "Opal", "Orbit", "Pacific", "Parallax",
    "Peak", "Pinnacle", "Pioneer", "Pixel", "Prism", "Pulse", "Quartz",
    "Quest", "Radiant", "Raven", "Redwood", "Relay", "Ridge", "River",
    "Sage", "Sapphire", "Signal", "Silver", "Slate", "Solar", "Solstice",
    "Spark", "Spectrum", "Sprint", "Sterling", "Stone", "Summit", "Swift",
    "Synapse", "Synergy", "Talon", "Teal", "Terra", "Titan", "Toggle",
    "Torchlight", "Trellis", "Trident", "Trinity", "Tungsten", "Vault",
    "Vector", "Vela", "Vertex", "Vex", "Vibe", "Vision", "Vista", "Vortex",
    "Wave", "Waypoint", "Willow", "Wolf", "Xero", "Zeal", "Zenith", "Zero",
]

_COMPANY_SUFFIXES = [
    "AI", "Analytics", "Capital", "Cloud", "Commerce", "Connect",
    "Core", "Data", "Digital", "Dynamics", "Edge", "Engine", "Finance",
    "Flow", "Global", "Grid", "Group", "Hub", "Infra", "Insights",
    "Intelligence", "IO", "IQ", "Lab", "Labs", "Link", "Logic",
    "Market", "Media", "Mind", "Network", "Networks", "Ops", "Pay",
    "Payments", "Platform", "Platforms", "Pulse", "Scale", "Solutions",
    "Stack", "Studio", "Studios", "Systems", "Tech", "Technologies",
    "Ventures", "Works",
]

_INDUSTRIES = [
    "E-Commerce", "FinTech", "HealthTech", "EdTech", "MarTech",
    "HRTech", "LegalTech", "PropTech", "InsurTech", "RetailTech",
    "B2B SaaS", "DevOps", "CyberSecurity", "Data Analytics", "Logistics",
]

_REGIONS = [
    "us-east-1", "us-west-2", "eu-west-1", "eu-central-1",
    "ap-southeast-1", "ap-northeast-1", "ca-central-1",
]


def _make_company_name(rng: random.Random) -> str:
    prefix = rng.choice(_COMPANY_PREFIXES)
    suffix = rng.choice(_COMPANY_SUFFIXES)
    # Avoid identical prefix+suffix combos looking silly
    if prefix == suffix:
        suffix = rng.choice(_COMPANY_SUFFIXES)
    return f"{prefix} {suffix}"


class CustomerGenerator(BaseGenerator):
    """
    Generates a full customer roster for the Revenue Leak Radar demo.

    The ``generate()`` method ignores ``count`` and always produces the
    full tiered roster for consistency with the demo scenario.
    """

    def generate(self, count: int = 0) -> list[dict[str, Any]]:  # type: ignore[override]
        """
        Generate the complete customer roster.

        Parameters
        ----------
        count : int
            Ignored — the roster size is derived from tier ranges.

        Returns
        -------
        list[dict[str, Any]]
            All generated customer records, sorted by MRR descending.
        """
        rng = random.Random(self.seed)

        customers: list[dict[str, Any]] = []

        # Tier specs: (tier_name, count, mrr_min, mrr_max, is_sla)
        tier_specs = [
            ("enterprise", rng.randint(5, 10),   5_000,  50_000, True),
            ("premium",    rng.randint(10, 20),     500,   5_000, False),
            ("standard",   rng.randint(20, 50),      50,     500, False),
            ("trial",      rng.randint(5, 10),         0,       0, False),
        ]

        # Track how many enterprise/premium are 'demo-affected'
        enterprise_affected = 0
        premium_affected = 0

        for tier, n, mrr_min, mrr_max, is_sla in tier_specs:
            for i in range(n):
                customer_id = str(uuid.UUID(int=rng.getrandbits(128)))
                company = _make_company_name(rng)
                mrr = round(rng.uniform(mrr_min, mrr_max), 2) if mrr_max > 0 else 0.0
                arr = round(mrr * 12, 2)

                # Demo-scenario: flag enterprise & premium customers as affected
                affected = False
                if tier == "enterprise" and enterprise_affected < 3:
                    affected = True
                    enterprise_affected += 1
                elif tier == "premium" and premium_affected < 421:
                    affected = True
                    premium_affected += 1

                # Realistic churn risk based on MRR band
                churn_score = round(rng.uniform(0.05, 0.30) if mrr > 1_000
                                    else rng.uniform(0.10, 0.55), 2)

                joined_days_ago = rng.randint(30, 1_460)  # 1 month – 4 years
                joined_at = self.past_datetime(joined_days_ago * 24)

                customers.append({
                    "id": customer_id,
                    "company_name": company,
                    "tier": tier,
                    "mrr": mrr,
                    "arr": arr,
                    "industry": rng.choice(_INDUSTRIES),
                    "region": rng.choice(_REGIONS),
                    "is_sla_customer": is_sla,
                    "affected_by_demo_incident": affected,
                    "churn_risk_score": churn_score,
                    "joined_at": self.iso(joined_at),
                    "account_manager": self.faker.name(),
                    "contact_email": f"ops@{company.lower().replace(' ', '')}.com",
                    "employee_count": rng.choice([
                        rng.randint(10, 50),
                        rng.randint(50, 500),
                        rng.randint(500, 5_000),
                    ]),
                    "active_seats": rng.randint(1, max(1, int(mrr / 30))) if mrr > 0 else 0,
                })

        # Sort by MRR descending (enterprise first)
        customers.sort(key=lambda c: c["mrr"], reverse=True)
        return customers
