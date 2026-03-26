"use client";

import React from "react";
import {
  Search, X, ArrowUp, ArrowDown, LayoutGrid,
  ChevronUp, ChevronDown, Palette, List, Maximize2, SlidersHorizontal, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface EstimateFilterBarProps {
  isFinal: boolean;
  isSearchOpen: boolean;
  searchQuery: string;
  searchMatchIds: string[];
  currentMatchIndex: number;
  filterType: "all" | "materials" | "labor";
  sortBy: "name" | "price" | "date";
  sortOrder: "asc" | "desc";
  categoryFilter: string;
  sectionFilter: string;
  uniqueCategories: [string, string][];
  uniqueSections: string[];
  groupBySection: boolean;
  collapsedSections: Set<string>;
  colorMode: boolean;
  compactView: boolean;
  showColorToggle: boolean;
  showKnrCol?: boolean;
  filterBarExtra?: React.ReactNode;
  isAnalyzing?: boolean;
  localItems: { section?: string | null; is_assembly_child?: boolean }[];
  onSearchOpen: () => void;
  onSearchClose: () => void;
  onSearchChange: (q: string) => void;
  onGoToMatch: (dir: "next" | "prev") => void;
  onFilterType: (v: "all" | "materials" | "labor") => void;
  onSortBy: (v: "name" | "price" | "date") => void;
  onSortOrder: (v: "asc" | "desc") => void;
  onCategoryFilter: (v: string) => void;
  onSectionFilter: (v: string) => void;
  onGroupBySection: (v: boolean) => void;
  onCollapsedSections: (v: Set<string>) => void;
  onColorMode: () => void;
  onCompactView: () => void;
  onToast: (msg: { title: string; description: string; variant?: "destructive" }) => void;
}

export function EstimateFilterBar({
  isFinal, isSearchOpen, searchQuery, searchMatchIds, currentMatchIndex,
  filterType, sortBy, sortOrder, categoryFilter, sectionFilter,
  uniqueCategories, uniqueSections, groupBySection, collapsedSections,
  colorMode, compactView, showColorToggle, showKnrCol, filterBarExtra, isAnalyzing, localItems,
  onSearchOpen, onSearchClose, onSearchChange, onGoToMatch,
  onFilterType, onSortBy, onSortOrder, onCategoryFilter, onSectionFilter,
  onGroupBySection, onCollapsedSections, onColorMode, onCompactView, onToast,
}: EstimateFilterBarProps) {
  return (
    <div className="mb-3 flex flex-col gap-1 p-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700/50 flex-shrink-0">
      {/* Row 1: Search + type filter + category + section */}
      <div className="flex items-center gap-1.5 overflow-x-auto flex-nowrap no-scrollbar">
        {!isSearchOpen ? (
          <Button variant="ghost" size="sm"
            onClick={() => {
              if (isFinal) { onToast({ title: "🔒 Projekt zablokowany", description: "Odblokuj projekt, aby wyszukiwać pozycje", variant: "destructive" }); return; }
              onSearchOpen();
            }}
            className={cn("h-7 sm:h-8 px-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex-shrink-0", isFinal && "opacity-40 cursor-not-allowed")}>
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" /><span className="hidden sm:inline ml-1 text-xs">Szukaj</span>
          </Button>
        ) : (
          <div className="flex min-w-[120px] sm:min-w-[160px] max-w-[220px] items-center gap-1 bg-white dark:bg-slate-900 border rounded-md px-2 py-1 shadow-sm h-7 sm:h-8 flex-shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <Input type="text" id="search-items" name="search-items" autoComplete="off" aria-label="Szukaj pozycji" placeholder="Szukaj..." value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="border-0 shadow-none focus-visible:ring-0 h-auto p-0 flex-1 min-w-0 text-xs" autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onGoToMatch(e.shiftKey ? "prev" : "next"); } }} />
            {searchQuery && searchMatchIds.length > 0 && (
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <span className="text-[10px] text-slate-500 whitespace-nowrap">{currentMatchIndex + 1}/{searchMatchIds.length}</span>
                <Button variant="ghost" size="sm" onClick={() => onGoToMatch("prev")} className="h-4 w-4 p-0"><ChevronUp className="w-3 h-3" /></Button>
                <Button variant="ghost" size="sm" onClick={() => onGoToMatch("next")} className="h-4 w-4 p-0"><ChevronDown className="w-3 h-3" /></Button>
              </div>
            )}
            {searchQuery && searchMatchIds.length === 0 && <span className="text-[10px] text-red-500 flex-shrink-0">0</span>}
            <Button variant="ghost" size="sm" onClick={() => { onSearchChange(""); onSearchClose(); }} className="h-4 w-4 p-0"><X className="w-3 h-3" /></Button>
          </div>
        )}

        <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 hidden sm:block flex-shrink-0" />

        <div className={cn("flex items-center gap-0.5 p-0.5 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 flex-shrink-0", isFinal && "opacity-40 pointer-events-none")}>
          {(["all", "materials", "labor"] as const).map((type) => (
            <button key={type} onClick={() => onFilterType(type)}
              className={cn("px-2 py-1 rounded text-[11px] sm:text-xs font-medium transition-all",
                filterType === type ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200")}>
              {type === "all" ? "Wszystkie" : type === "materials" ? "Materiały" : "Robocizna"}
            </button>
          ))}
        </div>

        {uniqueCategories.length > 0 && (
          <Select value={categoryFilter} onValueChange={isFinal ? undefined : onCategoryFilter}>
            <SelectTrigger className={cn("h-7 sm:h-8 w-auto min-w-[100px] sm:min-w-[130px] text-[11px] sm:text-xs px-2 border-slate-200 dark:border-slate-700", isFinal && "opacity-40 cursor-not-allowed pointer-events-none")}>
              <SelectValue placeholder="Kategoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie kategorie</SelectItem>
              {uniqueCategories.map(([id, name]) => <SelectItem key={id} value={id}>{name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}

        {uniqueSections.length > 0 && (
          <Select value={sectionFilter} onValueChange={isFinal ? undefined : onSectionFilter}>
            <SelectTrigger className={cn("h-7 sm:h-8 w-auto min-w-[80px] sm:min-w-[110px] text-[11px] sm:text-xs px-2 border-slate-200 dark:border-slate-700", isFinal && "opacity-40 cursor-not-allowed pointer-events-none")}>
              <SelectValue placeholder="Sekcja" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie sekcje</SelectItem>
              <SelectItem value="__none__">Bez sekcji</SelectItem>
              {uniqueSections.map((sec) => <SelectItem key={sec} value={sec}>{sec}</SelectItem>)}
            </SelectContent>
          </Select>
        )}

        {uniqueSections.length > 0 && (
          <>
            <Button variant="ghost" size="sm"
              onClick={() => { onGroupBySection(!groupBySection); if (groupBySection) onCollapsedSections(new Set()); }}
              className={cn("h-7 sm:h-8 px-2 text-[11px] sm:text-xs gap-1 transition-all flex-shrink-0",
                groupBySection
                  ? "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/40 hover:bg-purple-200 dark:hover:bg-purple-900/60"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200")}
              title={groupBySection ? "Wyłącz grupowanie" : "Grupuj wg sekcji"}>
              <LayoutGrid className="w-3.5 h-3.5" /><span className="hidden sm:inline">Sekcje</span>
            </Button>

            {groupBySection && (() => {
              const hasUnsectioned = localItems.some(i => !i.section && !i.is_assembly_child);
              const allSectionKeys = [...uniqueSections, ...(hasUnsectioned ? ["__none__"] : [])];
              const allCollapsed = allSectionKeys.length > 0 && collapsedSections.size >= allSectionKeys.length;
              return (
                <Button variant="ghost" size="sm"
                  onClick={() => onCollapsedSections(allCollapsed ? new Set() : new Set(allSectionKeys))}
                  className="h-7 sm:h-8 px-2 text-[11px] sm:text-xs gap-1 text-purple-500 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex-shrink-0"
                  title={allCollapsed ? "Rozwiń wszystkie" : "Zwiń wszystkie"}>
                  {allCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{allCollapsed ? "Rozwiń" : "Zwiń"}</span>
                </Button>
              );
            })()}
          </>
        )}

        {/* Separator */}
        <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 flex-shrink-0" />

        {/* Normalny/Kompakt toggle */}
        <button
          onClick={isFinal ? undefined : onCompactView}
          title={compactView ? "Widok normalny" : "Widok kompaktowy"}
          className={cn(
            "inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] sm:text-xs font-medium transition-all flex-shrink-0 h-7 sm:h-8",
            isFinal ? "opacity-40 cursor-not-allowed text-slate-400" :
            compactView ? "bg-blue-600 text-white shadow-sm" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600"
          )}
        >
          {compactView ? <Maximize2 className="w-3.5 h-3.5" /> : <List className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{compactView ? "Normalny" : "Kompakt"}</span>
        </button>

        {/* Sort select + order */}
        <div className={cn("flex items-center gap-0.5 flex-shrink-0", isFinal && "opacity-50 pointer-events-none")}>
          <Select key={`sort-by-${sortBy}`} value={sortBy} onValueChange={isFinal ? undefined : (v) => onSortBy(v as "name" | "price" | "date")}>
            <SelectTrigger className="h-7 sm:h-8 w-[72px] sm:w-[90px] text-[11px] sm:text-xs px-2 border-slate-200 dark:border-slate-700">
              <SlidersHorizontal className="w-3 h-3 mr-1 hidden sm:inline flex-shrink-0" />
              <SelectValue placeholder="Sortuj" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Data</SelectItem>
              <SelectItem value="name">Nazwa</SelectItem>
              <SelectItem value="price">Cena</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" onClick={() => onSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            title={sortOrder === "asc" ? "Rosnąco" : "Malejąco"}>
            {sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
          </Button>
        </div>

        {/* Color toggle */}
        {showColorToggle && (
          <button onClick={() => { if (isFinal) return; onColorMode(); }}
            title={colorMode ? "Wyłącz kolory" : "Włącz kolory"}
            className={cn("h-7 w-7 sm:h-8 sm:w-8 flex items-center justify-center rounded text-[11px] transition-all flex-shrink-0",
              isFinal ? "opacity-40 cursor-not-allowed text-slate-400"
                : colorMode ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200")}>
            <Palette className="w-3.5 h-3.5" />
          </button>
        )}

        {/* AI analyzing indicator */}
        {isAnalyzing && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-700 text-[10px] text-violet-600 dark:text-violet-400 font-medium flex-shrink-0 animate-pulse">
            <Loader2 className="w-2.5 h-2.5 animate-spin" />
            ES-Engine analizuje...
          </div>
        )}
        {/* Region indicator (right-aligned) */}
        {filterBarExtra && <div className="flex flex-1 items-center justify-end">{filterBarExtra}</div>}
      </div>

      {/* Color legend — only when colorMode active */}
      {colorMode && (
        <div className="flex flex-wrap items-center gap-1.5 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap hidden sm:inline">Legenda:</span>
          <span className="flex items-center gap-1 whitespace-nowrap"><span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-r from-orange-400 to-orange-500 inline-block" /> Zestawy</span>
          <span className="flex items-center gap-1 whitespace-nowrap"><span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-r from-blue-400 to-blue-500 inline-block" /> Pozycje</span>
          <span className="flex items-center gap-1 whitespace-nowrap"><span className="w-2.5 h-2.5 rounded-sm bg-amber-300 inline-block" /> Materiał</span>
          <span className="flex items-center gap-1 whitespace-nowrap"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-300 inline-block" /> Robocizna</span>
          <span className="flex items-center gap-1 whitespace-nowrap"><span className="w-2.5 h-2.5 rounded-sm bg-blue-600 inline-block" /> Suma</span>
          <span className="flex items-center gap-1 whitespace-nowrap"><span className="w-2.5 h-2.5 rounded-sm bg-cyan-500 inline-block" /> rbh</span>
          {showKnrCol && (
            <span className="flex items-center gap-1 whitespace-nowrap">
              <span className="w-2.5 h-2.5 rounded-sm bg-violet-700 inline-block" />
              <span>KNR</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
