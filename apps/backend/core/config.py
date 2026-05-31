"""
Application configuration loaded from environment variables / .env file.
"""
from __future__ import annotations

import functools
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
        env_list_delimiter=",",
    )

    # ── Database ───────────────────────────────────────────────────────────
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/revenue_leak_radar"
    )

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def _normalize_db_url(cls, v: str) -> str:
        if v.startswith("postgresql://"):
            v = v.replace("postgresql://", "postgresql+asyncpg://", 1)
        if "sslmode=" in v:
            v = v.replace("sslmode=", "ssl=")
        return v

    REDIS_URL: str = Field(default="redis://localhost:6379/0")

    # ── App ────────────────────────────────────────────────────────────────
    ENVIRONMENT: Literal["development", "staging", "production"] = Field(
        default="development"
    )
    DEBUG: bool = Field(default=True)
    SECRET_KEY: str = Field(default="change-me-in-production-please")
    VERSION: str = Field(default="0.1.0")

    # ── CORS ───────────────────────────────────────────────────────────────
    ALLOWED_ORIGINS: list[str] = Field(
        default=["http://localhost:3000", "http://localhost:5173"]
    )

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def _parse_origins(cls, v: str | list[str]) -> list[str]:
        if isinstance(v, str):
            return [o.strip() for o in v.split(",") if o.strip()]
        return v

    # ── AI Providers ───────────────────────────────────────────────────────
    GEMINI_API_KEY: str = Field(default="")
    GEMINI_MODEL: str = Field(default="gemini-2.0-flash")

    GROQ_API_KEY: str = Field(default="")
    GROQ_MODEL: str = Field(default="llama-3.1-8b-instant")

    OPENROUTER_API_KEY: str = Field(default="")
    OPENROUTER_MODEL: str = Field(default="mistralai/mistral-7b-instruct")
    OPENROUTER_BASE_URL: str = Field(default="https://openrouter.ai/api/v1")

    # ── AI Preferences ─────────────────────────────────────────────────────
    PREFERRED_AI_PROVIDER: Literal["gemini", "groq", "openrouter", "mock"] = Field(
        default="mock"
    )
    AI_MOCK_MODE: bool = Field(default=False)
    AI_MAX_TOKENS: int = Field(default=2048)
    AI_TEMPERATURE: float = Field(default=0.3)

    # ── Derived ────────────────────────────────────────────────────────────
    @property
    def effective_ai_provider(self) -> Literal["gemini", "groq", "openrouter", "mock"]:
        """Return the first provider that has a configured API key."""
        if self.AI_MOCK_MODE:
            return "mock"

        priority: list[tuple[Literal["gemini", "groq", "openrouter", "mock"], str]] = [
            ("gemini", self.GEMINI_API_KEY),
            ("groq", self.GROQ_API_KEY),
            ("openrouter", self.OPENROUTER_API_KEY),
        ]

        if self.PREFERRED_AI_PROVIDER != "mock":
            # Move preferred provider to the front
            priority.sort(
                key=lambda x: 0 if x[0] == self.PREFERRED_AI_PROVIDER else 1
            )

        for provider, key in priority:
            if key:
                return provider

        return "mock"


@functools.lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return cached Settings singleton."""
    return Settings()
