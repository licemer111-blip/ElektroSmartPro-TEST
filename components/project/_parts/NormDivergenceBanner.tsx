"use client";

import React, { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, X } from "lucide-react";
import type { ProjectItem } from "@/lib/types/database";

interface DivergentItem {
  id: string;
  name: string;
  labor_norm: number;
  suggested_norm: number;
  ratio: number;
  unit: string | null;
}

interface NormDivergenceBannerProps {
  items: ProjectItem[];
}

export function NormDivergenceBanner({ items }: NormDivergenceBannerProps) {
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const divergent: DivergentItem[] = items
    .filter((item) => {
      const ln = item.labor_norm;
      const sn = item.suggested_norm;
      if (!ln || !sn || ln <= 0 || sn <= 0) return false;
      if (item.confidence_level === "manual") return false;
      const ratio = ln / sn;
      return ratio < 0.33 || ratio > 3.0;
    })
    .map((item) => ({
      id: item.id,
      name: item.name,
      labor_norm: item.labor_norm!,
      suggested_norm: item.suggested_norm!,
      ratio: item.labor_norm! / item.suggested_norm!,
      unit: item.unit ?? null,
    }));

  if (divergent.length === 0 || dismissed) return null;

  return (
    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-950/20 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
            {divergent.length === 1
              ? "1 pozycja ma normę rbh znacznie odbiegającą od bazy KNR"
              : `${divergent.length} pozycji ma normy rbh znacznie odbiegające od bazy KNR`}
          </span>
          <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">
            (różnica {'>'} 3×)
          </span>
        </div>
        <button
          onClick={() => setExpanded((e) => !e)}
          className="text-xs text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 flex items-center gap-1 shrink-0"
        >
          {expanded ? "Zwiń" : "Pokaż"}{" "}
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-400 hover:text-amber-700 dark:hover:text-amber-200 shrink-0"
          title="Ukryj ostrzeżenie"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {expanded && (
        <div className="border-t border-amber-200 dark:border-amber-800/50 px-4 pb-3 pt-2">
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {divergent.map((item) => (
              <div key={item.id} className="flex items-center gap-2 text-xs">
                <span className="text-amber-700 dark:text-amber-400 shrink-0 font-medium">
                  {item.ratio > 1
                    ? `×${item.ratio.toFixed(1)} wyższa`
                    : `×${(1 / item.ratio).toFixed(1)} niższa`}
                </span>
                <span className="text-slate-700 dark:text-slate-300 truncate flex-1">{item.name}</span>
                <span className="text-slate-500 dark:text-slate-400 shrink-0 font-mono">
                  {item.labor_norm.toFixed(3)} vs {item.suggested_norm.toFixed(3)} rbh/{item.unit ?? "szt"}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
            Weryfikuj te normy przed ostatecznym zatwierdzeniem kosztorysu.
            Możesz zresetować normę klikając ikonę ↺ (reset) w kolumnie r-g obok wartości rbh.
          </p>
        </div>
      )}
    </div>
  );
}
