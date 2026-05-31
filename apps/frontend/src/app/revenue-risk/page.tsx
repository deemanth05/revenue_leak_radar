import { incidentsApi, getMockDashboardKpis, getMockIncidents } from '@/lib/api';
import { RevenueImpactChart } from '@/components/charts/RevenueImpactChart';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { formatRevenue } from '@/lib/utils';
import type { Incident, DashboardKpis } from '@rlr/schemas';
import { TrendingDown, TrendingUp, DollarSign, AlertTriangle, Users, Zap } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Revenue Risk — Revenue Leak Radar',
  description: 'Revenue impact analysis and financial risk assessment by incident',
};

export default async function RevenueRiskPage() {
  let kpis: DashboardKpis;
  let incidents: Incident[];

  try {
    const [kpisRes, listRes] = await Promise.all([
      incidentsApi.dashboardKpis(),
      incidentsApi.list(),
    ]);
    kpis = kpisRes;
    incidents = listRes.items;
  } catch (error) {
    console.warn('Backend API connection failed, using mock data. Error:', error);
    kpis = getMockDashboardKpis();
    incidents = getMockIncidents();
  }

  const daily = kpis.total_revenue_at_risk_daily;
  const weekly = daily * 7;
  const monthly = daily * 30;
  const mrr = daily * 4.3;
  const hourlyRate = daily / 24;

  const tiers = [
    { name: 'Enterprise', count: 3, mrr: 125000, color: '#8B5CF6', risk: daily * 0.52, bgColor: 'rgba(46,16,101,0.4)', borderColor: 'rgba(139,92,246,0.25)' },
    { name: 'Premium', count: 421, mrr: 198000, color: '#2563EB', risk: daily * 0.38, bgColor: 'rgba(30,58,110,0.4)', borderColor: 'rgba(37,99,235,0.25)' },
    { name: 'Standard', count: 423, mrr: 45000, color: '#10B981', risk: daily * 0.10, bgColor: 'rgba(2,44,34,0.4)', borderColor: 'rgba(16,185,129,0.25)' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Revenue Risk Analysis</h1>
          <p className="text-sm text-text-muted mt-1">
            Financial impact assessment correlated across active incidents
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-danger font-semibold">
            <TrendingDown className="w-3.5 h-3.5" />
            <span className="tabular-nums">{formatRevenue(hourlyRate, true)}/hour leak rate</span>
          </div>
        </div>
      </div>

      {/* Alert banner if multiple critical incidents */}
      {kpis.active_incidents > 1 && (
        <AlertBanner
          variant="critical"
          title={`${kpis.active_incidents} concurrent incidents amplifying revenue risk`}
          message="Multiple simultaneous failures increase churn probability by 2.3× versus single incident baseline."
        />
      )}

      {/* Top metrics — hero cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Daily Revenue at Risk',
            value: formatRevenue(daily),
            sub: `${kpis.active_incidents} active incident${kpis.active_incidents !== 1 ? 's' : ''}`,
            color: '#EF4444',
            bg: 'rgba(69,10,10,0.5)',
            border: 'rgba(239,68,68,0.3)',
            icon: <TrendingDown className="w-5 h-5" />,
            topBorder: 'border-t-2 border-t-danger',
          },
          {
            label: 'Weekly Exposure',
            value: formatRevenue(weekly),
            sub: 'If incidents unresolved',
            color: '#F59E0B',
            bg: 'rgba(69,26,3,0.4)',
            border: 'rgba(245,158,11,0.25)',
            icon: <AlertTriangle className="w-5 h-5" />,
            topBorder: 'border-t-2 border-t-warning',
          },
          {
            label: 'MRR at Risk',
            value: formatRevenue(mrr),
            sub: 'Avg churn probability: 23%',
            color: '#8B5CF6',
            bg: 'rgba(46,16,101,0.4)',
            border: 'rgba(139,92,246,0.25)',
            icon: <DollarSign className="w-5 h-5" />,
            topBorder: 'border-t-2 border-t-revenue',
          },
          {
            label: 'Monthly Projection',
            value: formatRevenue(monthly),
            sub: 'Unresolved scenario',
            color: '#2563EB',
            bg: 'rgba(30,58,110,0.4)',
            border: 'rgba(37,99,235,0.25)',
            icon: <Zap className="w-5 h-5" />,
            topBorder: 'border-t-2 border-t-primary',
          },
        ].map((metric) => (
          <div
            key={metric.label}
            className={`card p-5 ${metric.topBorder}`}
            style={{ boxShadow: `0 0 16px ${metric.border}` }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="text-2xs text-text-muted uppercase tracking-widest">{metric.label}</div>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: metric.bg, color: metric.color }}
              >
                {metric.icon}
              </div>
            </div>
            <div className="text-3xl font-bold tabular-nums" style={{ color: metric.color }}>
              {metric.value}
            </div>
            <div className="text-2xs text-text-muted mt-1.5">{metric.sub}</div>
          </div>
        ))}
      </div>

      {/* Revenue velocity */}
      <div
        className="flex items-center gap-6 px-5 py-4 rounded-lg border"
        style={{ background: 'rgba(69,10,10,0.2)', borderColor: 'rgba(239,68,68,0.2)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-danger-muted border border-danger/25 flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-danger" />
          </div>
          <div>
            <div className="text-2xs text-text-muted uppercase tracking-wider">Revenue Leak Velocity</div>
            <div className="text-2xl font-bold text-danger tabular-nums">
              {formatRevenue(hourlyRate, true)}/hour
            </div>
          </div>
        </div>
        <div className="h-10 w-px bg-surface-border" />
        <div>
          <div className="text-2xs text-text-muted uppercase tracking-wider">Per Minute</div>
          <div className="text-lg font-bold text-warning tabular-nums">
            {formatRevenue(hourlyRate / 60, true)}
          </div>
        </div>
        <div className="h-10 w-px bg-surface-border" />
        <div>
          <div className="text-2xs text-text-muted uppercase tracking-wider">Per Second</div>
          <div className="text-lg font-bold text-text-primary tabular-nums">
            {formatRevenue(hourlyRate / 3600, true)}
          </div>
        </div>
        <div className="flex-1" />
        <div className="text-right">
          <div className="text-2xs text-text-muted">Since incident started (T+95m)</div>
          <div className="text-xl font-bold text-danger tabular-nums">
            {formatRevenue(hourlyRate * 1.583, true)} lost
          </div>
        </div>
      </div>

      {/* Revenue trend */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Revenue at Risk — 24h Trend</h2>
            <p className="text-xs text-text-muted mt-0.5">Hourly aggregation of all incident revenue impacts · UTC</p>
          </div>
          <div className="text-xs text-text-muted bg-surface px-2 py-1 rounded border border-surface-border">
            UTC timezone
          </div>
        </div>
        <RevenueImpactChart data={kpis.revenue_trend_24h} height={240} />
      </div>

      {/* Impact by customer tier */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Impact by Customer Tier</h2>
            <p className="text-xs text-text-muted mt-0.5">Revenue risk distribution across subscription segments</p>
          </div>
          <Users className="w-4 h-4 text-text-muted" />
        </div>
        <div className="space-y-5">
          {tiers.map((tier) => {
            const totalRisk = daily || 1;
            const pct = Math.round((tier.risk / totalRisk) * 100);
            return (
              <div key={tier.name}>
                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex items-center justify-center w-7 h-7 rounded-lg text-2xs font-bold"
                      style={{ background: tier.bgColor, color: tier.color, border: `1px solid ${tier.borderColor}` }}
                    >
                      {tier.name[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-text-primary">{tier.name}</div>
                      <div className="text-2xs text-text-muted">{tier.count} customers</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <div className="text-2xs text-text-muted">MRR at risk</div>
                      <div className="font-bold text-text-primary tabular-nums">{formatRevenue(tier.mrr, true)}</div>
                    </div>
                    <div>
                      <div className="text-2xs text-text-muted">Daily risk</div>
                      <div className="font-bold tabular-nums" style={{ color: tier.color }}>
                        {formatRevenue(tier.risk, true)}/d
                      </div>
                    </div>
                  </div>
                </div>
                <div className="h-2.5 rounded-full bg-surface-border overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: tier.color }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <div className="text-2xs text-text-muted">{pct}% of total daily risk</div>
                  <div
                    className="text-2xs font-semibold tabular-nums"
                    style={{ color: tier.color }}
                  >
                    {formatRevenue(tier.risk * 7, true)}/week exposure
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Incident revenue breakdown table */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-surface-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">Revenue Impact by Incident</h2>
          <span className="badge-critical text-2xs">{incidents.length} ACTIVE</span>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Incident</th>
                <th>Daily Impact</th>
                <th>Weekly Exposure</th>
                <th>Churn Probability</th>
                <th>Affected MRR</th>
                <th>% of Total Risk</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((inc) => {
                const weekly = inc.estimated_revenue_impact_daily * 7;
                const totalRisk = kpis.total_revenue_at_risk_daily || 1;
                const pct = Math.round((inc.estimated_revenue_impact_daily / totalRisk) * 100);
                const churnProb = Math.round((inc.correlation_confidence * 0.25) * 100) || 23;
                const affectedMrr = inc.estimated_revenue_impact_daily * 4.3;
                return (
                  <tr
                    key={inc.id}
                    className={inc.severity === 'critical' ? 'row-critical' : inc.severity === 'high' ? 'row-warning' : ''}
                  >
                    <td>
                      <div className="flex items-center gap-2">
                        <span className={`status-dot ${
                          inc.severity === 'critical' ? 'status-dot-active' :
                          inc.severity === 'high' ? 'status-dot-investigating' :
                          'status-dot-healthy'
                        }`} />
                        <div className="font-medium text-text-primary text-xs leading-snug max-w-[200px] line-clamp-1">
                          {inc.title}
                        </div>
                      </div>
                    </td>
                    <td><span className="revenue-value tabular-nums">{formatRevenue(inc.estimated_revenue_impact_daily, true)}</span></td>
                    <td><span className="text-warning font-semibold tabular-nums">{formatRevenue(weekly, true)}</span></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="confidence-bar w-12">
                          <div className="confidence-bar-fill bg-warning" style={{ width: `${churnProb}%` }} />
                        </div>
                        <span className="text-xs font-mono text-warning tabular-nums">{churnProb}%</span>
                      </div>
                    </td>
                    <td><span className="text-revenue font-semibold tabular-nums">{formatRevenue(affectedMrr, true)}</span></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 rounded-full bg-surface-border overflow-hidden max-w-16">
                          <div className="h-full rounded-full bg-danger" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-text-secondary font-mono tabular-nums">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
