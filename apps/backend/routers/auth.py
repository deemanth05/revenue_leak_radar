"""
Authentication router.
"""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.auth import hash_password, verify_password, create_access_token
from core.database import get_db
from models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])


class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: str = "sre"
    tenant_id: str | None = None

class UserLogin(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    tenant_id: str


@router.post("/register", response_model=TokenResponse, summary="Register a new enterprise user")
async def register(payload: UserRegister, db: AsyncSession = Depends(get_db)) -> dict[str, str]:
    existing = await db.execute(select(User).where(User.username == payload.username))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered",
        )

    tenant_id = uuid.UUID(payload.tenant_id) if payload.tenant_id else uuid.uuid4()
    user = User(
        username=payload.username,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=payload.role,
        tenant_id=tenant_id,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    token = create_access_token({
        "sub": user.username,
        "role": user.role,
        "tenant_id": str(user.tenant_id),
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "tenant_id": str(user.tenant_id),
    }


@router.post("/token", response_model=TokenResponse, summary="Retrieve JWT access token")
async def login(payload: UserLogin, db: AsyncSession = Depends(get_db)) -> dict[str, str]:
    result = await db.execute(select(User).where(User.username == payload.username))
    user = result.scalar_one_or_none()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    token = create_access_token({
        "sub": user.username,
        "role": user.role,
        "tenant_id": str(user.tenant_id),
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "tenant_id": str(user.tenant_id),
    }
