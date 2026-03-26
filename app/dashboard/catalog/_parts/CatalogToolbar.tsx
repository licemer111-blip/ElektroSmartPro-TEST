"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Filter, Star, Wrench, Loader2 } from "lucide-react";
import { CategorySidebar } from "@/components/catalog/category-sidebar";
import { CatalogSearch } from "@/components/catalog/catalog-search";
import { AICatalogCreatorDialog } from "@/components/catalog/ai-catalog-creator-dialog";
import { fixZeroLaborItems } from "../catalog-item-actions";
import type { Team } from "@/lib/types/database";
import { cn } from "@/lib/utils";

interface CatalogToolbarProps {
  categories: { id: string; name: string; user_id?: string | null }[];
  selectedCategoryId: string | null;
  totalCatalogCount: number;
  itemCounts: Record<string, number>;
  userTeam?: Team | null;
  isPro: boolean;
  showFavorites: boolean;
  currentView?: "core" | "own" | "all";
  onCategoryChange: (catId: string) => void;
  onViewChange: (view: string) => void;
  onAddItem: () => void;
  onToggleFavoritesFilter: () => void;
  onAIImportOpen: () => void;
  onShareCategory: (categoryId: string, categoryName: string) => void;
}

export function CatalogToolbar({
  categories,
  selectedCategoryId,
  totalCatalogCount,
  itemCounts,
  userTeam,
  isPro,
  showFavorites,
  currentView = "core",
  onCategoryChange,
  onViewChange,
  onAddItem,
  onToggleFavoritesFilter,
  onAIImportOpen,
  onShareCategory,
}: CatalogToolbarProps) {
  const [isFixing, setIsFixing] = useState(false);
  const [fixResult, setFixResult] = useState<string | null>(null);

  async function handleFixPrices() {
    setIsFixing(true);
    setFixResult(null);
    const result = await fixZeroLaborItems();
    setIsFixing(false);
    if (result.error) {
      setFixResult(`Błąd: ${result.error}`);
    } else if (result.fixed === 0) {
      setFixResult("Brak pozycji do naprawy ✔");
    } else {
      setFixResult(`Naprawiono ${result.fixed} pozycji ✔`);
    }
    setTimeout(() => setFixResult(null), 4000);
  }

  return (
    <div className="p-2 sm:p-3 md:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
      <div className="flex flex-col gap-2">
        {/* Row 1: Action buttons — unified orange group */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <AICatalogCreatorDialog
              isPro={isPro}
              triggerClassName="inline-flex items-center justify-center h-8 px-3 text-xs font-semibold rounded-lg bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white transition-colors whitespace-nowrap"
            />
            <button
              onClick={onAIImportOpen}
              className="inline-flex items-center justify-center h-8 px-3 text-xs font-semibold rounded-lg bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white transition-colors whitespace-nowrap"
            >
              ES Import
            </button>
            <button
              onClick={handleFixPrices}
              disabled={isFixing}
              title="Napraw pozycje robocizny z brakującą ceną (Robocizna = 0.00)"
              className="inline-flex items-center justify-center gap-1.5 h-8 px-3 text-xs font-semibold rounded-lg bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white transition-colors whitespace-nowrap disabled:opacity-60"
            >
              {isFixing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wrench className="w-3 h-3" />}
              {isFixing ? "Naprawiam..." : "Napraw ceny"}
            </button>
          </div>
          {fixResult && (
            <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
              {fixResult}
            </span>
          )}
        </div>

        {/* Row 2: Filters + Search */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            {/* Mobile: Kategorie sheet */}
            <div className="md:hidden flex-shrink-0">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-1.5" />
                    Kategorie
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] p-0">
                  <SheetHeader className="p-4 border-b">
                    <SheetTitle>Kategorie Pozycji</SheetTitle>
                    <SheetDescription className="sr-only">
                      Wybierz kategorię, aby filtrować pozycje katalogowe
                    </SheetDescription>
                  </SheetHeader>
                  <div className="overflow-y-auto h-[calc(100vh-80px)]">
                    <CategorySidebar
                      categories={categories}
                      selectedCategoryId={selectedCategoryId}
                      onSelectCategory={(catId) => onCategoryChange(catId || "all")}
                      totalItems={totalCatalogCount}
                      itemsPerCategory={itemCounts}
                      userTeam={userTeam}
                      onShareCategory={onShareCategory}
                      currentView={currentView}
                      onViewChange={onViewChange}
                      onAddItem={onAddItem}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Favorites toggle */}
            <Button
              variant={showFavorites ? "default" : "outline"}
              size="sm"
              onClick={onToggleFavoritesFilter}
              className={cn("flex-shrink-0 px-3", showFavorites && "bg-amber-500 hover:bg-amber-600 text-white")}
            >
              <Star className={cn("w-4 h-4", showFavorites && "fill-current")} />
              <span className="hidden sm:inline ml-1.5">Ulubione</span>
            </Button>

            {/* Search — desktop inline */}
            <div className="hidden md:block flex-1">
              <CatalogSearch />
            </div>
          </div>

          {/* Search — mobile full width */}
          <div className="md:hidden w-full">
            <CatalogSearch />
          </div>
        </div>
      </div>
    </div>
  );
}
