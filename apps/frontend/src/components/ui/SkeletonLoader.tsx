'use client';

import { cn } from '@/lib/utils';

/* ---- Skeleton Card -------------------------------------------------------- */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('card p-4 flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between">
        <div className="skeleton h-2.5 w-24 rounded" />
        <div className="skeleton h-5 w-5 rounded" />
      </div>
      <div className="skeleton h-8 w-32 rounded" />
      <div className="skeleton h-2 w-16 rounded" />
    </div>
  );
}

/* ---- Skeleton Table ------------------------------------------------------- */
export function SkeletonTable({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-surface-border">
        <div className="skeleton h-3 w-40 rounded" />
      </div>
      <table className="data-table">
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i}>
                <div className="skeleton h-2 w-16 rounded" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c}>
                  <div
                    className="skeleton h-3 rounded"
                    style={{ width: `${50 + Math.random() * 40}%` }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---- Skeleton Timeline ---------------------------------------------------- */
export function SkeletonTimeline({ items = 4 }: { items?: number }) {
  return (
    <div className="card p-6 space-y-6">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="skeleton w-11 h-11 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="skeleton h-3 w-3/4 rounded" />
            <div className="skeleton h-2.5 w-1/2 rounded" />
            <div className="flex gap-2 mt-2">
              <div className="skeleton h-5 w-16 rounded" />
              <div className="skeleton h-5 w-20 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---- Skeleton Text -------------------------------------------------------- */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton h-3 rounded"
          style={{ width: i === lines - 1 ? '60%' : `${80 + Math.random() * 20}%` }}
        />
      ))}
    </div>
  );
}

/* ---- Skeleton KPI Row ----------------------------------------------------- */
export function SkeletonKpiRow({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
