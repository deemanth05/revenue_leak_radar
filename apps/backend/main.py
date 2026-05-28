"""
Revenue Leak Radar — FastAPI application entry point.
"""
from __future__ import annotations

import time
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse

from core.config import get_settings
from core.database import engine, init_db
from core.logging import get_logger
from schemas.common import ApiError

logger = get_logger(__name__)
settings = get_settings()

_startup_time: float = time.time()


# ── Lifespan ───────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    global _startup_time
    _startup_time = time.time()

    logger.info(
        "Starting Revenue Leak Radar API",
        extra={
            "version": settings.VERSION,
            "environment": settings.ENVIRONMENT,
            "ai_provider": settings.effective_ai_provider,
        },
    )

    await init_db()
    logger.info("Database tables verified/created")

    # Start event stream background processor
    from services.event_stream import start_event_stream_processor
    start_event_stream_processor()

    # Share startup time with health router
    from routers.health import set_start_time
    set_start_time(_startup_time)

    yield

    logger.info("Shutting down Revenue Leak Radar API")
    from services.event_stream import stop_event_stream_processor
    await stop_event_stream_processor()
    await engine.dispose()


# ── App factory ────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Revenue Leak Radar API",
    version=settings.VERSION,
    description=(
        "Real-time revenue impact detection and correlation engine. "
        "Connects deployment events, error spikes, payment failures, and support tickets "
        "to surface revenue risk instantly."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# ── CORS ───────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from core.observability import ObservabilityMiddleware
app.add_middleware(ObservabilityMiddleware)


# ── Exception handlers ─────────────────────────────────────────────────────────

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content=ApiError(detail=str(exc.detail), code="http_error").model_dump(mode="json"),
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled exception", exc_info=exc)
    return JSONResponse(
        status_code=500,
        content=ApiError(
            detail="An unexpected internal error occurred.",
            code="internal_server_error",
        ).model_dump(mode="json"),
    )


# ── Routers ────────────────────────────────────────────────────────────────────

from routers.health import router as health_router
from routers.incidents import router as incidents_router
from routers.deployments import router as deployments_router
from routers.revenue import router as revenue_router
from routers.alerts import router as alerts_router
from routers.support_tickets import router as support_tickets_router
from routers.executive_summaries import router as executive_router
from routers.remediation import router as remediation_router
from routers.timeline import router as timeline_router
from routers.simulations import router as simulations_router
from routers.auth import router as auth_router
from routers.integrations import router as integrations_router
from routers.coral import router as coral_router

# Health lives at root level (/health)
app.include_router(health_router)

API_PREFIX = "/api/v1"
app.include_router(incidents_router, prefix=API_PREFIX)
app.include_router(deployments_router, prefix=API_PREFIX)
app.include_router(revenue_router, prefix=API_PREFIX)
app.include_router(alerts_router, prefix=API_PREFIX)
app.include_router(support_tickets_router, prefix=API_PREFIX)
app.include_router(executive_router, prefix=API_PREFIX)
app.include_router(remediation_router, prefix=API_PREFIX)
app.include_router(timeline_router, prefix=API_PREFIX)
app.include_router(simulations_router, prefix=API_PREFIX)
app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(integrations_router, prefix=API_PREFIX)
app.include_router(coral_router, prefix=API_PREFIX)



# ── Root redirect ──────────────────────────────────────────────────────────────

@app.get("/", include_in_schema=False)
async def root() -> RedirectResponse:
    return RedirectResponse(url="/docs")


# ── Dev runner ─────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info",
    )
