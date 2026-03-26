"use client";
/**
 * components/project/_parts/MaterialBrainContext.tsx
 * ─────────────────────────────────────────────────────────────────
 * Context + single shared Sheet for Material Brain.
 * Badge clicks set selectedItemId → Sheet opens once at page level.
 */

import { createContext, useContext, useState, useMemo, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { BrainCircuit } from "lucide-react";
import { MaterialExpertPanel } from "./MaterialExpertPanel";
import { useGlobalSettings } from "@/hooks/use-global-settings";
import type { ItemMaterialBill } from "@/app/dashboard/projects/[id]/_actions/material-brain-actions";

interface MaterialBrainContextValue {
  /** Map<itemId, ItemMaterialBill> — populated after silent fetch. */
  bills:        Map<string, ItemMaterialBill>;
  isLoading:    boolean;
  /** Open the Expert Panel sheet for this labor item. */
  openForItem:  (itemId: string) => void;
  /** Invalidate SessionStorage cache + re-fetch (call after materials saved). */
  refreshBrain: () => void;
}

const MaterialBrainCtx = createContext<MaterialBrainContextValue | null>(null);

export function useMaterialBrainCtx(): MaterialBrainContextValue | null {
  return useContext(MaterialBrainCtx);
}

interface MaterialBrainProviderProps {
  projectId:    string;
  vatRate:      number;
  bills:        Map<string, ItemMaterialBill>;
  isLoading:    boolean;
  refreshBrain: () => void;
  children:     React.ReactNode;
}

export function MaterialBrainProvider({
  projectId,
  vatRate,
  bills,
  isLoading,
  refreshBrain,
  children,
}: MaterialBrainProviderProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const { showHints } = useGlobalSettings();

  const openForItem  = useCallback((id: string) => {
    if (!showHints) return; // Zen Mode: block Sheet when hints are OFF
    setSelectedItemId(id);
  }, [showHints]);
  const closeSheet   = useCallback(() => setSelectedItemId(null), []);

  const ctx = useMemo<MaterialBrainContextValue>(
    () => ({ bills, isLoading, openForItem, refreshBrain }),
    [bills, isLoading, openForItem, refreshBrain]
  );

  const selectedBill = selectedItemId ? bills.get(selectedItemId) : null;

  return (
    <MaterialBrainCtx.Provider value={ctx}>
      {children}

      {/* Single shared Sheet — opened when a row badge is clicked */}
      <Sheet open={!!selectedItemId} onOpenChange={(o) => { if (!o) closeSheet(); }}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-lg overflow-y-auto p-0"
        >
          <SheetHeader className="px-4 pt-4 pb-3 border-b border-slate-200 dark:border-slate-700">
            <SheetTitle className="flex items-center gap-2 text-sm">
              <BrainCircuit className="w-4 h-4 text-amber-500" />
              Material Brain
              {selectedBill && (
                <span className="text-xs font-normal text-slate-500 truncate max-w-[200px]">
                  — {selectedBill.itemName}
                </span>
              )}
            </SheetTitle>
          </SheetHeader>

          <div className="p-4">
            <MaterialExpertPanel
              projectId={projectId}
              vatRate={vatRate}
              filterItemId={selectedItemId ?? undefined}
              preloadedBills={bills}
            />
          </div>
        </SheetContent>
      </Sheet>
    </MaterialBrainCtx.Provider>
  );
}
