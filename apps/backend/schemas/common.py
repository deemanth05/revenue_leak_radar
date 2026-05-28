"""
Common Pydantic v2 schemas shared across the API.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    """Generic success wrapper."""

    data: T
    message: str = "success"
    timestamp: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))


class ApiError(BaseModel):
    """Error response body."""

    detail: str
    code: str = "error"
    timestamp: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated list wrapper."""

    items: list[T]
    total: int
    page: int
    page_size: int
    has_next: bool
    has_prev: bool

    @classmethod
    def build(
        cls,
        items: list[T],
        total: int,
        page: int,
        page_size: int,
    ) -> "PaginatedResponse[T]":
        return cls(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            has_next=(page * page_size) < total,
            has_prev=page > 1,
        )


class HealthResponse(BaseModel):
    """Health check response."""

    status: str
    db_status: str
    version: str
    uptime_seconds: float
