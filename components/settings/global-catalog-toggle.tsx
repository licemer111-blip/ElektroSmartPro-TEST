"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Database, Info } from "lucide-react";
import { toggleGlobalCatalog } from "@/app/dashboard/settings/actions";
import { useRouter, useSearchParams } from "next/navigation";

interface GlobalCatalogToggleProps {
  initialValue: boolean;
  globalCount: number;
  onToggle?: () => void;
}

export function GlobalCatalogToggle({ 
  initialValue, 
  globalCount,
  onToggle,
}: GlobalCatalogToggleProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isEnabled, setIsEnabled] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async (newValue: boolean) => {
    setIsLoading(true);
    setIsEnabled(newValue); // Optimistic update
    
    try {
      await toggleGlobalCatalog(newValue);
      
      // Preserve the current tab in URL after revalidation
      const currentTab = searchParams.get('tab') || 'database';
      router.refresh();
      router.push(`/dashboard/settings?tab=${currentTab}`);
      onToggle?.();
    } catch (error) {
      // Revert on error
      setIsEnabled(!newValue);
      console.error("Failed to toggle global catalog:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-2 border-violet-200 dark:border-violet-800/60 bg-gradient-to-br from-violet-50/50 to-purple-50/30 dark:from-violet-950/20 dark:to-purple-950/15">
      <CardHeader className="border-b border-violet-100 dark:border-violet-900/50 bg-violet-50/50 dark:bg-violet-950/20">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          <CardTitle className="text-violet-900 dark:text-violet-100">Globalny Katalog</CardTitle>
        </div>
        <CardDescription className="text-violet-700/80 dark:text-violet-300/80">
          Zarządzaj widocznością standardowych pozycji rynkowych
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Toggle */}
        <div className="flex items-center justify-between p-4 border-2 border-violet-200 dark:border-violet-800 rounded-lg bg-white dark:bg-violet-950/30">
          <div className="flex-1">
            <Label 
              htmlFor="global-catalog-toggle" 
              className="text-base font-medium cursor-pointer text-violet-900 dark:text-violet-100"
            >
              Pokaż Globalny Katalog
            </Label>
            <p className="text-sm text-violet-700 dark:text-violet-400 mt-1">
              {globalCount > 0 
                ? `${globalCount.toLocaleString('pl-PL')} standardowych pozycji` 
                : 'Brak pozycji globalnych'}
            </p>
          </div>
          <Switch
            id="global-catalog-toggle"
            checked={isEnabled}
            onCheckedChange={isLoading ? undefined : handleToggle}
            className={isLoading ? "pointer-events-none opacity-50" : ""}
          />
        </div>

        {/* Info Panel */}
        <div className="flex gap-3 p-4 bg-violet-100 dark:bg-violet-950/40 border-2 border-violet-200 dark:border-violet-800 rounded-lg">
          <Info className="h-5 w-5 text-violet-600 dark:text-violet-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-violet-900 dark:text-violet-100">
            <p className="font-medium mb-1">Czym jest globalny katalog?</p>
            <p className="text-violet-800 dark:text-violet-300">
              Standardowe pozycje rynkowe (kable, gniazda, włączniki, robocizna) 
              z aktualnymi cenami netto. Możesz je dodawać do projektów bez 
              ręcznego wpisywania.
            </p>
            <p className="text-violet-800 dark:text-violet-300 mt-2">
              <strong>Wyłącz</strong>, aby widzieć tylko swoje własne pozycje.
            </p>
          </div>
        </div>

        {/* Status Info */}
        {isEnabled ? (
          <div className="text-sm text-violet-700 dark:text-violet-300">
            ✅ Katalog globalny jest <strong>widoczny</strong> w zakładce "Mój Katalog"
          </div>
        ) : (
          <div className="text-sm text-violet-700 dark:text-violet-300">
            🔒 Katalog globalny jest <strong>ukryty</strong> - widzisz tylko swoje pozycje
          </div>
        )}
      </CardContent>
    </Card>
  );
}
