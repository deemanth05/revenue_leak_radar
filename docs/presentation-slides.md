# Revenue Leak Radar — Investor Pitch Slides
*Hackathon Demo Day & YC Pitch Presentation*

---

## Slide 1: The Opening Hook
# Which technical bug is costing your company the most money right now?
*Standard dashboards tell you CPU is high. We tell you your MRR is bleeding.*

---

## Slide 2: The Core Problem
### Disconnected SRE Monitoring vs Business Operations
- **Engineering alerts** (Sentry, Datadog) report error counts, not dollar impact.
- **Support tickets** (Zendesk, Intercom) report customer pain, not technical root cause.
- **Billing databases** (Stripe) log transaction declines, but SRE teams are blind to them.
- **The Result**: Multi-hour outages, SLA breach penalties, and silent enterprise churn.

---

## Slide 3: Our Core Innovation — Built with Coral
### Cross-Source Relational Joins
- **Coral Database Indexer**: Performs relational joins across git commits, Sentry exceptions, Stripe logs, and Zendesk tickets.
- **Sub-8ms Query Latency**: Correlates events dynamically using temporal rolling windows and customer metadata.
- **Deterministic Reliability**: We use AI to summarize and narrate, but the calculations, severity mapping, and correlation scores are 100% deterministic.

---

## Slide 4: The Revenue Risk Score
### How We Map Dollar Impact
- **Tier-Weighted MRR**: Enterprise account MRR is weighted at 10x, Premium at 3x, and Standard at 1x to reflect high contractual exposure.
- **Stripe Failure Rate**: Declinations are annualized to daily leak rates.
- **Sigmoid Churn Premium**: Risk score compounds automatically based on Zendesk ticket surges and outage duration.
- **Prioritization**: Engineering teams are dynamically routed to the highest revenue-impact incidents.

---

## Slide 5: Product Walkthrough — The War Room
- **Live Elapsed Outage Timer**: Real-time ticker keeping SRE focus.
- **SLA Breach Warnings**: Instant visibility into contract exposure.
- **SVG Incident Topology**: Visual pipeline mapping from Culprit deployment $\rightarrow$ Alert $\rightarrow$ Stripe Declines $\rightarrow$ Ticket surge.
- **AI Briefing Hub**: Tailored summaries for Board (financial), CTO (engineering), and Customer (public updates).

---

## Slide 6: Post-Hackathon Expansion Roadmap
- **Real observability integrations** (Splunk, Datadog APIs).
- **Celery & Redis pub/sub queueing** for streaming pipelines.
- **Alert Forecasting**: Predictive warnings estimating SLA exposures before outages occur.
- **Rollback automation**: Secure webhooks to trigger rollback deployments dynamically on Kubernetes.
