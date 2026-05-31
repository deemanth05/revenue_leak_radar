'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Play,
  Pause,
  ArrowRight,
  Zap,
  Activity,
  AlertTriangle,
  DollarSign,
  MessageSquare,
  RefreshCw,
  Cpu,
  Layers,
  ArrowUpRight,
  ArrowLeft,
  CheckCircle2,
  Terminal,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { simulationsApi } from '@/lib/api';

interface DemoStep {
  number: number;
  title: string;
  subtitle: string;
  description: string;
  source: string;
  metric: string;
}

const DEMO_STEPS: DemoStep[] = [
  { number: 1, title: "Deployment Initiated", subtitle: "GitHub Deploy", description: " Sarah Chen deploys commit 'abc123f' to checkout-service (production environment).", source: "GitHub", metric: "Build Success" },
  { number: 2, title: "Sentry Exceptions Triggered", subtitle: "Error Spike", description: "HTTP 500 status rates spike. Stripe API call timeouts exceed 5000ms limit.", source: "Sentry", metric: "47 Alerts" },
  { number: 3, title: "Stripe Declined Transactions", subtitle: "Payment Failure", description: "Failed payment intents start compounding for Standard and Premium users.", source: "Stripe", metric: "89 Declines" },
  { number: 4, title: "Zendesk Complaint Surge", subtitle: "Support Tickets", description: "Customer complaints spike on Zendesk complaining about checkout decline screens.", source: "Zendesk", metric: "67 Tickets" },
  { number: 5, title: "Coral Database Joins Data", subtitle: "Correlation Engine", description: "Coral joins logs and mapping tables, identifying commit 'abc123f' as the culprit with 94% confidence.", source: "Coral", metric: "94% Match" },
  { number: 6, title: "Deterministic Revenue Risk", subtitle: "Business Scorer", description: "Risk calculated based on MRR contracts, projecting $42,180/day loss exposure.", source: "Scorer", metric: "$42,180/day" },
  { number: 7, title: "Executive P0 Slack Broadcast", subtitle: "Alert System", description: "Active critical alert broadcasted to #incidents channel with SRE call bridge.", source: "Slack", metric: "P0 Alert" },
  { number: 8, title: "AI CTO Summary Generated", subtitle: "Briefing Hub", description: "Briefing prompt formats root-cause analysis, listing latency risks and connection pool locks.", source: "Briefings", metric: "CTO Drafted" },
  { number: 9, title: "AI Board Briefing Drafted", subtitle: "Briefing Hub", description: "Briefing template aggregates commercial SLA penalty risks ($15,000) for account SREs.", source: "Briefings", metric: "Board Drafted" },
  { number: 10, title: "Incident War Room Activated", subtitle: "Operations Room", description: "Active War Room console maps live timeline feeds and connects SVG topological nodes.", source: "Radar", metric: "War Room Ready" },
  { number: 11, title: "Compounding Daily MRR Leak", subtitle: "Live Counter", description: "Telemetry telemetry monitors compounding daily risk. Uptime clocks tick down.", source: "Telemetry", metric: "Loss Running" },
  { number: 12, title: "Automated Rollback Recommended", subtitle: "Remediation", description: "Remediation workflows prompt SREs to execute stable deployment rollback.", source: "Remediation", metric: "Rollback Ready" }
];

