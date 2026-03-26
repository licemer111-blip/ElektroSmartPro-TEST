"use client";
import { useCallback } from "react";
import type { DinModule, RailModule, PanelSection, Manufacturer } from "@/components/project/panel-configurator-types";
import { usePanelExport } from "@/hooks/panel/usePanelExport";
import { usePanelPersistence } from "@/hooks/panel/usePanelPersistence";
import { usePanelProjectSync } from "@/hooks/panel/usePanelProjectSync";
import React from "react";

export type { SavedConfig } from "@/hooks/panel/usePanelPersistence";

export interface UsePanelConfigActionsParams {
  panelName: string;
  selectedManufacturer: Manufacturer;
  customCoefficient: number;
  customModules: DinModule[];
  customCats: Record<string, string>;
  sections: PanelSection[];
  projectId: string;
  currentConfigId: string | null;
  savedConfigs: import("@/hooks/panel/usePanelPersistence").SavedConfig[];
  allModulesLength: number;
  isPro: boolean;
  activeTab: string;
  toast: (opts: { title: string; description?: string; variant?: "default" | "destructive" }) => void;
  setPanelName: (v: string) => void;
  setSelectedManufacturer: (m: Manufacturer) => void;
  setCustomCoefficient: (v: number) => void;
  setCustomModules: (m: DinModule[]) => void;
  setCustomCats: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setSections: React.Dispatch<React.SetStateAction<PanelSection[]>>;
  setRailModules: (updater: React.SetStateAction<RailModule[]>) => void;
  setActiveSectionIdx: (i: number) => void;
  setCurrentConfigId: (id: string | null) => void;
  setSavedConfigs: React.Dispatch<React.SetStateAction<import("@/hooks/panel/usePanelPersistence").SavedConfig[]>>;
  setShowLoadDialog: (v: boolean) => void;
  setActiveTab: (v: string) => void;
  setIsSaving: (v: boolean) => void;
  setIsAdding: (v: boolean) => void;
  isFinal: boolean;
  manufacturerCoeff: number;
  router: { refresh: () => void };
  selectedEnclosure: { modules: number; rows: number; name: string; price: number; laborPrice: number };
  totalModules: number;
  grandTotalMaterial: number;
  grandTotalLabor: number;
  railModulesLength: number;
  schematSvgRef: React.MutableRefObject<string>;
  setIsDownloading: (v: boolean) => void;
  setIsExporting: (v: boolean) => void;
  handleExportSvg: (opts?: { skipDownload?: boolean }) => Promise<string | undefined>;
}

export function usePanelConfigActions(p: UsePanelConfigActionsParams) {
  const exportHook = usePanelExport({
    isPro: p.isPro,
    panelName: p.panelName,
    projectId: p.projectId,
    sections: p.sections,
    selectedManufacturer: p.selectedManufacturer,
    manufacturerCoeff: p.manufacturerCoeff,
    selectedEnclosure: p.selectedEnclosure,
    totalModules: p.totalModules,
    grandTotalMaterial: p.grandTotalMaterial,
    grandTotalLabor: p.grandTotalLabor,
    railModulesLength: p.railModulesLength,
    allModulesLength: p.allModulesLength,
    schematSvgRef: p.schematSvgRef,
    handleExportSvg: p.handleExportSvg,
    setIsDownloading: p.setIsDownloading,
    setIsExporting: p.setIsExporting,
    toast: p.toast,
  });

  const persistenceHook = usePanelPersistence({
    panelName: p.panelName,
    selectedManufacturer: p.selectedManufacturer,
    customCoefficient: p.customCoefficient,
    customModules: p.customModules,
    customCats: p.customCats,
    sections: p.sections,
    projectId: p.projectId,
    currentConfigId: p.currentConfigId,
    savedConfigs: p.savedConfigs,
    toast: p.toast,
    setPanelName: p.setPanelName,
    setSelectedManufacturer: p.setSelectedManufacturer,
    setCustomCoefficient: p.setCustomCoefficient,
    setCustomModules: p.setCustomModules,
    setCustomCats: p.setCustomCats,
    setSections: p.setSections,
    setActiveSectionIdx: p.setActiveSectionIdx,
    setCurrentConfigId: p.setCurrentConfigId,
    setSavedConfigs: p.setSavedConfigs,
    setShowLoadDialog: p.setShowLoadDialog,
    setActiveTab: p.setActiveTab,
    setIsSaving: p.setIsSaving,
  });

  const syncHook = usePanelProjectSync({
    panelName: p.panelName,
    projectId: p.projectId,
    sections: p.sections,
    selectedManufacturer: p.selectedManufacturer,
    manufacturerCoeff: p.manufacturerCoeff,
    isFinal: p.isFinal,
    isPro: p.isPro,
    setRailModules: p.setRailModules,
    setIsAdding: p.setIsAdding,
    setActiveTab: p.setActiveTab,
    router: p.router,
    toast: p.toast,
  });

  return {
    // export
    handleDownloadDxf: exportHook.handleDownloadDxf,
    handleDownloadPdf: exportHook.handleDownloadPdf,
    handleExportPdf: exportHook.handleExportPdf,
    handleCsvExport: exportHook.handleCsvExport,
    // persistence
    handleSaveConfig: persistenceHook.handleSaveConfig,
    handleLoadConfigsList: persistenceHook.handleLoadConfigsList,
    handleLoadConfig: persistenceHook.handleLoadConfig,
    handleDeleteConfig: persistenceHook.handleDeleteConfig,
    handleRenameConfig: persistenceHook.handleRenameConfig,
    handleDuplicateConfig: persistenceHook.handleDuplicateConfig,
    refreshSavedConfigs: persistenceHook.refreshSavedConfigs,
    // project sync + import
    handleAddToProject: syncHook.handleAddToProject,
    handleCsvImport: syncHook.handleCsvImport,
    handleExcelImport: syncHook.handleExcelImport,
  };
}
