"use client";

import { useState, useEffect } from "react";
import { TrendingUp, X, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

interface PriceAlertBannerProps {
  projectId: string;
  projectUpdatedAt: string;
  isFinal?: boolean;
  isReadOnly?: boolean;
}

const STORAGE_KEY_PREFIX = "es_price_alert_dismissed_";

export function PriceAlertBanner({
  projectId,
  projectUpdatedAt,
  isFinal = false,
  isReadOnly = false,
}: PriceAlertBannerProps) {
  const [visible, setVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (isFinal || isReadOnly) return;

    const checkPriceChanges = async () => {
      try {
        const dismissKey = `${STORAGE_KEY_PREFIX}${projectId}`;
        const lastDismissed = localStorage.getItem(dismissKey);
        if (lastDismissed && new Date(lastDismissed) > new Date(projectUpdatedAt)) {
          return;
        }

        const res = await fetch(`/api/projects/${projectId}/price-check`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectUpdatedAt }),
        });

        if (!res.ok) return;
        const data = await res.json();
        if (data.hasChanges) {
          setVisible(true);
        }
      } catch {
        // silent fail — price check is non-critical
      }
    };

    // Delay check so page loads first
    const t = setTimeout(checkPriceChanges, 2000);
    return () => clearTimeout(t);
  }, [projectId, projectUpdatedAt, isFinal, isReadOnly]);

  const handleDismiss = () => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${projectId}`, new Date().toISOString());
    } catch { /* ignore */ }
    setVisible(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/price-refresh`, {
        method: "POST",
      });
      if (res.ok) {
        toast({
          title: "Ceny zaktualizowane",
          description: "Ceny rynkowe zostały zaktualizowane w kosztorysie",
        });
        handleDismiss();
        router.refresh();
      }
    } catch {
      toast({
        title: "Błąd aktualizacji",
        description: "Nie udało się zaktualizować cen",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl text-sm">
      <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-amber-900 dark:text-amber-100">
          Ceny rynkowe uległy zmianie
        </p>
        <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
          Katalog ElektroSmart został zaktualizowany od czasu ostatniej edycji tego projektu.
          Czy chcesz zaktualizować ceny w kosztorysie?
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <Button
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
        >
          {isRefreshing ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3" />
          )}
          Zaktualizuj
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleDismiss}
          className="h-7 w-7 p-0 text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/30"
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
