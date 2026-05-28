"""
Async event streaming ingestion queue pipeline.
"""
from __future__ import annotations

import asyncio
import logging
from typing import Any

from core.database import get_db
from services.event_ingestion import ingest_operational_event

logger = logging.getLogger(__name__)

# Memory-backed async queue for event streaming pipeline
_EVENT_QUEUE: asyncio.Queue[dict[str, Any]] = asyncio.Queue()
_WORKER_TASK: asyncio.Task | None = None

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
            
            # Open DB session and run ingestion engine
            async for db in get_db():
                try:
                    await ingest_operational_event(db, event)
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