export default function CinematicPresentationPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<1 | 2 | 5>(2); // Default 2x speed (1.5s per step)

  const [counterValue, setCounterValue] = useState(0);
  const [ticketCount, setTicketCount] = useState(0);
  const [declinesCount, setDeclinesCount] = useState(0);
  const [sentryCount, setSentryCount] = useState(0);

  // Auto-advance loop
  useEffect(() => {
    if (!isPlaying) return;

    if (currentStep >= DEMO_STEPS.length) {
      setIsPlaying(false);
      return;
    }

    const intervalTime = 3000 / speed;
    const timer = setTimeout(async () => {
      // Trigger corresponding simulation steps in the background database as we advance!
      // This is beautiful because it synchronizes the actual backend database state with our presentation!
      const targetStep = currentStep + 1;

      // Map presentation steps onto backend scenario steps:
      // Presentation Step 1 -> Scenario Step 1 (Deploy Code Change)
      // Presentation Step 2 -> Scenario Step 2 (HTTP 500 alerts)
      // Presentation Step 3 -> Scenario Step 3 (Stripe Payment failures)
      // Presentation Step 4 -> Scenario Step 4 (Customer support surge)
      // Presentation Step 5 -> Scenario Step 5 (Dynamic Revenue correlation)
      // Presentation Step 12 -> Scenario Step 6 (Trigger Rollback - but we leave this for judges to execute in the War Room!)
      if (targetStep <= 5) {
        try {
          await simulationsApi.triggerStep("checkout_failure", targetStep);
        } catch (e) {
          console.warn("Failed background trigger:", e);
        }
      }

      setCurrentStep(targetStep);
    }, intervalTime);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, speed]);

  // Update counters based on current step
  useEffect(() => {
    if (currentStep === 0) {
      setCounterValue(0);
      setTicketCount(0);
      setDeclinesCount(0);
      setSentryCount(0);
    } else if (currentStep === 1) {
      setCounterValue(0);
      setTicketCount(0);
      setDeclinesCount(0);
      setSentryCount(0);
    } else if (currentStep === 2) {
      setCounterValue(42180);
      setSentryCount(47);
      setTicketCount(0);
      setDeclinesCount(0);
    } else if (currentStep === 3) {
      setCounterValue(42180);
      setSentryCount(47);
      setDeclinesCount(89);
      setTicketCount(0);
    } else if (currentStep >= 4) {
      setCounterValue(42180);
      setSentryCount(47);
      setDeclinesCount(89);
      setTicketCount(67);
    }
  }, [currentStep]);

  const handleReset = async () => {
    setIsPlaying(false);
    setCurrentStep(0);
    try {
      await simulationsApi.reset();
    } catch (e) {
      console.warn("Reset error:", e);
    }
  };

  const handleManualStep = async (stepIndex: number) => {
    if (isPlaying) setIsPlaying(false);
    setCurrentStep(stepIndex);

    // Auto trigger backend simulation steps up to this step
    try {
      await simulationsApi.reset();
      const mappedScenarioStep = Math.min(stepIndex, 5);
      for (let i = 1; i <= mappedScenarioStep; i++) {
        await simulationsApi.triggerStep("checkout_failure", i);
      }
    } catch (e) {
      console.warn("Sim trigger failed:", e);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-text-primary selection:bg-primary-muted selection:text-text-primary flex flex-col font-sans antialiased overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Header bar */}
      <header className="w-full max-w-7xl mx-auto px-6 h-16 flex items-center justify-between border-b border-surface-border/40 z-10">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="p-1 rounded hover:bg-surface-elevated text-text-muted hover:text-text-primary transition-all mr-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center justify-center w-7 h-7 rounded bg-danger/10 border border-danger/20">
            <Activity className="w-3.5 h-3.5 text-danger animate-pulse" />
          </div>
          <span className="text-sm font-bold text-white">Revenue Leak Radar</span>
        </div>

        <div className="flex items-center gap-2 text-2xs uppercase tracking-widest text-text-muted font-bold">
          <span className="live-indicator">Cinematic Demo Board</span>
        </div>
      </header>

      {/* Main split grid */}
      <div className="flex-1 w-full max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">

        {/* Left Column: Flow timeline (Step tracker) */}
        <div className="lg:col-span-2 card p-5 flex flex-col justify-between overflow-hidden border-surface-border/60">
          <div className="space-y-4 overflow-hidden flex flex-col flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Demo Sequence Roadmap</h2>
                <p className="text-3xs text-text-muted mt-0.5">Observe the full cascade from deploy error to business resolution</p>
              </div>

              {/* Speed controls */}
              <div className="flex items-center gap-1 bg-surface p-0.5 rounded border border-surface-border">
                <span className="text-3xs text-text-muted px-1.5 font-bold uppercase">Speed:</span>
                {([1, 2, 5] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={cn(
                      "px-2 py-0.5 rounded text-3xs font-bold transition-all",
                      speed === s
                        ? "bg-primary-muted text-primary"
                        : "text-text-secondary hover:text-text-primary"
                    )}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            {/* Steps timeline list */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-2 max-h-[380px]">
              {DEMO_STEPS.map((step, idx) => {
                const isActive = currentStep === idx;
                const isPassed = currentStep > idx;
                return (
                  <button
                    key={step.number}
                    onClick={() => handleManualStep(idx)}
                    className={cn(
                      "w-full text-left p-2.5 rounded border transition-all flex items-start gap-3",
                      isActive
                        ? "bg-surface border-primary shadow-md shadow-primary/5"
                        : isPassed
                          ? "bg-success/5 border-success/15 opacity-60"
                          : "bg-surface/30 border-surface-border/40 opacity-40 hover:opacity-75"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-full border flex items-center justify-center text-3xs font-mono font-bold flex-shrink-0 mt-0.5",
                      isActive
                        ? "bg-primary border-primary text-white animate-pulse"
                        : isPassed
                          ? "bg-success border-success text-white"
                          : "bg-background-secondary border-surface-border text-text-muted"
                    )}>
                      {isPassed ? "✓" : step.number}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-xs font-bold text-text-primary line-clamp-1">{step.title}</span>
                        <span className="text-3xs text-text-muted uppercase font-mono">{step.source}</span>
                      </div>
                      <p className="text-3xs text-text-muted mt-0.5 line-clamp-1">{step.description}</p>
                    </div>

                    <span className={cn(
                      "px-1.5 py-0.5 rounded text-3xs font-mono font-bold flex-shrink-0 mt-0.5",
                      isPassed ? "bg-success-muted text-success" : isActive ? "bg-primary-muted text-primary" : "bg-surface border border-surface-border text-text-muted"
                    )}>
                      {step.metric}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Controls button row */}
          <div className="flex items-center gap-3 pt-4 border-t border-surface-border/50 mt-4">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={cn(
                "flex-1 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all",
                isPlaying
                  ? "bg-warning text-black hover:bg-warning-hover"
                  : "bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/10"
              )}
              disabled={currentStep >= DEMO_STEPS.length && !isPlaying}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" /> Pause Presentation
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" /> Start Presentation
                </>
              )}
            </button>
            <button
              onClick={handleReset}
              className="px-3.5 py-2.5 rounded-lg border border-surface-border hover:border-text-muted text-text-secondary hover:text-text-primary transition-all"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Column: Live telemetry preview & deep links */}
        <div className="lg:col-span-1 flex flex-col gap-6 overflow-hidden">

          {/* Telemetry counters */}
          <div className="card p-5 space-y-4 border-surface-border/60">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-warning" /> Simulated Incident Metrics
            </h3>

            <div className="space-y-3">
              {/* Daily Revenue Risk Counter */}
              <div className="p-3.5 rounded-lg bg-danger-muted/5 border border-danger/10 text-center">
                <span className="text-3xs text-text-muted uppercase font-bold tracking-wider">Revenue Risk Loss Counter</span>
                <div className="text-2xl font-bold text-danger font-mono mt-1">
                  ${counterValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <span className="text-3xs text-text-muted uppercase mt-0.5 block">daily MRR at risk run-rate</span>
              </div>

              {/* Grid counters */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded bg-surface border border-surface-border">
                  <div className="text-danger font-extrabold text-sm font-mono">{sentryCount}</div>
                  <span className="text-3xs text-text-muted font-bold block mt-0.5">Sentry alerts</span>
                </div>
                <div className="p-2 rounded bg-surface border border-surface-border">
                  <div className="text-warning font-extrabold text-sm font-mono">{declinesCount}</div>
                  <span className="text-3xs text-text-muted font-bold block mt-0.5">Stripe declines</span>
                </div>
                <div className="p-2 rounded bg-surface border border-surface-border">
                  <div className="text-danger font-extrabold text-sm font-mono">{ticketCount}</div>
                  <span className="text-3xs text-text-muted font-bold block mt-0.5">Zendesk tickets</span>
                </div>
              </div>
            </div>
          </div>

          {/* Deep link Action Box */}
          <div className="card p-5 space-y-4 border-surface-border/60 flex-1 flex flex-col justify-between">
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-success" /> Judge Live Action Mitigation
              </h3>
              <p className="text-2xs text-text-secondary leading-relaxed">
                As the simulation finishes, the correlation engine flags deployment commit <code className="font-mono bg-surface px-1 text-primary">abc123f</code> as the root cause of Stripe declination spikes.
              </p>
              <p className="text-2xs text-text-secondary leading-relaxed">
                To resolve the incident, the SRE team must execute a rollback from the Incident War Room.
              </p>
            </div>

            {/* Enter live war room button */}
            <div className="pt-4">
              <Link
                href="/incidents/e9b9a36d-6a87-40a2-b168-74a41beee348"
                className={cn(
                  "w-full py-3 rounded-lg text-white font-bold text-xs flex items-center justify-center gap-2 transition-all",
                  currentStep >= 10
                    ? "bg-success hover:bg-success-hover shadow-lg shadow-success/15 animate-bounce"
                    : "bg-surface border border-surface-border text-text-muted cursor-not-allowed"
                )}
                onClick={(e) => {
                  if (currentStep < 10) e.preventDefault();
                }}
              >
                Enter Active War Room <ArrowUpRight className="w-4 h-4" />
              </Link>
              <span className="text-3xs text-text-muted mt-2 text-center block uppercase">
                {currentStep >= 10 ? 'Ready to resolve outage' : 'Simulate up to step 10 to unlock'}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
