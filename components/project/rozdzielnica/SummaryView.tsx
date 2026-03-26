"use client";

import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Zap, Pencil, Wrench, X, Loader2, LayoutGrid,
  FileDown, FolderPlus, FileCode, Cable, Lock, AlertTriangle, ArrowDown,
  ChevronDown, ChevronUp, HelpCircle,
} from "lucide-react";
import { ManualPriceTable } from "./ManualPriceTable";
import { FullSpecCard } from "./FullSpecCard";
import type { PanelSection, RailModule, PricingMode } from "../panel-configurator-types";
import type { PricingResult } from "@/app/dashboard/panel-configurator/ai-pricing-action";
import { ConfidenceBadge } from "@/components/project/estimate/ConfidenceBadge";

export interface SummaryViewProps {
  sections: PanelSection[];
  allModules: RailModule[];
  panelName: string;
  isPro: boolean;
  pricingMode: PricingMode;
  pricingResult: PricingResult | null;
  manualPrices: Record<string, { mat: number; lab: number }>;
  setManualPrices: React.Dispatch<React.SetStateAction<Record<string, { mat: number; lab: number }>>>;
  setPricingMode: (mode: PricingMode) => void;
  setPricingResult: (result: PricingResult | null) => void;
  setActiveTab: (tab: string) => void;
  handleAIPricing: () => Promise<void>;
  isWycenLoading: boolean;
  manufacturerCoeff: number;
  selectedManufacturer: { name: string };
  grandTotalMaterial: number;
  grandTotalLabor: number;
  isAdding: boolean;
  isExporting: boolean;
  isDownloading: boolean;
  overflow: boolean;
  schematReadyRef: React.MutableRefObject<boolean>;
  handleAddToProject: () => void;
  handleExportPdf: () => void;
  handleDownloadPdf: () => void;
  handleExportSvg: () => void;
  handleDownloadDxf: () => void;
  handleDownloadSchematSvg: () => void;
}

