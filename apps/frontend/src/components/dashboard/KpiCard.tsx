'use client';

import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  id: string;
  label: string;
  value: string;
  subValue?: string;
  trend?: {
    direction: 'up' | 'down' | 'flat';
    label: string;
    isGoodWhenUp?: boolean; // if false, "up" is bad (e.g. more incidents = bad)
  };
  accent?: 'danger' | 'warning' | 'success' | 'primary' | 'revenue';
  icon?: React.ReactNode;
}

const ACCENT_STYLES: Record<NonNullable<KpiCardProps['accent']>, string> = {
  danger: 'border-t-2 border-t-danger',
  warning: 'border-t-2 border-t-warning',
  success: 'border-t-2 border-t-success',
  primary: 'border-t-2 border-t-primary',
  revenue: 'border-t-2 border-t-revenue',
};

export function KpiCard({ id, label, value, subValue, trend, accent, icon }: KpiCardProps) {
  const trendColor = () => {
    if (!trend) return '';
    const isGood = trend.isGoodWhenUp ?? true;
    if (trend.direction === 'up') return isGood ? 'text-success' : 'text-danger';
    if (trend.direction === 'down') return isGood ? 'text-danger' : 'text-success';
    return 'text-text-muted';
  };

  const TrendIcon = trend?.direction === 'up'
    ? TrendingUp
    : trend?.direction === 'down'
    ? TrendingDown
    : Minus;

  return (
    <div
      id={id}
      className={cn('kpi-card', accent && ACCENT_STYLES[accent])}
    >
      <div className="flex items-start justify-between">
        <span className="kpi-label">{label}</span>
        {icon && (
          <span className="text-text-muted opacity-60">{icon}</span>
        )}
      </div>

      <div>
        <div className="kpi-value">{value}</div>
        {subValue && (
          <div className="text-xs text-text-muted mt-0.5">{subValue}</div>
        )}
      </div>

      {trend && (
        <div className={cn('flex items-center gap-1 text-xs font-medium', trendColor())}>
          <TrendIcon className="w-3 h-3" />
          <span>{trend.label}</span>
        </div>
      )}
    </div>
  );
}
