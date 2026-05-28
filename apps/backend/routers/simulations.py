"""
Simulations router.
"""
from __future__ import annotations

from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.simulation_manager import (
    get_scenario_states,
    reset_scenario_states,
    trigger_scenario_step,
)

router = APIRouter(prefix="/simulations", tags=["simulations"])


@router.get("/states", summary="Get scenario states")
async def get_states() -> dict[str, int]:
    """Return the current step number of all simulation scenarios."""
    return get_scenario_states()


@router.post("/reset", summary="Reset simulation states")
async def reset_states() -> dict[str, str]:
    """Reset simulation step counts to 0."""
    reset_scenario_states()
    return {"status": "success", "message": "Simulation states reset to 0."}


@router.post("/{scenario_id}/step/{step_num}", summary="Trigger a scenario step")
async def trigger_step(
    scenario_id: str,
    step_num: int,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Execute a step of a specific simulation scenario and ingest telemetry."""
    states = get_scenario_states()
    if scenario_id not in states:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scenario '{scenario_id}' not found.",
        )
    
    if step_num < 1 or step_num > 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Step number must be between 1 and 6.",
        )

    res = await trigger_scenario_step(db, scenario_id, step_num)
    if res.get("status") == "error":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=res.get("message"),
        )
    return res
