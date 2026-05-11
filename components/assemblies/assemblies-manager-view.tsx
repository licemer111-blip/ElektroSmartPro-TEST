"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { LayoutGrid, List, Plus, Search, Filter } from "lucide-react";
import { AIAssemblyGeneratorDialog } from "./ai-assembly-generator-dialog";
import { AssemblyCategorySidebar } from "./assembly-category-sidebar";
import { AssemblyListView } from "./assembly-list-view";
import { AssembliesWithTabs } from "./assemblies-with-tabs";
import { AssemblyModal } from "./assembly-modal";
import { AssemblyModalManager } from "./assembly-modal-manager";
import { AssemblyFilters, detectBuildingType, detectCategory } from "./assembly-filters";
import { shareAssemblyCategoryWithTeam } from "@/app/dashboard/assemblies/actions";
import type { UserAssemblyWithItems, Team } from "@/lib/types/database";
import { normalizePolish, searchComparator } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AssemblyCategory {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
}

interface AssembliesManagerViewProps {
  assemblies: UserAssemblyWithItems[];
  categories: AssemblyCategory[];
  isPro: boolean;
  currentCount: number;
  selectedCategoryId: string | null;
  userTeam?: Team | null;
}

export function AssembliesManagerView({
  assemblies,
  categories,
  isPro,
  currentCount,
  selectedCategoryId: initialCategoryId,
  userTeam,
}: AssembliesManagerViewProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeBuildingType, setActiveBuildingType] = useState("all");
  const [activeCategory, setActiveCategory] = useState("all");
  const [pendingShareCategory, setPendingShareCategory] = useState<{id: string; name: string} | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Handle share category with team
  const handleShareCategory = (categoryId: string, categoryName: string) => {
    if (!userTeam) return;
    setPendingShareCategory({ id: categoryId, name: categoryName });
  };

  const executeShareCategory = async () => {
    if (!userTeam || !pendingShareCategory) return;
    const { id: categoryId } = pendingShareCategory;
    setPendingShareCategory(null);
    const result = await shareAssemblyCategoryWithTeam(categoryId, userTeam.id);
    
    if (result.error) {
      toast({
        title: "Błąd",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sukces",
        description: `Udostępniono ${result.sharedCount} zestawów zespołowi!`,
      });
      router.refresh();
    }
  };

  const selectedCategoryId = searchParams.get("category") || initialCategoryId;

  // Handle category selection
  const handleSelectCategory = (categoryId: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (categoryId) {
      params.set("category", categoryId);
    } else {
      params.delete("category");
    }
    router.push(`/dashboard/assemblies?${params.toString()}`, { scroll: false });
  };

  // Filter assemblies by sidebar category
  let filteredAssemblies = assemblies;

  if (selectedCategoryId === "uncategorized") {
    filteredAssemblies = assemblies.filter((a) => !a.category_id);
  } else if (selectedCategoryId) {
    filteredAssemblies = assemblies.filter((a) => a.category_id === selectedCategoryId);
  }

  // Filter by building type (use DB field, fallback to keyword detection)
  if (activeBuildingType !== "all") {
    filteredAssemblies = filteredAssemblies.filter(
      (a) => (a.building_type || detectBuildingType(a.name)) === activeBuildingType
    );
  }

  // Filter by category
  if (activeCategory !== "all") {
    filteredAssemblies = filteredAssemblies.filter(
      (a) => detectCategory(a.name) === activeCategory
    );
  }

  // Filter by search query
  if (searchQuery.trim()) {
    const normalizedQuery = normalizePolish(searchQuery);
    filteredAssemblies = filteredAssemblies
      .filter((assembly) =>
        normalizePolish(assembly.name).includes(normalizedQuery) ||
        (assembly.description && normalizePolish(assembly.description).includes(normalizedQuery))
      )
      .sort((a, b) => 
        searchComparator(normalizedQuery, normalizePolish(a.name), normalizePolish(b.name))
      );
  }

  // Calculate items per category
  const itemsPerCategory = assemblies.reduce((acc, item) => {
    const catId = item.category_id || "uncategorized";
    acc[catId] = (acc[catId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <>
      <div className="flex gap-4 h-auto md:h-[calc(100vh-12rem)]">
        {/* Category Sidebar - Hidden on mobile */}
        <div className="hidden md:block">
          <AssemblyCategorySidebar
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={handleSelectCategory}
            totalItems={assemblies.length}
            itemsPerCategory={itemsPerCategory}
            userTeam={userTeam}
            onShareCategory={handleShareCategory}
            onAddAssembly={() => setIsCreateModalOpen(true)}
          />
        </div>

      {/* Main Content */}
      <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col overflow-hidden">
        {/* Toolbar Header */}
        <div className="p-3 md:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Dodaj Zestaw
              </Button>
              <AIAssemblyGeneratorDialog
                isPro={isPro}
                userTeam={userTeam}
              />
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 hidden md:block">
              {assemblies.length} zestawów
            </span>
          </div>
        </div>

        {/* Kategorie + View Toggle + Search + Filters */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 md:px-4 py-3 shrink-0 space-y-2">
          <div className="flex items-center gap-2">
            {/* Mobile: Kategorie */}
            <div className="md:hidden flex-shrink-0">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 px-2.5">
                    <Filter className="w-3.5 h-3.5 mr-1" />
                    <span className="text-xs">Kategorie</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] p-0">
                  <SheetHeader className="p-4 border-b">
                    <SheetTitle>Kategorie Zestawów</SheetTitle>
                    <SheetDescription className="sr-only">
                      Wybierz kategorię, aby filtrować zestawy
                    </SheetDescription>
                  </SheetHeader>
                  <div className="overflow-y-auto h-[calc(100vh-80px)]">
                    <AssemblyCategorySidebar
                      categories={categories}
                      selectedCategoryId={selectedCategoryId}
                      onSelectCategory={handleSelectCategory}
                      totalItems={assemblies.length}
                      itemsPerCategory={itemsPerCategory}
                      userTeam={userTeam}
                      onShareCategory={handleShareCategory}
                      onAddAssembly={() => setIsCreateModalOpen(true)}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* View Toggle */}
            <div className="flex items-center border border-border rounded-lg overflow-hidden flex-shrink-0">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setViewMode("grid")}
                title="Widok kafelków"
                className={`rounded-none h-8 w-8 p-0 ${viewMode === "grid" 
                  ? "bg-muted text-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <div className="w-px h-5 bg-border" />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setViewMode("list")}
                title="Widok listy"
                className={`rounded-none h-8 w-8 p-0 ${viewMode === "list" 
                  ? "bg-muted text-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>

            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="assembly-search"
                name="assembly-search"
                type="text"
                aria-label="Szukaj zestawów"
                placeholder="Szukaj zestawów..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filters — compact single row */}
          <AssemblyFilters
            assemblies={assemblies}
            activeBuildingType={activeBuildingType}
            activeCategory={activeCategory}
            onBuildingTypeChange={setActiveBuildingType}
            onCategoryChange={setActiveCategory}
          />
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-3 md:p-4">
            {viewMode === "list" ? (
              <AssemblyListView
                assemblies={filteredAssemblies}
                categories={categories}
                isPro={isPro}
                currentCount={currentCount}
                userTeam={userTeam}
              />
            ) : (
              <AssembliesWithTabs
                assemblies={filteredAssemblies}
                isPro={isPro}
                currentCount={currentCount}
                categories={categories}
                userTeam={userTeam}
              />
            )}
          </div>

        {/* Info Footer */}
        <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 px-4 py-3">
          <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
            <div>
              Wyświetlono <span className="font-semibold text-slate-900 dark:text-slate-100">{filteredAssemblies.length}</span> z <span className="font-semibold text-slate-900 dark:text-slate-100">{assemblies.length}</span> zestawów
            </div>
            <div className="text-xs">
              {selectedCategoryId ? (
                selectedCategoryId === "uncategorized" ? "Bez kategorii" : 
                categories.find(c => c.id === selectedCategoryId)?.name || "Wszystkie"
              ) : "Wszystkie kategorie"}
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Create Modal */}
      <AssemblyModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        mode="create"
        categories={categories.map(cat => ({ id: cat.id, name: cat.name }))}
        isPro={isPro}
        userTeam={userTeam}
      />
      <AlertDialog open={!!pendingShareCategory} onOpenChange={(open) => !open && setPendingShareCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Udostępnij kategorię</AlertDialogTitle>
            <AlertDialogDescription>
              Czy na pewno chcesz udostępnić wszystkie zestawy z kategorii <strong>"{pendingShareCategory?.name}"</strong> zespołowi <strong>{userTeam?.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={executeShareCategory} className="bg-blue-600 hover:bg-blue-700 text-white">Udostępnij</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
