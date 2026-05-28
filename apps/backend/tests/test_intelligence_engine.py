import sys
import os
import unittest
from datetime import datetime, timezone, timedelta
from decimal import Decimal
import uuid

# Configure path so backend modules can be imported
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import models & services
from models.deployment import Deployment, DeploymentStatus
from models.incident import Incident, IncidentSeverity, IncidentStatus
from models.alert import Alert, AlertSeverity, AlertSource
from models.payment_failure import PaymentFailure
from models.support_ticket import SupportTicket
from models.customer import Customer, CustomerTier

from services.correlation_engine import correlate_deployment_to_incident, correlate_incident_signals
from services.revenue_scorer import calculate_revenue_impact, calculate_incident_priority_score


class TestIntelligenceEngine(unittest.TestCase):
    def test_deployment_correlation(self) -> None:
        # Test 1: Deploy happened within 10 min before error spike -> HIGH (0.85)
        deploy = Deployment(
            commit_hash="abc123f",
            branch="main",
            author="Dev",
            repository="checkout-service",
            deployed_at=datetime.now(timezone.utc) - timedelta(minutes=10)
        )
        spike_time = datetime.now(timezone.utc)
        score = correlate_deployment_to_incident(deploy, spike_time)
        self.assertEqual(score, 0.85)

        # Test 2: Deploy happened within same hour -> MEDIUM (0.55)
        deploy.deployed_at = datetime.now(timezone.utc) - timedelta(minutes=45)
        score = correlate_deployment_to_incident(deploy, spike_time)
        self.assertEqual(score, 0.55)

        # Test 3: Deploy after the spike -> 0.0
        deploy.deployed_at = datetime.now(timezone.utc) + timedelta(minutes=10)
        score = correlate_deployment_to_incident(deploy, spike_time)
        self.assertEqual(score, 0.0)

    def test_multi_signal_correlation(self) -> None:
        now = datetime.now(timezone.utc)
        
        # Test empty input
        res = correlate_incident_signals([], [], [])
        self.assertEqual(res.confidence, 0.0)
        self.assertIn("No signals provided", res.reasoning)

        # Build dummy events
        payment_failures = [
            PaymentFailure(amount=Decimal("100"), failed_at=now - timedelta(minutes=5))
            for _ in range(5)
        ]
        tickets = [
            SupportTicket(subject="Error", created_at=now - timedelta(minutes=2))
            for _ in range(2)
        ]
        alerts = [
            Alert(source=AlertSource.sentry, title="Error spike", triggered_at=now - timedelta(minutes=10), severity=AlertSeverity.critical, message="error")
        ]

        res = correlate_incident_signals(payment_failures, tickets, alerts)
        self.assertGreater(res.confidence, 0.0)
        self.assertIn("5 payment failures", res.reasoning)

    def test_revenue_impact_calculation(self) -> None:
        now = datetime.now(timezone.utc)
        
        # Incident
        incident = Incident(
            title="Checkout Outage",
            severity=IncidentSeverity.critical,
            status=IncidentStatus.active,
            started_at=now - timedelta(hours=2),
            affected_customer_count=1,
            estimated_revenue_impact_daily=Decimal("0")
        )

        # Enterprise Customer
        customer = Customer(
            id=uuid.uuid4(),
            name="Acme Corp",
            email="acme@corp.com",
            tier=CustomerTier.enterprise,
            mrr=Decimal("15000.00"),  # $15k MRR -> $500/day
            is_sla_customer=True
        )

        # Premium Customer
        premium_customer = Customer(
            id=uuid.uuid4(),
            name="Beta LLC",
            email="beta@llc.com",
            tier=CustomerTier.premium,
            mrr=Decimal("3000.00"),   # $3k MRR -> $100/day
            is_sla_customer=False
        )

        # Link ticket to customer
        ticket = SupportTicket(
            customer_id=customer.id,
            subject="Checkout failing",
            priority="urgent",
            status="open",
            created_at=now - timedelta(minutes=30)
        )
        customer.support_tickets = [ticket]

        # Payment failures
        payment_failures = [
            PaymentFailure(
                customer_id=customer.id,
                amount=Decimal("4500.00"),
                failed_at=now - timedelta(minutes=45)
            )
        ]

        res = calculate_revenue_impact(incident, payment_failures, [customer, premium_customer])
        
        self.assertGreater(res.revenue_at_risk_daily, Decimal("0"))
        self.assertGreater(res.churn_probability, 0.0)

    def test_priority_score(self) -> None:
        now = datetime.now(timezone.utc)
        incident = Incident(
            title="Checkout Outage",
            severity=IncidentSeverity.critical,
            status=IncidentStatus.active,
            started_at=now - timedelta(hours=1),
            affected_customer_count=50,
            estimated_revenue_impact_daily=Decimal("42000.00")
        )

        score = calculate_incident_priority_score(incident)
        self.assertGreater(score, 0.0)
        self.assertLessEqual(score, 100.0)


if __name__ == "__main__":
    unittest.main()
