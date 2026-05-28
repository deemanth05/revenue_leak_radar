// =============================================================================
// Revenue Leak Radar — API Client
// Typed HTTP client for the FastAPI backend
// =============================================================================

import type {
  Incident,
  IncidentSummary,
  Deployment,
  Alert,
  RevenueEvent,
  DashboardKpis,
  ExecutiveSummary,
  SystemHealth,
  PaginatedResponse,
  ApiResponse,
} from '@rlr/schemas';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_V1 = `${API_BASE}/api/v1`;

// --- Generic fetch wrapper ---

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_V1}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    ...init,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error?.error || error?.detail || `API error ${res.status}`);
  }

  const body = await res.json();
  if (body && typeof body === 'object' && 'data' in body && 'success' in body) {
    return body.data as T;
  }
  return body as T;
}

// --- Incidents ---

export const incidentsApi = {
  list: (params?: {
    page?: number;
    page_size?: number;
    severity?: string;
    status?: string;
  }): Promise<PaginatedResponse<Incident>> => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return apiFetch(`/incidents${q ? `?${q}` : ''}`);
  },

  get: (id: string): Promise<Incident> => apiFetch(`/incidents/${id}`),

  dashboardKpis: (): Promise<DashboardKpis> => apiFetch('/incidents/dashboard/kpis'),

  updateStatus: (id: string, status: string): Promise<Incident> =>
    apiFetch(`/incidents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  correlate: (id: string): Promise<Incident> =>
    apiFetch(`/incidents/${id}/correlate`, { method: 'POST' }),

  timeline: (id: string): Promise<any[]> =>
    apiFetch(`/incidents/${id}/timeline`),

  similar: (id: string): Promise<any[]> =>
    apiFetch(`/incidents/${id}/similar`),
};

// --- Revenue ---

export const revenueApi = {
  atRisk: (): Promise<{ total_daily: number; total_weekly: number; incident_count: number }> =>
    apiFetch('/revenue/at-risk'),

  trend: (): Promise<{ timestamp: string; value: number }[]> => apiFetch('/revenue/trend'),

  calculate: (incidentId: string): Promise<RevenueEvent> =>
    apiFetch(`/revenue/calculate/${incidentId}`, { method: 'POST' }),
};

// --- Deployments ---

export const deploymentsApi = {
  list: (): Promise<PaginatedResponse<Deployment>> => apiFetch('/deployments'),
  get: (id: string): Promise<Deployment> => apiFetch(`/deployments/${id}`),
};

// --- Alerts ---

export const alertsApi = {
  list: (incidentId?: string): Promise<PaginatedResponse<Alert>> =>
    apiFetch(`/alerts${incidentId ? `?incident_id=${incidentId}` : ''}`),
};

// --- Executive Summaries ---

export const executiveApi = {
  generate: (incidentIds: string[]): Promise<ExecutiveSummary> =>
    apiFetch('/executive/generate', {
      method: 'POST',
      body: JSON.stringify({ incident_ids: incidentIds }),
    }),

  latest: (): Promise<ExecutiveSummary> => apiFetch('/executive/latest'),

  generateBriefing: (incidentIds: string[], role: 'cto' | 'board' | 'customer'): Promise<any> =>
    apiFetch('/executive/generate-briefing', {
      method: 'POST',
      body: JSON.stringify({ incident_ids: incidentIds, role }),
    }),
};

// --- Remediation ---

export const remediationApi = {
  list: (incidentId: string): Promise<any[]> =>
    apiFetch(`/remediation/${incidentId}`),
  generate: (incidentId: string): Promise<any[]> =>
    apiFetch(`/remediation/${incidentId}/generate`, { method: 'POST' }),
  updateStatus: (actionId: string, status: string): Promise<any> =>
    apiFetch(`/remediation/actions/${actionId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};

// --- System Health ---

export const healthApi = {
  system: (): Promise<SystemHealth> => apiFetch('/health/system'),
  check: (): Promise<{ status: string; db_status: string; version: string }> =>
    fetch(`${API_BASE}/health`).then((r) => r.json()),
};

export const simulationsApi = {
  getStates: (): Promise<Record<string, number>> => apiFetch('/simulations/states'),
  reset: (): Promise<{ status: string; message: string }> =>
    apiFetch('/simulations/reset', { method: 'POST' }),
  triggerStep: (scenarioId: string, stepNum: number): Promise<any> =>
    apiFetch(`/simulations/${scenarioId}/step/${stepNum}`, { method: 'POST' }),
};

export const timelineApi = {
  global: (limit?: number): Promise<any[]> =>
    apiFetch(`/timeline${limit ? `?limit=${limit}` : ''}`),
};

// --- Mock data (used when backend is not running) ---

export function getMockDashboardKpis(): DashboardKpis {
  const now = new Date();
  const trend = Array.from({ length: 24 }, (_, i) => ({
    timestamp: new Date(now.getTime() - (23 - i) * 60 * 60 * 1000).toISOString(),
    value: Math.round(28000 + Math.random() * 20000),
  }));

  return {
    total_revenue_at_risk_daily: 54200,
    active_incidents: 3,
    affected_customers: 847,
    avg_resolution_time_hours: 2.4,
    incidents_by_severity: {
      critical: 1,
      high: 1,
      medium: 1,
      low: 0,
    },
    revenue_trend_24h: trend,
    incident_trend_24h: Array.from({ length: 24 }, (_, i) => ({
      timestamp: new Date(now.getTime() - (23 - i) * 60 * 60 * 1000).toISOString(),
      value: i > 20 ? 3 : i > 18 ? 2 : 1,
    })),
  };
}

export function getMockIncidents(): Incident[] {
  const now = new Date();
  return [
    {
      id: 'inc-001',
      title: 'Checkout Service Payment Failure — Deployment abc123f',
      description:
        'Payment processing failures spiking following deployment abc123f to checkout-service. 89 failed transactions detected. Stripe API timeouts exceeding 5000ms.',
      severity: 'critical' as any,
      status: 'active' as any,
      source: 'correlation_engine' as any,
      deployment_id: 'dep-001',
      error_rate: 340,
      affected_customer_count: 424,
      estimated_revenue_impact_daily: 42000,
      correlation_confidence: 0.94,
      started_at: new Date(now.getTime() - 95 * 60 * 1000).toISOString(),
      resolved_at: null,
      created_at: new Date(now.getTime() - 90 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
    },
    {
      id: 'inc-002',
      title: 'Auth Service Login Timeout Spike',
      description:
        'Authentication service experiencing elevated latency. P99 latency exceeding 3000ms threshold.',
      severity: 'high' as any,
      status: 'investigating' as any,
      source: 'datadog' as any,
      deployment_id: null,
      error_rate: 45,
      affected_customer_count: 1203,
      estimated_revenue_impact_daily: 8600,
      correlation_confidence: 0.61,
      started_at: new Date(now.getTime() - 35 * 60 * 1000).toISOString(),
      resolved_at: null,
      created_at: new Date(now.getTime() - 35 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
    },
    {
      id: 'inc-003',
      title: 'CDN Cache Miss Rate Elevated — EU Region',
      description:
        'Cache miss rate at 78% in EU-WEST-1 region. Performance degradation for EU customers.',
      severity: 'medium' as any,
      status: 'mitigating' as any,
      source: 'datadog' as any,
      deployment_id: null,
      error_rate: 12,
      affected_customer_count: 423,
      estimated_revenue_impact_daily: 3600,
      correlation_confidence: 0.45,
      started_at: new Date(now.getTime() - 2.5 * 60 * 60 * 1000).toISOString(),
      resolved_at: null,
      created_at: new Date(now.getTime() - 2.5 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
    },
  ];
}
