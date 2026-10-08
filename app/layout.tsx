import type { Metadata, Viewport } from 'next';
import './globals.css'; // Global styles

export const viewport: Viewport = {
  themeColor: '#0d0e11',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://pomofocus.live'),
  title: 'Pomofocus Live – Ad-Free Minimalist Pomodoro Timer',
  description:
    'Ultra-minimalist deep focus timer with digital clock view, intelligent session sequences, and background drift protection.',
  keywords: [
    'pomofocus',
    'pomofocus live',
    'ad-free pomodoro timer',
    'minimalist focus timer',
    'study timer',
    'online pomodoro clock',
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Pomofocus Live',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Pomofocus Live – Ad-Free Minimalist Pomodoro Timer',
    description:
      'Ultra-minimalist deep focus timer with digital clock view, intelligent session sequences, and background drift protection.',
    url: 'https://pomofocus.live',
    siteName: 'Pomofocus Live',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pomofocus Live – Ad-Free Minimalist Pomodoro Timer',
    description:
      'Ultra-minimalist deep focus timer with digital clock view, intelligent session sequences, and background drift protection.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}