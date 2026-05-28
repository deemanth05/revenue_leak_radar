"""
AI provider abstraction layer.

Supports Gemini, Groq, OpenRouter, and a deterministic Mock fallback.
All responses are expected to be valid JSON.
"""
from __future__ import annotations

import functools
import json
import logging
from datetime import datetime, timezone
from typing import Any

import httpx

from core.config import get_settings

logger = logging.getLogger(__name__)

_MOCK_EXECUTIVE_SUMMARY = {
    "summary_text": (
        "A critical payment processing incident was detected following a deployment to "
        "the checkout-service at 14:32 UTC. Error rates spiked to 18.7%, causing 89 payment "
        "failures totalling approximately $42,000 in daily revenue impact. The correlation "
        "engine identified the deployment (commit abc123f) as the root cause with 87% confidence. "
        "Immediate rollback is recommended."
    ),
    "key_risks": [
        "Enterprise customer churn risk elevated to 23% if incident persists beyond 4 hours",
        "$42k/day payment failure run-rate compounding while checkout is degraded",
        "SLA breach imminent for 12 enterprise accounts with 99.9% uptime commitments",
        "Reputational damage from 67 open support tickets and rising",
    ],
    "recommended_actions": [
        "Immediately roll back checkout-service to commit f9e8d7c (previous stable build)",
        "Open P0 bridge call with checkout-service team and on-call SRE",
        "Proactively notify enterprise customers via account managers",
        "Trigger Stripe payment retry for all failed intents from the past 2 hours",
        "Deploy hotfix to increase payment timeout threshold as interim mitigation",
    ],
    "operational_status": "critical",
    "total_revenue_at_risk_daily": "42000.00",
}


class AIProviderClient:
    """Unified AI client that auto-selects the configured provider."""

    def __init__(self) -> None:
        self._settings = get_settings()
        self._provider = self._settings.effective_ai_provider
        self._http: httpx.AsyncClient | None = None

    @property
    def _client(self) -> httpx.AsyncClient:
        if self._http is None or self._http.is_closed:
            self._http = httpx.AsyncClient(timeout=60.0)
        return self._http

    async def close(self) -> None:
        if self._http and not self._http.is_closed:
            await self._http.aclose()

    # ── Public API ─────────────────────────────────────────────────────────

    async def generate(self, prompt: str, system: str = "") -> str:
        """
        Send a prompt to the active provider and return the response string.
        Expects the model to return valid JSON.
        """
        logger.info("AI generate called", extra={"provider": self._provider})

        if self._provider == "gemini":
            return await self._call_gemini(prompt, system)
        if self._provider == "groq":
            return await self._call_groq(prompt, system)
        if self._provider == "openrouter":
            return await self._call_openrouter(prompt, system)

        # Default / mock
        return self._mock_response(prompt)

    @property
    def provider_name(self) -> str:
        return self._provider

    # ── Provider implementations ───────────────────────────────────────────

    async def _call_gemini(self, prompt: str, system: str) -> str:
        s = self._settings
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{s.GEMINI_MODEL}:generateContent?key={s.GEMINI_API_KEY}"
        )
        contents: list[dict[str, Any]] = []
        if system:
            contents.append({"role": "user", "parts": [{"text": system}]})
            contents.append({"role": "model", "parts": [{"text": "Understood."}]})
        contents.append({"role": "user", "parts": [{"text": prompt}]})

        payload: dict[str, Any] = {
            "contents": contents,
            "generationConfig": {
                "maxOutputTokens": s.AI_MAX_TOKENS,
                "temperature": s.AI_TEMPERATURE,
                "responseMimeType": "application/json",
            },
        }

        resp = await self._client.post(url, json=payload)
        resp.raise_for_status()
        data = resp.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]

    async def _call_groq(self, prompt: str, system: str) -> str:
        s = self._settings
        messages: list[dict[str, str]] = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        payload: dict[str, Any] = {
            "model": s.GROQ_MODEL,
            "messages": messages,
            "max_tokens": s.AI_MAX_TOKENS,
            "temperature": s.AI_TEMPERATURE,
            "response_format": {"type": "json_object"},
        }
        resp = await self._client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            json=payload,
            headers={"Authorization": f"Bearer {s.GROQ_API_KEY}"},
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]

    async def _call_openrouter(self, prompt: str, system: str) -> str:
        s = self._settings
        messages: list[dict[str, str]] = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        payload: dict[str, Any] = {
            "model": s.OPENROUTER_MODEL,
            "messages": messages,
            "max_tokens": s.AI_MAX_TOKENS,
            "temperature": s.AI_TEMPERATURE,
            "response_format": {"type": "json_object"},
        }
        resp = await self._client.post(
            f"{s.OPENROUTER_BASE_URL}/chat/completions",
            json=payload,
            headers={
                "Authorization": f"Bearer {s.OPENROUTER_API_KEY}",
                "HTTP-Referer": "https://revenue-leak-radar.internal",
                "X-Title": "Revenue Leak Radar",
            },
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]

    # ── Mock ───────────────────────────────────────────────────────────────

    def _mock_response(self, prompt: str) -> str:
        """Return a realistic deterministic mock JSON response."""
        # Detect prompt type by keywords
        prompt_lower = prompt.lower()
        if "executive" in prompt_lower or "summary" in prompt_lower:
            return json.dumps(_MOCK_EXECUTIVE_SUMMARY)

        if "remediation" in prompt_lower or "action" in prompt_lower:
            return json.dumps({
                "actions": [
                    {
                        "action_type": "rollback",
                        "title": "Roll back checkout-service to previous stable build",
                        "description": (
                            "Revert commit abc123f to restore payment processing. "
                            "Estimated recovery time: 8 minutes."
                        ),
                        "priority_order": 1,
                    },
                    {
                        "action_type": "notify_slack",
                        "title": "Notify #incidents Slack channel",
                        "description": "Post P0 alert with impact summary and ETA to #incidents.",
                        "priority_order": 2,
                    },
                    {
                        "action_type": "create_jira",
                        "title": "Create post-mortem Jira ticket",
                        "description": "Track root cause analysis and follow-up action items.",
                        "priority_order": 3,
                    },
                ]
            })

        # Generic fallback
        return json.dumps({
            "result": "Mock AI response — configure GEMINI_API_KEY, GROQ_API_KEY, or OPENROUTER_API_KEY for real AI.",
            "timestamp": datetime.now(tz=timezone.utc).isoformat(),
        })


@functools.lru_cache(maxsize=1)
def get_ai_client() -> AIProviderClient:
    """Return a cached AIProviderClient singleton."""
    return AIProviderClient()
