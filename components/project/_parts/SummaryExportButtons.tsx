"use client";
import React from "react";
import { Loader2, Lock, FileDown, FolderPlus, FileCode, Cable, LayoutGrid, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RailModule } from "@/components/project/panel-configurator-types";

interface SummaryExportButtonsProps {
  panelName: string;
  isPro: boolean;
  projectId?: string | null;
  regionModifier?: number;
  manufacturerCoeff: number;
  allModules: RailModule[];
  grandTotalMaterial: number;
  grandTotalLabor: number;
  isExporting: boolean;
  isAddingToProject: boolean;
  schematSvgRef: React.MutableRefObject<string>;
  schematReadyRef: React.MutableRefObject<boolean>;
  handleAddToProject: () => void;
  handleDownloadPdf: () => void;
  handleExportPdf: () => void;
  handleExportSvg: (opts?: { skipDownload?: boolean }) => Promise<string | undefined>;
  handleDownloadDxf: () => void;
  toast: (opts: { title: string; description?: string; variant?: "default" | "destructive" }) => void;
}

export function SummaryExportButtons({
  panelName, isPro, projectId, regionModifier, manufacturerCoeff,
  allModules, grandTotalMaterial, grandTotalLabor,
  isExporting, isAddingToProject,
  schematSvgRef, schematReadyRef,
  handleAddToProject, handleDownloadPdf, handleExportPdf,
  handleExportSvg, handleDownloadDxf, toast,
}: SummaryExportButtonsProps) {
  const isAdding = isAddingToProject;
  const isDownloading = isExporting;

  return (
    <div className="space-y-3">
      {!panelName.trim() && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-400">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Najpierw nadaj nazwę rozdzielnicy, aby odblokować eksport i zapis.</span>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Left group: Project actions */}
          <div className="flex flex-wrap sm:flex-nowrap rounded-lg overflow-hidden shadow-sm">
            <Button
              onClick={handleAddToProject}
              disabled={isAdding || !panelName.trim()}
              title="Kopiuj rozdzielnicę do kosztorysu projektu — wszystkie moduły zostaną dodane jako pozycje z cenami KNR."
              className="gap-1 bg-blue-600 hover:bg-blue-700 text-white h-9 text-xs font-semibold rounded-none rounded-l-lg border-r border-blue-500/30 flex-1"
            >
              {isAdding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
              Dodaj do Kosztorysu
            </Button>
            <Button
              onClick={() => {
                if (!panelName.trim()) {
                  toast({
                    title: "Ustaw nazwę rozdzielnicy",
                    description: "Wprowadź nazwę rozdzielnicy u góry strony — jest wymagana do wygenerowania dokumentów.",
                    variant: "destructive",
                  });
                  return;
                }
                if (!schematReadyRef.current) {
                  toast({
                    title: "Schemat nie wygenerowany",
                    description: "Przejdź do zakładki Schemat i wygeneruj schemat wieloliniowy — zostanie automatycznie dołączony do pakietu. Teraz zostanie dodany PDF + wizualizacja SVG.",
                  });
                }
                handleExportPdf();
              }}
              disabled={isExporting}
              title="Zapisz PDF specyfikacji + wizualizację SVG + schemat CAD w dokumentach projektu."
              className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white h-9 text-xs font-semibold rounded-none rounded-r-lg flex-1"
            >
              {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FolderPlus className="w-3.5 h-3.5" />}
              Dodaj w dokumenty
            </Button>
          </div>

          {/* Right group: Export formats */}
          <div className="flex flex-wrap sm:flex-nowrap rounded-lg overflow-hidden shadow-sm">
            <Button
              onClick={handleDownloadPdf}
              disabled={isDownloading || !panelName.trim()}
              title="Pobierz specyfikację techniczną rozdzielnicy jako PDF z kosztorysem KNR."
              className="gap-1 bg-red-600 hover:bg-red-700 text-white h-9 text-xs font-semibold rounded-none rounded-l-lg border-r border-red-500/30 flex-1"
            >
              {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
              PDF
            </Button>
            <Button
              onClick={() => handleExportSvg()}
              disabled={allModules.length === 0 || !panelName.trim()}
              title="Pobierz wizualizację front-view rozdzielnicy (SVG) — widok modułów na szynie DIN."
              className="gap-1 bg-red-600 hover:bg-red-700 text-white h-9 text-xs font-semibold rounded-none border-r border-red-500/30 flex-1"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Widok
            </Button>
            <Button
              onClick={handleDownloadDxf}
              disabled={allModules.length === 0 || !panelName.trim() || !isPro || !schematReadyRef.current}
              title={!isPro ? "Funkcja dostępna w planie PRO" : !schematReadyRef.current ? "Najpierw wygeneruj schemat w zakładce Schemat" : "Pobierz schemat wieloliniowy jako DXF (AutoCAD/BricsCAD)"}
              className="gap-1 h-9 text-xs font-semibold rounded-none border-r border-red-500/30 flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {!isPro && <Lock className="w-3 h-3 mr-1" />}
              <FileCode className="w-3.5 h-3.5" />
              DXF
            </Button>
            <Button
              onClick={() => {
                const svg = schematSvgRef.current;
                if (!svg || svg.length < 100) {
                  toast({ title: "Brak schematu", description: "Najpierw wygeneruj schemat w zakładce Schemat", variant: "destructive" });
                  return;
                }
                const blob = new Blob([svg], { type: "image/svg+xml" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `schemat-${(panelName || "rozdzielnica").replace(/\s+/g, "-").toLowerCase()}.svg`;
                a.click();
                URL.revokeObjectURL(url);
                toast({ title: "Pobrano schemat SVG", description: "Schemat wieloliniowy zapisany" });
              }}
              disabled={!panelName.trim() || !schematReadyRef.current}
              title={!schematReadyRef.current ? "Najpierw wygeneruj schemat w zakładce Schemat" : "Pobierz schemat wieloliniowy jako SVG"}
              className="gap-1 h-9 text-xs font-semibold rounded-none rounded-r-lg flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Cable className="w-3.5 h-3.5" />
              Schemat
            </Button>
          </div>
        </div>

      {/* Info block */}
      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800">
        <FolderPlus className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed">
          <strong>Dodaj w dokumenty</strong> zapisuje do projektu:
          <ul className="mt-1 space-y-0.5 list-none">
            <li className="flex items-center gap-1"><span className="text-emerald-600 font-bold">✓</span> PDF — specyfikacja techniczna z kosztorysem KNR</li>
            <li className="flex items-center gap-1"><span className="text-emerald-600 font-bold">✓</span> SVG — wizualizacja front-view modułów na szynie</li>
            <li className="flex items-center gap-1"><span className={schematReadyRef.current ? "text-emerald-600 font-bold" : "text-amber-500 font-bold"}>{schematReadyRef.current ? "✓" : "!"}</span>
              <span>{schematReadyRef.current ? "SVG — schemat wieloliniowy" : "SVG schemat — wygeneruj w zakładce Schemat"}</span>
            </li>
            {isPro && (
              <li className="flex items-center gap-1"><span className={schematReadyRef.current ? "text-emerald-600 font-bold" : "text-slate-400 font-bold"}>{schematReadyRef.current ? "✓" : "○"}</span>
                <span>{schematReadyRef.current ? "DXF — schemat CAD (AutoCAD/BricsCAD)" : "DXF — dostępny po wygenerowaniu schematu"}</span>
              </li>
            )}
            {!isPro && (
              <li className="flex items-center gap-1 text-amber-700 dark:text-amber-400">
                <Lock className="w-3 h-3" />
                <span>DXF (CAD) — dostępny w planie PRO</span>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
