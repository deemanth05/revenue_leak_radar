'use client';

import { ExternalLink, ChevronRight } from 'lucide-react';
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
}

export function RevenueRiskTable({ incidents, loading }: RevenueRiskTableProps) {
  if (loading) {
    return (
      <div className="card">
        <div className="p-4 border-b border-surface-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">Revenue Risk Table</h2>
        </div>
        <div className="p-8 flex items-center justify-center">
          <div className="text-text-muted text-sm">Loading incidents...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-surface-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-text-primary">Revenue Risk Table</h2>
          <span className="px-1.5 py-0.5 rounded text-2xs font-bold bg-danger-muted text-danger border border-danger/20">
            {incidents.length} ACTIVE
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
              <th>Root Cause</th>
              <th>Confidence</th>
              <th>Affected</th>
              <th>Severity</th>
              <th>Started</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {incidents.map((incident) => (
              <tr key={incident.id} className="group">
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
                  <div className="revenue-value text-base">
                    {formatRevenueDaily(incident.estimated_revenue_impact_daily)}
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
                      className="text-xs font-mono font-medium"
                      style={{ color: getConfidenceColor(incident.correlation_confidence) }}
                    >
                      {formatConfidence(incident.correlation_confidence)}
                    </span>
                  </div>
                </td>

                {/* Affected customers */}
                <td>
                  <span className="text-sm text-text-primary font-medium">
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
                <td className="text-xs text-text-secondary whitespace-nowrap">
                  {formatRelativeTime(incident.started_at)}
                </td>

                {/* Actions */}
                <td className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link
                    id={`incident-detail-${incident.id}`}
                    href={`/incidents/${incident.id}`}
                    className="p-1 rounded hover:bg-surface-elevated text-text-muted hover:text-text-primary transition-colors inline-flex"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {incidents.length === 0 && (
          <div className="py-12 text-center text-text-muted text-sm">
            No active incidents — system nominal
          </div>
        )}
      </div>
    </div>
  );
}
