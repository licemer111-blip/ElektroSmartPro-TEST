// ElektroSmart PRO - Service Worker
// PWA Offline Support + Push Notifications + Auto-Update

// ⚡ IMPORTANT: This version string is updated on each deploy via build process.
// When a new SW is installed, it clears all old caches automatically.
const CACHE_VERSION = '1776014837439';
const CACHE_NAME = `elektrosmart-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline';

// Assets to cache on install — shell pages + icons for offline mode
const CACHE_URLS = [
  '/offline',
  '/dashboard',
  '/dashboard/projects',
  '/dashboard/catalog',
  '/dashboard/tools',
  '/dashboard/clients',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png',
];

// Install event - cache essential resources + activate immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CACHE_URLS).catch(() => {
        // cache addAll error ignored — offline fallback still works
      });
    }).then(() => {
      // Force immediate activation (don't wait for old tabs to close)
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up ALL old caches + take control immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    }).then(() => {
      // Notify all clients that a new version is active
      return self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SW_UPDATED', version: CACHE_VERSION });
        });
      });
    })
  );
});

// Message handler for manual cache clearing
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_ALL_CACHES') {
    event.waitUntil(
      caches.keys().then((names) => Promise.all(names.map((n) => caches.delete(n))))
    );
  }
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch event - NETWORK FIRST for everything except static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (POST = server actions, never intercept)
  if (request.method !== 'GET') return;

  // Skip non-http(s) requests
  if (!url.protocol.startsWith('http')) return;

  // Skip Supabase API calls (always network, never cache)
  if (url.hostname.includes('supabase.co')) return;

  // Skip version check endpoint (never cache)
  if (url.pathname.startsWith('/api/system/version')) return;

  // Skip RSC (React Server Component) requests — these contain action refs that change per build
  if (request.headers.get('RSC') === '1' || url.searchParams.has('_rsc')) return;

  // ====== NETWORK FIRST for HTML navigation requests ======
  // This ensures users always get the latest pages
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Don't cache error responses
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          // Offline - try cache, then offline page
          return caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL));
        })
    );
    return;
  }

  // ====== NETWORK FIRST for API and data requests ======
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/data/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // ====== STALE-WHILE-REVALIDATE for static assets (_next/static, images, fonts) ======
  // Serve from cache immediately, but update cache in background
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.match(/\.(js|css|woff2?|ttf|eot|png|jpg|jpeg|gif|webp|avif|svg|ico)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        }).catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }

  // ====== Default: NETWORK FIRST for everything else ======
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          if (request.mode === 'navigate') return caches.match(OFFLINE_URL);
          return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        });
      })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'ElektroSmart PRO';
  const options = {
    body: data.body || 'Masz nowe powiadomienie',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    tag: data.tag || 'notification',
    data: data.url || '/',
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [
      { action: 'open', title: 'Otwórz' },
      { action: 'close', title: 'Zamknij' },
    ],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'close') return;

  const urlToOpen = event.notification.data || '/dashboard';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(urlToOpen);
    })
  );
});
