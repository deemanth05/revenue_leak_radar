# @rlr/mock-data

Synthetic operational data generators for **Revenue Leak Radar**. All data is deterministic (seeded) so every demo run produces identical output.

---

## What This Package Does

Generates realistic, correlated mock data across five operational systems:

| System | Generator | Demo Volume |
|--------|-----------|-------------|
| Sentry (error tracking) | `AlertGenerator` | 47 alerts |
| Stripe (payments) | `PaymentFailureGenerator` | 89 failures ≈ $42k/day |
| Zendesk (support) | `SupportTicketGenerator` | 67 tickets |
| Internal incidents | `IncidentGenerator` | 1 critical + 7 background |
| Customers | `CustomerGenerator` | ~50 B2B accounts |
| Deployments | `DeploymentGenerator` | ~20 deploys |

All events are causally linked to a single deployment: **commit `abc123f`** on `checkout-service`, deployed at **T−90 min** (relative to now).

---

## Demo Scenario

```
14:32 UTC  — Deployment abc123f goes live on checkout-service (production)
14:37 UTC  — First Sentry alerts fire (PaymentProcessor.process() TimeoutError)
14:42 UTC  — Stripe payment failure rate spikes (70% are processing_error)
14:52 UTC  — Zendesk ticket surge begins (Cannot complete purchase, etc.)
14:56 UTC  — Revenue Leak Radar auto-correlates all signals (confidence: 0.94)
             Estimated impact: $42,000 / day
             Affected customers: 424 (3 enterprise + 421 premium)
```

The system detects and correlates the incident **within 90 seconds** of the first signal.

---

## Project Structure

```
packages/mock-data/
├── package.json
├── README.md
├── api_fixtures.py          # Mock API responses (AI_MOCK_MODE=true)
├── generators/
│   ├── __init__.py
│   ├── base.py              # Base generator class
│   ├── alerts.py            # Sentry alerts
│   ├── customers.py         # B2B customer accounts
│   ├── deployments.py       # GitHub-style deployments
│   ├── incidents.py         # Operational incidents
│   ├── payment_failures.py  # Stripe payment failures
│   └── support_tickets.py   # Zendesk support tickets
└── fixtures/
    └── demo_scenario.json   # Static JSON snapshot of full scenario
```

---

## Running the Generators

### Prerequisites

```bash
pip install faker
```

### Quick start — generate everything

```python
from generators.customers import CustomerGenerator
from generators.deployments import DeploymentGenerator
from generators.incidents import IncidentGenerator
from generators.payment_failures import PaymentFailureGenerator
from generators.support_tickets import SupportTicketGenerator
from generators.alerts import AlertGenerator

customers   = CustomerGenerator(seed=42).generate()
deployments = DeploymentGenerator(seed=42).generate()
incidents   = IncidentGenerator(seed=42).generate()
failures    = PaymentFailureGenerator(seed=42).generate(89)
tickets     = SupportTicketGenerator(seed=42).generate(67)
alerts      = AlertGenerator(seed=42).generate(47)
```

### Using mock API responses (frontend dev / AI_MOCK_MODE)

```python
import api_fixtures

incidents = api_fixtures.get_mock_incidents()
kpis      = api_fixtures.get_mock_dashboard_kpis()
health    = api_fixtures.get_mock_system_health()
timeline  = api_fixtures.get_mock_timeline_events()
```

---

## Reproducibility

All generators accept a `seed` parameter (default `42`). Using the same seed always produces the same data, ensuring demos are fully reproducible and comparable across environments.

```python
# Both produce identical output
gen_a = AlertGenerator(seed=42).generate(47)
gen_b = AlertGenerator(seed=42).generate(47)
assert gen_a == gen_b  # True
```
