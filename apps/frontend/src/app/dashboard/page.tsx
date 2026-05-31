import { Activity, AlertTriangle, DollarSign, Users, Siren, Zap, GitCommit } from 'lucide-react';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { RevenueRiskTable } from '@/components/dashboard/RevenueRiskTable';
import { RevenueImpactChart } from '@/components/charts/RevenueImpactChart';
import { SeverityBarChart } from '@/components/charts/SeverityBarChart';
import { OperationalStatusBar } from '@/components/dashboard/OperationalStatusBar';
import { CorrelationFlowGraph } from '@/components/charts/CorrelationFlowGraph';

import { incidentsApi, deploymentsApi, getMockIncidents, getMockDashboardKpis } from '@/lib/api';
import { formatRevenue, formatNumber, formatDuration, formatRelativeTime, shortHash } from '@/lib/utils';
import type { Incident, DashboardKpis, Deployment } from '@rlr/schemas';
import Link from 'next/link';

export const metadata = {
  title: 'Operations Dashboard — Revenue Leak Radar',
  description: 'Real-time revenue impact intelligence - sorted by business damage',
};

export default async function DashboardPage() {
  let incidents: Incident[] = [];
  let kpis: DashboardKpis;
  let deployments: Deployment[] = [];
  let activeCriticalFull: Incident | null = null;
  let isUsingMockData = false;

  try {
    const listRes = await incidentsApi.list();
    incidents = listRes.items;
    kpis = await incidentsApi.dashboardKpis();

    try {
      const depRes = await deploymentsApi.list();
      deployments = Array.isArray(depRes) ? depRes : ((depRes as any).items || []);
    } catch (e) {
      console.warn('Failed to fetch deployments:', e);
    }
  } catch (error) {
    console.warn('Backend API connection failed, using mock data. Error:', error);
    incidents = getMockIncidents();
    kpis = getMockDashboardKpis();
    isUsingMockData = true;
  }

  // Find active critical incident
  const activeCritical = incidents.find(
    (i) => i.severity === 'critical' && (i.status === 'active' || i.status === 'investigating' || i.status === 'mitigating')
  );

  if (activeCritical && !isUsingMockData) {
    try {
      activeCriticalFull = await incidentsApi.get(activeCritical.id);
    } catch (e) {
      console.warn('Failed to fetch full critical incident details:', e);
    }
  }

  // Use activeCritical from mock if needed
  const displayCritical = activeCriticalFull ?? activeCritical ?? null;

  // Find linked deployment IDs from active/investigating incidents
  const linkedDeploymentIds = new Set(
    incidents
      .filter((i) => i.status !== 'resolved' && i.deployment_id)
      .map((i) => i.deployment_id)
  );

  // Fallback to mock deployments if none in DB
  const displayDeployments = deployments.length > 0
    ? deployments.slice(0, 4).map((dep) => ({
        hash: shortHash(dep.commit_hash),
        repo: dep.repository,
        env: dep.environment,
        status: dep.status,
        author: dep.author,
        time: formatRelativeTime(dep.deployed_at),
        linked: linkedDeploymentIds.has(dep.id),
      }))
    : [
        { hash: 'abc123f', repo: 'checkout-service', env: 'production', status: 'success', author: 'j.smith', time: '95m ago', linked: true },
        { hash: 'def456a', repo: 'auth-service', env: 'production', status: 'success', author: 'm.johnson', time: '3h ago', linked: false },
        { hash: 'ghi789b', repo: 'api-gateway', env: 'staging', status: 'success', author: 's.chen', time: '5h ago', linked: false },
        { hash: 'jkl012c', repo: 'payment-service', env: 'production', status: 'success', author: 'a.patel', time: '6h ago', linked: false },
      ];

  // Dynamic correlation details
  const rootCauseHash = (activeCriticalFull as any)?.deployment?.commit_hash
    ? shortHash((activeCriticalFull as any).deployment.commit_hash)
    : 'abc123f';
  const rootCauseRepo = (activeCriticalFull as any)?.deployment?.repository || 'checkout-service';
  const correlationConfidence = displayCritical?.correlation_confidence ?? 0.94;
  const confidencePercent = Math.round(correlationConfidence * 100);

  const paymentFailuresCount = (activeCriticalFull as any)?.payment_failures?.length ?? 89;
  const supportTicketsCount = (activeCriticalFull as any)?.support_tickets?.length ?? 67;
  const sentryAlertsCount = (activeCriticalFull as any)?.alerts?.length ?? 47;

  // Augment kpis with critical count
  const criticalCount = incidents.filter(
    (i) => i.severity === 'critical' && i.status !== 'resolved'
  ).length;

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Operations Dashboard</h1>
          <p className="text-sm text-text-muted mt-1">
            Real-time revenue impact intelligence — sorted by business damage
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isUsingMockData && (
            <span className="tag-warning text-xs font-semibold px-2 py-1">DEMO MODE</span>
          )}
          <span className="live-indicator text-xs">Live updates</span>
        </div>
      </div>

      {/* Operational Command Strip */}
      <OperationalStatusBar kpis={kpis} criticalCount={criticalCount} />

      {/* Critical alert banner */}
      {activeCritical && (
        <div className="alert-banner-critical animate-slide-up">
          <Siren className="w-4 h-4 text-danger flex-shrink-0 animate-pulse" />
          <div className="flex-1 min-w-0">
            <span className="text-sm font-bold text-danger">CRITICAL INCIDENT ACTIVE — </span>
            <span className="text-sm text-text-primary">
              {activeCritical.title}
            </span>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-2xs text-danger font-semibold tabular-nums">
                {formatRevenue(activeCritical.estimated_revenue_impact_daily, true)}/day at risk
              </span>
              <span className="text-2xs text-text-muted">·</span>
              <span className="text-2xs text-text-muted tabular-nums">
                Started {formatRelativeTime(activeCritical.started_at)} ago
              </span>
              <span className="text-2xs text-text-muted">·</span>
              <span className="text-2xs text-success font-semibold">
                {confidencePercent}% root cause confidence
              </span>
            </div>
          </div>
          <Link
            href={`/incidents/${activeCritical.id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-danger text-white text-xs font-bold hover:bg-danger-hover transition-colors flex-shrink-0"
          >
            <Siren className="w-3 h-3" />
            Enter War Room
          </Link>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          id="kpi-revenue-risk"
          label="Revenue at Risk"
          value={formatRevenue(kpis.total_revenue_at_risk_daily, true)}
          subValue="per day"
          sublabel={`Weekly: ${formatRevenue(kpis.total_revenue_at_risk_daily * 7, true)}`}
          accent="danger"
          glow={true}
          trend={{ direction: 'up', label: '+$8.2k in last hour', isGoodWhenUp: false }}
          icon={<DollarSign className="w-4 h-4" />}
        />
        <KpiCard
          id="kpi-active-incidents"
          label="Active Incidents"
          value={kpis.active_incidents.toString()}
          subValue={`${criticalCount} critical`}
          sublabel="Escalation active"
          accent="warning"
          glow={criticalCount > 0}
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
          sublabel={`MTTD: 4min`}
          accent="success"
          trend={{ direction: 'down', label: '-18m vs last week', isGoodWhenUp: false }}
          icon={<Activity className="w-4 h-4" />}
        />
      </div>

      {/* Correlation Flow Graph + Severity Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <CorrelationFlowGraph incident={displayCritical} />
        </div>
        <div className="card p-4">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-text-primary">Incidents by Severity</h2>
            <p className="text-2xs text-text-muted mt-0.5">Active incident distribution</p>
          </div>
          <SeverityBarChart data={kpis.incidents_by_severity as Record<string, number>} height={130} />
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
                <span className="text-xs font-bold text-text-primary ml-auto tabular-nums">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue trend chart */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Revenue at Risk — 24h Trend</h2>
            <p className="text-2xs text-text-muted mt-0.5">Hourly aggregation · USD · Incident-correlated</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="revenue-value text-xl tabular-nums">
                {formatRevenue(kpis.total_revenue_at_risk_daily, true)}/day
              </div>
              <div className="text-2xs text-text-muted">current exposure</div>
            </div>
          </div>
        </div>
        <RevenueImpactChart data={kpis.revenue_trend_24h} height={200} />
      </div>

      {/* Revenue risk table — main content */}
      <RevenueRiskTable
        incidents={incidents}
        totalDailyRisk={kpis.total_revenue_at_risk_daily}
      />

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent deployments */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-primary">Recent Deployments</h2>
            <span className="tag-operational text-2xs">Live tracking</span>
          </div>
          <div className="space-y-2">
            {displayDeployments.map((dep) => (
              <div
                key={dep.hash}
                className={`flex items-center gap-3 px-3 py-2.5 rounded border transition-colors
                  ${dep.linked
                    ? 'bg-danger-muted/30 border-danger/30 hover:border-danger/50'
                    : 'bg-surface border-surface-border hover:border-border-accent'
                  }`}
              >
                <GitCommit
                  className={`w-3.5 h-3.5 flex-shrink-0 ${dep.linked ? 'text-danger' : 'text-success'}`}
                />
                <code className="text-xs font-mono text-text-primary">{dep.hash}</code>
                <span className="text-xs text-text-secondary flex-1 truncate">{dep.repo}</span>
                <span className="text-2xs text-text-muted bg-surface px-1.5 py-0.5 rounded border border-surface-border">
                  {dep.env}
                </span>
                <span className="text-2xs text-text-muted tabular-nums">{dep.time}</span>
                {dep.linked && (
                  <span className="badge-critical text-3xs">⚠ LINKED</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* AI Correlation Engine */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-primary">Correlation Engine</h2>
            <div className="flex items-center gap-2">
              <Zap className="w-3 h-3 text-primary" />
              <span className="text-2xs px-1.5 py-0.5 rounded bg-primary-muted text-primary border border-primary/20 font-semibold">
                DETERMINISTIC
              </span>
              <span className="text-2xs px-1.5 py-0.5 rounded bg-surface border border-surface-border text-text-muted font-semibold">Powered by Coral</span>
            </div>
          </div>
          <div className="space-y-3">
            {/* Root cause summary */}
            <div className="px-3 py-3 rounded-lg bg-danger-muted/50 border border-danger/25">
              <div className="flex items-center gap-2 mb-1.5">
                <Zap className="w-3 h-3 text-danger" />
                <div className="text-xs font-bold text-danger">Root Cause Identified</div>
              </div>
              <div className="text-xs text-text-primary leading-relaxed">
                Deployment{' '}
                <code className="font-mono bg-surface px-1.5 py-0.5 rounded border border-surface-border text-text-primary">
                  {rootCauseHash}
                </code>{' '}
                <span className="text-text-muted">({rootCauseRepo})</span>
                {' '}triggered payment timeout errors in Stripe integration layer.
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <div className="confidence-bar flex-1">
                  <div
                    className="confidence-bar-fill bg-danger"
                    style={{ width: `${confidencePercent}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-danger font-bold tabular-nums">
                  {confidencePercent}% confidence
                </span>
              </div>
            </div>

            {/* Signal counts */}
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'Payment Failures', value: paymentFailuresCount, color: '#EF4444', bg: 'rgba(69,10,10,0.4)', border: 'rgba(239,68,68,0.2)' },
                { label: 'Support Tickets', value: supportTicketsCount, color: '#F59E0B', bg: 'rgba(69,26,3,0.4)', border: 'rgba(245,158,11,0.2)' },
                { label: 'Sentry Alerts', value: sentryAlertsCount, color: '#2563EB', bg: 'rgba(30,58,110,0.4)', border: 'rgba(37,99,235,0.2)' },
              ].map((signal) => (
                <div
                  key={signal.label}
                  className="px-2 py-3 rounded-lg border"
                  style={{ background: signal.bg, borderColor: signal.border }}
                >
                  <div className="text-xl font-bold tabular-nums leading-none" style={{ color: signal.color }}>
                    {signal.value}
                  </div>
                  <div className="text-2xs text-text-muted leading-tight mt-1">{signal.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
