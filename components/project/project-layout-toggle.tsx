"use client";

import { useState, useEffect, useCallback } from "react";
import { Package } from "lucide-react";
import { useCatalogCollapse } from "@/hooks/use-catalog-collapse";

interface ProjectLayoutToggleProps {
  catalogSidebar: React.ReactNode;
  children: React.ReactNode;
}

const SUMMARY_STORAGE_KEY = "elektrosmart_summary_collapsed";

export function ProjectLayoutToggle({
  catalogSidebar,
  children,
}: ProjectLayoutToggleProps) {
  const [summaryCollapsed, setSummaryCollapsed] = useState(false);
  const { catalogCollapsed, toggleCatalog } = useCatalogCollapse();

  const syncFromStorage = useCallback(() => {
    setSummaryCollapsed(localStorage.getItem(SUMMARY_STORAGE_KEY) === "true");
  }, []);

  useEffect(() => {
    syncFromStorage();
    const onStorage = (e: StorageEvent) => {
      if (e.key === SUMMARY_STORAGE_KEY) syncFromStorage();
    };
    const onCustom = () => syncFromStorage();
    window.addEventListener("storage", onStorage);
    window.addEventListener("summary-toggled", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("summary-toggled", onCustom);
    };
  }, [syncFromStorage]);

  const outerGridCols = catalogCollapsed
    ? ""
    : summaryCollapsed
      ? "lg:grid-cols-[420px_1fr]"
      : "lg:grid-cols-[260px_1fr]";

  return (
    <div className="flex flex-col">
      {/* Catalog collapsed — fixed left-edge restore button (mirrors summary right-edge button) */}
      {catalogCollapsed && (
        <button
          onClick={toggleCatalog}
          className="hidden lg:flex fixed left-0 top-1/3 z-30 items-center gap-1.5 px-2.5 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-r-xl shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:shadow-[0_0_25px_rgba(59,130,246,0.7)] transition-all animate-pulse"
          title="Pokaż katalog pozycji"
          style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
        >
          <Package className="w-4 h-4" />
          <span className="text-xs font-bold tracking-wide">Katalog pozycji</span>
        </button>
      )}

      {/* Grid Layout - 2 columns: catalog (sticky) | content */}
      <div className={`grid grid-cols-1 gap-4 p-4 ${outerGridCols}`}>
        {/* Left Panel - Catalog Sidebar (sticky, has its own internal scroll) */}
        {!catalogCollapsed && (
          <div className="hidden lg:block sticky top-4 h-[calc(100vh-2rem)] overflow-hidden">
            {catalogSidebar}
          </div>
        )}

        {/* Right Panel - no internal scroll, uses page scroll */}
        <div className="min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
