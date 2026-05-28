"""
Authentication router.
"""
from __future__ import annotations

import uuid
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr

from core.auth import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])

# In-memory user database for demo productionization purposes
# In production this would be backed by a `users` DB table.
_USERS_DB: dict[str, dict[str, Any]] = {
    "admin": {
        "username": "admin",
        "email": "admin@acme.com",
        "hashed_password": hash_password("admin_password"),
        "role": "admin",
        "tenant_id": str(uuid.UUID("e8b8c8d8-e8b8-40a2-b168-74a41beee348"))
    },
    "sre_user": {
        "username": "sre_user",
        "email": "sre@acme.com",
        "hashed_password": hash_password("sre_password"),
        "role": "sre",
        "tenant_id": str(uuid.UUID("e8b8c8d8-e8b8-40a2-b168-74a41beee348"))
    }
}

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
async def register(payload: UserRegister) -> dict[str, str]:
    if payload.username in _USERS_DB:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    tenant_id = payload.tenant_id or str(uuid.uuid4())
    hashed_pwd = hash_password(payload.password)
    
    user_record = {
        "username": payload.username,
        "email": payload.email,
        "hashed_password": hashed_pwd,
        "role": payload.role,
        "tenant_id": tenant_id
    }
    
    _USERS_DB[payload.username] = user_record
    
    token = create_access_token({
        "sub": payload.username,
        "role": payload.role,
        "tenant_id": tenant_id
    })
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": payload.role,
        "tenant_id": tenant_id
    }

@router.post("/token", response_model=TokenResponse, summary="Retrieve JWT access token")
async def login(payload: UserLogin) -> dict[str, str]:
    user = _USERS_DB.get(payload.username)
    if not user or not verify_password(payload.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
        
    token = create_access_token({
        "sub": user["username"],
        "role": user["role"],
        "tenant_id": user["tenant_id"]
    })
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user["role"],
        "tenant_id": user["tenant_id"]
    }
