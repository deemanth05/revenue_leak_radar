// =============================================================================
// Revenue Leak Radar — Shared TypeScript Types
// All API contracts, DTOs, and domain models
// =============================================================================

import {
  AlertSeverity,
  AlertSource,
  CustomerTier,
  DeploymentEnvironment,
  DeploymentStatus,
  IncidentSeverity,
  IncidentSource,
  IncidentStatus,
  RemediationActionType,
  RemediationStatus,
  SupportTicketPriority,
  SupportTicketSource,
  SupportTicketStatus,
} from './enums';

// --- Common -------------------------------------------------------------------

export interface TimestampedEntity {
  id: string;
  created_at: string; // ISO 8601
  updated_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  success: false;
  error: string;
  detail?: string;
  timestamp: string;
}

// --- Customer -----------------------------------------------------------------

export interface Customer extends TimestampedEntity {
  name: string;
  email: string;
  tier: CustomerTier;
  mrr: number; // Monthly Recurring Revenue in USD
  contract_value_annual: number | null;
  is_sla_customer: boolean;
  sla_tier: string | null;
}

// --- Deployment ---------------------------------------------------------------

export interface Deployment extends TimestampedEntity {
  commit_hash: string;
  branch: string;
  author: string;
  repository: string;
  environment: DeploymentEnvironment;
  status: DeploymentStatus;
  deployed_at: string;
  duration_seconds: number | null;
  rollback_of: string | null; // deployment id
}

// --- Incident -----------------------------------------------------------------

export interface Incident extends TimestampedEntity {
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  source: IncidentSource;
  deployment_id: string | null;
  deployment?: Deployment;
  error_rate: number; // errors per minute at peak
  affected_customer_count: number;
  estimated_revenue_impact_daily: number; // USD/day
  correlation_confidence: number; // 0.0 – 1.0
  started_at: string;
  resolved_at: string | null;
  // Relations (when populated)
  alerts?: Alert[];
  payment_failures?: PaymentFailure[];
  support_tickets?: SupportTicket[];
  revenue_event?: RevenueEvent;
  remediation_actions?: RemediationAction[];
}

export interface IncidentSummary {
  id: string;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  estimated_revenue_impact_daily: number;
  affected_customer_count: number;
  started_at: string;
  correlation_confidence: number;
}

// --- Alert --------------------------------------------------------------------

export interface Alert extends TimestampedEntity {
  incident_id: string | null;
  source: AlertSource;
  title: string;
  message: string;
  severity: AlertSeverity;
  metadata: Record<string, unknown>;
  triggered_at: string;
  acknowledged_at: string | null;
}

// --- PaymentFailure -----------------------------------------------------------

export interface PaymentFailure extends TimestampedEntity {
  incident_id: string | null;
  customer_id: string;
  customer?: Customer;
  amount: number; // USD
  currency: string;
  failure_reason: string;
  stripe_payment_intent_id: string;
  failed_at: string;
}

// --- SupportTicket ------------------------------------------------------------

export interface SupportTicket extends TimestampedEntity {
  incident_id: string | null;
  customer_id: string;
  customer?: Customer;
  subject: string;
  priority: SupportTicketPriority;
  status: SupportTicketStatus;
  source: SupportTicketSource;
  resolved_at: string | null;
}

// --- RevenueEvent -------------------------------------------------------------

export interface RevenueEvent extends TimestampedEntity {
  incident_id: string;
  revenue_at_risk_daily: number; // USD/day
  revenue_at_risk_weekly: number; // USD/week
  churn_probability: number; // 0.0 – 1.0
  affected_mrr: number; // total MRR affected
  calculation_method: string;
  breakdown: RevenueBreakdown;
  calculated_at: string;
}

export interface RevenueBreakdown {
  enterprise: { count: number; mrr: number };
  premium: { count: number; mrr: number };
  standard: { count: number; mrr: number };
  trial: { count: number; mrr: number };
}

// --- RemediationAction --------------------------------------------------------

export interface RemediationAction extends TimestampedEntity {
  incident_id: string;
  action_type: RemediationActionType;
  title: string;
  description: string;
  status: RemediationStatus;
  assigned_to: string | null;
  priority_order: number;
  completed_at: string | null;
}

// --- Executive Summary --------------------------------------------------------

export interface ExecutiveSummary {
  generated_at: string;
  provider: string;
  total_incidents_active: number;
  total_revenue_at_risk_daily: number;
  top_incident: IncidentSummary | null;
  summary_text: string;
  key_risks: string[];
  recommended_actions: string[];
  operational_status: 'critical' | 'degraded' | 'nominal';
}

// --- Dashboard KPIs -----------------------------------------------------------

export interface DashboardKpis {
  total_revenue_at_risk_daily: number;
  active_incidents: number;
  affected_customers: number;
  avg_resolution_time_hours: number;
  incidents_by_severity: Record<IncidentSeverity, number>;
  revenue_trend_24h: TrendPoint[];
  incident_trend_24h: TrendPoint[];
}

export interface TrendPoint {
  timestamp: string;
  value: number;
}

// --- System Health ------------------------------------------------------------

export interface ServiceHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  latency_ms: number | null;
  error_rate: number | null;
  last_checked: string;
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'critical';
  services: ServiceHealth[];
  checked_at: string;
}

// --- Event Lifecycle ----------------------------------------------------------

export interface OperationalEvent {
  event_id: string;
  event_type:
    | 'deployment_created'
    | 'error_spike_detected'
    | 'payment_failures_increased'
    | 'incident_generated'
    | 'revenue_impact_calculated'
    | 'remediation_triggered'
    | 'executive_summary_generated'
    | 'incident_resolved';
  source_id: string; // ID of the deployment/incident/etc
  source_type: string;
  payload: Record<string, unknown>;
  occurred_at: string;
}
