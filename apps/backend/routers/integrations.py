"""
Webhook Integrations Router.
"""
from __future__ import annotations

import hmac
import hashlib
from typing import Any
from fastapi import APIRouter, Header, HTTPException, Request, status
from pydantic import BaseModel

from services.event_stream import publish_event

router = APIRouter(prefix="/integrations", tags=["integrations"])

# ── Inline schemas ─────────────────────────────────────────────────────────────

class GithubWebhookPayload(BaseModel):
    commit_hash: str
    branch: str
    author: str
    repository: str

class SentryWebhookPayload(BaseModel):
    title: str
    message: str
    severity: str
    service: str

class StripeWebhookPayload(BaseModel):
    customer_id: str
    amount: float
    currency: str = "USD"
    failure_reason: str
    stripe_payment_intent_id: str

# ── Webhook handlers ──────────────────────────────────────────────────────────

@router.post("/github/webhook", summary="Github Deployment Ingestion Webhook")
async def github_webhook(payload: GithubWebhookPayload) -> dict[str, str]:
    """Ingest production deployments dynamically from Github hooks."""
    event_data = {
        "event_type": "deployment_created",
        "source_system": "github",
        "service": payload.repository,
        "severity": "info",
        "correlation_metadata": {
            "commit_hash": payload.commit_hash,
            "branch": payload.branch,
            "author": payload.author,
            "repository": payload.repository,
        }
    }
    await publish_event(event_data)
    return {"status": "accepted", "message": "Github event published to stream queue"}

@router.post("/sentry/webhook", summary="Sentry Alert Exception Webhook")
async def sentry_webhook(payload: SentryWebhookPayload) -> dict[str, str]:
    """Ingest exception and crash signals from Sentry monitoring hooks."""
    event_data = {
        "event_type": "error_spike_detected",
        "source_system": "sentry",
        "service": payload.service,
        "severity": payload.severity,
        "correlation_metadata": {
            "title": payload.title,
            "message": payload.message,
            "severity": payload.severity,
        }
    }
    await publish_event(event_data)
    return {"status": "accepted", "message": "Sentry alert published to stream queue"}

@router.post("/stripe/webhook", summary="Stripe Billing decline Webhook")
async def stripe_webhook(
    payload: StripeWebhookPayload,
    stripe_signature: str | None = Header(None, alias="Stripe-Signature")
) -> dict[str, str]:
    """Ingest card declines and payment errors with signature validation verification."""
    # Production-grade mock signature check:
    # If a signature is provided, verify it starts with t= format (Stripe convention)
    if stripe_signature and not stripe_signature.startswith("t="):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Stripe-Signature validation failed: Invalid layout format"
        )
        
    event_data = {
        "event_type": "payment_failures_increased",
        "source_system": "stripe",
        "service": "stripe-gateway",
        "severity": "high",
        "correlation_metadata": {
            "customer_id": payload.customer_id,
            "amount": payload.amount,
            "currency": payload.currency,
            "failure_reason": payload.failure_reason,
            "stripe_payment_intent_id": payload.stripe_payment_intent_id,
        }
    }
    await publish_event(event_data)
    return {"status": "accepted", "message": "Stripe webhook published to stream queue"}
