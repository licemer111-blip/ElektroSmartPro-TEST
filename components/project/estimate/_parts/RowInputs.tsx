"use client";

import React, { useTransition, useState } from "react";
import { TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BlurredPrice } from "@/components/ui/blurred-price";
import { ConfidenceDot, UncertainPriceWarning } from "@/components/project/estimate/ConfidenceBadge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { UNIT_PRESETS } from "@/lib/validations";
import type { ProjectItem } from "@/lib/types/database";
import type { EditingState } from "@/components/project/estimate/EstimateRow";
import { useGlobalSettings } from "@/hooks/use-global-settings";
import { Search, Loader2, ShieldCheck, AlertCircle, Info, RotateCcw, Building2, X } from "lucide-react";
import { updateProjectItem } from "@/app/dashboard/projects/[id]/_actions/project-items";
import { resetItemNormToKnr } from "@/app/dashboard/projects/[id]/_actions/project-items-labor";

const singleCellBorderClass = "border border-slate-300 dark:border-slate-700 bg-clip-padding align-top";

export interface RowInputsProps {
  item: ProjectItem;
  editingState: EditingState | null;
  isEditing: boolean;
  isPro: boolean;
  compactView: boolean;
  colorMode: boolean;
  showMaterialsColumn: boolean;
  showLaborColumn: boolean;
  showRgCol: boolean;
  materialsOwnedByCustomer: boolean;
  isReadOnly?: boolean;
  isFinal?: boolean;
  materialUnit: number;      // effective (after negocjacje)
  laborUnit: number;         // effective (after negocjacje)
  materialUnitBase?: number; // base netto before negocjacje
  laborUnitBase?: number;    // base netto before negocjacje
  materialTotal: number;
  laborTotal: number;
  adjustmentMultiplier?: number;
  bruttoMode?: boolean;
  vatRate?: number;
  onEditingChange: (state: EditingState) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  dp: (netto: number) => number;
  /** Tryb Własny is active — show 'Szukaj w KNR/AI' button for zero-price items */
  useCustomRates?: boolean;
  /** Callback for single-row global fallback pricing */
  onGlobalFallbackAction?: (itemId: string) => void;
  /** Whether this item is currently being priced via global fallback */
  isFallbackLoading?: boolean;
}

