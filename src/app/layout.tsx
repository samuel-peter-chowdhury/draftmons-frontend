import '@/app/globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono' });

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
  themeColor: '#000000',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={cn('dark', inter.variable, spaceGrotesk.variable, jetbrainsMono.variable)}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
