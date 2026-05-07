"use client";

import React, { useState, useTransition } from "react";
import { Zap, Hammer, Package, ArrowRight, Info, Pencil, RotateCcw, Check, X, Loader2 } from "lucide-react";
import {
  expandToAssembly,
  SECTOR_LABELS,
  type ProjectSector,
  type SmartExpansionResult,
  type AssemblyOverrides,
} from "@/lib/ai/smart-mapping-engine";
import { saveAssemblyOverrides } from "@/app/dashboard/projects/[id]/_actions/project-items";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SmartAssemblyPanelProps {
  itemName: string;
  quantity: number;
  sector: ProjectSector;
  laborRate: number;
  knrMultiplier: number;
  /** Project item ID — required for saving overrides. */
  itemId?: string;
  /** Project ID — required for saving overrides. */
  projectId?: string;
  /** Existing overrides from project_items.assembly_overrides. */
  initialOverrides?: AssemblyOverrides | null;
  /** When true, material rows are hidden (Tylko Robocizna mode). */
  materialsOwnedByCustomer?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SmartAssemblyPanel({
  itemName,
  quantity,
  sector,
  laborRate,
  knrMultiplier,
  itemId,
  projectId,
  initialOverrides,
  materialsOwnedByCustomer = false,
}: SmartAssemblyPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftOverrides, setDraftOverrides] = useState<AssemblyOverrides>(initialOverrides ?? {});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const result = expandToAssembly(itemName, quantity, sector, laborRate, knrMultiplier, isEditing ? draftOverrides : (initialOverrides ?? undefined));
  // In edit mode, get FULL template (without disabled filter) so deleted items can be restored
  const fullResult = expandToAssembly(itemName, quantity, sector, laborRate, knrMultiplier, undefined);

  if (!result.triggered || !fullResult.triggered) {
    return (
      <div className="p-3 text-xs text-slate-500 flex items-center gap-1.5">
        <Info className="w-3.5 h-3.5 flex-shrink-0" />
        Brak definicji zestawu dla tej pozycji.
      </div>
    );
  }

  const expansion = result as SmartExpansionResult;
  const fullExpansion = fullResult as SmartExpansionResult;
  const rbhPerPoint = quantity > 0 ? expansion.totalRBH / quantity : expansion.totalRBH;
  const unitLabel = expansion.context.category === "TRASY" ? "mb" : expansion.context.category === "ROZDZIELNICA" ? "kpl" : "pkt";
  const canEdit = !!itemId && !!projectId;
  const hasOverrides = Object.keys(isEditing ? draftOverrides : (initialOverrides ?? {})).length > 0;

  function handleFieldChange(label: string, field: "qtyMultiplier" | "materialPricePerUnit" | "rbhPerUnit", raw: string) {
    const val = parseFloat(raw);
    setDraftOverrides(prev => {
      const existing = prev[label] ?? {};
      return { ...prev, [label]: { ...existing, [field]: isNaN(val) ? undefined : val } };
    });
  }

  function getFieldValue(label: string, field: "qtyMultiplier" | "materialPricePerUnit" | "rbhPerUnit", templateDefault: number): string {
    const ov = draftOverrides[label];
    const v = ov?.[field];
    return v !== undefined ? String(v) : String(templateDefault);
  }

  function handleSave() {
    if (!canEdit) return;
    setSaveError(null);
    // Remove entries where all fields are undefined (clean up); keep disabled=true entries
    const cleaned: AssemblyOverrides = {};
    for (const [lbl, ov] of Object.entries(draftOverrides)) {
      if (ov.disabled === true || ov.qtyMultiplier !== undefined || ov.materialPricePerUnit !== undefined || ov.rbhPerUnit !== undefined) {
        cleaned[lbl] = ov;
      }
    }
    startTransition(async () => {
      const res = await saveAssemblyOverrides(projectId!, itemId!, Object.keys(cleaned).length > 0 ? cleaned : null);
      if (res.error) {
        setSaveError(res.error);
      } else {
        setIsEditing(false);
      }
    });
  }

  function handleReset() {
    setDraftOverrides({});
    if (!canEdit) return;
    startTransition(async () => {
      await saveAssemblyOverrides(projectId!, itemId!, null);
      setIsEditing(false);
    });
  }

  function handleCancel() {
    setDraftOverrides(initialOverrides ?? {});
    setSaveError(null);
    setIsEditing(false);
  }

  // Template defaults by label (for input placeholders)
  const templateDefaults = Object.fromEntries(
    expansion.items.map(it => [it.label, it])
  );

  return (
    <div className="w-[420px] max-w-[96vw] p-0 text-xs">
      {/* Header */}
      <div className="flex items-start gap-2 px-3 pt-3 pb-2 bg-orange-50 dark:bg-orange-950/30 border-b border-orange-200 dark:border-orange-800 rounded-t-md">
        <Zap className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-orange-800 dark:text-orange-300 leading-tight">
            {expansion.templateName}
          </p>
          <p className="text-orange-600 dark:text-orange-400 mt-0.5 leading-tight">
            Sektor: {SECTOR_LABELS[expansion.sector]}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {hasOverrides && !isEditing && (
            <span className="text-[9px] font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-700">
              ★ Zmodyfik.
            </span>
          )}
          <span className="text-[9px] font-mono bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 px-1.5 py-0.5 rounded border border-orange-200 dark:border-orange-700">
            #{expansion.templateId.split("_").pop()}
          </span>
        </div>
      </div>

      {/* Confirmation message */}
      {!isEditing && (
        <div className="px-3 py-2 bg-amber-50 dark:bg-amber-950/20 border-b border-amber-100 dark:border-amber-900">
          <p className="text-amber-800 dark:text-amber-300 leading-snug">
            Rozpoznano{" "}
            <span className="font-semibold">&apos;{expansion.matchedKeyword}&apos;</span>{" "}
            dla sektora{" "}
            <span className="font-semibold">{SECTOR_LABELS[sector].split(" ")[0]}</span>.
            Zastosowano Zestaw{" "}
            <span className="font-mono font-semibold">#{expansion.templateId}</span>.
          </p>
        </div>
      )}

      {/* Edit mode header */}
      {isEditing && (
        <div className="px-3 py-2 bg-blue-50 dark:bg-blue-950/20 border-b border-blue-200 dark:border-blue-800">
          <p className="text-blue-700 dark:text-blue-300 font-semibold">Edycja składników zestawu</p>
          <p className="text-blue-500 dark:text-blue-400 text-[10px] mt-0.5">
            Zmień ilość (mb/szt/kpl) lub cenę materiału. Robocizna i materiały są osobno.
          </p>
        </div>
      )}

      {/* Ingredient table */}
      <div className="px-3 pt-2 pb-1">
        <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
          Składniki zestawu ({quantity} {unitLabel})
        </p>

        {!isEditing ? (
          /* ─── VIEW MODE ─── */
          <div className="space-y-0.5">
            {expansion.items.filter(it => !materialsOwnedByCustomer || it.isLabor).map((it, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-2 py-1 px-1.5 rounded ${
                  it.isLabor
                    ? "bg-green-50 dark:bg-green-950/20"
                    : "bg-orange-50 dark:bg-orange-950/20"
                } ${it.isOverridden ? "ring-1 ring-blue-300 dark:ring-blue-700" : ""}`}
              >
                {it.isLabor ? (
                  <Hammer className="w-2.5 h-2.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                ) : (
                  <Package className="w-2.5 h-2.5 text-orange-500 dark:text-orange-400 flex-shrink-0" />
                )}
                <span className="flex-1 min-w-0 truncate text-slate-700 dark:text-slate-300">
                  {it.label}
                  {it.isOverridden && (
                    <span className="ml-1 text-blue-500 dark:text-blue-400 text-[9px]">★</span>
                  )}
                </span>
                <span className="shrink-0 text-slate-400 dark:text-slate-500 text-[10px]">
                  {it.quantity.toFixed(1)} {it.unit}
                </span>
                <ArrowRight className="w-2 h-2 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                <span
                  className={`shrink-0 font-mono font-semibold text-[10px] ${
                    it.isLabor
                      ? "text-green-700 dark:text-green-400"
                      : "text-orange-600 dark:text-orange-400"
                  }`}
                >
                  {it.isLabor
                    ? `${it.rbhTotal.toFixed(3)} rbh = ${(it.rbhTotal * laborRate).toFixed(2)} zł`
                    : `${it.materialTotal.toFixed(2)} zł`}
                </span>
              </div>
            ))}
          </div>
        ) : (
          /* ─── EDIT MODE ─── */
          <div className="space-y-1">
            {fullExpansion.items.filter(it => !materialsOwnedByCustomer || it.isLabor).map((it, idx) => {
              const def = templateDefaults[it.label];
              const isDisabled = draftOverrides[it.label]?.disabled === true;
              const isOv = draftOverrides[it.label] !== undefined && !isDisabled;
              return (
                <div
                  key={idx}
                  className={`rounded border px-2 py-1.5 ${
                    isDisabled
                      ? "bg-slate-100 dark:bg-slate-800/40 border-slate-300 dark:border-slate-700 opacity-50"
                      : it.isLabor
                        ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                        : "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800"
                  } ${isOv ? "ring-1 ring-blue-400 dark:ring-blue-600" : ""}`}
                >
                  <div className="flex items-center gap-1 mb-1">
                    {it.isLabor ? (
                      <Hammer className="w-2.5 h-2.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                    ) : (
                      <Package className="w-2.5 h-2.5 text-orange-500 dark:text-orange-400 flex-shrink-0" />
                    )}
                    <span className={`font-medium truncate flex-1 min-w-0 ${
                      isDisabled ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-700 dark:text-slate-300"
                    }`}>
                      {it.label}
                    </span>
                    {isDisabled ? (
                      <button
                        onClick={() => {
                          setDraftOverrides(prev => {
                            const next = { ...prev };
                            delete next[it.label];
                            return next;
                          });
                        }}
                        className="text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
                        title="Przywróć pozycję"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                      </button>
                    ) : (
                      <>
                        {isOv && (
                          <button
                            onClick={() => {
                              setDraftOverrides(prev => {
                                const next = { ...prev };
                                delete next[it.label];
                                return next;
                              });
                            }}
                            className="text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
                            title="Przywróć domyślne dla tej pozycji"
                          >
                            <RotateCcw className="w-2.5 h-2.5" />
                          </button>
                        )}
                        <button
                          onClick={() => setDraftOverrides(prev => ({ ...prev, [it.label]: { ...prev[it.label], disabled: true } }))}
                          className="text-slate-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 transition-colors"
                          title="Usuń tę pozycję z zestawu"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </>
                    )}
                  </div>
                  {!isDisabled && <div className="flex gap-2">
                    {/* qty multiplier: editable for all items */}
                    <div className="flex-1">
                      <label className="text-[9px] text-slate-400 dark:text-slate-500 block mb-0.5">
                        Ilość/{unitLabel} ({def?.unit ?? it.unit})
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={getFieldValue(it.label, "qtyMultiplier", quantity > 0 ? it.quantity / quantity : it.quantity)}
                        onChange={e => handleFieldChange(it.label, "qtyMultiplier", e.target.value)}
                        className="w-full text-[11px] px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-400"
                      />
                    </div>
                    {/* rbhPerUnit: for labor items */}
                    {it.isLabor && (
                      <div className="flex-1">
                        <label className="text-[9px] text-slate-400 dark:text-slate-500 block mb-0.5">
                          rbh/jm (norma)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={getFieldValue(it.label, "rbhPerUnit", it.rbhPerUnit)}
                          onChange={e => handleFieldChange(it.label, "rbhPerUnit", e.target.value)}
                          className="w-full text-[11px] px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-400"
                        />
                        <span className="text-[9px] text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                          = {(parseFloat(getFieldValue(it.label, "rbhPerUnit", it.rbhPerUnit)) * laborRate).toFixed(2)} zł/jm
                        </span>
                      </div>
                    )}
                    {/* materialPricePerUnit: for material items */}
                    {!it.isLabor && (
                      <div className="flex-1">
                        <label className="text-[9px] text-slate-400 dark:text-slate-500 block mb-0.5">
                          Cena/jm (PLN)
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={getFieldValue(it.label, "materialPricePerUnit", it.materialPricePerUnit)}
                          onChange={e => handleFieldChange(it.label, "materialPricePerUnit", e.target.value)}
                          className="w-full text-[11px] px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-400"
                        />
                      </div>
                    )}
                  </div>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Totals */}
      <div className="px-3 pb-3 pt-2 border-t border-slate-100 dark:border-slate-800 mt-1 space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="text-slate-500 dark:text-slate-400">Łączny nakład robocizny:</span>
          <span className="font-semibold font-mono text-slate-800 dark:text-slate-200">
            {expansion.totalRBH.toFixed(2)} rbh
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-500 dark:text-slate-400">
            Na {unitLabel} ({rbhPerPoint.toFixed(3)} rbh/{unitLabel}):
          </span>
          <span className="font-semibold text-green-700 dark:text-green-400">
            {expansion.totalLaborPLN.toFixed(2)} zł rob.
          </span>
        </div>
        {!materialsOwnedByCustomer && expansion.totalMaterialPLN > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400">Materiały szacunkowe:</span>
            <span className="font-semibold text-orange-600 dark:text-orange-400">
              ~{expansion.totalMaterialPLN.toFixed(2)} zł mat.
            </span>
          </div>
        )}

        {/* Edit mode actions */}
        {isEditing ? (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={isPending}
              className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-semibold disabled:opacity-60 transition-colors"
            >
              {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              Zapisz
            </button>
            <button
              onClick={handleReset}
              disabled={isPending}
              className="flex items-center gap-1 px-2 py-1 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded text-[11px] disabled:opacity-60 transition-colors"
              title="Przywróć wszystkie wartości domyślne"
            >
              <RotateCcw className="w-3 h-3" />
              Resetuj
            </button>
            <button
              onClick={handleCancel}
              disabled={isPending}
              className="flex items-center gap-1 px-2 py-1 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded text-[11px] disabled:opacity-60 transition-colors"
            >
              <X className="w-3 h-3" />
              Anuluj
            </button>
            {saveError && (
              <span className="text-red-500 text-[10px] ml-1">{saveError}</span>
            )}
          </div>
        ) : (
          <div className="pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
            <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-tight flex-1">
              Formuła: Σ(RBH × KNR×{knrMultiplier.toFixed(2)} × ilość). Stawka: {laborRate} PLN/rbh.
            </p>
            {canEdit && (
              <button
                onClick={() => { setDraftOverrides(initialOverrides ?? {}); setIsEditing(true); }}
                className="flex items-center gap-1 px-2 py-1 rounded border border-orange-300 dark:border-orange-700 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/40 text-[10px] font-semibold transition-colors flex-shrink-0"
                title="Edytuj skład zestawu"
              >
                <Pencil className="w-2.5 h-2.5" />
                Edytuj
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
