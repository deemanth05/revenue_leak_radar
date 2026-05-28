'use client';

import Link from 'next/link';
import { ExternalLink, Siren, TrendingDown } from 'lucide-react';
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

interface IncidentCardProps {
  incident: Incident;
  compact?: boolean;
}

const SEVERITY_CARD_CLASS: Record<string, string> = {
  critical: 'card-critical',
  high: 'card-warning',
  medium: 'card',
  low: 'card',
};

const SEVERITY_GLOW: Record<string, string> = {
  critical: '0 0 16px rgba(239,68,68,0.15)',
  high: '0 0 16px rgba(245,158,11,0.12)',
  medium: 'none',
  low: 'none',
};

export function IncidentCard({ incident, compact = false }: IncidentCardProps) {
  const severityCard = SEVERITY_CARD_CLASS[incident.severity] ?? 'card';
  const glow = SEVERITY_GLOW[incident.severity] ?? 'none';

  if (compact) {
    return (
      <div className={cn(severityCard, 'p-3')} style={{ boxShadow: glow }}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className={cn('status-dot flex-shrink-0', getStatusDotClass(incident.status))} />
            <div className="min-w-0">
              <div className="text-xs font-semibold text-text-primary line-clamp-1">
                {incident.title}
              </div>
              <div className="text-2xs text-text-muted font-mono mt-0.5">
                #{incident.id.slice(-6).toUpperCase()}
              </div>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="revenue-value text-sm">{formatRevenueDaily(incident.estimated_revenue_impact_daily)}</div>
            <div className="text-2xs text-text-muted">/day</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(severityCard, 'p-5 space-y-4 animate-slide-up')} style={{ boxShadow: glow }}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className={cn('status-dot mt-1.5 flex-shrink-0', getStatusDotClass(incident.status))} />
          <div className="min-w-0">
            <div className="text-sm font-bold text-text-primary leading-snug line-clamp-2">
              {incident.title}
            </div>
            {incident.description && (
              <div className="text-xs text-text-secondary mt-1 line-clamp-2">
                {incident.description}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={getSeverityClass(incident.severity)}>
            {incident.severity}
          </span>
          <span className="text-2xs font-mono text-text-muted bg-surface px-1.5 py-0.5 rounded border border-surface-border">
            #{incident.id.slice(-6).toUpperCase()}
          </span>
        </div>
      </div>

      {/* Revenue impact — hero number */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-danger-muted/30 border border-danger/15">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-danger" />
          <div>
            <div className="text-2xs text-text-muted uppercase tracking-wide">Daily Revenue at Risk</div>
            <div className="metric-medium text-danger leading-none mt-0.5">
              {formatRevenueDaily(incident.estimated_revenue_impact_daily)}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xs text-text-muted">Affected</div>
          <div className="text-sm font-bold text-text-primary tabular-nums">
            {formatNumber(incident.affected_customer_count)} users
          </div>
        </div>
      </div>

      {/* Correlation row */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="text-2xs text-text-muted mb-1">Correlation Confidence</div>
          <div className="flex items-center gap-2">
            <div className="confidence-bar flex-1">
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
        </div>

        {incident.deployment_id && (
          <div className="flex-shrink-0">
            <div className="text-2xs text-text-muted mb-1">Root Cause</div>
            <code className="mono text-text-primary bg-surface px-2 py-1 rounded border border-surface-border">
              deploy:{shortHash(incident.deployment_id)}
            </code>
          </div>
        )}

        <div className="flex-shrink-0">
          <div className="text-2xs text-text-muted mb-1">Started</div>
          <div className="text-xs text-text-secondary">{formatRelativeTime(incident.started_at)}</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-surface-border">
        {incident.severity === 'critical' && (
          <Link
            href={`/incidents/${incident.id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-danger text-white text-xs font-bold hover:bg-danger-hover transition-colors"
          >
            <Siren className="w-3 h-3" />
            Enter War Room
          </Link>
        )}
        <Link
          id={`incident-card-detail-${incident.id}`}
          href={`/incidents/${incident.id}`}
          className={cn(
            'flex items-center gap-1.5 text-xs',
            incident.severity === 'critical'
              ? 'btn-ghost'
              : 'btn-secondary'
          )}
        >
          <ExternalLink className="w-3 h-3" />
          {incident.severity !== 'critical' ? 'View Incident' : 'Details'}
        </Link>
        <div className="flex-1" />
        <span className="text-2xs text-text-muted">
          {formatRelativeTime(incident.started_at)} ago
        </span>
      </div>
    </div>
  );
}
