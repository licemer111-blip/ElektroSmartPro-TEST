"use client";

import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CheckSquare, Square, GripVertical, Shield, Flag, ChevronDown, ChevronRight, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { UNIT_PRESETS } from "@/lib/validations";
import { calcRowPrices } from "@/lib/pricing-calculations";
import type { ProjectItem } from "@/lib/types/database";
import { roundPrice, useGlobalSettings } from "@/hooks/use-global-settings";
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
  onGlobalFallback?: (itemId: string) => void;
  fallbackLoadingIds?: Set<string>;
}

const SECTION_PRESETS = [
  "Kuchnia", "Łazienka", "Salon", "Sypialnia", "Korytarz",
  "Garaż", "Piwnica", "Taras", "Zewnętrzne", "Ogólne",
];

const singleCellBorderClass = "border border-slate-300 dark:border-slate-700 bg-clip-padding";

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
  onGlobalFallback,
  fallbackLoadingIds,
}: EstimateRowProps) {
  // Blur strictly controlled by is_pro from Supabase — no client-side override
  const showPrices = isPro;
  // Sacred Table principle: Cena/Suma columns are ALWAYS netto (with negocjacje, without VAT).
  // bruttoMode only affects the Summary panel — never the table cells.
  const dp = (netto: number) => roundPrice(netto);
  const isEditing = editingState?.itemId === item.id;
  const isAssemblyChild = item.is_assembly_child === true;
  const isZestaw = isAssemblyParent && !isAssemblyChild;

  // Prices — use editing values when in edit mode
  const editMat = isEditing ? (parseFloat(editingState!.materialPrice) || 0) : 0;
  const editLab = isEditing ? (parseFloat(editingState!.laborPrice) || 0) : 0;
  const displayItem: ProjectItem = isEditing
    ? {
        ...item,
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

  const {
    materialUnitBase, laborUnitBase, materialTotalBase, laborTotalBase,
    materialUnit, laborUnit, materialTotal, laborTotal, rowTotal,
  } = calcRowPrices(
    displayItem,
    adjustmentMultiplier,
    materialsOwnedByCustomer,
    filterType,
    regionModifier,
  );

  const isZeroPrice = (
    (displayItem.final_material_price ?? displayItem.material_price ?? 0) +
    (displayItem.final_labor_price ?? displayItem.labor_price ?? 0)
  ) === 0;

  const isManualPrice = displayItem.confidence_level === "manual";
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
    <TableRow
      ref={searchRef}
      className={cn(`group ${rowBgClass}`, isCurrentMatch && "ring-2 ring-blue-500 ring-inset", !isDndEnabled && "select-none")}
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
            : isZestaw ? "text-orange-600 dark:text-orange-400" : "text-blue-600 dark:text-blue-400"
          )}>
            {rowNumber}
            {isZestaw && onToggleAssemblyCollapse && (
              <button
                onClick={(e) => { e.stopPropagation(); onToggleAssemblyCollapse(); }}
                className="inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded border transition-colors flex-shrink-0 ml-1"
                style={isCollapsedAssembly
                  ? { borderColor: "#f97316", color: "#f97316", background: "transparent" }
                  : { borderColor: "#fb923c", color: "#9a3412", background: "rgb(255 237 213 / 0.7)" }
                }
                title={isCollapsedAssembly ? "Pokaż składniki zestawu" : "Ukryj składniki zestawu"}
              >
                {isCollapsedAssembly
                  ? <><ChevronRight className="w-2.5 h-2.5" />Pokaż</>
                  : <><ChevronDown  className="w-2.5 h-2.5" />Ukryj</>
                }
              </button>
            )}
          </div>
        )}
      </TableCell>

      {/* Name */}
      <TableCell
        className={`min-w-[180px] xs:min-w-[200px] md:w-[40%] ${singleCellBorderClass} ${!isEditing && !isFinal ? "cursor-pointer" : ""}`}
        onDoubleClick={() => { if (!isEditing && !isFinal) onStartEdit(item); }}
      >
        {isEditing ? (
          <div className={isAssemblyChild ? "pl-8" : ""}>
            <Input
              type="text"
              id={`name-${item.id}`}
              name={`name-${item.id}`}
              value={editingState!.name}
              onChange={(e) => onEditingChange({ ...editingState!, name: e.target.value })}
              className="font-medium dark:bg-slate-950 dark:border-slate-700 dark:text-white"
              placeholder="Nazwa pozycji"
              autoFocus
              onKeyDown={handleKeyDown}
            />
            {!isAssemblyChild && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide flex-shrink-0">Sekcja:</span>
                <div className="flex items-center gap-1 flex-wrap min-w-0">
                  {[...SECTION_PRESETS, ...uniqueSections.filter(s => !SECTION_PRESETS.includes(s))].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => onEditingChange({ ...editingState!, section: editingState!.section === s ? "" : s })}
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[9px] font-medium transition-all border",
                        editingState!.section === s
                          ? "bg-purple-600 text-white border-purple-600"
                          : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-purple-300 hover:text-purple-600"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                  <Input
                    type="text"
                    id={`section-${item.id}`}
                    name={`section-${item.id}`}
                    value={editingState!.section}
                    onChange={(e) => onEditingChange({ ...editingState!, section: e.target.value })}
                    className="h-5 text-[9px] w-20 px-1.5 dark:bg-slate-950 dark:border-slate-700 dark:text-white rounded-full"
                    placeholder="własna..."
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-start gap-1 sm:gap-2">
            {isAssemblyChild && <span className="text-slate-400 dark:text-slate-600 mr-1 mt-0.5">↳</span>}
            <div className="flex-1 min-w-0">
              <div className={cn(
                "font-medium dark:text-slate-200 break-words",
                compactView ? "text-xs" : "text-sm sm:text-base",
                isAssemblyChild && (compactView ? "text-[11px]" : "text-xs sm:text-sm") + " text-slate-600 dark:text-slate-400",
              )}>
                {isZeroPrice && (
                  <span
                    title="Brak danych cenowych — wymagana ręczna weryfikacja. Ustaw cenę przed wygenerowaniem PDF."
                    className="inline-flex items-center gap-0.5 mr-1 sm:mr-2 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-700 cursor-help"
                  >
                    <AlertTriangle className="w-2.5 h-2.5 flex-shrink-0" />
                    <span>Uzupełnij</span>
                  </span>
                )}
                {isAmbiguous && (
                  <span
                    title="ES-Engine: Zbyt ogólny opis. Podaj konkretne materiały, aby uzyskać rzetelną wycenę"
                    className="inline-flex items-center gap-0.5 mr-1 px-1 py-0.5 rounded text-[8px] font-bold bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 cursor-help"
                  >
                    <Flag className="w-2.5 h-2.5" />
                    Wymaga doprecyzowania
                  </span>
                )}
                {item.origin_id && (() => {
                  const ot = (item as { origin_type?: string | null }).origin_type;
                  const isAggregate = ot === "panel_consumable" || ot === "panel_busbar" || ot === "panel_assembly";
                  const tip = isAggregate
                    ? "Akcesoria rozdzielnicy (Zestaw — agregat)"
                    : "Pozycja z konfiguratora rozdzielnicy";
                  const color = isAggregate
                    ? "text-violet-400 dark:text-violet-500"
                    : "text-indigo-400 dark:text-indigo-500";
                  return (
                    <span title={tip} className="inline-flex items-center mr-1">
                      <Shield className={`w-3 h-3 flex-shrink-0 ${color}`} />
                    </span>
                  );
                })()}
                {highlightText(item.name)}
              </div>
              {item.section && !isAssemblyChild && (
                <span className="inline-block mt-0.5 px-1.5 py-0 rounded text-[9px] font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                  {item.section}
                </span>
              )}
              {/* Material Brain badge — visible only in Klient+Materiały mode + Podpowiedzi ES ON */}
              {brainBill && brainCtx && !isAssemblyChild && showHints && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); brainCtx.openForItem(item.id); }}
                  title="Material Brain: kliknij, aby zobaczyć sugestie materiałów"
                  className="inline-flex items-center gap-0.5 mt-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300 dark:border-amber-700 hover:bg-amber-200 dark:hover:bg-amber-800/50 transition-colors cursor-pointer"
                >
                  ✨ {brainBill.bill.items.length} mat.
                </button>
              )}
              {isKplWarning && !compactView && (
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
        )}
      </TableCell>

      {/* Unit — _parts/RowInputs */}
      <RowUnitCell
        item={item} editingState={editingState} isEditing={isEditing}
        onEditingChange={onEditingChange} onKeyDown={handleKeyDown}
      />

      {/* Quantity — _parts/RowInputs */}
      <RowQuantityCell
        item={item} editingState={editingState} isEditing={isEditing}
        onEditingChange={onEditingChange} onKeyDown={handleKeyDown}
      />

      {/* Material price — shows EffectiveUnitPrice (with negocjacje) as main figure */}
      {showMaterialsColumn && (
        <RowMaterialCell
          item={item} editingState={editingState} isEditing={isEditing}
          isPro={showPrices} compactView={compactView} colorMode={colorMode}
          materialsOwnedByCustomer={materialsOwnedByCustomer}
          materialUnit={materialUnit} materialTotal={materialTotal}
          materialUnitBase={materialUnitBase}
          adjustmentMultiplier={adjustmentMultiplier}
          bruttoMode={bruttoMode} vatRate={vatRate}
          onEditingChange={onEditingChange} onKeyDown={handleKeyDown} dp={roundPrice}
          useCustomRates={useCustomRates}
          onGlobalFallback={onGlobalFallback}
          isFallbackLoading={fallbackLoadingIds?.has(item.id) ?? false}
          isFinal={isFinal}
          isReadOnly={isReadOnly}
          />
      )}

      {/* Labor price — shows EffectiveUnitPrice (with negocjacje) as main figure */}
      {showLaborColumn && (
        <RowLaborCell
          item={item} editingState={editingState} isEditing={isEditing}
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
          onGlobalFallback={(!isFinal && !isReadOnly) ? onGlobalFallback : undefined}
          isLoading={fallbackLoadingIds?.has(item.id)}
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
        isEditing={isEditing}
        isFinal={isFinal}
        isReadOnly={isReadOnly}
        compactView={compactView}
        isZestaw={isZestaw}
        onSaveEdit={onSaveEdit}
        onCancelEdit={onCancelEdit}
        onStartEdit={onStartEdit}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        onStartAddChild={onStartAddChild}
      />
    </TableRow>
  );
});
