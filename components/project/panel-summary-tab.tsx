"use client";
import React from "react";
import { LayoutGrid } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import type { PanelSection, RailModule } from "@/components/project/panel-configurator-types";
import type { PricingResult } from "@/app/dashboard/panel-configurator/ai-pricing-action";
import { SummaryFinancialCards } from "@/components/project/_parts/SummaryFinancialCards";
import { SummaryExportButtons } from "@/components/project/_parts/SummaryExportButtons";

export interface PanelSummaryTabProps {
  sections: PanelSection[];
  allModules: RailModule[];
  panelName: string;
  selectedManufacturerName: string;
  manufacturerCoeff: number;
  isPro: boolean;
  projectId?: string | null;
  regionModifier?: number;
  grandTotalMaterial: number;
  grandTotalLabor: number;
  manualPrices: Record<string, { mat: number; lab: number }>;
  setManualPrices: React.Dispatch<React.SetStateAction<Record<string, { mat: number; lab: number }>>>;
  pricingMode: "none" | "ai" | "manual";
  setPricingMode: React.Dispatch<React.SetStateAction<"none" | "ai" | "manual">>;
  pricingResult: PricingResult | null;
  setPricingResult: React.Dispatch<React.SetStateAction<PricingResult | null>>;
  isWycenLoading: boolean;
  isExporting: boolean;
  isAddingToProject: boolean;
  handleAIPricing: () => void;
  handleDownloadPdf: () => void;
  handleExportPdf: () => void;
  handleAddToProject: () => void;
  handleExportSvg: (opts?: { skipDownload?: boolean }) => Promise<string | undefined>;
  handleDownloadDxf: () => void;
  schematSvgRef: React.MutableRefObject<string>;
  schematReadyRef: React.MutableRefObject<boolean>;
  setActiveTab: (tab: string) => void;
  toast: (opts: { title: string; description?: string; variant?: "default" | "destructive" }) => void;
}

export function PanelSummaryTab(props: PanelSummaryTabProps) {
  const {
    sections, allModules, panelName, selectedManufacturerName, manufacturerCoeff,
    isPro, grandTotalMaterial, grandTotalLabor,
    manualPrices, setManualPrices, pricingMode, setPricingMode,
    pricingResult, setPricingResult, isWycenLoading, isExporting, isAddingToProject,
    handleAIPricing, handleDownloadPdf, handleExportPdf, handleAddToProject,
    handleExportSvg, handleDownloadDxf, schematSvgRef, schematReadyRef,
    setActiveTab, toast, projectId, regionModifier,
  } = props;
  return (
    <TabsContent value="summary" className="mt-3">
      {allModules.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <LayoutGrid className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Najpierw dodaj urządzenia w zakładce Konstruktor</p>
        </div>
      )}
      {allModules.length > 0 && (
        <div className="space-y-4 max-w-4xl mx-auto pb-6">
          <SummaryFinancialCards
            sections={sections}
            allModules={allModules}
            panelName={panelName}
            selectedManufacturerName={selectedManufacturerName}
            manufacturerCoeff={manufacturerCoeff}
            isPro={isPro}
            grandTotalMaterial={grandTotalMaterial}
            grandTotalLabor={grandTotalLabor}
            manualPrices={manualPrices}
            setManualPrices={setManualPrices}
            pricingMode={pricingMode}
            setPricingMode={setPricingMode}
            pricingResult={pricingResult}
            setPricingResult={setPricingResult}
            isWycenLoading={isWycenLoading}
            isExporting={isExporting}
            handleAIPricing={handleAIPricing}
            setActiveTab={setActiveTab}
            handleDownloadPdf={handleDownloadPdf}
          />
          {pricingMode !== "none" && (
            <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
              <CardContent className="pt-4 space-y-3">
                <SummaryExportButtons
                  panelName={panelName}
                  isPro={isPro}
                  projectId={projectId}
                  regionModifier={regionModifier}
                  manufacturerCoeff={manufacturerCoeff}
                  allModules={allModules}
                  grandTotalMaterial={grandTotalMaterial}
                  grandTotalLabor={grandTotalLabor}
                  isExporting={isExporting}
                  isAddingToProject={isAddingToProject}
                  schematSvgRef={schematSvgRef}
                  schematReadyRef={schematReadyRef}
                  handleAddToProject={handleAddToProject}
                  handleDownloadPdf={handleDownloadPdf}
                  handleExportPdf={handleExportPdf}
                  handleExportSvg={handleExportSvg}
                  handleDownloadDxf={handleDownloadDxf}
                  toast={toast}
                />
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </TabsContent>
  );
}
