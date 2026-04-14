"use client";

import React from "react";
import { TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Check, X, Pencil, Copy, Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectItem } from "@/lib/types/database";

const singleCellBorderClass = "border border-slate-300 dark:border-slate-700 bg-clip-padding align-top";

export interface RowActionsProps {
  item: ProjectItem;
  isEditing: boolean;
  isFinal: boolean;
  isReadOnly: boolean;
  compactView: boolean;
  isZestaw: boolean;
  /** AI-triggered template override — hides pencil, shows '+' add-child button */
  isAssemblyOverride?: boolean;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onStartEdit: (item: ProjectItem) => void;
  onDuplicate: (item: ProjectItem) => void;
  onDelete: (item: ProjectItem) => void;
  onStartAddChild: (parentId: string) => void;
}

export function RowActions({
  item,
  isEditing,
  isFinal,
  isReadOnly,
  compactView,
  isZestaw,
  isAssemblyOverride = false,
  onSaveEdit,
  onCancelEdit,
  onStartEdit,
  onDuplicate,
  onDelete,
  onStartAddChild,
}: RowActionsProps) {
  if (isReadOnly) return null;

  return (
    <TableCell className={`min-w-[100px] w-[100px] text-center ${singleCellBorderClass}`}>
      {isEditing ? (
        <div className="flex gap-1 justify-center">
          <Button
            variant="ghost" size="icon" onClick={onSaveEdit}
            className="h-11 w-11 sm:h-8 sm:w-8 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
            title="Zapisz zmiany" aria-label="Zapisz zmiany"
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost" size="icon" onClick={onCancelEdit}
            className="h-11 w-11 sm:h-8 sm:w-8 text-slate-600 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-950"
            title="Anuluj" aria-label="Anuluj edycję"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-0.5">
          {/* Pencil — hidden only for manual zestawy (isZestaw without override);
               visible for regular rows and AI-override rows (quantity editing) */}
          {(!isZestaw || isAssemblyOverride) && (
            <Button
              variant="ghost" size="icon"
              onClick={() => onStartEdit(item)}
              className={cn(
                compactView ? "h-6 w-6" : "h-11 w-11 sm:h-8 sm:w-8",
                "text-slate-600 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800",
                isFinal && "opacity-30 cursor-not-allowed",
              )}
              title={isFinal ? "Odblokuj projekt, aby edytować" : isAssemblyOverride ? "Edytuj ilość zestawu" : "Edytuj pozycję"}
              aria-label="Edytuj pozycję"
            >
              <Pencil className={compactView ? "h-3 w-3" : "h-3.5 w-3.5"} />
            </Button>
          )}

          {/* '+' Add child — for manual zestawy AND AI-override rows */}
          {(isZestaw || isAssemblyOverride) && (
            <Button
              variant="ghost" size="icon"
              onClick={() => onStartAddChild(item.id)}
              className={cn(
                compactView ? "h-6 w-6" : "h-8 w-8",
                "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950",
                isFinal && "opacity-30 cursor-not-allowed",
              )}
              title={isFinal ? "Odblokuj projekt" : "Dodaj pozycję do zestawu"}
              aria-label="Dodaj pozycję do zestawu"
            >
              <Plus className={compactView ? "h-3 w-3" : "h-3.5 w-3.5"} />
            </Button>
          )}

          {/* Copy — only for non-zestaw, non-override rows */}
          {!isZestaw && !isAssemblyOverride && (
            <Button
              variant="ghost" size="icon"
              onClick={() => onDuplicate(item)}
              className={cn(
                compactView ? "h-6 w-6" : "h-8 w-8",
                "text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950",
                isFinal && "opacity-30 cursor-not-allowed",
              )}
              title={isFinal ? "Odblokuj projekt, aby kopiować" : "Kopiuj pozycję"}
              aria-label="Kopiuj pozycję"
            >
              <Copy className={compactView ? "h-3 w-3" : "h-3.5 w-3.5"} />
            </Button>
          )}

          <Button
            variant="ghost" size="icon"
            onClick={() => onDelete(item)}
            className={cn(
              compactView ? "h-6 w-6" : "h-8 w-8",
              "text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950",
              isFinal && "opacity-30 cursor-not-allowed",
            )}
            title={isFinal ? "Odblokuj projekt, aby usunąć" : "Usuń pozycję"}
            aria-label="Usuń pozycję"
          >
            <Trash2 className={compactView ? "h-3 w-3" : "h-3.5 w-3.5"} />
          </Button>
        </div>
      )}
    </TableCell>
  );
}
