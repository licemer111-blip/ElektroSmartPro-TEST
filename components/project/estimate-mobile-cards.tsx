"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BlurredPrice } from "@/components/ui/blurred-price";
import { cn } from "@/lib/utils";
import {
  Trash2, Copy, ChevronDown, ChevronUp, Package, Wrench,
  ArrowUp, ArrowDown, Pencil, Check, X, ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import type { ProjectItem } from "@/lib/types/database";

interface EstimateMobileCardsProps {
  items: ProjectItem[];
  isPro: boolean;
  isFinal: boolean;
  isReadOnly: boolean;
  adjustmentPercentage?: number;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onSaveEdit: (id: string, updates: {
    name?: string; quantity?: number;
    material_price?: number; labor_price?: number;
  }) => void;
}

type EditField = "quantity" | "material_price" | "labor_price";
interface EditingCell { id: string; field: EditField; value: string }
interface SwipeState { id: string; x: number; committed: boolean }

function calcItemMat(item: ProjectItem) {
  return (item.final_material_price ?? item.material_price ?? 0);
}
function calcItemLab(item: ProjectItem) {
  return (item.final_labor_price ?? item.labor_price ?? 0);
}
function calcTotal(item: ProjectItem, adj: number): number {
  const base = (calcItemMat(item) + calcItemLab(item)) * item.quantity;
  return adj !== 0 ? base * (1 + adj / 100) : base;
}

// ─── Swipe-to-delete gesture ──────────────────────────────────────────────────
const SWIPE_THRESHOLD = 80; // px left to reveal delete
const SWIPE_COMMIT    = 160; // px left to auto-commit delete

export function EstimateMobileCards({
  items,
  isPro,
  isFinal,
  isReadOnly,
  adjustmentPercentage = 0,
  selectedIds,
  onToggleSelect,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onSaveEdit,
}: EstimateMobileCardsProps) {
  const [expandedId, setExpandedId]       = useState<string | null>(null);
  const [editingCell, setEditingCell]     = useState<EditingCell | null>(null);
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [nameValue, setNameValue]         = useState("");
  const [swipe, setSwipe]                 = useState<SwipeState | null>(null);
  const inputRef   = useRef<HTMLInputElement>(null);
  const nameRef    = useRef<HTMLInputElement>(null);
  const touchStart = useRef<number>(0);
  const canEdit    = !isFinal && !isReadOnly;

  const startEdit = useCallback((id: string, field: EditField, currentValue: number) => {
    setEditingCell({ id, field, value: String(currentValue) });
    setTimeout(() => inputRef.current?.select(), 30);
  }, []);

  const commitEdit = useCallback(() => {
    if (!editingCell) return;
    const num = parseFloat(editingCell.value);
    if (!isNaN(num) && num >= 0) onSaveEdit(editingCell.id, { [editingCell.field]: num });
    setEditingCell(null);
  }, [editingCell, onSaveEdit]);

  const startEditName = useCallback((item: ProjectItem) => {
    if (!canEdit) return;
    setEditingNameId(item.id);
    setNameValue(item.name);
    setTimeout(() => { nameRef.current?.focus(); nameRef.current?.select(); }, 30);
  }, [canEdit]);

  const commitName = useCallback(() => {
    if (!editingNameId) return;
    const trimmed = nameValue.trim();
    if (trimmed) onSaveEdit(editingNameId, { name: trimmed });
    setEditingNameId(null);
  }, [editingNameId, nameValue, onSaveEdit]);

  const handleTouchStart = useCallback((id: string, e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
    setSwipe({ id, x: 0, committed: false });
  }, []);

  const handleTouchMove = useCallback((id: string, e: React.TouchEvent) => {
    const dx = touchStart.current - e.touches[0].clientX;
    if (dx < 0) { setSwipe(null); return; }
    setSwipe({ id, x: Math.min(dx, SWIPE_COMMIT + 20), committed: dx >= SWIPE_COMMIT });
  }, []);

  const handleTouchEnd = useCallback((id: string) => {
    if (swipe?.committed) onDelete(id);
    setSwipe(null);
  }, [swipe, onDelete]);

  const { sections, childrenMap } = useMemo(() => {
    const sMap = new Map<string, ProjectItem[]>();
    const cMap = new Map<string, ProjectItem[]>();
    for (const item of items) {
      if (item.is_assembly_child && item.parent_assembly_id) {
        const arr = cMap.get(item.parent_assembly_id) ?? [];
        arr.push(item); cMap.set(item.parent_assembly_id, arr);
      } else {
        const key = item.section || "Bez sekcji";
        const arr = sMap.get(key) ?? [];
        arr.push(item); sMap.set(key, arr);
      }
    }
    return { sections: sMap, childrenMap: cMap };
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="text-center py-10 text-sm text-slate-400 dark:text-slate-600">
        Brak pozycji w kosztorysie
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-4">
      {Array.from(sections.entries()).map(([sectionName, sectionItems]) => {
        const secMat = sectionItems.reduce((s, i) => s + calcItemMat(i) * i.quantity, 0);
        const secLab = sectionItems.reduce((s, i) => s + calcItemLab(i) * i.quantity, 0);
        const secSum = adjustmentPercentage !== 0
          ? (secMat + secLab) * (1 + adjustmentPercentage / 100)
          : secMat + secLab;
        return (
        <div key={sectionName}>
          {/* Section header with counter */}
          <div className="flex items-center gap-2 mb-2 px-1">
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                {sectionName}
              </span>
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 px-1.5 py-0.5 rounded-full font-mono">
                {sectionItems.length}
              </span>
            </div>
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          </div>

          <div className="space-y-2">
            {sectionItems.map((item, idx) => {
              const isFirstInSection = idx === 0;
              const isLastInSection  = idx === sectionItems.length - 1;
              const isExpanded  = expandedId === item.id;
              const isSelected  = selectedIds.has(item.id);
              const mat         = calcItemMat(item);
              const lab         = calcItemLab(item);
              const total       = calcTotal(item, adjustmentPercentage);
              const children    = childrenMap.get(item.id) ?? [];
              const isAssembly  = children.length > 0;
              const swipeX      = swipe?.id === item.id ? swipe.x : 0;
              const swipeCommit = swipe?.id === item.id && swipe.committed;

              return (
                <div key={item.id} className="relative overflow-hidden rounded-xl">
                  {/* Swipe-to-delete red background */}
                  {canEdit && (
                    <div
                      className={cn(
                        "absolute inset-y-0 right-0 flex items-center justify-end pr-4 rounded-xl",
                        swipeCommit ? "bg-red-500" : "bg-red-400/80"
                      )}
                      style={{ width: Math.max(swipeX, 0) }}
                    >
                      <Trash2 className="w-5 h-5 text-white" />
                    </div>
                  )}

                  {/* Card */}
                  <div
                    className={cn(
                      "relative rounded-xl border bg-white dark:bg-slate-900 shadow-sm overflow-hidden",
                      "transition-transform will-change-transform",
                      isSelected
                        ? "border-blue-400 dark:border-blue-600 ring-1 ring-blue-400 dark:ring-blue-600"
                        : "border-slate-200 dark:border-slate-800"
                    )}
                    style={{ transform: `translateX(-${swipeX}px)` }}
                    onTouchStart={canEdit ? (e) => handleTouchStart(item.id, e) : undefined}
                    onTouchMove={canEdit  ? (e) => handleTouchMove(item.id, e)  : undefined}
                    onTouchEnd={canEdit   ? () => handleTouchEnd(item.id)       : undefined}
                  >
                    {/* Card Header */}
                    <div
                      className="flex items-start gap-2 p-3 cursor-pointer select-none"
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    >
                      {/* Checkbox */}
                      {canEdit && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onToggleSelect(item.id); }}
                          className={cn(
                            "mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                            isSelected ? "bg-blue-600 border-blue-600" : "border-slate-300 dark:border-slate-600"
                          )}
                          aria-label="Zaznacz"
                        >
                          {isSelected && (
                            <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                              <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </button>
                      )}

                      {/* Index + Name */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-1.5">
                          <span className="text-[10px] text-slate-400 font-mono shrink-0 mt-0.5">{idx + 1}.</span>
                          {editingNameId === item.id ? (
                            <div className="flex-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <Input
                                ref={nameRef} id={`m-name-${item.id}`} name={`m-name-${item.id}`} value={nameValue}
                                onChange={(e) => setNameValue(e.target.value)}
                                onBlur={commitName}
                                onKeyDown={(e) => { if (e.key === "Enter") commitName(); if (e.key === "Escape") setEditingNameId(null); }}
                                className="h-6 flex-1 text-sm px-1.5 py-0 font-medium"
                              />
                              <button onClick={commitName} className="text-green-600 p-0.5 shrink-0">
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => setEditingNameId(null)} className="text-slate-400 p-0.5 shrink-0">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span
                              className={cn("flex-1 text-sm font-medium text-slate-900 dark:text-slate-100 leading-snug", canEdit && "cursor-text")}
                              onDoubleClick={(e) => { e.stopPropagation(); startEditName(item); }}
                            >
                              {item.name}
                              {isAssembly && (
                                <span className="ml-1.5 text-[10px] bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-1 py-0.5 rounded align-middle">
                                  ×{children.length}
                                </span>
                              )}
                            </span>
                          )}
                        </div>

                        {/* Quantity */}
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {canEdit && editingCell?.id === item.id && editingCell.field === "quantity" ? (
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <Input ref={inputRef} type="number" id={`m-qty-${item.id}`} name={`m-qty-${item.id}`} min={0} step={0.1}
                                value={editingCell.value}
                                onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                                onBlur={commitEdit}
                                onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditingCell(null); }}
                                className="h-6 w-16 text-xs px-1.5 py-0"
                              />
                              <span className="text-xs text-slate-400">{item.unit}</span>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); if (canEdit) startEdit(item.id, "quantity", item.quantity); }}
                              className={cn("text-xs text-slate-500 dark:text-slate-400", canEdit && "hover:text-blue-600 hover:underline cursor-pointer")}
                            >
                              {item.quantity} {item.unit}
                              {canEdit && <Pencil className="inline w-2.5 h-2.5 ml-1 opacity-40" />}
                            </button>
                          )}
                          {item.catalog_categories && (
                            <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                              {(item.catalog_categories as { name: string }).name}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Total + expand */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <BlurredPrice value={total} isPro={isPro}
                          className="text-sm font-semibold text-slate-900 dark:text-slate-100" />
                        {isExpanded
                          ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                          : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 dark:border-slate-800 px-3 pb-3 pt-2 space-y-2">
                        {/* Assembly children list */}
                        {isAssembly && (
                          <div className="space-y-1">
                            {children.map((child) => (
                              <div key={child.id} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 pl-2 border-l-2 border-orange-200 dark:border-orange-800">
                                <ChevronRight className="w-3 h-3 shrink-0 text-orange-400" />
                                <span className="truncate">{child.name}</span>
                                <span className="ml-auto shrink-0 font-mono">{child.quantity} {child.unit}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Price breakdown */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div
                            className={cn("flex items-center gap-1.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50",
                              canEdit && "cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:ring-1 hover:ring-blue-300 dark:hover:ring-blue-700 transition-all")}
                            onClick={(e) => { e.stopPropagation(); if (canEdit) startEdit(item.id, "material_price", mat); }}
                          >
                            <Package className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-slate-500 dark:text-slate-400">Materiał/szt</p>
                              {editingCell?.id === item.id && editingCell.field === "material_price" ? (
                                <Input ref={inputRef} type="number" id={`m-mat-${item.id}`} name={`m-mat-${item.id}`} min={0} step={0.01}
                                  value={editingCell.value}
                                  onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                                  onBlur={commitEdit}
                                  onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditingCell(null); }}
                                  className="h-6 w-full text-xs px-1.5 py-0 mt-0.5"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              ) : (
                                <BlurredPrice value={mat} isPro={isPro} className="font-semibold text-slate-800 dark:text-slate-200" />
                              )}
                            </div>
                            {canEdit && <Pencil className="w-2.5 h-2.5 text-slate-300 shrink-0" />}
                          </div>
                          <div
                            className={cn("flex items-center gap-1.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50",
                              canEdit && "cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:ring-1 hover:ring-orange-300 dark:hover:ring-orange-700 transition-all")}
                            onClick={(e) => { e.stopPropagation(); if (canEdit) startEdit(item.id, "labor_price", lab); }}
                          >
                            <Wrench className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-slate-500 dark:text-slate-400">Robocizna/szt</p>
                              {editingCell?.id === item.id && editingCell.field === "labor_price" ? (
                                <Input ref={inputRef} type="number" id={`m-lab-${item.id}`} name={`m-lab-${item.id}`} min={0} step={0.01}
                                  value={editingCell.value}
                                  onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                                  onBlur={commitEdit}
                                  onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditingCell(null); }}
                                  className="h-6 w-full text-xs px-1.5 py-0 mt-0.5"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              ) : (
                                <BlurredPrice value={lab} isPro={isPro} className="font-semibold text-slate-800 dark:text-slate-200" />
                              )}
                            </div>
                            {canEdit && <Pencil className="w-2.5 h-2.5 text-slate-300 shrink-0" />}
                          </div>
                        </div>

                        {item.labor_norm && (
                          <p className="text-[11px] text-slate-400">
                            Norma KNR: {item.labor_norm} rbh/{item.unit ?? "szt"} · Razem: {((item.labor_norm ?? 0) * item.quantity).toFixed(2)} rbh
                          </p>
                        )}

                        {/* Actions */}
                        {canEdit && (
                          <div className="flex gap-2 pt-1">
                            <Button size="sm" variant="outline" className="h-8 w-8 p-0 shrink-0"
                              disabled={isFirstInSection} onClick={() => onMoveUp(item.id)} aria-label="Przenieś wyżej">
                              <ArrowUp className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 w-8 p-0 shrink-0"
                              disabled={isLastInSection} onClick={() => onMoveDown(item.id)} aria-label="Przenieś niżej">
                              <ArrowDown className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1 h-8 text-xs gap-1.5"
                              onClick={() => onDuplicate(item.id)}>
                              <Copy className="w-3 h-3" />Duplikuj
                            </Button>
                            <Button size="sm" variant="outline"
                              className="h-8 w-8 p-0 text-red-500 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/30"
                              onClick={() => onDelete(item.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Section totals footer */}
          <div className="mt-2 flex items-center justify-end gap-3 px-1 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Package className="w-3 h-3 text-amber-500" />
              <BlurredPrice value={secMat} isPro={isPro} className="font-mono" />
            </span>
            <span className="text-slate-300 dark:text-slate-600">+</span>
            <span className="flex items-center gap-1">
              <Wrench className="w-3 h-3 text-emerald-500" />
              <BlurredPrice value={secLab} isPro={isPro} className="font-mono" />
            </span>
            <span className="text-slate-300 dark:text-slate-600">=</span>
            <BlurredPrice value={secSum} isPro={isPro}
              className="font-semibold text-slate-700 dark:text-slate-300 font-mono" />
          </div>
        </div>
        );
      })}
    </div>
  );
}
