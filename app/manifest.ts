import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Estacionando',
    short_name: 'Estacionando',
    description:
      'Encuentra, publica y reserva estacionamientos de forma simple y segura.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#111b28',
    theme_color: '#111b28',
    lang: 'es-CL',
    icons: [
      {
        src: '/pwa-icon-192',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa-icon-192',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/pwa-icon-512',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa-icon-512',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}