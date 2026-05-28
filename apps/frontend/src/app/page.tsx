import { Activity, AlertTriangle, DollarSign, Users } from 'lucide-react';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { RevenueRiskTable } from '@/components/dashboard/RevenueRiskTable';
import { RevenueImpactChart } from '@/components/charts/RevenueImpactChart';
import { SeverityBarChart } from '@/components/charts/SeverityBarChart';
import { incidentsApi, getMockIncidents, getMockDashboardKpis } from '@/lib/api';
import { formatRevenue, formatNumber, formatDuration } from '@/lib/utils';
import type { Incident, DashboardKpis } from '@rlr/schemas';

export default async function DashboardPage() {
  let incidents: Incident[];
  let kpis: DashboardKpis;

  try {
    const listRes = await incidentsApi.list();
    incidents = listRes.items;
    kpis = await incidentsApi.dashboardKpis();
  } catch (error) {
    console.warn('Backend API connection failed, using mock data. Error:', error);
    incidents = getMockIncidents();
    kpis = getMockDashboardKpis();
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Operations Dashboard</h1>
          <p className="text-sm text-text-muted mt-1">
            Real-time revenue impact intelligence — sorted by business damage
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span className="live-indicator">Live updates</span>
          <span>· Last sync 12s ago</span>
        </div>
      </div>

      {/* Critical alert banner (when critical incident exists) */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-danger-muted border border-danger/30">
        <AlertTriangle className="w-4 h-4 text-danger flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-danger">CRITICAL INCIDENT ACTIVE — </span>
          <span className="text-sm text-text-primary">
            Checkout Service: $42,000/day revenue at risk · Deployment abc123f correlated (94% confidence)
          </span>
        </div>
        <span className="text-2xs text-danger font-mono">T+95m</span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          id="kpi-revenue-risk"
          label="Revenue at Risk"
          value={formatRevenue(kpis.total_revenue_at_risk_daily, true)}
          subValue="per day"
          accent="danger"
          trend={{ direction: 'up', label: '+$8.2k in last hour', isGoodWhenUp: false }}
          icon={<DollarSign className="w-4 h-4" />}
        />
        <KpiCard
          id="kpi-active-incidents"
          label="Active Incidents"
          value={kpis.active_incidents.toString()}
          subValue="1 critical"
          accent="warning"
          trend={{ direction: 'up', label: '+1 in last 2h', isGoodWhenUp: false }}
          icon={<AlertTriangle className="w-4 h-4" />}
        />
        <KpiCard
          id="kpi-affected-customers"
          label="Affected Customers"
          value={formatNumber(kpis.affected_customers)}
          subValue="3 enterprise, 421 premium"
          accent="primary"
          trend={{ direction: 'up', label: '+124 in last 30m', isGoodWhenUp: false }}
          icon={<Users className="w-4 h-4" />}
        />
        <KpiCard
          id="kpi-mttr"
          label="Avg Resolution Time"
          value={formatDuration(kpis.avg_resolution_time_hours)}
          subValue="last 7 days"
          accent="success"
          trend={{ direction: 'down', label: '-18m vs last week', isGoodWhenUp: false }}
          icon={<Activity className="w-4 h-4" />}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue trend chart */}
        <div className="card lg:col-span-2 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Revenue at Risk — 24h Trend</h2>
              <p className="text-2xs text-text-muted mt-0.5">Daily revenue impact estimation · USD</p>
            </div>
            <div className="revenue-value text-xl">
              {formatRevenue(kpis.total_revenue_at_risk_daily, true)}/day
            </div>
          </div>
          <RevenueImpactChart data={kpis.revenue_trend_24h} height={200} />
        </div>

        {/* Severity distribution */}
        <div className="card p-4">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-text-primary">Incidents by Severity</h2>
            <p className="text-2xs text-text-muted mt-0.5">Active incident distribution</p>
          </div>
          <SeverityBarChart data={kpis.incidents_by_severity as Record<string, number>} height={140} />

          {/* Legend */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {Object.entries(kpis.incidents_by_severity).map(([severity, count]) => (
              <div key={severity} className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor:
                      severity === 'critical' ? '#EF4444' :
                      severity === 'high' ? '#F59E0B' :
                      severity === 'medium' ? '#2563EB' : '#475569',
                  }}
                />
                <span className="text-xs text-text-secondary capitalize">{severity}</span>
                <span className="text-xs font-bold text-text-primary ml-auto">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue risk table — main content */}
      <RevenueRiskTable incidents={incidents} />

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent deployments */}
        <div className="card p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-3">Recent Deployments</h2>
          <div className="space-y-2">
            {[
              { hash: 'abc123f', repo: 'checkout-service', env: 'production', status: 'success', author: 'j.smith', time: '95m ago', linked: true },
              { hash: 'def456a', repo: 'auth-service', env: 'production', status: 'success', author: 'm.johnson', time: '3h ago', linked: false },
              { hash: 'ghi789b', repo: 'api-gateway', env: 'staging', status: 'success', author: 's.chen', time: '5h ago', linked: false },
            ].map((dep) => (
              <div
                key={dep.hash}
                className="flex items-center gap-3 px-3 py-2 rounded bg-surface border border-surface-border hover:border-border-accent transition-colors"
              >
                <div
                  className="w-1.5 h-6 rounded-full flex-shrink-0"
                  style={{ backgroundColor: dep.linked ? '#EF4444' : '#10B981' }}
                />
                <code className="text-xs font-mono text-text-primary">{dep.hash}</code>
                <span className="text-xs text-text-secondary flex-1">{dep.repo}</span>
                <span className="text-2xs text-text-muted">{dep.env}</span>
                <span className="text-2xs text-text-muted">{dep.time}</span>
                {dep.linked && (
                  <span className="badge-critical text-2xs">⚠ LINKED</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* AI Correlation Summary */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-primary">Correlation Engine</h2>
            <span className="text-2xs px-1.5 py-0.5 rounded bg-primary-muted text-primary border border-primary/20 font-medium">
              DETERMINISTIC
            </span>
          </div>
          <div className="space-y-3">
            <div className="px-3 py-2.5 rounded bg-danger-muted border border-danger/20">
              <div className="text-xs font-semibold text-danger mb-1">⚡ Root Cause Identified</div>
              <div className="text-xs text-text-primary">
                Deployment <code className="font-mono bg-surface px-1 rounded">abc123f</code> (checkout-service)
                triggered payment timeout errors in Stripe integration layer.
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="confidence-bar flex-1">
                  <div className="confidence-bar-fill bg-danger" style={{ width: '94%' }} />
                </div>
                <span className="text-xs font-mono text-danger font-bold">94%</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'Payment Failures', value: '89', color: '#EF4444' },
                { label: 'Support Tickets', value: '67', color: '#F59E0B' },
                { label: 'Sentry Alerts', value: '47', color: '#2563EB' },
              ].map((signal) => (
                <div key={signal.label} className="px-2 py-2 rounded bg-surface border border-surface-border">
                  <div className="text-base font-bold" style={{ color: signal.color }}>{signal.value}</div>
                  <div className="text-2xs text-text-muted leading-tight mt-0.5">{signal.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
