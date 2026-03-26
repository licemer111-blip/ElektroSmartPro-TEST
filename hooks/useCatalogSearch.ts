"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { searchCatalogItems, getCatalogItemsByCategory, getCatalogDataBatch } from "@/app/dashboard/projects/[id]/actions";
import type { CatalogCategory, CatalogItem } from "@/lib/types/database";
import type { DataSourceMode } from "@/hooks/use-search-mode";

// ─── Types ────────────────────────────────────────────────────────────────────────

export type SourceFilter = "all" | "personal" | "team";

export interface UseCatalogSearchOptions {
  initialCategories: CatalogCategory[];
  initialItemsByCategory: Record<string, CatalogItem[]>;
  searchMode?: DataSourceMode;
}

export interface UseCatalogSearchReturn {
  // Categories
  categories: CatalogCategory[];
  visibleCategories: CatalogCategory[];
  // Items
  loadedItems: Record<string, CatalogItem[]>;
  loadingCategory: string | null;
  // Search
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searchResults: CatalogItem[];
  isSearching: boolean;
  // Source filter
  sourceFilter: SourceFilter;
  setSourceFilter: (filter: SourceFilter) => void;
  // Category expansion
  expandedCategory: string;
  setExpandedCategory: (id: string) => void;
  // Helpers
  filterItems: (items: CatalogItem[]) => CatalogItem[];
  getItemsForCategory: (categoryId: string) => CatalogItem[];
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCatalogSearch({
  initialCategories,
  initialItemsByCategory,
  searchMode = "hybrid",
}: UseCatalogSearchOptions): UseCatalogSearchReturn {
  const [categories, setCategories] = useState<CatalogCategory[]>(initialCategories);
  const [loadedItems, setLoadedItems] = useState<Record<string, CatalogItem[]>>(initialItemsByCategory);
  const [loadingCategory, setLoadingCategory] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<CatalogItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Derive initial sourceFilter from searchMode
  const modeToSource = (m: DataSourceMode): SourceFilter =>
    m === "own" ? "personal" : m === "engine" ? "all" : "all";

  const [sourceFilter, setSourceFilter] = useState<SourceFilter>(() => modeToSource(searchMode));

  // Sync sourceFilter when searchMode prop changes
  useEffect(() => {
    setSourceFilter(modeToSource(searchMode));
  }, [searchMode]); // eslint-disable-line react-hooks/exhaustive-deps
  const [expandedCategory, setExpandedCategory] = useState<string>("");

  const isMountedRef = useRef(false);
  const reloadDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Reload entire catalog in one batch ────────────────────────────────────
  const reloadCatalog = useCallback(async (
    filter: SourceFilter,
  ) => {
    setLoadedItems({});
    setExpandedCategory("");
    const { categories: cats, itemsByCategory } = await getCatalogDataBatch(undefined, filter)
      .catch(() => ({ categories: [] as CatalogCategory[], itemsByCategory: {} as Record<string, CatalogItem[]> }));
    if (!cats.length) return;
    setCategories(cats);
    setLoadedItems(itemsByCategory);
  }, []);

  // ── Initial catalog load on mount + react to sourceFilter changes ─────────────
  // On mount: isMountedRef is false → trigger initial load.
  // On subsequent sourceFilter changes: isMountedRef is true → reload.
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      // Debounced initial load to avoid double-fire with concurrent renders
      if (reloadDebounceRef.current) clearTimeout(reloadDebounceRef.current);
      reloadDebounceRef.current = setTimeout(() => {
        reloadCatalog(sourceFilter);
      }, 50);
      return () => { if (reloadDebounceRef.current) clearTimeout(reloadDebounceRef.current); };
    }
    reloadCatalog(sourceFilter);
  }, [sourceFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Lazy-load items when category expands ────────────────────────────────────
  useEffect(() => {
    if (!expandedCategory || loadingCategory || loadedItems[expandedCategory]) return;

    const fetchItems = async () => {
      setLoadingCategory(expandedCategory);
      try {
        const items = await getCatalogItemsByCategory(expandedCategory, undefined, sourceFilter);
        setLoadedItems(prev => ({ ...prev, [expandedCategory]: items }));
      } catch {
        // silently fail — parent can show toast if needed
      } finally {
        setLoadingCategory(null);
      }
    };
    fetchItems();
  }, [expandedCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Debounced server-side search (500ms) ─────────────────────────────────────
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchCatalogItems(searchTerm, searchMode);
        setSearchResults(results);
      } catch {
        // silently fail
      } finally {
        setIsSearching(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, searchMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Filter items by sourceFilter / searchMode ────────────────────────────────
  const filterItems = useCallback((items: CatalogItem[]): CatalogItem[] => {
    if (searchMode === "engine") {
      return items.filter(item => item.user_id === null);
    }
    if (sourceFilter === "personal") {
      return items.filter(item => item.user_id && (item.visibility === "personal" || !item.visibility));
    }
    if (sourceFilter === "team") {
      return items.filter(item => item.visibility === "team" && item.team_id);
    }
    return items;
  }, [sourceFilter, searchMode]);

  // ── Visible categories (hide empty for personal/team) ────────────────────────
  const visibleCategories = sourceFilter === "all"
    ? categories
    : categories.filter(cat => ((cat as CatalogCategory & { count?: number }).count ?? 0) > 0);

  // ── Get items for a category (search or loaded) ───────────────────────────────
  const getItemsForCategory = useCallback((categoryId: string): CatalogItem[] => {
    if (searchTerm) {
      return searchResults.filter(i => i.category_id === categoryId);
    }
    return loadedItems[categoryId] || [];
  }, [searchTerm, searchResults, loadedItems]);

  return {
    categories,
    visibleCategories,
    loadedItems,
    loadingCategory,
    searchTerm,
    setSearchTerm,
    searchResults,
    isSearching,
    sourceFilter,
    setSourceFilter,
    expandedCategory,
    setExpandedCategory,
    filterItems,
    getItemsForCategory,
  };
}
