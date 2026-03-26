"use client";

import React from "react";
import type { ProjectItem } from "@/lib/types/database";

export type SortBy = "name" | "price" | "date";
export type SortOrder = "asc" | "desc";
export type FilterType = "all" | "materials" | "labor";

export interface EstimateGroupsResult {
  filteredItems: ProjectItem[];
  topLevelItems: ProjectItem[];
  childrenMap: Map<string, ProjectItem[]>;
  uniqueCategories: [string, string][];
  uniqueSections: string[];
  searchMatchIds: string[];
  assemblyParentIds: Set<string>;
}

interface UseEstimateGroupsParams {
  localItems: ProjectItem[];
  categoryFilter: string;
  sectionFilter: string;
  searchQuery: string;
  sortBy: SortBy;
  sortOrder: SortOrder;
  groupBySection: boolean;
}

export function useEstimateGroups({
  localItems,
  categoryFilter,
  sectionFilter,
  searchQuery,
  sortBy,
  sortOrder,
  groupBySection,
}: UseEstimateGroupsParams): EstimateGroupsResult {
  const uniqueCategories = React.useMemo<[string, string][]>(() => {
    const cats = new Map<string, string>();
    localItems.forEach(item => {
      const cat = item.catalog_categories;
      if (cat && cat.id && cat.name) {
        cats.set(cat.id, cat.name);
      }
    });
    return Array.from(cats.entries()).sort((a, b) => a[1].localeCompare(b[1], "pl"));
  }, [localItems]);

  const uniqueSections = React.useMemo<string[]>(() => {
    const secs = new Set<string>();
    localItems.forEach(item => {
      if (item.section) secs.add(item.section);
    });
    return Array.from(secs).sort((a, b) => a.localeCompare(b, "pl"));
  }, [localItems]);

  const assemblyParentIds = React.useMemo<Set<string>>(() => {
    const s = new Set<string>();
    localItems.forEach(i => {
      if (i.parent_assembly_id) s.add(i.parent_assembly_id);
    });
    return s;
  }, [localItems]);

  const { filteredItems, topLevelItems, childrenMap } = React.useMemo(() => {
    let result = localItems;

    if (categoryFilter !== "all") {
      result = result.filter(item => item.catalog_categories?.id === categoryFilter);
    }

    if (sectionFilter !== "all") {
      if (sectionFilter === "__none__") {
        result = result.filter(item => !item.section);
      } else {
        result = result.filter(item => item.section === sectionFilter);
      }
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item =>
        item.name.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.section && item.section.toLowerCase().includes(q)) ||
        (item.catalog_categories?.name && item.catalog_categories.name.toLowerCase().includes(q))
      );
    }

    result = [...result].sort((a, b) => {
      if (groupBySection) {
        const secA = a.is_assembly_child ? "" : (a.section || "\uffff");
        const secB = b.is_assembly_child ? "" : (b.section || "\uffff");
        if (!a.is_assembly_child && !b.is_assembly_child && secA !== secB) {
          return secA.localeCompare(secB, "pl");
        }
      }

      let comparison = 0;
      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name, "pl");
          break;
        case "price": {
          const priceA = (a.final_material_price ?? a.material_price ?? 0) + (a.final_labor_price ?? a.labor_price ?? 0);
          const priceB = (b.final_material_price ?? b.material_price ?? 0) + (b.final_labor_price ?? b.labor_price ?? 0);
          comparison = priceA - priceB;
          break;
        }
        case "date":
          comparison = (a.sort_order ?? 0) - (b.sort_order ?? 0);
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    const top: ProjectItem[] = [];
    const children = new Map<string, ProjectItem[]>();
    for (const item of result) {
      if (item.is_assembly_child && item.parent_assembly_id) {
        const list = children.get(item.parent_assembly_id) || [];
        list.push(item);
        children.set(item.parent_assembly_id, list);
      } else {
        top.push(item);
      }
    }

    return { filteredItems: result, topLevelItems: top, childrenMap: children };
  }, [localItems, categoryFilter, sectionFilter, searchQuery, sortBy, sortOrder, groupBySection]);

  const searchMatchIds = React.useMemo<string[]>(() => {
    if (!searchQuery) return [];
    return filteredItems.map(i => i.id);
  }, [searchQuery, filteredItems]);

  return {
    filteredItems,
    topLevelItems,
    childrenMap,
    uniqueCategories,
    uniqueSections,
    searchMatchIds,
    assemblyParentIds,
  };
}
