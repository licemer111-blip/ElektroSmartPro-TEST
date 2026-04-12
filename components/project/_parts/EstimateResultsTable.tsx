"use client";

import React, { useState, useTransition, useMemo } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2, AlertTriangle, ShieldCheck, Sparkles, Zap, RefreshCw, PenLine, X, Check,
} from "lucide-react";
import { updateProjectItem } from "@/app/dashboard/projects/[id]/_actions/project-items";
import { repriceSingleItem } from "@/app/dashboard/projects/[id]/_ai_actions/pricing";
import { useKnrMultiplier } from "@/hooks/useKnrMultiplier";
import type { AiPriceEstimate } from "@/app/dashboard/projects/[id]/ai-actions";
import type { PriceMode } from "./useAiPriceEstimator";

interface EstimateResultsTableProps {
  estimates: AiPriceEstimate[];
  selectedIds: Set<string>;
  mode: PriceMode;
  pricedCount: number;
  unmatchedCount: number;
  refreshingIds: Set<string>;
  manualMatchItemId: string | null;
  manualMatchSearch: string;
  fullCatalog: Array<{ name: string; mat: number; lab: number; score: number }> | null;
  isLoadingCatalog: boolean;
  projectId: string;
  onToggleItem: (id: string) => void;
  onToggleAll: () => void;
  onApplyCertainOnly: () => void;
  onBack: () => void;
  onApply: () => void;
  onOpenManualMatch: (itemId: string) => Promise<void>;
  onManualMatchSearchChange: (v: string) => void;
  onApplyManualMatch: (itemId: string, cand: { name: string; mat: number; lab: number }) => void;
  onCloseManualMatch: () => void;
  onRepriced: (updated: AiPriceEstimate) => void;
  onAddToRefreshing: (id: string) => void;
  isApplying: boolean;
}

function formatPrice(price: number) {
  return price > 0 ? `${price.toFixed(2)} zł` : "—";
}

