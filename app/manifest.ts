import type { MetadataRoute } from 'next'
/**
 * PWA Manifest for ElektroSmart PRO v5.0
 * Optimized for Polish electrical contractors market
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: 'elektrosmart-pro',
    name: 'ElektroSmart PRO - Kosztorysy Elektryczne z AI',
    short_name: 'ElektroSmart',
    description: "Kosztorys elektryczny: robocizna i materiał osobno, norma ES, 16 województw, VAT 8%/23%, PDF.",
    start_url: '/dashboard/',
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui'],
    orientation: 'portrait-primary',
    background_color: '#ffffff',
    theme_color: '#3b82f6',
    categories: ['business', 'productivity', 'utilities', 'finance'],
    lang: 'pl',
    dir: 'ltr',
    icons: [
      { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512x512.png',  sizes: '512x512',  type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/icon-512x512.png',  sizes: '512x512',  type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      {
        name: 'Nowy Projekt',
        short_name: 'Nowy',
        description: 'Utwórz nowy kosztorys elektryczny',
        url: '/dashboard/projects?action=new',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
      },
      {
        name: 'Szybka Wycena',
        short_name: 'Wycena',
        description: 'Kosztorys wstępny w 60 sekund',
        url: '/dashboard/projects/quick-estimate',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
      },
      {
        name: 'Katalog',
        short_name: 'Katalog',
        description: "Pozycje: materiał i robocizna osobno",
        url: '/dashboard/catalog',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
      },
      {
        name: 'Kalkulatory',
        short_name: 'Narzędzia',
        description: 'Przekrój kabla, spadek napięcia, zabezpieczenia',
        url: '/dashboard/tools',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
      },
      {
        name: 'Kalkulatory',
        short_name: 'Kalk',
        description: '12 kalkulatorów inżynierskich',
        url: '/dashboard/tools',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
      },
    ],
    related_applications: [],
    prefer_related_applications: false,
  }
}
