# Agent Prompt Generation Guide
# How to use the agent-prompts package to rapidly generate new capabilities
#
# Revenue Leak Radar — Phase 2+ Development Guide

---

## Overview

This guide explains how to use the prompt templates in `/packages/agent-prompts/prompts/`
to rapidly generate new frontend components, API routes, and intelligence agents in future phases.

The prompts enforce:
- Deterministic structured JSON outputs
- Typed contracts matching `@rlr/schemas`
- Modular, isolated code
- Enterprise-grade quality

---

## Available Prompts

| Prompt | File | Purpose |
|--------|------|---------|
| Executive Briefing | `executive_briefing.md` | Generate leadership-level incident summaries |
| Remediation Plan | `remediation_plan.md` | Generate ordered remediation action plans |
| Root Cause Analysis | `root_cause_analysis.md` | Identify deployment-to-incident correlations |
| Revenue Correlation | `revenue_correlation.md` | Estimate financial impact from signals |
| Incident Detection | `incident_detection.md` | Detect anomalies from telemetry streams |

---

## How to Use a Prompt

### 1. Load the prompt template
```python
from pathlib import Path

def load_prompt(name: str) -> str:
    path = Path(__file__).parent.parent / "packages/agent-prompts/prompts" / f"{name}.md"
    return path.read_text()
```

### 2. Fill template variables
```python
def fill_template(template: str, variables: dict) -> str:
    for key, value in variables.items():
        template = template.replace(f"{{{{{key}}}}}", str(value))
    return template
```

### 3. Call the AI provider (via services/ai_provider.py)
```python
from services.ai_provider import get_ai_client

client = get_ai_client()
raw = await client.generate(
    system="You are the Executive Briefing Agent for Revenue Leak Radar.",
    prompt=filled_template
)

import json
result = json.loads(raw)  # Always parse as JSON
```

---

## Generating New Frontend Components

Use this meta-prompt pattern to generate new dashboard widgets:

```
You are building a React component for Revenue Leak Radar.

Component: [NAME]
Purpose: [WHAT IT SHOWS]
Data: [WHAT DATA IT RECEIVES AS PROPS]

Requirements:
- TypeScript + React 19
- Use TailwindCSS classes from the existing design system
- Use the component classes: card, data-table, badge-*, status-dot-*, revenue-value, kpi-card
- Import types from @rlr/schemas
- No external UI library — use pure HTML + Tailwind
- Export as named export
- Add id attributes to all interactive elements

Return ONLY the component code, no explanation.
```

---

## Generating New FastAPI Routes

Use this meta-prompt pattern to generate new API routes:

```
You are building a FastAPI route for Revenue Leak Radar.

Router: [MODULE NAME] (e.g., "incidents")
Route: [METHOD] [PATH] (e.g., "GET /api/v1/incidents/{id}/correlate")
Purpose: [WHAT THIS ROUTE DOES]

Requirements:
- Async with AsyncSession dependency
- Pydantic v2 response model using ApiResponse[T] wrapper
- SQLAlchemy async query with joinedload for relations
- Return ApiResponse with success=True and data=[result]
- Handle 404 with HTTPException
- Include docstring

Return ONLY the route handler code.
```

---

## Generating New Mock Data

Use this meta-prompt pattern to generate additional mock scenarios:

```
You are extending the Revenue Leak Radar synthetic data framework.

New scenario: [SCENARIO NAME]
Trigger: [WHAT CAUSES IT]
Expected signals: [LIST OF SIGNALS]
Revenue impact: $[AMOUNT]/day

Requirements:
- Extend the existing generators in packages/mock-data/generators/
- Use seed=42 for reproducibility
- Return a Python dict matching the database schema
- Keep the demo_scenario (abc123f) untouched — add new scenarios alongside it

Return ONLY the generator code.
```

---

## Prompt Quality Checklist

Before using any prompt in production, verify:

- [ ] System prompt sets clear agent role and boundaries
- [ ] Output schema is fully specified as JSON
- [ ] Example input and output are included
- [ ] All template variables are documented ({{variable_name}})
- [ ] Temperature is set to 0.1 (deterministic)
- [ ] Forbidden behaviors are explicitly stated ("You MUST NOT...")
- [ ] Schema validation is done in code after parsing

---

## Adding a New Prompt

1. Create `packages/agent-prompts/prompts/[agent_name].md`
2. Follow the structure: SYSTEM PROMPT → USER PROMPT TEMPLATE → EXAMPLE INPUT → EXAMPLE OUTPUT
3. Add it to the table in this guide
4. Add the corresponding Pydantic output schema in `apps/backend/schemas/`
5. Wire it into `apps/backend/services/ai_provider.py`