export function EstimateResultsTable({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  estimates, selectedIds, mode, pricedCount, unmatchedCount,
  refreshingIds, manualMatchItemId, manualMatchSearch, fullCatalog, isLoadingCatalog,
  projectId,
  onToggleItem, onToggleAll, onApplyCertainOnly, onBack, onApply,
  onOpenManualMatch, onManualMatchSearchChange, onApplyManualMatch, onCloseManualMatch,
  onRepriced, onAddToRefreshing, isApplying,
}: EstimateResultsTableProps) {
  const showMatCol = mode !== "labor";
  const showLabCol = mode !== "material";
  const ambiguousCount = estimates.filter(e => e.isAmbiguous).length;
  const interventionCount = ambiguousCount + unmatchedCount;
  const lowConfCount = estimates.filter(e =>
    !e.isAmbiguous &&
    e.trace !== "unmatched" &&
    e.confidence === "low"
  ).length;
  const { multiplier: knrMultiplier } = useKnrMultiplier();

  // Calculate selectedSummary locally with KNR multiplier
  const selectedSummary = useMemo(() => {
    const sel = estimates.filter(e => selectedIds.has(e.itemId));
    const totalMat = sel.reduce((s, e) => s + e.suggestedMaterial * e.quantity, 0);
    const totalLab = sel.reduce((s, e) => {
      const regionMod = e.regionModifier ?? 1.0;
      return s + e.suggestedLabor * regionMod * knrMultiplier * e.quantity;
    }, 0);
    return { totalMat, totalLab, total: totalMat + totalLab };
  }, [estimates, selectedIds, knrMultiplier]);

  // Inline editing state
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editMat, setEditMat] = useState("");
  const [editLab, setEditLab] = useState("");
  const [editSaving, startEditSave] = useTransition();
  const [editRepricing, startEditReprice] = useTransition();
  const [editError, setEditError] = useState<string | null>(null);

  const openInlineEdit = (est: AiPriceEstimate) => {
    setEditingRowId(est.itemId);
    setEditMat(est.suggestedMaterial > 0 ? String(est.suggestedMaterial) : "");
    setEditLab(est.suggestedLabor > 0 ? String(est.suggestedLabor) : "");
    setEditError(null);
  };

  const closeInlineEdit = () => {
    setEditingRowId(null);
    setEditError(null);
  };

  const handleInlineSave = (est: AiPriceEstimate) => {
    const mat = parseFloat(editMat.replace(",", ".")) || 0;
    const lab = parseFloat(editLab.replace(",", ".")) || 0;
    if (mat <= 0 && lab <= 0) { setEditError("Podaj przynajmniej jedną cenę"); return; }
    setEditError(null);
    onAddToRefreshing(est.itemId);
    startEditSave(async () => {
      const dbResult = await updateProjectItem(projectId, est.itemId, {
        final_material_price: mat,
        final_labor_price: lab,
        confidence_level: "manual",
      });
      if (dbResult?.error) {
        setEditError(dbResult.error);
        return;
      }
      onRepriced({
        ...est,
        suggestedMaterial: mat,
        suggestedLabor: lab,
        confidence: "high" as const,
        note: "Uściślone (cena ręczna)",
        isAmbiguous: false,
        knrCode: null,
        knrSource: null,
        laborNorm: null,
      });
      // Stay on the same row — don't close
    });
  };

  const handleInlineReprice = (est: AiPriceEstimate) => {
    setEditError(null);
    onAddToRefreshing(est.itemId);
    startEditReprice(async () => {
      const result = await repriceSingleItem({
        itemId: est.itemId,
        projectId,
        extraContext: undefined,
      });
      if (result.success && result.estimate) {
        onRepriced(result.estimate);
        setEditMat(String(result.estimate.suggestedMaterial));
        setEditLab(String(result.estimate.suggestedLabor));
      } else {
        setEditError(result.error ?? "Błąd przeliczenia");
      }
    });
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 space-y-3">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          {estimates.length} łącznie
        </Badge>
        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          {pricedCount} z ceną
        </Badge>
        {lowConfCount > 0 && (
          <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 gap-1">
            <Zap className="w-2.5 h-2.5" />
            {lowConfCount} Poza KNR
          </Badge>
        )}
        {interventionCount > 0 && (
          <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 gap-1">
            <Sparkles className="w-2.5 h-2.5" />
            {interventionCount} wymaga interwencji
          </Badge>
        )}
        <div className="flex items-center gap-1 ml-auto">
          <Button variant="outline" size="sm" onClick={onApplyCertainOnly} className="text-[10px] h-7 px-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400">
            Tylko pewne i średnie
          </Button>
          <Button variant="ghost" size="sm" onClick={onToggleAll} className="text-[10px] h-7 px-2">
            {selectedIds.size === estimates.length ? "Odznacz" : "Zaznacz"}
          </Button>
          <Button variant="outline" size="sm" onClick={onBack} className="text-[10px] h-7 px-2">
            Wróć
          </Button>
        </div>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-[10px] text-amber-700 dark:text-amber-300 flex-shrink-0">
        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
        <span>Wycena ekspercka ES-KNR — zweryfikuj kluczowe pozycje przed wysłaniem oferty. Odznacz pozycje, których nie chcesz aktualizować.</span>
      </div>

      {/* Table */}
      <ScrollArea className="flex-1 min-h-0 border rounded-lg">
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-900">
                <TableHead className="w-8 text-[10px]">
                  <Checkbox
                    checked={estimates.filter(e => !e.isAmbiguous).length > 0 && estimates.filter(e => !e.isAmbiguous).every(e => selectedIds.has(e.itemId))}
                    onCheckedChange={onToggleAll}
                  />
                </TableHead>
                <TableHead className="text-[10px] font-semibold">Nazwa pozycji</TableHead>
                <TableHead className="text-[10px] font-semibold w-12 text-center">Jm.</TableHead>
                <TableHead className="text-[10px] font-semibold w-10 text-center">Ilość</TableHead>
                {showMatCol && <TableHead className="text-[10px] font-semibold w-20 text-right">Mat./jm.</TableHead>}
                {showLabCol && <TableHead className="text-[10px] font-semibold w-20 text-right">Rob./jm.</TableHead>}
                <TableHead className="text-[10px] font-semibold w-24 text-right">Razem</TableHead>
                <TableHead className="text-[10px] font-semibold w-28">Kod KNR</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {estimates.map((est) => {
                const isSelected = selectedIds.has(est.itemId);
                const regionMod = est.regionModifier ?? 1.0;
                const laborWithRegion = Math.round(est.suggestedLabor * regionMod * knrMultiplier * 100) / 100;
                const totalPerUnit = est.suggestedMaterial + laborWithRegion;
                const totalAll = Math.round(totalPerUnit * est.quantity * 100) / 100;
                const materialChanged = est.suggestedMaterial !== est.currentMaterial;
                const laborChanged = est.suggestedLabor !== est.currentLabor;
                const isAmb = !!est.isAmbiguous;
                const isRefreshing = refreshingIds.has(est.itemId);
                const isRefined = !isAmb && !!(est.note?.startsWith("Uściślone"));

                // Unified row classification — single source of truth
                const rowType =
                  isRefreshing ? "refreshing" as const :
                  (isAmb || est.trace === "unmatched") ? "intervention" as const :
                  isRefined ? "refined" as const :
                  est.knrSource === "catalog-l1" ? "l1" as const :
                  est.knrSource === "official" ? "knr-a" as const :
                  est.knrSource === "es-synthetic" ? "knr-b" as const :
                  est.confidence === "low" ? "poza-knr" as const :
                  "matched" as const;

                const needsIntervention = rowType === "intervention";

                return (
                  <React.Fragment key={est.itemId}>
                  <TableRow
                    className={`cursor-pointer transition-colors ${
                      rowType === "refreshing" ? "bg-orange-50/40 dark:bg-orange-950/10 animate-pulse"
                      : needsIntervention ? "bg-violet-50/40 dark:bg-violet-950/10 border-l-2 border-l-violet-400"
                      : rowType === "refined" ? "bg-emerald-50/40 dark:bg-emerald-950/10 border-l-2 border-l-emerald-400"
                      : isSelected ? "bg-orange-50/50 dark:bg-orange-950/10"
                      : "opacity-60"
                    }`}
                    onClick={() => {
                      if (isRefreshing) return;
                      if (needsIntervention) { openInlineEdit(est); return; }
                      onToggleItem(est.itemId);
                    }}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        disabled={isRefreshing || needsIntervention}
                        onCheckedChange={() => {
                          if (isRefreshing || needsIntervention) return;
                          onToggleItem(est.itemId);
                        }}
                      />
                    </TableCell>

                    <TableCell>
                      <div className="flex items-start gap-1.5">
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate max-w-[230px]">{est.name}</p>
                          {isRefreshing ? (
                            <div className="flex items-center gap-1 mt-0.5">
                              <Loader2 className="w-2.5 h-2.5 animate-spin text-orange-500" />
                              <span className="text-[9px] text-orange-500">Przeliczam...</span>
                            </div>
                          ) : isRefined ? (
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                <Zap className="w-2.5 h-2.5" />Uściślone
                              </span>
                              <button
                                onClick={(e) => { e.stopPropagation(); openInlineEdit(est); }}
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-medium bg-slate-100 text-slate-500 hover:bg-blue-100 hover:text-blue-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 transition-colors"
                              >
                                <PenLine className="w-2.5 h-2.5" />
                                Koryguj
                              </button>
                            </div>
                          ) : (needsIntervention || rowType === "poza-knr") ? (
                            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                              <button
                                onClick={(e) => { e.stopPropagation(); openInlineEdit(est); }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-bold bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-900/30 dark:text-violet-400 border border-violet-300 dark:border-violet-700 transition-colors"
                              >
                                <PenLine className="w-2.5 h-2.5" />
                                Wyceń
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 mt-0.5">
                              {est.note && <p className="text-[9px] text-slate-400 italic truncate max-w-[160px]">{est.note}</p>}
                              <button
                                onClick={(e) => { e.stopPropagation(); openInlineEdit(est); }}
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-medium bg-slate-100 text-slate-500 hover:bg-blue-100 hover:text-blue-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 transition-colors flex-shrink-0"
                              >
                                <PenLine className="w-2.5 h-2.5" />
                                Koryguj
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-[10px] text-center">
                      <span className="text-slate-500">{est.unit}</span>
                    </TableCell>

                    <TableCell className="text-[10px] text-center text-slate-600 font-medium">{est.quantity}</TableCell>

                    {showMatCol && (
                      <TableCell className="text-right">
                        {isRefreshing ? <Loader2 className="w-3 h-3 animate-spin text-orange-400 ml-auto" />
                        : needsIntervention ? <span className="text-xs text-slate-400">—</span>
                        : materialChanged ? (
                          <div className="flex flex-col items-end gap-0">
                            <span className="text-[9px] text-slate-400 line-through">{formatPrice(est.currentMaterial)}</span>
                            <span className="text-xs font-semibold text-emerald-600">{formatPrice(est.suggestedMaterial)}</span>
                            {est.matSource === "ai-market" && (
                              <span className="text-[8px] text-amber-600 dark:text-amber-400 font-medium">~rynk.</span>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col items-end gap-0">
                            <span className="text-xs text-slate-400">{formatPrice(est.suggestedMaterial)}</span>
                            {est.matSource === "ai-market" && (
                              <span className="text-[8px] text-amber-600 dark:text-amber-400 font-medium">~rynk.</span>
                            )}
                          </div>
                        )}
                      </TableCell>
                    )}

                    {showLabCol && (
                      <TableCell className="text-right">
                        {isRefreshing ? <Loader2 className="w-3 h-3 animate-spin text-orange-400 ml-auto" />
                        : needsIntervention ? <span className="text-xs text-slate-400">—</span>
                        : laborChanged ? (
                          <div>
                            <span className="text-[9px] text-slate-400 line-through block">{formatPrice(est.currentLabor)}</span>
                            <span className="text-xs font-semibold text-blue-600">{formatPrice(laborWithRegion)}</span>
                            {regionMod !== 1.0 && (
                              <span className="text-[8px] text-slate-400">×{regionMod.toFixed(2)} reg.</span>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col items-end gap-0">
                            <span className="text-xs text-slate-400">{formatPrice(laborWithRegion)}</span>
                            {regionMod !== 1.0 && (
                              <span className="text-[8px] text-slate-400">×{regionMod.toFixed(2)} reg.</span>
                            )}
                          </div>
                        )}
                      </TableCell>
                    )}

                    <TableCell className="text-right">
                      {isRefreshing ? <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-400 ml-auto" />
                      : needsIntervention ? <span className="text-xs text-slate-400">—</span>
                      : isRefined ? (
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{totalAll.toFixed(2)} zł</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); openInlineEdit(est); }}
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-100 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-slate-800 dark:text-slate-400 transition-colors"
                          >
                            <PenLine className="w-2.5 h-2.5" />Edytuj
                          </button>
                        </div>
                      ) : (
                        <div>
                          <span className="text-[9px] text-slate-400 block">{formatPrice(totalPerUnit)}/jm.</span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{formatPrice(totalAll)}</span>
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        {needsIntervention ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 w-fit">
                            <AlertTriangle className="w-2.5 h-2.5" />Wymaga wyceny
                          </span>
                        ) : rowType === "l1" ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 w-fit">
                            <ShieldCheck className="w-2.5 h-2.5" />L1 · Twój Katalog
                          </span>
                        ) : rowType === "knr-a" ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 w-fit">
                            <ShieldCheck className="w-2.5 h-2.5" />KNR Baza A
                          </span>
                        ) : rowType === "knr-b" ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 w-fit">
                            KNR Baza B
                          </span>
                        ) : rowType === "poza-knr" ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 w-fit">
                            <Zap className="w-2.5 h-2.5" />Poza KNR · ES-Engine 2
                          </span>
                        ) : null}
                        {est.knrCode && est.knrSource && !needsIntervention && (
                          <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 leading-tight">
                            {est.knrCode}
                            {est.laborNorm != null && <span className="block text-[8px] text-slate-400">r-g: {est.laborNorm}</span>}
                          </span>
                        )}
                        {!est.knrCode && !est.knrSource && !needsIntervention && <span className="text-[9px] text-slate-300 dark:text-slate-600">—</span>}
                      </div>
                    </TableCell>

                  </TableRow>

                  {/* ── Inline Edit Panel ── */}
                  {editingRowId === est.itemId && (
                    <TableRow className="hover:bg-transparent border-0">
                      <TableCell colSpan={20} className="p-0 border-b border-blue-200 dark:border-blue-700">
                        <div className="bg-slate-50 dark:bg-slate-900/80 px-4 py-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 truncate max-w-[300px]">
                              {est.name}
                              <span className="ml-1.5 text-slate-400 font-normal">× {est.quantity} {est.unit}</span>
                            </p>
                            <button onClick={closeInlineEdit} className="p-0.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex items-end gap-2">
                            {showMatCol && (
                              <div className="space-y-0.5 flex-1 max-w-[140px]">
                                <label className="text-[9px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">Materiał (zł/jm.)</label>
                                <Input
                                  type="number" step="0.01" min="0"
                                  value={editMat}
                                  onChange={(e) => setEditMat(e.target.value)}
                                  className="h-8 text-xs text-right"
                                  placeholder="0.00"
                                  autoFocus
                                  onKeyDown={(e) => { if (e.key === "Enter") handleInlineSave(est); if (e.key === "Escape") closeInlineEdit(); }}
                                />
                              </div>
                            )}
                            {showLabCol && (
                              <div className="space-y-0.5 flex-1 max-w-[140px]">
                                <label className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Robocizna (zł/jm.)</label>
                                <Input
                                  type="number" step="0.01" min="0"
                                  value={editLab}
                                  onChange={(e) => setEditLab(e.target.value)}
                                  className="h-8 text-xs text-right"
                                  placeholder="0.00"
                                  onKeyDown={(e) => { if (e.key === "Enter") handleInlineSave(est); if (e.key === "Escape") closeInlineEdit(); }}
                                />
                              </div>
                            )}
                            <Button
                              size="sm"
                              onClick={() => handleInlineSave(est)}
                              disabled={editSaving}
                              className="h-8 px-3 text-[11px] gap-1 bg-violet-600 hover:bg-violet-700 text-white"
                            >
                              {editSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                              Zapisz
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleInlineReprice(est)}
                              disabled={editRepricing}
                              className="h-8 px-3 text-[11px] gap-1 border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400"
                            >
                              {editRepricing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                              ES-Engine
                            </Button>
                          </div>

                          {(() => {
                            const m = parseFloat(editMat.replace(",", ".")) || 0;
                            const l = parseFloat(editLab.replace(",", ".")) || 0;
                            return (m > 0 || l > 0) ? (
                              <p className="text-[10px] text-slate-500">
                                {m > 0 && <span className="text-amber-600">{m.toFixed(2)} mat.</span>}
                                {m > 0 && l > 0 && " + "}
                                {l > 0 && <span className="text-emerald-600">{l.toFixed(2)} rob.</span>}
                                {" = "}
                                <span className="font-bold text-slate-700 dark:text-slate-200">{((m + l) * est.quantity).toFixed(2)} zł</span>
                              </p>
                            ) : null;
                          })()}

                          {editError && (
                            <p className="text-[10px] text-red-600 dark:text-red-400">{editError}</p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </ScrollArea>

      {/* Unmatched banner */}
      {unmatchedCount > 0 && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 flex-shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-violet-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-violet-700 dark:text-violet-400">
              {unmatchedCount} {unmatchedCount === 1 ? "pozycja poza" : "pozycji poza"} katalogiem i bazą KNR
            </p>
            <p className="text-[10px] text-violet-600/80 dark:text-violet-500/80 mt-0.5">
              Nie znaleziono dopasowania w katalogu prywatnym ani ES-Dictionary.
              Użyj przycisku <strong>Wyceń ręcznie</strong> lub <strong>Szacuj z ES-Engine 2</strong> bezpośrednio w tabeli.
            </p>
          </div>
        </div>
      )}

      {/* Apply footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 flex-shrink-0">
        <div className="text-[11px] text-slate-500 space-y-0.5">
          <p>Zaznaczone pozycje ({selectedIds.size}) zostaną zaktualizowane w kosztorysie</p>
          {selectedIds.size > 0 && (
            <p className="text-slate-700 dark:text-slate-300 font-medium">
              Suma:{" "}
              {showMatCol && (
                <>mat. <span className="text-emerald-600">{selectedSummary.totalMat.toFixed(2)} zł</span>{showLabCol && " + "}</>
              )}
              {showLabCol && (
                <>rob. <span className="text-blue-600">{selectedSummary.totalLab.toFixed(2)} zł</span>{" = "}</>
              )}
              <span className="font-bold text-slate-900 dark:text-slate-100">{selectedSummary.total.toFixed(2)} zł</span>
            </p>
          )}
        </div>
        <Button
          onClick={onApply}
          disabled={isApplying || selectedIds.size === 0}
          className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
        >
          {isApplying ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Zastosuj ceny ({selectedIds.size})
        </Button>
      </div>
    </div>
  );
}
