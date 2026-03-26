"use client";

import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { ChevronUp, ChevronDown, LayoutGrid } from "lucide-react";
import { calcSectionSubtotal } from "@/lib/pricing-calculations";
import type { ProjectItem } from "@/lib/types/database";

interface EstimateGroupHeaderProps {
  sectionName: string;
  itemCount: number;
  sectionTopItems: ProjectItem[];
  childrenMap: Map<string, ProjectItem[]>;
  adjustmentMultiplier: number;
  materialsOwnedByCustomer: boolean;
  isPro: boolean;
  isCollapsed: boolean;
  onToggle: () => void;
}

export function EstimateGroupHeader({
  sectionName,
  itemCount,
  sectionTopItems,
  childrenMap,
  adjustmentMultiplier,
  materialsOwnedByCustomer,
  isPro,
  isCollapsed,
  onToggle,
}: EstimateGroupHeaderProps) {
  const subtotal = React.useMemo(
    () => calcSectionSubtotal(sectionTopItems, childrenMap, adjustmentMultiplier, materialsOwnedByCustomer),
    [sectionTopItems, childrenMap, adjustmentMultiplier, materialsOwnedByCustomer],
  );

  return (
    <TableRow
      className="bg-purple-50 dark:bg-purple-950/20 border-t-2 border-purple-300 dark:border-purple-700 cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-950/30 transition-colors"
      onClick={onToggle}
    >
      <TableCell colSpan={99} className="py-1.5 px-3 border border-purple-200 dark:border-purple-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isCollapsed ? (
              <ChevronDown className="w-3.5 h-3.5 text-purple-500" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5 text-purple-500" />
            )}
            <LayoutGrid className="w-3.5 h-3.5 text-purple-500" />
            <span className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
              {sectionName || "Bez sekcji"}
            </span>
            <span className="text-[10px] text-purple-500 dark:text-purple-400">
              ({itemCount} poz.)
            </span>
          </div>
          {isPro ? (
            <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300">
              {subtotal.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł
            </span>
          ) : (
            <span className="text-[11px] font-medium text-purple-400 dark:text-purple-500">*** zł</span>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
