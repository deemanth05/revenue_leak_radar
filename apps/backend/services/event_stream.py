"""
Async event streaming ingestion queue pipeline.
"""
from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone
from typing import Any

from core.database import get_db
from schemas.operational_event import OperationalEventCreate
from services.event_ingestion import ingest_operational_event

logger = logging.getLogger(__name__)

# Memory-backed async queue for event streaming pipeline
_EVENT_QUEUE: asyncio.Queue[dict[str, Any]] = asyncio.Queue()
_WORKER_TASK: asyncio.Task | None = None

# Webhook event_type strings → OperationalEventType enum values
_EVENT_TYPE_MAP: dict[str, str] = {
    "deployment_created": "deployment",
    "deployment": "deployment",
    "error_spike_detected": "error_spike",
    "error_spike": "error_spike",
    "payment_failures_increased": "payment_failure",
    "payment_failure": "payment_failure",
    "infrastructure_alert": "infrastructure_alert",
    "support_ticket": "support_ticket",
    "customer_complaint": "customer_complaint",
    "sla_violation": "sla_violation",
    "remediation_action": "remediation_action",
}

async def publish_event(event_payload: dict[str, Any]) -> None:
    """Publish an ingested webhook operational event to the streaming queue."""
    await _EVENT_QUEUE.put(event_payload)
    logger.info(f"Published event {event_payload.get('event_type')} to ingestion stream")

async def _stream_worker() -> None:
    """Async background worker processing streaming event queue."""
    logger.info("Starting background event stream processor worker loop...")
    while True:
        try:
            event = await _EVENT_QUEUE.get()
            logger.info(f"Worker dequeued event: {event.get('event_type')}")

            # Normalize event_type from webhook string to valid enum value
            raw_type = event.get("event_type", "")
            normalized_type = _EVENT_TYPE_MAP.get(raw_type, raw_type)
            event["event_type"] = normalized_type

            # Ensure required fields have defaults
            if "timestamp" not in event or event["timestamp"] is None:
                event["timestamp"] = datetime.now(timezone.utc).isoformat()
            if "affected_customers" not in event:
                event["affected_customers"] = []
            if "business_context" not in event:
                event["business_context"] = {}

            # Convert raw dict → Pydantic schema (validates all fields)
            try:
                event_schema = OperationalEventCreate(**event)
            except Exception as validation_err:
                logger.error(
                    f"Event validation failed for type '{raw_type}': {validation_err}",
                    exc_info=True,
                )
                _EVENT_QUEUE.task_done()
                continue

            # Open DB session and run ingestion engine
            async for db in get_db():
                try:
                    await ingest_operational_event(db, event_schema)
                    await db.commit()
                except Exception as ex:
                    logger.error(f"Ingestion worker failed to process event: {ex}", exc_info=True)
                    await db.rollback()
                    
            _EVENT_QUEUE.task_done()
        except asyncio.CancelledError:
            logger.info("Event stream worker cancelled.")
            break
        except Exception as e:
            logger.error(f"Error in event stream worker loop: {e}", exc_info=True)
            await asyncio.sleep(1)

def start_event_stream_processor() -> None:
    """Bootstrap background stream worker task."""
    global _WORKER_TASK
    if _WORKER_TASK is None or _WORKER_TASK.done():
        _WORKER_TASK = asyncio.create_task(_stream_worker())
        logger.info("Event stream worker task successfully scheduled.")

async def stop_event_stream_processor() -> None:
    """Gracefully shutdown background stream worker task."""
    global _WORKER_TASK
    if _WORKER_TASK and not _WORKER_TASK.done():
        _WORKER_TASK.cancel()
        try:
            await _WORKER_TASK
        except asyncio.CancelledError:
            pass
        logger.info("Event stream worker task successfully shutdown.")
