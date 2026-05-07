"use client";

import React, { useTransition } from "react";
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckSquare, Square, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { HintTooltip } from "@/components/ui/hint-tooltip";
import { HINTS } from "@/lib/hints/hint-content";

interface EstimateTableHeaderProps {
  isFinal: boolean;
  isReadOnly: boolean;
  isDndEnabled: boolean;
  colorMode: boolean;
  filterType: "all" | "materials" | "labor";
  showMaterialsColumn: boolean;
  showLaborColumn: boolean;
  showRgCol: boolean;
  showKnrCol: boolean;
  hasAnyLaborNorm: boolean;
  hasAnyKnrCode: boolean;
  selectedCount: number;
  filteredCount: number;
  materialsOwnedByCustomer: boolean;
  onToggleSelectAll: () => void;
  onFillNorms: () => void;
  onFillKnrCodes: () => void;
  isFillKnrCodesPending: boolean;
}

export function EstimateTableHeader({
  isFinal, isReadOnly, isDndEnabled, colorMode, filterType,
  showMaterialsColumn, showLaborColumn, showRgCol,
  showKnrCol, hasAnyLaborNorm, hasAnyKnrCode, selectedCount, filteredCount, materialsOwnedByCustomer,
  onToggleSelectAll, onFillNorms, onFillKnrCodes, isFillKnrCodesPending,
}: EstimateTableHeaderProps) {
  const [isFillNormsPending, startFillNormsTransition] = useTransition();

  const handleFillNorms = () => {
    startFillNormsTransition(() => {
      onFillNorms();
    });
  };

  return (
    <TableHeader className="bg-slate-100 dark:bg-slate-900">
      <TableRow className="bg-gradient-to-r from-slate-50 via-slate-100 to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        {!isFinal && !isReadOnly && (
          <TableHead className="text-center min-w-[36px] w-[36px] dark:text-slate-300 border-r border-slate-200 dark:border-slate-700">
            <button onClick={onToggleSelectAll}
              className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
              aria-label="Zaznacz wszystko">
              {selectedCount > 0 && selectedCount === filteredCount
                ? <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                : <Square className="w-4 h-4 text-slate-400 dark:text-slate-500" />}
            </button>
          </TableHead>
        )}
        {isDndEnabled && !isFinal && <TableHead className="min-w-[28px] w-[28px] dark:text-slate-300 border-r border-slate-200 dark:border-slate-700" />}
        <TableHead className="text-center min-w-[40px] w-[40px] dark:text-slate-300 text-xs font-semibold border-r border-slate-200 dark:border-slate-700">#</TableHead>
        <TableHead className="min-w-[180px] xs:min-w-[200px] md:w-[40%] dark:text-slate-300 text-xs font-semibold text-center border-r border-slate-200 dark:border-slate-700">
          <div className="flex flex-col items-center gap-0.5">
            <span>📋</span>
            <span>Nazwa</span>
          </div>
        </TableHead>
        <TableHead className="text-center min-w-[50px] w-[50px] dark:text-slate-300 text-xs font-semibold border-r border-slate-200 dark:border-slate-700">
          <div className="flex flex-col items-center gap-0.5">
            <span>📏</span>
            <span>Jedn.</span>
          </div>
        </TableHead>
        <TableHead className="text-center min-w-[80px] w-[80px] dark:text-slate-300 text-xs font-semibold border-r border-slate-200 dark:border-slate-700">
          <div className="flex flex-col items-center gap-0.5">
            <span>🔢</span>
            <span>Ilość</span>
          </div>
        </TableHead>

        {showMaterialsColumn && (
          <TableHead className={`text-center min-w-[120px] w-[120px] text-xs border-r border-slate-200 dark:border-slate-700 ${colorMode ? "bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"}`}>
            <div className="flex flex-col items-center gap-0.5">
              <span>💰</span>
              <div className="flex items-center gap-1">
                <span className="font-semibold">Materiał{materialsOwnedByCustomer && <span className="ml-0.5 text-[9px] opacity-75">(Klient)</span>}</span>
                <HintTooltip content={HINTS.columnMaterial} side="bottom" iconOnly />
              </div>
              <span className={`text-[10px] font-normal opacity-70`}>(jedn. / suma)</span>
            </div>
          </TableHead>
        )}

        {showLaborColumn && (
          <TableHead className={`text-center min-w-[120px] w-[120px] text-xs border-r border-slate-200 dark:border-slate-700 ${colorMode ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"}`}>
            <div className="flex flex-col items-center gap-0.5">
              <span>👷</span>
              <div className="flex items-center gap-1">
                <span className="font-semibold">Robocizna (r-g)</span>
                <HintTooltip content={HINTS.columnLabor} side="bottom" iconOnly />
              </div>
              <span className="text-[10px] font-normal opacity-70">(jedn. / suma)</span>
            </div>
          </TableHead>
        )}

        {showKnrCol && (
          <TableHead className={`text-center min-w-[120px] w-[120px] text-xs border-r border-slate-200 dark:border-slate-700 ${colorMode ? "bg-violet-100 dark:bg-violet-950/30 text-violet-800 dark:text-violet-300" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"}`}>
            <div className="flex flex-col items-center gap-0.5">
              <span>📋</span>
              <div className="flex items-center gap-1">
                <span className="font-semibold">Kod KNR</span>
                <HintTooltip content={HINTS.columnKnr} side="bottom" iconOnly />
              </div>
              <span className="text-[10px] font-normal opacity-70">(Robocizna)</span>
            </div>
          </TableHead>
        )}

        {showRgCol && (
          <TableHead className={`text-center min-w-[90px] w-[90px] text-xs border-r border-slate-200 dark:border-slate-700 ${colorMode ? "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300" : "bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400"}`}>
            <div className="flex flex-col items-center gap-0.5">
              <span>⏱</span>
              <div className="flex items-center gap-1">
                <span className="font-semibold">Czas pracy</span>
                <HintTooltip content={HINTS.columnTime} side="bottom" iconOnly />
              </div>
              <span className="text-[10px] font-normal opacity-70">(rbh/jedn. × ilość)</span>
            </div>
          </TableHead>
        )}

        <TableHead className={cn(
          "text-center min-w-[110px] w-[110px] text-xs border-r border-slate-200 dark:border-slate-700",
          colorMode
            ? "bg-blue-100 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300"
            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
        )}>
          <div className="flex flex-col items-center gap-0.5">
            <span>{filterType === "materials" ? "💰" : filterType === "labor" ? "👷" : "💎"}</span>
            <div className="flex items-center gap-1 justify-center">
            <span className="font-semibold">{filterType === "materials" ? "Suma mat." : filterType === "labor" ? "Suma rob." : "Suma"}</span>
            <HintTooltip content={HINTS.columnSum} side="bottom" iconOnly />
          </div>
          </div>
        </TableHead>

        {!isReadOnly && (
          <TableHead className="min-w-[100px] w-[100px] text-center text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-l border-slate-200 dark:border-slate-700">
            <div className="flex flex-col items-center gap-0.5">
              <span>⚙️</span>
              <span className="font-semibold">Akcje</span>
            </div>
          </TableHead>
        )}
      </TableRow>
    </TableHeader>
  );
}
