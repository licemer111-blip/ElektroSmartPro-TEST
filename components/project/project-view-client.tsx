"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useMaterialBrain } from "@/hooks/useMaterialBrain";
import { ProjectSummary } from "./project-summary";
import { useTabSyncOptional } from "./tab-sync-context";
import { PanelRightClose, Calculator, FileText, Download, X as XIcon, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CoPilotSession } from "./copilot-session";
import { MobileSummaryBar } from "./mobile-summary-bar";
import type { ProjectItem, ProjectWithRelations, Profile, CatalogCategory, CatalogItem } from "@/lib/types/database";
import { useProjectPricing } from "@/hooks/use-project-pricing";
import { useProjectPdfDownload } from "@/hooks/use-project-pdf-download";
import { useSummaryCollapse } from "@/hooks/use-summary-collapse";
import { useProjectTabSync } from "@/hooks/useProjectTabSync";
import { ProjectTabContainer } from "./_parts/ProjectTabContainer";
import { MaterialBrainProvider } from "./_parts/MaterialBrainContext";

export type ProjectTab = "estimate" | "materials" | "notes" | "photos" | "settings" | "rentownosc";

interface Region {
  id: string;
  name: string;
  slug: string;
  price_modifier: number;
}

interface ProjectViewClientProps {
  project: ProjectWithRelations;
  items: ProjectItem[];
  profile: Profile | null;
  projectId: string;
  userId: string;
  isPro: boolean;
  currentAssemblyCount: number;
  categories: CatalogCategory[];
  catalogItemsByCategory: { categoryId: string; items: CatalogItem[] }[];
  regions: Region[];
  isCoPilotActive?: boolean;
  onCoPilotClose?: () => void;
  isReadOnly?: boolean;
}

