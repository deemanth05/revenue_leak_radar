'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Play,
  RotateCcw,
  CheckCircle,
  ArrowRight,
  Zap,
  Shield,
  BarChart3,
  Database,
  Activity,
  Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const DEMO_STEPS = [
  {
    step: 1,
    title: 'Deploy & Detect',
    description:
      'A faulty deployment is pushed to production. Revenue Leak Radar detects anomalies within seconds.',
    href: '/simulations',
    cta: 'Trigger Simulation',
    icon: Play,
    color: 'text-danger',
    bgColor: 'bg-danger-muted/10',
    borderColor: 'border-danger/20',
  },
  {
    step: 2,
    title: 'Correlate Signals',
    description:
      'The Coral engine cross-references deployment logs, payment failures, support tickets, and error spikes.',
    href: '/coral',
    cta: 'View Correlation',
    icon: Database,
    color: 'text-primary',
    bgColor: 'bg-primary-muted/10',
    borderColor: 'border-primary/20',
  },
  {
    step: 3,
    title: 'Quantify Revenue Impact',
    description:
      'Real-time MRR risk calculation across affected enterprise accounts.',
    href: '/revenue-risk',
    cta: 'View Revenue Impact',
    icon: BarChart3,
    color: 'text-warning',
    bgColor: 'bg-warning-muted/10',
    borderColor: 'border-warning/20',
  },
  {
    step: 4,
    title: 'AI Executive Briefing',
    description:
      'Gemini-powered executive summary with root cause analysis and remediation recommendations.',
    href: '/executive-reports',
    cta: 'View AI Briefing',
    icon: Zap,
    color: 'text-primary',
    bgColor: 'bg-primary-muted/10',
    borderColor: 'border-primary/20',
  },
  {
    step: 5,
    title: 'Remediate & Resolve',
    description:
      'Automated workflow triggers rollback, notifications, and SLA protection measures.',
    href: '/incidents',
    cta: 'View Remediation',
    icon: Shield,
    color: 'text-success',
    bgColor: 'bg-success-muted/10',
    borderColor: 'border-success/20',
  },
];

const QUICK_LINKS = [
  {
    label: 'Operations Dashboard',
    href: '/dashboard',
    icon: Activity,
    color: 'text-primary',
  },
  {
    label: 'Timeline View',
    href: '/timeline',
    icon: BarChart3,
    color: 'text-warning',
  },
  {
    label: 'System Health',
    href: '/system-health',
    icon: Shield,
    color: 'text-success',
  },
  {
    label: 'Cinematic Demo',
    href: '/presentation',
    icon: Play,
    color: 'text-danger',
  },
];

export default function JudgeModePage() {
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const handleReset = async () => {
    setResetting(true);
    setResetDone(false);
    try {
      await fetch('http://localhost:8000/api/v1/simulations/reset', {
        method: 'POST',
      });
      setResetDone(true);
    } catch (err) {
      console.warn('Reset simulation failed:', err);
      setResetDone(true);
    } finally {
      setResetting(false);
      setTimeout(() => setResetDone(false), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cinematic Header */}
      <div className="relative overflow-hidden rounded-xl border border-surface-border bg-gradient-to-br from-background-secondary via-surface to-background-secondary p-8">
        {/* Background decorative glow */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-warning/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-warning-muted border border-warning/20">
              <Award className="w-5 h-5 text-warning" />
            </div>
            <span className="px-2 py-0.5 rounded text-3xs font-bold bg-warning-muted text-warning border border-warning/20 uppercase tracking-wider">
              Judge Evaluation
            </span>
          </div>

          <h1 className="text-2xl font-bold text-text-primary">
            Revenue Leak Radar — Judge Evaluation Console
          </h1>
          <p className="text-sm text-text-muted mt-2 max-w-2xl leading-relaxed">
            Interactive demonstration of real-time revenue impact detection and
            AI-powered incident correlation
          </p>

          <div className="flex items-center gap-3 mt-5">
            <Link
              href="/presentation"
              className="btn-primary py-2 px-4 flex items-center gap-2 text-xs font-bold"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Launch Cinematic Demo
            </Link>
            <button
              onClick={handleReset}
              disabled={resetting}
              className={cn(
                'py-2 px-4 rounded-lg border text-xs font-bold flex items-center gap-2 transition-all',
                resetting
                  ? 'border-surface-border text-text-muted opacity-50'
                  : resetDone
                  ? 'border-success/30 text-success bg-success-muted/10'
                  : 'border-surface-border text-text-secondary hover:text-text-primary hover:border-text-muted'
              )}
            >
              {resetting ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                  Resetting...
                </>
              ) : resetDone ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  Simulation Reset
                </>
              ) : (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Simulation
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Demo Scenario Steps */}
      <div>
        <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-warning" />
          Demo Scenario Steps
        </h2>

        <div className="space-y-3">
          {DEMO_STEPS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className={cn(
                  'card p-5 flex items-start gap-4 group transition-all hover:shadow-lg',
                  item.bgColor
                )}
              >
                {/* Step number indicator */}
                <div
                  className={cn(
                    'w-9 h-9 rounded-lg border flex items-center justify-center flex-shrink-0',
                    item.borderColor,
                    item.bgColor
                  )}
                >
                  <span
                    className={cn(
                      'text-sm font-bold font-mono',
                      item.color
                    )}
                  >
                    {item.step}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={cn('w-4 h-4', item.color)} />
                    <h3 className="text-sm font-bold text-text-primary">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* CTA Button */}
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex-shrink-0',
                    'bg-surface border border-surface-border text-text-secondary hover:text-text-primary hover:border-text-muted'
                  )}
                >
                  {item.cta}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Quick Links
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {QUICK_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="card p-5 flex items-center gap-3 group transition-all hover:shadow-lg hover:border-primary/30"
              >
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-surface border border-surface-border group-hover:border-primary/30 transition-all">
                  <Icon
                    className={cn(
                      'w-4 h-4 transition-colors',
                      link.color
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">
                    {link.label}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
