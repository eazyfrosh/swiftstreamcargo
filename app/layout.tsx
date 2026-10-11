import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { SITE } from '@/lib/site';
import { THEME_INIT_SCRIPT } from '@/lib/theme';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: 'Swiftstream Cargo | Freight, Warehousing & Supply Chain',
    template: '%s | Swiftstream Cargo',
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    'freight',
    'logistics',
    'freight transportation',
    'last-mile delivery',
    'warehousing',
    'freight forwarding',
    'supply chain',
    'shipment tracking',
  ],
  authors: [{ name: SITE.name }],
  creator: SITE.name,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE.url,
    siteName: SITE.name,
    title: 'Swiftstream Cargo | Freight, Warehousing & Supply Chain',
    description: SITE.description,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Swiftstream Cargo | Freight, Warehousing & Supply Chain',
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icon.svg' }],
  },
};

export const viewport: Viewport = {
  // Browser chrome follows the theme — a light-mode visitor got a near-black
  // address bar above a white page, which reads as a rendering fault.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
    { media: '(prefers-color-scheme: dark)', color: '#0E0F11' },
  ],
  width: 'device-width',
  initialScale: 1,
};

const ORGANIZATION_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE.name,
  url: SITE.url,
  slogan: SITE.tagline,
  description: SITE.description,
  email: SITE.email,
  telephone: SITE.phone,
  address: {
    '@type': 'PostalAddress',
    streetAddress: '210 Harbor Point Drive, Suite 900',
    addressLocality: 'Chicago',
    addressRegion: 'IL',
    postalCode: '60601',
    addressCountry: 'US',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // `suppressHydrationWarning` because the inline script below adds the
    // `dark` class to this element before React hydrates, which React would
    // otherwise report as a server/client mismatch.
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Applies the saved theme before first paint. Anything later — an
            effect, a layout — runs after the browser has already painted, and
            a dark-mode visitor would see a white flash on every navigation. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        {/* Scroll-reveal elements are server-rendered at opacity 0 and animated
            in by Framer Motion. Without JS they would stay invisible, so reveal
            everything up front instead. */}
        <noscript>
          <style>{`[style*="opacity:0"]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
      </head>
      <body className="min-h-screen bg-surface antialiased">
        {/* Public chrome lives in app/(site)/layout.tsx — the admin section is
            a sibling with its own shell, so neither inherits the other's. */}
        {children}
        <script
          type="application/ld+json"
          // Static, developer-authored structured data — no user input reaches this string.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_SCHEMA) }}
        />
      </body>
    </html>
  );
}
