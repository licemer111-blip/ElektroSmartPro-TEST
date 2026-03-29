"use client";

import React from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { PanelTabsList } from "@/components/project/panel-tabs-list";
import { PanelTemplatesTab } from "@/components/project/panel-templates-tab";
import { PanelSchematTab } from "@/components/project/panel-schemat-tab";
import { PanelSummaryTab } from "@/components/project/panel-summary-tab";
import { PanelCalculatorsTab } from "@/components/project/panel-calculators-tab";
import { PanelInfoFooter } from "@/components/project/panel-info-footer";
import { PanelSectionTabs } from "@/components/project/panel-section-tabs";
import { PanelSectionMeta } from "@/components/project/panel-section-meta";
import { PanelEnclosureHeader } from "@/components/project/panel-enclosure-header";
import { PanelEmptyState } from "@/components/project/panel-empty-state";
import { PanelBuildLegend } from "@/components/project/panel-build-legend";
import { PanelBuildTips } from "@/components/project/panel-build-tips";
import { PanelRcdGroups } from "@/components/project/panel-rcd-groups";
import { PanelDiagnostics } from "@/components/project/panel-diagnostics";
import { PanelZugPanel } from "@/components/project/panel-zug-panel";
import { ModuleLibrary } from "@/components/project/rozdzielnica/ModuleLibrary";
import { PhaseBalancer } from "@/components/project/rozdzielnica/PhaseBalancer";
import { BOMExporter } from "@/components/project/rozdzielnica/BOMExporter";
import { GridBoard } from "@/components/project/rozdzielnica/GridBoard";
import { getShortName } from "@/components/project/panel-configurator-helpers";
import { useGlobalSettings, formatDisplayPrice } from "@/hooks/use-global-settings";
import type { PanelState } from "@/components/project/rozdzielnica/usePanelReducer";
import type {
  DinModule, RailModule, PanelSection, PanelTemplate, SelectedSlot, GhostModuleData,
} from "@/components/project/panel-configurator-types";
import type { PricingResult } from "@/app/dashboard/panel-configurator/ai-pricing-action";

// All non-state callbacks that configurator builds from hooks
export interface ConfiguratorTabsCallbacks {
  setActiveTab: (v: string) => void;
  setActiveSectionIdx: (i: number) => void;
  setSelectedUid: (uid: string | null) => void;
  setDragUid: (uid: string | null) => void;
  setModuleSearch: (v: string) => void;
  toggleCat: (cat: string) => void;
  setCatalogMode: (v: "default" | "custom") => void;
  setCustomModules: React.Dispatch<React.SetStateAction<DinModule[]>>;
  setCustomCats: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setCollapsedCustomCats: React.Dispatch<React.SetStateAction<Set<string>>>;
  setShowCustomForm: React.Dispatch<React.SetStateAction<boolean>>;
  setShowNewCatForm: React.Dispatch<React.SetStateAction<boolean>>;
  setNewCatName: React.Dispatch<React.SetStateAction<string>>;
  setCustomForm: React.Dispatch<React.SetStateAction<PanelState["customForm"]>>;
  setShowAiPanel: React.Dispatch<React.SetStateAction<boolean>>;
  setAiDescription: React.Dispatch<React.SetStateAction<string>>;
  setAiSchematTrees: React.Dispatch<React.SetStateAction<PanelState["aiSchematTrees"]>>;
  setAiSchematLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setAiValidationNotes: React.Dispatch<React.SetStateAction<string[]>>;
  setAiUsageInfo: React.Dispatch<React.SetStateAction<PanelState["aiUsageInfo"]>>;
  setCircuitEditCell: React.Dispatch<React.SetStateAction<PanelState["circuitEditCell"]>>;
  setManualPrices: React.Dispatch<React.SetStateAction<PanelState["manualPrices"]>>;
  setPricingMode: React.Dispatch<React.SetStateAction<PanelState["pricingMode"]>>;
  setPricingResult: React.Dispatch<React.SetStateAction<PricingResult | null>>;
  setShowClearConfirm: (v: boolean) => void;
  setEditingAccessoryUid: React.Dispatch<React.SetStateAction<string | null>>;
  // section/module operations
  addSection: (name?: string) => void;
  removeSection: (idx: number) => void;
  updateSectionMeta: (idx: number, updates: Partial<Pick<PanelSection, "name" | "feed" | "type">>) => void;
  handleSlotAwareAddModule: (mod: DinModule, rating?: number, insertAtIndex?: number) => void;
  removeModule: (uid: string) => void;
  duplicateModule: (uid: string) => void;
  updateModule: (uid: string, updates: Partial<RailModule>) => void;
  moveModuleToSection: (uid: string, targetIdx: number) => void;
  handleDragDrop: (fromUid: string, toUid: string) => void;
  handleSlotClick: (rowIdx: number, slotIdx: number) => void;
  setGhostModuleData: (d: GhostModuleData | null) => void;
  setSelectedSlot: (s: SelectedSlot | null) => void;
  setRailModules: (updater: React.SetStateAction<RailModule[]>) => void;
  handleSaveConfig: () => void;
  handleLoadConfigsList: () => void;
  // templates tab
  applyTemplate: (t: PanelTemplate) => void;
  handleLoadConfig: (id: string) => Promise<void>;
  handleRenameConfig: (id: string, name: string) => Promise<void>;
  handleDuplicateConfig: (id: string) => Promise<void>;
  handleDeleteConfig: (id: string) => Promise<void>;
  refreshSavedConfigs: () => Promise<void>;
  // summary tab
  handleAIPricing: () => void;
  handleDownloadPdf: () => void;
  handleExportPdf: () => void;
  handleAddToProject: () => void;
  handleExportSvg: (opts?: { skipDownload?: boolean }) => Promise<string | undefined>;
  handleDownloadDxf: () => void;
  toast: ReturnType<typeof import("@/hooks/use-toast").useToast>["toast"];
}

