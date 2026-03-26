"use client";

// ═══════════════════════════════════════════════════════════════════
// ModuleLibrary.tsx — Shell orchestrator (~150 lines)
// All UI logic split into:
//   _parts/ModuleSearch.tsx          — search + mode toggle + AI buttons
//   _parts/ModuleCategorySection.tsx — default + custom catalog sections
//   _parts/DraggableModuleTile.tsx   — individual module tile
// ═══════════════════════════════════════════════════════════════════

import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { MODULE_CATEGORIES } from "../panel-configurator-helpers";
import { DIN_MODULES } from "@/lib/data/din-modules-catalog";
import type { DinModule, RailModule, SelectedSlot } from "../panel-configurator-types";
import { validatePlacement, isCategoryFullyForbidden, getRecommendedCategories } from "@/lib/panel-placement-rules";
import { ModuleSearch } from "./_parts/ModuleSearch";
import { DefaultCatalogSection, CustomCatalogSection } from "./_parts/ModuleCategorySection";

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export interface ModuleLibraryProps {
  moduleSearch: string; setModuleSearch: (v: string) => void;
  collapsedCats: Set<string>; toggleCat: (cat: string) => void;
  catalogMode: "default" | "custom"; setCatalogMode: (mode: "default" | "custom") => void;
  railModules: RailModule[];
  customModules: DinModule[]; setCustomModules: React.Dispatch<React.SetStateAction<DinModule[]>>;
  customCats: Record<string, string>; setCustomCats: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  collapsedCustomCats: Set<string>; setCollapsedCustomCats: React.Dispatch<React.SetStateAction<Set<string>>>;
  showCustomForm: boolean; setShowCustomForm: React.Dispatch<React.SetStateAction<boolean>>;
  showNewCatForm: boolean; setShowNewCatForm: React.Dispatch<React.SetStateAction<boolean>>;
  newCatName: string; setNewCatName: React.Dispatch<React.SetStateAction<string>>;
  customForm: { namePl: string; category: string; newCategory: string; producer: string; modules: number; defaultRating: number; defaultPrice: number; defaultLaborPrice: number; description: string; };
  setCustomForm: React.Dispatch<React.SetStateAction<ModuleLibraryProps["customForm"]>>;
  isFinal: boolean; addModule: (mod: DinModule, rating?: number, insertAtIndex?: number) => void;
  setShowAiPanel: React.Dispatch<React.SetStateAction<boolean>>; setAiDescription: React.Dispatch<React.SetStateAction<string>>;
  handleAIPricing: () => void; isWycenLoading: boolean; allModulesCount: number;
  selectedSlot: SelectedSlot | null;
  onHoverModule: (mod: DinModule | null) => void;
}

