import { incidentsApi, getMockDashboardKpis, getMockIncidents } from '@/lib/api';
import { RevenueImpactChart } from '@/components/charts/RevenueImpactChart';
import { formatRevenue } from '@/lib/utils';
import type { Incident, DashboardKpis } from '@rlr/schemas';

export const metadata = {
  title: 'Revenue Risk — Revenue Leak Radar',
  description: 'Revenue impact analysis and financial risk assessment by incident',
};

export default async function RevenueRiskPage() {
  let kpis: DashboardKpis;
  let incidents: Incident[];

  try {
    kpis = await incidentsApi.dashboardKpis();
    const listRes = await incidentsApi.list();
    incidents = listRes.items;
  } catch (error) {
    console.warn('Backend API connection failed, using mock data. Error:', error);
    kpis = getMockDashboardKpis();
    incidents = getMockIncidents();
  }

  const tiers = [
    { name: 'Enterprise', count: 3, mrr: 125000, color: '#8B5CF6', risk: kpis.total_revenue_at_risk_daily * 0.52 },
    { name: 'Premium', count: 421, mrr: 198000, color: '#2563EB', risk: kpis.total_revenue_at_risk_daily * 0.38 },
    { name: 'Standard', count: 423, mrr: 45000, color: '#10B981', risk: kpis.total_revenue_at_risk_daily * 0.10 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Revenue Risk Analysis</h1>
        <p className="text-sm text-text-muted mt-1">
          Financial impact assessment correlated across active incidents
        </p>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 border-t-2 border-t-danger">
          <div className="text-2xs text-text-muted uppercase tracking-widest mb-1">Daily Revenue at Risk</div>
          <div className="text-3xl font-bold text-danger">{formatRevenue(kpis.total_revenue_at_risk_daily)}</div>
          <div className="text-xs text-text-muted mt-1">Across {kpis.active_incidents} active incident{kpis.active_incidents !== 1 ? 's' : ''}</div>
        </div>
        <div className="card p-4 border-t-2 border-t-warning">
          <div className="text-2xs text-text-muted uppercase tracking-widest mb-1">Weekly Exposure</div>
          <div className="text-3xl font-bold text-warning">{formatRevenue(kpis.total_revenue_at_risk_daily * 7)}</div>
          <div className="text-xs text-text-muted mt-1">If incidents unresolved</div>
        </div>
        <div className="card p-4 border-t-2 border-t-revenue">
          <div className="text-2xs text-text-muted uppercase tracking-widest mb-1">MRR at Risk</div>
          <div className="text-3xl font-bold text-revenue">{formatRevenue(kpis.total_revenue_at_risk_daily * 4.3)}</div>
          <div className="text-xs text-text-muted mt-1">Avg churn probability: 23%</div>
        </div>
      </div>

      {/* Revenue trend */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Revenue at Risk — 24h Trend</h2>
            <p className="text-xs text-text-muted mt-0.5">Hourly aggregation of all incident revenue impacts</p>
          </div>
          <div className="text-xs text-text-muted bg-surface px-2 py-1 rounded border border-surface-border">
            UTC timezone
          </div>
        </div>
        <RevenueImpactChart data={kpis.revenue_trend_24h} height={240} />
      </div>

      {/* Impact by customer tier */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-text-primary mb-4">Impact by Customer Tier</h2>
        <div className="space-y-4">
          {tiers.map((tier) => {
            const totalRisk = kpis.total_revenue_at_risk_daily || 1;
            const pct = Math.round((tier.risk / totalRisk) * 100);
            return (
              <div key={tier.name} className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tier.color }} />
                    <span className="font-medium text-text-primary">{tier.name}</span>
                    <span className="text-text-muted">· {tier.count} customers</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-text-muted">MRR at risk:</span>
                    <span className="font-bold text-text-primary">{formatRevenue(tier.mrr, true)}</span>
                    <span className="font-bold" style={{ color: tier.color }}>
                      {formatRevenue(tier.risk, true)}/day
                    </span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-surface-border overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: tier.color }}
                  />
                </div>
                <div className="text-2xs text-text-muted text-right">{pct}% of total daily risk</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Incident revenue breakdown table */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-surface-border">
          <h2 className="text-sm font-semibold text-text-primary">Revenue Impact by Incident</h2>
        </div>
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
                <tr key={inc.id}>
                  <td>
                    <div className="font-medium text-text-primary text-xs leading-snug max-w-[200px] line-clamp-1">
                      {inc.title}
                    </div>
                  </td>
                  <td><span className="revenue-value">{formatRevenue(inc.estimated_revenue_impact_daily, true)}</span></td>
                  <td><span className="text-warning font-medium">{formatRevenue(weekly, true)}</span></td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="confidence-bar w-12">
                        <div className="confidence-bar-fill bg-warning" style={{ width: `${churnProb}%` }} />
                      </div>
                      <span className="text-xs font-mono text-warning">{churnProb}%</span>
                    </div>
                  </td>
                  <td><span className="text-revenue font-medium">{formatRevenue(affectedMrr, true)}</span></td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="h-1 flex-1 rounded-full bg-surface-border overflow-hidden max-w-16">
                        <div className="h-full rounded-full bg-danger" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-text-secondary font-mono">{pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
