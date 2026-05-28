'use client';

import { ExternalLink, ChevronRight, Siren, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import type { Incident } from '@rlr/schemas';
import {
  formatRevenueDaily,
  formatRelativeTime,
  getSeverityClass,
  getStatusDotClass,
  formatConfidence,
  getConfidenceColor,
  formatNumber,
  shortHash,
  cn,
} from '@/lib/utils';

interface RevenueRiskTableProps {
  incidents: Incident[];
  loading?: boolean;
  totalDailyRisk?: number;
}

export function RevenueRiskTable({ incidents, loading, totalDailyRisk }: RevenueRiskTableProps) {
  const totalRisk = totalDailyRisk ?? incidents.reduce(
    (sum, i) => sum + (i.estimated_revenue_impact_daily ?? 0), 0
  );

  if (loading) {
    return (
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-surface-border flex items-center justify-between">
          <div className="skeleton h-3 w-40 rounded" />
          <div className="skeleton h-5 w-20 rounded" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-surface-border/50">
            <div className="skeleton h-3 w-48 rounded" />
            <div className="skeleton h-3 w-20 rounded ml-auto" />
            <div className="skeleton h-3 w-16 rounded" />
            <div className="skeleton h-3 w-12 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-surface-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h2 className="text-sm font-semibold text-text-primary">Revenue Risk Table</h2>
          {incidents.length > 0 && (
            <span className="badge-critical">
              {incidents.length} ACTIVE
            </span>
          )}
          <span className="text-2xs text-text-muted font-mono tabular-nums">
            Total: <span className="text-danger font-bold">{formatRevenueDaily(totalRisk)}</span>/day
          </span>
        </div>
        <Link
          id="revenue-risk-table-viewall"
          href="/incidents"
          className="text-xs text-primary hover:text-primary-hover flex items-center gap-1 transition-colors"
        >
          View all <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="data-table" id="revenue-risk-table">
          <thead>
            <tr>
              <th>Incident</th>
              <th>Revenue Risk</th>
              <th>% of Total</th>
              <th>Root Cause</th>
              <th>Confidence</th>
              <th>Affected</th>
              <th>Severity</th>
              <th>Started</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {incidents.map((incident) => {
              const riskPct = totalRisk > 0
                ? Math.round((incident.estimated_revenue_impact_daily / totalRisk) * 100)
                : 0;
              const isCritical = incident.severity === 'critical';
              const isHigh = incident.severity === 'high';

              return (
                <tr
                  key={incident.id}
                  className={cn(
                    'group',
                    isCritical && 'row-critical',
                    isHigh && 'row-warning'
                  )}
                >
                  {/* Incident title */}
                  <td className="max-w-[260px]">
                    <div className="flex items-center gap-2">
                      <span className={cn('status-dot', getStatusDotClass(incident.status))} />
                      <div>
                        <div className="text-sm font-medium text-text-primary leading-snug line-clamp-1">
                          {incident.title}
                        </div>
                        <div className="text-2xs text-text-muted mt-0.5 font-mono">
                          #{incident.id.slice(-6).toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Revenue risk */}
                  <td>
                    <div className="revenue-value text-sm tabular-nums">
                      {formatRevenueDaily(incident.estimated_revenue_impact_daily)}
                    </div>
                    <div className="text-2xs text-text-muted">/day</div>
                  </td>

                  {/* % of total risk (mini bar) */}
                  <td>
                    <div className="flex items-center gap-2 min-w-[80px]">
                      <div className="h-1.5 flex-1 rounded-full bg-surface-border overflow-hidden max-w-[48px]">
                        <div
                          className="h-full rounded-full bg-danger transition-all duration-700"
                          style={{ width: `${riskPct}%` }}
                        />
                      </div>
                      <span className="text-2xs font-mono text-text-secondary tabular-nums">{riskPct}%</span>
                    </div>
                  </td>

                  {/* Root cause */}
                  <td>
                    {incident.deployment_id ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-2xs text-text-muted">deploy</span>
                        <code className="mono text-text-primary bg-surface px-1.5 py-0.5 rounded border border-surface-border">
                          {shortHash(incident.deployment_id)}
                        </code>
                      </div>
                    ) : (
                      <span className="text-text-muted text-xs">Investigating</span>
                    )}
                  </td>

                  {/* Correlation confidence */}
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="confidence-bar w-16">
                        <div
                          className="confidence-bar-fill"
                          style={{
                            width: `${incident.correlation_confidence * 100}%`,
                            backgroundColor: getConfidenceColor(incident.correlation_confidence),
                          }}
                        />
                      </div>
                      <span
                        className="text-xs font-mono font-bold"
                        style={{ color: getConfidenceColor(incident.correlation_confidence) }}
                      >
                        {formatConfidence(incident.correlation_confidence)}
                      </span>
                    </div>
                  </td>

                  {/* Affected customers */}
                  <td>
                    <span className="text-sm text-text-primary font-medium tabular-nums">
                      {formatNumber(incident.affected_customer_count)}
                    </span>
                    <span className="text-2xs text-text-muted ml-1">users</span>
                  </td>

                  {/* Severity */}
                  <td>
                    <span className={getSeverityClass(incident.severity)}>
                      {incident.severity}
                    </span>
                  </td>

                  {/* Started */}
                  <td className="text-xs text-text-secondary whitespace-nowrap tabular-nums">
                    {formatRelativeTime(incident.started_at)}
                  </td>

                  {/* Actions */}
                  <td>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isCritical && (
                        <Link
                          href={`/incidents/${incident.id}`}
                          className="flex items-center gap-1 px-2 py-1 rounded bg-danger text-white text-2xs font-bold hover:bg-danger-hover transition-colors"
                          title="Enter War Room"
                        >
                          <Siren className="w-3 h-3" />
                          WAR ROOM
                        </Link>
                      )}
                      <Link
                        id={`incident-detail-${incident.id}`}
                        href={`/incidents/${incident.id}`}
                        className="p-1.5 rounded hover:bg-surface-elevated text-text-muted hover:text-text-primary transition-colors inline-flex"
                        title="View details"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {incidents.length === 0 && (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-10 h-10 rounded-full bg-success-muted border border-success/20 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-success" />
            </div>
            <div className="text-sm font-semibold text-text-primary">All Systems Nominal</div>
            <div className="text-xs text-text-muted">No active incidents — revenue protection active</div>
          </div>
        )}
      </div>
    </div>
  );
}
