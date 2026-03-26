"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

// ─── Context for passing DnD listeners down to DragHandle ─────────────────────

export const DndListenersContext = React.createContext<Record<string, unknown> | null>(null);

// ─── SortableRow ──────────────────────────────────────────────────────────────

interface SortableRowProps {
  id: string;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
  searchRef?: (el: HTMLTableRowElement | null) => void;
}

export function SortableRow({
  id,
  disabled,
  children,
  className,
  searchRef,
}: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
    transition,
  } = useSortable({ id, disabled });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : undefined,
    position: "relative" as const,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <DndListenersContext.Provider value={listeners ?? null}>
      <TableRow
        ref={(el) => {
          setNodeRef(el);
          if (searchRef) searchRef(el);
        }}
        style={style}
        className={cn(className, !disabled && "select-none")}
        {...attributes}
      >
        {children}
      </TableRow>
    </DndListenersContext.Provider>
  );
}

// ─── DragHandle ───────────────────────────────────────────────────────────────

interface DragHandleProps {
  className?: string;
}

export function DragHandle({ className }: DragHandleProps) {
  const listeners = React.useContext(DndListenersContext);
  return (
    <div
      {...(listeners ?? {})}
      style={{ touchAction: "none" }}
      className={cn(
        "cursor-grab active:cursor-grabbing select-none flex items-center justify-center w-6 h-8 -mx-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors",
        className
      )}
    >
      <GripVertical className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
    </div>
  );
}
