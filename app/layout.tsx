import type { Metadata, Viewport } from 'next';
import './globals.css'; // Global styles

export const viewport: Viewport = {
  themeColor: '#0d0e11',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'Pomofocus',
  description: 'Ultra-minimalist deep focus timer with digital clock view, intelligent session sequences, and background drift protection.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Pomofocus',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Pomofocus',
    description: 'Ultra-minimalist deep focus timer with digital clock view, intelligent session sequences, and background drift protection.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pomofocus',
    description: 'Ultra-minimalist deep focus timer with digital clock view, intelligent session sequences, and background drift protection.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