// Hint shown below price inputs during editing
function PriceEditHint({
  adjustmentMultiplier,
  editingState,
}: {
  adjustmentMultiplier?: number;
  editingState?: import("@/components/project/estimate/EstimateRow").EditingState | null;
}) {
  const { priceInputMode } = useGlobalSettings();
  const adjPct = adjustmentMultiplier ? Math.round((adjustmentMultiplier - 1) * 100) : 0;

  const matVal = parseFloat(editingState?.materialPrice ?? "0") || 0;
  const qty = parseFloat(editingState?.quantity ?? "1") || 1;
  const isManualEntry = matVal > 0;

  if (isManualEntry) {
    const total = Math.round(matVal * qty * 100) / 100;
    return (
      <p className="text-[9px] text-violet-500 dark:text-violet-400 leading-tight mt-0.5 font-medium">
        ✏️ {matVal.toFixed(2)} × {qty} = {total.toFixed(2)} zł netto
      </p>
    );
  }

  if (priceInputMode === "with_narzuty") {
    return (
      <p className="text-[9px] text-violet-500 dark:text-violet-400 leading-tight mt-0.5 font-medium">
        Cena z narzutami
      </p>
    );
  }

  if (adjPct === 0) {
    return (
      <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-tight mt-0.5">
        Cena bazowa
      </p>
    );
  }
  return (
    <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-tight mt-0.5">
      Cena bazowa.
      <span className={cn("ml-1 font-semibold", adjPct > 0 ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400")}>
        Negocjacje: {adjPct > 0 ? "+" : ""}{adjPct}%
      </span>
    </p>
  );
}

export function RowUnitCell({
  item, editingState, isEditing, onEditingChange, onKeyDown,
}: Pick<RowInputsProps, "item" | "editingState" | "isEditing" | "onEditingChange" | "onKeyDown">) {
  return (
    <TableCell className={`text-center min-w-[50px] w-[50px] ${singleCellBorderClass}`}>
      {isEditing ? (
        <>
          <Input
            type="text"
            id={`unit-${item.id}`}
            list={`unit-presets-${item.id}`}
            name={`unit-${item.id}`}
            value={editingState!.unit}
            onChange={(e) => onEditingChange({ ...editingState!, unit: e.target.value })}
            className="w-16 text-center dark:bg-slate-950 dark:border-slate-700 dark:text-white"
            placeholder="szt"
            onKeyDown={onKeyDown}
          />
          <datalist id={`unit-presets-${item.id}`}>
            {UNIT_PRESETS.map((u) => <option key={u} value={u} />)}
          </datalist>
        </>
      ) : (
        <Badge variant="secondary" className="text-xs dark:bg-slate-800 dark:text-slate-300">
          {item.unit}
        </Badge>
      )}
    </TableCell>
  );
}

export function RowQuantityCell({
  item, editingState, isEditing, onEditingChange, onKeyDown,
}: Pick<RowInputsProps, "item" | "editingState" | "isEditing" | "onEditingChange" | "onKeyDown">) {
  return (
    <TableCell className={`text-center min-w-[80px] w-[80px] ${singleCellBorderClass}`}>
      {isEditing ? (
        <Input
          type="number" step="0.01" min="0.01"
          id={`qty-${item.id}`}
          name={`qty-${item.id}`}
          value={editingState!.quantity}
          onChange={(e) => onEditingChange({ ...editingState!, quantity: e.target.value })}
          className="w-20 text-center dark:bg-slate-950 dark:border-slate-700 dark:text-white"
          onKeyDown={onKeyDown}
        />
      ) : (
        <div className="font-medium dark:text-slate-200">{item.quantity}</div>
      )}
    </TableCell>
  );
}

export function RowMaterialCell({
  item, editingState, isEditing, isPro, compactView, colorMode,
  materialsOwnedByCustomer, materialUnit, materialUnitBase, materialTotal, onEditingChange, onKeyDown, dp, adjustmentMultiplier,
  bruttoMode = false, vatRate = 23,
  useCustomRates = false, onGlobalFallbackAction, isFallbackLoading = false,
  isReadOnly = false, isFinal = false,
}: Omit<RowInputsProps, "showMaterialsColumn" | "showLaborColumn" | "showRgCol" | "laborUnit" | "laborTotal" | "laborUnitBase" | "materialUnit"> & { materialUnit: number }) {
  const [isPending, startTransition] = useTransition();
  const showPrices = isPro;
  const bMult = bruttoMode ? (1 + vatRate / 100) : 1;
  const matUnitDisp = dp(materialUnit * bMult);
  const matTotalDisp = dp(materialTotal * bMult);
  if (!true) return null; // consumed by parent conditional

  const isInvestorMat = item.is_investor_material === true;
  const canToggleInvestor = !isEditing && !materialsOwnedByCustomer && !isReadOnly && !isFinal;

  function handleToggleInvestor(e: React.MouseEvent) {
    e.stopPropagation();
    startTransition(async () => {
      await updateProjectItem(item.project_id, item.id, {
        is_investor_material: !isInvestorMat,
      });
    });
  }

  // "Szukaj w KNR/AI" button condition: Tryb Własny active + zero price + no KNR source
  const showGlobalFallbackBtn = useCustomRates
    && !materialsOwnedByCustomer
    && !isEditing
    && !isInvestorMat
    && (item.material_price ?? 0) + (item.labor_price ?? 0) === 0
    && !item.knr_source
    && !item.knr_code
    && !!onGlobalFallbackAction;

  if (materialsOwnedByCustomer) {
    return (
      <TableCell className={cn(
        `text-right min-w-[120px] w-[120px] ${singleCellBorderClass}`,
        colorMode ? "bg-amber-50/50 dark:bg-amber-950/10" : "bg-slate-50/50 dark:bg-slate-900/10",
        "opacity-50",
      )}>
        <div className="text-xs text-slate-400 dark:text-slate-600 italic">Klient</div>
      </TableCell>
    );
  }

  if (isInvestorMat && !isEditing) {
    return (
      <TableCell className={cn(
        `text-right min-w-[120px] w-[120px] ${singleCellBorderClass}`,
        "bg-emerald-50/80 dark:bg-emerald-950/30 shadow-[inset_0_0_0_1px_theme(colors.emerald.200)] dark:shadow-[inset_0_0_0_1px_theme(colors.emerald.800/60)]",
        isPending && "opacity-60",
      )}>
        <div className="flex flex-col items-end gap-0.5">
          <div className="flex items-center gap-1">
            <Building2 className="w-3 h-3 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 tracking-wide uppercase">Inwestor</span>
            {canToggleInvestor && (
              <button
                onClick={handleToggleInvestor}
                disabled={isPending}
                title="Usuń flagę Materiał Inwestora"
                className="ml-0.5 rounded-full p-0.5 text-emerald-300 hover:text-red-500 dark:text-emerald-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
          <span className="text-[9px] text-emerald-500 dark:text-emerald-500 italic">Tylko robocizna</span>
        </div>
      </TableCell>
    );
  }

  return (
    <TableCell className={cn(
      `text-right min-w-[120px] w-[120px] ${singleCellBorderClass}`,
      colorMode ? "bg-amber-50/50 dark:bg-amber-950/10" : "bg-slate-50/50 dark:bg-slate-900/10",
    )}>
      {isEditing ? (
        editingState!.isAssemblyParent ? (
          <div className="text-xs text-slate-400 dark:text-slate-500 italic text-center">auto</div>
        ) : (
          <div className="space-y-1">
            {showPrices ? (
              <Input
                type="number" step="0.01" min="0"
                id={`mat-${item.id}`}
                name={`mat-${item.id}`}
                value={editingState!.materialPrice}
                onChange={(e) => onEditingChange({ ...editingState!, materialPrice: e.target.value })}
                className="w-24 text-right dark:bg-slate-950 dark:border-slate-700 dark:text-white bg-white/80"
                placeholder="0.00"
                onKeyDown={onKeyDown}
              />
            ) : (
              <div className="w-24 text-right text-sm font-medium opacity-40 select-none tracking-widest">***</div>
            )}
            <PriceEditHint adjustmentMultiplier={adjustmentMultiplier} editingState={editingState} />
            <div className={cn("text-xs font-medium", colorMode ? "text-amber-700 dark:text-amber-400" : "text-slate-700 dark:text-slate-400")}>
              <BlurredPrice value={dp(materialTotal)} isPro={showPrices} />
            </div>
          </div>
        )
      ) : showGlobalFallbackBtn ? (
        <div className="flex flex-col items-end gap-1">
          {isFallbackLoading ? (
            <div className="flex items-center gap-1 text-blue-500">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="text-[9px]">Szukam...</span>
            </div>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onGlobalFallbackAction!(item.id); }}
              className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline cursor-pointer transition-colors"
              title="Pomiń katalog osobisty i wycen z KNR/AI"
            >
              <Search className="w-3 h-3" />
              <span>Szukaj w KNR/AI</span>
            </button>
          )}
          <span className="text-[8px] text-slate-400 dark:text-slate-500">brak w P1</span>
        </div>
      ) : compactView ? (
        <div className="flex flex-col items-end gap-0.5">
          <div className={cn("flex items-center justify-end gap-1", colorMode ? "text-amber-700 dark:text-amber-400" : "text-slate-700 dark:text-slate-300")}>
            {(item.confidence_level || item.knr_code) && item.confidence_level !== "manual" && materialUnit > 0 && (
              <ConfidenceDot
                level={item.confidence_level ?? "uncertain"}
                note={item.confidence_note}
                knrSource={item.knr_source}
                knrCode={item.knr_code}
              />
            )}
            {item.confidence_level === "uncertain" && !item.knr_code ? (
              <UncertainPriceWarning />
            ) : (
              <div className="flex flex-col items-end leading-tight">
                <span className="text-[10px] text-muted-foreground">
                  <BlurredPrice value={matUnitDisp} isPro={showPrices} /> /
                </span>
                <span className="text-xs font-semibold">
                  <BlurredPrice value={matTotalDisp} isPro={showPrices} />
                </span>
              </div>
            )}
          </div>
          {canToggleInvestor && (
            <button
              onClick={handleToggleInvestor}
              disabled={isPending}
              title="Oznacz jako Materiał Inwestora (mat. = 0)"
              className="opacity-50 group-hover:opacity-100 flex items-center gap-0.5 text-[8px] font-semibold text-orange-500 dark:text-orange-400 hover:text-orange-600 dark:hover:text-orange-300 transition-all hover:drop-shadow-[0_0_6px_theme(colors.orange.400)] hover:[text-shadow:0_0_8px_theme(colors.orange.400)]"
            >
              <Building2 className="w-2.5 h-2.5 group-hover:drop-shadow-[0_0_4px_theme(colors.orange.400)]" />
              <span>Inwestor</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-0.5">
          {item.confidence_level === "uncertain" ? (
            <UncertainPriceWarning note={item.confidence_note} />
          ) : (
            <>
              {/* jedn. — small gray */}
              <div className={cn("flex items-center justify-end gap-1 text-[11px]", colorMode ? "text-amber-500 dark:text-amber-600" : "text-slate-400 dark:text-slate-500")}>
                {(item.confidence_level || item.knr_code) && item.confidence_level !== "manual" && materialUnit > 0 && (
                  <ConfidenceDot
                    level={item.confidence_level ?? "uncertain"}
                    note={item.confidence_note}
                    knrSource={item.knr_source}
                    knrCode={item.knr_code}
                    className="mt-px"
                  />
                )}
                <BlurredPrice value={matUnitDisp} isPro={showPrices} /> /
              </div>
              {/* Base price indicator when negocjacje are active */}
              {materialUnitBase !== undefined && Math.abs(materialUnit - materialUnitBase) >= 0.01 && (
                <div className="text-[9px] text-slate-400 dark:text-slate-500 text-right">
                  Baza: {materialUnitBase.toFixed(2)} zł
                </div>
              )}
              {/* suma — bold large */}
              <div className={cn("text-sm font-semibold", colorMode ? "text-amber-700 dark:text-amber-400" : "text-slate-800 dark:text-slate-100")}>
                <BlurredPrice value={matTotalDisp} isPro={showPrices} />
              </div>
              {bruttoMode && showPrices && (
                <div className="text-[9px] text-slate-400 dark:text-slate-500 text-right">
                  netto: {dp(materialTotal).toFixed(2)} zł
                </div>
              )}
              {/* Investor toggle — visible on row hover */}
              {canToggleInvestor && (
                <button
                  onClick={handleToggleInvestor}
                  disabled={isPending}
                  title="Oznacz jako Materiał Inwestora (mat. = 0)"
                  className="opacity-50 group-hover:opacity-100 flex items-center gap-0.5 text-[8px] font-semibold text-orange-500 dark:text-orange-400 hover:text-orange-600 dark:hover:text-orange-300 transition-all mt-0.5 hover:drop-shadow-[0_0_6px_theme(colors.orange.400)] hover:[text-shadow:0_0_8px_theme(colors.orange.400)]"
                >
                  <Building2 className="w-2.5 h-2.5" />
                  <span>Inwestor</span>
                </button>
              )}
            </>
          )}
        </div>
      )}
    </TableCell>
  );
}

export function RowLaborCell({
  item, editingState, isEditing, isPro, compactView, colorMode,
  laborUnit, laborUnitBase, laborTotal, onEditingChange, onKeyDown, dp, adjustmentMultiplier,
  bruttoMode = false, vatRate = 23,
}: Omit<RowInputsProps, "showMaterialsColumn" | "showLaborColumn" | "showRgCol" | "materialUnit" | "materialTotal" | "materialsOwnedByCustomer" | "materialUnitBase" | "laborUnit"> & { laborUnit: number }) {
  const showPrices = isPro;
  const bMult = bruttoMode ? (1 + vatRate / 100) : 1;
  const labUnitDisp = dp(laborUnit * bMult);
  const labTotalDisp = dp(laborTotal * bMult);

  return (
    <TableCell className={cn(
      `text-right min-w-[120px] w-[120px] ${singleCellBorderClass}`,
      colorMode ? "bg-emerald-50/50 dark:bg-emerald-950/10" : "bg-slate-50/50 dark:bg-slate-900/10",
    )}>
      {isEditing ? (
        editingState!.isAssemblyParent ? (
          <div className="text-xs text-slate-400 dark:text-slate-500 italic text-center">auto</div>
        ) : (
          <div className="space-y-1">
            {showPrices ? (
              <Input
                type="number" step="0.01" min="0"
                id={`lab-${item.id}`}
                name={`lab-${item.id}`}
                value={editingState!.laborPrice}
                onChange={(e) => onEditingChange({ ...editingState!, laborPrice: e.target.value })}
                className="w-24 text-right dark:bg-slate-950 dark:border-slate-700 dark:text-white bg-white/80"
                placeholder="0.00"
                onKeyDown={onKeyDown}
              />
            ) : (
              <div className="w-24 text-right text-sm font-medium opacity-40 select-none tracking-widest">***</div>
            )}
            <PriceEditHint adjustmentMultiplier={adjustmentMultiplier} editingState={editingState} />
          </div>
        )
      ) : compactView ? (
        <div className={cn("flex items-center justify-end gap-1", colorMode ? "text-emerald-700 dark:text-emerald-400" : "text-slate-700 dark:text-slate-300")}>
          {(item.confidence_level || item.knr_code) && item.confidence_level !== "manual" && laborUnit > 0 && (
            <ConfidenceDot
              level={item.confidence_level ?? "uncertain"}
              note={item.confidence_note}
              knrSource={item.knr_source}
              knrCode={item.knr_code}
            />
          )}
          <div className="flex flex-col items-end leading-tight">
            <span className="text-[10px] text-muted-foreground">
              <BlurredPrice value={labUnitDisp} isPro={showPrices} /> /
            </span>
            <span className="text-xs font-semibold">
              <BlurredPrice value={labTotalDisp} isPro={showPrices} />
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-0.5">
          {/* jedn. — small gray + ConfidenceDot left */}
          <div className={cn("flex items-center justify-end gap-1 text-[11px]", colorMode ? "text-emerald-500 dark:text-emerald-600" : "text-slate-400 dark:text-slate-500")}>
            {(item.confidence_level || item.knr_code) && item.confidence_level !== "manual" && laborUnit > 0 && (
              <ConfidenceDot
                level={item.confidence_level ?? "uncertain"}
                note={item.confidence_note}
                knrSource={item.knr_source}
                knrCode={item.knr_code}
                className="mt-px"
              />
            )}
            <BlurredPrice value={labUnitDisp} isPro={showPrices} /> /
          </div>
          {/* Base price indicator when negocjacje are active */}
          {laborUnitBase !== undefined && Math.abs(laborUnit - laborUnitBase) >= 0.01 && (
            <div className="text-[9px] text-slate-400 dark:text-slate-500 text-right">
              Baza: {laborUnitBase.toFixed(2)} zł
            </div>
          )}
          {/* suma — bold large */}
          <div className={cn("text-sm font-semibold", colorMode ? "text-emerald-700 dark:text-emerald-400" : "text-slate-800 dark:text-slate-100")}>
            <BlurredPrice value={labTotalDisp} isPro={showPrices} />
          </div>
          {bruttoMode && showPrices && (
            <div className="text-[9px] text-slate-400 dark:text-slate-500 text-right">
              netto: {dp(laborTotal).toFixed(2)} zł
            </div>
          )}
        </div>
      )}
    </TableCell>
  );
}

export function RowRgCell({
  item, colorMode, onGlobalFallbackAction, isLoading, assemblyNorm, laborRate = 0,
}: { item: ProjectItem; colorMode: boolean; onGlobalFallbackAction?: (id: string) => void; isLoading?: boolean; assemblyNorm?: number | null; laborRate?: number }) {
  const [isPending, startTransition] = useTransition();
  const [confirmReset, setConfirmReset] = useState(false);

  const handleReset = () => {
    if (!confirmReset) { setConfirmReset(true); setTimeout(() => setConfirmReset(false), 3000); return; }
    setConfirmReset(false);
    startTransition(() => {
      resetItemNormToKnr(item.project_id, item.id).catch(() => {});
    });
  };

  return (
    <TableCell className={`text-right min-w-[90px] w-[90px] ${singleCellBorderClass} ${colorMode ? "bg-blue-50/40 dark:bg-blue-950/10" : ""}`}>
      {item.confidence_level !== "manual" && (assemblyNorm != null ? assemblyNorm > 0 : (item.labor_norm != null && item.labor_norm > 0)) ? (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1">
            {item.norm_protected && (
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleReset}
                      disabled={isPending}
                      className={`shrink-0 rounded transition-colors ${
                        confirmReset
                          ? "text-rose-500 dark:text-rose-400"
                          : "text-emerald-500 hover:text-amber-500 dark:hover:text-amber-400"
                      }`}
                      title={confirmReset ? "Kliknij ponownie, aby potwierdzić" : "Norma chroniona — kliknij, aby zresetować do KNR"}
                    >
                      {isPending
                        ? <Loader2 className="w-2.5 h-2.5 animate-spin" />
                        : confirmReset
                          ? <RotateCcw className="w-2.5 h-2.5" />
                          : <ShieldCheck className="w-2.5 h-2.5" />}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="text-xs max-w-[180px]">
                    {confirmReset
                      ? "⚠️ Kliknij ponownie — norma zostanie usunięta i odblokowana"
                      : "Norma chroniona. Kliknij, aby zresetować do KNR"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <span className={`text-xs font-medium ${colorMode ? "text-blue-700 dark:text-blue-400" : "text-slate-600 dark:text-slate-400"}`}>
              {(assemblyNorm ?? item.labor_norm!).toFixed(3)} rbh/{item.unit ?? "szt"}
              {assemblyNorm != null && <span className="ml-0.5 text-[9px] text-orange-500" title="Suma norm zestawu"> Σ</span>}
            </span>
            {(() => {
              const knrUnitMatch = item.confidence_note?.match(/\[KNR:\s*([^\]]+)\]/);
              if (!knrUnitMatch) return null;
              const knrUnit = knrUnitMatch[1].trim();
              return (
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-2.5 h-2.5 text-sky-500 dark:text-sky-400 shrink-0 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="left" className="text-xs max-w-[200px]">
                      Norma przeliczona z jednostki KNR ({knrUnit})
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })()}
          </div>
          {laborRate > 0 && (
            <div className={`text-[10px] font-medium ${colorMode ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}`}>
              = {((assemblyNorm ?? item.labor_norm!) * laborRate).toFixed(2)} zł/{item.unit ?? "szt"}
            </div>
          )}
          {item.labor_hours_total != null && (
            <div className={`text-[10px] ${colorMode ? "text-blue-500 dark:text-blue-500" : "text-slate-400 dark:text-slate-500"}`}>
              Σ {item.labor_hours_total.toFixed(2)} rbh
              {laborRate > 0 && (
                <span className="ml-1 text-emerald-600 dark:text-emerald-400">
                  ({(item.labor_hours_total * laborRate).toFixed(2)} zł)
                </span>
              )}
            </div>
          )}
          {(() => {
            const sn = item.suggested_norm;
            const ln = item.labor_norm;
            if (!sn || !ln || sn <= 0) return null;
            const ratio = ln / sn;
            if (ratio >= 0.5 && ratio <= 2.0) return null;
            return (
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-0.5 text-[9px] text-amber-600 dark:text-amber-400 cursor-help">
                      <AlertCircle className="w-2.5 h-2.5 shrink-0" />
                      KNR: {sn.toFixed(3)}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="text-xs max-w-[180px]">
                    Zapisana norma ({ln.toFixed(3)} rbh) różni się od aktualnej bazy KNR ({sn.toFixed(3)} rbh). Przelicz pozycję lub zresetuj normę (ikona 🛡).
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })()}
        </div>
      ) : item.confidence_level !== "manual" && (item.labor_norm == null || item.labor_norm === 0) && Number(item.labor_price) > 0 ? (
        item.knr_code && onGlobalFallbackAction ? (
          <button
            onClick={() => onGlobalFallbackAction(item.id)}
            disabled={isLoading}
            title="Uzupełnij normę RBH z KNR/AI"
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold text-white bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed animate-pulse shadow-[0_0_6px_rgba(6,182,212,0.6)] hover:shadow-[0_0_8px_rgba(6,182,212,0.9)] hover:animate-none"
          >
            {isLoading
              ? <Loader2 className="w-2.5 h-2.5 animate-spin" />
              : <Search className="w-2.5 h-2.5" />}
            RBH
          </button>
        ) : (
          <span className={`text-[9px] font-medium px-1 py-0.5 rounded ${colorMode ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}>
            Ryczałt
          </span>
        )
      ) : null}
    </TableCell>
  );
}
