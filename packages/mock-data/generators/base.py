"""
base.py — Abstract base class for all Revenue Leak Radar mock data generators.

All generators extend BaseGenerator, which:
  - Sets a fixed random seed for deterministic, reproducible output
  - Provides a seeded Faker instance for realistic synthetic data
  - Exposes helper methods for datetime arithmetic
  - Declares the abstract generate() interface
"""

import random
from abc import ABC, abstractmethod
from datetime import datetime, timedelta, timezone
from typing import Any

try:
    from faker import Faker
except ImportError as exc:
    raise ImportError(
        "The 'faker' package is required. Install it with: pip install faker"
    ) from exc


class BaseGenerator(ABC):
    """
    Seeded base generator.

    Parameters
    ----------
    seed : int
        Random seed for reproducibility. Default is 42.
        Using the same seed always produces identical data.
    """

    def __init__(self, seed: int = 42) -> None:
        self.seed = seed
        random.seed(seed)

        # Faker with a fixed seed so names, companies, etc. are reproducible
        self.faker = Faker()
        Faker.seed(seed)

    # ------------------------------------------------------------------
    # Datetime helpers
    # ------------------------------------------------------------------

    @staticmethod
    def now() -> datetime:
        """Return the current UTC datetime (timezone-aware)."""
        return datetime.now(tz=timezone.utc)

    @staticmethod
    def past_datetime(hours_ago: float) -> datetime:
        """
        Return a UTC datetime that is ``hours_ago`` hours in the past.

        Parameters
        ----------
        hours_ago : float
            Number of hours to subtract from now. Fractional values are
            accepted (e.g. 0.5 for 30 minutes ago).
        """
        return datetime.now(tz=timezone.utc) - timedelta(hours=hours_ago)

    @staticmethod
    def past_datetime_from(base: datetime, minutes_ago: float) -> datetime:
        """
        Return a datetime that is ``minutes_ago`` minutes before ``base``.

        Parameters
        ----------
        base : datetime
            The reference point.
        minutes_ago : float
            Minutes to subtract from ``base``.
        """
        return base - timedelta(minutes=minutes_ago)

    @staticmethod
    def iso(dt: datetime) -> str:
        """Format a datetime as an ISO-8601 string with 'Z' suffix."""
        return dt.strftime("%Y-%m-%dT%H:%M:%SZ")

    # ------------------------------------------------------------------
    # Abstract interface
    # ------------------------------------------------------------------

    @abstractmethod
    def generate(self, count: int = 10) -> list[dict[str, Any]]:
        """
        Generate ``count`` synthetic records.

        Parameters
        ----------
        count : int
            Number of records to generate.

        Returns
        -------
        list[dict[str, Any]]
            A list of dictionaries, each representing one record.
        """
        ...
