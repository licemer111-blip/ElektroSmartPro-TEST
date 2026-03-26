"use client";

import React, { useMemo, useCallback, useEffect, useState, useRef } from "react";
import { panelStateStore } from "@/lib/panel-state-store";
import { useDebouncedCallback } from "@/hooks/panel/usePanelStore";
import { updateProjectItem } from "@/app/dashboard/projects/[id]/_actions/project-items";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import {
  LayoutGrid,
  Zap,
  Loader2,
  X,
  Plus,
} from "lucide-react";
import { getAiUsage } from "@/app/dashboard/panel-configurator/ai-schemat-action";
import type { PricingResult } from "@/app/dashboard/panel-configurator/ai-pricing-action";
import { usePanelRealtimeSync } from "@/hooks/usePanelRealtimeSync";
import { usePanelDerivedState } from "@/hooks/usePanelDerivedState";
import { usePanelSlotActions } from "@/hooks/usePanelSlotActions";
import { usePanelConfigActions } from "@/hooks/usePanelConfigActions";
import { usePanelAiActions } from "@/hooks/usePanelAiActions";
import { usePanelModuleActions } from "@/hooks/usePanelModuleActions";
import { PanelSchematTab } from "@/components/project/panel-schemat-tab";
import { PanelSummaryTab } from "@/components/project/panel-summary-tab";
import { PanelTemplatesTab } from "@/components/project/panel-templates-tab";
import { PanelBuildLegend } from "@/components/project/panel-build-legend";
import { PanelRcdGroups } from "@/components/project/panel-rcd-groups";
import { PanelDiagnostics } from "@/components/project/panel-diagnostics";
import { PanelZugPanel } from "@/components/project/panel-zug-panel";
import { PanelAiDialog } from "@/components/project/panel-ai-dialog";
import { PanelLoadConfigDialog } from "@/components/project/panel-load-config-dialog";
import { PanelInfoFooter } from "@/components/project/panel-info-footer";
import { PanelCalculatorsTab } from "@/components/project/panel-calculators-tab";
import { PanelBuildTips } from "@/components/project/panel-build-tips";
import { PanelConfigBar } from "@/components/project/panel-config-bar";
import { PanelSectionMeta } from "@/components/project/panel-section-meta";
import { PanelSectionTabs } from "@/components/project/panel-section-tabs";
import { PanelEnclosureHeader } from "@/components/project/panel-enclosure-header";
import { PanelEmptyState } from "@/components/project/panel-empty-state";
import { PanelViewerIndicator } from "@/components/project/panel-viewer-indicator";
import { PanelClearConfirmDialog } from "@/components/project/panel-clear-confirm-dialog";
import { PanelTabsList } from "@/components/project/panel-tabs-list";
import {
  computeRailRows,
  getShortName,
  getModulePrice,
} from "./panel-configurator-helpers";
import { validatePanelSection } from "./panel-validation";
import type {
  DinModule,
  RailModule,
  IssueSeverity,
  ValidationIssue,
  SectionFeed,
  SectionType,
  PanelSection,
  Manufacturer,
  TemplateRailModule,
  TemplateAccessory,
  PanelTemplateSection,
  PanelTemplate,
  PanelConfiguratorProps,
  SelectedSlot,
  GhostModuleData,
} from "./panel-configurator-types";

import {
  ENCLOSURE_OPTIONS,
  MANUFACTURERS,
} from "./rozdzielnica/din-modules-catalog";
import { ModuleLibrary } from "./rozdzielnica/ModuleLibrary";
import { PhaseBalancer } from "./rozdzielnica/PhaseBalancer";
import { BOMExporter } from "./rozdzielnica/BOMExporter";
import { GridBoard } from "./rozdzielnica/GridBoard";
import { usePanelReducer } from "./rozdzielnica/usePanelReducer";
import { useGlobalSettings, formatDisplayPrice } from "@/hooks/use-global-settings";
import { ConfiguratorTabs } from "@/components/project/_parts/ConfiguratorTabs";
import { ConfiguratorModals } from "@/components/project/_parts/ConfiguratorModals";
import { DIN_MODULES_COUNT } from "@/lib/data/din-modules-stats";

