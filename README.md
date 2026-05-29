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

## Quick Start

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20+ | Frontend runtime |
| Python | 3.11+ | Backend runtime |
| Docker | Any | PostgreSQL + Redis |
| pnpm | 9+ | Package manager |

### 1. Clone & configure

```bash
git clone <repo>
cd revenue_leak_radar

# Copy and fill environment variables
copy .env.example .env
# Edit .env — add at least one AI provider key (or set AI_MOCK_MODE=true)
```

### 2. Start infrastructure

```bash
# Start PostgreSQL + Redis via Docker
docker-compose up -d

# Verify everything is running
docker-compose ps
```

### 3. Install dependencies

```bash
# Install frontend deps
pnpm install

# Install backend deps (Windows)
cd apps\backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
cd ..\..
```

### 4. Initialize database

```bash
# Run migrations
cd apps\backend
alembic upgrade head

# Seed demo data (the $42k/day checkout failure scenario)
python -m seed.demo_scenario
cd ..\..
```

### 5. Start development servers

**Terminal 1 — Frontend:**
```bash
pnpm dev:frontend
# → http://localhost:3000
```

**Terminal 2 — Backend:**
```bash
cd apps\backend
.venv\Scripts\activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
# → http://localhost:8000
# → http://localhost:8000/docs (Swagger UI)
```

### 6. Validate environment

```bash
python scripts\validate_env.py
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
