"use client";

import React from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ProjectItem } from "@/lib/types/database";

// ─── PriceCell ────────────────────────────────────────────────────────────────
// Renders the "Wyceń" button for items with match_trace = "unmatched" (confidence_level = "unmatched").
// Used inside RowMaterialCell when normal price display should be replaced with on-demand L3 CTA.

export interface PriceCellProps {
  item: ProjectItem;
  isLoading: boolean;
  onTriggerL3: (itemId: string) => void;
  className?: string;
}

export function PriceCell({ item, isLoading, onTriggerL3, className }: PriceCellProps) {
  return (
    <div className={cn("flex flex-col items-end gap-1", className)}>
      {isLoading ? (
        <div className="flex items-center gap-1.5 text-violet-500 dark:text-violet-400">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span className="text-[10px] font-medium">Wyceniam...</span>
        </div>
      ) : (
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); onTriggerL3(item.id); }}
                className="h-auto py-0.5 px-1.5 text-[11px] font-semibold text-violet-600 hover:text-violet-800 hover:bg-violet-50 dark:text-violet-400 dark:hover:text-violet-200 dark:hover:bg-violet-950/40 gap-1"
              >
                <Sparkles className="w-3 h-3" />
                Wyceń
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="text-xs max-w-[200px]">
              Nie znaleziono w katalogu ani ES-Dictionary.<br />
              Kliknij aby uruchomić wycenę ES Engine (L3).
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      <span className="text-[8px] text-slate-400 dark:text-slate-600 leading-none">poza KNR</span>
    </div>
  );
}

// ─── isUnmatched ──────────────────────────────────────────────────────────────
// Pure helper — true when item was processed by engine and found in neither L1 nor L2.
export function isUnmatched(item: ProjectItem): boolean {
  return item.confidence_level === "unmatched";
}
