'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  AlertTriangle,
  Play,
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  Terminal,
  Activity,
  AlertCircle,
  Copy,
  Check,
  RotateCcw,
  Zap,
  Radio,
  ExternalLink,
  MessageSquare,
  FileText,
  ShieldAlert
} from 'lucide-react';
import { incidentsApi, remediationApi, executiveApi } from '@/lib/api';
import { formatRevenueDaily, formatRelativeTime, cn } from '@/lib/utils';
import { CorrelationFlowGraph } from '@/components/charts/CorrelationFlowGraph';
import type { Incident, RemediationAction } from '@rlr/schemas';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function IncidentWarRoomPage({ params }: PageProps) {
  const [incidentId, setIncidentId] = useState<string>('');
  const router = useRouter();

  // Resolve params asynchronously to prevent component suspension crashes
  useEffect(() => {
    Promise.resolve(params).then((resolved) => {
      if (resolved && resolved.id) {
        setIncidentId(resolved.id);
      }
    });
  }, [params]);

  // State
  const [incident, setIncident] = useState<Incident | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [similarIncidents, setSimilarIncidents] = useState<any[]>([]);
  const [remediationActions, setRemediationActions] = useState<RemediationAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Timer state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // AI Briefing Hub state
  const [activeBriefingTab, setActiveBriefingTab] = useState<'cto' | 'board' | 'customer'>('cto');
  const [briefingContent, setBriefingContent] = useState<Record<string, any> | null>(null);
  const [generatingBriefing, setGeneratingBriefing] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Load initial data
  useEffect(() => {
    if (!incidentId) return;
    let active = true;

    async function loadData() {
      try {
        setLoading(true);
        // Fetch incident
        const inc = await incidentsApi.get(incidentId);
        if (!active) return;
        setIncident(inc);

        // Fetch timeline
        try {
          const tEvents = await incidentsApi.timeline(incidentId);
          if (active) setTimeline(tEvents);
        } catch (err) {
          console.warn('Failed to load timeline:', err);
        }

        // Fetch remediation actions
        try {
          let actions = await remediationApi.list(incidentId);
          if (actions.length === 0) {
            // Generate it if empty
            actions = await remediationApi.generate(incidentId);
          }
          if (active) setRemediationActions(actions);
        } catch (err) {
          console.warn('Failed to load remediation actions:', err);
        }

        // Fetch similar incidents
        try {
          const similar = await incidentsApi.similar(incidentId);
          if (active) setSimilarIncidents(similar);
        } catch (err) {
          console.warn('Failed to load similar incidents:', err);
        }

        setError(null);
      } catch (err: any) {
        console.error('Failed to load war room data:', err);
        setError(err.message || 'Failed to load incident data.');
        // Fallback to mock if API fails
        setupMockData();
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [incidentId]);

  // Set up mock fallback data
  const setupMockData = () => {
    const nowStr = new Date().toISOString();
    const mockInc: Incident = {
      id: incidentId,
      title: 'Checkout Service Payment Failure — Deployment abc123f',
      description: 'Payment processing failures spiking following deployment abc123f. 89 failed transactions detected. Stripe API timeouts exceeding 5000ms.',
      severity: 'critical' as any,
      status: 'active' as any,
      source: 'correlation_engine' as any,
      deployment_id: 'dep-culprit',
      deployment: {
        id: 'dep-culprit',
        commit_hash: 'abc123f',
        branch: 'main',
        author: 'sre-oncall@acme.com',
        repository: 'checkout-service',
        environment: 'production' as any,
        status: 'success' as any,
        deployed_at: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
        duration_seconds: 45,
        rollback_of: null,
        created_at: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
      },
      error_rate: 340,
      affected_customer_count: 67,
      estimated_revenue_impact_daily: 42180,
      correlation_confidence: 0.94,
      started_at: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
      resolved_at: null,
      created_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      alerts: [
        {
          id: 'alert-1',
          incident_id: incidentId,
          source: 'sentry' as any,
          title: 'PaymentProcessor.process() raised TimeoutError',
          message: 'Stripe API call timed out after 5000ms. 47 instances in last 10 minutes.',
          severity: 'critical' as any,
          metadata: {},
          triggered_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
          acknowledged_at: new Date(Date.now() - 85 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 85 * 60 * 1000).toISOString(),
        }
      ],
      payment_failures: [],
      support_tickets: []
    };

    setIncident(mockInc);
    setRemediationActions([
      {
        id: 'action-1',
        incident_id: incidentId,
        action_type: 'rollback' as any,
        title: 'Roll back checkout-service to commit f9e8d7c',
        description: 'Immediately roll back checkout-service to the previous stable build (f9e8d7c). This will restore payment processing. Estimated recovery: 5–8 minutes. Use: kubectl rollout undo deployment/checkout-service -n production',
        status: 'in_progress' as any,
        assigned_to: 'sre-oncall@acme.com',
        priority_order: 1,
        completed_at: null,
        created_at: nowStr,
        updated_at: nowStr,
      },
      {
        id: 'action-2',
        incident_id: incidentId,
        action_type: 'notify_slack' as any,
        title: 'Post incident update to #incidents',
        description: 'Send P0 incident card to #incidents with current status, ETA, and impact.',
        status: 'completed' as any,
        assigned_to: 'comms-lead@acme.com',
        priority_order: 2,
        completed_at: nowStr,
        created_at: nowStr,
        updated_at: nowStr,
      }
    ]);
    setSimilarIncidents([
      {
        id: 'sim-1',
        title: 'Stripe API Webhook Signature Failure',
        similarity_score: 0.85,
        reasoning: 'Identified recurrence based on: same repository codebase (checkout-service), overlapping error keywords: timeout, stripe.'
      }
    ]);
  };

  // Timer counter hook
  useEffect(() => {
    if (!incident || incident.status === 'resolved' || incident.status === 'closed') {
      return;
    }

    const start = new Date(incident.started_at).getTime();

    const updateTimer = () => {
      const diff = Math.floor((Date.now() - start) / 1000);
      setElapsedSeconds(diff > 0 ? diff : 0);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [incident]);

  // Format timer values
  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  };

  // Call Briefing Endpoint
  const generateBriefing = async (role: 'cto' | 'board' | 'customer') => {
    try {
      setGeneratingBriefing(true);
      const res = await executiveApi.generateBriefing([incidentId], role);
      setBriefingContent(res);
    } catch (err: any) {
      console.error('Failed to generate briefing:', err);
      // Mock briefing payloads fallback
      if (role === 'cto') {
        setBriefingContent({
          technical_summary: "A critical payment processing degradation was detected following checkout-service deployment commit abc123f. HTTP 500 error rates spiked to 18.7%, exhausting the database connection pool due to Stripe API timeout lockups.",
          root_cause_analysis: "Commit abc123f introduced a Stripe API webhook signature verification bug, triggering payload parsing timeouts. Threads awaiting gateway responses accumulated, locking the PostgreSQL connection pool.",
          system_impact: {
            degraded_services: ["checkout-service (HTTP 500 spike)", "payment-processor (timeout rate > 15%)"],
            infrastructure_alerts: ["CheckoutService: HTTP 500 rate 340/min", "Stripe API response times > 5000ms"]
          },
          engineering_actions: [
            "IMMEDIATE: Roll back checkout-service to previous stable release commit f9e8d7c.",
            "IMMEDIATE: Flush database connection pool to drop hung payment processing threads.",
            "HIGH: Correct Stripe webhook payload signature check logic and stage hotfix.",
            "POST-MORTEM: Implement integration tests for Stripe payload handlers in CI pipeline."
          ]
        });
      } else if (role === 'board') {
        setBriefingContent({
          business_summary: "An active payment processing degradation is currently risking approximately $42,000 in daily transaction revenue. Contractual SLAs are currently breached for three Enterprise-tier customers, presenting penalty exposure.",
          financial_exposure: {
            daily_mrr_at_risk: "$42,000.00",
            sla_penalties_projected: "$15,000.00",
            churn_exposure_rate: "8.5%"
          },
          affected_accounts: [
            "Acme Corp - Enterprise Tier SLA breached",
            "Globex Ltd - Premium Tier payment declines"
          ],
          mitigation_steps: [
            "IMMEDIATE: CS directors alert Acme Corp and Globex account leads of payment routing slowness.",
            "IMMEDIATE: Trigger manual invoice override for billing renewals processing during this window.",
            "HIGH: Temporarily divert non-critical premium traffic to secondary payment gateways.",
            "LONG-TERM: Establish multi-processor routing redundancy in our customer billing contracts."
          ]
        });
      } else {
        setBriefingContent({
          headline: "Service Degradation: Checkout Payments Routing Delay",
          status_message: "We are currently experiencing payment routing delays that may cause transaction declines at checkout. Our engineering teams are actively resolving the issue, and we apologize for any inconvenience caused.",
          recommended_customer_actions: [
            "Please wait 10-15 minutes before retrying transaction checkouts.",
            "If your purchase is urgent, please contact your account manager for manual billing support."
          ],
          estimated_resolution: "under 15 minutes"
        });
      }
    } finally {
      setGeneratingBriefing(false);
    }
  };

  // Trigger briefing on tab switch
  useEffect(() => {
    if (incident) {
      generateBriefing(activeBriefingTab);
    }
  }, [activeBriefingTab, incidentId, !!incident]);

  // Handle Rollback / Remediation execution
  const triggerRemediation = async (action: RemediationAction) => {
    try {
      // 1. Update action status to completed
      await remediationApi.updateStatus(action.id, 'completed');

      // 2. If it's a rollback action, resolve the incident and clear daily revenue risk
      if (action.action_type === 'rollback') {
        await incidentsApi.updateStatus(incidentId, 'resolved');
        // Re-fetch incident
        const updatedInc = await incidentsApi.get(incidentId);
        setIncident(updatedInc);
      }

      // Re-fetch all remediation actions
      const updatedActions = await remediationApi.list(incidentId);
      setRemediationActions(updatedActions);

      // Re-fetch timeline
      const updatedTimeline = await incidentsApi.timeline(incidentId);
      setTimeline(updatedTimeline);
    } catch (err: any) {
      console.error('Failed to trigger remediation:', err);
      // Local state simulation if backend fails
      setRemediationActions(prev =>
        prev.map(a => (a.id === action.id ? { ...a, status: 'completed' as any, completed_at: new Date().toISOString() } : a))
      );
      if (action.action_type === 'rollback' && incident) {
        setIncident({
          ...incident,
          status: 'resolved' as any,
          estimated_revenue_impact_daily: 0,
          resolved_at: new Date().toISOString()
        });
      }
    }
  };

  const copyToClipboard = () => {
    if (!briefingContent) return;
    navigator.clipboard.writeText(JSON.stringify(briefingContent, null, 2));
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  if (loading && !incident) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center space-y-4">
          <Activity className="w-8 h-8 text-primary animate-pulse mx-auto" />
          <div className="text-text-muted text-sm">Synchronising War Room Feed...</div>
        </div>
      </div>
    );
  }

  if (error && !incident) {
    return (
      <div className="card p-6 max-w-xl mx-auto mt-12 border-danger/20 bg-danger-muted/10">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-danger flex-shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Failed to load incident</h3>
            <p className="text-xs text-text-muted mt-1">{error}</p>
            <button
              onClick={() => router.refresh()}
              className="btn-secondary mt-4"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isResolved = incident?.status === 'resolved' || incident?.status === 'closed';

  return (
    <div className="space-y-6">
      {/* Back button & header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/incidents"
            className="p-1.5 rounded hover:bg-surface-elevated text-text-muted hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-text-primary">{incident?.title}</h1>
              {incident?.severity === 'critical' ? (
                <span className="badge-critical">CRITICAL</span>
              ) : incident?.severity === 'high' ? (
                <span className="badge-high">HIGH</span>
              ) : (
                <span className="badge-medium">{incident?.severity}</span>
              )}
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Incident ID: <span className="font-mono text-2xs uppercase">{incident?.id}</span> · Source: <span className="capitalize">{incident?.source?.replace('_', ' ') || ''}</span>
            </p>
          </div>
        </div>

        {/* Live operational command indicator */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded bg-surface border border-surface-border flex items-center gap-2">
            <span className={cn('status-dot', isResolved ? 'bg-success' : 'bg-danger animate-pulse')} />
            <span className="text-xs font-semibold uppercase tracking-wider text-text-primary">
              {incident?.status}
            </span>
          </div>
          {!isResolved && (
            <div className="live-indicator px-2.5 py-1.5 rounded bg-success/10 border border-success/20 text-success text-xs font-semibold">
              LIVE feed active
            </div>
          )}
        </div>
      </div>

      {/* Grid: Risk Analytics & Timers */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Timer Card */}
        <div className="kpi-card bg-surface-elevated/40 border border-surface-border backdrop-blur-md">
          <span className="kpi-label">ELAPSED TIME</span>
          <div className="flex items-baseline gap-2">
            <div className="kpi-value text-primary font-mono tracking-wider">
              {isResolved ? 'RESOLVED' : formatTimer(elapsedSeconds)}
            </div>
          </div>
          <span className="text-2xs text-text-muted">
            Started: {incident ? new Date(incident.started_at).toLocaleTimeString() : ''}
          </span>
        </div>

        {/* SLA Status Card */}
        <div className="kpi-card bg-surface-elevated/40 border border-surface-border backdrop-blur-md">
          <span className="kpi-label">SLA EXPOSURE</span>
          <div className="flex items-baseline gap-1.5">
            <div className={cn("kpi-value", isResolved ? "text-success" : "text-danger")}>
              {isResolved ? 'SLA Cleared' : 'SLA Breached'}
            </div>
          </div>
          <span className="text-2xs text-text-muted">
            {isResolved ? 'Post-outage checks running' : '3 enterprise accounts breached'}
          </span>
        </div>

        {/* Revenue Leak Rate */}
        <div className="kpi-card bg-surface-elevated/40 border border-surface-border backdrop-blur-md">
          <span className="kpi-label">REVENUE AT RISK</span>
          <div className="flex items-baseline gap-1.5">
            <div className="kpi-value text-danger font-semibold">
              {formatRevenueDaily(incident?.estimated_revenue_impact_daily || 0)}
            </div>
            <span className="text-2xs text-text-muted">/day</span>
          </div>
          <span className="text-2xs text-text-muted">
            {isResolved ? 'Incident mitigated' : 'Compounding risk active'}
          </span>
        </div>

        {/* Impacted Clients */}
        <div className="kpi-card bg-surface-elevated/40 border border-surface-border backdrop-blur-md">
          <span className="kpi-label">AFFECTED CUSTOMERS</span>
          <div className="flex items-baseline gap-1.5">
            <div className="kpi-value font-semibold">
              {incident?.affected_customer_count}
            </div>
            <span className="text-xs text-text-muted">active</span>
          </div>
          <span className="text-2xs text-text-muted">
            {isResolved ? 'Recovering transaction flow' : 'Premium & Enterprise accounts'}
          </span>
        </div>
      </div>

      {/* Correlation Flow Graph — animated causal chain */}
      <CorrelationFlowGraph incident={incident} />

      {/* Section: Dynamic Correlation Pipeline Graph */}
      <div className="card p-6 bg-surface-elevated/10 relative overflow-hidden">
        <h2 className="text-sm font-semibold text-text-primary mb-6 flex items-center gap-2">
          <Zap className="w-4 h-4 text-warning" /> Incident Propagation & Correlation Topology
        </h2>

        {/* Layout container for SVG and items */}
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 md:gap-4 py-4 min-h-[140px]">
          {/* Background SVG pipeline lines */}
          <div className="absolute inset-0 hidden md:block pointer-events-none">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="gradient-line" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="33%" stopColor="#EF4444" />
                  <stop offset="66%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#EF4444" />
                </linearGradient>
              </defs>
              {/* Line 1 -> 2 */}
              <line
                x1="12.5%"
                y1="50%"
                x2="37.5%"
                y2="50%"
                stroke={isResolved ? '#10B981' : 'url(#gradient-line)'}
                strokeWidth="2.5"
                strokeDasharray="6,4"
                className="animate-[dash_10s_linear_infinite]"
              />
              {/* Line 2 -> 3 */}
              <line
                x1="37.5%"
                y1="50%"
                x2="62.5%"
                y2="50%"
                stroke={isResolved ? '#10B981' : '#EF4444'}
                strokeWidth="2.5"
                strokeDasharray="6,4"
              />
              {/* Line 3 -> 4 */}
              <line
                x1="62.5%"
                y1="50%"
                x2="87.5%"
                y2="50%"
                stroke={isResolved ? '#10B981' : '#F59E0B'}
                strokeWidth="2.5"
                strokeDasharray="6,4"
              />
            </svg>
          </div>

          {/* Node 1: Culprit Deployment */}
          <div className="w-full md:w-[22%] z-10 card p-3 bg-surface border-primary/30 relative flex flex-col justify-between min-h-[120px]">
            <div className="flex items-center justify-between">
              <span className="text-3xs uppercase font-bold text-primary tracking-wide">Root deployment</span>
              <span className="px-1.5 py-0.5 rounded-full text-3xs font-bold bg-primary-muted text-primary">DEP</span>
            </div>
            <div className="mt-2">
              <div className="text-xs font-bold text-text-primary line-clamp-1">
                {incident?.deployment?.repository || 'checkout-service'}
              </div>
              <div className="text-2xs text-text-muted mt-1 font-mono">
                commit: <span className="text-text-primary">{incident?.deployment?.commit_hash || 'abc123f'}</span>
              </div>
              <div className="text-3xs text-text-muted mt-1">
                deployed: {incident?.deployment ? new Date(incident.deployment.deployed_at).toLocaleTimeString() : ''}
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-surface-border text-3xs text-text-muted flex items-center justify-between">
              <span>Confidence:</span>
              <span className="font-bold text-success">
                {(incident?.correlation_confidence ? incident.correlation_confidence * 100 : 94).toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Node 2: Alerts Triggered */}
          <div className="w-full md:w-[22%] z-10 card p-3 bg-surface border-danger/30 relative flex flex-col justify-between min-h-[120px]">
            <div className="flex items-center justify-between">
              <span className="text-3xs uppercase font-bold text-danger tracking-wide">Sentry alerts</span>
              <span className="px-1.5 py-0.5 rounded-full text-3xs font-bold bg-danger-muted text-danger">47 TRIG</span>
            </div>
            <div className="mt-2">
              <div className="text-xs font-bold text-text-primary line-clamp-1">
                {incident?.alerts?.[0]?.title || 'PaymentProcessor.process() raised TimeoutError'}
              </div>
              <div className="text-3xs text-text-muted mt-1 line-clamp-2">
                {incident?.alerts?.[0]?.message || 'Stripe API call timed out after 5000ms. 47 instances.'}
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-surface-border text-3xs text-text-muted flex items-center justify-between">
              <span>Status:</span>
              <span className="font-bold text-danger">active alert</span>
            </div>
          </div>

          {/* Node 3: Stripe Payment Failures */}
          <div className="w-full md:w-[22%] z-10 card p-3 bg-surface border-warning/30 relative flex flex-col justify-between min-h-[120px]">
            <div className="flex items-center justify-between">
              <span className="text-3xs uppercase font-bold text-warning tracking-wide">Payment failures</span>
              <span className="px-1.5 py-0.5 rounded-full text-3xs font-bold bg-warning-muted text-warning">89 FAIL</span>
            </div>
            <div className="mt-2">
              <div className="text-xs font-bold text-text-primary">
                Stripe integration
              </div>
              <div className="text-2xs text-text-muted mt-1 font-mono">
                impact: <span className="text-danger font-semibold">$36,500 fail rate</span>
              </div>
              <div className="text-3xs text-text-muted mt-1">
                rate: 3.4 declines/min
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-surface-border text-3xs text-text-muted flex items-center justify-between">
              <span>Affected:</span>
              <span className="font-semibold text-text-primary">67 accounts</span>
            </div>
          </div>

          {/* Node 4: Support Tickets surge */}
          <div className="w-full md:w-[22%] z-10 card p-3 bg-surface border-danger/30 relative flex flex-col justify-between min-h-[120px]">
            <div className="flex items-center justify-between">
              <span className="text-3xs uppercase font-bold text-danger tracking-wide">Support queue</span>
              <span className="px-1.5 py-0.5 rounded-full text-3xs font-bold bg-danger-muted text-danger">67 TICKETS</span>
            </div>
            <div className="mt-2">
              <div className="text-xs font-bold text-text-primary">
                Zendesk tickets surge
              </div>
              <div className="text-3xs text-text-muted mt-1 line-clamp-2">
                "Payment failed", "cannot checkout", "declined"
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-surface-border text-3xs text-text-muted flex items-center justify-between">
              <span>SLA Breaches:</span>
              <span className="font-bold text-danger">3 enterprise</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main split view: Actions / Similarity (left) vs AI briefs (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Remediation actions & Similar Incidents */}
        <div className="space-y-6">
          {/* Remediation actions */}
          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Terminal className="w-4 h-4 text-primary" /> Incident Remediation Actions
            </h3>

            <div className="space-y-3">
              {remediationActions.map((action) => {
                const isCompleted = action.status === 'completed';
                const isInProgress = action.status === 'in_progress';
                return (
                  <div
                    key={action.id}
                    className={cn(
                      "p-4 rounded border flex flex-col md:flex-row items-start justify-between gap-4 transition-colors",
                      isCompleted
                        ? "bg-success/5 border-success/20"
                        : isInProgress
                        ? "bg-primary-muted border-primary/20 animate-pulse-slow"
                        : "bg-surface border-surface-border"
                    )}
                  >
                    <div className="space-y-1 max-w-[70%]">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-3xs font-bold",
                          action.action_type === 'rollback'
                            ? "bg-danger-muted text-danger"
                            : "bg-surface-elevated text-text-secondary"
                        )}>
                          {action.action_type.toUpperCase()}
                        </span>
                        <h4 className="text-xs font-bold text-text-primary leading-none">
                          {action.title}
                        </h4>
                      </div>
                      <p className="text-2xs text-text-muted leading-relaxed">
                        {action.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 mt-2 md:mt-0 flex-shrink-0">
                      {isCompleted ? (
                        <div className="flex items-center gap-1 text-success text-2xs font-semibold">
                          <CheckCircle className="w-3.5 h-3.5" /> Completed
                        </div>
                      ) : (
                        <button
                          id={`remediation-trigger-${action.id}`}
                          onClick={() => triggerRemediation(action)}
                          className={cn(
                            "px-2.5 py-1 rounded text-2xs font-semibold flex items-center gap-1.5 transition-all",
                            action.action_type === 'rollback'
                              ? "bg-danger text-white hover:bg-danger-hover"
                              : "btn-primary"
                          )}
                        >
                          <Play className="w-2.5 h-2.5 fill-current" /> Execute Action
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Similar incidents */}
          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-warning" /> Incident Memory — Historical Similarities
            </h3>

            <div className="space-y-3">
              {similarIncidents.map((sim) => (
                <div
                  key={sim.id}
                  className="p-3.5 rounded border border-surface-border bg-surface-elevated/20 hover:bg-surface-elevated/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-text-primary">{sim.title}</h4>
                    <span className="px-1.5 py-0.5 rounded text-3xs font-mono font-bold bg-success-muted text-success border border-success/20">
                      {((sim.similarity_score || 0) * 100).toFixed(0)}% MATCH
                    </span>
                  </div>
                  <p className="text-2xs text-text-muted mt-1 leading-normal">
                    {sim.reasoning}
                  </p>
                </div>
              ))}

              {similarIncidents.length === 0 && (
                <div className="py-6 text-center text-text-muted text-2xs">
                  No matching resolved incidents found in memory store.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: AI briefs hub */}
        <div className="card p-5 flex flex-col min-h-[480px]">
          <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" /> Live AI Briefing Hub
          </h3>

          {/* Role tabs */}
          <div className="flex items-center gap-1 p-1 rounded bg-surface border border-surface-border mb-4">
            <button
              onClick={() => setActiveBriefingTab('cto')}
              className={cn(
                "flex-1 py-1.5 rounded text-xs font-medium transition-colors",
                activeBriefingTab === 'cto'
                  ? "bg-primary-muted text-primary font-semibold"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              CTO Summary
            </button>
            <button
              onClick={() => setActiveBriefingTab('board')}
              className={cn(
                "flex-1 py-1.5 rounded text-xs font-medium transition-colors",
                activeBriefingTab === 'board'
                  ? "bg-primary-muted text-primary font-semibold"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              Board Briefing
            </button>
            <button
              onClick={() => setActiveBriefingTab('customer')}
              className={cn(
                "flex-1 py-1.5 rounded text-xs font-medium transition-colors",
                activeBriefingTab === 'customer'
                  ? "bg-primary-muted text-primary font-semibold"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              Customer Update
            </button>
          </div>

          {/* Content display area */}
          <div className="flex-1 bg-background-secondary border border-surface-border rounded-lg p-4 relative overflow-y-auto max-h-[360px]">
            {generatingBriefing ? (
              <div className="absolute inset-0 flex items-center justify-center bg-background-secondary/80 backdrop-blur-sm z-10">
                <div className="text-center space-y-2">
                  <RotateCcw className="w-5 h-5 text-primary animate-spin mx-auto" />
                  <span className="text-2xs text-text-muted font-medium">Generating briefing drafts...</span>
                </div>
              </div>
            ) : null}

            {briefingContent ? (
              <div className="space-y-4 text-xs">
                {activeBriefingTab === 'cto' && (
                  <>
                    <div>
                      <h4 className="font-bold text-text-primary mb-1 uppercase tracking-wide text-3xs text-primary">Technical Summary</h4>
                      <p className="text-text-secondary leading-relaxed">{briefingContent.technical_summary}</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-text-primary mb-1 uppercase tracking-wide text-3xs text-primary">Root Cause Analysis</h4>
                      <p className="text-text-secondary leading-relaxed">{briefingContent.root_cause_analysis}</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-text-primary mb-1 uppercase tracking-wide text-3xs text-primary">System Impact</h4>
                      <ul className="list-disc pl-4 space-y-1 text-text-secondary">
                        {briefingContent.system_impact?.degraded_services?.map((svc: string) => (
                          <li key={svc}>{svc}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-bold text-text-primary mb-1 uppercase tracking-wide text-3xs text-primary">Engineering Mitigation Items</h4>
                      <ul className="list-disc pl-4 space-y-1 text-text-secondary font-mono text-2xs">
                        {briefingContent.engineering_actions?.map((act: string) => (
                          <li key={act}>{act}</li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}

                {activeBriefingTab === 'board' && (
                  <>
                    <div>
                      <h4 className="font-bold text-text-primary mb-1 uppercase tracking-wide text-3xs text-primary">Business & Revenue Summary</h4>
                      <p className="text-text-secondary leading-relaxed">{briefingContent.business_summary}</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-text-primary mb-1 uppercase tracking-wide text-3xs text-primary">Financial Exposure</h4>
                      <div className="grid grid-cols-3 gap-2 mt-1">
                        <div className="p-2 rounded bg-surface border border-surface-border text-center">
                          <span className="block text-3xs text-text-muted">Daily risk</span>
                          <span className="text-xs font-bold text-danger">{briefingContent.financial_exposure?.daily_mrr_at_risk}</span>
                        </div>
                        <div className="p-2 rounded bg-surface border border-surface-border text-center">
                          <span className="block text-3xs text-text-muted">SLA penalties</span>
                          <span className="text-xs font-bold text-warning">{briefingContent.financial_exposure?.sla_penalties_projected}</span>
                        </div>
                        <div className="p-2 rounded bg-surface border border-surface-border text-center">
                          <span className="block text-3xs text-text-muted">Churn exposure</span>
                          <span className="text-xs font-bold text-text-primary">{briefingContent.financial_exposure?.churn_exposure_rate}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-text-primary mb-1 uppercase tracking-wide text-3xs text-primary">Affected Strategic Accounts</h4>
                      <ul className="list-disc pl-4 space-y-1 text-text-secondary">
                        {briefingContent.affected_accounts?.map((acc: string) => (
                          <li key={acc}>{acc}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-bold text-text-primary mb-1 uppercase tracking-wide text-3xs text-primary">Mitigation Action Path</h4>
                      <ul className="list-disc pl-4 space-y-1 text-text-secondary">
                        {briefingContent.mitigation_steps?.map((step: string) => (
                          <li key={step}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}

                {activeBriefingTab === 'customer' && (
                  <>
                    <div>
                      <h4 className="font-bold text-text-primary mb-1 uppercase tracking-wide text-3xs text-primary">Headline Alert</h4>
                      <p className="text-text-primary font-bold">{briefingContent.headline}</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-text-primary mb-1 uppercase tracking-wide text-3xs text-primary">Status Update Message</h4>
                      <p className="text-text-secondary leading-relaxed bg-surface/40 p-2.5 rounded border border-surface-border/50">{briefingContent.status_message}</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-text-primary mb-1 uppercase tracking-wide text-3xs text-primary">Recommended Customer Actions</h4>
                      <ul className="list-disc pl-4 space-y-1 text-text-secondary">
                        {briefingContent.recommended_customer_actions?.map((act: string) => (
                          <li key={act}>{act}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="pt-2 border-t border-surface-border text-3xs text-text-muted flex items-center justify-between">
                      <span>Target Resolution Time:</span>
                      <span className="font-bold text-success">{briefingContent.estimated_resolution}</span>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center min-h-[200px] text-text-muted text-xs">
                No briefing content loaded.
              </div>
            )}
          </div>

          {/* Bottom actions */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-surface-border">
            <button
              onClick={copyToClipboard}
              className="btn-secondary flex-1 py-1.5 flex items-center justify-center gap-2"
              disabled={!briefingContent}
            >
              {copiedText ? (
                <>
                  <Check className="w-3.5 h-3.5 text-success" /> Copied JSON
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy Briefing payload
                </>
              )}
            </button>
            <button
              onClick={() => generateBriefing(activeBriefingTab)}
              className="btn-secondary py-1.5 px-3"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
