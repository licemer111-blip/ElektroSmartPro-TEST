"use client";

// ═══════════════════════════════════════════════════════════════════
// rozdzielnica/_parts/DraggableModuleTile.tsx
// Single module tile — click to add, hover to preview
// Used by both default catalog and custom catalog
// ═══════════════════════════════════════════════════════════════════

import { Cog, Trash2 } from "lucide-react";
import type { DinModule, SelectedSlot, RailModule } from "../../panel-configurator-types";
import { isCategoryForbiddenForSlot } from "@/lib/panel-placement-rules";

interface DraggableModuleTileProps {
  mod: DinModule;
  selectedSlot: SelectedSlot | null;
  railModules: RailModule[];
  searchQuery?: string;
  onAdd: (mod: DinModule) => void;
  onHover?: (mod: DinModule | null) => void;
  /** Custom catalog: show delete button */
  onDelete?: (modId: string) => void;
  variant?: "default" | "custom";
}

export function DraggableModuleTile({
  mod,
  selectedSlot,
  railModules,
  searchQuery = "",
  onAdd,
  onHover,
  onDelete,
  variant = "default",
}: DraggableModuleTileProps) {
  const isForbidden = isCategoryForbiddenForSlot(mod.category, selectedSlot, railModules);
  const q = searchQuery.toLowerCase().trim();

  if (variant === "custom") {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={() => onAdd(mod)}
          className="flex-1 flex items-center gap-2.5 py-2 px-2.5 rounded-xl border-2 border-transparent hover:border-violet-400 dark:hover:border-violet-600 hover:bg-gradient-to-r hover:from-violet-50 hover:to-violet-100 dark:hover:from-violet-950/40 dark:hover:to-violet-900/30 transition-all text-left group shadow-sm hover:shadow-md"
        >
          <Cog className="w-4 h-4 text-violet-600 flex-shrink-0 group-hover:scale-125 transition-transform" />
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex-1 leading-snug">
            {mod.namePl}
          </span>
          <div className="flex flex-col items-end gap-0.5">
            {mod.modules > 0 && (
              <span className="text-[11px] font-bold text-violet-600 dark:text-violet-400">{mod.modules} mod</span>
            )}
            {mod.defaultRating ? (
              <span className="text-[10px] text-slate-400">{mod.defaultRating}A</span>
            ) : null}
          </div>
        </button>
        {onDelete && (
          <button
            onClick={() => onDelete(mod.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex-shrink-0"
            title="Usuń moduł"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  }

  // Default catalog tile
  const Icon = mod.icon ?? Cog;

  return (
    <button
      onClick={() => !isForbidden && onAdd(mod)}
      onMouseEnter={() => onHover?.(mod)}
      onMouseLeave={() => onHover?.(null)}
      title={!selectedSlot ? "Wybierz miejsce na szynie" : `Umieść: ${mod.namePl}`}
      className={`w-full flex items-center gap-2.5 py-2 px-2.5 rounded-xl border-2 transition-all text-left group shadow-sm hover:shadow-md ${
        isForbidden
          ? "opacity-30 cursor-not-allowed border-transparent"
          : selectedSlot
          ? "border-transparent hover:border-blue-500 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 dark:hover:from-blue-950/40 dark:hover:to-blue-900/30"
          : "border-transparent hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/40"
      }`}
    >
      <Icon className="w-4 h-4 text-blue-600 flex-shrink-0 group-hover:scale-125 transition-transform" />
      <div className="flex-1 min-w-0">
        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug block truncate">
          {mod.namePl}
        </span>
        {q && mod.description && (
          <span className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight block truncate">
            {mod.description}
          </span>
        )}
      </div>
      {mod.modules > 0 && (
        <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex-shrink-0">
          {mod.modules} mod
        </span>
      )}
    </button>
  );
}
