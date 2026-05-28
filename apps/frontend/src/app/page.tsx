'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ShieldAlert,
  Zap,
  DollarSign,
  TrendingUp,
  Cpu,
  Database,
  Terminal,
  Activity,
  Layers,
  Sparkles,
  GitBranch,
  MessageSquare
} from 'lucide-react';

export default function ProductLandingPage() {
  return (
    <div className="min-h-screen bg-[#07090E] text-text-primary selection:bg-primary-muted selection:text-text-primary flex flex-col font-sans antialiased overflow-x-hidden">
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[800px] right-0 w-[600px] h-[600px] bg-danger/5 rounded-full blur-[160px] pointer-events-none" />

      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-6 h-20 flex items-center justify-between border-b border-surface-border/40 z-10">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded bg-danger/10 border border-danger/20">
            <Activity className="w-4 h-4 text-danger animate-pulse" />
          </div>
          <div>
            <div className="text-sm font-bold text-text-primary leading-none">Revenue Leak</div>
            <div className="text-2xs font-medium text-text-muted leading-none mt-0.5">Radar</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/presentation"
            className="px-3.5 py-1.5 rounded text-xs font-semibold text-success hover:bg-success/5 border border-success/20 transition-all"
          >
            Cinematic Demo
          </Link>
          <Link
            id="enter-console-btn"
            href="/dashboard"
            className="px-4 py-2 rounded bg-primary text-white hover:bg-primary-hover text-xs font-semibold flex items-center gap-1.5 transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30"
          >
            Enter Console <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="w-full max-w-5xl mx-auto px-6 pt-20 pb-16 text-center space-y-6 z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-2xs font-semibold uppercase tracking-wider animate-pulse">
          <Sparkles className="w-3 h-3" /> YC Hackathon Submission
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
          What technical issues are costing <br className="hidden md:inline" />
          your company the <span className="text-transparent bg-clip-text bg-gradient-to-r from-danger to-warning">most money</span> right now?
        </h1>

        <p className="text-base md:text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
          Stop triaging incidents by simple count or technical severity. Revenue Leak Radar maps real-time B2B SaaS billing telemetry onto SRE alerts to isolate actual daily MRR losses.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/10"
          >
            Launch Command Console <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/presentation"
            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-surface border border-surface-border text-text-secondary hover:text-text-primary hover:border-text-muted text-sm font-semibold flex items-center justify-center gap-2 transition-all"
          >
            Watch Cinematic Flow
          </Link>
        </div>
      </section>

      {/* Live Pipeline Mock Visualizer */}
      <section className="w-full max-w-6xl mx-auto px-6 py-8 z-10">
        <div className="card p-6 bg-surface-elevated/10 backdrop-blur-md border border-surface-border/40 relative overflow-hidden">
          {/* Top visual controls */}
          <div className="flex items-center justify-between border-b border-surface-border pb-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-danger animate-pulse" />
              <span className="text-xs font-mono font-bold text-text-primary uppercase tracking-wide">Live System Simulation Outage Feed</span>
            </div>
            <div className="flex items-center gap-2 text-2xs text-text-muted">
              <span>Host: production-gateway</span>
              <span>·</span>
              <span>Syncing telemetry</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Visual Node 1 */}
            <div className="p-4 rounded-lg bg-background-secondary border border-primary/20 space-y-2">
              <span className="text-3xs uppercase font-bold text-primary">Github deploy</span>
              <div className="text-sm font-bold text-white line-clamp-1">checkout-service</div>
              <div className="font-mono text-2xs text-text-muted">commit: abc123f</div>
              <div className="h-1 w-full bg-primary/20 rounded overflow-hidden mt-2">
                <div className="h-full bg-primary w-[90%]" />
              </div>
            </div>

            {/* Visual Node 2 */}
            <div className="p-4 rounded-lg bg-background-secondary border border-danger/20 space-y-2">
              <span className="text-3xs uppercase font-bold text-danger">sentry alert</span>
              <div className="text-sm font-bold text-white line-clamp-1">HTTP 500 error spike</div>
              <div className="font-mono text-2xs text-text-muted">declines: 47/min</div>
              <div className="h-1 w-full bg-danger/20 rounded overflow-hidden mt-2">
                <div className="h-full bg-danger w-full animate-pulse" />
              </div>
            </div>

            {/* Visual Node 3 */}
            <div className="p-4 rounded-lg bg-background-secondary border border-warning/20 space-y-2">
              <span className="text-3xs uppercase font-bold text-warning">stripe status</span>
              <div className="text-sm font-bold text-white line-clamp-1">Stripe Declines</div>
              <div className="font-mono text-2xs text-text-muted">failed intents: 89</div>
              <div className="h-1 w-full bg-warning/20 rounded overflow-hidden mt-2">
                <div className="h-full bg-warning w-[75%]" />
              </div>
            </div>

            {/* Visual Node 4 */}
            <div className="p-4 rounded-lg bg-background-secondary border border-danger/20 space-y-2">
              <span className="text-3xs uppercase font-bold text-danger">zendesk surge</span>
              <div className="text-sm font-bold text-white line-clamp-1">Support Queue</div>
              <div className="font-mono text-2xs text-text-muted">tickets: 67 urgent</div>
              <div className="h-1 w-full bg-danger/20 rounded overflow-hidden mt-2">
                <div className="h-full bg-danger w-[85%] animate-pulse" />
              </div>
            </div>
          </div>

          {/* Business Impact Aggregation Banner */}
          <div className="mt-6 p-4 rounded-lg bg-danger-muted/10 border border-danger/20 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-danger/10">
                <DollarSign className="w-5 h-5 text-danger" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white leading-tight">Total Correlated Revenue Risk Exposure</h4>
                <p className="text-2xs text-text-secondary mt-0.5">Calculated using tier-weighted customer MRR contracts and transaction declines</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-danger font-mono animate-pulse">$42,180.00 / day</div>
              <span className="text-3xs text-text-muted uppercase tracking-wider font-semibold">MTTR Clock: T+95 minutes</span>
            </div>
          </div>
        </div>
      </section>

      {/* Coral Architecture Showcase Layer */}
      <section className="w-full max-w-6xl mx-auto px-6 py-16 space-y-12 z-10 border-t border-surface-border/40">
        <div className="text-center max-w-xl mx-auto space-y-3">
          <h2 className="text-xs font-bold text-primary uppercase tracking-widest flex items-center justify-center gap-1.5">
            <Database className="w-4 h-4" /> Core Innovation Layer
          </h2>
          <h3 className="text-2xl md:text-3xl font-extrabold text-white">
            Built Deeply with Coral Data Store
          </h3>
          <p className="text-xs text-text-secondary">
            Coral serves as our unified correlation database. It resolves joint queries across four disparate systems in under 8ms.
          </p>
        </div>

        {/* Coral Graph / Topology diagram */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <h4 className="text-base font-bold text-white">Cross-Source Relational Joins</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Standard observability systems alert you when error rates spike. But they can't tell you *who* is complaining or *how much* money is declining.
            </p>
            <p className="text-xs text-text-secondary leading-relaxed">
              Our Coral indexer continuously captures GitHub commits, Stripe logs, Zendesk support requests, and Sentry triggers, connecting them dynamically via temporal windows and customer account IDs.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded border border-surface-border bg-surface/30">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-primary" /> Unified Schema
                </div>
                <p className="text-3xs text-text-muted mt-1 leading-normal">
                  All incidents, payment histories, and commits mapped in a relational schema.
                </p>
              </div>
              <div className="p-3.5 rounded border border-surface-border bg-surface/30">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-success" /> Instant RCA Query
                </div>
                <p className="text-3xs text-text-muted mt-1 leading-normal">
                  Traces the culprit codebase deploy responsible for payment timeout spikes.
                </p>
              </div>
            </div>
            <div className="pt-2">
              <Link
                href="/coral"
                className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1.5 transition-colors"
              >
                Inspect Coral Schema Index <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* SVG Schema connection visualizer */}
          <div className="card p-6 bg-surface-elevated/20 border-surface-border/50 relative flex items-center justify-center min-h-[300px]">
            <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
              <path d="M 60 70 L 190 145" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="3,3" />
              <path d="M 60 210 L 190 155" stroke="#10B981" strokeWidth="1.5" strokeDasharray="3,3" />
              <path d="M 320 150 L 450 70" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="3,3" />
              <path d="M 320 155 L 450 210" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="3,3" />
            </svg>

            <div className="relative w-full flex items-center justify-between px-2 gap-4">
              <div className="flex flex-col gap-10">
                <div className="card px-3 py-2 bg-surface border-primary/40 text-center w-28 text-3xs font-bold">
                  GitHub Deploy<br /><span className="text-text-muted">Repository / Commit</span>
                </div>
                <div className="card px-3 py-2 bg-surface border-success/40 text-center w-28 text-3xs font-bold">
                  Stripe Log<br /><span className="text-text-muted">Declined Payments</span>
                </div>
              </div>

              {/* Center join engine */}
              <div className="card p-4 bg-primary/10 border-primary text-center w-36 z-10 shadow-lg shadow-primary/10">
                <Database className="w-5 h-5 text-primary mx-auto mb-1" />
                <span className="text-2xs font-extrabold text-white">Coral Correlation Join</span>
                <p className="text-3xs text-text-muted mt-1">Queries finished in 8.4ms</p>
              </div>

              <div className="flex flex-col gap-10">
                <div className="card px-3 py-2 bg-surface border-danger/40 text-center w-28 text-3xs font-bold">
                  Sentry Triggers<br /><span className="text-text-muted">HTTP 500 Spike</span>
                </div>
                <div className="card px-3 py-2 bg-surface border-warning/40 text-center w-28 text-3xs font-bold">
                  Zendesk Queue<br /><span className="text-text-muted">Customer Complaints</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="w-full max-w-6xl mx-auto px-6 py-16 border-t border-surface-border/40 z-10 space-y-8">
        <h3 className="text-xl font-extrabold text-white text-center">Built for High-Scale SRE & Executive Incident Response</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="card p-5 space-y-3 bg-surface/30 hover:border-primary/30 transition-all">
            <div className="p-2 rounded bg-danger/10 w-9">
              <DollarSign className="w-5 h-5 text-danger" />
            </div>
            <h4 className="text-sm font-bold text-white">Deterministic Revenue Impact</h4>
            <p className="text-2xs text-text-secondary leading-relaxed">
              Tier-weighted formulas calculate daily revenue risks by cross-referencing customer subscription MRR contracts with declines, providing a fully auditable impact statement.
            </p>
          </div>

          {/* Card 2 */}
          <div className="card p-5 space-y-3 bg-surface/30 hover:border-primary/30 transition-all">
            <div className="p-2 rounded bg-warning/10 w-9">
              <MessageSquare className="w-5 h-5 text-warning" />
            </div>
            <h4 className="text-sm font-bold text-white">AI Stakeholder Briefings</h4>
            <p className="text-2xs text-text-secondary leading-relaxed">
              Generates customized briefings tailored to Board (financial), CTO (engineering), and Customer (public updates) personas, running on a rate-limiting safe prompt fallback pipeline.
            </p>
          </div>

          {/* Card 3 */}
          <div className="card p-5 space-y-3 bg-surface/30 hover:border-primary/30 transition-all">
            <div className="p-2 rounded bg-primary/10 w-9">
              <Cpu className="w-5 h-5 text-primary" />
            </div>
            <h4 className="text-sm font-bold text-white">Autonomous Remediation</h4>
            <p className="text-2xs text-text-secondary leading-relaxed">
              Identifies the culprit code deployment, auto-suggests immediate mitigations, and executes rollbacks, resolving active leaks and restoring service.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-surface-border/40 py-8 text-center text-2xs text-text-muted mt-auto z-10">
        <p>© 2026 Revenue Leak Radar. Built using FastAPI, Next.js, and Coral Data Engine.</p>
      </footer>
    </div>
  );
}
