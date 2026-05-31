'use client';

import React, { useState, useCallback } from 'react';
import {
  Database,
  Search,
  Play,
  CheckCircle,
  Activity,
  GitBranch,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  MessageSquare,
  Clock,
  Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CoralShowcasePage() {
  const [windowHours, setWindowHours] = useState<number>(24);
  const [loading, setLoading] = useState(false);
  const [apiResult, setApiResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [jsonExpanded, setJsonExpanded] = useState(true);

  const runJointQuery = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(
        `${baseUrl}/api/v1/coral/joint-query?window_hours=${windowHours}`,
        { method: 'POST' }
      );
      if (!res.ok) {
        throw new Error(`API returned ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      setApiResult(data);
    } catch (err: any) {
      console.error('Coral API call failed:', err);
      setError(err.message || 'Unknown connection error');
    } finally {
      setLoading(false);
    }
  }, [windowHours]);

  const sourceMetadata = {
    deployments: {
      name: 'Deployment Pipeline',
      provider: 'GitHub / CI-CD',
      icon: GitBranch,
      colorClass: 'text-primary border-primary/20 bg-primary/10',
    },
    payment_failures: {
      name: 'Payment Gateway',
      provider: 'Stripe',
      icon: DollarSign,
      colorClass: 'text-danger border-danger/20 bg-danger/10',
    },
    support_tickets: {
      name: 'Customer Support Queue',
      provider: 'Zendesk',
      icon: MessageSquare,
      colorClass: 'text-warning border-warning/20 bg-warning/10',
    },
    alerts: {
      name: 'Infrastructure Monitoring',
      provider: 'Sentry',
      icon: AlertTriangle,
      colorClass: 'text-success border-success/20 bg-success/10',
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2.5">
          <Database className="w-6 h-6 text-primary animate-pulse" />
          Coral Intelligence Engine
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Cross-source signal correlation powered by the Coral query engine
        </p>
      </div>

      {/* Control Panel */}
      <div className="card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-bold text-text-muted uppercase tracking-wider">Temporal Query Window</div>
          <div className="flex items-center gap-2">
            {[6, 12, 24, 48, 72].map((hours) => (
              <button
                key={hours}
                onClick={() => setWindowHours(hours)}
                className={cn(
                  "px-2.5 py-1 text-xs rounded border transition-all",
                  windowHours === hours
                    ? "bg-primary border-primary text-white font-semibold"
                    : "bg-surface border-surface-border text-text-muted hover:border-text-muted/30"
                )}
              >
                {hours}h
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={runJointQuery}
          disabled={loading}
          className={cn(
            "btn-primary py-2 px-4 flex items-center gap-2 text-sm font-semibold",
            loading ? "opacity-50 pointer-events-none" : ""
          )}
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" /> Executing Correlation Joint-Query...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" /> Run Joint Query
            </>
          )}
        </button>
      </div>

      {/* Main Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Query Performance and Insights */}
        <div className="lg:col-span-2 space-y-6">
          {apiResult ? (
            <div className="card p-5 space-y-6">
              {/* Execution Info */}
              <div className="flex flex-wrap items-center justify-between border-b border-surface-border pb-4 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                    <CheckCircle className="w-4.5 h-4.5 text-success" /> Query Execution Success
                  </h3>
                  <div className="text-2xs text-text-muted mt-0.5">
                    Verified Coral metadata contract response
                  </div>
                </div>

                <div className="flex items-center gap-3 text-2xs font-mono text-text-muted">
                  <div className="px-2 py-1 rounded bg-surface border border-surface-border">
                    Engine: <span className="text-text-primary font-bold">{apiResult.query_engine}</span>
                  </div>
                  <div className="px-2 py-1 rounded bg-surface border border-surface-border">
                    Duration: <span className="text-primary font-bold">{apiResult.query_duration_ms} ms</span>
                  </div>
                  <div className="px-2 py-1 rounded bg-surface border border-surface-border flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(apiResult.executed_at).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>

              {/* Active Sources Badges */}
              <div className="space-y-2">
                <div className="text-2xs font-bold text-text-muted uppercase tracking-wider">Active Signal Sources in Window</div>
                <div className="flex flex-wrap gap-2">
                  {apiResult.sources_with_data && apiResult.sources_with_data.length > 0 ? (
                    apiResult.sources_with_data.map((srcId: string) => {
                      const meta = (sourceMetadata as any)[srcId] || { name: srcId, icon: Database, colorClass: 'bg-surface border-surface-border text-text-muted' };
                      const Icon = meta.icon;
                      return (
                        <div
                          key={srcId}
                          className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-semibold", meta.colorClass)}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{meta.name}</span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-xs text-text-muted italic">No sources returned active signals in this time window.</div>
                  )}
                </div>
              </div>

              {/* Correlation Summary */}
              <div className="p-4 rounded-lg bg-surface border border-surface-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-primary" />
                    Joint Correlation Recommendation
                  </div>
                  <span className={cn(
                    "text-xs font-mono font-bold px-2 py-0.5 rounded border",
                    apiResult.correlation_summary.confidence >= 0.8
                      ? "bg-danger-muted/30 text-danger border-danger/20"
                      : apiResult.correlation_summary.confidence >= 0.5
                      ? "bg-warning-muted/30 text-warning border-warning/20"
                      : "bg-primary-muted/30 text-primary border-primary/20"
                  )}>
                    {Math.round(apiResult.correlation_summary.confidence * 100)}% Confidence
                  </span>
                </div>

                <div className="text-lg font-bold text-text-primary leading-snug">
                  {apiResult.correlation_summary.recommendation}
                </div>

                <div className="text-xs text-text-secondary leading-relaxed">
                  Coral joined and indexed {apiResult.correlation_summary.total_signals} total signals across deployments, billing declines, exception trackers, and client complaint tickets.
                </div>
              </div>

              {/* Signal breakdown cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                {[
                  { label: 'Deployments', count: apiResult.signal_counts.deployments, color: 'text-primary' },
                  { label: 'Payment Failures', count: apiResult.signal_counts.payment_failures, color: 'text-danger' },
                  { label: 'Support Tickets', count: apiResult.signal_counts.support_tickets, color: 'text-warning' },
                  { label: 'Sentry Alerts', count: apiResult.signal_counts.alerts, color: 'text-success' },
                ].map((item, idx) => (
                  <div key={idx} className="p-3 bg-black/20 border border-surface-border rounded-lg">
                    <div className={cn("text-xl font-bold font-mono leading-none", item.color)}>
                      {item.count}
                    </div>
                    <div className="text-3xs text-text-muted uppercase tracking-wider mt-1.5">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card p-8 flex flex-col items-center justify-center text-center gap-4 min-h-[350px]">
              <Database className="w-12 h-12 text-text-muted/30 animate-pulse" />
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-text-primary">Coral Engine Standby</h3>
                <p className="text-xs text-text-muted max-w-sm">
                  Click 'Run Joint Query' to execute a live SQL relational join over recent telemetry events and billing records.
                </p>
              </div>
              {error && (
                <div className="mt-2 text-xs text-danger bg-danger-muted/10 border border-danger/20 rounded p-2.5 max-w-md font-mono">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Raw Contract Output JSON */}
          {apiResult && (
            <div className="card p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-surface-border pb-3">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Raw Query Contract Payload
                </h4>
                <button
                  onClick={() => setJsonExpanded(!jsonExpanded)}
                  className="text-2xs text-primary hover:underline"
                >
                  {jsonExpanded ? 'Hide Payload' : 'Show Payload'}
                </button>
              </div>

              {jsonExpanded && (
                <div className="bg-black/40 border border-surface-border rounded-lg p-4 font-mono text-2xs max-h-[300px] overflow-y-auto text-text-secondary leading-relaxed">
                  <pre className="whitespace-pre-wrap">{JSON.stringify(apiResult, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Coral Data Sources */}
        <div className="space-y-6">
          <div className="card p-5 space-y-4">
            <div className="border-b border-surface-border pb-3">
              <h3 className="text-sm font-semibold text-text-primary">
                Coral Data Sources
              </h3>
              <p className="text-2xs text-text-muted mt-0.5">
                Active connections querying across distributed namespaces
              </p>
            </div>

            <div className="space-y-3.5">
              {[
                {
                  name: 'Deployment Pipeline',
                  provider: 'GitHub Actions',
                  desc: 'Ingests production build triggers, commit IDs, and authors.',
                  icon: GitBranch,
                  color: 'text-primary border-primary/20 bg-primary/5',
                },
                {
                  name: 'Payment Gateway',
                  provider: 'Stripe API v3',
                  desc: 'Ledger declination events, invoice failure reason strings.',
                  icon: DollarSign,
                  color: 'text-danger border-danger/20 bg-danger/5',
                },
                {
                  name: 'Customer Support',
                  provider: 'Zendesk Tickets',
                  desc: 'Support escalations, category keywords, queue priority tags.',
                  icon: MessageSquare,
                  color: 'text-warning border-warning/20 bg-warning/5',
                },
                {
                  name: 'Infrastructure Alerts',
                  provider: 'Sentry Exceptions',
                  desc: 'Exceptions spikes, server crash logs, core service timeouts.',
                  icon: AlertTriangle,
                  color: 'text-success border-success/20 bg-success/5',
                },
              ].map((src, idx) => {
                const Icon = src.icon;
                return (
                  <div key={idx} className={cn("p-3 rounded-lg border flex gap-3 items-start", src.color)}>
                    <div className="p-1.5 rounded bg-surface border border-surface-border mt-0.5">
                      <Icon className="w-4 h-4 text-text-secondary" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-text-primary">{src.name}</span>
                        <span className="text-4xs px-1 rounded bg-black/35 text-text-muted uppercase tracking-widest">{src.provider}</span>
                      </div>
                      <p className="text-3xs text-text-secondary leading-normal">{src.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