export const SummaryView = React.memo(function SummaryView({
  sections,
  allModules,
  panelName,
  isPro,
  pricingMode,
  pricingResult,
  manualPrices,
  setManualPrices,
  setPricingMode,
  setPricingResult,
  setActiveTab,
  handleAIPricing,
  isWycenLoading,
  manufacturerCoeff,
  selectedManufacturer,
  grandTotalMaterial,
  grandTotalLabor,
  isAdding,
  isExporting,
  isDownloading,
  overflow,
  schematReadyRef,
  handleAddToProject,
  handleExportPdf,
  handleDownloadPdf,
  handleExportSvg,
  handleDownloadDxf,
  handleDownloadSchematSvg,
}: SummaryViewProps) {
  const isPriced = pricingMode === "ai" && pricingResult !== null;
  const isManual = pricingMode === "manual";
  const [showKnrBreakdown, setShowKnrBreakdown] = useState(false);

  if (allModules.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <LayoutGrid className="w-12 h-12 mx-auto mb-2 opacity-30" />
        <p className="text-sm">Najpierw dodaj urządzenia w zakładce Konstruktor</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-6">

      {/* ── MODE: none — CTA ── */}
      {pricingMode === "none" && (
        <div className="flex flex-col items-center py-8">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950/30 border-2 border-slate-200 dark:border-slate-700 text-center max-w-sm w-full">
            <Zap className="w-10 h-10 text-amber-500 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">Rozdzielnica gotowa do wyceny</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              {allModules.length} urządzeń w {sections.length} {sections.length === 1 ? "sekcji" : "sekcjach"} — wybierz metodę:
            </p>
            <div className="flex flex-col gap-2">
              <Button size="sm"
                className="bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-500 hover:to-amber-500 text-slate-900 font-bold gap-1.5 h-9"
                onClick={handleAIPricing} disabled={isWycenLoading}>
                {isWycenLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                Wyceń ES-Engine (KNR 2026)
              </Button>
              <Button size="sm" variant="outline"
                className="gap-1.5 border-slate-300 text-slate-600 dark:text-slate-400"
                onClick={() => setPricingMode("manual")}>
                <Pencil className="w-3.5 h-3.5" /> Wpisz ceny ręcznie
              </Button>
              <Button size="sm" variant="ghost"
                className="gap-1.5 text-slate-400 text-xs"
                onClick={() => setActiveTab("build")}>
                <Wrench className="w-3.5 h-3.5" /> Wróć do Konstruktora
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODE: ai — banner ── */}
      {isPriced && (
        <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-950/30 dark:to-blue-950/30 border-2 border-emerald-300 dark:border-emerald-700 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                Wycena Ekspercka Gotowa — {isPro ? `${pricingResult.grandTotal.toFixed(0)} zł netto` : "*** zł netto"}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                ES-KNR 2026 · Pewność: {pricingResult.confidence === "high" ? "wysoka" : pricingResult.confidence === "medium" ? "średnia" : "niska"} · {allModules.length} urządzeń
              </p>
            </div>
            <Button size="sm" variant="outline"
              className="gap-1 text-xs h-7 border-emerald-400 text-emerald-700 dark:text-emerald-400 flex-shrink-0"
              onClick={() => { setPricingResult(null); setPricingMode("none"); setManualPrices({}); }}>
              <X className="w-3 h-3" /> Wyczyść
            </Button>
          </div>
          {/* Confidence legend strip */}
          <div className="flex items-center gap-3 px-4 py-2 bg-white/60 dark:bg-slate-900/30 border-t border-emerald-200 dark:border-emerald-800">
            <span className="text-[10px] text-slate-500 uppercase font-semibold tracking-wide flex-shrink-0">Poziom danych:</span>
            <div className="flex items-center gap-2 flex-wrap flex-1">
              <ConfidenceBadge level="verified" showLabel />
              <ConfidenceBadge level="analog" showLabel />
              <ConfidenceBadge level="estimated" showLabel />
              <ConfidenceBadge level="uncertain" showLabel />
            </div>
            <button
              onClick={() => setShowKnrBreakdown(v => !v)}
              className="flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold hover:underline flex-shrink-0"
            >
              {showKnrBreakdown ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              Szczegóły KNR
            </button>
          </div>

          {/* KNR Breakdown Table — Dlaczego taka cena? */}
          {showKnrBreakdown && pricingResult && (
            <div className="px-4 py-3 bg-white/80 dark:bg-slate-900/50 border-t border-emerald-200 dark:border-emerald-800 overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-slate-400 uppercase tracking-wide border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-1 pr-3 font-semibold">Urządzenie</th>
                    <th className="text-left py-1 pr-3 font-semibold">KNR / Źródło</th>
                    <th className="text-right py-1 pr-3 font-semibold">Materiał</th>
                    <th className="text-right py-1 font-semibold">Robocizna</th>
                  </tr>
                </thead>
                <tbody>
                  {pricingResult.sections.flatMap(sec =>
                    [...sec.modules, ...sec.accessories].map(mod => (
                      <tr key={`${sec.sectionName}-${mod.moduleId}-${mod.namePl}`}
                        className="border-b border-slate-100 dark:border-slate-800 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20">
                        <td className="py-1 pr-3 text-slate-700 dark:text-slate-300 max-w-[160px] truncate">
                          {mod.quantity > 1 && <span className="text-slate-400 mr-1">{mod.quantity}×</span>}
                          {mod.namePl}
                        </td>
                        <td className="py-1 pr-3">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="flex items-center gap-1 cursor-help">
                                  <ConfidenceBadge level={mod.confidenceLevel} />
                                  {mod.confidenceNote && (
                                    <HelpCircle className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                  )}
                                </span>
                              </TooltipTrigger>
                              {mod.confidenceNote && (
                                <TooltipContent side="top" className="max-w-xs text-[11px] font-mono">
                                  <p className="font-semibold mb-1 text-emerald-600">Dlaczego taka cena?</p>
                                  <p>{mod.confidenceNote}</p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                        </td>
                        <td className="py-1 pr-3 text-right tabular-nums text-slate-600 dark:text-slate-400">
                          {isPro ? `${mod.totalMaterial.toFixed(0)} zł` : "***"}
                        </td>
                        <td className="py-1 text-right tabular-nums font-medium text-slate-800 dark:text-slate-200">
                          {isPro ? `${mod.totalLabor.toFixed(0)} zł` : "***"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── MODE: manual — banner ── */}
      {isManual && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-2 border-blue-200 dark:border-blue-700">
          <Pencil className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-blue-800 dark:text-blue-300">Wycena ręczna</p>
            <p className="text-[11px] text-slate-500">Wpisz ceny materiałów i robocizny poniżej.</p>
          </div>
          <div className="flex gap-1.5 flex-shrink-0">
            <Button size="sm"
              className="gap-1 text-xs h-7 bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold"
              onClick={handleAIPricing} disabled={isWycenLoading}>
              {isWycenLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />} Wyceń AI
            </Button>
            <Button size="sm" variant="outline"
              className="gap-1 text-xs h-7 text-slate-500"
              onClick={() => { setManualPrices({}); setPricingMode("none"); }}>
              <X className="w-3 h-3" /> Anuluj
            </Button>
          </div>
        </div>
      )}

      {/* ── Manual input table ── */}
      {isManual && (
        <ManualPriceTable
          sections={sections}
          panelName={panelName}
          manualPrices={manualPrices}
          setManualPrices={setManualPrices}
          setPricingMode={setPricingMode}
          isDownloading={isDownloading}
          handleDownloadPdf={handleDownloadPdf}
        />
      )}

      {/* ── Full spec card ── */}
      {pricingMode !== "none" && (
        <FullSpecCard
          sections={sections}
          isPro={isPro}
          manufacturerCoeff={manufacturerCoeff}
          selectedManufacturer={selectedManufacturer}
          panelName={panelName}
        />
      )}

      {/* ── Grand Totals + Export buttons ── */}
      {pricingMode !== "none" && (
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-[10px] text-slate-500 uppercase">Materiał{sections.length > 1 ? " (wszystkie)" : ""}</p>
                <p className="text-sm font-bold">{isPro ? `${grandTotalMaterial.toFixed(0)} zł` : "***"}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase">Robocizna{sections.length > 1 ? " (wszystkie)" : ""}</p>
                <p className="text-sm font-bold">{isPro ? `${grandTotalLabor.toFixed(0)} zł` : "***"}</p>
              </div>
              <div>
                <p className="text-[10px] text-blue-600 uppercase font-bold">Razem netto</p>
                <p className="text-lg font-bold text-blue-600">
                  {isPro ? `${(grandTotalMaterial + grandTotalLabor).toFixed(0)} zł` : "*** zł"}
                </p>
              </div>
            </div>

            {!panelName.trim() && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Najpierw nadaj nazwę rozdzielnicy, aby odblokować eksport i zapis.</span>
              </div>
            )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Project actions */}
                <div className="flex rounded-lg overflow-hidden shadow-sm">
                  <Button onClick={handleAddToProject} disabled={isAdding || overflow || !panelName.trim()}
                    title="Kopiuj rozdzielnicę do kosztorysu projektu — wszystkie moduły zostaną dodane jako pozycje z cenami KNR."
                    className="gap-1 bg-blue-600 hover:bg-blue-700 text-white h-9 text-xs font-semibold rounded-none rounded-l-lg border-r border-blue-500/30 flex-1">
                    {isAdding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowDown className="w-3.5 h-3.5" />}
                    Kosztorys
                  </Button>
                  <Button onClick={handleExportPdf} disabled={isExporting || !panelName.trim()}
                    title="Zapisz PDF specyfikacji + schemat SVG + wizualizację w dokumentach projektu (portal klienta, oferta)."
                    className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white h-9 text-xs font-semibold rounded-none rounded-r-lg flex-1">
                    {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FolderPlus className="w-3.5 h-3.5" />}
                    Dokumenty
                  </Button>
                </div>

                {/* Export formats */}
                <div className="flex rounded-lg overflow-hidden shadow-sm">
                  <Button onClick={handleDownloadPdf} disabled={isDownloading || !panelName.trim()}
                    title="Pobierz specyfikację techniczną rozdzielnicy jako PDF z kosztorysem KNR."
                    className="gap-1 bg-red-600 hover:bg-red-700 text-white h-9 text-xs font-semibold rounded-none rounded-l-lg border-r border-red-500/30 flex-1">
                    {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
                    PDF
                  </Button>
                  <Button onClick={() => handleExportSvg()} disabled={allModules.length === 0 || !panelName.trim()}
                    title="Pobierz wizualizację front-view rozdzielnicy (SVG) — widok modułów na szynie DIN."
                    className="gap-1 bg-red-600 hover:bg-red-700 text-white h-9 text-xs font-semibold rounded-none border-r border-red-500/30 flex-1">
                    <LayoutGrid className="w-3.5 h-3.5" /> Widok
                  </Button>
                  <Button onClick={handleDownloadDxf}
                    disabled={allModules.length === 0 || !panelName.trim() || !isPro || !schematReadyRef.current}
                    title={!isPro ? "Funkcja dostępna w planie PRO" : !schematReadyRef.current ? "Najpierw wygeneruj schemat w zakładce Schemat" : "Pobierz schemat wieloliniowy jako DXF (AutoCAD/BricsCAD)"}
                    className="gap-1 h-9 text-xs font-semibold rounded-none border-r border-red-500/30 flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed">
                    {!isPro && <Lock className="w-3 h-3 mr-1" />}
                    <FileCode className="w-3.5 h-3.5" /> DXF
                  </Button>
                  <Button onClick={handleDownloadSchematSvg}
                    disabled={!panelName.trim() || !schematReadyRef.current}
                    title={!schematReadyRef.current ? "Najpierw wygeneruj schemat w zakładce Schemat" : "Pobierz schemat wieloliniowy jako SVG"}
                    className="gap-1 h-9 text-xs font-semibold rounded-none rounded-r-lg flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed">
                    <Cable className="w-3.5 h-3.5" /> Schemat
                  </Button>
                </div>
              </div>
          </CardContent>
        </Card>
      )}

      {/* Info footer */}
      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800">
        <FileDown className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed">
          <strong>Specyfikacja rozdzielnicy</strong> zostanie wygenerowana jako{" "}
          <strong>PDF + SVG{isPro ? " + DXF (CAD)" : ""}</strong> i automatycznie dołączona do pakietu dokumentów: wycena + kalkulatory + rozdzielnica.
          Dokumenty dostępne w <strong>eksporcie PDF</strong>, <strong>portalu klienta</strong> i <strong>ofercie</strong>.
          {!isPro && (
            <div className="mt-1.5 flex items-center gap-1 text-amber-700 dark:text-amber-400">
              <Lock className="w-3 h-3" />
              <span className="text-[10px] font-semibold">Format CAD (DXF) dostępny w planie PRO</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
