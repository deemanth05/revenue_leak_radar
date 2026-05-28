"""
Predictive Operational Intelligence layer.
"""
from __future__ import annotations

import math
import logging
from datetime import datetime, timezone
from typing import Any

logger = logging.getLogger(__name__)

def forecast_sla_breach_probability(
    started_at: datetime,
    sla_threshold_hours: float = 4.0
) -> dict[str, Any]:
    """
    Predict probability of SLA breach based on elapsed incident duration.
    Uses sigmoid decay function: P(t) = 1 / (1 + e^(-k * (t - t0)))
    """
    elapsed_hours = (datetime.now(timezone.utc) - started_at.replace(tzinfo=timezone.utc)).total_seconds() / 3600.0
    
    # Sigmoid parameters: midpoint at 75% of SLA threshold
    midpoint = 0.75 * sla_threshold_hours
    k = 3.0 / sla_threshold_hours # steepness
    
    probability = 1.0 / (1.0 + math.exp(-k * (elapsed_hours - midpoint)))
    time_remaining_mins = max(0.0, (sla_threshold_hours - elapsed_hours) * 60.0)
    
    return {
        "elapsed_hours": round(elapsed_hours, 2),
        "sla_threshold_hours": sla_threshold_hours,
        "breach_probability": round(probability, 2),
        "time_remaining_minutes": round(time_remaining_mins, 1),
        "is_breached": elapsed_hours >= sla_threshold_hours
    }

def predict_deployment_risk_score(modified_files: list[str]) -> dict[str, Any]:
    """
    Evaluate deployment risk dynamically based on modified file paths.
    Deterministic heuristics map billing and core gateway files to high risk.
    """
    base_score = 0.15
    critical_paths = ["billing", "payment", "stripe", "checkout", "auth", "session"]
    matched_paths = []
    
    for file in modified_files:
        file_lower = file.lower()
        for path in critical_paths:
            if path in file_lower and path not in matched_paths:
                base_score += 0.25
                matched_paths.append(path)
                
    risk_score = min(base_score, 1.0)
    
    return {
        "risk_score": round(risk_score, 2),
        "risk_level": "critical" if risk_score >= 0.75 else "high" if risk_score >= 0.5 else "medium" if risk_score >= 0.3 else "low",
        "contributing_paths": matched_paths
    }

def detect_regression_fingerprint(
    active_error_log: str,
    historical_incidents: list[dict[str, Any]]
) -> dict[str, Any] | None:
    """
    Compare current exception stack trace keyword footprint against resolved historical records.
    Returns matched regression metadata if similarity is above threshold.
    """
    active_tokens = set(active_error_log.lower().split())
    
    for past in historical_incidents:
        past_desc = past.get("description", "")
        past_tokens = set(past_desc.lower().split())
        
        if not active_tokens or not past_tokens:
            continue
            
        intersection = active_tokens.intersection(past_tokens)
        similarity = len(intersection) / min(len(active_tokens), len(past_tokens))
        
        if similarity >= 0.65:
            return {
                "historical_incident_id": past.get("id"),
                "title": past.get("title"),
                "similarity_score": round(similarity, 2),
                "reasons": ["matching stack trace exception fingerprint", "identical service logs"]
            }
            
    return None
