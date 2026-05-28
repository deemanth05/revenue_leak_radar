'use client';

import { Bell, RefreshCw, Search, Shield, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const PAGE_LABELS: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/incidents': 'Incidents',
  '/revenue-risk': 'Revenue Risk',
  '/executive-reports': 'Executive Reports',
  '/timeline': 'Timeline',
  '/system-health': 'System Health',
  '/correlation': 'Correlation Engine',
  '/simulations': 'Simulation Control',
  '/coral': 'Coral Indexer',
  '/presentation': 'Cinematic Demo',
  '/judge': 'Judge Mode',
  '/settings': 'Settings',
};

function getPageLabel(pathname: string): string {
  // Exact match first
  if (PAGE_LABELS[pathname]) return PAGE_LABELS[pathname];
  // Prefix match (e.g. /incidents/abc123)
  for (const key of Object.keys(PAGE_LABELS)) {
    if (pathname.startsWith(key + '/')) return PAGE_LABELS[key];
  }
  return 'Dashboard';
}

export function Header() {
  const [alertCount] = useState(3);
  const [refreshing, setRefreshing] = useState(false);
  const [utcTime, setUtcTime] = useState('');
  const pathname = usePathname();

  useEffect(() => {
    function tick() {
      const now = new Date();
      const hh = String(now.getUTCHours()).padStart(2, '0');
      const mm = String(now.getUTCMinutes()).padStart(2, '0');
      const ss = String(now.getUTCSeconds()).padStart(2, '0');
      setUtcTime(`${hh}:${mm}:${ss} UTC`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  };

  const pageLabel = getPageLabel(pathname);

  return (
    <header
      className="fixed top-0 right-0 z-30 flex flex-col bg-background-secondary/95 backdrop-blur border-b border-surface-border"
      style={{
        left: 'var(--sidebar-width)',
      }}
    >
      {/* Main header row */}
      <div
        className="flex items-center gap-4 px-6"
        style={{ height: 'var(--header-height)' }}
      >
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <Shield className="w-3.5 h-3.5 text-text-muted" />
          <span className="breadcrumb-sep">/</span>
          <span className="text-xs text-text-primary font-medium">{pageLabel}</span>
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

        {/* SLA risk indicator */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-warning-muted border border-warning/20 text-xs text-warning font-medium">
          <Clock className="w-3 h-3" />
          <span>3h 42m to SLA breach</span>
        </div>

        {/* System status pill */}
        <div
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-danger-muted border border-danger/30 text-xs text-danger font-medium"
          style={{ boxShadow: '0 0 8px rgba(239,68,68,0.2)' }}
        >
          <span className="status-dot-active" />
          3 Active Incidents
        </div>

        {/* Revenue at risk pill */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface border border-surface-border text-xs text-text-secondary">
          <span className="text-danger font-bold tabular-nums">$54.2k</span>
          <span>/day at risk</span>
        </div>

        {/* UTC Clock */}
        <div className="hidden lg:flex items-center gap-1 text-xs font-mono text-text-muted tabular-nums" title="UTC Time">
          <Clock className="w-3 h-3" />
          <span>{utcTime}</span>
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
      </div>
    </header>
  );
}
