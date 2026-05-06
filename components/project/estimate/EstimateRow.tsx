"use client";

import React, { useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CheckSquare, Square, GripVertical, Shield, Flag, ChevronDown, ChevronRight, AlertTriangle, LayoutGrid, X, Check, PenLine, Zap } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { UNIT_PRESETS } from "@/lib/validations";
import { calcRowPrices } from "@/lib/pricing-calculations";
import type { ProjectItem } from "@/lib/types/database";
import { detectSmartContext } from "@/lib/ai/smart-context-mapper";
import { SmartAssemblyPanel } from "@/components/project/estimate/_parts/SmartAssemblyPanel";
import { expandToAssembly } from "@/lib/ai/smart-mapping-engine";
import type { ProjectSector } from "@/lib/ai/smart-mapping-engine";
import { roundPrice, useGlobalSettings } from "@/hooks/use-global-settings";
import { useKnrMultiplier } from "@/hooks/useKnrMultiplier";
import { ConfidenceDot, UncertainPriceWarning } from "@/components/project/estimate/ConfidenceBadge";
import { useMaterialBrainCtx } from "@/components/project/_parts/MaterialBrainContext";
import { RowActions } from "@/components/project/estimate/_parts/RowActions";
import { RowUnitCell, RowQuantityCell, RowMaterialCell, RowLaborCell, RowRgCell } from "@/components/project/estimate/_parts/RowInputs";
import { RowKnrCell } from "@/components/project/estimate/_parts/RowKnrCell";
import { RowTotalCell } from "@/components/project/estimate/_parts/RowTotalCell";

// Ambiguity detector (client-side mirror of server-side pricing.ts)
const AMBIGUITY_KW = ["pomocnicze","dodatkowe","inne","pozostałe","materiały pomocnicze","różne","drobnica","nieprzewidziane","rezerwa","itp","itd"];
const isAmbiguousItem = (name: string) => { const l = name.toLowerCase(); return AMBIGUITY_KW.some(k => l === k || l.includes(k)); };

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EditingState {
  itemId: string;
  name: string;
  quantity: string;
  unit: string;
  materialPrice: string;
  laborPrice: string;
  section: string;
  isAssemblyParent?: boolean;
}

export interface EstimateRowProps {
  item: ProjectItem;
  rowNumber: number | null;
  // Editing
  editingState: EditingState | null;
  onStartEdit: (item: ProjectItem) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditingChange: (state: EditingState) => void;
  // Actions
  onDelete: (item: ProjectItem) => void;
  onDuplicate: (item: ProjectItem) => void;
  onStartAddChild: (parentId: string) => void;
  // Selection
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  // Display flags
  isFinal: boolean;
  isReadOnly: boolean;
  isPro: boolean;
  isDndEnabled: boolean;
  compactView: boolean;
  colorMode: boolean;
  bruttoMode?: boolean;
  vatRate?: number;
  showMaterialsColumn: boolean;
  showLaborColumn: boolean;
  showRgCol: boolean;
  showKnrCol: boolean;
  materialsOwnedByCustomer: boolean;
  adjustmentMultiplier: number;
  regionModifier: number;
  filterType: "all" | "materials" | "labor";
  isAssemblyParent: boolean;
  isCollapsedAssembly?: boolean;
  onToggleAssemblyCollapse?: () => void;
  // Search
  isCurrentMatch: boolean;
  searchRef?: (el: HTMLTableRowElement | null) => void;
  highlightText: (text: string) => React.ReactNode;
  // Sections
  uniqueSections: string[];
  // Tryb Własny
  useCustomRates?: boolean;
  onGlobalFallbackAction?: (itemId: string) => void;
  fallbackLoadingIds?: Set<string>;
  /** Project sector for Smart Assembly expansion (RESIDENTIAL/COMMERCIAL/INDUSTRIAL). */
  projectSector?: ProjectSector;
  /** Effective labor rate PLN/rbh for RBH cost preview in SmartAssemblyPanel. */
  projectLaborRate?: number;
}

const SECTION_PRESETS = [
  "Kuchnia", "Łazienka", "Salon", "Sypialnia", "Korytarz",
  "Garaż", "Piwnica", "Taras", "Zewnętrzne", "Ogólne",
];

const singleCellBorderClass = "border border-slate-300 dark:border-slate-700 bg-clip-padding align-top";

// ─── Component ────────────────────────────────────────────────────────────────

