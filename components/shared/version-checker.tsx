'use client';

import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { RefreshCcw } from 'lucide-react';

const CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes

/**
 * VersionChecker — detects new deployments and shows a reload prompt.
 *
 * How it works:
 * 1. NEXT_PUBLIC_APP_VERSION is baked into the JS bundle at build time.
 * 2. /api/system/version returns the current server version (no-cache).
 * 3. When versions differ → show persistent toast with manual reload button.
 *
 * Does NOT auto-reload to avoid infinite loops.
 */
export function VersionChecker() {
  const hasNotified = useRef(false);

  /** Wipe SW caches + unregister SW, then hard-reload */
  const hardReload = useCallback(async () => {
    try {
      // 1. Tell SW to clear all caches
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        reg.active?.postMessage({ type: 'CLEAR_ALL_CACHES' });
      }

      // 2. Clear caches from the window context too
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.map((n) => caches.delete(n)));
      }

      // 3. Unregister all service workers so next load gets fresh SW
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((r) => r.unregister()));
      }
    } catch (e) {
      console.error('[VersionChecker] Cache cleanup error:', e);
    }

    // 4. Hard reload — navigate to clean URL
    window.location.reload();
  }, []);

  useEffect(() => {
    // ─── Instant catch for stale Server Actions ────────────────────────────────
    // When a new deployment happens, all Server Action hashes change.
    // Users with old tabs get "Failed to find Server Action" immediately on
    // their next interaction — long before the 5-min polling fires.
    // We catch it here and show the reload toast right away.
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const msg: string =
        (event?.reason as Error)?.message ??
        String(event?.reason ?? '');
      if (
        msg.includes('Failed to find Server Action') ||
        msg.includes('Server Action') && msg.includes('not found')
      ) {
        if (hasNotified.current) return;
        hasNotified.current = true;
        toast('Nowa wersja aplikacji', {
          description: 'Strona wymaga odświeżenia — proszę załadować ponownie.',
          action: {
            label: 'Odśwież teraz',
            onClick: () => hardReload(),
          },
          duration: Infinity,
          icon: <RefreshCcw className="h-4 w-4" />,
        });
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // ─── Polling version check ─────────────────────────────────────────────────
    const currentVersion = process.env.NEXT_PUBLIC_APP_VERSION;

    // Skip if we just reloaded (prevent loops)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('_v')) {
      // Remove _v param silently so it doesn't stick around
      urlParams.delete('_v');
      const cleanUrl = urlParams.toString()
        ? `${window.location.pathname}?${urlParams.toString()}`
        : window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
      return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    }

    const checkVersion = async () => {
      try {
        const res = await fetch(`/api/system/version?t=${Date.now()}`, {
          cache: 'no-store',
        });
        if (!res.ok) return;

        const data = await res.json();
        const serverVersion = data.version;

        if (!serverVersion || !currentVersion) return;
        if (serverVersion === currentVersion) return;

        // Version mismatch — new deploy detected
        if (hasNotified.current) return;
        hasNotified.current = true;

        toast('Dostępna nowa wersja aplikacji', {
          description: 'Kliknij aby załadować najnowsze zmiany.',
          action: {
            label: 'Odśwież teraz',
            onClick: () => hardReload(),
          },
          duration: Infinity,
          icon: <RefreshCcw className="h-4 w-4" />,
        });
      } catch {
        // Network error — ignore, will retry
      }
    };

    // First check after 10s (let page settle)
    const initialTimeout = setTimeout(checkVersion, 10000);
    const intervalId = setInterval(checkVersion, CHECK_INTERVAL);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(intervalId);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [hardReload]);

  return null;
}
