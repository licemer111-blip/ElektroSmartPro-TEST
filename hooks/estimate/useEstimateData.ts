"use client";

import { useState, useEffect, useTransition, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { notifyDataChanged } from "@/hooks/use-synced-action";
import { useEstimateGroups } from "@/hooks/useEstimateGroups";
import { sumLaborHours } from "@/lib/labor-time";
import { fillMissingRbhNorms } from "@/app/dashboard/projects/[id]/ai-actions";
import { fillMissingKnrCodes } from "@/app/dashboard/projects/[id]/_ai_actions/analysis";
import type { ProjectItem } from "@/lib/types/database";
import React from "react";

export interface UseEstimateDataParams {
  projectId: string;
  items: ProjectItem[];
  adjustmentPercentage: number;
  showLaborHoursInPdf: boolean;
  showKnrInPdf: boolean;
  materialsOwnedByCustomer: boolean;
  categoryFilter: string;
  sectionFilter: string;
  searchQuery: string;
  sortBy: "name" | "price" | "date";
  sortOrder: "asc" | "desc";
  groupBySection: boolean;
  filterType: "all" | "materials" | "labor";
}

export function useEstimateData({
  projectId,
  items,
  adjustmentPercentage,
  showLaborHoursInPdf,
  showKnrInPdf,
  materialsOwnedByCustomer,
  categoryFilter,
  sectionFilter,
  searchQuery,
  sortBy,
  sortOrder,
  groupBySection,
  filterType,
}: UseEstimateDataParams) {
  const { toast } = useToast();
  const router = useRouter();
  const [localItems, setLocalItems] = useState<ProjectItem[]>(items);
  const [showRgColumn, setShowRgColumn] = useState(showLaborHoursInPdf);
  const [showKnrColumn, setShowKnrColumn] = useState(showKnrInPdf);
  const [, startRgTransition] = useTransition();
  const [isFillNormsPending, startFillNormsTransition] = useTransition();
  const [isFillKnrCodesPending, startFillKnrCodesTransition] = useTransition();

  // ─── Sync external items prop ─────────────────────────────────────────────
  useEffect(() => { setLocalItems(items); }, [items]);

  // ─── AI prices applied event ──────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: Event) => {
      const { projectId: evtId, prices } = (
        e as CustomEvent<{
          projectId: string;
          prices: { itemId: string; material_price: number; labor_price: number }[];
        }>
      ).detail;
      if (evtId !== projectId) return;
      setLocalItems((prev) =>
        prev.map((item) => {
          const u = prices.find((p) => p.itemId === item.id);
          if (!u) return item;
          return {
            ...item,
            material_price: u.material_price,
            labor_price: u.labor_price,
            final_material_price: u.material_price,
            final_labor_price: u.labor_price,
          };
        })
      );
    };
    window.addEventListener("ai-prices-applied", handler);
    return () => window.removeEventListener("ai-prices-applied", handler);
  }, [projectId]);

  // ─── Sync showRgColumn from prop ──────────────────────────────────────
  useEffect(() => { setShowRgColumn(showLaborHoursInPdf); }, [showLaborHoursInPdf]);
  useEffect(() => { setShowKnrColumn(showKnrInPdf); }, [showKnrInPdf]);

  // ─── Grouping / filtering ─────────────────────────────────────────────────
  const {
    filteredItems, topLevelItems, childrenMap,
    uniqueCategories, uniqueSections, searchMatchIds, assemblyParentIds,
  } = useEstimateGroups({
    localItems, categoryFilter, sectionFilter,
    searchQuery, sortBy, sortOrder, groupBySection,
  });

  // ─── Derived ──────────────────────────────────────────────────────────────
  const adjustmentMultiplier = useMemo(
    () => 1 + adjustmentPercentage / 100,
    [adjustmentPercentage]
  );
  const showMaterialsColumn = !materialsOwnedByCustomer && (filterType === "all" || filterType === "materials");
  const showLaborColumn = (filterType === "all" || filterType === "labor");
  const hasAnyLaborNorm = useMemo(
    () => localItems.some((i) => i.labor_norm != null && i.labor_norm > 0),
    [localItems]
  );
  const showRgCol = showLaborHoursInPdf && (showRgColumn || hasAnyLaborNorm);
  const hasAnyKnrCode = useMemo(
    () => localItems.some((i) => i.knr_code != null && i.knr_code !== ""),
    [localItems]
  );
  const showKnrCol = showKnrInPdf && (showKnrColumn || hasAnyKnrCode);
  const totalLaborHours = useMemo(() => sumLaborHours(localItems), [localItems]);
  const topLevelIds = useMemo(() => topLevelItems.map((i) => i.id), [topLevelItems]);

  // ─── Fill norms ───────────────────────────────────────────────────────────
  const handleFillNorms = useCallback(() => {
    startFillNormsTransition(async () => {
      const result = await fillMissingRbhNorms(projectId);
      if (result.success) {
        toast({ title: "✅ Uzupełniono normy rbh", description: `Dodano normy dla ${result.updatedCount} pozycji` });
        router.refresh();
      } else {
        toast({ title: "Błąd", description: result.error, variant: "destructive" });
      }
    });
  }, [projectId, toast, router]);

  // ─── Fill KNR codes ──────────────────────────────────────────────────────
  const handleFillKnrCodes = useCallback(() => {
    startFillKnrCodesTransition(async () => {
      const result = await fillMissingKnrCodes(projectId);
      if (result.success) {
        toast({ title: "✅ Uzupełniono kody KNR", description: `Dodano kody dla ${result.updatedCount} pozycji` });
        router.refresh();
      } else {
        toast({ title: "Błąd", description: result.error, variant: "destructive" });
      }
    });
  }, [projectId, toast, router]);

  // ─── Notify data synced ───────────────────────────────────────────────────
  const notifyChanged = useCallback((event: string) => {
    notifyDataChanged(event);
    router.refresh();
  }, [router]);

  return {
    localItems,
    setLocalItems,
    showRgColumn,
    setShowRgColumn,
    showKnrColumn,
    setShowKnrColumn,
    startRgTransition,
    isFillNormsPending,
    isFillKnrCodesPending,
    // grouped data
    filteredItems,
    topLevelItems,
    childrenMap,
    uniqueCategories,
    uniqueSections,
    searchMatchIds,
    assemblyParentIds,
    topLevelIds,
    // derived
    adjustmentMultiplier,
    showMaterialsColumn,
    showLaborColumn,
    hasAnyLaborNorm,
    showRgCol,
    hasAnyKnrCode,
    showKnrCol,
    totalLaborHours,
    // actions
    handleFillNorms,
    handleFillKnrCodes,
    notifyChanged,
  };
}
