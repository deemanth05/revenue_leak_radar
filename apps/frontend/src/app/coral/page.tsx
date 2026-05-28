'use client';

import React, { useState } from 'react';
import {
  Database,
  Search,
  Play,
  CheckCircle,
  Terminal,
  Activity,
  GitBranch,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Code
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CoralShowcasePage() {
  const [runningQuery, setRunningQuery] = useState(false);
  const [queryLog, setQueryLog] = useState<string[]>([]);
  const [queryDone, setQueryDone] = useState(false);

  const runCoralJoinQuery = () => {
    setRunningQuery(true);
    setQueryDone(false);
    setQueryLog([]);

    const logSteps = [
      "Initializing Coral connection...",
      "SELECT * FROM deployments WHERE environment = 'production' AND status = 'success' ORDER BY deployed_at DESC LIMIT 5",
      "Found culprit candidate: Commit 'abc123f' deployed to 'checkout-service' 95m ago.",
      "JOIN stripe_payment_failures ON stripe_payment_failures.failed_at BETWEEN deployments.deployed_at AND deployments.deployed_at + 1h",
      "Matched 89 Stripe billing declines targeting 'standard' and 'premium' account IDs.",
      "JOIN sentry_error_logs ON sentry_error_logs.service = deployments.repository AND sentry_error_logs.triggered_at >= deployments.deployed_at",
      "Matched 47 occurrences of Sentry Exception: 'PaymentProcessor.process() raised TimeoutError'.",
      "JOIN zendesk_support_tickets ON zendesk_support_tickets.customer_id = stripe_payment_failures.customer_id AND zendesk_support_tickets.subject LIKE '%payment%'",
      "Matched 67 support queue tickets expressing purchase transaction failures.",
      "Performing temporal alignment on shared window (T+5m to T+60m)...",
      "Coral joint correlation confidence calculated: 94%",
      "Aggregating daily MRR risk and mapping SLA impact on 3 enterprise accounts...",
      "Incident created, indexed and broadcasted to Revenue Leak Radar in 8.42ms!"
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < logSteps.length) {
        setQueryLog(prev => [...prev, logSteps[currentStep]]);
        currentStep++;
      } else {
        clearInterval(interval);
        setRunningQuery(false);
        setQueryDone(true);
      }
    }, 400);
  };

  const schemaJson = `{
  "incident_id": "e9b9a36d-6a87-40a2-b168-74a41beee348",
  "title": "Checkout Service Payment Failure — Deployment abc123f",
  "started_at": "2026-05-28T07:05:48.000Z",
  "correlation_confidence": 0.94,
  "estimated_revenue_impact_daily": 42180.00,
  "affected_customer_count": 67,
  "coral_indexes": {
    "culprit_deployment": {
      "commit_hash": "abc123f",
      "repository": "checkout-service",
      "branch": "main",
      "deployed_at": "2026-05-28T07:05:48.000Z"
    },
    "matched_infrastructure_alerts": [
      {
        "source": "sentry",
        "title": "PaymentProcessor.process() raised TimeoutError",
        "count": 47,
        "first_triggered": "2026-05-28T07:10:48.000Z"
      }
    ],
    "matched_payment_failures": {
      "gateway": "stripe",
      "failed_intents_count": 89,
      "failed_amount_total": 36500.00,
      "reasons": ["processing_error", "timeout"]
    },
    "matched_support_tickets": {
      "source": "zendesk",
      "ticket_count": 67,
      "urgent_priority_count": 27
    }
  }
}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Database className="w-6 h-6 text-primary animate-pulse" />
          Coral Indexer & Log Correlation Hub
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Deep-source queries, joint indexes, and unified schema mappings performed across SRE events and billing records.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Coral Join Execution Console */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Terminal className="w-4 h-4 text-primary" /> Coral Relational Join Query Engine
            </h3>
            <button
              onClick={runCoralJoinQuery}
              className={cn(
                "btn-primary py-1.5 px-3 flex items-center gap-2 text-xs",
                runningQuery ? "opacity-50 pointer-events-none" : ""
              )}
            >
              {runningQuery ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Querying...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" /> Run Joint Query
                </>
              )}
            </button>
          </div>

          <div className="bg-black/40 border border-surface-border rounded-lg p-4 font-mono text-xs h-[360px] overflow-y-auto space-y-2 flex flex-col justify-end">
            {queryLog.length === 0 ? (
              <div className="text-center py-24 text-text-muted text-xs flex flex-col items-center justify-center gap-3">
                <Database className="w-8 h-8 opacity-40 animate-pulse text-primary" />
                <span>Ready to execute joint correlation query in Coral indexer...</span>
              </div>
            ) : (
              <div className="space-y-1.5 flex-1 overflow-y-auto">
                {queryLog.map((log, index) => {
                  const isSelect = log.startsWith("SELECT") || log.startsWith("JOIN");
                  const isSuccess = log.includes("successfully") || log.includes("Incident created");
                  return (
                    <div
                      key={index}
                      className={cn(
                        "leading-relaxed",
                        isSelect
                          ? "text-primary font-bold"
                          : isSuccess
                          ? "text-success font-semibold"
                          : "text-text-secondary"
                      )}
                    >
                      <span className="text-text-muted select-none mr-2 font-light">{`[${index + 1}]`}</span>
                      {log}
                    </div>
                  );
                })}
                {runningQuery && (
                  <div className="text-primary animate-pulse text-xs mt-1">● executing Coral join engine...</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Unified Correlated Incident Schema */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Code className="w-4 h-4 text-warning" /> Coral Unified Incident Schema JSON
            </h3>
            <span className="px-1.5 py-0.5 rounded text-3xs font-mono font-semibold bg-warning-muted text-warning border border-warning/20">
              CONTRACT DTO
            </span>
          </div>

          <div className="bg-black/40 border border-surface-border rounded-lg p-4 font-mono text-2xs h-[360px] overflow-y-auto overflow-x-hidden text-text-secondary leading-relaxed">
            <pre className="whitespace-pre-wrap">{schemaJson}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
