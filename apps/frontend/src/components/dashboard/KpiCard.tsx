'use client';

import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  id: string;
  label: string;
  value: string;
  subValue?: string;
  sublabel?: string;
  trend?: {
    direction: 'up' | 'down' | 'flat';
    label: string;
    isGoodWhenUp?: boolean; // if false, "up" is bad (e.g. more incidents = bad)
  };
  accent?: 'danger' | 'warning' | 'success' | 'primary' | 'revenue';
  icon?: React.ReactNode;
  glow?: boolean;
}

const ACCENT_STYLES: Record<NonNullable<KpiCardProps['accent']>, string> = {
  danger: 'border-t-2 border-t-danger',
  warning: 'border-t-2 border-t-warning',
  success: 'border-t-2 border-t-success',
  primary: 'border-t-2 border-t-primary',
  revenue: 'border-t-2 border-t-revenue',
};

const ACCENT_VALUE_COLOR: Record<NonNullable<KpiCardProps['accent']>, string> = {
  danger: 'text-danger',
  warning: 'text-warning',
  success: 'text-success',
  primary: 'text-primary',
  revenue: 'text-revenue',
};

const ACCENT_GLOW: Record<NonNullable<KpiCardProps['accent']>, string> = {
  danger: '0 0 20px rgba(239,68,68,0.12)',
  warning: '0 0 20px rgba(245,158,11,0.12)',
  success: '0 0 20px rgba(16,185,129,0.12)',
  primary: '0 0 20px rgba(37,99,235,0.12)',
  revenue: '0 0 20px rgba(139,92,246,0.12)',
};

export function KpiCard({ id, label, value, subValue, sublabel, trend, accent, icon, glow }: KpiCardProps) {
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

  const valueColor = accent ? ACCENT_VALUE_COLOR[accent] : 'text-text-primary';
  const glowStyle = glow && accent ? { boxShadow: ACCENT_GLOW[accent] } : {};

  return (
    <div
      id={id}
      className={cn('kpi-card group', accent && ACCENT_STYLES[accent])}
      style={glowStyle}
    >
      <div className="flex items-start justify-between">
        <span className="kpi-label">{label}</span>
        {icon && (
          <span className={cn(
            'opacity-40 group-hover:opacity-70 transition-opacity',
            accent && ACCENT_VALUE_COLOR[accent]
          )}>
            {icon}
          </span>
        )}
      </div>

      <div>
        <div className={cn('kpi-value animate-count-up', valueColor)}>{value}</div>
        {subValue && (
          <div className="text-xs text-text-muted mt-0.5 tabular-nums">{subValue}</div>
        )}
        {sublabel && (
          <div className="text-2xs text-text-secondary mt-0.5 font-medium">{sublabel}</div>
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
