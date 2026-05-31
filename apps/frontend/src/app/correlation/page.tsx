'use client';

import React, { useState, useEffect } from 'react';
import {
  Zap,
  Activity,
  GitBranch,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  Database,
  CheckCircle,
  Network,
  Settings,
  ShieldAlert,
  Loader2,
  Clock,
  ExternalLink
} from 'lucide-react';
import { incidentsApi, getMockIncidents } from '@/lib/api';
import { formatRevenueDaily, formatRelativeTime, shortHash } from '@/lib/utils';
import { CorrelationFlowGraph } from '@/components/charts/CorrelationFlowGraph';
import type { Incident } from '@rlr/schemas';
import Link from 'next/link';

export default function CorrelationPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUsingMockData, setIsUsingMockData] = useState(false);

  // Correlation engine system parameters state (interactive)
  const [rules, setRules] = useState([
    {
      id: 'RLR-CORR-01',
      name: 'Temporal Deploy-to-Error Affinity',
      description: 'Correlates git deployments with Sentry/Datadog surges within a 15-minute sliding window.',
      weight: 'CRITICAL',
      active: true,
    },
    {
      id: 'RLR-CORR-02',
      name: 'Billing API Decline Spike Linkage',
      description: 'Maps Stripe declination rate changes to user session drop-offs in the client telemetry.',
      weight: 'HIGH',
      active: true,
    },
    {
      id: 'RLR-CORR-03',
      name: 'Support Ticket Sentiment Velocity',
      description: 'Flags real-time customer complaints containing checkout payment issues.',
      weight: 'MEDIUM',
      active: true,
    },
    {
      id: 'RLR-CORR-04',
      name: 'SLA Breach Co-occurrence heuristic',
      description: 'Matches cross-region cache misses with API latency degradation.',
      weight: 'LOW',
      active: false,
    },
  ]);

  useEffect(() => {
    async function loadData() {
      try {
        const listRes = await incidentsApi.list({ page_size: 50 });
        setIncidents(listRes.items);
        if (listRes.items.length > 0) {
          // Find first critical/high incident or the first one
          const ideal = listRes.items.find(i => i.severity === 'critical') || listRes.items[0];
          setSelectedIncidentId(ideal.id);
        }
      } catch (error) {
        console.warn('Backend API connection failed in correlation page, using mock data:', error);
        const mock = getMockIncidents();
        setIncidents(mock);
        setSelectedIncidentId(mock[0].id);
        setIsUsingMockData(true);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const toggleRule = (id: string) => {
    setRules(prev =>
      prev.map(r => (r.id === id ? { ...r, active: !r.active } : r))
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
        <span className="text-text-secondary text-sm">Loading correlation models...</span>
      </div>
    );
  }

  // Calculate statistics
  const activeCorrelatedIncidents = incidents.filter(
    (i) => i.status !== 'resolved' && i.correlation_confidence
  );
  const avgConfidence =
    activeCorrelatedIncidents.length > 0
      ? Math.round(
          (activeCorrelatedIncidents.reduce(
            (sum, i) => sum + (i.correlation_confidence || 0),
            0
          ) /
            activeCorrelatedIncidents.length) *
            100
        )
      : 94;

  const selectedIncident = incidents.find(i => i.id === selectedIncidentId) || null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-border pb-5">
        <div>
          <div className="flex items-center gap-2 text-2xs text-text-muted font-bold tracking-widest uppercase">
            <span>Intelligence</span>
            <ArrowRight className="w-3 h-3" />
            <span className="text-primary">Correlation Engine</span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary mt-1 flex items-center gap-2.5">
            <Network className="w-6 h-6 text-primary" />
            <span>Deterministic Correlation Engine</span>
            <span className="text-2xs px-1.5 py-0.5 rounded bg-surface border border-surface-border text-text-muted font-semibold">Coral-Powered</span>
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Real-time causal linkage mapping between deployment triggers, application exceptions, gateway declines, and revenue loss.
          </p>
        </div>

        {isUsingMockData && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-warning/15 border border-warning/20 text-warning text-xs font-mono">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>MOCK MODE ACTIVE</span>
          </div>
        )}
      </div>

      {/* KPI Command Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Evaluation Latency',
            value: '8.42 ms',
            detail: 'Relational join time',
            icon: Clock,
            color: 'text-primary border-primary/20',
          },
          {
            label: 'Avg Correlation Confidence',
            value: `${avgConfidence}%`,
            detail: 'Across active threats',
            icon: Zap,
            color: 'text-success border-success/20',
          },
          {
            label: 'Evaluated Signatures',
            value: `${incidents.length} signals`,
            detail: 'Ingested this window',
            icon: Database,
            color: 'text-warning border-warning/20',
          },
          {
            label: 'Causal Rules Loaded',
            value: `${rules.filter(r => r.active).length} / ${rules.length}`,
            detail: 'Deterministic heuristics',
            icon: Settings,
            color: 'text-revenue border-revenue/20',
          },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className={`card p-4 flex items-center gap-4 border-l-2 ${kpi.color}`}>
              <div className="p-2 rounded bg-surface border border-surface-border">
                <Icon className="w-5 h-5 text-text-secondary" />
              </div>
              <div>
                <div className="text-2xs font-bold text-text-muted uppercase tracking-wider">{kpi.label}</div>
                <div className="text-lg font-extrabold text-text-primary mt-0.5 font-mono">{kpi.value}</div>
                <div className="text-3xs text-text-muted mt-0.5">{kpi.detail}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Panel: Interactive Flow Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 columns: Graph View & Selectors */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Causal Topology Visualization
              </h2>
              <div className="text-xs text-text-muted">
                Select an incident below to overlay path details
              </div>
            </div>

            {/* The Graph */}
            <div className="glass-panel overflow-hidden">
              <CorrelationFlowGraph incident={selectedIncident} />
            </div>

            {/* Incidents selector block */}
            <div className="space-y-2.5">
              <div className="text-xs font-bold text-text-muted uppercase tracking-wider">Active Incident Overlays</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {incidents.map((inc) => {
                  const isSelected = inc.id === selectedIncidentId;
                  const score = Math.round((inc.correlation_confidence || 0) * 100);
                  return (
                    <button
                      key={inc.id}
                      onClick={() => setSelectedIncidentId(inc.id)}
                      className={`text-left p-3 rounded-lg border transition-all flex flex-col justify-between h-[96px] ${
                        isSelected
                          ? 'border-primary bg-primary-muted/20 glow-primary'
                          : 'border-surface-border bg-surface hover:border-text-muted/30'
                      }`}
                    >
                      <div className="text-xs font-bold text-text-primary line-clamp-2 leading-tight">
                        {inc.title}
                      </div>
                      <div className="flex items-center justify-between w-full mt-2 border-t border-surface-border/40 pt-1.5">
                        <span className={`text-3xs px-1.5 py-0.5 rounded font-mono font-bold ${
                          inc.severity === 'critical' ? 'bg-danger-muted text-danger border border-danger/20' : 'bg-warning-muted text-warning border border-warning/20'
                        }`}>
                          {inc.severity.toUpperCase()}
                        </span>
                        <span className="text-3xs font-mono font-bold text-text-secondary">
                          {score}% match
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Incident Correlation Details & Rules Config */}
        <div className="space-y-6">
          {/* Selected Incident Correlation Blueprint */}
          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-text-primary border-b border-surface-border pb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-warning" /> Match Summary
            </h3>
            
            {selectedIncident ? (
              <div className="space-y-4">
                <div>
                  <div className="text-2xs font-bold text-text-muted uppercase tracking-wider">Matched Threat</div>
                  <div className="text-sm font-bold text-text-primary mt-1">
                    {selectedIncident.title}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-background-secondary p-3 rounded-lg border border-surface-border">
                  <div>
                    <div className="text-3xs text-text-muted font-mono uppercase">Joint Confidence</div>
                    <div className="text-sm font-bold text-success font-mono mt-0.5">
                      {Math.round((selectedIncident.correlation_confidence || 0) * 100)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-3xs text-text-muted font-mono uppercase">Calculated SLA Exposure</div>
                    <div className="text-sm font-bold text-danger font-mono mt-0.5">
                      {formatRevenueDaily(selectedIncident.estimated_revenue_impact_daily)}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs leading-relaxed text-text-secondary">
                  <div>
                    <span className="text-text-primary font-semibold">Causal Node:</span>{' '}
                    {selectedIncident.deployment_id ? (
                      <span className="font-mono bg-surface border border-surface-border px-1.5 py-0.5 rounded text-3xs font-semibold">
                        deploy:{shortHash(selectedIncident.deployment_id)}
                      </span>
                    ) : (
                      <span className="text-text-muted italic">No deployment linked</span>
                    )}
                  </div>
                  <p>{selectedIncident.description}</p>
                </div>

                <div className="border-t border-surface-border pt-4">
                  <Link
                    href={`/incidents/${selectedIncident.id}`}
                    className="btn-primary py-2 px-3 flex items-center justify-center gap-2 text-xs w-full text-center"
                  >
                    <span>Enter Incident War Room</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-text-muted text-xs">
                No active threats found.
              </div>
            )}
          </div>

          {/* Interactive Heuristic Rules config */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Settings className="w-4 h-4 text-primary" />
                Active Heuristics
              </h3>
              <span className="text-3xs text-text-muted font-mono font-bold">MUTABLE</span>
            </div>

            <div className="space-y-3">
              {rules.map((rule) => (
                <div key={rule.id} className="p-3 rounded-lg bg-background-secondary border border-surface-border space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                      <span className="font-mono text-3xs text-text-muted">{rule.id}</span>
                      <span>{rule.name}</span>
                    </div>
                    <button
                      onClick={() => toggleRule(rule.id)}
                      className={`w-8 h-4 rounded-full transition-colors relative flex items-center ${
                        rule.active ? 'bg-success' : 'bg-surface-elevated border border-surface-border'
                      }`}
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded-full bg-white absolute transition-transform ${
                          rule.active ? 'translate-x-4' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-3xs text-text-muted leading-relaxed">
                    {rule.description}
                  </p>
                  <div className="flex items-center gap-2.5 mt-1 pt-1.5 border-t border-surface-border/40 text-3xs">
                    <span className="text-text-muted">Weight:</span>
                    <span className={`font-extrabold ${
                      rule.weight === 'CRITICAL' ? 'text-danger' : rule.weight === 'HIGH' ? 'text-warning' : 'text-primary'
                    }`}>
                      {rule.weight}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Historical Correlation Matches Table */}
      <div className="card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-text-primary border-b border-surface-border pb-3 flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" /> Historical Causal Signatures
        </h3>

        <div className="overflow-x-auto">
          <table className="data-table w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-surface-border text-3xs font-bold uppercase tracking-wider text-text-muted">
                <th className="py-2.5 px-3">Incidents</th>
                <th className="py-2.5 px-3">Root Cause Deployment</th>
                <th className="py-2.5 px-3">Primary Signatures</th>
                <th className="py-2.5 px-3">Calculated Damage</th>
                <th className="py-2.5 px-3">Match Confidence</th>
                <th className="py-2.5 px-3">System Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/40 text-xs">
              {incidents.map((inc) => {
                const score = Math.round((inc.correlation_confidence || 0) * 100);
                return (
                  <tr key={inc.id} className="hover:bg-surface-elevated/40 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-text-primary">{inc.title}</div>
                      <div className="text-3xs text-text-muted mt-0.5">Detected {formatRelativeTime(inc.started_at)}</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-3xs">
                      {inc.deployment_id ? (
                        <span className="px-2 py-0.5 rounded bg-primary-muted text-primary border border-primary/20 font-semibold">
                          checkout-service:{shortHash(inc.deployment_id)}
                        </span>
                      ) : (
                        <span className="text-text-muted italic">Telemetry only (No deploy matched)</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-danger-muted border border-danger/20 text-danger text-3xs font-semibold">
                          {inc.error_rate} err/m
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-warning-muted border border-warning/20 text-warning text-3xs font-semibold">
                          {inc.affected_customer_count} accounts
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-primary-muted border border-primary/20 text-primary text-3xs font-semibold">
                          Stripe ledger
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-bold text-text-primary font-mono">
                      {formatRevenueDaily(inc.estimated_revenue_impact_daily)}
                    </td>
                    <td className="py-3 px-3 font-mono text-success font-semibold">
                      {score}% match
                    </td>
                    <td className="py-3 px-3">
                      <Link
                        href={`/incidents/${inc.id}`}
                        className="text-primary hover:text-primary-hover flex items-center gap-1 font-bold text-2xs transition-colors"
                      >
                        <span>War Room</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
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
