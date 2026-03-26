"use client";

import React from "react";
import { useBOMData } from "@/components/project/rozdzielnica/_parts/useBOMData";
import { BOMPreview } from "@/components/project/rozdzielnica/_parts/BOMPreview";
import type { RailModule } from "../panel-configurator-types";

export interface BOMExporterProps {
  railModules: RailModule[];
  accessoryItems: RailModule[];
  isPro: boolean;
  manufacturerCoeff: number;
  totalMaterialCost: number;
  totalLaborCost: number;
  selectedEnclosure: { modules: number; rows: number; name: string; price: number; laborPrice: number };
  manualPrices: Record<string, { mat: number; lab: number }>;
  setManualPrices: React.Dispatch<React.SetStateAction<Record<string, { mat: number; lab: number }>>>;
  activeSectionIdx: number;
  updateModule: (uid: string, changes: Partial<RailModule>) => void;
  editingAccessoryUid: string | null;
  setEditingAccessoryUid: React.Dispatch<React.SetStateAction<string | null>>;
  removeModule: (uid: string) => void;
  pricingMode: "none" | "manual" | "ai";
}

export function BOMExporter({
  railModules, accessoryItems, isPro, manufacturerCoeff,
  totalMaterialCost, totalLaborCost, selectedEnclosure,
  manualPrices, setManualPrices, activeSectionIdx, updateModule,
  editingAccessoryUid, setEditingAccessoryUid, removeModule,
  pricingMode,
}: BOMExporterProps) {
  const showPrices = pricingMode !== "none";

  const bomData = useBOMData({
    railModules,
    accessoryItems,
    manufacturerCoeff,
    editingAccessoryUid,
  });

  if (railModules.length === 0 && accessoryItems.length === 0) return null;

  return (
    <div className="mt-4 rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10 p-4 space-y-4">
      <BOMPreview
        {...bomData}
        totalMaterialCost={totalMaterialCost}
        totalLaborCost={totalLaborCost}
        selectedEnclosure={selectedEnclosure}
        isPro={isPro}
        showPrices={showPrices}
        manufacturerCoeff={manufacturerCoeff}
        editingAccessoryUid={editingAccessoryUid}
        updateModule={updateModule}
        removeModule={removeModule}
        setEditingAccessoryUid={setEditingAccessoryUid}
      />
    </div>
  );
}