export interface ConfiguratorTabsDerived {
  activeSection: PanelSection;
  railModules: RailModule[];
  accessoryItems: RailModule[];
  selectedEnclosure: { modules: number; rows: number; name: string; price: number; laborPrice: number };
  modulesPerRow: number;
  allModules: RailModule[];
  allAccessories: RailModule[];
  totalModules: number;
  totalMaterialCost: number;
  totalLaborCost: number;
  grandTotalMaterial: number;
  grandTotalLabor: number;
  selectedModule: RailModule | null;
  sectionPowerBalance: Parameters<typeof PhaseBalancer>[0]["sectionPowerBalance"];
  activeIssues: PanelState extends { sections: unknown } ? import("@/components/project/panel-configurator-types").ValidationIssue[] : never;
  allCriticalErrors: import("@/components/project/panel-configurator-types").ValidationIssue[];
  moduleIssueMap: Parameters<typeof GridBoard>[0]["moduleIssueMap"];
  railRows: Parameters<typeof GridBoard>[0]["railRows"];
  selectedRowIdx: number;
  occupancyPercent: number;
  overflow: boolean;
  suggestedEnclosure: { modules: number; rows: number; name: string; price: number; laborPrice: number } | null;
  manufacturerCoeff: number;
  selectedSlot: SelectedSlot | null;
  ghostModuleData: GhostModuleData | null;
  isFinal: boolean;
  isPro: boolean;
  projectId: string;
  regionModifier: number;
  schematSvgRef: React.MutableRefObject<string>;
  schematReadyRef: React.MutableRefObject<boolean>;
}

export interface ConfiguratorTabsProps {
  ps: PanelState;
  cb: ConfiguratorTabsCallbacks;
  derived: ConfiguratorTabsDerived;
}

