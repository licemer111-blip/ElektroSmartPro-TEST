"use client";

import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // Register SW immediately AND on load — ensures browser sees installability ASAP
    const registerSW = () => {
      navigator.serviceWorker
        .register('/sw.js', { updateViaCache: 'none', scope: '/' })
        .then((registration) => {
          // Check for updates every 5 minutes
          setInterval(() => { registration.update(); }, 5 * 60 * 1000);

          // Listen for new SW waiting to activate
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (!newWorker) return;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          });

          // When controlling SW changes → reload to get new version
          let refreshing = false;
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (refreshing) return;
            refreshing = true;
            window.location.reload();
          });
        })
        .catch((error) => {
          console.error('[PWA] Service Worker registration failed:', error);
        });
    };

    // Register immediately (don't wait for load) — faster installability signal
    registerSW();
    // Also re-register on load in case the above ran before SW was parseable
    window.addEventListener('load', registerSW);

    // Online/offline events
    const handleOnline = () => {
      toast({ title: "Połączono z internetem", description: "Synchronizuję zmiany...", duration: 3000 });
    };
    const handleOffline = () => {
      toast({ title: "Brak połączenia", description: "Pracujesz offline. Zmiany zostaną zsynchronizowane później.", duration: 5000, variant: "destructive" });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('load', registerSW);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  return <>{children}</>;
}
