"use client";

// ═══════════════════════════════════════════════════════════════════
// rozdzielnica/_parts/ModuleCategorySection.tsx
// Renders default catalog grouped by category with accordion,
// recommended/forbidden highlighting, and custom catalog sections.
// ═══════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronUp, Plus, FolderPlus, Trash2, Save, X, Check, Search, Sparkles, Cog, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MODULE_CATEGORIES } from "../../panel-configurator-helpers";
import type { DinModule, RailModule, SelectedSlot } from "../../panel-configurator-types";
import { DraggableModuleTile } from "./DraggableModuleTile";

// ── Default catalog section ────────────────────────────────────────

interface DefaultCatalogProps {
  sortedCatalogEntries: [string, DinModule[]][];
  filteredDefaultCatalog: Record<string, DinModule[]>;
  collapsedCats: Set<string>;
  toggleCat: (cat: string) => void;
  forbiddenCategorySet: Set<string>;
  recommendedCategorySet: Set<string>;
  railModules: RailModule[];
  selectedSlot: SelectedSlot | null;
  searchQuery: string;
  moduleSearch: string;
  handleAddModule: (mod: DinModule) => void;
  onHoverModule: (mod: DinModule | null) => void;
  setShowAiPanel: React.Dispatch<React.SetStateAction<boolean>>;
  setAiDescription: React.Dispatch<React.SetStateAction<string>>;
}

