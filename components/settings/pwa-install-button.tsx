"use client";

import { useState, useEffect } from "react";
import { Download, Check, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Detect device type
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    const android = /android/.test(userAgent);
    
    setIsIOS(ios);
    setIsAndroid(android);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check iOS standalone
    if ((window.navigator as Navigator & { standalone?: boolean }).standalone) {
      setIsInstalled(true);
      return;
    }

    // Listen for beforeinstallprompt event (Android Chrome only)
    const handler = (e: Event) => {
      e.preventDefault();
      const event = e as BeforeInstallPromptEvent;
      setDeferredPrompt(event);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if prompt is available after a short delay — silent if not supported
    setTimeout(() => {
      // No-op: PWA install prompt not available (browser may not support it)
    }, 2000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, [deferredPrompt]);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      toast({
        variant: "destructive",
        title: "❌ Nie można zainstalować",
        description: "Instalacja PWA jest niedostępna w Twojej przeglądarce lub aplikacja jest już zainstalowana.",
      });
      return;
    }

    try {
      // Show the install prompt
      await deferredPrompt.prompt();

      // Wait for user choice
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        
        toast({
          title: "✅ Sukces!",
          description: "Aplikacja została zainstalowana. Sprawdź ekran główny swojego urządzenia.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Anulowano",
          description: "Instalacja została anulowana.",
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "❌ Błąd",
        description: "Nie udało się zainstalować aplikacji.",
      });
    }
  };

  const handleResetPreferences = () => {
    // Clear all PWA install preferences
    localStorage.removeItem('pwa-install-dismissed');
    localStorage.removeItem('pwa-install-never');
    localStorage.removeItem('pwa-page-views');
    
    toast({
      title: "✅ Zresetowano",
      description: "Preferencje instalacji PWA zostały zresetowane. Automatyczny prompt pojawi się ponownie zgodnie z harmonogramem.",
    });
  };

  if (isInstalled) {
    return (
      <Alert className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-2 border-green-200 dark:border-green-800">
        <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
        <AlertDescription className="text-slate-900 dark:text-slate-100">
          <p className="font-semibold text-base mb-2">
            ✅ Aplikacja Zainstalowana
          </p>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            ElektroSmart PRO jest już zainstalowana jako aplikacja na Twoim urządzeniu. 
            Możesz korzystać z niej offline i otrzymywać powiadomienia!
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Info Card */}
      <Alert className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-2 border-blue-200 dark:border-blue-800">
        <Smartphone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-slate-900 dark:text-slate-100">
          <p className="font-semibold text-base mb-2">
            📱 Instalacja Aplikacji PWA
          </p>
          <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">
            Zainstaluj ElektroSmart PRO jako aplikację na swoim urządzeniu. Korzyści:
          </p>
          <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 mb-3">
            <li>✓ Pracuj offline - wszystkie dane dostępne bez internetu</li>
            <li>✓ Szybszy dostęp - własna ikona na ekranie głównym</li>
            <li>✓ Powiadomienia push - otrzymuj alerty o nowych funkcjach</li>
            <li>✓ Natywne doświadczenie - wygląda jak prawdziwa aplikacja</li>
            <li>✓ Aparat - rób zdjęcia bezpośrednio w projektach</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Action Buttons */}
      <div className="grid gap-3">
        {deferredPrompt ? (
          <Button 
            onClick={handleInstall} 
            className="w-full"
            size="lg"
          >
            <Download className="w-5 h-5 mr-2" />
            Zainstaluj Aplikację Teraz
          </Button>
        ) : (
          <Alert className={isIOS ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800" : "border-amber-200 dark:border-amber-800"}>
            <AlertDescription className="text-sm">
              <p className="font-medium mb-2 text-slate-900 dark:text-slate-100">
                {isIOS ? "📱 Instalacja na iOS" : "🔧 Instalacja ręczna"}
              </p>
              {isIOS ? (
                <div className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
                  <p className="font-semibold">Aby zainstalować aplikację na iPhone/iPad:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Kliknij przycisk <strong>"Udostępnij"</strong> (kwadrat ze strzałką w górę) na dole ekranu</li>
                    <li>Przewiń w dół i wybierz <strong>"Dodaj do ekranu początkowego"</strong></li>
                    <li>Kliknij <strong>"Dodaj"</strong> w prawym górnym rogu</li>
                    <li>Ikona ElektroSmart PRO pojawi się na Twoim ekranie głównym!</li>
                  </ol>
                </div>
              ) : isAndroid ? (
                <p className="text-xs text-slate-700 dark:text-slate-300">
                  Otwórz menu Chrome (⋮) w prawym górnym rogu i wybierz <strong>"Dodaj do ekranu głównego"</strong> lub <strong>"Zainstaluj aplikację"</strong>.
                </p>
              ) : (
                <p className="text-xs text-slate-700 dark:text-slate-300">
                  Aby zainstalować aplikację, otwórz tę stronę w przeglądarce Chrome lub Safari na urządzeniu mobilnym.
                </p>
              )}
            </AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={handleResetPreferences} 
          variant="outline"
          size="sm"
          className="w-full"
        >
          Zresetuj Preferencje Instalacji
        </Button>
      </div>

      {/* Detailed Instructions */}
      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
        <p className="text-xs font-medium text-slate-900 dark:text-slate-100 mb-3">
          💡 Instrukcje dla wszystkich platform:
        </p>
        <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">📱 Safari (iOS - iPhone/iPad):</p>
            <p>Przycisk "Udostępnij" (na dole) → "Dodaj do ekranu początkowego" → "Dodaj"</p>
          </div>
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">🤖 Chrome (Android):</p>
            <p>Menu (⋮) → "Dodaj do ekranu głównego" lub "Zainstaluj aplikację"</p>
          </div>
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">💻 Chrome (Desktop):</p>
            <p>Ikona instalacji (⊕) w pasku adresu obok gwiazdki zakładek</p>
          </div>
        </div>
      </div>
    </div>
  );
}
