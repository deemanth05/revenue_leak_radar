"use client";

import React, { useEffect, useState, startTransition } from 'react';
import { GitCommit, AlertTriangle, CreditCard, MessageSquare, CheckCircle, Zap, Loader2, ArrowRight } from 'lucide-react';
import { incidentsApi } from '@/lib/api';
import { formatRevenue, formatDateTime } from '@/lib/utils';
import type { Incident } from '@rlr/schemas';

type EventType = 'deployment' | 'alert' | 'payment_failure' | 'support_ticket' | 'remediation' | 'executive_alert';

interface TimelineEvent {
  timestamp: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

const ICONS: Record<string, React.ReactNode> = {
  deployment: <GitCommit className="w-3.5 h-3.5" />,
  alert: <AlertTriangle className="w-3.5 h-3.5" />,
  payment_failure: <CreditCard className="w-3.5 h-3.5" />,
  support_ticket: <MessageSquare className="w-3.5 h-3.5" />,
  remediation: <CheckCircle className="w-3.5 h-3.5" />,
  executive_alert: <Zap className="w-3.5 h-3.5" />,
};

const ICON_COLORS: Record<string, string> = {
  deployment: 'bg-primary-muted border-primary/30 text-primary',
  alert: 'bg-danger-muted border-danger/30 text-danger',
  payment_failure: 'bg-danger-muted border-danger/30 text-danger',
  support_ticket: 'bg-warning-muted border-warning/30 text-warning',
  remediation: 'bg-success-muted border-success/30 text-success',
  executive_alert: 'bg-revenue-muted border-revenue/30 text-revenue',
};

const MOCK_TIMELINE: TimelineEvent[] = [
  {
    type: 'deployment',
    timestamp: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
    severity: 'info',
    title: 'Deployment abc123f → checkout-service (production)',
    message: 'Automated deployment triggered by merge to main. Author: Sarah Chen. Duration: 145s.',
    metadata: { 'Commit': 'abc123f', 'Branch': 'main', 'Service': 'checkout-service', 'Author': 'Sarah Chen' },
  },
  {
    type: 'alert',
    timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    severity: 'critical',
    title: 'Sentry: HTTP 500 rate elevated — checkout-service',
    message: 'Error rate crossed 50/min threshold. PaymentProcessor.process() raising StripeAPIError.',
    metadata: { 'Error Rate': '340/min', 'Threshold': '50/min', 'Endpoint': '/api/checkout/payment' },
  },
  {
    type: 'payment_failure',
    timestamp: new Date(Date.now() - 85 * 60 * 1000).toISOString(),
    severity: 'high',
    title: 'Stripe: Payment failure rate increasing',
    message: 'First 12 payment failures detected. Failure reason: processing_error (Stripe API signature mismatch).',
    metadata: { 'Failures': '12', 'Reason': 'processing_error', 'Amount': '$1,240 failed' },
  },
  {
    type: 'executive_alert',
    timestamp: new Date(Date.now() - 80 * 60 * 1000).toISOString(),
    severity: 'critical',
    title: 'Correlation Engine: Root cause identified',
    message: 'Deployment abc123f correlated to incident with 94% confidence. Revenue impact estimated at $42,000/day.',
    metadata: { 'Confidence': '94%', 'Revenue Impact': '$42,000/day', 'Signals': 'payment_failures + Sentry alerts' },
  },
  {
    type: 'alert',
    timestamp: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
    severity: 'critical',
    title: 'Datadog: Stripe API P99 latency > 5000ms',
    message: 'Stripe API response times in checkout-service exceeding SLA threshold across all endpoints.',
    metadata: { 'P99 Latency': '6,800ms', 'SLA Threshold': '2,000ms' },
  },
  {
    type: 'support_ticket',
    timestamp: new Date(Date.now() - 70 * 60 * 1000).toISOString(),
    severity: 'high',
    title: 'Support: 23 tickets opened (surge detected)',
    message: 'Zendesk ticket surge detected. Primary subject: "Payment failed during checkout". Priority: urgent.',
    metadata: { 'Tickets': '23', 'Priority': 'urgent', 'Source': 'Zendesk' },
  },
  {
    type: 'remediation',
    timestamp: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
    severity: 'info',
    title: 'Jira issue created: CHK-4821 — Rollback abc123f',
    message: 'Autonomous remediation agent created Jira ticket. Assigned to: on-call-eng. Recommended action: rollback.',
    metadata: { 'Ticket': 'CHK-4821', 'Assignee': 'on-call-eng', 'Action': 'Rollback abc123f' },
  },
  {
    type: 'remediation',
    timestamp: new Date(Date.now() - 64 * 60 * 1000).toISOString(),
    severity: 'info',
    title: 'Slack alert sent to #incidents channel',
    message: 'Autonomous notification dispatched. Message includes incident summary, revenue impact, and rollback recommendation.',
    metadata: { 'Channel': '#incidents', 'Notified': '@oncall, @engineering-leads' },
  },
  {
    type: 'payment_failure',
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    severity: 'high',
    title: 'Stripe: Payment failures reach 89 total',
    message: 'Cumulative payment failures: 89 transactions. Total failed amount: $14,210. Affecting 424 customers.',
    metadata: { 'Total Failures': '89', 'Failed Amount': '$14,210', 'Customers': '424' },
  },
];

export default function TimelinePage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [isMock, setIsMock] = useState(false);

