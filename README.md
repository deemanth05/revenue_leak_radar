# Revenue Leak Radar

**AI-powered revenue impact intelligence & autonomous incident response system**

> "The AI command center that tells engineering teams which technical issues are losing the most money in real time."

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat&logo=postgresql)](https://postgresql.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=flat&logo=typescript)](https://typescriptlang.org)

---

## What is this?

Revenue Leak Radar correlates engineering incidents with business revenue impact in real time.

Instead of showing **"500 unresolved alerts"**, it shows:

**"Checkout deployment abc123f is currently causing $42,000/day in revenue loss."**

It answers: *"Which technical incident is causing the highest business damage right now?"*

---

## Quick Start & Deployments

### Production Deployments
* **Next.js Frontend:** Deployed on **Vercel**
* **FastAPI Backend:** Deployed on **Render** (e.g., `https://revenue-leak-radar.onrender.com`)
* **Database Layer:** Hosted on **Supabase** (PostgreSQL)

---

### Production Configuration & Environment Variables

#### 1. Backend Service (Render)
Ensure the following variables are configured in your Render service environment:
* `DATABASE_URL`: Your Supabase pooler connection URI. (e.g., `postgresql://postgres:password@db-host:5432/postgres?sslmode=require`)
* `ALLOWED_ORIGINS`: A valid JSON array string containing allowed origins. To allow all origins (including Vercel), use:
  ```env
  ALLOWED_ORIGINS=["*"]
  ```
  *(Note: It must be a valid JSON array. A plain string like `*` will crash the Pydantic parser on startup).*
* `AI_MOCK_MODE`: `true` (unless you are using a real Gemini/Groq API key).

#### 2. Frontend Service (Vercel)
Ensure the following variable is configured in Vercel project settings:
* `NEXT_PUBLIC_API_URL`: `https://revenue-leak-radar.onrender.com` *(your live Render backend URL, starting with HTTPS)*

---

### Seeding the Live Supabase Database
Because local backend servers and AI sandboxes cannot connect to external databases, you must run the database seeding locally to populate your remote Supabase instance:

**On PowerShell:**
```powershell
$env:DATABASE_URL="postgresql://postgres:your-password@db.supabase.co:5432/postgres?sslmode=require"
pnpm seed
```

**On Command Prompt (cmd):**
```cmd
set DATABASE_URL=postgresql://postgres:your-password@db.supabase.co:5432/postgres?sslmode=require
pnpm seed
```

---

### Local Development Setup

#### Prerequisites
| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20+ | Frontend runtime |
| Python | 3.11+ | Backend runtime |
| Docker | Any | PostgreSQL + Redis (Optional) |
| pnpm | 9+ | Package manager |

#### 1. Clone & Configure
```bash
git clone <repo>
cd revenue_leak_radar
copy .env.example .env
# Edit .env and configure local PostgreSQL / Redis details
```

#### 2. Install Dependencies & Build
```bash
pnpm install

# Set up backend virtual environment
cd apps/backend
python -m venv .venv
.venv/Scripts/activate
pip install -r requirements.txt
cd ../..
```

#### 3. Initialize & Seed Local Database
Ensure your local PostgreSQL/Docker is running:
```bash
# Run migrations
pnpm migrate

# Seed local demo data
pnpm seed
```

#### 4. Run Development Servers
* **Terminal 1 — Frontend:**
  ```bash
  pnpm dev:frontend # Open http://localhost:3000
  ```
* **Terminal 2 — Backend:**
  ```bash
  pnpm dev:backend # Open http://localhost:8000/docs
  ```

#### 5. Validate Environment
```bash
python scripts/validate_env.py
```

---

## Project Structure

```
revenue_leak_radar/
├── apps/
│   ├── frontend/          # Next.js 15 + TypeScript + TailwindCSS
│   │   └── src/
│   │       ├── app/       # App Router pages
│   │       ├── components/ # UI components
│   │       └── lib/       # API client + utilities
│   └── backend/           # FastAPI + SQLAlchemy + Alembic
│       ├── core/          # Config, database, logging
│       ├── models/        # SQLAlchemy ORM models
│       ├── schemas/       # Pydantic request/response schemas
│       ├── routers/       # API route handlers
│       ├── services/      # Business logic (deterministic + AI)
│       ├── seed/          # Demo data seeder
│       └── alembic/       # Database migrations
│
├── packages/
│   ├── schemas/           # Shared TypeScript types + enums
│   ├── mock-data/         # Synthetic data generators
│   └── agent-prompts/     # AI prompt templates
│
├── docs/
│   ├── architecture.md    # System architecture + diagrams
│   ├── event-lifecycle.md # Event flow + algorithms
│   └── database-schema.md # ERD + table documentation
│
├── scripts/
│   ├── validate_env.py    # Pre-flight environment check
│   └── init.sql           # PostgreSQL initialization
│
├── docker-compose.yml     # PostgreSQL + Redis
├── .env.example           # Environment variable template
└── README.md              # This file
```

---

## Pages

| Page | URL | Description |
|------|-----|-------------|
| Dashboard | `/` | KPI cards, revenue trend, incident table |
| Incidents | `/incidents` | All incidents ranked by revenue impact |
| Revenue Risk | `/revenue-risk` | Revenue analysis by tier, trend charts |
| Executive Reports | `/executive-reports` | AI-generated leadership briefings |
| Timeline | `/timeline` | Root cause event flow visualization |
| System Health | `/system-health` | Service status across all integrations |

---

## API Reference

Base URL: `http://localhost:8000/api/v1`

Interactive docs: `http://localhost:8000/docs`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | System health + DB connectivity |
| `/incidents` | GET | List incidents (sorted by revenue impact) |
| `/incidents/{id}` | GET | Incident detail with all relations |
| `/incidents/dashboard/kpis` | GET | Dashboard KPI aggregations |
| `/incidents/{id}/correlate` | POST | Trigger correlation engine |
| `/revenue/at-risk` | GET | Total revenue exposure summary |
| `/revenue/trend` | GET | 24h hourly revenue risk trend |
| `/revenue/calculate/{id}` | POST | Run revenue scorer for incident |
| `/deployments` | GET | Recent deployments |
| `/alerts` | GET | Alerts with optional incident filter |
| `/executive/generate` | POST | Generate AI executive briefing |
| `/executive/latest` | GET | Most recent executive summary |
| `/remediation/{id}` | GET | Remediation actions for incident |
| `/remediation/{id}/generate` | POST | Auto-generate remediation plan |

---

## 🪸 The Coral Engine: Cross-Signal Correlation

Coral is the central intelligence engine that powers the real-time operational correlation in Revenue Leak Radar. Instead of relying on expensive or non-deterministic LLMs to guess how events are related, Coral uses a highly optimized, fully deterministic relational query planner:

### 1. Unified Namespace Queries
Coral executes non-blocking asynchronous database joins across four distinct schema namespaces inside a specified temporal slide window:
* **Deployments:** Active production releases on GitHub.
* **Payment Failures:** Card declines and billing issues logged from Stripe webhooks.
* **Support Tickets:** Helpdesk ticket surges indexed from Zendesk.
* **Infrastructure Alerts:** Error spikes and timeouts tracked in Sentry.

### 2. Time-Proximity Correlation Heuristic
When a query is run, Coral groups events and calculates correlation confidence based on temporal proximity. For example:
* A production deployment occurring within the **60-minute window preceding** an alert spike is flagged as the high-probability causal root.
* The system weights active ticket counts and Stripe transaction failures to dynamically elevate or depress the incident's severity rank.

### 3. API Contract & Frontend Integration
The Next.js frontend accesses the Coral engine via the `/api/v1/coral/joint-query` endpoint, which returns execution latency metrics (typically **sub-15ms**) and detailed payload breakdowns. The UI maps this structured contract into interactive signal badges and node trees, offering an intuitive correlation console for SREs.

---

## AI Providers

The system auto-selects the best available provider:

1. **Gemini** (Primary) — `gemini-1.5-flash` · [Get key →](https://aistudio.google.com/app/apikey)
2. **Groq** (Secondary, fastest) — `llama-3.1-8b-instant` · [Get key →](https://console.groq.com)
3. **OpenRouter** (Tertiary) — `meta-llama/llama-3.1-8b-instruct:free` · [Get key →](https://openrouter.ai/keys)
4. **Mock mode** — No key needed, returns realistic hardcoded responses (`AI_MOCK_MODE=true`)

AI is used **ONLY** for:
- Executive summary text generation
- Remediation step descriptions

All scoring, correlation, and prioritization is **deterministic code**.

---

## Demo Scenario

The seed script creates a realistic demo:

**Deployment abc123f** → checkout-service at T+0

| Signal | Count | Impact |
|--------|-------|--------|
| Sentry alerts | 47 | error spike detected |
| Stripe payment failures | 89 | $14,210 in failed transactions |
| Zendesk support tickets | 67 | customer complaint surge |
| Enterprise accounts affected | 3 | SLA risk |
| Premium users affected | 421 | churn risk |
| **Revenue at risk** | **$42,000/day** | **Correlation: 94%** |

---

## Architecture Principles

1. **Deterministic Intelligence** — LLMs summarize only. All scoring is code.
2. **Synthetic Environment** — Full demo without real integrations.
3. **Typed Contracts** — All API responses and AI outputs are schema-validated.
4. **Modular Design** — Isolated modules for rapid AI-assisted extension.

See [`docs/architecture.md`](./docs/architecture.md) for full details.

---

## Development Commands

```bash
pnpm dev:frontend      # Start Next.js dev server (port 3000)
pnpm dev:backend       # Start FastAPI dev server (port 8000)
pnpm docker:up         # Start PostgreSQL + Redis
pnpm docker:down       # Stop containers
pnpm docker:reset      # Reset containers + volumes (fresh DB)
pnpm migrate           # Run Alembic migrations
pnpm seed              # Seed demo scenario data
pnpm validate          # Run environment validation
pnpm lint              # Lint frontend
pnpm typecheck         # TypeScript type check
```

---

## License

MIT License
