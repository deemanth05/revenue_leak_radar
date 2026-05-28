# Revenue Leak Radar — Hackathon Demo Script

This script outlines the high-impact operational narrative to demonstrate **Revenue Leak Radar** to hackathon judges and users.

---

## Part 1: The Setup — Interactive Simulation Scenarios
*“We start with an empty dashboard. Let's introduce a realistic production outage scenario.”*

1. **Navigate to Simulation Control Panel** in the sidebar.
2. Select the **Checkout Deployment Failure (Primary Flow)** scenario.
3. Show the **Cinematic Playback Dashboard** controls:
   - Toggle speed multiplier to **5x** or **10x** for accelerated ingestion.
   - Click **Play** and watch the steps auto-advance!
   - Note the **Scrubber bar** updates smoothly. Show manual scrubbing: slide it back to Step 2, then drag it forward to Step 5.
4. Point out the **Live Ingestion Stream** at the bottom: raw JSON events (Deployments, Sentry Alerts, Stripe Declines, Zendesk Tickets) flood the console.

---

## Part 2: The Command Center — Real-time Correlation & Priority
*“Our correlation engine connects the dots, and we see our dashboard flare up.”*

1. **Navigate to Operations Dashboard** in the sidebar.
2. Show the **Critical Incident Active Banner**:
   - *“Checkout Service: $42,180/day revenue at risk. Culprit deployment commit abc123f is correlated with 94% confidence.”*
3. Focus on the **KPI cards**:
   - **Revenue at Risk**: $42k/day (red warning accent).
   - **Active Incidents**: 1 (warning accent).
   - **Affected Customers**: 67 (primary accent).
   - **Avg MTTR**: 2.4h (success accent).
4. Point out the **Revenue Risk Table**: The checkout outage is automatically prioritized at the very top because of its $42k/day impact, while lower-impact outages (like auth latency at $8k/day) drop below.

---

## Part 3: The War Room — Deep Root-Cause Topology
*“Let's drill down into the active incident to triage and resolve it.”*

1. In the **Revenue Risk Table**, hover on the checkout outage row and click the **External Link** icon to **Enter War Room**.
2. Explain the **War Room Header**:
   - **Elapsed Time Timer** ticking live since the start of the outage.
   - **SLA Exposure** showing "SLA Breached" for enterprise clients.
   - **Compounding Daily Risk** ($42.1k/day) and **Affected Users** (67 active).
3. Walk through the **Incident Correlation Topology (SVG Graph)**:
   - Highlight how we trace the lineage from Sarah Chen's checkout-service deployment (`abc123f`) $\rightarrow$ Sentry Timeout Alerts $\rightarrow$ Stripe Declines $\rightarrow$ Zendesk customer complaint surge.
   - Note the glowing pipeline connectors linking the cards.

---

## Part 4: AI Augmentation Hub
*“Engineers need to fix the bug, but stakeholders need briefings. Let's check our AI Action Hub.”*

1. Point to the **Live AI Briefing Hub** in the right column.
2. Select the **CTO Summary** tab:
   - Note the technical jargon: databases connection pool locks, Stripe signature exceptions, and the git rollback command.
3. Switch to the **Board Briefing** tab:
   - Note the commercial focus: SLA penalty projection ($15,000), daily MRR risk, and customer relations mitigation paths.
4. Switch to the **Customer Update** tab:
   - Show the customer-facing message: apologetic, clear, and action-oriented status text suitable for statuspage.io.
5. Click **Copy Briefing Payload** to copy the formatted JSON payload to your clipboard.

---

## Part 5: Historical Incident Memory & Resolution
*“How do we fix this? Has this happened before?”*

1. Look at the **Incident Memory** card:
   - Point out the **85% Match** to a historical incident: *“Stripe API Webhook Signature Failure”*.
   - Read the reasoning: *“same repository codebase (checkout-service), overlapping error keywords: timeout, stripe.”*
2. Look at the **Remediation Actions** checklist:
   - Note that Slack has been notified and a Jira ticket has been created automatically.
   - The first pending step is: **Execute Action: Roll back checkout-service to commit f9e8d7c**.
3. Click the **Execute Action** button.
4. Watch the UI immediately update:
   - The incident status switches from **Active** to **Resolved** (with green indicators).
   - The **Elapsed Time** stops.
   - The **SLA Status** clears.
   - The **Revenue Risk** drops to **$0.00**.
5. *“The outage is mitigated, the revenue leak is plugged, and operations return to nominal.”*
