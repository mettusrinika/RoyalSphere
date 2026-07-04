import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'OMIQORA',
    short_name: 'OMIQORA',
    description:
      'AI-powered services ecosystem for discovering, comparing, booking, and managing trusted services.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0A1F44',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