export function DefaultCatalogSection({
  sortedCatalogEntries,
  filteredDefaultCatalog,
  collapsedCats,
  toggleCat,
  forbiddenCategorySet,
  recommendedCategorySet,
  railModules,
  selectedSlot,
  searchQuery,
  moduleSearch,
  handleAddModule,
  onHoverModule,
  setShowAiPanel,
  setAiDescription,
}: DefaultCatalogProps) {
  const q = searchQuery;
  const totalFiltered = Object.values(filteredDefaultCatalog).flat();

  if (q && totalFiltered.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 px-4 text-center">
        <Search className="w-8 h-8 text-slate-300 dark:text-slate-600" />
        <div>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Brak modułów dla &bdquo;{moduleSearch}&rdquo;
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            Spróbuj: 40A, 3P, RCD, SPD, B16...
          </p>
        </div>
        <button
          onClick={() => { setShowAiPanel(true); setAiDescription(moduleSearch); }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[11px] font-semibold hover:from-orange-600 hover:to-amber-600 transition-all shadow-sm"
        >
          <Sparkles className="w-3 h-3" />
          Zaprojektuj z AI
        </button>
      </div>
    );
  }

  return (
    <AnimatePresence initial={false}>
      {sortedCatalogEntries.map(([cat, mods]) => {
        const isCollapsed = q ? false : collapsedCats.has(cat);
        const isCatForbidden = forbiddenCategorySet.has(cat);
        const isCatRecommended = recommendedCategorySet.has(cat);

        return (
          <motion.div
            key={cat}
            layout
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="mb-1"
          >
            <button
              onClick={isCatForbidden ? undefined : () => toggleCat(cat)}
              title={isCatForbidden ? "Kategoria niedostępna dla tego miejsca na szynie" : undefined}
              className={`flex items-center gap-2 w-full text-left py-3 px-3 rounded-xl border-2 shadow-sm transition-all ${
                isCatForbidden
                  ? "opacity-30 grayscale cursor-not-allowed bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 select-none"
                  : isCatRecommended
                  ? "bg-gradient-to-r from-blue-50 to-blue-100/80 dark:from-blue-950/50 dark:to-blue-900/30 border-blue-400 dark:border-blue-600 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md shadow-blue-100 dark:shadow-blue-950/30"
                  : "bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800/80 hover:from-blue-50 hover:to-blue-100 dark:hover:from-blue-950/40 dark:hover:to-blue-900/30 hover:border-blue-300 dark:hover:border-blue-700 border-slate-200 dark:border-slate-700 hover:shadow-md"
              }`}
            >
              {isCatRecommended ? (
                <Star className="w-4 h-4 text-blue-500 flex-shrink-0 fill-blue-400" />
              ) : (
                isCollapsed
                  ? <ChevronDown className="w-5 h-5 text-blue-600" />
                  : <ChevronUp className="w-5 h-5 text-blue-600" />
              )}
              <span className={`text-xs font-bold uppercase tracking-wider flex-1 ${
                isCatRecommended ? "text-blue-700 dark:text-blue-300" : "text-slate-800 dark:text-slate-200"
              }`}>
                {MODULE_CATEGORIES[cat] || cat}
              </span>
              {isCatRecommended && (
                <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-blue-500 text-white leading-none flex-shrink-0">
                  Zalecane
                </span>
              )}
              {!isCatForbidden && (() => {
                const placedCount = railModules.filter((rm) =>
                  mods.some((m) => m.id === rm.module.id)
                ).length;
                return placedCount > 0 ? (
                  <Badge className="text-xs h-6 px-2.5 bg-blue-600 text-white dark:bg-blue-700 font-semibold shadow-sm">
                    {placedCount}
                  </Badge>
                ) : null;
              })()}
              <Badge
                variant="secondary"
                className={`text-xs h-6 px-2.5 font-semibold ${
                  isCatRecommended ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" : ""
                }`}
              >
                {mods.length}
              </Badge>
            </button>

            {!isCollapsed && !isCatForbidden && (
              <div className={`space-y-1 mt-2 ml-3 pl-3 border-l-[3px] ${
                isCatRecommended ? "border-blue-400 dark:border-blue-600" : "border-blue-300 dark:border-blue-700"
              }`}>
                {mods.map((mod) => (
                  <DraggableModuleTile
                    key={mod.id}
                    mod={mod}
                    selectedSlot={selectedSlot}
                    railModules={railModules}
                    searchQuery={q}
                    onAdd={handleAddModule}
                    onHover={onHoverModule}
                    variant="default"
                  />
                ))}
              </div>
            )}
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
}

// ── Custom catalog section ─────────────────────────────────────────

interface CustomCatalogForm {
  namePl: string;
  category: string;
  newCategory: string;
  producer: string;
  modules: number;
  defaultRating: number;
  defaultPrice: number;
  defaultLaborPrice: number;
  description: string;
}

interface CustomCatalogProps {
  customModules: DinModule[];
  setCustomModules: React.Dispatch<React.SetStateAction<DinModule[]>>;
  customCats: Record<string, string>;
  setCustomCats: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  collapsedCustomCats: Set<string>;
  setCollapsedCustomCats: React.Dispatch<React.SetStateAction<Set<string>>>;
  showCustomForm: boolean;
  setShowCustomForm: React.Dispatch<React.SetStateAction<boolean>>;
  showNewCatForm: boolean;
  setShowNewCatForm: React.Dispatch<React.SetStateAction<boolean>>;
  newCatName: string;
  setNewCatName: React.Dispatch<React.SetStateAction<string>>;
  customForm: CustomCatalogForm;
  setCustomForm: React.Dispatch<React.SetStateAction<CustomCatalogForm>>;
  filteredCustomModules: DinModule[];
  addModule: (mod: DinModule, rating?: number) => void;
}

export function CustomCatalogSection({
  customModules,
  setCustomModules,
  customCats,
  setCustomCats,
  collapsedCustomCats,
  setCollapsedCustomCats,
  showCustomForm,
  setShowCustomForm,
  showNewCatForm,
  setShowNewCatForm,
  newCatName,
  setNewCatName,
  customForm,
  setCustomForm,
  filteredCustomModules,
  addModule,
}: CustomCatalogProps) {
  const { toast } = useToast();

  const resetForm = () => {
    setCustomForm({ namePl: "", category: "", modules: 1, defaultRating: 0, defaultPrice: 0, defaultLaborPrice: 0, description: "", producer: "", newCategory: "" });
    setShowCustomForm(false);
  };

  const buildCustomModule = (): DinModule => {
    let catKey = customForm.category;
    if (catKey === "__new__" && customForm.newCategory.trim()) {
      catKey = `custom-cat-${customForm.newCategory.trim().toLowerCase().replace(/[^a-ząćęłńóśźż0-9]/gi, "-")}`;
      setCustomCats((prev) => ({ ...prev, [catKey]: customForm.newCategory.trim() }));
    }
    if (catKey === "__uncategorized__") catKey = "custom-uncategorized";
    if (!customCats["custom-uncategorized"] && catKey === "custom-uncategorized") {
      setCustomCats((prev) => ({ ...prev, "custom-uncategorized": "Bez kategorii" }));
    }
    return {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: customForm.namePl.trim(),
      namePl: customForm.namePl.trim(),
      category: catKey as DinModule["category"],
      modules: customForm.modules,
      icon: Cog,
      defaultRating: customForm.defaultRating || undefined,
      defaultPrice: customForm.defaultPrice,
      defaultLaborPrice: customForm.defaultLaborPrice,
      ratingOptions: customForm.defaultRating ? [customForm.defaultRating] : undefined,
      description: customForm.producer
        ? `${customForm.producer} — ${customForm.description || customForm.namePl.trim()}`
        : customForm.description || customForm.namePl.trim(),
    };
  };

  const hasCat = customForm.category && customForm.category !== "__new__" && customForm.category !== "__uncategorized__";
  const hasNewCat = customForm.category === "__new__" && customForm.newCategory.trim();
  const isFormValid = !!(customForm.namePl.trim() && (hasCat || hasNewCat || customForm.category === "__uncategorized__"));

  const grouped = filteredCustomModules.reduce<Record<string, DinModule[]>>((acc, mod) => {
    (acc[mod.category] = acc[mod.category] || []).push(mod);
    return acc;
  }, {});
  const allCats = { ...customCats };
  for (const cat of Object.keys(grouped)) {
    if (!allCats[cat]) allCats[cat] = cat;
  }

  return (
    <div className="space-y-2">
      {/* Action buttons */}
      <div className="flex gap-1.5">
        <Button
          size="sm"
          className="flex-1 gap-1 bg-violet-600 hover:bg-violet-700 text-white h-8 text-xs"
          onClick={() => {
            setShowCustomForm(true);
            setShowNewCatForm(false);
            setCustomForm({ namePl: "", category: "", newCategory: "", producer: "", modules: 1, defaultRating: 0, defaultPrice: 0, defaultLaborPrice: 0, description: "" });
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          Moduł
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 gap-1 h-8 text-xs border-violet-400 dark:border-violet-600 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/30"
          onClick={() => { setShowNewCatForm(true); setShowCustomForm(false); setNewCatName(""); }}
        >
          <FolderPlus className="w-3.5 h-3.5" />
          Kategoria
        </Button>
      </div>

      {/* New category form */}
      {showNewCatForm && (
        <div className="rounded-lg border border-violet-300 dark:border-violet-700 bg-violet-50/50 dark:bg-violet-950/20 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-violet-700 dark:text-violet-300">Nowa kategoria</h4>
            <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => setShowNewCatForm(false)}>
              <X className="w-3 h-3" />
            </Button>
          </div>
          <Input
            id="custom-cat-name"
            name="custom-cat-name"
            aria-label="Nazwa nowej kategorii"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="Nazwa kategorii *"
            className="h-7 text-xs"
            onKeyDown={(e) => {
              if (e.key === "Enter" && newCatName.trim()) {
                const catKey = `custom-cat-${newCatName.trim().toLowerCase().replace(/[^a-ząćęłńóśźż0-9]/gi, "-")}`;
                setCustomCats((prev) => ({ ...prev, [catKey]: newCatName.trim() }));
                toast({ title: "Dodano kategorię", description: newCatName.trim() });
                setNewCatName("");
                setShowNewCatForm(false);
              }
            }}
          />
          <Button
            size="sm"
            className="w-full gap-1 bg-violet-600 hover:bg-violet-700 text-white h-7 text-xs"
            disabled={!newCatName.trim()}
            onClick={() => {
              const catKey = `custom-cat-${newCatName.trim().toLowerCase().replace(/[^a-ząćęłńóśźż0-9]/gi, "-")}`;
              setCustomCats((prev) => ({ ...prev, [catKey]: newCatName.trim() }));
              toast({ title: "Dodano kategorię", description: newCatName.trim() });
              setNewCatName("");
              setShowNewCatForm(false);
            }}
          >
            <Check className="w-3 h-3" />
            Utwórz
          </Button>
        </div>
      )}

      {/* Add custom module form */}
      {showCustomForm && (
        <div className="rounded-lg border border-violet-300 dark:border-violet-700 bg-violet-50/50 dark:bg-violet-950/20 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-violet-700 dark:text-violet-300">Nowy moduł</h4>
            <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => setShowCustomForm(false)}>
              <X className="w-3 h-3" />
            </Button>
          </div>
          <Input id="custom-mod-name" name="custom-mod-name" aria-label="Nazwa urządzenia" value={customForm.namePl} onChange={(e) => setCustomForm((f) => ({ ...f, namePl: e.target.value }))} placeholder="Nazwa urządzenia *" className="h-7 text-xs" />
          <div className="flex gap-1.5">
            <Select name="custom-mod-category" value={customForm.category} onValueChange={(v) => setCustomForm((f) => ({ ...f, category: v }))}>
              <SelectTrigger id="custom-mod-category" aria-label="Kategoria modułu" className="h-7 text-[11px] flex-1">
                <SelectValue placeholder="Wybierz kategorię" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__new__" className="text-xs font-semibold text-violet-600">+ Nowa kategoria...</SelectItem>
                {Object.entries(customCats).length > 0
                  ? Object.entries(customCats).map(([k, v]) => (
                      <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
                    ))
                  : <SelectItem value="__uncategorized__" className="text-xs text-slate-400">Bez kategorii</SelectItem>
                }
              </SelectContent>
            </Select>
          </div>
          {customForm.category === "__new__" && (
            <Input id="custom-mod-new-cat" name="custom-mod-new-cat" aria-label="Nazwa nowej kategorii" value={customForm.newCategory} onChange={(e) => setCustomForm((f) => ({ ...f, newCategory: e.target.value }))} placeholder="Nazwa nowej kategorii" className="h-7 text-xs" />
          )}
          <Input id="custom-mod-producer" name="custom-mod-producer" aria-label="Producent" value={customForm.producer} onChange={(e) => setCustomForm((f) => ({ ...f, producer: e.target.value }))} placeholder="Producent (np. Hager, ABB...)" className="h-7 text-xs" />
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label htmlFor="custom-mod-rating" className="text-[9px] text-slate-500 block mb-0.5">Prąd [A]</label>
              <Input id="custom-mod-rating" name="custom-mod-rating" type="number" min={0} value={customForm.defaultRating || ""} onChange={(e) => setCustomForm((f) => ({ ...f, defaultRating: parseInt(e.target.value) || 0 }))} className="h-7 text-xs" placeholder="0" />
            </div>
            <div>
              <label htmlFor="custom-mod-din" className="text-[9px] text-slate-500 block mb-0.5">Moduły DIN</label>
              <Input id="custom-mod-din" name="custom-mod-din" type="number" min={0} max={18} value={customForm.modules} onChange={(e) => setCustomForm((f) => ({ ...f, modules: parseInt(e.target.value) || 0 }))} className="h-7 text-xs" />
            </div>
            <div>
              <label htmlFor="custom-mod-price" className="text-[9px] text-slate-500 block mb-0.5">Cena materiał [zł]</label>
              <Input id="custom-mod-price" name="custom-mod-price" type="number" min={0} step={0.01} value={customForm.defaultPrice || ""} onChange={(e) => setCustomForm((f) => ({ ...f, defaultPrice: parseFloat(e.target.value) || 0 }))} className="h-7 text-xs" placeholder="0" />
            </div>
            <div>
              <label htmlFor="custom-mod-labor" className="text-[9px] text-slate-500 block mb-0.5">Cena robocizna [zł]</label>
              <Input id="custom-mod-labor" name="custom-mod-labor" type="number" min={0} step={0.01} value={customForm.defaultLaborPrice || ""} onChange={(e) => setCustomForm((f) => ({ ...f, defaultLaborPrice: parseFloat(e.target.value) || 0 }))} className="h-7 text-xs" placeholder="0" />
            </div>
          </div>
          <Input id="custom-mod-desc" name="custom-mod-desc" aria-label="Opis urządzenia" value={customForm.description} onChange={(e) => setCustomForm((f) => ({ ...f, description: e.target.value }))} placeholder="Opis (opcjonalnie)" className="h-7 text-xs" />
          <div className="flex flex-col gap-1.5 w-full">
            <Button
              size="sm"
              className="w-full gap-1 bg-violet-600 hover:bg-violet-700 text-white h-8 text-xs"
              disabled={!isFormValid}
              onClick={() => {
                const newMod = buildCustomModule();
                addModule(newMod, newMod.defaultRating);
                setCustomModules((prev) => [...prev, newMod]);
                resetForm();
                toast({ title: "Dodano na szynę + zapisano", description: newMod.namePl });
              }}
            >
              <Plus className="w-3 h-3" />
              Dodaj do rozdzielnicy
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="w-full gap-1 h-8 text-xs border-violet-400 dark:border-violet-600 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/30"
              disabled={!isFormValid}
              onClick={() => {
                const newMod = buildCustomModule();
                setCustomModules((prev) => [...prev, newMod]);
                resetForm();
                toast({ title: "Zapisano w katalogu", description: newMod.namePl });
              }}
            >
              <Save className="w-3 h-3" />
              Tylko zapisz w katalogu
            </Button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {customModules.length === 0 && Object.keys(customCats).length === 0 && !showCustomForm && !showNewCatForm && (
        <div className="flex flex-col items-center py-8 px-4 text-center rounded-xl bg-gradient-to-br from-violet-50 to-slate-50 dark:from-violet-950/20 dark:to-slate-900 border-2 border-dashed border-violet-200 dark:border-violet-800">
          <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center mb-3">
            <Cog className="w-6 h-6 text-violet-500" />
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Twój własny katalog</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            Utwórz kategorie i dodaj własne urządzenia z cenami i normami KNR
          </p>
        </div>
      )}

      {/* Custom categories with modules */}
      {Object.entries(allCats).map(([cat, catLabel]) => {
        const mods = grouped[cat] || [];
        const isCollapsed = collapsedCustomCats.has(cat);
        return (
          <div key={cat} className="mb-1">
            <button
              onClick={() =>
                setCollapsedCustomCats((prev) => {
                  const next = new Set(prev);
                  next.has(cat) ? next.delete(cat) : next.add(cat);
                  return next;
                })
              }
              className="flex items-center gap-2 w-full text-left py-2.5 px-3 rounded-xl bg-gradient-to-r from-violet-50 to-violet-100 dark:from-violet-950/30 dark:to-violet-900/20 hover:from-violet-100 hover:to-violet-200 dark:hover:from-violet-950/50 dark:hover:to-violet-900/40 transition-all border-2 border-violet-200 dark:border-violet-800 hover:border-violet-400 dark:hover:border-violet-600 shadow-sm hover:shadow-md"
            >
              {isCollapsed ? (
                <ChevronDown className="w-4 h-4 text-violet-600" />
              ) : (
                <ChevronUp className="w-4 h-4 text-violet-600" />
              )}
              <span className="text-xs font-bold text-violet-800 dark:text-violet-200 uppercase tracking-wider flex-1">
                {catLabel}
              </span>
              {mods.length > 0 && (
                <Badge className="text-[10px] h-5 px-2 bg-violet-600 text-white font-semibold">{mods.length}</Badge>
              )}
              {mods.length === 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCustomCats((prev) => { const next = { ...prev }; delete next[cat]; return next; });
                    toast({ title: "Usunięto kategorię", description: catLabel });
                  }}
                  className="p-0.5 rounded text-slate-400 hover:text-red-500 transition-colors"
                  title="Usuń pustą kategorię"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </button>
            {!isCollapsed && mods.length > 0 && (
              <div className="space-y-1 mt-2 ml-3 pl-3 border-l-[3px] border-violet-300 dark:border-violet-700">
                {mods.map((mod) => (
                  <DraggableModuleTile
                    key={mod.id}
                    mod={mod}
                    selectedSlot={null}
                    railModules={[]}
                    onAdd={addModule}
                    onDelete={(id) => setCustomModules((prev) => prev.filter((m) => m.id !== id))}
                    variant="custom"
                  />
                ))}
              </div>
            )}
            {!isCollapsed && mods.length === 0 && (
              <div className="ml-3 pl-3 border-l-[3px] border-violet-200 dark:border-violet-800 mt-1">
                <p className="text-[10px] text-slate-400 py-2 px-2 italic">Pusta kategoria — dodaj moduły</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
