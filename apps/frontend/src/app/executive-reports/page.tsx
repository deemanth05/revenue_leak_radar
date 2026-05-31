import { Sparkles, Download, RefreshCw } from 'lucide-react';
import { executiveApi, incidentsApi } from '@/lib/api';
import { formatRevenue, formatRelativeTime } from '@/lib/utils';
import type { ExecutiveSummary, Incident } from '@rlr/schemas';

export const metadata = {
  title: 'Executive Reports — Revenue Leak Radar',
  description: 'AI-generated executive summaries and operational intelligence briefings',
};

export default async function ExecutiveReportsPage() {
  let report: ExecutiveSummary;
  let activeIncidents: Incident[] = [];

  try {
    report = await executiveApi.latest();
    const incidentsRes = await incidentsApi.list({ page_size: 50 });
    activeIncidents = incidentsRes.items.filter(i => i.status !== 'resolved' && i.status !== 'closed');
  } catch (error) {
    console.warn('Backend API connection failed, using mock report. Error:', error);
    report = {
      generated_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
      provider: 'gemini-1.5-flash (mock)',
      total_incidents_active: 3,
      total_revenue_at_risk_daily: 54200,
      top_incident: null,
      operational_status: 'critical',
      summary_text: `OPERATIONAL STATUS: CRITICAL\n\nAs of UTC, Revenue Leak Radar has identified 3 active operational incidents collectively placing $54,200/day in revenue at risk.\n\nThe primary incident — a Checkout Service payment failure correlated with deployment abc123f — is the most severe, accounting for 77% ($42,000/day) of total revenue risk. This incident affects 424 customers, including 3 enterprise accounts with annual contract values exceeding $500k.\n\nThe correlation engine has identified deployment abc123f as the root cause with 94% confidence, based on temporal correlation between the deploy event (14:32 UTC), payment failure spike onset (14:35 UTC), and Stripe API timeout pattern alignment.\n\nImmediate rollback of deployment abc123f is the recommended primary remediation action.`,
      key_risks: [
        'Checkout payment failures affecting 424 customers — $42,000/day at immediate risk',
        '3 enterprise SLA customers affected — potential contract penalty exposure of up to $180k',
        'Auth service latency spike affecting 1,203 customers — secondary risk of $8,600/day',
        'Churn probability elevated to 31% for affected premium-tier customers',
        'EU CDN degradation adding additional $3,600/day pressure',
      ],
      recommended_actions: [
        'IMMEDIATE: Roll back deployment abc123f in checkout-service to previous stable version',
        'IMMEDIATE: Notify enterprise accounts (Acme Corp, TechFlow Inc, DataSystems Ltd) of ongoing incident',
        'HIGH: Investigate Stripe API timeout root cause — may be independent of rollback',
        'HIGH: Monitor auth service latency — possible cascade from checkout-service load redistribution',
        'MEDIUM: Review EU CDN cache invalidation — likely unrelated, schedule for post-incident',
        'POST-INCIDENT: Mandatory pre-deployment payment flow smoke testing requirement',
      ],
    };
    activeIncidents = [
      {
        id: '1', title: 'Checkout failure', severity: 'critical', status: 'active',
        affected_customer_count: 424, estimated_revenue_impact_daily: 42000,
      } as any,
      {
        id: '2', title: 'Auth latency', severity: 'high', status: 'active',
        affected_customer_count: 1203, estimated_revenue_impact_daily: 8600,
      } as any,
    ];
  }

  const affectedCustomers = activeIncidents.reduce((sum, inc) => sum + (inc.affected_customer_count || 0), 0);
  const enterpriseAffected = activeIncidents.reduce((sum, inc) => sum + (inc.severity === 'critical' ? 3 : inc.severity === 'high' ? 1 : 0), 0);
  const avgChurnProb = activeIncidents.length > 0
    ? Math.round(activeIncidents.reduce((sum, inc) => sum + (inc.severity === 'critical' ? 31 : inc.severity === 'high' ? 15 : 5), 0) / activeIncidents.length)
    : 0;

  const statusColors = {
    critical: { bg: 'bg-danger-muted', border: 'border-danger/30', text: 'text-danger', label: 'CRITICAL' },
    degraded: { bg: 'bg-warning-muted', border: 'border-warning/30', text: 'text-warning', label: 'DEGRADED' },
    nominal: { bg: 'bg-success-muted', border: 'border-success/30', text: 'text-success', label: 'NOMINAL' },
    healthy: { bg: 'bg-success-muted', border: 'border-success/30', text: 'text-success', label: 'HEALTHY' },
    down: { bg: 'bg-danger-muted', border: 'border-danger/30', text: 'text-danger', label: 'DOWN' },
  };

  const statusStyle = statusColors[report.operational_status as keyof typeof statusColors] || statusColors.degraded;


  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Executive Reports</h1>
          <p className="text-sm text-text-muted mt-1">
            AI-generated operational intelligence briefings for leadership
          </p>
        </div>
        <div className="flex gap-2">
          <button id="regenerate-report-btn" className="btn-secondary">
            <RefreshCw className="w-3.5 h-3.5" /> Regenerate
          </button>
          <button id="download-report-btn" className="btn-primary">
            <Download className="w-3.5 h-3.5" /> Export PDF
          </button>
        </div>
      </div>

      {/* System status */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg ${statusStyle.bg} border ${statusStyle.border}`}>
        <div className={`w-3 h-3 rounded-full animate-pulse flex-shrink-0 ${statusStyle.text === 'text-danger' ? 'bg-danger' : statusStyle.text === 'text-warning' ? 'bg-warning' : 'bg-success'}`} />
        <div>
          <span className={`text-sm font-bold ${statusStyle.text}`}>OPERATIONAL STATUS: {statusStyle.label}</span>
          <span className="text-sm text-text-secondary ml-2">
            — {formatRevenue(report.total_revenue_at_risk_daily)}/day revenue at risk across {report.total_incidents_active} active incident{report.total_incidents_active !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="ml-auto text-xs text-text-muted">
          Generated {formatRelativeTime(report.generated_at)} · {report.provider}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main report */}
        <div className="lg:col-span-2 space-y-4">
          {/* AI Summary */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-text-primary">Executive Summary</h2>
              <span className="ml-auto text-2xs text-text-muted px-1.5 py-0.5 rounded bg-primary-muted border border-primary/20">
                AI · {report.provider}
              </span>
            </div>
            <div className="prose prose-sm max-w-none">
              {report.summary_text.split('\n\n').map((para, i) => (
                <p key={i} className={`text-sm leading-relaxed ${i === 0 ? 'font-semibold text-danger' : 'text-text-secondary'} ${i > 0 ? 'mt-3' : ''}`}>
                  {para}
                </p>
              ))}
            </div>
          </div>

          {/* Recommended actions */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-4">Recommended Actions</h2>
            <div className="space-y-2">
              {report.recommended_actions.map((action, i) => {
                const priority = action.startsWith('IMMEDIATE') ? 'danger' : action.startsWith('HIGH') ? 'warning' : action.startsWith('MEDIUM') ? 'primary' : 'success';
                const colors = { danger: 'text-danger bg-danger-muted border-danger/20', warning: 'text-warning bg-warning-muted border-warning/20', primary: 'text-primary bg-primary-muted border-primary/20', success: 'text-success bg-success-muted border-success/20' };
                return (
                  <div key={i} className="flex items-start gap-3 px-3 py-2.5 rounded bg-surface border border-surface-border">
                    <span className={`text-2xs font-bold px-1.5 py-0.5 rounded border flex-shrink-0 mt-0.5 ${colors[priority]}`}>
                      {i + 1}
                    </span>
                    <span className="text-sm text-text-primary leading-snug">{action}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Key risks sidebar */}
        <div className="space-y-4">
          <div className="card p-4">
            <h2 className="text-sm font-semibold text-text-primary mb-3">Key Business Risks</h2>
            <div className="space-y-2">
              {report.key_risks.map((risk, i) => (
                <div key={i} className="flex items-start gap-2 py-2 border-b border-surface-border last:border-0">
                  <span className="text-danger text-xs font-bold flex-shrink-0 mt-0.5">⚠</span>
                  <span className="text-xs text-text-secondary leading-relaxed">{risk}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Metrics snapshot */}
          <div className="card p-4">
            <h2 className="text-sm font-semibold text-text-primary mb-3">Metrics Snapshot</h2>
            <div className="space-y-3">
              {[
                { label: 'Revenue at Risk (Daily)', value: formatRevenue(report.total_revenue_at_risk_daily), color: 'text-danger' },
                { label: 'Revenue at Risk (Weekly)', value: formatRevenue(report.total_revenue_at_risk_daily * 7), color: 'text-warning' },
                { label: 'Active Incidents', value: String(report.total_incidents_active), color: 'text-text-primary' },
                { label: 'Affected Customers', value: String(affectedCustomers), color: 'text-text-primary' },
                { label: 'Enterprise Accounts Affected', value: String(enterpriseAffected), color: 'text-revenue' },
                { label: 'Avg Churn Probability', value: `${avgChurnProb}%`, color: 'text-warning' },
              ].map((m) => (
                <div key={m.label} className="flex items-center justify-between text-xs">
                  <span className="text-text-muted">{m.label}</span>
                  <span className={`font-bold ${m.color}`}>{m.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
