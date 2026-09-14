import type { MetadataRoute } from 'next';

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
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