export function ProjectViewClient({
  project,
  items,
  profile,
  projectId,
  userId,
  isPro,
  currentAssemblyCount,
  categories,
  catalogItemsByCategory,
  regions,
  isCoPilotActive: externalCoPilotActive,
  onCoPilotClose,
  isReadOnly = false,
}: ProjectViewClientProps) {
  const [colorMode, setColorMode] = useState(project.expert_coloring ?? true);
  const [compactView, setCompactView] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 640 : true
  );

  // ─── Live doc settings state (Pult 5-w-1) ────────────────────────────────
  const [liveShowKnr, setLiveShowKnr] = useState(project.show_knr ?? false);
  const [liveBruttoMode, setLiveBruttoMode] = useState(project.brutto_mode ?? false);
  const [liveShowLaborHours, setLiveShowLaborHours] = useState(project.show_labor_hours_in_pdf ?? false);
  const [liveExpertColoring, setLiveExpertColoring] = useState(project.expert_coloring ?? true);
  const [liveVatRate, setLiveVatRate] = useState(project.vat_rate ?? 23);
  const [selectedEstimateIds, setSelectedEstimateIds] = useState<Set<string>>(new Set());
  const handleSelectedIdsChange = useCallback((ids: Set<string>) => setSelectedEstimateIds(new Set(ids)), []);

  const {
    liveHourlyRate: liveHourlyRateFromHook,
    liveRegionId,
    setLiveRegionId,
    isRegionPending,
    currentRegion,
    useCustomRates,
    handleRegionChange,
  } = useProjectPricing({ project, profile, regions, isReadOnly });

  const liveHourlyRate = liveHourlyRateFromHook;

  const {
    isDownloading,
    pdfNotes,
    setPdfNotes,
    pdfPreviewUrl,
    pdfPreviewName,
    isIosSafari,
    handleDownloadPDF,
    handleConfirmPdfDownload,
    handleClosePdfPreview,
  } = useProjectPdfDownload({
    projectId: project.id,
    projectName: project.name,
    adjustmentPercentage: project.adjustment_percentage || 0,
    colorMode,
  });

  const { summaryCollapsed, toggleSummary } = useSummaryCollapse();
  const { activeTab, handleTabChange } = useProjectTabSync();
  const tabSyncContext = useTabSyncOptional();

  // ─── Stable refs for tabSyncContext to avoid useEffect dep on whole object ──
  const tabSyncSetUIStateRef = useRef(tabSyncContext?.setUIState);
  const tabSyncIsExternalSyncRef = useRef(tabSyncContext?.isExternalSync);
  tabSyncSetUIStateRef.current = tabSyncContext?.setUIState;
  tabSyncIsExternalSyncRef.current = tabSyncContext?.isExternalSync;

  const [internalCoPilotActive, setInternalCoPilotActive] = useState(false);
  const isCoPilotActive = externalCoPilotActive ?? internalCoPilotActive;
  const setIsCoPilotActive = useCallback((value: boolean) => {
    if (externalCoPilotActive === undefined) {
      setInternalCoPilotActive(value);
    } else if (!value && onCoPilotClose) {
      onCoPilotClose();
    }
  }, [externalCoPilotActive, onCoPilotClose]);

  useEffect(() => {
    if (tabSyncContext?.isExternalSync && tabSyncContext?.uiState?.coPilotActive !== undefined) {
      if (tabSyncContext.uiState.coPilotActive !== isCoPilotActive) {
        setIsCoPilotActive(tabSyncContext.uiState.coPilotActive);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabSyncContext?.isExternalSync, tabSyncContext?.uiState?.coPilotActive]);

  useEffect(() => {
    if (!tabSyncIsExternalSyncRef.current) {
      tabSyncSetUIStateRef.current?.({ coPilotActive: isCoPilotActive });
    }
  }, [isCoPilotActive]);

  useEffect(() => {
    if (tabSyncContext?.isExternalSync && tabSyncContext?.uiState?.colorMode !== undefined) {
      if (tabSyncContext.uiState.colorMode !== colorMode) {
        setColorMode(tabSyncContext.uiState.colorMode);
      }
    }
  }, [tabSyncContext?.isExternalSync, tabSyncContext?.uiState?.colorMode, colorMode]);

  useEffect(() => {
    if (!tabSyncIsExternalSyncRef.current) {
      tabSyncSetUIStateRef.current?.({ colorMode });
    }
  }, [colorMode]);

  // ─── Pult 5-w-1 + Region broadcast (owner → observers) ────────────────────────
  useEffect(() => {
    if (!tabSyncIsExternalSyncRef.current) tabSyncSetUIStateRef.current?.({ liveVatRate });
  }, [liveVatRate]);
  useEffect(() => {
    if (!tabSyncIsExternalSyncRef.current) tabSyncSetUIStateRef.current?.({ liveRegionId });
  }, [liveRegionId]);
  useEffect(() => {
    if (!tabSyncIsExternalSyncRef.current) tabSyncSetUIStateRef.current?.({ liveBruttoMode });
  }, [liveBruttoMode]);
  useEffect(() => {
    if (!tabSyncIsExternalSyncRef.current) tabSyncSetUIStateRef.current?.({ liveShowKnr });
  }, [liveShowKnr]);
  useEffect(() => {
    if (!tabSyncIsExternalSyncRef.current) tabSyncSetUIStateRef.current?.({ liveShowLaborHours });
  }, [liveShowLaborHours]);
  useEffect(() => {
    if (!tabSyncIsExternalSyncRef.current) tabSyncSetUIStateRef.current?.({ liveExpertColoring });
  }, [liveExpertColoring]);
  useEffect(() => {
    if (!tabSyncIsExternalSyncRef.current) tabSyncSetUIStateRef.current?.({ compactView });
  }, [compactView]);
  useEffect(() => {
    if (!tabSyncIsExternalSyncRef.current) tabSyncSetUIStateRef.current?.({ summaryCollapsed });
  }, [summaryCollapsed]);

  // ─── Pult 5-w-1 receive (observers apply from leader) ─────────────────────
  useEffect(() => {
    if (!tabSyncContext?.isExternalSync) return;
    const s = tabSyncContext.uiState;
    if (s.liveVatRate !== undefined && s.liveVatRate !== liveVatRate) setLiveVatRate(s.liveVatRate);
    if (s.liveBruttoMode !== undefined && s.liveBruttoMode !== liveBruttoMode) setLiveBruttoMode(s.liveBruttoMode);
    if (s.liveShowKnr !== undefined && s.liveShowKnr !== liveShowKnr) setLiveShowKnr(s.liveShowKnr);
    if (s.liveShowLaborHours !== undefined && s.liveShowLaborHours !== liveShowLaborHours) setLiveShowLaborHours(s.liveShowLaborHours);
    if (s.liveExpertColoring !== undefined && s.liveExpertColoring !== liveExpertColoring) setLiveExpertColoring(s.liveExpertColoring);
    if (s.compactView !== undefined && s.compactView !== compactView) setCompactView(s.compactView);
    if (s.summaryCollapsed !== undefined && s.summaryCollapsed !== summaryCollapsed) {
      if (s.summaryCollapsed && !summaryCollapsed) toggleSummary();
      if (!s.summaryCollapsed && summaryCollapsed) toggleSummary();
    }
    if (s.liveRegionId !== undefined && s.liveRegionId !== liveRegionId) setLiveRegionId(s.liveRegionId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tabSyncContext?.isExternalSync,
    tabSyncContext?.uiState?.liveRegionId,
    tabSyncContext?.uiState?.liveVatRate,
    tabSyncContext?.uiState?.liveBruttoMode,
    tabSyncContext?.uiState?.liveShowKnr,
    tabSyncContext?.uiState?.liveShowLaborHours,
    tabSyncContext?.uiState?.liveExpertColoring,
    tabSyncContext?.uiState?.compactView,
    tabSyncContext?.uiState?.summaryCollapsed,
  ]);

  const isFinal = project.status === "final";

  // ─── Auto-generate Excel + PDF when project is finalized ─────────────────
  useEffect(() => {
    const handler = async (e: Event) => {
      const { projectId: evtId } = (e as CustomEvent<{ projectId: string }>).detail;
      if (evtId !== projectId) return;

      // ── Excel ──────────────────────────────────────────────────────────────
      try {
        const { buildExcelBuffer } = await import("@/lib/utils/excel-export");
        const result = buildExcelBuffer(project, items, isPro);
        if (result?.buffer) {
          const base64 = btoa(String.fromCharCode(...new Uint8Array(result.buffer)));
          const { saveGeneratedDocumentToProject } = await import("@/app/dashboard/projects/[id]/document-actions");
          await saveGeneratedDocumentToProject(
            projectId, base64, result.storageName,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          );
        }
      } catch {
        // Non-critical — Excel auto-save failure is silent
      }

      // ── PDF ────────────────────────────────────────────────────────────────
      try {
        const res = await fetch("/api/pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            priceModifier: project.adjustment_percentage || 0,
            showColors: colorMode,
            notes: pdfNotes,
            template: typeof window !== "undefined"
              ? localStorage.getItem("elektrosmart-pdf-template") || "klasyczny"
              : "klasyczny",
            vatMode: project.vat_rate ?? 23,
            priceDisplay: "both",
          }),
        });
        if (res.ok) {
          const arrayBuffer = await res.arrayBuffer();
          // Safe base64 encoding for large files (avoids stack overflow from spread)
          const bytes = new Uint8Array(arrayBuffer);
          let binary = "";
          const chunkSize = 8192;
          for (let i = 0; i < bytes.length; i += chunkSize) {
            binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
          }
          const base64 = btoa(binary);
          const safeName = (project.name || "Kosztorys").replace(/[^a-zA-Z0-9_-]/g, "_");
          // Stable filename prefix (no timestamp) so saveGeneratedDocumentToProject deduplicates
          const fileName = `Kosztorys_PDF_${safeName}.pdf`;
          const { saveGeneratedDocumentToProject } = await import("@/app/dashboard/projects/[id]/document-actions");
          await saveGeneratedDocumentToProject(projectId, base64, fileName, "application/pdf");
        }
      } catch {
        // Non-critical — PDF auto-save failure is silent
      }
    };

    window.addEventListener("project-finalized", handler);
    return () => window.removeEventListener("project-finalized", handler);
  }, [projectId, project, items, isPro, colorMode, pdfNotes]);

  const brain = useMaterialBrain(projectId, !project.materials_owned_by_customer, liveVatRate);

  return (
    <MaterialBrainProvider
      projectId={projectId}
      vatRate={project.vat_rate ?? 23}
      bills={brain.bills}
      isLoading={brain.isLoading}
      refreshBrain={brain.refresh}
    >
    <div className="flex flex-col pb-20 lg:pb-0">
      <div className={`grid grid-cols-1 ${summaryCollapsed ? "" : "lg:grid-cols-[1fr_minmax(0,280px)]"} gap-4 lg:gap-6 items-start`}>
        {/* Main content — all tabs via _parts/ProjectTabContainer */}
        <div className="min-w-0">
          <ProjectTabContainer
            activeTab={activeTab as ProjectTab}
            project={project}
            items={items}
            profile={profile}
            projectId={projectId}
            userId={userId}
            isPro={isPro}
            currentAssemblyCount={currentAssemblyCount}
            categories={categories}
            catalogItemsByCategory={catalogItemsByCategory}
            regions={regions}
            isReadOnly={isReadOnly}
            isFinal={isFinal}
            liveHourlyRate={liveHourlyRate}
            liveRegionId={liveRegionId}
            isRegionPending={isRegionPending}
            currentRegion={currentRegion}
            useCustomRates={useCustomRates}
            handleRegionChange={handleRegionChange}
            colorMode={colorMode}
            setColorMode={setColorMode}
            compactView={compactView}
            setCompactView={setCompactView}
            summaryCollapsed={summaryCollapsed}
            toggleSummary={toggleSummary}
            onSelectedIdsChange={handleSelectedIdsChange}
            handleTabChange={handleTabChange}
            liveShowKnr={liveShowKnr}
            liveBruttoMode={liveBruttoMode}
            liveShowLaborHours={liveShowLaborHours}
            liveExpertColoring={liveExpertColoring}
            onBruttoModeChange={setLiveBruttoMode}
            onLaborHoursChange={setLiveShowLaborHours}
            onKnrChange={setLiveShowKnr}
            liveVatRate={liveVatRate}
            onVatRateChange={setLiveVatRate}
          />

        </div>

        {/* Right sidebar — Summary (280px), sticky, collapsible */}
        {summaryCollapsed && (
          <button
            onClick={toggleSummary}
            className="hidden lg:flex fixed right-0 top-1/3 z-30 items-center gap-1.5 px-2.5 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-l-xl shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:shadow-[0_0_25px_rgba(59,130,246,0.7)] transition-all animate-pulse"
            title="Poka\u017c podsumowanie"
            style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
          >
            <Calculator className="w-4 h-4" />
            <span className="text-xs font-bold tracking-wide">Podsumowanie</span>
          </button>
        )}

        {!summaryCollapsed && (
          <div className="min-w-0 hidden lg:block sticky top-4">
            <div className="relative">
              <button
                onClick={toggleSummary}
                className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800/60 shadow-sm ring-2 ring-blue-300/50 dark:ring-blue-600/30 animate-pulse hover:animate-none transition-colors"
                title="Ukryj podsumowanie"
              >
                <PanelRightClose className="w-4 h-4" />
              </button>
              <ProjectSummary
                project={project}
                items={items}
                profile={profile}
                colorMode={colorMode}
                bruttoMode={liveBruttoMode}
                onDownloadPDF={handleDownloadPDF}
                isDownloading={isDownloading}
                pdfNotes={pdfNotes}
                onPdfNotesChange={setPdfNotes}
                projectStatus={project.status}
                liveRegionId={liveRegionId}
                regions={regions}
              />
            </div>
          </div>
        )}

        <CoPilotSession
          projectId={projectId}
          isOpen={isCoPilotActive}
          onClose={() => setIsCoPilotActive(false)}
        />

        <MobileSummaryBar
          project={project}
          items={items}
          profile={profile}
          onDownloadPDF={handleDownloadPDF}
          isDownloading={isDownloading}
          pdfNotes={pdfNotes}
          onPdfNotesChange={setPdfNotes}
        />
      </div>

      {/* PDF Preview Modal */}
      <Dialog open={!!pdfPreviewUrl} onOpenChange={(o) => { if (!o) handleClosePdfPreview(); }}>
        <DialogContent hideCloseButton className="sm:max-w-4xl h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="flex-row items-center justify-between px-4 py-3 border-b shrink-0">
            <DialogTitle className="text-sm font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Podgląd PDF — {project.name}
            </DialogTitle>
            <DialogDescription className="sr-only">Podgląd wygenerowanego dokumentu PDF kosztorysu.</DialogDescription>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleConfirmPdfDownload}
                className="h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Download className="w-3.5 h-3.5" />
                Pobierz PDF
              </Button>
              <Button size="sm" variant="ghost" onClick={handleClosePdfPreview} className="h-8 w-8 p-0">
                <XIcon className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {pdfPreviewUrl && (
              isIosSafari ? (
                <div className="flex flex-col items-center justify-center h-full gap-5 p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-blue-500" />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Podgl\u0105d PDF niedost\u0119pny w iOS Safari
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
                      iOS Safari nie obs\u0142uguje wy\u015bwietlania plik\u00f3w PDF w oknie dialogowym.
                      Otw\u00f3rz dokument w nowej karcie, aby go przejrze\u0107.
                    </p>
                  </div>
                  <a
                    href={pdfPreviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Otw\u00f3rz PDF w nowej karcie
                  </a>
                </div>
              ) : (
                <iframe src={pdfPreviewUrl} className="w-full h-full border-0" title="Podgl\u0105d PDF" />
              )
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </MaterialBrainProvider>
  );
}
