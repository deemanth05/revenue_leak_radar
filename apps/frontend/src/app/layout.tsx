import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export const metadata: Metadata = {
  title: 'Revenue Leak Radar — Operational Intelligence Platform',
  description:
    'Real-time AI command center that identifies which technical incidents are causing the highest business damage.',
  keywords: ['incident management', 'revenue intelligence', 'operational monitoring', 'SRE'],
  openGraph: {
    title: 'Revenue Leak Radar',
    description: 'AI-powered revenue impact intelligence & autonomous incident response',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-background text-text-primary antialiased">
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
      </body>
    </html>
  );
}
