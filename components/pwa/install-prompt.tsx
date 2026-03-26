"use client";

import { useState, useEffect } from "react";
import { Download, X, Zap, WifiOff, Bell, Share } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Already running as installed PWA — never show
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if ((window.navigator as Navigator & { standalone?: boolean }).standalone) return;

    // Skip if user permanently dismissed
    if (localStorage.getItem('pwa-install-never') === 'true') return;

    // Skip if dismissed within last 14 days
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const days = Math.floor((Date.now() - new Date(dismissed).getTime()) / 86_400_000);
      if (days < 14) return;
    }

    const ua = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua) && !/chrome/.test(ua);
    setIsIOS(ios);

    if (ios) {
      // iOS Safari — show manual hint after 10 seconds
      setTimeout(() => setShowPrompt(true), 10000);
      return;
    }

    // Android/Desktop Chrome — intercept beforeinstallprompt
    const interceptPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowPrompt(true), 8000);
    };

    window.addEventListener('beforeinstallprompt', interceptPrompt);
    return () => window.removeEventListener('beforeinstallprompt', interceptPrompt);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
  };

  if (!showPrompt) return null;
  // On non-iOS, require deferredPrompt to show install button
  if (!isIOS && !deferredPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl shadow-slate-900/20 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-white font-semibold text-sm">ElektroSmart PRO</div>
              <div className="text-blue-200 text-[10px]">
                {isIOS ? "Dodaj do ekranu głównego" : "Zainstaluj jako aplikację"}
              </div>
            </div>
          </div>
          <button onClick={handleDismiss} className="text-white/70 hover:text-white transition-colors p-1" aria-label="Zamknij">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-3">
          {isIOS ? (
            /* iOS manual hint */
            <div className="space-y-2.5">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Aby zainstalować aplikację na iPhone:
              </p>
              <ol className="space-y-2">
                {[
                  { icon: Share, text: 'Kliknij ikonę "Udostępnij" na dole ekranu' },
                  { icon: Download, text: 'Wybierz "Dodaj do ekranu początkowego"' },
                  { icon: Zap, text: 'Kliknij "Dodaj" — gotowe!' },
                ].map(({ icon: Icon, text }, i) => (
                  <li key={i} className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                    <Icon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span className="text-xs text-slate-600 dark:text-slate-400">{text}</span>
                  </li>
                ))}
              </ol>
              <Button onClick={handleDismiss} size="sm" variant="outline" className="w-full rounded-xl h-9 text-slate-500 mt-1">
                Zamknij
              </Button>
            </div>
          ) : (
            /* Android/Desktop install */
            <>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                Zainstaluj aplikację na telefonie — działa jak natywna, dostępna offline.
              </p>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { icon: WifiOff, label: "Offline" },
                  { icon: Bell, label: "Powiadomienia" },
                  { icon: Download, label: "Bez App Store" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 text-center">{label}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button onClick={handleInstall} size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-9">
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Zainstaluj aplikację
                </Button>
                <Button onClick={handleDismiss} size="sm" variant="outline" className="rounded-xl h-9 px-3 text-slate-500">
                  Później
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
