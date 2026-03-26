"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Package, RefreshCcw } from "lucide-react";
import { unhideGlobalCatalogItem, restoreAllHiddenItems } from "@/app/dashboard/settings/actions";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { CatalogItem } from "@/app/dashboard/catalog/actions";

interface HiddenItemsPanelProps {
  hiddenItems: CatalogItem[];
  isPro?: boolean;
}

export function HiddenItemsPanel({ hiddenItems, isPro = true }: HiddenItemsPanelProps) {
  const [restoringItemId, setRestoringItemId] = useState<string | null>(null);
  const [restoringAll, setRestoringAll] = useState(false);
  const [showRestoreAllConfirm, setShowRestoreAllConfirm] = useState(false);

  if (hiddenItems.length === 0) {
    return null; // Don't show panel if no hidden items
  }

  const handleUnhideItem = async (itemId: string, itemName: string) => {
    setRestoringItemId(itemId);
    try {
      const result = await unhideGlobalCatalogItem(itemId);
      if (result.success) {
        toast.success(`✅ Przywrócono pozycję: ${itemName}`, {
          description: "Pozycja jest teraz widoczna w katalogu",
        });
        // Refresh the page to update the list
        setTimeout(() => window.location.reload(), 500);
      } else {
        toast.error("Błąd", {
          description: result.error || "Nie udało się przywrócić pozycji",
        });
      }
    } catch (error) {
      toast.error("Błąd", {
        description: "Wystąpił nieoczekiwany błąd",
      });
    } finally {
      setRestoringItemId(null);
    }
  };

  const handleRestoreAll = () => {
    setShowRestoreAllConfirm(true);
  };

  const executeRestoreAll = async () => {
    setShowRestoreAllConfirm(false);

    setRestoringAll(true);
    try {
      const result = await restoreAllHiddenItems();
      if (result.success) {
        toast.success(`✅ Przywrócono ${result.count} pozycji!`, {
          description: "Wszystkie ukryte pozycje są teraz widoczne. Odświeżam stronę...",
          duration: 2000,
        });
        
        // Refresh page after 1 second
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error("Błąd", {
          description: result.error || "Nie udało się przywrócić pozycji",
        });
      }
    } catch (error) {
      console.error("Error restoring items:", error);
      toast.error("Błąd", {
        description: "Wystąpił nieoczekiwany błąd",
      });
    } finally {
      setRestoringAll(false);
    }
  };

  return (
    <Card className="border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/20 dark:to-slate-900">
      <CardHeader className="border-b border-orange-200 dark:border-orange-800 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="bg-orange-100 dark:bg-orange-900/50 rounded-lg p-1.5 sm:p-2 flex-shrink-0">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base sm:text-lg truncate">Ukryte Pozycje ({hiddenItems.length})</CardTitle>
              <CardDescription className="text-xs mt-0.5 hidden sm:block">
                Pozycje ukryte w katalogu - możesz je przywrócić pojedynczo lub wszystkie naraz
              </CardDescription>
            </div>
          </div>
          <Button
            onClick={handleRestoreAll}
            disabled={restoringAll}
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white flex-shrink-0 w-full sm:w-auto text-xs sm:text-sm"
          >
            {restoringAll ? (
              <>
                <RefreshCcw className="w-3 h-3 mr-1 animate-spin" />
                <span className="hidden sm:inline">Przywracanie...</span>
                <span className="sm:hidden">Przywracanie...</span>
              </>
            ) : (
              <>
                <RefreshCcw className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Przywróć Wszystkie</span>
                <span className="sm:hidden">Przywróć Wszystkie</span>
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-3 sm:pt-4 p-3 sm:p-6">
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1 sm:pr-2">
          {hiddenItems.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border border-orange-200 dark:border-orange-800/50 bg-white dark:bg-slate-900/50 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                  {item.name}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1 text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-medium text-blue-600 dark:text-blue-400 truncate max-w-[120px] sm:max-w-none">
                    {item.category_name || "Bez kategorii"}
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <span className="hidden sm:inline">{item.unit}</span>
                  <span className="hidden sm:inline">•</span>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="text-green-600 dark:text-green-400 font-mono text-[10px] sm:text-xs">
                      {isPro ? `${item.base_labor_price.toFixed(2)} zł` : '***'}
                    </span>
                    <span className="text-slate-400 hidden sm:inline">/</span>
                    <span className="text-amber-600 dark:text-amber-400 font-mono text-[10px] sm:text-xs">
                      {isPro ? `${item.base_material_price.toFixed(2)} zł` : '***'}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => handleUnhideItem(item.id, item.name)}
                disabled={restoringItemId === item.id}
                size="sm"
                variant="outline"
                className="border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 flex-shrink-0 w-full sm:w-auto text-xs"
              >
                {restoringItemId === item.id ? (
                  <>
                    <RefreshCcw className="w-3 h-3 mr-1 animate-spin" />
                    <span>Przywracanie...</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3 h-3 mr-1" />
                    <span>Przywróć</span>
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
        <AlertDialog open={showRestoreAllConfirm} onOpenChange={setShowRestoreAllConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Przywróć wszystkie pozycje</AlertDialogTitle>
            <AlertDialogDescription>
              Przywrócisz <strong>{hiddenItems.length}</strong> ukrytych pozycji. Wszystkie pozycje ponownie będą widoczne w katalogu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={executeRestoreAll} className="bg-emerald-600 hover:bg-emerald-700 text-white">Przywróć</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
  </Card>
  );
}
