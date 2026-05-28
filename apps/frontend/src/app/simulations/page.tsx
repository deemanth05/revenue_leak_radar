"use client";

import React, { useEffect, useState, startTransition } from 'react';
import { Play, RotateCcw, AlertOctagon, Activity, Radio, Terminal, Server, RefreshCw, Cpu } from 'lucide-react';
import { simulationsApi, timelineApi } from '@/lib/api';

interface Scenario {
  id: string;
  name: string;
  description: string;
  stepsCount: number;
  steps: {
    number: number;
    title: string;
    description: string;
  }[];
}

const SCENARIOS: Scenario[] = [
  {
    id: "checkout_failure",
    name: "Checkout Deployment Failure (Primary Flow)",
    description: "Code deploy triggers Stripe webhook signature failure leading to checkout payment timeout spikes, support complaints, and automated rollback recommendations.",
    stepsCount: 6,
    steps: [
      { number: 1, title: "Deploy Code Change", description: " Sarah Chen deploys commit 'abc123f' to checkout-service in production." },
      { number: 2, title: "HTTP 500 Error Alerts", description: "Sentry alerts trigger showing elevated 500 status rates in checkout-service." },
      { number: 3, title: "Stripe Payment Failures", description: "Failed payment intents start spiking in Stripe logs for standard and premium clients." },
      { number: 4, title: "Customer Support Surges", description: "Zendesk and Intercom tickets spike from enterprise/premium users complaining about declined checkout transactions." },
      { number: 5, title: "Dynamic Revenue Correlation", description: "The correlation engine aggregates signals, identifies commit 'abc123f' as the culprit, and updates revenue risk to $42k/day." },
      { number: 6, title: "Trigger Automated Rollback", description: "The rollback remediation step is marked complete, reverting the deployment status and resolving the incident." },
    ]
  },
  {
    id: "auth_outage",
    name: "Auth Latency / Timeout Outage",
    description: "DB connection pool lockup in auth-service blocks user logins, triggering alerts, tickets, and automated replication scale-ups.",
    stepsCount: 3,
    steps: [
      { number: 1, title: "Auth latency alert", description: "Datadog triggers warning: Auth service p99 latency > 8500ms." },
      { number: 2, title: "Login support complaints", description: "Standard users open tickets complaining about timeouts on dashboard login page." },
      { number: 3, title: "Auto-scale replica pool", description: "Kubernetes autoscaler kicks in to scale replicas, restoring auth speed and resolving login issues." },
    ]
  },
  {
    id: "gateway_degradation",
    name: "Stripe Payment Gateway Degradation",
    description: "External Stripe connectivity is degraded, causing transaction drops and alerting Slack/Jira systems without a local code change culprit.",
    stepsCount: 2,
    steps: [
      { number: 1, title: "Stripe connection degrade alert", description: "Grafana detects 45% drop in transaction processing rate and Stripe webhook failures." },
      { number: 2, title: "Webhook payment timeouts", description: "Stripe payments fail due to network timeouts; incident created and alerts sent to slack/jira." },
    ]
  },
  {
    id: "enterprise_sla_violation",
    name: "Enterprise SLA Performance Alert",
    description: "Latency degrade on dedicated enterprise cluster risks financial SLA breach payouts, escalating priority to Critical.",
    stepsCount: 2,
    steps: [
      { number: 1, title: "Enterprise latency alert", description: "Datadog SLA monitors report response times crossing 500ms warning threshold on dedicated clusters." },
      { number: 2, title: "Enterprise support escalation", description: "A multi-million dollar ARR Enterprise account logs an urgent high-latency complaint, triggering high-severity business escalation rules." },
    ]
  },
  {
    id: "silent_churn_leak",
    name: "Silent subscription renewal failures",
    description: "Billing card renewals fail silently over hours without firing backend error logs, creating silent MRR leak risk.",
    stepsCount: 2,
    steps: [
      { number: 1, title: "Silent card declines", description: "Stripe subscription batch processor registers card declines for premium/standard customers without technical exceptions." },
      { number: 2, title: "Billing support tickets", description: "Customers alert support about billing accounts being marked invalid, exposing churn risk." },
    ]
  },
  {
    id: "latency_spike",
    name: "Checkout Performance Latency Spike",
    description: "Slow checkout page response speeds degrade conversion and trigger warnings before total outage occurs.",
    stepsCount: 2,
    steps: [
      { number: 1, title: "Checkout response delay alert", description: "p95 checkout response times exceed 3000ms threshold in checkout-service metrics." },
      { number: 2, title: "Support complains of slowness", description: "Checkout page load latency causes shoppers to open tickets, creating high priority alert." },
    ]
  }
];

