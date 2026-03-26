"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import React from "react";
import { useRouter } from "next/navigation";
import { useTabSyncOptional } from "@/components/project/tab-sync-context";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { notifyDataChanged } from "@/hooks/use-synced-action";
import { updateItemSortOrder, reorderProjectItems } from "@/app/dashboard/projects/[id]/actions";
import type { ProjectItem } from "@/lib/types/database";

export interface UseEstimateInteractionParams {
  projectId: string;
  items: ProjectItem[];
  localItems: ProjectItem[];
  setLocalItems: React.Dispatch<React.SetStateAction<ProjectItem[]>>;
  filteredItems: ProjectItem[];
  searchMatchIds: string[];
  isReadOnly: boolean;
  onSelectedIdsChange?: (ids: Set<string>) => void;
  compactViewControlled?: boolean;
  onCompactViewChange?: (v: boolean) => void;
  onColorModeChange?: (v: boolean) => void;
  colorMode: boolean;
}

export function useEstimateInteraction({
  projectId,
  items,
  localItems,
  setLocalItems,
  filteredItems,
  searchMatchIds,
  isReadOnly,
  onSelectedIdsChange,
  compactViewControlled,
  onCompactViewChange,
}: UseEstimateInteractionParams) {
  const router = useRouter();
  const tabSyncContext = useTabSyncOptional();

  // ─── UI state ─────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "price" | "date">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [filterType, setFilterType] = useState<"all" | "materials" | "labor">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [compactViewInternal, setCompactViewInternal] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const [groupBySection, setGroupBySection] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  const matchRefs = useRef<Map<number, HTMLTableRowElement>>(new Map());
  // Auto-enable section grouping when project has sections (fires once per mount)
  const hasAutoGroupedRef = useRef(false);
  useEffect(() => {
    if (hasAutoGroupedRef.current) return;
    const hasSections = items.some((i) => i.section && !i.is_assembly_child);
    if (hasSections) {
      setGroupBySection(true);
      hasAutoGroupedRef.current = true;
    }
  }, [items]);
  const onSelectedIdsChangeRef = useRef(onSelectedIdsChange);
  const onCompactViewChangeRef = useRef(onCompactViewChange);
  useEffect(() => { onSelectedIdsChangeRef.current = onSelectedIdsChange; });
  useEffect(() => { onCompactViewChangeRef.current = onCompactViewChange; });

  // ─── Stable refs for tabSyncContext ────────────────────────────────────
  const tabSyncSetUIStateRef = useRef(tabSyncContext?.setUIState);
  const tabSyncIsExternalSyncRef = useRef(tabSyncContext?.isExternalSync);
  tabSyncSetUIStateRef.current = tabSyncContext?.setUIState;
  tabSyncIsExternalSyncRef.current = tabSyncContext?.isExternalSync;

  const compactView = compactViewControlled !== undefined ? compactViewControlled : compactViewInternal;
  const setCompactView = useCallback((v: boolean) => {
    setCompactViewInternal(v);
    onCompactViewChangeRef.current?.(v);
  }, []);

  const isDndEnabled = !searchQuery && sortBy === "date" && categoryFilter === "all" && !isReadOnly;

  // ─── Effects ──────────────────────────────────────────────────────────────
  useEffect(() => {
    onSelectedIdsChangeRef.current?.(selectedIds);
    window.dispatchEvent(
      new CustomEvent("estimate-selection-changed", {
        detail: { projectId, ids: Array.from(selectedIds) },
      })
    );
  }, [selectedIds, projectId]);

  // Tab sync — receive (Following mode)
  useEffect(() => {
    if (!tabSyncContext?.isExternalSync) return;
    const ui = tabSyncContext.uiState;
    if (ui?.filterType && ui.filterType !== filterType) setFilterType(ui.filterType);
    if (ui?.estimateSearchOpen !== undefined && ui.estimateSearchOpen !== isSearchOpen)
      setIsSearchOpen(ui.estimateSearchOpen);
    if (ui?.estimateSearchQuery !== undefined && ui.estimateSearchQuery !== searchQuery)
      setSearchQuery(ui.estimateSearchQuery);
    if (ui?.estimateSortBy) setSortBy(ui.estimateSortBy);
    if (ui?.estimateSortOrder) setSortOrder(ui.estimateSortOrder);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabSyncContext?.isExternalSync, tabSyncContext?.uiState]);

  // Tab sync — broadcast (use refs to avoid tabSyncContext in deps — causes infinite loop)
  useEffect(() => {
    if (!tabSyncIsExternalSyncRef.current) {
      tabSyncSetUIStateRef.current?.({
        filterType,
        estimateSearchOpen: isSearchOpen,
        estimateSearchQuery: searchQuery,
        estimateSortBy: sortBy,
        estimateSortOrder: sortOrder,
      });
    }
  }, [filterType, isSearchOpen, searchQuery, sortBy, sortOrder]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === "Escape" && isSearchOpen) {
        setIsSearchOpen(false);
        setSearchQuery("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen]);

  useEffect(() => { setCurrentMatchIndex(0); }, [searchQuery]);

  // ─── Search helpers ───────────────────────────────────────────────────────
  const goToMatch = useCallback(
    (direction: "next" | "prev") => {
      if (searchMatchIds.length === 0) return;
      const newIdx =
        direction === "next"
          ? (currentMatchIndex + 1) % searchMatchIds.length
          : (currentMatchIndex - 1 + searchMatchIds.length) % searchMatchIds.length;
      setCurrentMatchIndex(newIdx);
      matchRefs.current.get(newIdx)?.scrollIntoView({ behavior: "smooth", block: "center" });
    },
    [searchMatchIds, currentMatchIndex]
  );

  const highlightText = useCallback(
    (text: string): React.ReactNode => {
      if (!searchQuery) return text;
      const regex = new RegExp(`(${searchQuery})`, "gi");
      return text.split(regex).map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-200 dark:bg-yellow-700 rounded px-0.5">
            {part}
          </mark>
        ) : (
          part
        )
      );
    },
    [searchQuery]
  );

  // ─── Stable refs for mutable data used inside callbacks ──────────────────
  const itemsRef = useRef(items);
  const localItemsRef = useRef(localItems);
  const filteredItemsRef = useRef(filteredItems);
  const setLocalItemsRef = useRef(setLocalItems);
  const selectedIdsRef = useRef(selectedIds);
  itemsRef.current = items;
  localItemsRef.current = localItems;
  filteredItemsRef.current = filteredItems;
  setLocalItemsRef.current = setLocalItems;
  selectedIdsRef.current = selectedIds;

  // ─── Selection ────────────────────────────────────────────────────────────
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const its = itemsRef.current;
      if (next.has(id)) {
        next.delete(id);
        its.filter((i) => i.parent_assembly_id === id).forEach((c) => next.delete(c.id));
      } else {
        next.add(id);
        its.filter((i) => i.parent_assembly_id === id).forEach((c) => next.add(c.id));
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    const fi = filteredItemsRef.current;
    const si = selectedIdsRef.current;
    setSelectedIds(
      si.size === fi.length ? new Set() : new Set(fi.map((i) => i.id))
    );
  }, []);

  // ─── Section collapse ─────────────────────────────────────────────────────
  const toggleSectionCollapse = useCallback((sectionKey: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionKey)) next.delete(sectionKey);
      else next.add(sectionKey);
      return next;
    });
  }, []);

  // ─── DnD handlers ─────────────────────────────────────────────────────────
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  }, []);

  const handleDragCancel = useCallback(() => setActiveDragId(null), []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeId = active.id as string;
    const overId = over.id as string;
    const li = localItemsRef.current;
    const fi = filteredItemsRef.current;
    const sli = setLocalItemsRef.current;
    const activeItem = li.find((i) => i.id === activeId);
    const overItem = li.find((i) => i.id === overId);
    if (!activeItem || !overItem) return;

    const childrenByParent = new Map<string, ProjectItem[]>();
    const topLevel: ProjectItem[] = [];
    for (const item of fi) {
      if (item.is_assembly_child && item.parent_assembly_id) {
        const list = childrenByParent.get(item.parent_assembly_id) || [];
        list.push(item);
        childrenByParent.set(item.parent_assembly_id, list);
      } else {
        topLevel.push(item);
      }
    }
    const activeIsChild = activeItem.is_assembly_child && !!activeItem.parent_assembly_id;
    const overIsChild = overItem.is_assembly_child && !!overItem.parent_assembly_id;

    if (activeIsChild) {
      if (!overIsChild || activeItem.parent_assembly_id !== overItem.parent_assembly_id) return;
      const parentId = activeItem.parent_assembly_id!;
      const children = childrenByParent.get(parentId) || [];
      const oldIdx = children.findIndex((c) => c.id === activeId);
      const newIdx = children.findIndex((c) => c.id === overId);
      if (oldIdx === -1 || newIdx === -1) return;
      childrenByParent.set(parentId, arrayMove(children, oldIdx, newIdx));
      const newItems: ProjectItem[] = [];
      for (const item of topLevel) {
        newItems.push(item);
        newItems.push(...(childrenByParent.get(item.id) || []));
      }
      sli(newItems.map((item, idx) => ({ ...item, sort_order: idx })));
      await updateItemSortOrder(projectId, newItems.map((i) => i.id));
      notifyDataChanged("items-reordered");
      router.refresh();
    } else {
      if (overIsChild) return;
      const oldIdx = topLevel.findIndex((i) => i.id === activeId);
      const newIdx = topLevel.findIndex((i) => i.id === overId);
      if (oldIdx === -1 || newIdx === -1) return;
      const reordered = arrayMove(topLevel, oldIdx, newIdx);
      const newItems: ProjectItem[] = [];
      for (const item of reordered) {
        newItems.push(item);
        newItems.push(...(childrenByParent.get(item.id) || []));
      }
      sli(newItems.map((item, idx) => ({ ...item, sort_order: idx })));
      await updateItemSortOrder(projectId, newItems.map((i) => i.id));
      notifyDataChanged("items-reordered");
      router.refresh();
    }
  }, [projectId, router]);

  // ─── Mobile reorder ───────────────────────────────────────────────────────
  const handleMobileMoveUp = useCallback((id: string) => {
    const li = localItemsRef.current;
    const sli = setLocalItemsRef.current;
    const idx = li.findIndex((i) => i.id === id);
    if (idx <= 0) return;
    const next = [...li];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    sli(next);
    reorderProjectItems(projectId, next.map((i) => i.id));
  }, [projectId]);

  const handleMobileMoveDown = useCallback((id: string) => {
    const li = localItemsRef.current;
    const sli = setLocalItemsRef.current;
    const idx = li.findIndex((i) => i.id === id);
    if (idx < 0 || idx >= li.length - 1) return;
    const next = [...li];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    sli(next);
    reorderProjectItems(projectId, next.map((i) => i.id));
  }, [projectId]);

  return {
    // state
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
    matchRefs,
    isDndEnabled,
    // handlers
    goToMatch,
    highlightText,
    toggleSelect,
    toggleSelectAll,
    toggleSectionCollapse,
    handleDragStart,
    handleDragCancel,
    handleDragEnd,
    handleMobileMoveUp,
    handleMobileMoveDown,
  };
}
