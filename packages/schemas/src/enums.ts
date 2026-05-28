// =============================================================================
// Revenue Leak Radar — Shared Enums
// Single source of truth for all categorical values
// =============================================================================

export enum IncidentSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum IncidentStatus {
  ACTIVE = 'active',
  INVESTIGATING = 'investigating',
  MITIGATING = 'mitigating',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum IncidentSource {
  SENTRY = 'sentry',
  DATADOG = 'datadog',
  MANUAL = 'manual',
  CORRELATION_ENGINE = 'correlation_engine',
}

export enum DeploymentEnvironment {
  STAGING = 'staging',
  PRODUCTION = 'production',
}

export enum DeploymentStatus {
  IN_PROGRESS = 'in_progress',
  SUCCESS = 'success',
  FAILED = 'failed',
  ROLLED_BACK = 'rolled_back',
}

export enum CustomerTier {
  ENTERPRISE = 'enterprise',
  PREMIUM = 'premium',
  STANDARD = 'standard',
  TRIAL = 'trial',
}

export enum SupportTicketPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum SupportTicketStatus {
  OPEN = 'open',
  PENDING = 'pending',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum SupportTicketSource {
  ZENDESK = 'zendesk',
  INTERCOM = 'intercom',
  EMAIL = 'email',
  MANUAL = 'manual',
}

export enum AlertSource {
  SENTRY = 'sentry',
  DATADOG = 'datadog',
  GRAFANA = 'grafana',
  CUSTOM = 'custom',
}

export enum AlertSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info',
}

export enum RemediationActionType {
  ROLLBACK = 'rollback',
  SCALE_UP = 'scale_up',
  NOTIFY_SLACK = 'notify_slack',
  CREATE_JIRA = 'create_jira',
  HOTFIX = 'hotfix',
  MANUAL = 'manual',
}

export enum RemediationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

export enum AIProvider {
  GEMINI = 'gemini',
  GROQ = 'groq',
  OPENROUTER = 'openrouter',
  MOCK = 'mock',
}