export default function SimulationsPage() {
  const [states, setStates] = useState<Record<string, number>>({});
  const [events, setEvents] = useState<any[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("checkout_failure");
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStates = async () => {
    try {
      const res = await simulationsApi.getStates();
      setStates(res);
    } catch (err) {
      console.error("Failed to load simulation states", err);
    }
  };

  const fetchTimeline = async () => {
    try {
      const res = await timelineApi.global(15);
      setEvents(res);
    } catch (err) {
      console.error("Failed to load timeline events", err);
    }
  };

  useEffect(() => {
    fetchStates();
    fetchTimeline();

    // Poll timeline every 3 seconds to keep logs scrolling live
    const interval = setInterval(() => {
      fetchTimeline();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleTriggerStep = async (scenarioId: string, stepNum: number) => {
    setActionLoading(true);
    try {
      await simulationsApi.triggerStep(scenarioId, stepNum);
      await fetchStates();
      await fetchTimeline();
    } catch (err) {
      alert("Error: " + (err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReset = async () => {
    setActionLoading(true);
    try {
      await simulationsApi.reset();
      await fetchStates();
      await fetchTimeline();
    } catch (err) {
      alert("Error: " + (err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleForceRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchStates(), fetchTimeline()]);
    setRefreshing(false);
  };

  const selectedScenario = SCENARIOS.find(s => s.id === selectedScenarioId)!;
  const currentStep = states[selectedScenarioId] || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Cpu className="w-6 h-6 text-primary" />
            Simulation Control Panel
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Orchestrate realistic synthetic outage scenarios and observe real-time business telemetry correlation.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleForceRefresh}
            className="btn btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3"
            disabled={refreshing}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Feed
          </button>
          <button
            onClick={handleReset}
            className="btn bg-danger/10 text-danger border-danger/20 hover:bg-danger/20 flex items-center gap-1.5 text-xs py-1.5 px-3"
            disabled={actionLoading}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset All Scenarios
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: scenario selector */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-primary" />
            Outage Scenarios
          </h2>
          <div className="space-y-2">
            {SCENARIOS.map((sc) => {
              const activeStep = states[sc.id] || 0;
              const isCompleted = activeStep === sc.stepsCount;
              return (
                <button
                  key={sc.id}
                  onClick={() => startTransition(() => setSelectedScenarioId(sc.id))}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    selectedScenarioId === sc.id
                      ? 'bg-surface border-primary'
                      : 'bg-surface/40 border-surface-border hover:border-text-muted'
                  }`}
                >
                  <div className="text-xs font-bold text-text-primary">{sc.name}</div>
                  <p className="text-3xs text-text-muted line-clamp-2 mt-1">{sc.description}</p>
                  
                  <div className="flex items-center justify-between mt-3">
                    {/* Progress indicator */}
                    <div className="flex items-center gap-1 text-3xs text-text-secondary">
                      <span className="font-semibold text-primary">{activeStep}</span>
                      <span>/</span>
                      <span>{sc.stepsCount} steps triggered</span>
                    </div>

                    {isCompleted ? (
                      <span className="text-3xs font-bold text-success bg-success-muted px-1.5 py-0.5 rounded border border-success/20">
                        COMPLETED
                      </span>
                    ) : activeStep > 0 ? (
                      <span className="text-3xs font-bold text-warning bg-warning-muted px-1.5 py-0.5 rounded border border-warning/20">
                        IN PROGRESS
                      </span>
                    ) : (
                      <span className="text-3xs font-bold text-text-muted bg-surface border border-surface-border px-1.5 py-0.5 rounded">
                        IDLE
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Middle column: selected scenario controls */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-text-primary">{selectedScenario.name}</h2>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">{selectedScenario.description}</p>
            </div>

            {/* Stepper progress */}
            <div className="relative border-l border-surface-border ml-2 pl-4 py-1 space-y-4">
              {selectedScenario.steps.map((step) => {
                const isActive = currentStep + 1 === step.number;
                const isPassed = currentStep >= step.number;
                return (
                  <div key={step.number} className="relative">
                    {/* Node indicator dot */}
                    <div className={`absolute -left-[25px] top-1.5 w-4 h-4 rounded-full border flex items-center justify-center text-3xs font-bold transition-all ${
                      isPassed ? 'bg-success border-success text-white' :
                      isActive ? 'bg-primary border-primary text-white animate-pulse' :
                      'bg-surface border-surface-border text-text-muted'
                    }`}>
                      {step.number}
                    </div>

                    <div className={`${isPassed ? 'opacity-60' : isActive ? 'opacity-100 font-semibold' : 'opacity-40'}`}>
                      <div className="text-xs font-bold text-text-primary flex items-center gap-2">
                        {step.title}
                        {isActive && (
                          <span className="text-3xs text-primary bg-primary-muted border border-primary/20 rounded px-1.5 py-0.5 animate-pulse">
                            READY TO TRIGGER
                          </span>
                        )}
                      </div>
                      <p className="text-2xs text-text-muted mt-0.5">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Trigger Button */}
            {currentStep < selectedScenario.stepsCount ? (
              <button
                onClick={() => handleTriggerStep(selectedScenario.id, currentStep + 1)}
                className="btn btn-primary w-full flex items-center justify-center gap-2 py-2"
                disabled={actionLoading}
              >
                <Play className="w-4 h-4" />
                Trigger Step {currentStep + 1}: {selectedScenario.steps[currentStep].title}
              </button>
            ) : (
              <div className="text-center py-3 bg-success-muted text-success border border-success/20 rounded-lg text-xs font-semibold">
                Scenario fully executed! Review timeline dashboard to inspect the correlated incident.
              </div>
            )}
          </div>

          {/* Real-time Ingestion Stream */}
          <div className="card p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h2 className="text-xs font-bold text-text-primary flex items-center gap-2 uppercase tracking-wider">
                <Radio className="w-4 h-4 text-danger animate-pulse" />
                Live Ingestion Stream
              </h2>
              <span className="text-3xs font-mono text-text-muted">polling every 3s</span>
            </div>

            <div className="overflow-hidden bg-black/30 rounded border border-surface-border font-mono text-3xs text-text-secondary h-[250px] flex flex-col">
              <div className="flex items-center justify-between bg-black/60 px-3 py-1.5 text-text-muted border-b border-surface-border">
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-3 h-3" />
                  RAW INBOUND LOGS
                </span>
                <span>severity</span>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2 select-all">
                {events.length === 0 ? (
                  <div className="text-center py-12 text-text-muted">
                    SYSTEM IDLE — Ingest an event step above to see raw telemetry logs.
                  </div>
                ) : (
                  events.map((e, index) => (
                    <div key={index} className="flex items-start justify-between gap-4 py-1 hover:bg-white/5 px-1 rounded transition-colors">
                      <div className="flex-1 min-w-0">
                        <span className="text-primary font-bold">[{e.source_system}]</span>
                        <span className="text-text-muted font-light ml-1.5">{new Date(e.timestamp).toLocaleTimeString()}</span>
                        <span className="text-text-primary font-medium ml-2">Type: {e.event_type}</span>
                        <span className="text-text-secondary ml-1.5">• Service: {e.service}</span>
                        <span className="text-text-muted block mt-0.5 pl-3">Context: {JSON.stringify(e.correlation_metadata || e.business_context)}</span>
                      </div>
                      <span className={`text-3xs font-bold uppercase ${
                        e.severity === 'critical' ? 'text-danger' :
                        e.severity === 'high' ? 'text-warning' :
                        e.severity === 'medium' ? 'text-blue-400' : 'text-text-muted'
                      }`}>
                        {e.severity}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
