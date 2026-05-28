'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();

  // Minimal full-bleed layout for landing and presentation screens
  const isMinimalLayout = pathname === '/' || pathname === '/presentation' || pathname === '/landing';

  if (isMinimalLayout) {
    return (
      <main className="w-full min-h-screen bg-background overflow-y-auto">
        {children}
      </main>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Critical incident top indicator strip */}
      <div
        className="fixed top-0 left-0 right-0 z-50 h-[2px]"
        style={{
          background: 'linear-gradient(90deg, rgba(239,68,68,0) 0%, rgba(239,68,68,0.8) 30%, rgba(239,68,68,1) 50%, rgba(239,68,68,0.8) 70%, rgba(239,68,68,0) 100%)',
        }}
      />

      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-hidden" style={{ marginLeft: 'var(--sidebar-width)' }}>
        <Header />
        <main
          className="flex-1 overflow-y-auto bg-background"
          style={{ paddingTop: 'calc(var(--header-height) + 2px)' }}
        >
          <div className="p-6 max-w-[1600px] mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
