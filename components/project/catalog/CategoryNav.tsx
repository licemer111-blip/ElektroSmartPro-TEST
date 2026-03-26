"use client";

import React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { User, Users } from "lucide-react";
import type { SourceFilter } from "@/hooks/useCatalogSearch";
import type { Team } from "@/lib/types/database";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CategoryNavProps {
  sourceFilter: SourceFilter;
  onSourceFilterChange: (filter: SourceFilter) => void;
  userTeam?: Team | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const CategoryNav = React.memo(function CategoryNav({
  sourceFilter,
  onSourceFilterChange,
  userTeam,
}: CategoryNavProps) {
  const getActiveClass = (filter: SourceFilter): string => {
    if (sourceFilter !== filter) return "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200";
    return "bg-blue-600 text-white shadow-sm";
  };

  const baseClass = "flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all";

  if (!userTeam) return null;

  return (
    <div className="mb-3 flex-shrink-0">
      <TooltipProvider delayDuration={800}>
        <div className="flex gap-0.5 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={() => onSourceFilterChange("personal")} className={`${baseClass} ${getActiveClass("personal")}`}>
                <User className="w-3 h-3" />
                Moje
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom"><p>Tylko Twój katalog prywatny — pozycje dodane przez Ciebie</p></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={() => onSourceFilterChange("team")} className={`${baseClass} ${getActiveClass("team")}`}>
                <Users className="w-3 h-3" />
                Zespół
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom"><p>Współdzielone pozycje Twojego zespołu</p></TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  );
});
