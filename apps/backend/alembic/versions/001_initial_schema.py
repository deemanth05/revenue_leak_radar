"""Initial schema — all 8 tables

Revision ID: 001
Revises:
Create Date: 2026-05-28 00:00:00.000000

"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# ── ENUM type names ────────────────────────────────────────────────────────────

def upgrade() -> None:
    # ── Create ENUM types ──────────────────────────────────────────────────
    customer_tier = postgresql.ENUM(
        "enterprise", "premium", "standard", "trial",
        name="customer_tier", create_type=True,
    )
    deployment_environment = postgresql.ENUM(
        "staging", "production",
        name="deployment_environment", create_type=True,
    )
    deployment_status = postgresql.ENUM(
        "in_progress", "success", "failed", "rolled_back",
        name="deployment_status", create_type=True,
    )
    incident_severity = postgresql.ENUM(
        "critical", "high", "medium", "low",
        name="incident_severity", create_type=True,
    )
    incident_status = postgresql.ENUM(
        "active", "investigating", "mitigating", "resolved", "closed",
        name="incident_status", create_type=True,
    )
    incident_source = postgresql.ENUM(
        "sentry", "datadog", "manual", "correlation_engine",
        name="incident_source", create_type=True,
    )
    alert_source = postgresql.ENUM(
        "sentry", "datadog", "grafana", "custom",
        name="alert_source", create_type=True,
    )
    alert_severity = postgresql.ENUM(
        "critical", "high", "medium", "low", "info",
        name="alert_severity", create_type=True,
    )
    ticket_priority = postgresql.ENUM(
        "low", "normal", "high", "urgent",
        name="ticket_priority", create_type=True,
    )
    ticket_status = postgresql.ENUM(
        "open", "pending", "resolved", "closed",
        name="ticket_status", create_type=True,
    )
    ticket_source = postgresql.ENUM(
        "zendesk", "intercom", "email", "manual",
        name="ticket_source", create_type=True,
    )
    action_type = postgresql.ENUM(
        "rollback", "scale_up", "notify_slack", "create_jira", "hotfix", "manual",
        name="action_type", create_type=True,
    )
    action_status = postgresql.ENUM(
        "pending", "in_progress", "completed", "failed", "skipped",
        name="action_status", create_type=True,
    )

    for enum_type in [
        customer_tier, deployment_environment, deployment_status,
        incident_severity, incident_status, incident_source,
        alert_source, alert_severity,
        ticket_priority, ticket_status, ticket_source,
        action_type, action_status,
    ]:
        enum_type.create(op.get_bind(), checkfirst=True)

    # ── 1. customers ───────────────────────────────────────────────────────
    op.create_table(
        "customers",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("tier", sa.String(20), nullable=False, server_default="standard"),
        sa.Column("mrr", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("contract_value_annual", sa.Numeric(14, 2), nullable=True),
        sa.Column("is_sla_customer", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("sla_tier", sa.String(50), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
    )
    op.create_index("ix_customers_email", "customers", ["email"], unique=True)

    # ── 2. deployments ─────────────────────────────────────────────────────
    op.create_table(
        "deployments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("commit_hash", sa.String(64), nullable=False),
        sa.Column("branch", sa.String(255), nullable=False),
        sa.Column("author", sa.String(255), nullable=False),
        sa.Column("repository", sa.String(255), nullable=False),
        sa.Column("environment", sa.String(20), nullable=False, server_default="production"),
        sa.Column("status", sa.String(20), nullable=False, server_default="in_progress"),
        sa.Column("deployed_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("duration_seconds", sa.Integer, nullable=True),
        sa.Column("rollback_of", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["rollback_of"], ["deployments.id"], ondelete="SET NULL"
        ),
    )

    # ── 3. incidents ───────────────────────────────────────────────────────
    op.create_table(
        "incidents",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("description", sa.Text, nullable=False, server_default=""),
        sa.Column("severity", sa.String(20), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="active"),
        sa.Column("source", sa.String(30), nullable=False, server_default="manual"),
        sa.Column("deployment_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("error_rate", sa.Float, nullable=False, server_default="0"),
        sa.Column("affected_customer_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column(
            "estimated_revenue_impact_daily",
            sa.Numeric(12, 2),
            nullable=False,
            server_default="0",
        ),
        sa.Column("correlation_confidence", sa.Float, nullable=False, server_default="0"),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["deployment_id"], ["deployments.id"], ondelete="SET NULL"
        ),
    )
    op.create_index("ix_incidents_severity", "incidents", ["severity"])
    op.create_index("ix_incidents_status", "incidents", ["status"])
    op.create_index(
        "ix_incidents_revenue_impact_desc",
        "incidents",
        [sa.text("estimated_revenue_impact_daily DESC")],
    )
    op.create_index("ix_incidents_deployment_id", "incidents", ["deployment_id"])

    # ── 4. alerts ──────────────────────────────────────────────────────────
    op.create_table(
        "alerts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("incident_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("source", sa.String(20), nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("message", sa.Text, nullable=False, server_default=""),
        sa.Column("severity", sa.String(20), nullable=False),
        sa.Column(
            "metadata",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default="{}",
        ),
        sa.Column("triggered_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("acknowledged_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["incident_id"], ["incidents.id"], ondelete="SET NULL"
        ),
    )
    op.create_index("ix_alerts_incident_id", "alerts", ["incident_id"])

    # ── 5. payment_failures ────────────────────────────────────────────────
    op.create_table(
        "payment_failures",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("incident_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("customer_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("currency", sa.String(3), nullable=False, server_default="USD"),
        sa.Column("failure_reason", sa.String(500), nullable=False, server_default=""),
        sa.Column("stripe_payment_intent_id", sa.String(255), nullable=False, server_default=""),
        sa.Column("failed_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["incident_id"], ["incidents.id"], ondelete="SET NULL"
        ),
        sa.ForeignKeyConstraint(
            ["customer_id"], ["customers.id"], ondelete="CASCADE"
        ),
    )
    op.create_index("ix_payment_failures_incident_id", "payment_failures", ["incident_id"])
    op.create_index("ix_payment_failures_customer_id", "payment_failures", ["customer_id"])
    op.create_index(
        "ix_payment_failures_stripe_id",
        "payment_failures",
        ["stripe_payment_intent_id"],
    )

    # ── 6. support_tickets ─────────────────────────────────────────────────
    op.create_table(
        "support_tickets",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("incident_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("customer_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("subject", sa.String(500), nullable=False),
        sa.Column("priority", sa.String(20), nullable=False, server_default="normal"),
        sa.Column("status", sa.String(20), nullable=False, server_default="open"),
        sa.Column("source", sa.String(20), nullable=False, server_default="zendesk"),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["incident_id"], ["incidents.id"], ondelete="SET NULL"
        ),
        sa.ForeignKeyConstraint(
            ["customer_id"], ["customers.id"], ondelete="CASCADE"
        ),
    )
    op.create_index("ix_support_tickets_incident_id", "support_tickets", ["incident_id"])
    op.create_index("ix_support_tickets_customer_id", "support_tickets", ["customer_id"])

    # ── 7. revenue_events ──────────────────────────────────────────────────
    op.create_table(
        "revenue_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("incident_id", postgresql.UUID(as_uuid=True), nullable=False, unique=True),
        sa.Column(
            "revenue_at_risk_daily", sa.Numeric(12, 2), nullable=False, server_default="0"
        ),
        sa.Column(
            "revenue_at_risk_weekly", sa.Numeric(12, 2), nullable=False, server_default="0"
        ),
        sa.Column("churn_probability", sa.Float, nullable=False, server_default="0"),
        sa.Column("affected_mrr", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("calculation_method", sa.String(100), nullable=False),
        sa.Column(
            "breakdown",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default="{}",
        ),
        sa.Column("calculated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["incident_id"], ["incidents.id"], ondelete="CASCADE"
        ),
    )
    op.create_index("ix_revenue_events_incident_id", "revenue_events", ["incident_id"])

    # ── 8. remediation_actions ─────────────────────────────────────────────
    op.create_table(
        "remediation_actions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("incident_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("action_type", sa.String(30), nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("description", sa.Text, nullable=False, server_default=""),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("assigned_to", sa.String(255), nullable=True),
        sa.Column("priority_order", sa.Integer, nullable=False, server_default="0"),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["incident_id"], ["incidents.id"], ondelete="CASCADE"
        ),
    )
    op.create_index(
        "ix_remediation_actions_incident_id", "remediation_actions", ["incident_id"]
    )


def downgrade() -> None:
    op.drop_table("remediation_actions")
    op.drop_table("revenue_events")
    op.drop_table("support_tickets")
    op.drop_table("payment_failures")
    op.drop_table("alerts")
    op.drop_table("incidents")
    op.drop_table("deployments")
    op.drop_table("customers")

    # Drop ENUM types
    for enum_name in [
        "action_status", "action_type",
        "ticket_source", "ticket_status", "ticket_priority",
        "alert_severity", "alert_source",
        "incident_source", "incident_status", "incident_severity",
        "deployment_status", "deployment_environment",
        "customer_tier",
    ]:
        op.execute(f"DROP TYPE IF EXISTS {enum_name}")