function ModuleLibraryInner({
  moduleSearch, setModuleSearch, collapsedCats, toggleCat,
  catalogMode, setCatalogMode, railModules,
  customModules, setCustomModules, customCats, setCustomCats,
  collapsedCustomCats, setCollapsedCustomCats,
  showCustomForm, setShowCustomForm, showNewCatForm, setShowNewCatForm,
  newCatName, setNewCatName, customForm, setCustomForm,
  isFinal, addModule, setShowAiPanel, setAiDescription,
  handleAIPricing, isWycenLoading, allModulesCount,
  selectedSlot, onHoverModule,
}: ModuleLibraryProps) {
  const { toast } = useToast();

  // ── Placement guard with toast ─────────────────────────────────
  const handleAddModule = useCallback((mod: DinModule) => {
    const violation = validatePlacement(mod, selectedSlot, railModules);
    if (!violation) { addModule(mod); return; }
    if (violation.severity === "block") {
      toast({
        title: violation.title,
        description: (
          <div className="space-y-1.5">
            <p className="text-sm">{violation.reason}</p>
            <p className="text-xs text-slate-400">{violation.hint}</p>
            <button onClick={() => addModule(mod)} className="mt-1 text-xs underline text-amber-600 hover:text-amber-700 font-semibold">
              Mimo to dodaj
            </button>
          </div>
        ) as unknown as string,
        variant: "destructive",
        duration: 6000,
      });
    } else {
      toast({
        title: violation.title,
        description: (<div className="space-y-1"><p className="text-sm">{violation.reason}</p><p className="text-xs text-slate-400">{violation.hint}</p></div>) as unknown as string,
        duration: 4000,
      });
      addModule(mod);
    }
  }, [addModule, selectedSlot, railModules, toast]);

  // ── Memoised filtering & grouping ─────────────────────────────
  const debouncedSearch = useDebounce(moduleSearch, 150);
  const q = debouncedSearch.toLowerCase().trim();

  const filteredDefaultCatalog = useMemo(() => {
    const filtered = q
      ? DIN_MODULES.filter((m) => {
          if (m.namePl.toLowerCase().includes(q)) return true;
          if (m.description.toLowerCase().includes(q)) return true;
          const catLabel = (MODULE_CATEGORIES[m.category] || m.category).toLowerCase();
          if (catLabel.includes(q)) return true;
          if (m.defaultRating) {
            if (`${m.defaultRating}a`.includes(q) || `${m.defaultRating}`.includes(q)) return true;
          }
          if (m.ratingOptions?.some((r) => `${r}a`.includes(q) || `${r}`.includes(q))) return true;
          const phases = m.modules >= 3 ? ["3p","3-fazy","3f","trójfaz"] : ["1p","1-faz","jednofaz"];
          if (phases.some((p) => p.includes(q) || q.includes(p))) return true;
          return false;
        })
      : DIN_MODULES;
    return filtered.reduce<Record<string, DinModule[]>>((acc, mod) => {
      (acc[mod.category] = acc[mod.category] || []).push(mod);
      return acc;
    }, {});
  }, [q]);

  const { forbiddenCategorySet, recommendedCategorySet } = useMemo(() => {
    const forbidden = new Set<string>();
    const recommended = getRecommendedCategories(selectedSlot, railModules) as Set<string>;
    if (selectedSlot) {
      for (const [cat, mods] of Object.entries(filteredDefaultCatalog)) {
        if (isCategoryFullyForbidden(mods, selectedSlot, railModules)) forbidden.add(cat);
      }
    }
    return { forbiddenCategorySet: forbidden, recommendedCategorySet: recommended };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSlot?.rowIdx, selectedSlot?.slotIdx, railModules.length]);

  const sortedCatalogEntries = useMemo(() => {
    const entries = Object.entries(filteredDefaultCatalog);
    const priority = (cat: string) => recommendedCategorySet.has(cat) ? 0 : forbiddenCategorySet.has(cat) ? 2 : 1;
    return [...entries].sort((a, b) => priority(a[0]) - priority(b[0]));
  }, [filteredDefaultCatalog, forbiddenCategorySet, recommendedCategorySet]);

  const filteredCustomModules = useMemo(() => {
    const qLow = debouncedSearch.toLowerCase();
    return qLow
      ? customModules.filter((m) => m.namePl.toLowerCase().includes(qLow) || m.description.toLowerCase().includes(qLow))
      : customModules;
  }, [debouncedSearch, customModules]);

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className={`lg:col-span-3 flex flex-col gap-2 p-1 h-full overflow-hidden ${isFinal ? "opacity-50 pointer-events-none" : ""}`}>
      {isFinal && (
        <div className="text-center py-1.5 px-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-[10px] text-amber-700 dark:text-amber-400 font-medium">
          🔒 Projekt zablokowany — edycja niedostępna
        </div>
      )}

      <ModuleSearch
        moduleSearch={moduleSearch}
        setModuleSearch={setModuleSearch}
        catalogMode={catalogMode}
        setCatalogMode={setCatalogMode}
        selectedSlot={selectedSlot}
        isFinal={isFinal}
        setShowAiPanel={setShowAiPanel}
        setAiDescription={setAiDescription}
        handleAIPricing={handleAIPricing}
        isWycenLoading={isWycenLoading}
        allModulesCount={allModulesCount}
      />

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-0.5 pb-2 min-h-0">
        <div className="space-y-1">
          {catalogMode === "default" && (
            <DefaultCatalogSection
              sortedCatalogEntries={sortedCatalogEntries}
              filteredDefaultCatalog={filteredDefaultCatalog}
              collapsedCats={collapsedCats}
              toggleCat={toggleCat}
              forbiddenCategorySet={forbiddenCategorySet}
              recommendedCategorySet={recommendedCategorySet}
              railModules={railModules}
              selectedSlot={selectedSlot}
              searchQuery={q}
              moduleSearch={moduleSearch}
              handleAddModule={handleAddModule}
              onHoverModule={onHoverModule}
              setShowAiPanel={setShowAiPanel}
              setAiDescription={setAiDescription}
            />
          )}

          {catalogMode === "custom" && (
            <CustomCatalogSection
              customModules={customModules}
              setCustomModules={setCustomModules}
              customCats={customCats}
              setCustomCats={setCustomCats}
              collapsedCustomCats={collapsedCustomCats}
              setCollapsedCustomCats={setCollapsedCustomCats}
              showCustomForm={showCustomForm}
              setShowCustomForm={setShowCustomForm}
              showNewCatForm={showNewCatForm}
              setShowNewCatForm={setShowNewCatForm}
              newCatName={newCatName}
              setNewCatName={setNewCatName}
              customForm={customForm}
              setCustomForm={setCustomForm}
              filteredCustomModules={filteredCustomModules}
              addModule={addModule}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export const ModuleLibrary = React.memo(ModuleLibraryInner);
