'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  AlertTriangle,
  Award,
  BarChart3,
  Clock,
  FileText,
  Heart,
  Radio,
  Settings,
  Zap,
  Cpu,
  Database,
  Play as MonitorPlay,
  Siren,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3, id: 'nav-dashboard' },
  { href: '/incidents', label: 'Incidents', icon: AlertTriangle, id: 'nav-incidents', badge: 3, badgeCritical: true },
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
        <div className="ml-auto flex items-center gap-1.5">
          {/* Critical incident count badge */}
          <div
            className="flex items-center justify-center w-5 h-5 rounded-full bg-danger text-white text-2xs font-bold animate-pulse"
            title="3 active critical incidents"
          >
            3
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        <div className="section-header px-3 pb-2">Operations</div>
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
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
                    <span className={cn(
                      'flex items-center justify-center rounded-full text-2xs font-bold min-w-[18px] px-1 h-[18px]',
                      item.badgeCritical
                        ? 'bg-danger text-white animate-pulse'
                        : 'bg-surface-elevated text-text-secondary border border-surface-border'
                    )}>
                      {item.badge}
                    </span>
                  )}
                </Link>
                {/* War Room quick-launch for Incidents */}
                {item.href === '/incidents' && (
                  <Link
                    href="/incidents"
                    id="nav-war-room"
                    className="flex items-center gap-2 ml-7 mt-0.5 px-2 py-1 rounded text-2xs font-bold text-danger hover:bg-danger-muted transition-colors border border-danger/20 bg-danger-muted/30"
                  >
                    <Siren className="w-3 h-3" />
                    <span>WAR ROOM →</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>

        <div className="mt-4 section-header px-3 pb-2">AI Intelligence & Simulation</div>
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
          <li>
            <Link
              id="nav-coral"
              href="/coral"
              className={cn(pathname === '/coral' ? 'nav-item-active' : 'nav-item')}
            >
              <Database className="w-4 h-4 flex-shrink-0 text-coral" />
              <span className="flex-1 text-coral">Coral Indexer</span>
              <span className="tag-coral text-3xs px-1 py-0.5 rounded font-bold">AI</span>
            </Link>
          </li>
          <li>
            <Link
              id="nav-presentation"
              href="/presentation"
              className={cn(pathname === '/presentation' ? 'nav-item-active' : 'nav-item')}
            >
              <MonitorPlay className="w-4 h-4 flex-shrink-0 text-success" />
              <span className="flex-1">Cinematic Demo</span>
            </Link>
          </li>
        </ul>

        <div className="mt-4 section-header px-3 pb-2">Evaluation</div>
        <ul className="space-y-0.5">
          <li>
            <Link
              id="nav-judge"
              href="/judge"
              className={cn(pathname === '/judge' ? 'nav-item-active' : 'nav-item')}
            >
              <Award className="w-4 h-4 flex-shrink-0 text-warning" />
              <span className="flex-1">Judge Mode</span>
              <span className="px-1.5 py-0.5 rounded text-3xs font-bold bg-warning-muted text-warning border border-warning/20">DEMO</span>
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

        {/* Revenue at Risk quick metric */}
        <div className="mt-2 px-3 py-2 rounded bg-danger-muted/40 border border-danger/20">
          <div className="text-2xs text-text-muted">Revenue at Risk</div>
          <div className="text-sm font-bold text-danger tabular-nums mt-0.5">$54.2k/day</div>
        </div>

        {/* Environment + system health indicator */}
        <div className="mt-1 px-3 py-2 rounded bg-surface border border-surface-border">
          <div className="flex items-center justify-between">
            <div className="text-2xs text-text-muted">Environment</div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success" title="API healthy" />
              <span className="w-1.5 h-1.5 rounded-full bg-success" title="DB healthy" />
              <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" title="Engine processing" />
            </div>
          </div>
          <div className="text-xs font-medium text-success mt-0.5">● Development</div>
        </div>
      </div>
    </aside>
  );
}
