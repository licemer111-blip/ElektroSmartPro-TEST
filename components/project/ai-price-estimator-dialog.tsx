"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QuotaBadge, QuotaBlocker } from "@/components/ui/quota-badge";
import Link from "next/link";
import {
  CircleDollarSign, Loader2, Check, AlertTriangle, Banknote, Wrench,
  CheckCircle2, Info, Building2, Home, Factory,
} from "lucide-react";
import { useAiPriceEstimator } from "@/components/project/_parts/useAiPriceEstimator";
import { EstimateResultsTable } from "@/components/project/_parts/EstimateResultsTable";
import type { PriceMode } from "@/components/project/_parts/useAiPriceEstimator";
import type { ProjectSector } from "@/lib/ai/smart-mapping-engine";
import { SECTOR_LABELS } from "@/lib/ai/smart-mapping-engine";
import { useTabSyncOptional } from "@/components/project/tab-sync-context";

interface AiPriceEstimatorDialogProps {
  projectId: string;
  itemCount: number;
  projectStatus?: string;
  selectedRowIds?: Set<string>;
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
  rateIsDefault?: boolean;
  /** Project VAT rate for brutto preview in results table. */
  vatRate?: number;
  // ── Project pricing multipliers (v4.0: Preview=Apply parity) ───────────────
  /** Negocjacja slider: 1 + project.adjustment_percentage/100. Default 1.0. */
  adjustmentMult?: number;
  /** Narzut materiałów: 1 + project.mat_markup_pct/100. Default 1.0. */
  matMarkupMult?: number;
  /** Narzut robocizny: 1 + project.lab_markup_pct/100. Default 1.0. */
  labMarkupMult?: number;
  /** Labor complexity factor (Pult 5-w-1). Default 1.0. */
  complexityFactor?: number;
  /** Region price modifier. Default 1.0. */
  regionModifier?: number;
  /** Materials owned by customer flag. */
  materialsOwnedByCustomer?: boolean;
  /** Object type slug from project — used to pre-select sector in pricing dialog. */
  objectTypeSlug?: string | null;
}

const modeButtons: { mode: PriceMode; label: string; desc: string; icon: typeof Banknote }[] = [
  { mode: "all", label: "Wyceń", desc: "Robocizna KNR 2026 + materiały katalogowe", icon: Wrench },
];

