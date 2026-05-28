"""
Enterprise authentication and Role-Based Access Control (RBAC).

Custom implementation of standard JWT signing using HMAC-SHA256
to ensure zero third-party library dependencies.
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import secrets
import time
from typing import Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from core.config import get_settings

settings = get_settings()
security = HTTPBearer()

# Salt / Password helper using PBKDF2 (SHA-256)
def hash_password(password: str, salt: str | None = None) -> str:
    """Hash password natively using standard PBKDF2."""
    if salt is None:
        salt = secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    )
    return f"{salt}:{base64.b64encode(dk).decode('utf-8')}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify standard PBKDF2 hash matches plain password."""
    try:
        salt, expected_hash = hashed_password.split(":")
        test_hash = hash_password(plain_password, salt)
        return hmac.compare_digest(test_hash, hashed_password)
    except Exception:
        return False

# Custom JWT HS256 sign/verify helpers
def _b64_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode('utf-8').replace('=', '')

def _b64_decode(data: str) -> bytes:
    padding = '=' * (4 - (len(data) % 4))
    return base64.urlsafe_b64decode(data + padding)

def create_access_token(data: dict[str, Any], expires_delta_seconds: int = 3600) -> str:
    """Generate standard HS256 JWT token using hmac and hashlib."""
    header = {"alg": "HS256", "typ": "JWT"}
    payload = data.copy()
    payload["exp"] = int(time.time()) + expires_delta_seconds

    header_b64 = _b64_encode(json.dumps(header).encode('utf-8'))
    payload_b64 = _b64_encode(json.dumps(payload).encode('utf-8'))

    signing_input = f"{header_b64}.{payload_b64}".encode('utf-8')
    signature = hmac.new(
        settings.SECRET_KEY.encode('utf-8'),
        signing_input,
        hashlib.sha256
    ).digest()
    signature_b64 = _b64_encode(signature)

    return f"{header_b64}.{payload_b64}.{signature_b64}"

def decode_access_token(token: str) -> dict[str, Any]:
    """Decode and verify standard HS256 JWT token."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            raise ValueError("Invalid token segments")
        
        header_b64, payload_b64, signature_b64 = parts
        
        # Verify signature
        signing_input = f"{header_b64}.{payload_b64}".encode('utf-8')
        expected_sig = hmac.new(
            settings.SECRET_KEY.encode('utf-8'),
            signing_input,
            hashlib.sha256
        ).digest()
        expected_sig_b64 = _b64_encode(expected_sig)
        
        if not hmac.compare_digest(signature_b64, expected_sig_b64):
            raise ValueError("Signature mismatch")
            
        payload = json.loads(_b64_decode(payload_b64).decode('utf-8'))
        
        # Verify expiration
        if payload.get("exp", 0) < time.time():
            raise ValueError("Token expired")
            
        return payload
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {exc}",
            headers={"WWW-Authenticate": "Bearer"},
        )

# Dependency injection helpers
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict[str, Any]:
    """FastAPI dependency mapping token to current user claims."""
    return decode_access_token(credentials.credentials)

class RoleChecker:
    """FastAPI dependency class that checks role scopes."""
    def __init__(self, allowed_roles: list[str]) -> None:
        self.allowed_roles = allowed_roles

    def __call__(self, user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
        role = user.get("role", "viewer")
        if role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted for current user role scope"
            )
        return user
