import type { Metadata } from 'next';
import './globals.css';
import { LayoutWrapper } from '@/components/layout/LayoutWrapper';

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
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