export function AiPriceEstimatorDialog({
  projectId,
  itemCount,
  projectStatus = "draft",
  selectedRowIds,
  externalOpen,
  onExternalOpenChange,
  rateIsDefault = false,
  vatRate = 23,
  adjustmentMult = 1.0,
  matMarkupMult = 1.0,
  labMarkupMult = 1.0,
  complexityFactor = 1.0,
  regionModifier = 1.0,
  materialsOwnedByCustomer = false,
  objectTypeSlug,
}: AiPriceEstimatorDialogProps) {
  // Read live bruttoMode from tab sync context (set by Pult 5-w-1 toggle)
  const tabSyncCtx = useTabSyncOptional();
  const bruttoMode = tabSyncCtx?.uiState?.liveBruttoMode ?? false;

  const est = useAiPriceEstimator({
    projectId, projectStatus, selectedRowIds, externalOpen, onExternalOpenChange, objectTypeSlug,
  });

  const SECTOR_OPTIONS: { value: ProjectSector; label: string; short: string; icon: typeof Home }[] = [
    { value: "RESIDENTIAL", label: SECTOR_LABELS.RESIDENTIAL, short: "Mieszkanie", icon: Home },
    { value: "COMMERCIAL",  label: SECTOR_LABELS.COMMERCIAL,  short: "Biuro/Usługi", icon: Building2 },
    { value: "INDUSTRIAL",  label: SECTOR_LABELS.INDUSTRIAL,  short: "Przemysł", icon: Factory },
  ];

  const aiTooltipText = est.isFinal
    ? "Projekt zablokowany. Odblokuj projekt, aby użyć ES-Engine wyceny."
    : est.hasSelectedRows
    ? `ES-Engine wyceń zaznaczone ${selectedRowIds!.size} pozycje.`
    : "Expert Engine — katalog prywatny + normy KNR ES-KNR 2026 + ES-Engine na żądanie (L3)";

  const [phaseIdx, setPhaseIdx] = useState(0);
  const phaseIdxRef = useRef(0);
  useEffect(() => { phaseIdxRef.current = phaseIdx; }, [phaseIdx]);

  const PHASES_LABOR = [
    { label: "Wczytywanie pozycji kosztorysu...", pct: 8 },
    { label: "L0: Bezpośrednie kody KNR — wyliczenie norm...", pct: 22 },
    { label: "L1: Sprawdzam katalog prywatny...", pct: 40 },
    { label: "L2: Wyliczam robociznę i materiały z ES-KNR 2026...", pct: 62 },
    { label: "L3: ES-Engine — dopasowywanie brakujących pozycji...", pct: 80 },
    { label: "Canonical L0: weryfikacja cen materiałów...", pct: 92 },
    { label: "Finalizowanie wyceny...", pct: 97 },
  ];
  // Each step shows for exactly PHASE_STEP_MS so every phase always completes fully
  const PHASE_STEP_MS = 1600;

  const activePhases = PHASES_LABOR;

  // Advance one step every PHASE_STEP_MS — guarantees every step is always shown
  useEffect(() => {
    if (!est.isEstimating) {
      if (!est.pendingData) setPhaseIdx(0);
      return;
    }
    setPhaseIdx(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    activePhases.forEach((_, idx) => {
      if (idx === 0) return;
      timers.push(setTimeout(() => setPhaseIdx(idx), PHASE_STEP_MS * idx));
    });
    return () => timers.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [est.isEstimating]);

  // When AI data is ready, step through any remaining phases at 700ms each, then reveal
  useEffect(() => {
    if (!est.pendingData) return;
    const currentIdx = phaseIdxRef.current;
    const lastIdx = activePhases.length - 1;
    const STEP_MS = 700;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let delay = 0;
    for (let i = currentIdx + 1; i <= lastIdx; i++) {
      delay += STEP_MS;
      const target = i;
      timers.push(setTimeout(() => setPhaseIdx(target), delay));
    }
    // After last step is visible, reveal results
    timers.push(setTimeout(est.onAnimationComplete, delay + 1000));
    return () => timers.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [est.pendingData]);

  const currentPhase = activePhases[Math.min(phaseIdx, activePhases.length - 1)];

  return (
    <>
      <Dialog open={est.open} onOpenChange={(v) => { if (!v && !est.isEstimating) { est.handleClose(); onExternalOpenChange?.(v); } else if (v) onExternalOpenChange?.(v); }}>
        <Button
          size="sm"
          disabled={itemCount === 0}
          onClick={est.handleTriggerClick}
          title={aiTooltipText}
          className={`h-7 sm:h-8 text-[11px] sm:text-xs gap-1.5 flex-shrink-0 rounded-md bg-orange-500 hover:bg-orange-600 text-white ${est.isFinal ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <CircleDollarSign className="h-3.5 w-3.5" />
          <span>ES Wycena</span>
          {est.hasSelectedRows && (
            <span className="ml-0.5 bg-white/30 text-white text-[9px] font-bold px-1 py-0.5 rounded-full leading-none">
              {selectedRowIds!.size}
            </span>
          )}
        </Button>

        <DialogContent
          className={`w-[95vw] overflow-hidden flex flex-col ${est.step === "preview" ? "max-w-4xl h-[90vh]" : "max-w-lg"}`}
          onInteractOutside={(e) => { if (est.isEstimating) e.preventDefault(); }}
          onEscapeKeyDown={(e) => { if (est.isEstimating) e.preventDefault(); }}
        >
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <CircleDollarSign className="w-5 h-5 text-orange-500" />
              Expert Engine — automatyczna wycena pozycji
              <QuotaBadge info={est.quotaInfo} className="ml-auto" />
            </DialogTitle>
            <DialogDescription className="text-xs">
              P1 Katalog · L2 ES-Słownik · normy KNR 2026 · 16 województw
            </DialogDescription>
          </DialogHeader>

          {/* Step 1: Choose */}
          {est.step === "choose" && (
            <div className="space-y-4 py-2">
              {est.quotaInfo?.isExhausted && (
                <QuotaBlocker info={est.quotaInfo} featureName="ES-Engine Wyceny" />
              )}
              {rateIsDefault && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                    <strong>Brak stawki robocizny.</strong>{" "}
                    Wycena robocizny wymaga zapisanej stawki R-G.{" "}
                    <Link href="/dashboard/settings/knr-calculator" className="underline font-semibold hover:text-amber-900 dark:hover:text-amber-200">
                      Ustaw stawkę w Ustawieniach →
                    </Link>
                  </div>
                </div>
              )}
              {(
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                    <strong>Expert Engine — robocizna + materiały.</strong>{" "}
                    Hierarchia: <strong>L0 kody KNR</strong> → <strong>L1 Twój katalog</strong> → <strong>L2 ES-Słownik</strong> → <strong>L3 ES-Engine</strong>.
                    Stawka regionalna × norma 2026. Ceny materiałów z katalogu KNR 2026 (wskaźnikowe).
                  </div>
                </div>
              )}
              {est.error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {est.error}
                </div>
              )}
              {/* Sector selector */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Sektor obiektu</p>
                <div className="grid grid-cols-3 gap-2">
                  {SECTOR_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const isActive = est.sectorOverride === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => est.setSectorOverride(opt.value)}
                        disabled={est.isEstimating}
                        className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all text-center ${
                          isActive
                            ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30 shadow-sm"
                            : "border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-700 hover:bg-orange-50/50 dark:hover:bg-orange-950/10"
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${isActive ? "text-orange-500" : "text-slate-400 dark:text-slate-500"}`} />
                        <span className={`text-[10px] font-semibold leading-tight ${isActive ? "text-orange-700 dark:text-orange-300" : "text-slate-600 dark:text-slate-400"}`}>
                          {opt.short}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Wpływa na dobór szablonów KNR i ceny montażu (podtynkowy / korytka / natynkowy IP44).
                </p>
              </div>

              {/* single CTA */}
              <div className="flex justify-center">
                {modeButtons.map((btn) => {
                  const Icon = btn.icon;
                  const isDisabled = est.isEstimating || rateIsDefault;
                  return (
                    <button
                      key={btn.mode}
                      onClick={() => est.handleEstimate(btn.mode)}
                      disabled={isDisabled}
                      title={rateIsDefault ? "Ustaw stawkę R-G w Ustawieniach, aby wycenić robociznę" : undefined}
                      className={`flex flex-col items-center gap-3 p-6 w-full max-w-sm rounded-2xl border-2 transition-all text-center group ${
                        isDisabled
                          ? "border-slate-200 dark:border-slate-700 opacity-40 cursor-not-allowed"
                          : "border-orange-300 dark:border-orange-700 hover:border-orange-500 dark:hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/30 cursor-pointer shadow-sm hover:shadow-md"
                      }`}
                    >
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm transition-shadow ${
                        isDisabled
                          ? "bg-slate-300 dark:bg-slate-700"
                          : "bg-gradient-to-br from-amber-500 to-orange-500 group-hover:shadow-lg"
                      }`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <p className="text-base font-bold text-slate-800 dark:text-slate-200">{btn.label}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {rateIsDefault ? "Wymaga stawki R-G" : btn.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <Info className="w-3.5 h-3.5 flex-shrink-0" />
                ES-Engine wyceni pozycje z brakiem robocizny lub materiału. Istniejące ceny &gt; 0 nie zostaną nadpisane.
              </div>
            </div>
          )}

          {/* Step 2: Loading */}
          {est.step === "loading" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-5">
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-semibold bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300">
                <Wrench className="w-3.5 h-3.5" /> Wycena robocizny + materiałów (ES-Engine)
              </div>

              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">ES Expert Engine wycenia robociznę i materiały...</p>
                <p className="text-xs text-orange-600 dark:text-orange-400 font-medium min-h-[1.25rem] transition-all">
                  {currentPhase.label}
                </p>
              </div>
              <div className="w-full max-w-xs space-y-1.5">
                <div className="w-full bg-orange-100 dark:bg-orange-900/30 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-1000"
                    style={{ width: `${currentPhase.pct}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 text-center">
                  Wycena robocizny + materiałów · Nie zamykaj okna
                </p>
              </div>
              <div className="flex flex-col gap-1.5 w-full max-w-xs">
                {activePhases.map((phase, idx) => (
                  <div key={idx} className={`flex items-center gap-2 text-[11px] transition-all ${idx <= phaseIdx ? "text-orange-600 dark:text-orange-400" : "text-slate-300 dark:text-slate-600"}`}>
                    {idx < phaseIdx ? (
                      <Check className="w-3 h-3 flex-shrink-0 text-green-500" />
                    ) : idx === phaseIdx ? (
                      <Loader2 className="w-3 h-3 flex-shrink-0 animate-spin" />
                    ) : (
                      <div className="w-3 h-3 flex-shrink-0 rounded-full border border-slate-200 dark:border-slate-700" />
                    )}
                    <span>{phase.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {est.step === "preview" && (
            est.estimates.length === 0 ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Wszystkie ceny zastosowane</h3>
                  <p className="text-sm text-slate-500 mt-1">Możesz zamknąć okno lub uruchomić wycenę ponownie.</p>
                </div>
                <Button onClick={est.handleClose} className="bg-blue-600 hover:bg-blue-700 text-white">Zamknij</Button>
              </div>
            ) : (
              <EstimateResultsTable
                estimates={est.estimates}
                selectedIds={est.selectedIds}
                mode={est.mode}
                pricedCount={est.pricedCount}
                unmatchedCount={est.unmatchedCount}
                refreshingIds={est.refreshingIds}
                manualMatchItemId={est.manualMatchItemId}
                manualMatchSearch={est.manualMatchSearch}
                fullCatalog={est.fullCatalog}
                isLoadingCatalog={est.isLoadingCatalog}
                projectId={projectId}
                bruttoMode={bruttoMode}
                vatRate={vatRate}
                adjustmentMult={adjustmentMult}
                matMarkupMult={matMarkupMult}
                labMarkupMult={labMarkupMult}
                complexityFactor={complexityFactor}
                regionModifier={regionModifier}
                materialsOwnedByCustomer={materialsOwnedByCustomer}
                onToggleItem={est.toggleItem}
                onToggleAll={est.toggleAll}
                onApplyCertainOnly={est.applyCertainOnly}
                onBack={() => est.setStep("choose")}
                onApply={est.handleApply}
                onOpenManualMatch={est.openManualMatch}
                onManualMatchSearchChange={est.setManualMatchSearch}
                onApplyManualMatch={est.applyManualMatch}
                onCloseManualMatch={() => est.setManualMatchItemId(null)}
                onRepriced={(updated) => {
                  est.setRefreshingIds((prev) => { const s = new Set(prev); s.delete(updated.itemId); return s; });
                  est.handleRepriced(updated);
                }}
                onAddToRefreshing={(id) => est.setRefreshingIds((prev) => { const s = new Set(prev); s.add(id); return s; })}
                isApplying={est.isApplying}
              />
            )
          )}

        </DialogContent>
      </Dialog>
    </>
  );
}
