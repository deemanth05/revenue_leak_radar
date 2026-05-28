# Revenue Leak Radar — Post-Hackathon Expansion Roadmap

This document outlines the engineering and product milestones to transition **Revenue Leak Radar** from a hackathon project into a high-scale production enterprise SaaS platform.

---

## Phase 1: High-Scale Ingestion & Pipeline Upgrades
*Objective: Scale the ingestion throughput from mock scenarios to millions of metrics/alerts per minute.*

### 1. Redis Pub/Sub Alert Fan-Out
- Replace SQLite/Postgres polling with a Redis event bus.
- Ingest Sentry and Stripe webhooks into Redis queues immediately, decoupling ingestion from database write operations.

### 2. Celery Async Task Execution
- Move the **Correlation Engine** and **Revenue Scorer** out of the API thread pool.
- Trigger celery workers to process signals and update incident priority scores asynchronously.

### 3. PostgreSQL Connection Pooling (`pgbouncer`)
- Deploy `pgbouncer` to manage database connection reuse, preventing auth-service database exhaustion incidents.

---

## Phase 2: Production Observability Integrations
*Objective: Build real integrations with major enterprise developer tools.*

### 1. GitHub Actions Deployment Webhooks
- Register GitHub webhooks to capture repository deploy statuses, commit authors, and branch names in production.

### 2. Datadog & Splunk Log Streamers
- Connect to Datadog event streams to read technical latency triggers and P99 latency spikes automatically.

### 3. Stripe Billing Webhooks
- Parse real Stripe invoice renew declines and payment intent timeouts, matching customer Stripe IDs to Salesforce CRM accounts.

---

## Phase 3: Anomaly Forecasting & Autonomous Recovery
*Objective: Predict revenue leaks before they happen and automate rollback mitigation.*

### 1. Predictive SLA Violation Alerts
- Train time-series models on latency curves to forecast when a dedicated cluster is on path to breach its SLA.
- Trigger warning Slack notifications 30 minutes before contractual breaches occur.

### 2. Secure Webhook Rollback Automation
- Connect the **Remediation Action** executor to Kubernetes clusters via secure Arcd/GitOps APIs.
- Auto-execute `kubectl rollout undo` when the correlation engine identifies a culprit deployment with >95% confidence.