export function ConfiguratorTabs({ ps, cb, derived }: ConfiguratorTabsProps) {
  const { vatMode, priceDisplay } = useGlobalSettings();
  const panelDp = (netto: number) => formatDisplayPrice(netto, vatMode, priceDisplay);

  return (
    <Tabs value={ps.activeTab} onValueChange={cb.setActiveTab} className="w-full">
      <PanelTabsList />

      <PanelTemplatesTab
        savedConfigs={ps.savedConfigs}
        applyTemplate={cb.applyTemplate}
        handleLoadConfig={cb.handleLoadConfig}
        handleRenameConfig={cb.handleRenameConfig}
        handleDuplicateConfig={cb.handleDuplicateConfig}
        handleDeleteConfig={cb.handleDeleteConfig}
        refreshSavedConfigs={cb.refreshSavedConfigs}
      />

      <TabsContent value="build" className="mt-3 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:h-[calc(100vh-200px)] lg:overflow-hidden">
          <ModuleLibrary
            moduleSearch={ps.moduleSearch} setModuleSearch={cb.setModuleSearch}
            collapsedCats={ps.collapsedCats} toggleCat={cb.toggleCat}
            catalogMode={ps.catalogMode} setCatalogMode={cb.setCatalogMode}
            railModules={derived.railModules}
            customModules={ps.customModules} setCustomModules={cb.setCustomModules}
            customCats={ps.customCats} setCustomCats={cb.setCustomCats}
            collapsedCustomCats={ps.collapsedCustomCats} setCollapsedCustomCats={cb.setCollapsedCustomCats}
            showCustomForm={ps.showCustomForm} setShowCustomForm={cb.setShowCustomForm}
            showNewCatForm={ps.showNewCatForm} setShowNewCatForm={cb.setShowNewCatForm}
            newCatName={ps.newCatName} setNewCatName={cb.setNewCatName}
            customForm={ps.customForm} setCustomForm={cb.setCustomForm}
            isFinal={derived.isFinal} addModule={cb.handleSlotAwareAddModule}
            setShowAiPanel={cb.setShowAiPanel} setAiDescription={cb.setAiDescription}
            handleAIPricing={cb.handleAIPricing} isWycenLoading={ps.isWycenLoading}
            allModulesCount={derived.allModules.length} selectedSlot={derived.selectedSlot}
            onHoverModule={(mod) => cb.setGhostModuleData(mod ? { name: mod.namePl, width: mod.modules ?? 1 } : null)}
          />
          <div className="lg:col-span-9 flex flex-col gap-3 lg:overflow-y-auto lg:min-h-0 custom-scrollbar">
            <PanelSectionTabs
              sections={ps.sections} activeSectionIdx={ps.activeSectionIdx}
              setActiveSectionIdx={cb.setActiveSectionIdx} setSelectedUid={cb.setSelectedUid}
              removeSection={cb.removeSection} addSection={cb.addSection}
            />
            <PanelSectionMeta
              activeSection={derived.activeSection} activeSectionIdx={ps.activeSectionIdx}
              updateSectionMeta={cb.updateSectionMeta} overflow={derived.overflow}
              occupancyPercent={derived.occupancyPercent} totalModules={derived.totalModules}
              selectedEnclosureModules={derived.selectedEnclosure.modules}
              railModules={derived.railModules} allModulesLength={derived.allModules.length}
              isSaving={ps.isSaving} panelName={ps.panelName}
              setShowClearConfirm={cb.setShowClearConfirm}
              handleSaveConfig={cb.handleSaveConfig}
              handleLoadConfigsList={cb.handleLoadConfigsList}
              setRailModules={cb.setRailModules}
              setAiSchematTrees={cb.setAiSchematTrees}
            />
            <PanelRcdGroups railModules={derived.railModules} />
            <div className="bg-gradient-to-b from-slate-50 via-slate-100 to-slate-150 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 rounded-2xl border-2 border-slate-300 dark:border-slate-600 p-4 space-y-3 shadow-[inset_0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_2px_8px_rgba(0,0,0,0.3)]">
              <PanelEnclosureHeader
                selectedEnclosure={derived.selectedEnclosure}
                selectedManufacturer={ps.selectedManufacturer}
                manufacturerCoeff={derived.manufacturerCoeff}
                modulesPerRow={derived.modulesPerRow}
              />
              <PhaseBalancer
                sectionPowerBalance={derived.sectionPowerBalance}
                activeSectionIdx={ps.activeSectionIdx}
                sections={ps.sections}
              />
              <PanelDiagnostics
                activeIssues={derived.activeIssues}
                setActiveTab={cb.setActiveTab}
                setSelectedUid={cb.setSelectedUid}
              />
              <PanelZugPanel railModules={derived.railModules} />
              <GridBoard
                railRows={derived.railRows}
                railModules={derived.railModules}
                modulesPerRow={derived.modulesPerRow}
                dragUid={ps.dragUid} setDragUid={cb.setDragUid}
                handleDragDrop={cb.handleDragDrop}
                selectedUid={ps.selectedUid} setSelectedUid={cb.setSelectedUid}
                selectedModule={derived.selectedModule} selectedRowIdx={derived.selectedRowIdx}
                isPro={derived.isPro} manufacturerCoeff={derived.manufacturerCoeff}
                moduleIssueMap={derived.moduleIssueMap}
                removeModule={cb.removeModule} duplicateModule={cb.duplicateModule}
                updateModule={cb.updateModule}
                moveModuleToSection={cb.moveModuleToSection}
                sections={ps.sections} activeSectionIdx={ps.activeSectionIdx}
                selectedSlot={derived.selectedSlot} onSlotClick={cb.handleSlotClick}
                ghostModuleData={derived.ghostModuleData}
              />
            </div>
            {derived.railModules.length === 0 && <PanelEmptyState />}
            <BOMExporter
              railModules={derived.railModules} accessoryItems={derived.accessoryItems}
              isPro={derived.isPro} manufacturerCoeff={derived.manufacturerCoeff}
              totalMaterialCost={derived.totalMaterialCost} totalLaborCost={derived.totalLaborCost}
              selectedEnclosure={derived.selectedEnclosure}
              manualPrices={ps.manualPrices} setManualPrices={cb.setManualPrices}
              activeSectionIdx={ps.activeSectionIdx} updateModule={cb.updateModule}
              editingAccessoryUid={ps.editingAccessoryUid}
              setEditingAccessoryUid={cb.setEditingAccessoryUid}
              removeModule={cb.removeModule} pricingMode={ps.pricingMode}
            />
            <PanelBuildLegend railModules={derived.railModules} getShortName={getShortName} />
            {derived.railModules.length > 0 && derived.isPro && (
              <div className="flex items-center justify-between px-2 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  {derived.railModules.length} urządzeń • {derived.totalModules}/{derived.selectedEnclosure.modules} mod.
                </span>
                <div className="flex items-center gap-3">
                  <span>Mat: <strong>{panelDp(derived.totalMaterialCost).toFixed(0)} zł</strong></span>
                  <span>Rob: <strong>{panelDp(derived.totalLaborCost).toFixed(0)} zł</strong></span>
                  <span className="text-blue-600 font-bold">
                    {(panelDp(derived.totalMaterialCost) + panelDp(derived.totalLaborCost)).toFixed(0)} zł
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
        <PanelBuildTips />
      </TabsContent>

      <PanelSchematTab
        sections={ps.sections} allModules={derived.allModules} panelName={ps.panelName}
        selectedManufacturerName={ps.selectedManufacturer.name}
        allCriticalErrors={derived.allCriticalErrors}
        aiSchematTrees={ps.aiSchematTrees} setAiSchematTrees={cb.setAiSchematTrees}
        aiSchematLoading={ps.aiSchematLoading} setAiSchematLoading={cb.setAiSchematLoading}
        aiValidationNotes={ps.aiValidationNotes} setAiValidationNotes={cb.setAiValidationNotes}
        aiUsageInfo={ps.aiUsageInfo} setAiUsageInfo={cb.setAiUsageInfo}
        schematSvgRef={derived.schematSvgRef} schematReadyRef={derived.schematReadyRef}
        circuitEditCell={ps.circuitEditCell} setCircuitEditCell={cb.setCircuitEditCell}
        updateModule={cb.updateModule} applyTemplate={cb.applyTemplate}
        setActiveTab={cb.setActiveTab} setSelectedUid={cb.setSelectedUid}
        toast={cb.toast}
      />

      <PanelSummaryTab
        sections={ps.sections} allModules={derived.allModules} panelName={ps.panelName}
        selectedManufacturerName={ps.selectedManufacturer.name}
        manufacturerCoeff={derived.manufacturerCoeff}
        isPro={derived.isPro} projectId={derived.projectId} regionModifier={derived.regionModifier}
        grandTotalMaterial={derived.grandTotalMaterial} grandTotalLabor={derived.grandTotalLabor}
        manualPrices={ps.manualPrices} setManualPrices={cb.setManualPrices}
        pricingMode={ps.pricingMode} setPricingMode={cb.setPricingMode}
        pricingResult={ps.pricingResult} setPricingResult={cb.setPricingResult}
        isWycenLoading={ps.isWycenLoading} isExporting={ps.isExporting}
        isAddingToProject={ps.isAdding}
        handleAIPricing={cb.handleAIPricing}
        handleDownloadPdf={cb.handleDownloadPdf}
        handleExportPdf={cb.handleExportPdf}
        handleAddToProject={cb.handleAddToProject}
        handleExportSvg={cb.handleExportSvg}
        handleDownloadDxf={cb.handleDownloadDxf}
        schematSvgRef={derived.schematSvgRef} schematReadyRef={derived.schematReadyRef}
        setActiveTab={cb.setActiveTab} toast={cb.toast}
      />

      <PanelCalculatorsTab />
      <PanelInfoFooter />
    </Tabs>
  );
}
