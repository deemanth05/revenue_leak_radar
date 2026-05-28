"""
Deployments router.
"""
from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from models.deployment import Deployment
from schemas.deployment import DeploymentCreate, DeploymentResponse, DeploymentUpdate

router = APIRouter(prefix="/deployments", tags=["deployments"])


async def _get_deployment_or_404(deployment_id: uuid.UUID, db: AsyncSession) -> Deployment:
    result = await db.execute(select(Deployment).where(Deployment.id == deployment_id))
    dep = result.scalar_one_or_none()
    if dep is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deployment not found")
    return dep


@router.get("/", response_model=list[DeploymentResponse], summary="List deployments")
async def list_deployments(
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
    db: AsyncSession = Depends(get_db),
) -> list[DeploymentResponse]:
    result = await db.execute(
        select(Deployment)
        .order_by(Deployment.deployed_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return [DeploymentResponse.model_validate(d) for d in result.scalars().all()]


@router.get("/{deployment_id}", response_model=DeploymentResponse, summary="Get deployment")
async def get_deployment(
    deployment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> DeploymentResponse:
    dep = await _get_deployment_or_404(deployment_id, db)
    return DeploymentResponse.model_validate(dep)


@router.post(
    "/",
    response_model=DeploymentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create deployment",
)
async def create_deployment(
    payload: DeploymentCreate,
    db: AsyncSession = Depends(get_db),
) -> DeploymentResponse:
    deployment = Deployment(**payload.model_dump())
    db.add(deployment)
    await db.flush()
    await db.refresh(deployment)
    return DeploymentResponse.model_validate(deployment)


@router.patch("/{deployment_id}/status", response_model=DeploymentResponse, summary="Update deployment status")
async def update_deployment_status(
    deployment_id: uuid.UUID,
    payload: DeploymentUpdate,
    db: AsyncSession = Depends(get_db),
) -> DeploymentResponse:
    dep = await _get_deployment_or_404(deployment_id, db)
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(dep, key, value)
    await db.flush()
    await db.refresh(dep)
    return DeploymentResponse.model_validate(dep)