  useEffect(() => {
    async function loadIncidents() {
      try {
        const res = await incidentsApi.list({ page_size: 50 });
        setIncidents(res.items);
        if (res.items.length > 0) {
          setSelectedId(res.items[0].id);
        } else {
          setIsMock(true);
          setTimeline(MOCK_TIMELINE);
        }
      } catch (err) {
        console.warn("Could not fetch incidents from backend, using mock.", err);
        setIsMock(true);
        setTimeline(MOCK_TIMELINE);
      } finally {
        setLoading(false);
      }
    }
    loadIncidents();
  }, []);

  useEffect(() => {
    if (!selectedId || isMock) return;
    const incidentId = selectedId;

    async function loadTimeline(id: string) {
      setTimelineLoading(true);
      try {
        const res = await incidentsApi.timeline(id);
        setTimeline(res);
      } catch (err) {
        console.error("Failed to load timeline", err);
      } finally {
        setTimelineLoading(false);
      }
    }
    loadTimeline(incidentId);
  }, [selectedId, isMock]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="ml-3 text-text-secondary text-sm">Loading correlation intelligence...</span>
      </div>
    );
  }

  const selectedIncident = incidents.find(i => i.id === selectedId);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Incident Timeline</h1>
          <p className="text-sm text-text-muted mt-1">
            Root cause timeline — sequenced by technical anomaly & revenue impact
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span className="live-indicator">Live feed</span>
          {isMock && <span className="text-warning font-semibold">(DEMO MODE)</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left list of incidents */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Active Incidents</h2>
          {isMock ? (
            <div className="p-3 rounded bg-surface border border-danger/30">
              <div className="text-xs font-bold text-text-primary">Checkout Service Failure</div>
              <div className="text-2xs text-danger mt-1 font-semibold">$42,000/day Risk</div>
            </div>
          ) : (
            <div className="space-y-2">
              {incidents.map((inc) => (
                <button
                  key={inc.id}
                  onClick={() => startTransition(() => setSelectedId(inc.id))}
                  className={`w-full text-left p-3 rounded transition-all border ${
                    selectedId === inc.id
                      ? 'bg-surface border-primary'
                      : 'bg-surface/50 border-surface-border hover:border-text-muted'
                  }`}
                >
                  <div className="text-xs font-bold text-text-primary line-clamp-2">{inc.title}</div>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-3xs px-1.5 py-0.5 rounded font-mono uppercase font-bold ${
                      inc.severity === 'critical' ? 'bg-danger-muted text-danger border border-danger/20' :
                      inc.severity === 'high' ? 'bg-warning-muted text-warning border border-warning/20' :
                      'bg-primary-muted text-primary border border-primary/20'
                    }`}>
                      {inc.severity}
                    </span>
                    <span className="text-2xs font-bold text-danger">
                      ${Number(inc.estimated_revenue_impact_daily).toLocaleString()}/d
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right timeline details */}
        <div className="lg:col-span-3 space-y-4">
          {selectedIncident && (
            <div className="p-4 rounded-lg bg-surface border border-surface-border">
              <h3 className="text-sm font-bold text-text-primary">{selectedIncident.title}</h3>
              <p className="text-xs text-text-secondary mt-1">{selectedIncident.description}</p>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-surface-border text-xs text-text-muted">
                <div>
                  Started: <span className="text-text-primary font-mono">{formatDateTime(selectedIncident.started_at)}</span>
                </div>
                <div>
                  Impact: <span className="text-danger font-bold">${Number(selectedIncident.estimated_revenue_impact_daily).toLocaleString()}/day</span>
                </div>
                <div>
                  Correlation Confidence: <span className="text-primary font-bold">{Math.round(selectedIncident.correlation_confidence * 100)}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Timeline Feed */}
          {timelineLoading ? (
            <div className="flex items-center justify-center p-12 bg-surface rounded border border-surface-border">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : (
            <div className="card p-6">
              {timeline.length === 0 ? (
                <div className="text-center py-8 text-xs text-text-muted">
                  No events found in incident timeline. Select a step in simulation control panel.
                </div>
              ) : (
                <div className="relative">
                  {/* Vertical connector line */}
                  <div className="absolute left-[22px] top-2 bottom-2 w-px bg-surface-border" />

                  <div className="space-y-6">
                    {timeline.map((event, i) => {
                      const typeKey = event.type.toLowerCase();
                      const icon = ICONS[typeKey] || <Zap className="w-3.5 h-3.5" />;
                      const colorClass = ICON_COLORS[typeKey] || 'bg-surface border-surface-border text-text-primary';

                      return (
                        <div key={i} className="relative flex gap-4">
                          {/* Icon */}
                          <div className={`relative z-10 flex-shrink-0 w-11 h-11 rounded-lg border flex items-center justify-center ${colorClass}`}>
                            {icon}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 pt-0.5">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-text-primary leading-snug">
                                  {event.title}
                                </div>
                                <div className="text-xs text-text-secondary mt-1 leading-relaxed">
                                  {event.message}
                                </div>
                              </div>
                              <div className="flex-shrink-0 text-right">
                                <div className="text-xs font-mono text-text-primary">
                                  {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </div>
                                <div className="text-3xs text-text-muted mt-0.5">
                                  {new Date(event.timestamp).toLocaleDateString()}
                                </div>
                              </div>
                            </div>

                            {/* Metadata */}
                            {event.metadata && Object.keys(event.metadata).length > 0 && (
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                {Object.entries(event.metadata).map(([k, v]) => (
                                  <div key={k} className="flex items-center gap-1 px-2 py-0.5 rounded bg-surface border border-surface-border text-2xs">
                                    <span className="text-text-muted font-medium">{k}:</span>
                                    <span className="text-text-primary font-mono">{String(v)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
