"use client";

import { TableCell } from "@/components/ui/table";
import { ShieldCheck, PenLine } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectItem } from "@/lib/types/database";

const singleCellBorderClass = "border border-slate-300 dark:border-slate-700 bg-clip-padding align-top";

interface RowKnrCellProps {
  item: ProjectItem;
  compactView: boolean;
}

export function RowKnrCell({ item, compactView }: RowKnrCellProps) {
  const itemPrice = (item.final_material_price ?? 0) + (item.final_labor_price ?? 0);
  const isManualPrice = item.confidence_level === "manual" && itemPrice > 0;

  const src = item.knr_source;
  const isVerified  = src === "system_knr" || src === "catalog";
  const isUserKnr   = src === "user_knr";
  const isAnalog    = src === "es_synthetic" || (!src && !!item.knr_code);
  const isEstimated = src === "ai_estimation";

  const cleanCode = item.knr_code?.replace(/\s*est\.\s*$/i, "") ?? "";

  return (
    <TableCell className={`text-center min-w-[120px] w-[120px] ${singleCellBorderClass} bg-slate-50/40 dark:bg-slate-950/10`}>
      {isManualPrice ? (
        <div className="flex flex-col items-center gap-0.5">
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 border border-violet-200 dark:border-violet-700">
            <PenLine className="w-2.5 h-2.5" />
            Wycena ręczna
          </span>
        </div>
      ) : isEstimated ? (
        <div className="flex flex-col items-center gap-0.5">
          <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-medium bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
            ★ Szacunek AI
          </span>
          <span className={cn("italic leading-tight text-muted-foreground", compactView ? "text-[9px]" : "text-[10px]")}>
            Brak KNR
          </span>
        </div>
      ) : isAnalog ? (
        <div className="flex flex-col items-center gap-0.5">
          <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            ≈ KNR kat. B
          </span>
          {cleanCode && (
            <span
              className={cn("font-mono leading-tight text-emerald-600 dark:text-emerald-400", compactView ? "text-[9px]" : "text-[10px]")}
              title="Norma analogowa KNR kat. B — dopasowanie przybliżone"
            >
              {cleanCode}
            </span>
          )}
        </div>
      ) : isVerified ? (
        <div className="flex flex-col items-center gap-0.5">
          <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            <ShieldCheck className="w-2.5 h-2.5" />
            KNR kat. A
          </span>
          {cleanCode && (
            <span className={cn("font-mono leading-tight text-emerald-700 dark:text-emerald-400", compactView ? "text-[9px]" : "text-[10px]")}>
              {cleanCode}
            </span>
          )}
        </div>
      ) : isUserKnr ? (
        <div className="flex flex-col items-center gap-0.5">
          <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
            <ShieldCheck className="w-2.5 h-2.5" />
            Twój KNR
          </span>
          {cleanCode && (
            <span className={cn("font-mono leading-tight text-purple-700 dark:text-purple-300", compactView ? "text-[9px]" : "text-[10px]")}>
              {cleanCode}
            </span>
          )}
        </div>
      ) : item.knr_code ? (
        <span
          className={cn("font-mono italic leading-tight text-slate-400 dark:text-slate-500", compactView ? "text-[9px]" : "text-[10px]")}
          title="Źródło nieznane"
        >
          {cleanCode}
        </span>
      ) : (
        <span className="text-[10px] text-slate-300 dark:text-slate-600">—</span>
      )}
    </TableCell>
  );
}
