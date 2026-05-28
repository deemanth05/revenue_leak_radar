'use client';

import React, { useState } from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type AlertVariant = 'critical' | 'warning' | 'info' | 'success';

interface AlertBannerProps {
  variant?: AlertVariant;
  title: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  className?: string;
}

const VARIANT_CONFIG: Record<AlertVariant, {
  containerClass: string;
  iconClass: string;
  icon: React.ElementType;
  titleClass: string;
}> = {
  critical: {
    containerClass: 'alert-banner-critical',
    iconClass: 'text-danger',
    icon: AlertTriangle,
    titleClass: 'text-danger',
  },
  warning: {
    containerClass: 'alert-banner-warning',
    iconClass: 'text-warning',
    icon: AlertCircle,
    titleClass: 'text-warning',
  },
  info: {
    containerClass: 'alert-banner-info',
    iconClass: 'text-primary',
    icon: Info,
    titleClass: 'text-primary',
  },
  success: {
    containerClass: 'flex items-center gap-3 px-4 py-3 rounded-lg border bg-success-muted/60 border-success/40',
    iconClass: 'text-success',
    icon: CheckCircle,
    titleClass: 'text-success',
  },
};

export function AlertBanner({
  variant = 'warning',
  title,
  message,
  action,
  dismissible = false,
  className,
}: AlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;

  return (
    <div className={cn(config.containerClass, className)}>
      <Icon className={cn('w-4 h-4 flex-shrink-0', config.iconClass)} />
      <div className="flex-1 min-w-0">
        <div className={cn('text-sm font-semibold', config.titleClass)}>{title}</div>
        {message && (
          <div className="text-xs text-text-secondary mt-0.5 leading-relaxed">{message}</div>
        )}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="btn-secondary text-xs py-1 px-2.5 flex-shrink-0"
        >
          {action.label}
        </button>
      )}
      {dismissible && (
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors flex-shrink-0"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
