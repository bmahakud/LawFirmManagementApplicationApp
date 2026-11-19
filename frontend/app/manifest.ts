import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AntLegal - Modern Law Firm Management Suite',
    short_name: 'AntLegal',
    description: 'The complete AI-powered operating system for modern law firms. Case management, OCR document drafting, hearing tracking, and billing.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0e2340',
    theme_color: '#0e2340',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}

