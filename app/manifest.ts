import type { MetadataRoute } from 'next'
import { SYSTEM_STATS_FALLBACK } from '@/constants/system'
 
/**
 * PWA Manifest for ElektroSmart PRO v5.0
 * Optimized for Polish electrical contractors market
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: 'elektrosmart-pro',
    name: 'ElektroSmart PRO - Kosztorysy Elektryczne z AI',
    short_name: 'ElektroSmart',
    description: `Ekspertowy system kosztorysów elektrycznych. Konfigurator Rozdzielnic 120+ modułów DIN, Portal Klienta, 12 kalkulatorów, ${SYSTEM_STATS_FALLBACK.normsLabelPlus} norm KNR, VAT 8%/23%, ceny regionalne 16 województw. Silnik ES-Engine.`,
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
        description: `Przeglądaj ${SYSTEM_STATS_FALLBACK.normsLabelPlus} norm KNR`,
        url: '/dashboard/catalog',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
      },
      {
        name: 'Klienci',
        short_name: 'CRM',
        description: 'Zarządzaj bazą klientów',
        url: '/dashboard/clients',
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
