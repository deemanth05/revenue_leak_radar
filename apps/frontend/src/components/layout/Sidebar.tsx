'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Clock,
  FileText,
  Heart,
  Radio,
  Settings,
  Zap,
  Cpu,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: BarChart3, id: 'nav-dashboard' },
  { href: '/incidents', label: 'Incidents', icon: AlertTriangle, id: 'nav-incidents', badge: 3 },
  { href: '/revenue-risk', label: 'Revenue Risk', icon: Activity, id: 'nav-revenue' },
  { href: '/executive-reports', label: 'Executive Reports', icon: FileText, id: 'nav-executive' },
  { href: '/timeline', label: 'Timeline', icon: Clock, id: 'nav-timeline' },
  { href: '/system-health', label: 'System Health', icon: Heart, id: 'nav-health' },
];

const BOTTOM_ITEMS = [
  { href: '/settings', label: 'Settings', icon: Settings, id: 'nav-settings' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-background-secondary border-r border-surface-border"
      style={{ width: 'var(--sidebar-width)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-surface-border h-[var(--header-height)]">
        <div className="flex items-center justify-center w-7 h-7 rounded bg-danger/10 border border-danger/20">
          <Radio className="w-4 h-4 text-danger" />
        </div>
        <div>
          <div className="text-sm font-bold text-text-primary leading-none">Revenue Leak</div>
          <div className="text-2xs font-medium text-text-muted leading-none mt-0.5">Radar</div>
        </div>
        <div className="ml-auto">
          <span className="live-indicator text-2xs">LIVE</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        <div className="text-2xs font-semibold uppercase tracking-widest text-text-muted px-3 pb-2">
          Operations
        </div>
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  id={item.id}
                  href={item.href}
                  className={cn(isActive ? 'nav-item-active' : 'nav-item')}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="flex items-center justify-center w-4.5 h-4.5 rounded-full text-2xs font-bold bg-danger text-white min-w-[18px] px-1">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 text-2xs font-semibold uppercase tracking-widest text-text-muted px-3 pb-2">
          AI Intelligence & Simulation
        </div>
        <ul className="space-y-0.5">
          <li>
            <Link
              id="nav-correlation"
              href="/correlation"
              className={cn(pathname === '/correlation' ? 'nav-item-active' : 'nav-item')}
            >
              <Zap className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">Correlation Engine</span>
            </Link>
          </li>
          <li>
            <Link
              id="nav-simulations"
              href="/simulations"
              className={cn(pathname === '/simulations' ? 'nav-item-active' : 'nav-item')}
            >
              <Cpu className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">Simulation Control</span>
            </Link>
          </li>
        </ul>
      </nav>

      {/* Bottom section */}
      <div className="px-3 py-3 border-t border-surface-border space-y-0.5">
        {BOTTOM_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              id={item.id}
              href={item.href}
              className="nav-item"
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Environment indicator */}
        <div className="mt-2 px-3 py-2 rounded bg-surface border border-surface-border">
          <div className="text-2xs text-text-muted">Environment</div>
          <div className="text-xs font-medium text-success">● Development</div>
        </div>
      </div>
    </aside>
  );
}
