"use client";

import React, { useId, useCallback, useRef, useState } from "react";
import {
  Table, TableBody, TableCell, TableRow,
} from "@/components/ui/table";
import { GripVertical, FileBox } from "lucide-react";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, TouchSensor,
  useSensor, useSensors, DragOverlay,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { EstimateRow } from "./estimate/EstimateRow";
import { EstimateGroupHeader } from "./estimate/EstimateGroupHeader";
import { EstimateBulkActions } from "./estimate/EstimateBulkActions";
import { EstimateMobileCards } from "./estimate-mobile-cards";
import { EstimateFilterBar } from "./estimate/EstimateFilterBar";
import { EstimateTableHeader } from "./estimate/EstimateTableHeader";
import { AddChildRow } from "./estimate/AddChildRow";
import { useToast } from "@/hooks/use-toast";
import { SortableRow, DragHandle } from "./_parts/EstimateDndWrappers";
import { useEstimateTable } from "@/hooks/useEstimateTable";
import type { ProjectItem } from "@/lib/types/database";
import { priceRowWithGlobalFallback } from "@/app/dashboard/projects/[id]/ai-actions";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EstimateTableProps {
  projectId: string;
  items: ProjectItem[];
  materialsOwnedByCustomer: boolean;
  isPro?: boolean;
  colorMode?: boolean;
  onColorModeChange?: (value: boolean) => void;
  adjustmentPercentage?: number;
  projectStatus?: string;
  toolbarExtra?: React.ReactNode;
  tabsSection?: React.ReactNode;
  headerSection?: React.ReactNode;
  tableHeaderExtra?: React.ReactNode;
  showLaborHoursInPdf?: boolean;
  showKnrInPdf?: boolean;
  filterBarExtra?: React.ReactNode;
  regionName?: string;
  isReadOnly?: boolean;
  onSelectedIdsChange?: (ids: Set<string>) => void;
  regionModifier?: number;
  compactViewControlled?: boolean;
  onCompactViewChange?: (value: boolean) => void;
  bruttoMode?: boolean;
  vatRate?: number;
  /** Pass true when Tryb Własny (use_custom_rates) is active to show 'Szukaj w KNR/AI' button */
  useCustomRates?: boolean;
  /** False when user has no rate set — disables 'Szukaj w KNR/AI' per Iron Rule */
  rateIsSet?: boolean;
}

// ─── Component shell ──────────────────────────────────────────────────────────

