// =============================================================================
// Revenue Leak Radar — Utility Functions
// =============================================================================

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format, parseISO } from 'date-fns';
import { IncidentSeverity, IncidentStatus, CustomerTier } from '@rlr/schemas';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Currency formatting ---

export function formatRevenue(value: number, compact = false): string {
  if (compact) {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}k`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatRevenueDaily(value: number): string {
  return `${formatRevenue(value, true)}/day`;
}

// --- Date formatting ---

export function formatRelativeTime(dateStr: string): string {
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'MMM d, HH:mm');
  } catch {
    return dateStr;
  }
}

export function formatDateTimeFull(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "MMM d, yyyy 'at' HH:mm:ss 'UTC'");
  } catch {
    return dateStr;
  }
}

// --- Severity helpers ---

export function getSeverityClass(severity: IncidentSeverity): string {
  switch (severity) {
    case IncidentSeverity.CRITICAL:
      return 'badge-critical';
    case IncidentSeverity.HIGH:
      return 'badge-high';
    case IncidentSeverity.MEDIUM:
      return 'badge-medium';
    case IncidentSeverity.LOW:
      return 'badge-low';
  }
}

export function getSeverityColor(severity: IncidentSeverity): string {
  switch (severity) {
    case IncidentSeverity.CRITICAL:
      return '#EF4444';
    case IncidentSeverity.HIGH:
      return '#F59E0B';
    case IncidentSeverity.MEDIUM:
      return '#2563EB';
    case IncidentSeverity.LOW:
      return '#475569';
  }
}

export function getStatusDotClass(status: IncidentStatus): string {
  switch (status) {
    case IncidentStatus.ACTIVE:
      return 'status-dot-active';
    case IncidentStatus.INVESTIGATING:
      return 'status-dot-investigating';
    case IncidentStatus.MITIGATING:
      return 'status-dot-investigating';
    case IncidentStatus.RESOLVED:
    case IncidentStatus.CLOSED:
      return 'status-dot-resolved';
  }
}

// --- Customer tier ---

export function getTierColor(tier: CustomerTier): string {
  switch (tier) {
    case CustomerTier.ENTERPRISE:
      return 'text-revenue';
    case CustomerTier.PREMIUM:
      return 'text-primary';
    case CustomerTier.STANDARD:
      return 'text-text-secondary';
    case CustomerTier.TRIAL:
      return 'text-text-muted';
  }
}

// --- Confidence score ---

export function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return '#EF4444'; // high confidence = red (concerning)
  if (confidence >= 0.6) return '#F59E0B';
  return '#2563EB';
}

export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

// --- Numbers ---

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

export function formatDuration(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  return `${Math.round(hours / 24)}d`;
}

// --- Truncation ---

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return `${str.slice(0, maxLen)}…`;
}

// --- Commit hash display ---

export function shortHash(hash: string): string {
  return hash.slice(0, 7);
}
