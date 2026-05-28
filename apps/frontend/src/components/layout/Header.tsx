'use client';

import { Bell, RefreshCw, Search, Shield } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function Header() {
  const [alertCount] = useState(3);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  };

  return (
    <header
      className="fixed top-0 right-0 z-30 flex items-center gap-4 px-6 bg-background-secondary/90 backdrop-blur border-b border-surface-border"
      style={{
        left: 'var(--sidebar-width)',
        height: 'var(--header-height)',
      }}
    >
      {/* Page context — updated via slot approach */}
      <div className="flex items-center gap-2 text-text-muted">
        <Shield className="w-3.5 h-3.5" />
        <span className="text-xs">Revenue Leak Radar</span>
        <span className="text-xs">/</span>
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-2 flex-1 max-w-sm bg-surface border border-surface-border rounded px-3 py-1.5 text-text-muted hover:border-border-accent transition-colors">
        <Search className="w-3.5 h-3.5 flex-shrink-0" />
        <input
          id="global-search"
          type="text"
          placeholder="Search incidents, deployments..."
          className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none min-w-0"
        />
        <kbd className="hidden sm:inline-flex items-center px-1.5 rounded border border-surface-border text-2xs text-text-muted font-mono">
          ⌘K
        </kbd>
      </div>

      <div className="flex-1" />

      {/* System status pill */}
      <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-danger-muted border border-danger/20 text-xs text-danger font-medium">
        <span className="status-dot-active" />
        3 Active Incidents
      </div>

      {/* Revenue at risk pill */}
      <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface border border-surface-border text-xs text-text-secondary">
        <span className="text-danger font-bold">$54.2k/day</span>
        <span>at risk</span>
      </div>

      {/* Refresh */}
      <button
        id="header-refresh"
        onClick={handleRefresh}
        className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
        title="Refresh data"
      >
        <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
      </button>

      {/* Notifications */}
      <button
        id="header-notifications"
        className="relative p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {alertCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-3.5 h-3.5 rounded-full text-2xs font-bold bg-danger text-white">
            {alertCount}
          </span>
        )}
      </button>
    </header>
  );
}
