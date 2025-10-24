import '@/app/globals.css';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Draftmons',
    template: '%s | Draftmons',
  },
  description: 'Draftmons - Your Pokemon Draft League Management Platform',
  keywords: ['pokemon', 'draft league', 'draftmons', 'pokemon league', 'draft'],
  authors: [{ name: 'Draftmons Team' }],
  creator: 'Draftmons',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://draftmons.com',
    title: 'Draftmons',
    description: 'Draftmons - Your Pokemon Draft League Management Platform',
    siteName: 'Draftmons',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Draftmons',
    description: 'Draftmons - Your Pokemon Draft League Management Platform',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
