"""
deployments.py — Generates realistic GitHub-style deployment records.

Demo scenario guarantee
-----------------------
The list always contains one deployment with:
  commit_hash  = 'abc123f'
  repository   = 'checkout-service'
  environment  = 'production'
  status       = 'success'
  deployed_at  = now() - 90 minutes

This is the deployment that triggers the cascade of payment failures,
Sentry alerts, and Zendesk tickets in the demo.
"""

import random
import string
from typing import Any

from .base import BaseGenerator


_REPOSITORIES = [
    "checkout-service",
    "auth-service",
    "payment-processor",
    "api-gateway",
    "notification-service",
    "analytics-pipeline",
    "customer-portal",
    "billing-service",
]

_AUTHORS = [
    "alice.chen", "bob.martinez", "carol.johnson", "dan.kim",
    "eve.okafor", "frank.li", "grace.patel", "henry.wang",
    "iris.russo", "james.osei",
]

_BRANCH_TEMPLATES = [
    "main",
    "main",
    "main",  # weight main higher
    "feature/checkout-{slug}",
    "feature/auth-{slug}",
    "feature/payment-{slug}",
    "feature/perf-{slug}",
    "hotfix/{slug}-fix",
    "hotfix/critical-{slug}",
    "release/v{major}.{minor}.0",
]

_SLUGS = [
    "refactor", "cleanup", "timeout-handling", "retry-logic",
    "currency-rounding", "session-expiry", "coupon-validation",
    "webhook-retry", "rate-limiter", "cache-warm",
]

_ENVIRONMENTS = ["production", "production", "staging", "staging", "development"]

_STATUSES = ["success", "success", "success", "success", "failure", "in_progress"]

_CHANGE_TYPES = ["feature", "bugfix", "refactor", "hotfix", "dependency-update", "config"]


def _random_hash(rng: random.Random, length: int = 7) -> str:
    chars = string.hexdigits[:16]  # 0-9 a-f
    return "".join(rng.choice(chars) for _ in range(length))


def _random_branch(rng: random.Random) -> str:
    template = rng.choice(_BRANCH_TEMPLATES)
    slug = rng.choice(_SLUGS)
    major = rng.randint(1, 5)
    minor = rng.randint(0, 20)
    return template.format(slug=slug, major=major, minor=minor)


class DeploymentGenerator(BaseGenerator):
    """
    Generates a stream of realistic deployment records.

    The demo deployment (commit abc123f) is always injected at index 0
    regardless of ``count``.
    """

    # The canonical demo deployment — never changes
    DEMO_COMMIT = "abc123f"
    DEMO_REPO = "checkout-service"

    def generate(self, count: int = 20) -> list[dict[str, Any]]:
        """
        Generate deployment records.

        Parameters
        ----------
        count : int
            Total number of deployments to generate, including the demo one.
            Minimum effective value is 1.

        Returns
        -------
        list[dict[str, Any]]
            Deployment records ordered newest-first.
        """
        rng = random.Random(self.seed)

        # --- Demo deployment (always first / most recent) ---
        demo_deployed_at = self.past_datetime(1.5)  # 90 minutes ago
        demo = {
            "id": "deploy_abc123f_prod",
            "commit_hash": self.DEMO_COMMIT,
            "commit_hash_full": self.DEMO_COMMIT + _random_hash(rng, 33),
            "repository": self.DEMO_REPO,
            "branch": "main",
            "environment": "production",
            "status": "success",
            "author": "alice.chen",
            "author_email": "alice.chen@company.internal",
            "deployed_at": self.iso(demo_deployed_at),
            "duration_seconds": 143,
            "change_type": "feature",
            "pr_number": 2847,
            "pr_title": "feat(checkout): add retry logic for Stripe webhook delivery",
            "commit_message": "feat(checkout): add retry logic for Stripe webhook delivery\n\nImplements exponential backoff for failed webhook deliveries.\nAdds prometheus metrics for retry attempts.",
            "files_changed": 12,
            "lines_added": 287,
            "lines_removed": 43,
            "pipeline_url": f"https://ci.company.internal/pipelines/{self.DEMO_REPO}/2847",
            "rollback_available": True,
            "previous_commit": _random_hash(rng),
            "tags": ["release", "webhook", "reliability"],
        }

        deployments: list[dict[str, Any]] = [demo]

        # --- Background deployments ---
        background_count = max(0, count - 1)
        for i in range(background_count):
            hours_ago = rng.uniform(2, 72)  # anywhere from 2h to 3 days ago
            repo = rng.choice(_REPOSITORIES)
            commit = _random_hash(rng)
            status = rng.choice(_STATUSES)
            author = rng.choice(_AUTHORS)
            env = rng.choice(_ENVIRONMENTS)

            dep = {
                "id": f"deploy_{commit}_{env[:4]}",
                "commit_hash": commit,
                "commit_hash_full": commit + _random_hash(rng, 33),
                "repository": repo,
                "branch": _random_branch(rng),
                "environment": env,
                "status": status,
                "author": author,
                "author_email": f"{author}@company.internal",
                "deployed_at": self.iso(self.past_datetime(hours_ago)),
                "duration_seconds": rng.randint(60, 600),
                "change_type": rng.choice(_CHANGE_TYPES),
                "pr_number": rng.randint(2000, 2846),
                "pr_title": self.faker.sentence(nb_words=8).rstrip("."),
                "commit_message": self.faker.paragraph(nb_sentences=2),
                "files_changed": rng.randint(1, 40),
                "lines_added": rng.randint(5, 800),
                "lines_removed": rng.randint(0, 300),
                "pipeline_url": f"https://ci.company.internal/pipelines/{repo}/{rng.randint(2000, 2846)}",
                "rollback_available": rng.random() > 0.2,
                "previous_commit": _random_hash(rng),
                "tags": [],
            }

            # Add failure details if status is 'failure'
            if status == "failure":
                dep["failure_reason"] = rng.choice([
                    "Unit tests failed (17 assertions)",
                    "Integration test timeout",
                    "Docker build error: layer cache miss",
                    "Health check failed after 3 retries",
                    "Deployment quota exceeded",
                ])

            deployments.append(dep)

        # Sort newest first by deployed_at
        deployments.sort(key=lambda d: d["deployed_at"], reverse=True)
        return deployments
