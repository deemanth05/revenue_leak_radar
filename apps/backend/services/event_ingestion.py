"""
Event ingestion service.

Normalizes, validates, and persists incoming operational events, then triggers
the correlation engine to update incidents.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from models.operational_event import OperationalEvent, OperationalEventType
from models.deployment import Deployment, DeploymentStatus, DeploymentEnvironment
from models.payment_failure import PaymentFailure
from models.support_ticket import SupportTicket, TicketPriority, TicketStatus, TicketSource
from models.alert import Alert, AlertSeverity, AlertSource
from models.remediation_action import RemediationAction, ActionType, ActionStatus
from models.customer import Customer
from schemas.operational_event import OperationalEventCreate
from services.correlation_engine import run_correlation_for_new_event


async def ingest_operational_event(db: AsyncSession, event_in: OperationalEventCreate) -> OperationalEvent:
    """
    Ingest a raw operational event, persist it, normalize/persist to specialized table,
    and trigger incident correlation.
    """
    # 1. Create and save the raw OperationalEvent log
    raw_event = OperationalEvent(
        event_type=event_in.event_type.value if hasattr(event_in.event_type, "value") else event_in.event_type,
        timestamp=event_in.timestamp,
        severity=event_in.severity,
        service=event_in.service,
        correlation_metadata=event_in.correlation_metadata,
        source_system=event_in.source_system,
        affected_customers=event_in.affected_customers,
        business_context=event_in.business_context,
    )
    db.add(raw_event)
    await db.flush()  # Populates raw_event.id

    # 2. Normalize and route to specialized tables
    if event_in.event_type == OperationalEventType.deployment:
        commit_hash = event_in.correlation_metadata.get("commit_hash", f"mock{raw_event.id.hex[:7]}")
        branch = event_in.correlation_metadata.get("branch", "main")
        author = event_in.correlation_metadata.get("author", "DevOps Bot")
        repo = event_in.service
        env_str = event_in.correlation_metadata.get("environment", "production")
        status_str = event_in.correlation_metadata.get("status", "success")
        duration = event_in.correlation_metadata.get("duration_seconds")
        rollback_of_str = event_in.correlation_metadata.get("rollback_of")
        
        rollback_of = uuid.UUID(rollback_of_str) if rollback_of_str else None

        deployment = Deployment(
            commit_hash=commit_hash,
            branch=branch,
            author=author,
            repository=repo,
            environment=env_str,
            status=status_str,
            deployed_at=event_in.timestamp,
            duration_seconds=duration,
            rollback_of=rollback_of,
        )
        db.add(deployment)
        await db.commit()

    elif event_in.event_type == OperationalEventType.payment_failure:
        customer_id = None
        if event_in.affected_customers:
            try:
                customer_id = uuid.UUID(event_in.affected_customers[0])
            except ValueError:
                pass
        
        if not customer_id:
            # Fallback to look up first customer in DB
            c_res = await db.execute(select(Customer).limit(1))
            cust = c_res.scalar_one_or_none()
            if cust:
                customer_id = cust.id
        
        if customer_id:
            amount = event_in.correlation_metadata.get("amount", 99.0)
            currency = event_in.correlation_metadata.get("currency", "USD")
            reason = event_in.correlation_metadata.get("failure_reason", "processing_error")
            intent_id = event_in.correlation_metadata.get("stripe_payment_intent_id", f"pi_{uuid.uuid4().hex[:20]}")
            
            pf = PaymentFailure(
                customer_id=customer_id,
                amount=amount,
                currency=currency,
                failure_reason=reason,
                stripe_payment_intent_id=intent_id,
                failed_at=event_in.timestamp,
            )
            db.add(pf)
            await db.flush()
            
            await run_correlation_for_new_event(db, "payment_failure", pf, event_in.service)
            await db.commit()

    elif event_in.event_type in [OperationalEventType.support_ticket, OperationalEventType.customer_complaint]:
        customer_id = None
        if event_in.affected_customers:
            try:
                customer_id = uuid.UUID(event_in.affected_customers[0])
            except ValueError:
                pass
        
        if not customer_id:
            c_res = await db.execute(select(Customer).limit(1))
            cust = c_res.scalar_one_or_none()
            if cust:
                customer_id = cust.id
                
        if customer_id:
            subject = event_in.correlation_metadata.get("subject", event_in.business_context.get("message", "Operational Complaint"))
            priority = event_in.correlation_metadata.get("priority", "high")
            status = event_in.correlation_metadata.get("status", "open")
            source = event_in.source_system
            
            st = SupportTicket(
                customer_id=customer_id,
                subject=subject,
                priority=priority,
                status=status,
                source=source,
                created_at=event_in.timestamp,
            )
            db.add(st)
            await db.flush()
            
            await run_correlation_for_new_event(db, "support_ticket", st, event_in.service)
            await db.commit()

    elif event_in.event_type in [OperationalEventType.infrastructure_alert, OperationalEventType.error_spike, OperationalEventType.sla_violation]:
        title = event_in.correlation_metadata.get("title", f"Alert: {event_in.service} error spike")
        message = event_in.correlation_metadata.get("message", "Anomalous technical signal detected")
        severity = event_in.severity
        source = event_in.source_system
        
        alert = Alert(
            source=source,
            title=title,
            message=message,
            severity=severity,
            alert_metadata=event_in.correlation_metadata,
            triggered_at=event_in.timestamp,
        )
        db.add(alert)
        await db.flush()
        
        await run_correlation_for_new_event(db, "alert", alert, event_in.service)
        await db.commit()

    elif event_in.event_type == OperationalEventType.remediation_action:
        inc_id_str = event_in.correlation_metadata.get("incident_id")
        if inc_id_str:
            try:
                inc_id = uuid.UUID(inc_id_str)
                action_type = event_in.correlation_metadata.get("action_type", "manual")
                title = event_in.correlation_metadata.get("title", "Remediation Triggered")
                description = event_in.correlation_metadata.get("description", "")
                status = event_in.correlation_metadata.get("status", "pending")
                assigned_to = event_in.correlation_metadata.get("assigned_to")
                priority = event_in.correlation_metadata.get("priority_order", 0)
                
                ra = RemediationAction(
                    incident_id=inc_id,
                    action_type=action_type,
                    title=title,
                    description=description,
                    status=status,
                    assigned_to=assigned_to,
                    priority_order=priority,
                )
                db.add(ra)
                await db.commit()
            except ValueError:
                pass

    return raw_event