export function EstimateTable({
  projectId, items, materialsOwnedByCustomer, isPro = false,
  colorMode = true, adjustmentPercentage = 0, projectStatus = "draft",
  toolbarExtra, tabsSection, headerSection, tableHeaderExtra,
  showLaborHoursInPdf = false, showKnrInPdf = false, filterBarExtra, onColorModeChange, isReadOnly = false,
  onSelectedIdsChange, regionModifier = 1.0,
  compactViewControlled, onCompactViewChange, bruttoMode = false, vatRate = 23,
  useCustomRates = false, regionName, rateIsSet = true,
}: EstimateTableProps) {
  const isFinal = projectStatus === "final" || isReadOnly;
  const { toast } = useToast();
  const dndId = useId();

  const {
    localItems,
    setLocalItems,
    editingState, setEditingState,
    addingChildTo, setAddingChildTo,
    deleteDialogItem, setDeleteDialogItem,
    searchQuery, setSearchQuery,
    isSearchOpen, setIsSearchOpen,
    sortBy, setSortBy,
    sortOrder, setSortOrder,
    filterType, setFilterType,
    selectedIds, setSelectedIds,
    compactView, setCompactView,
    activeDragId,
    categoryFilter, setCategoryFilter,
    sectionFilter, setSectionFilter,
    groupBySection, setGroupBySection,
    collapsedSections, setCollapsedSections,
    currentMatchIndex,
    showRgCol,
    showKnrCol,
    isFillNormsPending,
    isFillKnrCodesPending,
    matchRefs,
    filteredItems, topLevelItems, childrenMap,
    uniqueCategories, uniqueSections, searchMatchIds, assemblyParentIds,
    topLevelIds,
    adjustmentMultiplier,
    showMaterialsColumn, showLaborColumn,
    hasAnyLaborNorm, hasAnyKnrCode, totalLaborHours,
    isDndEnabled,
    startEdit, cancelEdit, saveEdits,
    startAddChild, cancelAddChild, saveAddChild,
    handleDelete, handleDuplicate, handleFillNorms, handleFillKnrCodes,
    toggleSelect, toggleSelectAll,
    toggleSectionCollapse,
    handleDragStart, handleDragCancel, handleDragEnd,
    handleMobileMoveUp, handleMobileMoveDown, handleMobileSaveEdit,
    goToMatch, highlightText,
  } = useEstimateTable({
    projectId, items, adjustmentPercentage,
    showLaborHoursInPdf, showKnrInPdf, materialsOwnedByCustomer, isFinal, isReadOnly, regionModifier,
    compactViewControlled, onCompactViewChange, onSelectedIdsChange,
    onColorModeChange, colorMode,
  });

  const [fallbackLoadingIds, setFallbackLoadingIds] = useState<Set<string>>(new Set());

  const handleGlobalFallback = useCallback(async (itemId: string) => {
    setFallbackLoadingIds((prev) => new Set([...prev, itemId]));
    try {
      const result = await priceRowWithGlobalFallback(projectId, itemId, "all");
      if (result.success && result.estimate) {
        // Optimistic local update
        setLocalItems((prev) =>
          prev.map((i) =>
            i.id === itemId
              ? {
                  ...i,
                  material_price: result.estimate!.suggestedMaterial,
                  labor_price: result.estimate!.suggestedLabor,
                  final_material_price: result.estimate!.suggestedMaterial,
                  final_labor_price: result.estimate!.suggestedLabor,
                  knr_code: result.estimate!.knrCode,
                  knr_source: result.estimate!.knrSource === "official" ? "system_knr"
                    : result.estimate!.knrSource === "es-synthetic" ? "es_synthetic"
                    : result.estimate!.knrSource === "catalog-l1" ? "user_knr"
                    : result.estimate!.knrSource ?? null,
                  confidence_level: result.estimate!.confidence === "high" ? "verified"
                    : result.estimate!.confidence === "medium" ? "analog"
                    : "estimated",
                  confidence_note: result.estimate!.note,
                }
              : i
          )
        );
        toast({
          title: "Wyceniono z KNR/AI",
          description: result.estimate.note?.slice(0, 120) ?? "Cena zaktualizowana",
        });
      } else {
        toast({ title: "Błąd wyceny", description: result.error, variant: "destructive" });
      }
    } finally {
      setFallbackLoadingIds((prev) => { const s = new Set(prev); s.delete(itemId); return s; });
    }
  }, [projectId, toast, setLocalItems]);

  // ─── Stable refs for values used in callbacks ──────────────────────────────
  const colorModeRef = useRef(colorMode);
  const onColorModeChangeRef = useRef(onColorModeChange);
  const compactViewRef = useRef(true);
  colorModeRef.current = colorMode;
  onColorModeChangeRef.current = onColorModeChange;
  compactViewRef.current = compactView;

  // ─── Collapsed assemblies (Pokaż/Ukryj składniki zestawu) ────────────────
  const [collapsedAssemblies, setCollapsedAssemblies] = useState<Set<string>>(new Set());
  const toggleAssemblyCollapse = useCallback((id: string) => {
    setCollapsedAssemblies((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  // ─── Stable FilterBar callbacks ───────────────────────────────────────────
  const handleSearchOpen = useCallback(() => setIsSearchOpen(true), []);
  const handleSearchClose = useCallback(() => { setIsSearchOpen(false); setSearchQuery(""); }, []);
  const handleGroupBySection = useCallback((v: boolean) => {
    setGroupBySection(v);
    if (!v) setCollapsedSections(new Set());
  }, []);
  const handleColorMode = useCallback(() => {
    onColorModeChangeRef.current?.(!colorModeRef.current);
  }, []);
  const handleCompactView = useCallback(() => {
    setCompactView(!compactViewRef.current);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const singleCellBorder = "border border-slate-300 dark:border-slate-700 bg-clip-padding";

  // ─── Empty state ─────────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="text-center py-16 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/30">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
          <FileBox className="w-8 h-8 text-blue-500 dark:text-blue-400" />
        </div>
        <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-1">Kosztorys jest pusty</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 max-w-xs mx-auto">
          Dodaj pozycje z katalogu po lewej, użyj ES-Engine lub zaimportuj z Excela
        </p>
        <div className="flex flex-wrap gap-2 justify-center text-[10px] text-slate-400 dark:text-slate-500">
          {["📋 Katalog", "⚡ ES-Engine", "📊 Import Excel", "📦 Zestawy"].map(label => (
            <span key={label} className="px-2 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">{label}</span>
          ))}
        </div>
      </div>
    );
  }

  // ─── Render helpers ───────────────────────────────────────────────────────────

  const renderItemRow = (item: ProjectItem, rowNumber: number | null, assemblyChildren: ProjectItem[], isCollapsedAssembly?: boolean) => {
    const hasChildren = assemblyParentIds.has(item.id);
    const matchIdx = searchQuery ? searchMatchIds.indexOf(item.id) : -1;
    const isCurrentMatch = searchQuery ? matchIdx === currentMatchIndex : false;
    return (
      <EstimateRow
        key={item.id} item={item} rowNumber={rowNumber}
        editingState={editingState}
        onStartEdit={startEdit} onSaveEdit={saveEdits} onCancelEdit={cancelEdit}
        onEditingChange={setEditingState}
        onDelete={(i) => {
          if (isFinal) { toast({ title: "Projekt zablokowany", description: "Odblokuj projekt, aby usunąć pozycje", variant: "destructive" }); return; }
          setDeleteDialogItem(i);
        }}
        onDuplicate={(i) => {
          if (isFinal) { toast({ title: "Projekt zablokowany", description: "Odblokuj projekt, aby kopiować pozycje", variant: "destructive" }); return; }
          handleDuplicate(i);
        }}
        onStartAddChild={startAddChild}
        isSelected={selectedIds.has(item.id)} onToggleSelect={toggleSelect}
        isFinal={isFinal} isReadOnly={isReadOnly} isPro={isPro}
        isDndEnabled={isDndEnabled} compactView={compactView} colorMode={colorMode}
        bruttoMode={bruttoMode} vatRate={vatRate}
        showMaterialsColumn={showMaterialsColumn} showLaborColumn={showLaborColumn} showRgCol={showRgCol}
        showKnrCol={showKnrCol}
        materialsOwnedByCustomer={materialsOwnedByCustomer}
        adjustmentMultiplier={adjustmentMultiplier} regionModifier={regionModifier} filterType={filterType}
        isAssemblyParent={hasChildren && !item.is_assembly_child}
        isCollapsedAssembly={isCollapsedAssembly ?? collapsedAssemblies.has(item.id)}
        onToggleAssemblyCollapse={() => toggleAssemblyCollapse(item.id)}
        isCurrentMatch={isCurrentMatch}
        searchRef={(el) => { if (el && matchIdx >= 0) matchRefs.current.set(matchIdx, el); }}
        highlightText={highlightText} uniqueSections={uniqueSections}
        useCustomRates={useCustomRates}
        onGlobalFallback={(isFinal || !rateIsSet) ? undefined : handleGlobalFallback}
        fallbackLoadingIds={fallbackLoadingIds}
      />
    );
  };

  return (
    <div className="flex flex-col">
      <div className="mb-3 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-2 flex-shrink-0">
        <div className="flex-1 min-w-0">{tabsSection}</div>
        {toolbarExtra && <div className="flex-shrink-0 w-full lg:w-auto">{toolbarExtra}</div>}
      </div>

      <EstimateFilterBar
        isFinal={isFinal}
        isSearchOpen={isSearchOpen}
        searchQuery={searchQuery}
        searchMatchIds={searchMatchIds}
        currentMatchIndex={currentMatchIndex}
        filterType={filterType}
        sortBy={sortBy}
        sortOrder={sortOrder}
        categoryFilter={categoryFilter}
        sectionFilter={sectionFilter}
        uniqueCategories={uniqueCategories}
        uniqueSections={uniqueSections}
        groupBySection={groupBySection}
        collapsedSections={collapsedSections}
        colorMode={colorMode}
        compactView={compactView}
        showColorToggle={!!onColorModeChange}
        showKnrCol={showKnrCol}
        isAnalyzing={isFillNormsPending || isFillKnrCodesPending}
        filterBarExtra={
          <div className="flex items-center gap-2 flex-wrap">
            {filterBarExtra}
          </div>
        }
        localItems={localItems}
        onSearchOpen={handleSearchOpen}
        onSearchClose={handleSearchClose}
        onSearchChange={setSearchQuery}
        onGoToMatch={goToMatch}
        onFilterType={setFilterType}
        onSortBy={setSortBy}
        onSortOrder={setSortOrder}
        onCategoryFilter={setCategoryFilter}
        onSectionFilter={setSectionFilter}
        onGroupBySection={handleGroupBySection}
        onCollapsedSections={setCollapsedSections}
        onColorMode={handleColorMode}
        onCompactView={handleCompactView}
        onToast={toast}
      />

      {/* Mobile Card View — only shown when compactView=true (compact/card mode) on small screens */}
      <div className={cn("lg:hidden", compactView ? "block" : "hidden")}>
        <EstimateMobileCards
          items={filteredItems} isPro={isPro} isFinal={isFinal} isReadOnly={isReadOnly}
          adjustmentPercentage={adjustmentPercentage} selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onDelete={(id) => { const item = localItems.find((i) => i.id === id); if (item) setDeleteDialogItem(item); }}
          onDuplicate={(id) => { const item = localItems.find((i) => i.id === id); if (item) handleDuplicate(item); }}
          onMoveUp={handleMobileMoveUp}
          onMoveDown={handleMobileMoveDown}
          onSaveEdit={(id, updates) => handleMobileSaveEdit(id, updates)}
        />
      </div>

      {/* Desktop Table — always shown on lg+; on mobile shown only when compactView=false (Widok normalny) */}
      <div className={cn(!compactView ? "block" : "hidden lg:block")}>
        <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter}
          onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
          <div className="no-btn-scale border rounded-lg dark:border-slate-800 bg-slate-100 dark:bg-slate-900 relative overflow-x-auto scroll-smooth">
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white/90 dark:from-slate-900/90 to-transparent pointer-events-none md:hidden z-10" />
            <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-slate-100/80 dark:from-slate-900/80 to-transparent pointer-events-none md:hidden z-10" />
            <Table
              className={cn("border-separate min-w-[800px] md:min-w-full", compactView && "[&_td]:py-1 [&_td]:px-1.5 [&_th]:py-1 [&_th]:px-1.5")}
              style={{ borderSpacing: compactView ? "0 1px" : "0 2px" }}
            >
              <EstimateTableHeader
                isFinal={isFinal} isReadOnly={isReadOnly} isDndEnabled={isDndEnabled}
                colorMode={colorMode} filterType={filterType}
                showMaterialsColumn={showMaterialsColumn} showLaborColumn={showLaborColumn}
                showRgCol={showRgCol}
                hasAnyLaborNorm={hasAnyLaborNorm}
                selectedCount={selectedIds.size} filteredCount={filteredItems.length}
                materialsOwnedByCustomer={materialsOwnedByCustomer}
                onToggleSelectAll={toggleSelectAll}
                showKnrCol={showKnrCol}
                onFillNorms={handleFillNorms}
                hasAnyKnrCode={hasAnyKnrCode}
                onFillKnrCodes={handleFillKnrCodes}
                isFillKnrCodesPending={isFillKnrCodesPending}
              />
              <SortableContext items={topLevelIds} strategy={verticalListSortingStrategy}>
                <TableBody>
                  {topLevelItems.map((topItem, topIdx) => {
                    const assemblyChildren = childrenMap.get(topItem.id) || [];
                    const isAddingChild = addingChildTo?.parentId === topItem.id;
                    const currentSection = topItem.section || "";
                    const prevSection = topIdx > 0 ? (topLevelItems[topIdx - 1]?.section || "") : "__FIRST__";
                    const showSectionHeader = groupBySection && currentSection !== prevSection;
                    const sectionKey = currentSection || "__none__";
                    const isCollapsed = collapsedSections.has(sectionKey);

                    return (
                      <React.Fragment key={topItem.id}>
                        {showSectionHeader && (
                          <EstimateGroupHeader
                            sectionName={currentSection}
                            itemCount={topLevelItems.filter((i) => (i.section || "") === currentSection).length}
                            sectionTopItems={topLevelItems.filter((i) => (i.section || "") === currentSection)}
                            childrenMap={childrenMap}
                            adjustmentMultiplier={adjustmentMultiplier}
                            materialsOwnedByCustomer={materialsOwnedByCustomer}
                            isPro={isPro} isCollapsed={isCollapsed}
                            onToggle={() => toggleSectionCollapse(sectionKey)}
                          />
                        )}
                        {(!groupBySection || !isCollapsed) && (
                          <>
                            {renderItemRow(topItem, topIdx + 1, assemblyChildren)}
                            {!collapsedAssemblies.has(topItem.id) && assemblyChildren.map((child) => (
                              <React.Fragment key={child.id}>
                                {renderItemRow(child, null, [], false)}
                              </React.Fragment>
                            ))}
                            {isAddingChild && (
                              <AddChildRow
                                isFinal={isFinal} isReadOnly={isReadOnly} isDndEnabled={isDndEnabled}
                                showMaterialsColumn={showMaterialsColumn} showLaborColumn={showLaborColumn}
                                showRgCol={showRgCol} singleCellBorder={singleCellBorder}
                                name={addingChildTo!.name} unit={addingChildTo!.unit}
                                quantity={addingChildTo!.quantity}
                                materialPrice={addingChildTo!.materialPrice}
                                laborPrice={addingChildTo!.laborPrice}
                                onNameChange={(v) => setAddingChildTo((s) => s ? { ...s, name: v } : s)}
                                onUnitChange={(v) => setAddingChildTo((s) => s ? { ...s, unit: v } : s)}
                                onQuantityChange={(v) => setAddingChildTo((s) => s ? { ...s, quantity: v } : s)}
                                onMaterialPriceChange={(v) => setAddingChildTo((s) => s ? { ...s, materialPrice: v } : s)}
                                onLaborPriceChange={(v) => setAddingChildTo((s) => s ? { ...s, laborPrice: v } : s)}
                                onSave={saveAddChild} onCancel={cancelAddChild}
                              />
                            )}
                          </>
                        )}
                      </React.Fragment>
                    );
                  })}
                  {/* R-G footer row — always visible when norms exist */}
                  {totalLaborHours > 0 && (
                    <TableRow className={`border-t-2 ${colorMode ? "bg-blue-50/50 dark:bg-blue-950/10 border-blue-200 dark:border-blue-800" : "bg-slate-50/50 dark:bg-slate-800/20 border-slate-200 dark:border-slate-700"}`}>
                      <TableCell colSpan={99} className="py-1.5 px-3 text-right">
                        <span className={`text-xs font-medium ${colorMode ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"}`}>
                          ⏱ Łączny czas pracy: <strong>{totalLaborHours.toFixed(2)} rbh</strong>
                        </span>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </SortableContext>
            </Table>
          </div>
          <DragOverlay dropAnimation={{ duration: 200, easing: "ease" }}>
            {activeDragId ? (
              <div className="bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-600 rounded-lg px-4 py-2.5 shadow-2xl shadow-blue-500/20 text-sm font-medium text-slate-700 dark:text-slate-200 max-w-sm truncate ring-1 ring-blue-400/30">
                <span className="flex items-center gap-2">
                  <GripVertical className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                  <span className="truncate">
                    {(() => {
                      const d = localItems.find((i) => i.id === activeDragId);
                      const isA = localItems.some((i) => i.parent_assembly_id === activeDragId);
                      return isA ? `${d?.name ?? ""} (zestaw)` : d?.name ?? "";
                    })()}
                  </span>
                </span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <EstimateBulkActions
        projectId={projectId} selectedIds={selectedIds}
        isFinal={isFinal} isReadOnly={isReadOnly}
        onClear={() => setSelectedIds(new Set())}
        onOptimisticSectionUpdate={(ids: Set<string>, section: string | null) =>
          setLocalItems((prev: ProjectItem[]) => prev.map((item: ProjectItem) => ids.has(item.id) ? { ...item, section: section || null } : item))
        }
      />

      <AlertDialog open={!!deleteDialogItem} onOpenChange={(open) => !open && setDeleteDialogItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usuń pozycję?</AlertDialogTitle>
            <AlertDialogDescription>
              Czy na pewno chcesz usunąć <strong>{deleteDialogItem?.name}</strong> z kosztorysu? Ta operacja jest nieodwracalna.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDialogItem && handleDelete(deleteDialogItem)}
              className="bg-red-600 hover:bg-red-700"
            >
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
