"use client";

import React, { useState } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Loader2, AlertTriangle, ShieldCheck, Sparkles, Zap, RefreshCw, Pencil,
} from "lucide-react";
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
  onToggleItem: (id: string) => void;
  onToggleAll: () => void;
  onApplyCertainOnly: () => void;
  onBack: () => void;
  onApply: () => void;
  onOpenManualMatch: (itemId: string) => Promise<void>;
  onManualMatchSearchChange: (v: string) => void;
  onApplyManualMatch: (itemId: string, cand: { name: string; mat: number; lab: number }) => void;
  onCloseManualMatch: () => void;
  onOpenDetail: (est: AiPriceEstimate) => void;
  onOpenManualPrice: (est: AiPriceEstimate) => void;
  onAddToRefreshing: (id: string) => void;
  selectedSummary: { totalMat: number; totalLab: number; total: number };
  isApplying: boolean;
}

function formatPrice(price: number) {
  return price > 0 ? `${price.toFixed(2)} zł` : "—";
}

export function EstimateResultsTable({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  estimates, selectedIds, mode, pricedCount, unmatchedCount,
  refreshingIds, manualMatchItemId, manualMatchSearch, fullCatalog, isLoadingCatalog,
  onToggleItem, onToggleAll, onApplyCertainOnly, onBack, onApply,
  onOpenManualMatch, onManualMatchSearchChange, onApplyManualMatch, onCloseManualMatch,
  onOpenDetail, onOpenManualPrice, onAddToRefreshing, selectedSummary, isApplying,
}: EstimateResultsTableProps) {
  const showMatCol = mode !== "labor";
  const showLabCol = mode !== "material";
  const ambiguousCount = estimates.filter(e => e.isAmbiguous).length;
  const interventionCount = ambiguousCount + unmatchedCount;
  // Poza KNR = no knrSource (same criterion as row badge display)
  const lowConfCount = estimates.filter(e =>
    !e.isAmbiguous &&
    e.trace !== "unmatched" &&
    e.confidence === "low"
  ).length;

  const [showConfirm, setShowConfirm] = useState(false);
  const selectedEstimates = estimates.filter(e => selectedIds.has(e.itemId));

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
                const laborWithRegion = Math.round(est.suggestedLabor * regionMod * 100) / 100;
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
                  <TableRow
                    key={est.itemId}
                    className={`cursor-pointer transition-colors ${
                      rowType === "refreshing" ? "bg-orange-50/40 dark:bg-orange-950/10 animate-pulse"
                      : needsIntervention ? "bg-violet-50/40 dark:bg-violet-950/10 border-l-2 border-l-violet-400"
                      : rowType === "refined" ? "bg-emerald-50/40 dark:bg-emerald-950/10 border-l-2 border-l-emerald-400"
                      : isSelected ? "bg-orange-50/50 dark:bg-orange-950/10"
                      : "opacity-60"
                    }`}
                    onClick={() => {
                      if (isRefreshing) return;
                      if (needsIntervention) { onOpenDetail(est); return; }
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
                              <p className="text-[9px] text-slate-400 italic truncate max-w-[160px]">{est.note}</p>
                            </div>
                          ) : (needsIntervention || rowType === "poza-knr") ? (
                            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                              <button
                                onClick={(e) => { e.stopPropagation(); onOpenManualPrice(est); }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-bold bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-900/30 dark:text-violet-400 border border-violet-300 dark:border-violet-700 transition-colors"
                              >
                                <Sparkles className="w-2.5 h-2.5" />
                                Wyceń ręcznie
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); onOpenDetail(est); }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-bold bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-300 dark:border-orange-700 transition-colors"
                              >
                                <Zap className="w-2.5 h-2.5" />
                                Szacuj z ES-Engine 2
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              {est.note && <p className="text-[9px] text-slate-400 italic">{est.note}</p>}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-[10px] text-center">
                      {est.guardedUnit ? (
                        <span title={`Unit Guard 2.0: skorygowano z "${est.unit}" na "${est.guardedUnit}"`} className="inline-flex flex-col items-center gap-0 cursor-help">
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">{est.guardedUnit}</span>
                          <span className="text-[8px] text-slate-400 line-through">{est.unit}</span>
                        </span>
                      ) : (
                        <span className="text-slate-500">{est.unit}</span>
                      )}
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
                            onClick={(e) => { e.stopPropagation(); onOpenDetail(est); }}
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-100 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-slate-800 dark:text-slate-400 transition-colors"
                          >
                            <RefreshCw className="w-2.5 h-2.5" />Edytuj
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
          onClick={() => setShowConfirm(true)}
          disabled={isApplying || selectedIds.size === 0}
          className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
        >
          Zastosuj ceny ({selectedIds.size})
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="max-w-3xl flex flex-col max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              Potwierdź zastosowanie cen
              <span className="ml-1 text-[11px] font-normal text-slate-500">{selectedEstimates.length} pozycji</span>
            </DialogTitle>
            <DialogDescription className="sr-only">
              Przegląd i potwierdzenie cen AI przed ich zastosowaniem w kosztorysie.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto border rounded-lg">
            <div className="overflow-x-auto">
            <Table className="min-w-[560px]">
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-900">
                  <TableHead className="text-[10px] font-semibold">Pozycja</TableHead>
                  <TableHead className="text-[10px] text-center w-10">Jm.</TableHead>
                  <TableHead className="text-[10px] text-center w-10">Ilość</TableHead>
                  {showMatCol && <TableHead className="text-[10px] text-right w-20">Mat./jm.</TableHead>}
                  {showLabCol && <TableHead className="text-[10px] text-right w-20">Rob./jm.</TableHead>}
                  <TableHead className="text-[10px] text-right w-24">Razem</TableHead>
                  <TableHead className="text-[10px] w-14"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedEstimates.map((est) => {
                  const total = Math.round((est.suggestedMaterial + est.suggestedLabor) * est.quantity * 100) / 100;
                  return (
                    <TableRow key={est.itemId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <TableCell>
                        <p className="text-xs font-medium truncate max-w-[220px]">{est.name}</p>
                        {est.note && <p className="text-[9px] text-slate-400 italic truncate max-w-[220px]">{est.note}</p>}
                      </TableCell>
                      <TableCell className="text-[10px] text-center text-slate-500">{est.guardedUnit ?? est.unit}</TableCell>
                      <TableCell className="text-[10px] text-center font-medium">{est.quantity}</TableCell>
                      {showMatCol && (
                        <TableCell className="text-right">
                          <span className="text-xs font-semibold text-emerald-600">{formatPrice(est.suggestedMaterial)}</span>
                          {est.matSource === "ai-market" && (
                            <span className="block text-[8px] text-amber-600 dark:text-amber-400 font-medium">~rynk.</span>
                          )}
                        </TableCell>
                      )}
                      {showLabCol && (
                        <TableCell className="text-right text-xs font-semibold text-blue-600">
                          {formatPrice(est.suggestedLabor)}
                        </TableCell>
                      )}
                      <TableCell className="text-right text-xs font-bold text-slate-800 dark:text-slate-200">
                        {formatPrice(total)}
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => { setShowConfirm(false); onOpenManualPrice(est); }}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium text-slate-500 hover:text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors"
                          title="Edytuj cenę ręcznie"
                        >
                          <Pencil className="w-3 h-3" />Edytuj
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Łącznie:{" "}
              {showMatCol && <span className="text-emerald-600">{selectedSummary.totalMat.toFixed(2)} zł mat.</span>}
              {showMatCol && showLabCol && " + "}
              {showLabCol && <span className="text-blue-600">{selectedSummary.totalLab.toFixed(2)} zł rob.</span>}
              {" = "}
              <span className="font-bold text-slate-900 dark:text-slate-100">{selectedSummary.total.toFixed(2)} zł</span>
            </span>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirm(false)}>Wróć i edytuj</Button>
            <Button
              onClick={() => { setShowConfirm(false); onApply(); }}
              disabled={isApplying}
              className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            >
              {isApplying ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Zatwierdź i zastosuj ({selectedEstimates.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
