"use client";

import { useState, useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Search, X, Database, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { DictRow } from "../actions";

interface DictionaryBrowserProps {
  rows: DictRow[];
}

const TYPE_COLORS: Record<string, string> = {
  robocizna: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  zestaw:    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  material:  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

const ROW_HEIGHT = 36;
const OVERSCAN = 12;

export function DictionaryBrowser({ rows }: DictionaryBrowserProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const parentRef = useRef<HTMLDivElement>(null);

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(rows.map((r) => r.category))).sort()],
    [rows]
  );
  const types = useMemo(
    () => ["all", ...Array.from(new Set(rows.map((r) => r.type))).sort()],
    [rows]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return rows.filter((r) => {
      if (categoryFilter !== "all" && r.category !== categoryFilter) return false;
      if (typeFilter !== "all" && r.type !== typeFilter) return false;
      if (!q) return true;
      return (
        r.keyword.toLowerCase().includes(q) ||
        r.label.toLowerCase().includes(q) ||
        r.knr_ref.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q)
      );
    });
  }, [rows, search, categoryFilter, typeFilter]);

  const rowVirtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalHeight = rowVirtualizer.getTotalSize();

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-500" />
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Dictionary Browser — es_dictionary (L2)
            </h2>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-full">
              {filtered.length.toLocaleString("pl")} / {rows.length.toLocaleString("pl")}
            </span>
          </div>
          <button
            className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            onClick={() => setShowFilters((s) => !s)}
          >
            Filtry <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Search + Filters */}
        <div className="mt-2 flex flex-col gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              id="dict-browser-search"
              name="dict-browser-search"
              aria-label="Szukaj w słowniku ES"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Szukaj po słowie kluczowym, etykiecie, kodzie KNR…"
              className="w-full pl-8 pr-8 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none focus:ring-1 focus:ring-blue-400 transition"
            />
            {search && (
              <button
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                onClick={() => setSearch("")}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {showFilters && (
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 font-medium">Kategoria:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="text-[11px] rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-blue-400"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c === "all" ? "Wszystkie" : c}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 font-medium">Typ:</span>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="text-[11px] rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-blue-400"
                >
                  {types.map((t) => (
                    <option key={t} value={t}>{t === "all" ? "Wszystkie" : t}</option>
                  ))}
                </select>
              </div>
              {(categoryFilter !== "all" || typeFilter !== "all" || search) && (
                <button
                  className="text-[10px] text-red-500 hover:text-red-700 transition-colors"
                  onClick={() => { setCategoryFilter("all"); setTypeFilter("all"); setSearch(""); }}
                >
                  Wyczyść filtry
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[1fr_180px_100px_80px_60px_70px] bg-slate-100 dark:bg-slate-800 text-[10px] uppercase tracking-wide text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
        <div className="px-3 py-2">Słowo kluczowe / Etykieta</div>
        <div className="px-3 py-2">Kod KNR</div>
        <div className="px-3 py-2">Kategoria</div>
        <div className="px-3 py-2 text-right">Norma rbh</div>
        <div className="px-3 py-2 text-center">Jed.</div>
        <div className="px-3 py-2 text-center">Typ</div>
      </div>

      {/* Virtualized body */}
      {filtered.length === 0 ? (
        <div className="py-10 text-center text-sm text-slate-400">
          Brak wyników{search ? ` dla „${search}"` : ""}
        </div>
      ) : (
        <div
          ref={parentRef}
          className="overflow-y-auto bg-white dark:bg-slate-900"
          style={{ height: Math.min(totalHeight + 2, 480) }}
        >
          <div style={{ height: totalHeight, position: "relative" }}>
            {virtualItems.map((vItem) => {
              const row = filtered[vItem.index];
              const isEven = vItem.index % 2 === 0;
              return (
                <div
                  key={vItem.key}
                  data-index={vItem.index}
                  ref={rowVirtualizer.measureElement}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${vItem.start}px)`,
                    height: ROW_HEIGHT,
                  }}
                  className={`grid grid-cols-[1fr_180px_100px_80px_60px_70px] items-center border-b border-slate-50 dark:border-slate-800/50 hover:bg-blue-50/40 dark:hover:bg-blue-950/10 transition-colors text-xs ${
                    isEven ? "bg-white dark:bg-slate-900" : "bg-slate-50/50 dark:bg-slate-800/20"
                  }`}
                >
                  <div className="px-3 min-w-0">
                    <p className="font-medium text-slate-800 dark:text-slate-200 truncate">{row.label}</p>
                    <p className="text-[10px] text-slate-400 truncate">{row.keyword}</p>
                  </div>
                  <div className="px-3">
                    <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 truncate block">{row.knr_ref}</span>
                  </div>
                  <div className="px-3">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate block">{row.category}</span>
                  </div>
                  <div className="px-3 text-right">
                    <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                      {row.labor_norm_rbh.toFixed(4)}
                    </span>
                  </div>
                  <div className="px-3 text-center">
                    <span className="text-[10px] text-slate-500">{row.unit}</span>
                  </div>
                  <div className="px-3 text-center">
                    <Badge className={`text-[9px] py-0 px-1.5 ${TYPE_COLORS[row.type] ?? "bg-slate-100 text-slate-600"}`}>
                      {row.type}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
        <span className="text-[10px] text-slate-400">
          Virtualizacja · wyświetla tylko widoczne wiersze · 0ms lag dla {rows.length.toLocaleString("pl")} rekordów
        </span>
        <span className="text-[10px] text-slate-400">
          @tanstack/react-virtual v3
        </span>
      </div>
    </div>
  );
}
