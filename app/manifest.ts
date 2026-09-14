import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Pomofocus',
    short_name: 'Pomofocus',
    description: 'Ultra-minimalist deep focus timer with digital clock view, intelligent session sequences, and background drift protection.',
    start_url: '/',
    scope: '/',
    display: 'browser',
    background_color: '#0d0e11',
    theme_color: '#0d0e11',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/pomofocus-logo.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  };
}
