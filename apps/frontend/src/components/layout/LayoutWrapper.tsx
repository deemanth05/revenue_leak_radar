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
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-hidden" style={{ marginLeft: 'var(--sidebar-width)' }}>
        <Header />
        <main
          className="flex-1 overflow-y-auto bg-background p-6"
          style={{ paddingTop: 'calc(var(--header-height) + 24px)' }}
        >
          <div className="max-w-screen-2xl mx-auto animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