export const EstimateRow = React.memo(function EstimateRow({
  item,
  rowNumber,
  editingState,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditingChange,
  onDelete,
  onDuplicate,
  onStartAddChild,
  isSelected,
  onToggleSelect,
  isFinal,
  isReadOnly,
  isPro,
  isDndEnabled,
  compactView,
  colorMode,
  bruttoMode = false,
  vatRate = 23,
  showMaterialsColumn,
  showLaborColumn,
  showRgCol,
  showKnrCol,
  materialsOwnedByCustomer,
  adjustmentMultiplier,
  regionModifier,
  filterType,
  isAssemblyParent,
  isCollapsedAssembly = false,
  onToggleAssemblyCollapse,
  isCurrentMatch,
  searchRef,
  highlightText,
  uniqueSections,
  useCustomRates = false,
  onGlobalFallbackAction,
  fallbackLoadingIds,
  projectSector = "RESIDENTIAL",
  projectLaborRate = 100,
}: EstimateRowProps) {
  // Blur strictly controlled by is_pro from Supabase — no client-side override
  const showPrices = isPro;
  // Sacred Table principle: Cena/Suma columns are ALWAYS netto (with negocjacje, without VAT).
  // bruttoMode only affects the Summary panel — never the table cells.
  const dp = (netto: number) => roundPrice(netto);
  const isEditing = editingState?.itemId === item.id;
  const isAssemblyChild = item.is_assembly_child === true;
  const isZestaw = isAssemblyParent && !isAssemblyChild;

  // Virtual expand state for AI-triggered ZESTAW rows (no real DB children)
  const [isVirtualExpanded, setIsVirtualExpanded] = useState(false);
  // Controlled open state for Zap (SmartAssemblyPanel) popover
  const [zapOpen, setZapOpen] = useState(false);

  // Prices — use editing values when in edit mode
  const editMat = isEditing ? (parseFloat(editingState!.materialPrice) || 0) : 0;
  const editLab = isEditing ? (parseFloat(editingState!.laborPrice) || 0) : 0;
  const displayItem: ProjectItem = isEditing
    ? {
        ...item,
        unit: (editingState!.unit || item.unit) as ProjectItem["unit"],
        quantity: parseFloat(editingState!.quantity) || 0,
        final_material_price: editMat,
        final_labor_price: editLab,
        // Treat as manual during editing so preview doesn't multiply by adjustmentMult/regionModifier
        confidence_level: (editMat > 0 || editLab > 0) ? "manual" : item.confidence_level,
      }
    : item;

  const brainCtx  = useMaterialBrainCtx();
  const brainBill  = brainCtx?.bills.get(item.id);
  const { showHints } = useGlobalSettings();
  const { multiplier: knrMultiplier } = useKnrMultiplier();

  const {
    materialUnitBase, laborUnitBase, materialTotalBase, laborTotalBase,
    materialUnit: calcMaterialUnit,
    laborUnit: calcLaborUnit,
    materialTotal: calcMaterialTotal,
    laborTotal: calcLaborTotal,
    rowTotal: calcRowTotal,
  } = calcRowPrices(
    displayItem,
    adjustmentMultiplier,
    materialsOwnedByCustomer,
    filterType,
    regionModifier,
    1.0, // matMarkupMult
    1.0, // labMarkupMult
    1.0, // complexityFactor
    knrMultiplier,
  );

  // ── Assembly Template Override ────────────────────────────────────────────────────────────────
  // ZESTAW / BIALY_MONTAZ / TRASY trigger items: show template-derived totals so
  // the row matches the SmartAssemblyPanel tooltip. project-summary.tsx applies
  // the same logic, so table rows ≡ summary ≡ tooltip.
  const isManualPrice = displayItem.confidence_level === "manual";
  let materialUnit = calcMaterialUnit;
  let laborUnit    = calcLaborUnit;
  let materialTotal = calcMaterialTotal;
  let laborTotal    = calcLaborTotal;
  let rowTotal      = calcRowTotal;
  let assemblyRBHPerUnit: number | null = null;

  // Detect assembly-driven items once; used both in price override and in edit panel render.
  const _scmCheck = !isManualPrice && !isAssemblyChild ? detectSmartContext(item.name) : null;
  // Name-based detection without price/manual guards — used to simplify edit panel for ALL smart rows
  const isSmartItem = !isAssemblyChild && detectSmartContext(item.name).category !== "NONE";
  const isAssemblyOverride =
    !!_scmCheck &&
    calcRowTotal > 0 &&
    (_scmCheck.category === "ZESTAW" || _scmCheck.category === "BIALY_MONTAZ" ||
     _scmCheck.category === "TRASY"  || _scmCheck.category === "ROZDZIELNICA");

  // Guard: only override items that have already been AI-priced (calcRowTotal > 0).
  // Note: isEditing is intentionally NOT in this guard — display prices must not jump when the
  // edit panel opens. The edit panel inputs use a separate editedItem state (unaffected).
  if (isAssemblyOverride) {
    const expansion = expandToAssembly(item.name, item.quantity, projectSector, projectLaborRate, knrMultiplier, item.assembly_overrides ?? undefined);
    if (expansion.triggered) {
      const qty = item.quantity || 1;
      const effLab = expansion.totalLaborPLN * regionModifier * adjustmentMultiplier;
      const effMat = materialsOwnedByCustomer ? 0 : expansion.totalMaterialPLN * adjustmentMultiplier;
      laborTotal         = roundPrice(effLab);
      materialTotal      = roundPrice(effMat);
      rowTotal           = roundPrice(effLab + effMat);
      laborUnit          = roundPrice(effLab / qty);
      materialUnit       = roundPrice(effMat / qty);
      assemblyRBHPerUnit = qty > 0 ? expansion.totalRBH / qty : null;
    }
  }

  const isZeroPrice = rowTotal === 0 && (
    (displayItem.final_material_price ?? displayItem.material_price ?? 0) +
    (displayItem.final_labor_price ?? displayItem.labor_price ?? 0)
  ) === 0;

  const isAmbiguous = isAmbiguousItem(item.name) && !isManualPrice;
  // kpl with high qty is suspicious — warn user (disabled in manual mode)
  const isKplWarning = !isManualPrice &&
    item.unit === "kpl" &&
    item.quantity > 20;

  // ── Color scheme ──
  let leftBorderColor: string;
  if (isAmbiguous) {
    leftBorderColor = "border-l-4 border-l-red-500 dark:border-l-red-500";
  } else if (isZeroPrice) {
    leftBorderColor = "border-l-4 border-l-red-500 dark:border-l-red-600";
  } else if (!colorMode) {
    leftBorderColor = "border-l-4 border-l-slate-300 dark:border-l-slate-700";
  } else if (isZestaw) {
    leftBorderColor = "border-l-4 border-l-orange-500 dark:border-l-orange-600";
  } else if (isAssemblyChild) {
    leftBorderColor = "border-l-4 border-l-slate-300 dark:border-l-slate-600";
  } else {
    leftBorderColor = "border-l-4 border-l-blue-500 dark:border-l-blue-500";
  }

  let rowBgClass: string;
  if (isAmbiguous) {
    rowBgClass = "bg-red-50/70 dark:bg-red-950/25 hover:bg-red-100/80 dark:hover:bg-red-950/35";
  } else if (isZeroPrice) {
    rowBgClass = "bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/30";
  } else if (!colorMode) {
    rowBgClass = "bg-slate-50/30 dark:bg-slate-950/20 hover:bg-slate-100/40 dark:hover:bg-slate-950/30";
  } else if (isZestaw) {
    rowBgClass = "bg-gradient-to-r from-orange-50/60 via-orange-50/40 to-orange-50/60 dark:from-orange-950/20 dark:via-orange-950/15 dark:to-orange-950/20 hover:from-orange-100/70 hover:via-orange-50/50 hover:to-orange-100/70 dark:hover:from-orange-950/30 dark:hover:via-orange-950/20 dark:hover:to-orange-950/30";
  } else if (isAssemblyChild) {
    rowBgClass = "bg-slate-50/30 dark:bg-slate-900/10 hover:bg-slate-100/40 dark:hover:bg-slate-900/20";
  } else {
    rowBgClass = "bg-gradient-to-r from-blue-50/40 via-blue-50/30 to-blue-50/40 dark:from-blue-950/20 dark:via-blue-950/15 dark:to-blue-950/20 hover:from-blue-50/60 hover:via-blue-50/40 hover:to-blue-50/60 dark:hover:from-blue-950/30 dark:hover:via-blue-950/20 dark:hover:to-blue-950/30";
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") onSaveEdit();
    else if (e.key === "Escape") onCancelEdit();
  };

  return (
    <>
    <TableRow
      ref={searchRef}
      className={cn(
        `group ${rowBgClass}`,
        isEditing && "ring-2 ring-inset ring-blue-400 dark:ring-blue-600",
        !isEditing && isCurrentMatch && "ring-2 ring-blue-500 ring-inset",
        !isDndEnabled && "select-none"
      )}
    >
      {/* Checkbox */}
      {!isFinal && !isReadOnly && (
        <TableCell className={`text-center min-w-[36px] w-[36px] ${singleCellBorderClass} ${leftBorderColor}`}>
          <button onClick={() => onToggleSelect(item.id)} className="p-0.5" aria-label={`Zaznacz ${item.name}`}>
            {isSelected
              ? <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              : <Square className="w-4 h-4 text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400" />
            }
          </button>
        </TableCell>
      )}

      {/* Drag handle placeholder — actual handle injected by SortableRow in parent */}
      {isDndEnabled && !isFinal && !isReadOnly && (
        <TableCell className={`min-w-[28px] w-[28px] ${singleCellBorderClass} ${!isAssemblyChild ? "cursor-grab active:cursor-grabbing touch-none" : ""}`}>
          {!isAssemblyChild && (
            <div className="flex items-center justify-center w-6 h-8 -mx-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" style={{ touchAction: "none" }}>
              <GripVertical className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
            </div>
          )}
        </TableCell>
      )}

      {/* Row number */}
      <TableCell className={`text-center min-w-[40px] w-[40px] ${singleCellBorderClass} ${!isFinal ? "" : leftBorderColor}`}>
        {rowNumber !== null && (
          <div className={cn("font-bold text-sm", !colorMode
            ? "text-slate-600 dark:text-slate-400"
            : (isZestaw || isAssemblyOverride) ? "text-orange-600 dark:text-orange-400" : "text-blue-600 dark:text-blue-400"
          )}>
            {rowNumber}
            {isZestaw && onToggleAssemblyCollapse && (
              <button
                onClick={(e) => { e.stopPropagation(); onToggleAssemblyCollapse(); }}
                className="inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded border transition-colors flex-shrink-0 ml-1"
                style={{ borderColor: "#f97316", color: "#f97316", background: "transparent" }}
                title={isCollapsedAssembly ? "Pokaż składniki zestawu" : "Ukryj składniki zestawu"}
              >
                {isCollapsedAssembly
                  ? <><ChevronRight className="w-2.5 h-2.5" />Pokaż</>
                  : <><ChevronDown  className="w-2.5 h-2.5" />Ukryj</>
                }
              </button>
            )}
            {/* Virtual expand for AI-triggered ZESTAW (template-driven, no real DB children) */}
            {isAssemblyOverride && !isAssemblyChild && !onToggleAssemblyCollapse && (
              <button
                onClick={(e) => { e.stopPropagation(); setIsVirtualExpanded(v => !v); }}
                className="inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded border transition-colors flex-shrink-0 ml-1"
                style={!isVirtualExpanded
                  ? { borderColor: "#f97316", color: "#f97316", background: "transparent" }
                  : { borderColor: "#fb923c", color: "#9a3412", background: "rgb(255 237 213 / 0.7)" }
                }
                title={!isVirtualExpanded ? "Pokaż składniki zestawu (szablon AI)" : "Ukryj składniki zestawu"}
              >
                {!isVirtualExpanded
                  ? <><ChevronRight className="w-2.5 h-2.5" />Pokaż</>
                  : <><ChevronDown  className="w-2.5 h-2.5" />Ukryj</>
                }
              </button>
            )}
          </div>
        )}
      </TableCell>

      {/* Name — always display mode; editing values reflected via displayItem */}
      <TableCell
        className={`min-w-[180px] xs:min-w-[200px] md:w-[40%] ${singleCellBorderClass} ${!isEditing && !isFinal ? "cursor-pointer" : ""}`}
        onDoubleClick={() => { if (!isEditing && !isFinal) onStartEdit(item); }}
      >
        <div className="flex items-start gap-1 sm:gap-2">
          {isAssemblyChild && <span className="text-slate-400 dark:text-slate-600 mr-1 mt-0.5">↳</span>}
          <div className="flex-1 min-w-0">
            <div className={cn(
              "font-medium dark:text-slate-200 break-words",
              compactView ? "text-xs" : "text-sm sm:text-base",
              isAssemblyChild && (compactView ? "text-[11px]" : "text-xs sm:text-sm") + " text-slate-600 dark:text-slate-400",
            )}>
              {isZeroPrice && !isEditing && (
                <span
                  title="Brak danych cenowych — wymagana ręczna weryfikacja. Ustaw cenę przed wygenerowaniem PDF."
                  className="inline-flex items-center gap-0.5 mr-1 sm:mr-2 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-700 cursor-help"
                >
                  <AlertTriangle className="w-2.5 h-2.5 flex-shrink-0" />
                  <span>Uzupełnij</span>
                </span>
              )}
              {isAmbiguous && !isEditing && (
                <span
                  title="ES-Engine: Zbyt ogólny opis. Podaj konkretne materiały, aby uzyskać rzetelną wycenę"
                  className="inline-flex items-center gap-0.5 mr-1 px-1 py-0.5 rounded text-[8px] font-bold bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 cursor-help"
                >
                  <Flag className="w-2.5 h-2.5" />
                  Wymaga doprecyzowania
                </span>
              )}
              {!isEditing && !isAssemblyChild && (() => {
                const scm = detectSmartContext(item.name);
                if (scm.category === "NONE") return null;
                const hasExpansion = scm.category === "ZESTAW" || scm.category === "BIALY_MONTAZ" || scm.category === "TRASY";
                const colorCls = {
                  ZESTAW:      "bg-orange-100 dark:bg-orange-900/60 text-orange-600 dark:text-orange-400 ring-orange-300 dark:ring-orange-700 hover:bg-orange-200 dark:hover:bg-orange-800/80 hover:shadow-[0_0_6px_rgba(234,88,12,0.45)]",
                  BIALY_MONTAZ:"bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 ring-emerald-300 dark:ring-emerald-700 hover:bg-emerald-200 dark:hover:bg-emerald-800/80",
                  TRASY:       "bg-cyan-100 dark:bg-cyan-900/60 text-cyan-600 dark:text-cyan-400 ring-cyan-300 dark:ring-cyan-700 hover:bg-cyan-200 dark:hover:bg-cyan-800/80",
                  ROZDZIELNICA:"bg-violet-100 dark:bg-violet-900/60 text-violet-600 dark:text-violet-400 ring-violet-300 dark:ring-violet-700 hover:bg-violet-200 dark:hover:bg-violet-800/80",
                  NONE: "",
                }[scm.category];
                const iconBtn = (
                  <button
                    type="button"
                    className={`inline-flex items-center justify-center w-4 h-4 rounded-full flex-shrink-0 ring-1 transition-all duration-150 mr-1 ${colorCls} ${hasExpansion ? "cursor-pointer" : "cursor-help"}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Zap className="w-2.5 h-2.5" />
                  </button>
                );
                const tooltipLabel = hasExpansion
                  ? `ES-Engine: ${scm.validationLabel} — kliknij, aby zobaczyć zestaw`
                  : `ES-Engine: ${scm.validationLabel}`;
                if (!hasExpansion) {
                  return (
                    <TooltipProvider delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>{iconBtn}</TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-[240px] text-xs z-50">{tooltipLabel}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                }
                return (
                  <Popover open={zapOpen} onOpenChange={setZapOpen}>
                    <TooltipProvider delayDuration={300}>
                      <Tooltip>
                        <PopoverTrigger asChild>
                          <TooltipTrigger asChild>{iconBtn}</TooltipTrigger>
                        </PopoverTrigger>
                        <TooltipContent side="bottom" className="max-w-[240px] text-xs z-50">{tooltipLabel}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <PopoverContent side="bottom" align="start" className="p-0 w-auto border-orange-200 dark:border-orange-800 shadow-lg">
                      <SmartAssemblyPanel
                        itemName={item.name}
                        quantity={item.quantity}
                        sector={projectSector}
                        laborRate={projectLaborRate}
                        knrMultiplier={knrMultiplier}
                        itemId={item.id}
                        projectId={item.project_id}
                        initialOverrides={item.assembly_overrides ?? null}
                      />
                    </PopoverContent>
                  </Popover>
                );
              })()}
              {item.origin_id && (() => {
                const ot = (item as { origin_type?: string | null }).origin_type;
                const isAggregate = ot === "panel_consumable" || ot === "panel_busbar" || ot === "panel_assembly";
                const tip = isAggregate ? "Akcesoria rozdzielnicy (Zestaw — agregat)" : "Pozycja z konfiguratora rozdzielnicy";
                const color = isAggregate ? "text-violet-400 dark:text-violet-500" : "text-indigo-400 dark:text-indigo-500";
                return (
                  <span title={tip} className="inline-flex items-center mr-1">
                    <Shield className={`w-3 h-3 flex-shrink-0 ${color}`} />
                  </span>
                );
              })()}
              {highlightText(isEditing ? editingState!.name : item.name)}
            </div>
            {(isEditing ? editingState!.section : item.section) && !isAssemblyChild && (
              <span className="inline-block mt-0.5 px-1.5 py-0 rounded text-[9px] font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                {isEditing ? editingState!.section : item.section}
              </span>
            )}
            {!isEditing && brainBill && brainCtx && !isAssemblyChild && showHints && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); brainCtx.openForItem(item.id); }}
                title="Material Brain: kliknij, aby zobaczyć sugestie materiałów"
                className="inline-flex items-center gap-0.5 mt-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300 dark:border-amber-700 hover:bg-amber-200 dark:hover:bg-amber-800/50 transition-colors cursor-pointer"
              >
                ✨ {brainBill.bill.items.length} mat.
              </button>
            )}
            {!isEditing && isKplWarning && !compactView && (
              <div className="mt-0.5 text-[9px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-0.5">
                <span>⚠️</span>
                <span>Jednostka &apos;kpl&apos; przy ilości {item.quantity} — sprawdź czy to nie metry/sztuki</span>
              </div>
            )}
            {!compactView && (
              <div className="xs:hidden text-xs text-muted-foreground mt-1">Jedn: {item.unit}</div>
            )}
          </div>
        </div>
      </TableCell>

      {/* Unit — display with displayItem (live preview) */}
      <RowUnitCell
        item={displayItem} editingState={editingState} isEditing={false}
        onEditingChange={onEditingChange} onKeyDown={handleKeyDown}
      />

      {/* Quantity — display with displayItem */}
      <RowQuantityCell
        item={displayItem} editingState={editingState} isEditing={false}
        onEditingChange={onEditingChange} onKeyDown={handleKeyDown}
      />

      {/* Material price — display with displayItem */}
      {showMaterialsColumn && (
        <RowMaterialCell
          item={displayItem} editingState={editingState} isEditing={false}
          isPro={showPrices} compactView={compactView} colorMode={colorMode}
          materialsOwnedByCustomer={materialsOwnedByCustomer}
          materialUnit={materialUnit} materialTotal={materialTotal}
          materialUnitBase={materialUnitBase}
          adjustmentMultiplier={adjustmentMultiplier}
          bruttoMode={bruttoMode} vatRate={vatRate}
          onEditingChange={onEditingChange} onKeyDown={handleKeyDown} dp={roundPrice}
          useCustomRates={useCustomRates}
          onGlobalFallbackAction={onGlobalFallbackAction}
          isFallbackLoading={fallbackLoadingIds?.has(item.id) ?? false}
          isFinal={isFinal}
          isReadOnly={isReadOnly}
          />
      )}

      {/* Labor price — display with displayItem */}
      {showLaborColumn && (
        <RowLaborCell
          item={displayItem} editingState={editingState} isEditing={false}
          isPro={showPrices} compactView={compactView} colorMode={colorMode}
          laborUnit={laborUnit} laborTotal={laborTotal}
          laborUnitBase={laborUnitBase}
          adjustmentMultiplier={adjustmentMultiplier}
          bruttoMode={bruttoMode} vatRate={vatRate}
          onEditingChange={onEditingChange} onKeyDown={handleKeyDown} dp={roundPrice}
        />
      )}

      {/* KNR code column */}
      {showKnrCol && <RowKnrCell item={item} compactView={compactView} />}

      {/* R-G column — _parts/RowInputs */}
      {showRgCol && (
        <RowRgCell
          item={item}
          colorMode={colorMode}
          onGlobalFallbackAction={(!isFinal && !isReadOnly) ? onGlobalFallbackAction : undefined}
          isLoading={fallbackLoadingIds?.has(item.id)}
          assemblyNorm={assemblyRBHPerUnit}
          laborRate={projectLaborRate}
        />
      )}

      {/* Row total */}
      <RowTotalCell
        materialUnit={materialUnit}
        laborUnit={laborUnit}
        rowTotal={rowTotal}
        confidenceLevel={item.confidence_level}
        isPro={showPrices}
        compactView={compactView}
        colorMode={colorMode}
        bruttoMode={bruttoMode}
        vatRate={vatRate}
        adjustmentMultiplier={adjustmentMultiplier}
        item={item}
        regionModifier={regionModifier}
      />

      {/* Actions — _parts/RowActions */}
      <RowActions
        item={item}
        isEditing={false}
        isFinal={isFinal}
        isReadOnly={isReadOnly}
        compactView={compactView}
        isZestaw={isZestaw}
        isAssemblyOverride={isAssemblyOverride}
        onSaveEdit={onSaveEdit}
        onCancelEdit={onCancelEdit}
        onStartEdit={onStartEdit}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        onStartAddChild={onStartAddChild}
      />
    </TableRow>

    {/* ── Virtual Assembly Rows (AI-triggered ZESTAW only, no real DB children) ── */}
    {isAssemblyOverride && isVirtualExpanded && (() => {
      const vExp = expandToAssembly(item.name, item.quantity, projectSector, projectLaborRate, knrMultiplier, item.assembly_overrides ?? undefined);
      if (!vExp.triggered) return null;
      return vExp.items.map((vRow, idx) => {
        const vMat = vRow.isLabor ? 0 : roundPrice(vRow.materialTotal * adjustmentMultiplier);
        const vLab = vRow.isLabor ? roundPrice(vRow.rbhTotal * projectLaborRate * regionModifier * adjustmentMultiplier) : 0;
        const vTotal = roundPrice(vMat + vLab);
        return (
          <TableRow
            key={`vrow-${item.id}-${idx}`}
            className="bg-orange-50/30 dark:bg-orange-950/15 hover:bg-orange-50/50 dark:hover:bg-orange-950/20 border-l-2 border-l-orange-300 dark:border-l-orange-800"
          >
            {/* Checkbox placeholder */}
            {!isFinal && !isReadOnly && (
              <TableCell className={`min-w-[36px] w-[36px] ${singleCellBorderClass}`} />
            )}
            {/* DnD placeholder */}
            {isDndEnabled && !isFinal && !isReadOnly && (
              <TableCell className={`min-w-[28px] w-[28px] ${singleCellBorderClass}`} />
            )}
            {/* Row # → ↳ */}
            <TableCell className={`text-center min-w-[40px] w-[40px] ${singleCellBorderClass}`}>
              <span className="text-orange-400 dark:text-orange-600 text-xs font-bold">↳</span>
            </TableCell>
            {/* Nazwa */}
            <TableCell className={`min-w-[180px] ${singleCellBorderClass}`}>
              <div className="pl-2 flex flex-col gap-0">
                <div className={cn("text-xs font-medium break-words",
                  colorMode ? "text-orange-700 dark:text-orange-300" : "text-slate-600 dark:text-slate-400"
                )}>
                  {vRow.isOverridden && (
                    <span className="mr-1 text-[9px] text-blue-500 font-bold">★</span>
                  )}
                  {vRow.label}
                </div>
                <div className="text-[9px] text-slate-400 dark:text-slate-500 font-mono">{vRow.knrCode}</div>
              </div>
            </TableCell>
            {/* Jedn. */}
            <TableCell className={`text-center min-w-[50px] w-[50px] ${singleCellBorderClass}`}>
              <span className="text-xs text-slate-400 dark:text-slate-500">{vRow.unit}</span>
            </TableCell>
            {/* Ilość */}
            <TableCell className={`text-center min-w-[80px] w-[80px] ${singleCellBorderClass}`}>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                {vRow.quantity % 1 === 0 ? vRow.quantity : vRow.quantity.toFixed(2)}
              </span>
            </TableCell>
            {/* Materiał */}
            {showMaterialsColumn && (
              <TableCell className={`text-right min-w-[120px] w-[120px] ${singleCellBorderClass} bg-amber-50/40 dark:bg-amber-950/10`}>
                {vMat > 0 ? (
                  <div className="space-y-0">
                    <div className={cn("text-[11px]", colorMode ? "text-amber-500 dark:text-amber-600" : "text-slate-400 dark:text-slate-500")}>
                      {showPrices ? `${vRow.materialPricePerUnit.toFixed(2)} /` : "***"}
                    </div>
                    <div className={cn("text-xs font-semibold", colorMode ? "text-amber-700 dark:text-amber-400" : "text-slate-700 dark:text-slate-200")}>
                      {showPrices ? `${vMat.toFixed(2)} zł` : "***"}
                    </div>
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-300 dark:text-slate-600">—</span>
                )}
              </TableCell>
            )}
            {/* Robocizna */}
            {showLaborColumn && (
              <TableCell className={`text-right min-w-[120px] w-[120px] ${singleCellBorderClass} bg-emerald-50/40 dark:bg-emerald-950/10`}>
                {vLab > 0 ? (
                  <div className="space-y-0">
                    <div className={cn("text-[11px]", colorMode ? "text-emerald-500 dark:text-emerald-600" : "text-slate-400 dark:text-slate-500")}>
                      {`${vRow.rbhPerUnit.toFixed(3)} rbh/jm`}
                    </div>
                    <div className={cn("text-xs font-semibold", colorMode ? "text-emerald-700 dark:text-emerald-400" : "text-slate-700 dark:text-slate-200")}>
                      {showPrices ? `${vLab.toFixed(2)} zł` : "***"}
                    </div>
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-300 dark:text-slate-600">—</span>
                )}
              </TableCell>
            )}
            {/* RBH (Czas pracy) */}
            {showRgCol && (
              <TableCell className={`text-right min-w-[90px] w-[90px] ${singleCellBorderClass}`}>
                {vRow.isLabor && vRow.rbhTotal > 0 ? (
                  <span className={cn("text-xs font-medium", colorMode ? "text-blue-700 dark:text-blue-400" : "text-slate-500 dark:text-slate-400")}>
                    {(item.quantity > 0 ? vRow.rbhTotal / item.quantity : 0).toFixed(3)} rbh/{item.unit ?? "szt"}
                  </span>
                ) : null}
              </TableCell>
            )}
            {/* KNR */}
            {showKnrCol && (
              <TableCell className={`min-w-[110px] w-[110px] ${singleCellBorderClass}`}>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono">{vRow.knrCode}</span>
              </TableCell>
            )}
            {/* Suma */}
            <TableCell className={`text-right min-w-[90px] w-[90px] ${singleCellBorderClass}`}>
              <div className={cn("text-xs font-semibold", colorMode ? "text-slate-700 dark:text-slate-200" : "text-slate-700 dark:text-slate-200")}>
                {showPrices ? `${vTotal.toFixed(2)} zł` : "***"}
              </div>
            </TableCell>
            {/* Akcje — open parent SmartAssemblyPanel for editing component overrides */}
            {!isFinal && !isReadOnly && (
              <TableCell className={`min-w-[80px] w-[80px] ${singleCellBorderClass} text-center`}>
                <button
                  onClick={(e) => { e.stopPropagation(); setZapOpen(true); }}
                  className="p-1 rounded text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/40 transition-colors"
                  title="Edytuj składniki zestawu w panelu AI"
                >
                  <PenLine className="w-3.5 h-3.5" />
                </button>
              </TableCell>
            )}
          </TableRow>
        );
      });
    })()}

    {/* ── Edit Panel Row ── */}
    {isEditing && (
      <TableRow
        className="hover:bg-transparent dark:hover:bg-transparent border-0"
        style={{ transform: `translateY(${compactView ? -1 : -2}px)` }}
      >
        <TableCell colSpan={20} className="p-0 px-2 pb-2.5 border-b border-slate-200 dark:border-slate-700">
          <div className="rounded-b-lg border border-t-0 border-blue-400/60 dark:border-blue-600 shadow-lg overflow-hidden">
            {/* Header bar */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800">
              <PenLine className="w-3.5 h-3.5 text-white/80 flex-shrink-0" />
              <span className="text-[11px] font-medium text-white/90 truncate flex-1">Edycja pozycji</span>
              <button type="button" onClick={onSaveEdit}
                className="flex items-center gap-1 px-3 py-1 rounded-md bg-white/20 hover:bg-white/30 text-white text-[11px] font-semibold transition-colors">
                <Check className="w-3 h-3" />Zapisz
              </button>
              <button type="button" onClick={onCancelEdit}
                className="p-1 rounded-md bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Form body */}
            <div className="bg-white dark:bg-slate-900 px-4 py-3 space-y-3">
              {/* Row 1: Nazwa + Sekcja */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">Nazwa pozycji</label>
                <Input
                  type="text"
                  value={editingState!.name}
                  onChange={(e) => onEditingChange({ ...editingState!, name: e.target.value })}
                  className="h-9 text-sm font-medium dark:bg-slate-950 dark:border-slate-700 dark:text-white"
                  placeholder="Nazwa pozycji"
                  autoFocus
                  onKeyDown={handleKeyDown}
                />
                {!isAssemblyChild && (
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide flex-shrink-0">Sekcja:</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button type="button" className={cn(
                          "flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium border transition-all",
                          editingState!.section
                            ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700 hover:bg-purple-200 dark:hover:bg-purple-800/50"
                            : "bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 hover:border-purple-300 hover:text-purple-500"
                        )}>
                          <LayoutGrid className="w-2.5 h-2.5 flex-shrink-0" />
                          <span className="max-w-[120px] truncate">{editingState!.section || "Wybierz sekcję"}</span>
                          <ChevronDown className="w-2.5 h-2.5 flex-shrink-0 opacity-60" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-44 p-1.5 shadow-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" side="bottom" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                        <div className="px-2 pt-1 pb-1.5 text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Pomieszczenie</div>
                        <div className="space-y-0.5">
                          {[...SECTION_PRESETS, ...uniqueSections.filter(s => !SECTION_PRESETS.includes(s))].map((s) => (
                            <button key={s} type="button"
                              onClick={() => onEditingChange({ ...editingState!, section: editingState!.section === s ? "" : s })}
                              className={cn(
                                "flex items-center justify-between w-full px-2 py-1.5 rounded text-[10px] font-medium transition-all",
                                editingState!.section === s ? "bg-purple-600 text-white" : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                              )}>
                              <span>{s}</span>
                              {editingState!.section === s && <Check className="w-3 h-3 flex-shrink-0 ml-1" />}
                            </button>
                          ))}
                        </div>
                        <div className="border-t border-slate-100 dark:border-slate-800 mt-1.5 pt-1.5 px-0.5 space-y-1">
                          <Input type="text" value={editingState!.section}
                            onChange={(e) => onEditingChange({ ...editingState!, section: e.target.value })}
                            className="h-7 text-[10px] px-2 dark:bg-slate-950 dark:border-slate-700 dark:text-white"
                            placeholder="Własna nazwa..."
                          />
                          {editingState!.section && (
                            <button type="button" onClick={() => onEditingChange({ ...editingState!, section: "" })}
                              className="flex items-center gap-0.5 w-full justify-center text-[9px] text-slate-400 hover:text-red-500 transition-colors py-0.5">
                              <X className="w-2.5 h-2.5" />Wyczyść sekcję
                            </button>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>

              {/* Row 2: Jm + Ilość (+ prices for non-zestaw rows) */}
              {(isAssemblyOverride || editingState!.isAssemblyParent || isSmartItem) ? (
                /* Zestaw parent (both manual and AI): only Jedn. + Ilość — no price editing */
                <div className="grid grid-cols-[80px_90px] gap-2 items-end">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">Jedn.</label>
                    <Input type="text" list={`unit-presets-panel-${item.id}`}
                      value={editingState!.unit}
                      onChange={(e) => onEditingChange({ ...editingState!, unit: e.target.value })}
                      className="h-9 text-sm text-center dark:bg-slate-950 dark:border-slate-700 dark:text-white"
                      placeholder="szt" onKeyDown={handleKeyDown}
                    />
                    <datalist id={`unit-presets-panel-${item.id}`}>
                      {UNIT_PRESETS.map((u) => <option key={u} value={u} />)}
                    </datalist>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">Ilość</label>
                    <Input type="number" step="0.01" min="0.01"
                      value={editingState!.quantity}
                      onChange={(e) => onEditingChange({ ...editingState!, quantity: e.target.value })}
                      className="h-9 text-sm text-center dark:bg-slate-950 dark:border-slate-700 dark:text-white"
                      onKeyDown={handleKeyDown}
                    />
                  </div>
                </div>
              ) : (
                /* Regular row: Jedn. + Ilość + Material + Robocizna */
                <div className="grid grid-cols-[80px_90px_1fr_1fr] gap-2 items-end">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">Jedn.</label>
                    <Input type="text" list={`unit-presets-panel-${item.id}`}
                      value={editingState!.unit}
                      onChange={(e) => onEditingChange({ ...editingState!, unit: e.target.value })}
                      className="h-9 text-sm text-center dark:bg-slate-950 dark:border-slate-700 dark:text-white"
                      placeholder="szt" onKeyDown={handleKeyDown}
                    />
                    <datalist id={`unit-presets-panel-${item.id}`}>
                      {UNIT_PRESETS.map((u) => <option key={u} value={u} />)}
                    </datalist>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">Ilość</label>
                    <Input type="number" step="0.01" min="0.01"
                      value={editingState!.quantity}
                      onChange={(e) => onEditingChange({ ...editingState!, quantity: e.target.value })}
                      className="h-9 text-sm text-center dark:bg-slate-950 dark:border-slate-700 dark:text-white"
                      onKeyDown={handleKeyDown}
                    />
                  </div>
                  {showMaterialsColumn && !materialsOwnedByCustomer ? (
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 block">Materiał (zł/jm.)</label>
                      {showPrices ? (
                        <Input type="number" step="0.01" min="0"
                          value={editingState!.materialPrice}
                          onChange={(e) => onEditingChange({ ...editingState!, materialPrice: e.target.value })}
                          className="h-9 text-sm text-right dark:bg-slate-950 dark:border-slate-700 dark:text-white"
                          placeholder="0.00" onKeyDown={handleKeyDown}
                        />
                      ) : (
                        <div className="h-9 flex items-center justify-end border rounded-md px-3 bg-muted text-sm font-medium opacity-40 select-none tracking-widest">***</div>
                      )}
                    </div>
                  ) : <div />}
                  {showLaborColumn ? (
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 block">Robocizna (zł/jm.)</label>
                      {showPrices ? (
                        <Input type="number" step="0.01" min="0"
                          value={editingState!.laborPrice}
                          onChange={(e) => onEditingChange({ ...editingState!, laborPrice: e.target.value })}
                          className="h-9 text-sm text-right dark:bg-slate-950 dark:border-slate-700 dark:text-white"
                          placeholder="0.00" onKeyDown={handleKeyDown}
                        />
                      ) : (
                        <div className="h-9 flex items-center justify-end border rounded-md px-3 bg-muted text-sm font-medium opacity-40 select-none tracking-widest">***</div>
                      )}
                    </div>
                  ) : <div />}
                </div>
              )}

              {/* ── Embedded SmartAssemblyPanel for ZESTAW items ── */}
              {isAssemblyOverride && projectSector && (
                <div className="border-t border-orange-200 dark:border-orange-800 pt-3 mt-1">
                  <SmartAssemblyPanel
                    itemName={item.name}
                    quantity={parseFloat(editingState!.quantity) || item.quantity}
                    sector={projectSector}
                    laborRate={projectLaborRate}
                    knrMultiplier={knrMultiplier}
                    itemId={item.id}
                    projectId={item.project_id}
                    initialOverrides={item.assembly_overrides ?? null}
                  />
                </div>
              )}
            </div>
          </div>
        </TableCell>
      </TableRow>
    )}
    </>
  );
});
