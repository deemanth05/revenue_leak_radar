"""
SRE Structured Observability, Tracing and Metrics.
Exposes standard Prometheus-compatible scraped telemetry endpoints.
"""
from __future__ import annotations

import time
import uuid
import logging
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)

# Structured global SRE metrics registries
_API_REQUESTS_TOTAL: dict[str, int] = {}
_API_LATENCY_SUM: dict[str, float] = {}

class ObservabilityMiddleware(BaseHTTPMiddleware):
    """SRE Tracing Middleware injecting request IDs and collecting execution latency."""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        
        # Track context variables
        start_time = time.time()
        
        # Inject tracing headers
        response: Response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        
        duration = time.time() - start_time
        response.headers["X-Response-Time-Seconds"] = f"{duration:.4f}"
        
        # Exclude metrics scraping itself from metrics telemetry
        path = request.url.path
        if path != "/metrics":
            method = request.method
            status_code = str(response.status_code)
            metric_key = f'method="{method}",path="{path}",status="{status_code}"'
            
            _API_REQUESTS_TOTAL[metric_key] = _API_REQUESTS_TOTAL.get(metric_key, 0) + 1
            _API_LATENCY_SUM[metric_key] = _API_LATENCY_SUM.get(metric_key, 0) + duration
            
            logger.info(
                f"SRE Trace request: {method} {path} resolved with {status_code} in {duration*1000:.2f}ms",
                extra={"request_id": request_id, "latency_seconds": duration}
            )
            
        return response

def get_prometheus_metrics() -> str:
    """Format stored metrics into standard Prometheus scraper payload."""
    lines = [
        "# HELP http_requests_total Total number of HTTP requests processed by endpoint.",
        "# TYPE http_requests_total counter"
    ]
    for labels, count in _API_REQUESTS_TOTAL.items():
        lines.append(f"http_requests_total{{{labels}}} {count}")
        
    lines.append("# HELP http_request_duration_seconds_sum Sum of latency durations in seconds.")
    lines.append("# TYPE http_request_duration_seconds_sum counter")
    for labels, lat_sum in _API_LATENCY_SUM.items():
        lines.append(f"http_request_duration_seconds_sum{{{labels}}} {lat_sum:.6f}")
        
    return "\n".join(lines) + "\n"
