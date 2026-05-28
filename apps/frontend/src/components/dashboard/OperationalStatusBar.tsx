'use client';

import { AlertTriangle, TrendingDown, Wrench, ShieldAlert } from 'lucide-react';
import type { DashboardKpis } from '@rlr/schemas';
import { formatRevenue, formatNumber } from '@/lib/utils';

interface OperationalStatusBarProps {
  kpis: DashboardKpis;
  criticalCount?: number;
}

export function OperationalStatusBar({ kpis, criticalCount = 0 }: OperationalStatusBarProps) {
  const highCount = Math.max(0, (kpis.active_incidents ?? 0) - criticalCount);
  const weeklyExposure = (kpis.total_revenue_at_risk_daily ?? 0) * 7;

  return (
    <div
      className="rounded-lg border border-surface-border overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(17,24,39,0.95) 0%, rgba(13,21,38,0.95) 100%)',
      }}
    >
      {/* Top strip — operational status */}
      <div
        className="px-5 py-2 border-b border-surface-border flex items-center gap-3"
        style={{ background: 'rgba(239,68,68,0.06)' }}
      >
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />
          <span className="text-2xs font-bold uppercase tracking-widest text-danger">
            Active Incident Response
          </span>
        </div>
        <div className="h-3 w-px bg-surface-border" />
        <span className="text-2xs text-text-muted">
          {kpis.active_incidents} incident{kpis.active_incidents !== 1 ? 's' : ''} under investigation
        </span>
        <div className="flex-1" />
        <span className="text-2xs font-mono text-text-muted">
          Last updated: just now
        </span>
      </div>

      {/* Main metrics strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-surface-border">
        {/* Metric 1: Revenue at Risk */}
        <div className="px-5 py-4 flex items-center gap-4">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-danger-muted border border-danger/20 flex-shrink-0">
            <TrendingDown className="w-4 h-4 text-danger" />
          </div>
          <div>
            <div className="text-2xs text-text-muted uppercase tracking-wide">Daily Revenue at Risk</div>
            <div
              className="text-2xl font-bold tabular-nums leading-none mt-0.5"
              style={{ color: '#EF4444' }}
            >
              {formatRevenue(kpis.total_revenue_at_risk_daily)}
            </div>
            <div className="text-2xs text-text-muted mt-0.5">
              Weekly: <span className="text-warning font-semibold">{formatRevenue(weeklyExposure)}</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Active Incidents */}
        <div className="px-5 py-4 flex items-center gap-4">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-danger-muted border border-danger/20 flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-danger" />
          </div>
          <div>
            <div className="text-2xs text-text-muted uppercase tracking-wide">Active Incidents</div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <div className="text-2xl font-bold tabular-nums leading-none mt-0.5">
                {kpis.active_incidents}
              </div>
              <div className="flex items-center gap-1.5">
                {criticalCount > 0 && (
                  <span className="badge-critical text-3xs">{criticalCount} CRIT</span>
                )}
                {highCount > 0 && (
                  <span className="badge-high text-3xs">{highCount} HIGH</span>
                )}
              </div>
            </div>
            <div className="text-2xs text-text-muted mt-0.5">
              Avg MTTR: <span className="text-text-secondary font-semibold">
                {kpis.avg_resolution_time_hours?.toFixed(1) ?? '2.4'}h
              </span>
            </div>
          </div>
        </div>

        {/* Metric 3: Customers Affected */}
        <div className="px-5 py-4 flex items-center gap-4">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-warning-muted border border-warning/20 flex-shrink-0">
            <ShieldAlert className="w-4 h-4 text-warning" />
          </div>
          <div>
            <div className="text-2xs text-text-muted uppercase tracking-wide">Customers Affected</div>
            <div className="text-2xl font-bold tabular-nums leading-none text-text-primary mt-0.5">
              {formatNumber(kpis.affected_customers)}
            </div>
            <div className="text-2xs text-text-muted mt-0.5">
              Enterprise accounts at risk
            </div>
          </div>
        </div>

        {/* Metric 4: Remediation */}
        <div className="px-5 py-4 flex items-center gap-4">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-success-muted border border-success/20 flex-shrink-0">
            <Wrench className="w-4 h-4 text-success" />
          </div>
          <div>
            <div className="text-2xs text-text-muted uppercase tracking-wide">Remediation</div>
            <div className="text-2xl font-bold tabular-nums leading-none text-text-primary mt-0.5">
              {criticalCount}
            </div>
            <div className="text-2xs text-text-muted mt-0.5">
              Critical active · <span className="text-success font-semibold">
                {kpis.avg_resolution_time_hours?.toFixed(0) ?? '4'}h
              </span> avg MTTR
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
