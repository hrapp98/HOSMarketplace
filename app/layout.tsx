import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import "./globals.css";
import { ErrorBoundary } from '@/lib/error-boundary';
import { ErrorFallback } from '@/components/error-fallback';
import { ClientErrorProvider } from '@/components/client-error-provider';
import { AnalyticsProvider } from '@/components/analytics/analytics-provider';

export const metadata: Metadata = {
  title: "HireOverseas - Find Top Remote Talent Worldwide",
  description: "Connect with exceptional overseas talent for full-time remote positions. Build your dream team with pre-vetted professionals at competitive rates.",
  keywords: "remote work, overseas talent, hiring, freelancers, remote jobs, global talent",
  authors: [{ name: "HireOverseas" }],
  creator: "HireOverseas",
  publisher: "HireOverseas",
  robots: "index, follow",
  openGraph: {
    title: "HireOverseas - Find Top Remote Talent Worldwide",
    description: "Connect with exceptional overseas talent for full-time remote positions. Build your dream team with pre-vetted professionals at competitive rates.",
    url: "https://hireoverseas.com",
    siteName: "HireOverseas",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HireOverseas - Find Top Remote Talent Worldwide",
    description: "Connect with exceptional overseas talent for full-time remote positions.",
    creator: "@hireoverseas",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SessionProvider>
          <ClientErrorProvider>
            <AnalyticsProvider>
              <ErrorBoundary fallback={<ErrorFallback />}>
                {children}
              </ErrorBoundary>
            </AnalyticsProvider>
          </ClientErrorProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
