"use client";

import React, { useState, useCallback, useEffect } from "react";
import { generatePanelSvg } from "@/lib/panel-svg-generator";
import { getProfileForPdfHeader, saveGeneratedDocumentToProject } from "@/app/dashboard/projects/[id]/document-actions";
import type {
  DinModule,
  RailModule,
  PanelSection,
  SelectedSlot,
  GhostModuleData,
  Manufacturer,
} from "@/components/project/panel-configurator-types";
import type { VisualModuleSlim } from "@/components/project/panel-configurator-helpers";
import type { SectionTree } from "@/app/dashboard/panel-configurator/ai-schemat-action";
import type { useToast } from "@/hooks/use-toast";

type ToastFn = ReturnType<typeof useToast>["toast"];

interface UsePanelSlotActionsProps {
  railRows: VisualModuleSlim[][];
  railModules: RailModule[];
  modulesPerRow: number;
  sections: PanelSection[];
  panelName: string;
  selectedManufacturer: Manufacturer;
  isPro: boolean;
  projectId: string | undefined;
  addModule: (mod: DinModule, rating?: number, insertAtIndex?: number) => void;
  setAiSchematTrees: (v: SectionTree[]) => void;
  toast: ToastFn;
}

export function usePanelSlotActions({
  railRows,
  railModules,
  modulesPerRow,
  sections,
  panelName,
  selectedManufacturer,
  isPro,
  projectId,
  addModule,
  setAiSchematTrees,
  toast,
}: UsePanelSlotActionsProps) {
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [ghostModuleData, setGhostModuleData] = useState<GhostModuleData | null>(null);

  const handleSlotClick = useCallback((rowIdx: number, slotIdx: number) => {
    setSelectedSlot(prev =>
      prev?.rowIdx === rowIdx && prev?.slotIdx === slotIdx ? null : { rowIdx, slotIdx }
    );
  }, []);

  const pendingAdvance = React.useRef<{ rowIdx: number; afterSlotIdx: number; moduleWidth: number } | null>(null);

  const handleSlotAwareAddModule = useCallback((mod: DinModule, rating?: number) => {
    if (selectedSlot !== null) {
      const targetRow = railRows[selectedSlot.rowIdx] ?? [];
      let visualPos = 0;
      let realModulesBeforeSlot = 0;

      for (const vm of targetRow) {
        const nextPos = visualPos + vm.visualWidth;
        if (nextPos > selectedSlot.slotIdx) break;
        visualPos = nextPos;
        if (!vm.isFragment || vm.fragmentIndex === 0) realModulesBeforeSlot++;
      }

      const rowStartIndex = railRows
        .slice(0, selectedSlot.rowIdx)
        .reduce((sum, row) => sum + row.filter(vm => !vm.isFragment || vm.fragmentIndex === 0).length, 0);

      const insertAtIndex = rowStartIndex + realModulesBeforeSlot;
      const actualModuleWidth = mod.modules > 0 ? mod.modules : 1;

      addModule(mod, rating, insertAtIndex);

      pendingAdvance.current = {
        rowIdx: selectedSlot.rowIdx,
        afterSlotIdx: selectedSlot.slotIdx,
        moduleWidth: actualModuleWidth,
      };
      setSelectedSlot(null);
    } else {
      addModule(mod, rating);
    }
    setGhostModuleData(null);
    setAiSchematTrees([]);
  }, [selectedSlot, railRows, addModule, setAiSchematTrees]);

  // Auto-advance slot after insert
  useEffect(() => {
    const adv = pendingAdvance.current;
    if (!adv) return;
    pendingAdvance.current = null;

    const findFirstFreeSlot = (rowIdx: number, startSlot: number): SelectedSlot | null => {
      for (let ri = rowIdx; ri < railRows.length; ri++) {
        const row = railRows[ri];
        const occupied = new Set<number>();
        let pos = 0;
        for (const vm of row) {
          for (let s = pos; s < pos + vm.visualWidth; s++) occupied.add(s);
          pos += vm.visualWidth;
        }
        const searchFrom = ri === rowIdx ? startSlot : 0;
        for (let slot = searchFrom; slot < modulesPerRow; slot++) {
          if (!occupied.has(slot)) return { rowIdx: ri, slotIdx: slot };
        }
      }
      return null;
    };

    const nextFree = findFirstFreeSlot(adv.rowIdx, adv.afterSlotIdx + adv.moduleWidth);
    if (nextFree) setSelectedSlot(nextFree);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [railRows]);

  // SVG export
  const handleExportSvg = useCallback(async (options?: { skipDownload?: boolean }): Promise<string | undefined> => {
    if (!panelName.trim()) {
      toast({
        title: "Podaj nazwę rozdzielnicy",
        description: "Nazwa jest wymagana do wygenerowania SVG",
        variant: "destructive",
      });
      return undefined;
    }

    const profile = await getProfileForPdfHeader();
    const svgContent = generatePanelSvg({ sections, panelName, selectedManufacturer, isPro, profile });
    const safeName = panelName.trim().replace(/[^a-zA-Z0-9 ._-]/g, "_") || "rozdzielnica";

    if (!options?.skipDownload) {
      const blob = new Blob([svgContent], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Rozdzielnica_${safeName}-schemat.svg`;
      a.click();
      URL.revokeObjectURL(url);
      try {
        const svgFileName = `Rozdzielnica_${safeName}.svg`;
        if (projectId) {
          await saveGeneratedDocumentToProject(
            projectId,
            btoa(unescape(encodeURIComponent(svgContent))),
            svgFileName,
            "image/svg+xml"
          );
        }
        toast({ title: "SVG wyeksportowany i zapisany", description: "Schemat dodany do dokumentów projektu" });
      } catch {
        toast({ title: "SVG pobrany", description: "Nie udało się dołączyć do dokumentów projektu" });
      }
    }
    return svgContent;
  }, [sections, panelName, selectedManufacturer, isPro, toast, projectId]);

  return {
    selectedSlot,
    setSelectedSlot,
    ghostModuleData,
    setGhostModuleData,
    handleSlotClick,
    handleSlotAwareAddModule,
    handleExportSvg,
  };
}