// =============================================
// PANEL SECTION FACTORY
// =============================================
function createDefaultSection(name?: string, feed?: SectionFeed, type?: SectionType): PanelSection {
  return {
    id: crypto.randomUUID(),
    name: name || "Sekcja 1",
    feed: feed || "main",
    type: type || "distribution",
    enclosure: ENCLOSURE_OPTIONS[2],
    modules: [],
    accessories: [],
  };
}

// =============================================
// MAIN COMPONENT
// =============================================
export function PanelConfigurator({ projectId, isPro = false, projectStatus = "draft", regionModifier = 1.0, userId, userProfile, asPage = false, isReadOnly = false, externalOpen, onExternalOpenChange }: PanelConfiguratorProps) {
  // ── Single reducer replaces 31 useState calls ────────────────────────────────
  const {
    state: ps,
    setOpen, setSections, setActiveSectionIdx, setPanelName, setActiveTab,
    setModuleSearch, setIsAdding, setIsExporting, setIsDownloading,
    setCollapsedCats, toggleCat,
    setDragUid, setSelectedUid, setEditingAccessoryUid,
    setShowAiPanel, setAiDescription, setAiGenerating,
    setAiSchematTrees, setAiSchematLoading, setAiValidationNotes, setAiUsageInfo,
    setSelectedManufacturer, setCustomCoefficient,
    setCatalogMode, setCustomModules, setCustomCats,
    setCollapsedCustomCats, toggleCustomCat,
    setShowCustomForm, setShowNewCatForm, setNewCatName,
    setCustomForm, resetCustomForm,
    setSavedConfigs, setCurrentConfigId, setIsSaving,
    setShowLoadDialog, setShowClearConfirm,
    setPricingResult, setIsWycenLoading,
    setManualPrices, setPricingMode,
    setCircuitEditCell,
    dispatch,
  } = usePanelReducer(asPage, [createDefaultSection()]);

  // Sync open with external controller (co-pilot Following mode)
  useEffect(() => {
    if (externalOpen !== undefined && externalOpen !== ps.open) setOpen(externalOpen);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalOpen]);

  // Destructure state for local use (drop-in for old useState variables)
  const {
    open, sections, activeSectionIdx, panelName, activeTab,
    moduleSearch, isAdding, isExporting,
    collapsedCats, dragUid, selectedUid, editingAccessoryUid,
    showAiPanel, aiDescription, aiGenerating,
    aiSchematTrees, aiSchematLoading, aiUsageInfo,
    selectedManufacturer, customCoefficient,
    catalogMode, customModules, customCats, collapsedCustomCats,
    showCustomForm, showNewCatForm, newCatName, customForm,
    savedConfigs, currentConfigId, isSaving,
    showLoadDialog, showClearConfirm,
    pricingResult, isWycenLoading,
    manualPrices, pricingMode,
    circuitEditCell,
  } = ps;

  const schematSvgRef = React.useRef<string>("");
  const schematReadyRef = React.useRef(false);
  const { toast } = useToast();
  const router = useRouter();

  // ── Global Persistence: restore from store on mount ───────────────────────────
  // storeRestoredRef: true after mount restore attempt (avoids writing stale empty state back)
  const storeRestoredRef = useRef(false);
  useEffect(() => {
    if (storeRestoredRef.current) return;
    storeRestoredRef.current = true;
    const snapshot = panelStateStore.get(projectId);
    if (!snapshot || snapshot.sections.length === 0) return;
    setSections(snapshot.sections);
    if (snapshot.panelName) setPanelName(snapshot.panelName);
    if (snapshot.currentConfigId) setCurrentConfigId(snapshot.currentConfigId);
    const mfr = MANUFACTURERS.find((m) => m.id === snapshot.selectedManufacturerId);
    if (mfr) setSelectedManufacturer(mfr);
    if (snapshot.customCoefficient !== 1.0) setCustomCoefficient(snapshot.customCoefficient);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // ── Global Persistence: write to store on every relevant change ───────────────
  // Guard: skip the very first synchronous render (before restore runs) by
  // checking that at least one section exists or the name is set.
  // This prevents overwriting a valid snapshot with the empty initial state.
  useEffect(() => {
    if (sections.length === 0 && !panelName) return;
    panelStateStore.set(projectId, {
      sections,
      panelName,
      selectedManufacturerId: selectedManufacturer.id,
      customCoefficient,
      currentConfigId,
    });
  }, [projectId, sections, panelName, selectedManufacturer.id, customCoefficient, currentConfigId]);

  // ── Realtime Koszorys Sync: debounced update of linked project item ───────────
  const debouncedSyncToKoszorys = useDebouncedCallback(
    async (
      pid: string,
      itemId: string,
      secs: PanelSection[],
      name: string,
      coeff: number,
      regMod: number
    ) => {
      let totalMat = 0;
      let totalLab = 0;
      for (const sec of secs) {
        totalMat += sec.enclosure.price;
        totalLab += sec.enclosure.laborPrice;
        for (const m of sec.modules) {
          const pr = getModulePrice(m, coeff);
          totalMat += pr.material;
          totalLab += pr.labor;
        }
        for (const acc of sec.accessories) {
          const pr = getModulePrice(acc, coeff);
          totalMat += pr.material;
          totalLab += pr.labor;
        }
      }
      await updateProjectItem(pid, itemId, {
        name: `📦 ${name.trim() || "Rozdzielnica"}`,
        final_material_price: Math.round(totalMat * 100) / 100,
        final_labor_price: Math.round(totalLab * regMod * 100) / 100,
      });
    },
    1500
  );

  useEffect(() => {
    const snapshot = panelStateStore.get(projectId);
    const linkedItemId = snapshot?.linkedItemId ?? null;
    if (!linkedItemId || sections.length === 0) return;
    const coeff = selectedManufacturer.id === "custom" ? customCoefficient : selectedManufacturer.coefficient;
    debouncedSyncToKoszorys(projectId, linkedItemId, sections, panelName, coeff, regionModifier);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections, panelName, selectedManufacturer, customCoefficient, regionModifier]);

  // ── Global settings (VAT / Netto-Brutto / Demo mode) ─────────────────────────
  const { vatMode, priceDisplay } = useGlobalSettings();
  const panelDp = (netto: number) => formatDisplayPrice(netto, vatMode, priceDisplay);

  // ── Viewer Sync (real-time collaboration with LWW) ───────────────────────────
  const { isViewerMode, leaderName, syncOnlineUsers, startFollowing, stopFollowing } = usePanelRealtimeSync({
    projectId,
    sections, customModules, customCats,
    activeSectionIdx, activeTab, selectedUid, editingAccessoryUid,
    showAiPanel, aiDescription, pricingMode, catalogMode,
    collapsedCats, collapsedCustomCats, panelName,
    selectedManufacturer, customCoefficient, showLoadDialog, showClearConfirm,
    moduleSearch, circuitEditCell,
    setSections, setActiveTab, setActiveSectionIdx, setSelectedUid,
    setEditingAccessoryUid, setShowAiPanel, setAiDescription,
    setPricingMode, setCatalogMode, setCollapsedCats, setCollapsedCustomCats,
    setPanelName, setSelectedManufacturer, setCustomCoefficient,
    setShowLoadDialog, setShowClearConfirm, setModuleSearch,
    setCustomModules, setCustomCats, setCircuitEditCell,
    MANUFACTURERS,
  });

  // ── Derived state (totals, issues, railRows) ───────────────────────────────
  const manufacturerCoeff = selectedManufacturer.id === "custom" ? customCoefficient : selectedManufacturer.coefficient;

  const {
    activeSection,
    railModules,
    accessoryItems,
    selectedEnclosure,
    modulesPerRow,
    allModules,
    allAccessories,
    totalModules,
    totalMaterialCost,
    totalLaborCost,
    grandTotalMaterial,
    grandTotalLabor,
    selectedModule,
    sectionPowerBalance,
    activeIssues,
    allCriticalErrors,
    moduleIssueMap,
    railRows,
    selectedRowIdx,
    occupancyPercent,
    overflow,
  } = usePanelDerivedState({ sections, activeSectionIdx, manufacturerCoeff, selectedUid });

  // Section-aware setters — dispatch directly into reducer so updater always
  // receives fresh state (eliminates stale-closure double-add bug).
  const setRailModules = useCallback((updater: React.SetStateAction<RailModule[]>) => {
    if (typeof updater === "function") {
      dispatch({ type: "UPDATE_SECTION_MODULES", sectionIdx: activeSectionIdx, updater });
    } else {
      dispatch({ type: "UPDATE_SECTION_MODULES", sectionIdx: activeSectionIdx, updater: () => updater });
    }
  }, [activeSectionIdx, dispatch]);

  const setAccessoryItems = useCallback((updater: React.SetStateAction<RailModule[]>) => {
    if (typeof updater === "function") {
      dispatch({ type: "UPDATE_SECTION_ACCESSORIES", sectionIdx: activeSectionIdx, updater });
    } else {
      dispatch({ type: "UPDATE_SECTION_ACCESSORIES", sectionIdx: activeSectionIdx, updater: () => updater });
    }
  }, [activeSectionIdx, dispatch]);

  const setSelectedEnclosure = useCallback((enc: typeof ENCLOSURE_OPTIONS[number]) => {
    setSections(prev => {
      const next = [...prev];
      const idx = Math.min(activeSectionIdx, next.length - 1);
      next[idx] = { ...next[idx], enclosure: enc };
      return next;
    });
  }, [activeSectionIdx]);

  // Section management
  const addSection = useCallback((name?: string, feed?: SectionFeed, type?: SectionType) => {
    const sectionNum = sections.length + 1;
    const newSection = createDefaultSection(name || `Sekcja ${sectionNum}`, feed, type);
    setSections(prev => [...prev, newSection]);
    setActiveSectionIdx(sections.length);
    setSelectedUid(null);
    toast({ title: "Dodano sekcję", description: newSection.name });
  }, [sections.length, toast]);

  const removeSection = useCallback((idx: number) => {
    if (sections.length <= 1) return;
    setSections(prev => prev.filter((_, i) => i !== idx));
    setActiveSectionIdx(prev => Math.min(prev, sections.length - 2));
    setSelectedUid(null);
  }, [sections.length]);

  const updateSectionMeta = useCallback((idx: number, updates: Partial<Pick<PanelSection, "name" | "feed" | "type">>) => {
    setSections(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...updates };
      return next;
    });
  }, []);

  const isFinal = projectStatus === "final";

  const updateModule = useCallback((uid: string, updates: Partial<Pick<RailModule, "rating" | "customMaterialPrice" | "customLaborPrice" | "label" | "customName" | "circuitNumber" | "cableType" | "parentRcdUid" | "quantity" | "phase" | "terminalCount" | "isZugBlock">>) => {
    setRailModules(prev => {
      const exists = prev.some(m => m.uid === uid);
      if (exists) return prev.map(m => m.uid === uid ? { ...m, ...updates } : m);
      return prev;
    });
    setAccessoryItems(prev => prev.map(m => m.uid === uid ? { ...m, ...updates } : m));
    setAiSchematTrees([]);
  }, [setRailModules, setAccessoryItems]);

  const { addModule, removeModule, duplicateModule, handleDragDrop } = usePanelModuleActions({
    setRailModules, setAccessoryItems, setAiSchematTrees, setDragUid,
  });

  // ── Slot placement + SVG export ───────────────────────────────────────────
  const {
    selectedSlot,
    setSelectedSlot,
    ghostModuleData,
    setGhostModuleData,
    handleSlotClick,
    handleSlotAwareAddModule,
    handleExportSvg,
  } = usePanelSlotActions({
    railRows, railModules, modulesPerRow,
    sections, panelName, selectedManufacturer, isPro, projectId,
    addModule, setAiSchematTrees, toast,
  });


  // Download DXF locally
  const {
    handleDownloadDxf,
    handleCsvImport,
    handleCsvExport,
    handleExcelImport,
    handleSaveConfig,
    handleLoadConfigsList,
    handleLoadConfig,
    handleDeleteConfig,
    handleRenameConfig,
    handleDuplicateConfig,
    refreshSavedConfigs,
    handleAddToProject,
    handleDownloadPdf,
    handleExportPdf,
  } = usePanelConfigActions({
    panelName, selectedManufacturer, customCoefficient, customModules, customCats,
    sections, projectId, currentConfigId, savedConfigs,
    allModulesLength: allModules.length,
    isPro, activeTab, isFinal, manufacturerCoeff,
    toast, setPanelName, setSelectedManufacturer, setCustomCoefficient,
    setCustomModules, setCustomCats, setSections, setRailModules,
    setActiveSectionIdx, setCurrentConfigId, setSavedConfigs,
    setShowLoadDialog, setActiveTab, setIsSaving, setIsAdding,
    router,
    selectedEnclosure, totalModules, grandTotalMaterial, grandTotalLabor,
    railModulesLength: railModules.length,
    schematSvgRef, setIsDownloading, setIsExporting,
    handleExportSvg,
  });

  const moveModuleToSection = useCallback((uid: string, targetSectionIdx: number) => {
    setSections((prev) => {
      const sourceIdx = prev.findIndex((s) => s.modules.some((m) => m.uid === uid));
      if (sourceIdx === -1 || sourceIdx === targetSectionIdx) return prev;
      const mod = prev[sourceIdx].modules.find((m) => m.uid === uid);
      if (!mod) return prev;
      const next = [...prev];
      next[sourceIdx] = { ...next[sourceIdx], modules: next[sourceIdx].modules.filter((m) => m.uid !== uid) };
      next[targetSectionIdx] = { ...next[targetSectionIdx], modules: [...next[targetSectionIdx].modules, mod] };
      return next;
    });
    setSelectedUid(null);
  }, [setSections, setSelectedUid]);

  // Auto-refresh saved configs when templates tab is opened
  useEffect(() => {
    if (activeTab === "templates") {
      refreshSavedConfigs();
    }
  }, [activeTab, refreshSavedConfigs]);

  // Fetch AI usage when schemat tab is opened
  useEffect(() => {
    if (activeTab === "schemat") {
      getAiUsage().then(setAiUsageInfo).catch(() => {});
    }
  }, [activeTab]);

  const {
    applyTemplate,
    handleAIPricing,
    handleAiGenerate,
  } = usePanelAiActions({
    sections, panelName, selectedManufacturer, manufacturerCoeff,
    aiDescription, toast, setSections, setPanelName,
    setActiveSectionIdx, setActiveTab, setShowAiPanel, setAiDescription,
    setAiGenerating, setAiSchematTrees, setIsWycenLoading,
    setPricingResult, setPricingMode, setManualPrices, updateModule,
    voivodeshipModifier: regionModifier,
    userId,
  });


  const configBar = (
    <PanelConfigBar
      panelName={panelName}
      setPanelName={setPanelName}
      selectedManufacturer={selectedManufacturer}
      setSelectedManufacturer={setSelectedManufacturer}
      customCoefficient={customCoefficient}
      setCustomCoefficient={setCustomCoefficient}
      selectedEnclosure={selectedEnclosure}
      setSelectedEnclosure={setSelectedEnclosure}
      isPro={isPro}
    />
  );

  // ── _parts: ConfiguratorTabs (all tab content) ────────────────────────────
  const tabsBlock = (
    <ConfiguratorTabs
      ps={ps}
      cb={{
        setActiveTab, setActiveSectionIdx, setSelectedUid, setDragUid,
        setModuleSearch, toggleCat, setCatalogMode,
        setCustomModules, setCustomCats, setCollapsedCustomCats,
        setShowCustomForm, setShowNewCatForm, setNewCatName,
        setCustomForm,
        setShowAiPanel, setAiDescription, setAiSchematTrees,
        setAiSchematLoading, setAiValidationNotes, setAiUsageInfo, setCircuitEditCell,
        setManualPrices, setPricingMode, setPricingResult,
        setShowClearConfirm, setEditingAccessoryUid,
        addSection, removeSection, updateSectionMeta,
        handleSlotAwareAddModule, removeModule, duplicateModule, updateModule, moveModuleToSection,
        handleDragDrop, handleSlotClick, setGhostModuleData, setSelectedSlot,
        setRailModules, handleSaveConfig, handleLoadConfigsList,
        applyTemplate, handleLoadConfig, handleRenameConfig, handleDuplicateConfig,
        handleDeleteConfig, refreshSavedConfigs,
        handleAIPricing, handleDownloadPdf, handleExportPdf, handleAddToProject,
        handleExportSvg, handleDownloadDxf, toast,
      }}
      derived={{
        activeSection: activeSection ?? sections[activeSectionIdx] ?? sections[0],
        railModules, accessoryItems, selectedEnclosure,
        modulesPerRow, allModules, allAccessories,
        totalModules, totalMaterialCost, totalLaborCost,
        grandTotalMaterial, grandTotalLabor,
        selectedModule: selectedModule ?? null,
        sectionPowerBalance,
        activeIssues, allCriticalErrors, moduleIssueMap, railRows,
        selectedRowIdx, occupancyPercent, overflow,
        manufacturerCoeff, selectedSlot, ghostModuleData,
        isFinal, isPro, projectId, regionModifier,
        schematSvgRef, schematReadyRef,
      }}
    />
  );

  // ── _parts: ConfiguratorModals ─────────────────────────────────────────────
  const modalsBlock = (
    <ConfiguratorModals
      ps={ps}
      setShowAiPanel={setShowAiPanel}
      setAiDescription={setAiDescription}
      handleAiGenerate={handleAiGenerate}
      setShowLoadDialog={setShowLoadDialog}
      handleLoadConfig={handleLoadConfig}
      handleDeleteConfig={handleDeleteConfig}
      applyTemplate={applyTemplate}
      setShowClearConfirm={setShowClearConfirm}
      allModulesCount={allModules.length}
      allAccessoriesCount={allAccessories.length}
      setSections={setSections}
      setSelectedUid={setSelectedUid}
      toast={toast}
      isReadOnly={isReadOnly}
      isViewerMode={isViewerMode}
      leaderName={leaderName}
      syncOnlineUsers={syncOnlineUsers}
      stopFollowing={stopFollowing}
      startFollowing={startFollowing}
    />
  );

  // ── Viewer overlay (CSS pointer-events block) ──────────────────────────────
  const isAnyViewerMode = isViewerMode || isReadOnly;
  const viewerOverlay = isAnyViewerMode ? (
    <style>{`
      [data-viewer-mode="true"] button:not([data-viewer-allowed]),
      [data-viewer-mode="true"] input,
      [data-viewer-mode="true"] textarea,
      [data-viewer-mode="true"] select,
      [data-viewer-mode="true"] [role="combobox"],
      [data-viewer-mode="true"] [role="slider"],
      [data-viewer-mode="true"] [role="checkbox"],
      [data-viewer-mode="true"] [role="switch"] {
        pointer-events: none !important;
        cursor: not-allowed !important;
        opacity: 0.55;
        user-select: none;
      }
      [data-viewer-mode="true"] { cursor: default; }
    `}</style>
  ) : null;

  // Page mode — render directly without Dialog
  if (asPage) {
    return (
      <>
        {viewerOverlay}
        <div
          data-viewer-mode={isAnyViewerMode ? "true" : undefined}
          className={`flex flex-col min-h-screen pb-0 ${isAnyViewerMode ? "select-none" : ""}`}
        >
          <div className="flex-shrink-0 mb-3">
            <h2 className="flex items-center gap-2.5 text-lg font-bold">
              <LayoutGrid className="w-5 h-5 text-blue-600" />
              Konfigurator Rozdzielnicy
            </h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Profesjonalny kreator tablic rozdzielczych — {DIN_MODULES_COUNT}+ modułów DIN, wizualizacja Live, ES-Engine
            </p>
          </div>
          {configBar}
          {tabsBlock}
        </div>
        {modalsBlock}
      </>
    );
  }

  // Dialog mode — wrap in Dialog
  return (
    <>
    <Dialog open={open} onOpenChange={(v) => {
      if (v && isFinal) {
        toast({ title: "🔒 Projekt zablokowany", description: "Odblokuj projekt, aby edytować rozdzielnicę", variant: "destructive" });
        return;
      }
      if (v) panelStateStore.setLastActiveProject(projectId);
      setOpen(v);
      onExternalOpenChange?.(v);
    }}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className={`h-7 sm:h-8 text-[11px] sm:text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0 rounded-md ${isFinal ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          <span>Rozdzielnica</span>
        </Button>
      </DialogTrigger>
      <DialogContent data-viewer-mode={isAnyViewerMode ? "true" : undefined} className={`wide-dialog w-[85vw] max-w-[85vw] max-h-[95vh] sm:max-h-[92vh] overflow-y-auto flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-0 sm:border sm:border-slate-200/80 dark:border-slate-700/80 shadow-2xl rounded-none sm:rounded-lg ${isAnyViewerMode ? "select-none" : ""}`}>
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-blue-600" />
            Konfigurator rozdzielnicy
            <span className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 dark:bg-slate-700 text-[9px] font-medium text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ES-Engine
            </span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Wizualny konstruktor tablicy rozdzielczej wg PN-EN 61439-1/2 — dodaj urządzenia na szyny DIN
          </DialogDescription>
        </DialogHeader>
        {configBar}
        {tabsBlock}
      </DialogContent>
    </Dialog>
    {viewerOverlay}
    {modalsBlock}
    </>
  );
}

