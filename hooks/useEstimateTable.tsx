"use client";

import { useEstimateData } from "@/hooks/estimate/useEstimateData";
import { useEstimateInteraction } from "@/hooks/estimate/useEstimateInteraction";
import { useEstimateActions } from "@/hooks/estimate/useEstimateActions";
import type { ProjectItem } from "@/lib/types/database";
import { updateProjectItem } from "@/app/dashboard/projects/[id]/actions";
import React from "react";

export type { AddChildState } from "@/hooks/estimate/useEstimateActions";

interface UseEstimateTableParams {
  projectId: string;
  items: ProjectItem[];
  adjustmentPercentage: number;
  showLaborHoursInPdf: boolean;
  showKnrInPdf: boolean;
  materialsOwnedByCustomer: boolean;
  isFinal: boolean;
  isReadOnly: boolean;
  regionModifier: number;
  compactViewControlled?: boolean;
  onCompactViewChange?: (v: boolean) => void;
  onSelectedIdsChange?: (ids: Set<string>) => void;
  onColorModeChange?: (v: boolean) => void;
  colorMode: boolean;
}

export function useEstimateTable({
  projectId,
  items,
  adjustmentPercentage,
  showLaborHoursInPdf,
  showKnrInPdf,
  materialsOwnedByCustomer,
  isFinal,
  isReadOnly,
  compactViewControlled,
  onCompactViewChange,
  onSelectedIdsChange,
  colorMode: _colorMode,
}: UseEstimateTableParams) {

  // ─── Interaction (filters, search, DnD, selection) ────────────────────────
  // Single call — we pass real localItems/filteredItems/searchMatchIds via refs
  // that get updated by useEstimateData after the fact.
  const localItemsRef = React.useRef<ProjectItem[]>(items);
  const filteredItemsRef = React.useRef<ProjectItem[]>(items);
  const searchMatchIdsRef = React.useRef<string[]>([]);
  const setLocalItemsRef = React.useRef<React.Dispatch<React.SetStateAction<ProjectItem[]>>>(
    () => { /* placeholder, overwritten after useEstimateData */ }
  );

  const realInteraction = useEstimateInteraction({
    projectId,
    items,
    localItems: localItemsRef.current,
    setLocalItems: setLocalItemsRef.current,
    filteredItems: filteredItemsRef.current,
    searchMatchIds: searchMatchIdsRef.current,
    isReadOnly,
    onSelectedIdsChange,
    compactViewControlled,
    onCompactViewChange,
    colorMode: _colorMode,
  });

  // ─── Data (local items, grouping, derived values, fill-norms) ────────────
  const data = useEstimateData({
    projectId,
    items,
    adjustmentPercentage,
    showLaborHoursInPdf,
    showKnrInPdf,
    materialsOwnedByCustomer,
    categoryFilter: realInteraction.categoryFilter,
    sectionFilter: realInteraction.sectionFilter,
    searchQuery: realInteraction.searchQuery,
    sortBy: realInteraction.sortBy,
    sortOrder: realInteraction.sortOrder,
    groupBySection: realInteraction.groupBySection,
    filterType: realInteraction.filterType,
  });

  // ─── Sync refs so interaction handlers use current data ──────────────────
  localItemsRef.current = data.localItems;
  filteredItemsRef.current = data.filteredItems;
  searchMatchIdsRef.current = data.searchMatchIds;
  setLocalItemsRef.current = data.setLocalItems as React.Dispatch<React.SetStateAction<ProjectItem[]>>;

  // ─── Actions (edit, delete, duplicate, child management) ─────────────────
  const actions = useEstimateActions({
    projectId,
    localItems: data.localItems,
    setLocalItems: data.setLocalItems,
    isFinal,
  });

  const handleMobileSaveEdit = (
    id: string,
    updates: Parameters<typeof updateProjectItem>[2]
  ) => {
    data.setLocalItems((prev: ProjectItem[]) =>
      prev.map((item) => (item.id === id ? ({ ...item, ...updates } as ProjectItem) : item))
    );
    updateProjectItem(projectId, id, updates);
  };

  return {
    // ── from data ──────────────────────────────────────────────────────────
    localItems: data.localItems,
    setLocalItems: data.setLocalItems as React.Dispatch<React.SetStateAction<ProjectItem[]>>,
    showRgColumn: data.showRgColumn,
    showRgCol: data.showRgCol,
    startRgTransition: data.startRgTransition,
    setShowRgColumn: data.setShowRgColumn,
    showKnrCol: data.showKnrCol,
    setShowKnrColumn: data.setShowKnrColumn,
    isFillNormsPending: data.isFillNormsPending,
    isFillKnrCodesPending: data.isFillKnrCodesPending,
    filteredItems: data.filteredItems,
    topLevelItems: data.topLevelItems,
    childrenMap: data.childrenMap,
    uniqueCategories: data.uniqueCategories,
    uniqueSections: data.uniqueSections,
    searchMatchIds: data.searchMatchIds,
    assemblyParentIds: data.assemblyParentIds,
    topLevelIds: data.topLevelIds,
    adjustmentMultiplier: data.adjustmentMultiplier,
    showMaterialsColumn: data.showMaterialsColumn,
    showLaborColumn: data.showLaborColumn,
    hasAnyLaborNorm: data.hasAnyLaborNorm,
    hasAnyKnrCode: data.hasAnyKnrCode,
    totalLaborHours: data.totalLaborHours,
    handleFillNorms: data.handleFillNorms,
    handleFillKnrCodes: data.handleFillKnrCodes,
    // ── from interaction ───────────────────────────────────────────────────
    searchQuery: realInteraction.searchQuery,
    setSearchQuery: realInteraction.setSearchQuery,
    isSearchOpen: realInteraction.isSearchOpen,
    setIsSearchOpen: realInteraction.setIsSearchOpen,
    sortBy: realInteraction.sortBy,
    setSortBy: realInteraction.setSortBy,
    sortOrder: realInteraction.sortOrder,
    setSortOrder: realInteraction.setSortOrder,
    filterType: realInteraction.filterType,
    setFilterType: realInteraction.setFilterType,
    selectedIds: realInteraction.selectedIds,
    setSelectedIds: realInteraction.setSelectedIds,
    compactView: realInteraction.compactView,
    setCompactView: realInteraction.setCompactView,
    activeDragId: realInteraction.activeDragId,
    categoryFilter: realInteraction.categoryFilter,
    setCategoryFilter: realInteraction.setCategoryFilter,
    sectionFilter: realInteraction.sectionFilter,
    setSectionFilter: realInteraction.setSectionFilter,
    groupBySection: realInteraction.groupBySection,
    setGroupBySection: realInteraction.setGroupBySection,
    collapsedSections: realInteraction.collapsedSections,
    setCollapsedSections: realInteraction.setCollapsedSections,
    currentMatchIndex: realInteraction.currentMatchIndex,
    matchRefs: realInteraction.matchRefs,
    isDndEnabled: realInteraction.isDndEnabled,
    goToMatch: realInteraction.goToMatch,
    highlightText: realInteraction.highlightText,
    toggleSelect: realInteraction.toggleSelect,
    toggleSelectAll: realInteraction.toggleSelectAll,
    toggleSectionCollapse: realInteraction.toggleSectionCollapse,
    handleDragStart: realInteraction.handleDragStart,
    handleDragCancel: realInteraction.handleDragCancel,
    handleDragEnd: realInteraction.handleDragEnd,
    handleMobileMoveUp: realInteraction.handleMobileMoveUp,
    handleMobileMoveDown: realInteraction.handleMobileMoveDown,
    // ── from actions ───────────────────────────────────────────────────────
    editingState: actions.editingState,
    setEditingState: actions.setEditingState,
    addingChildTo: actions.addingChildTo,
    setAddingChildTo: actions.setAddingChildTo,
    deleteDialogItem: actions.deleteDialogItem,
    setDeleteDialogItem: actions.setDeleteDialogItem,
    startEdit: actions.startEdit,
    cancelEdit: actions.cancelEdit,
    saveEdits: actions.saveEdits,
    startAddChild: actions.startAddChild,
    cancelAddChild: actions.cancelAddChild,
    saveAddChild: actions.saveAddChild,
    handleDelete: actions.handleDelete,
    handleDuplicate: actions.handleDuplicate,
    handleMobileSaveEdit,
  };
}
