"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Team } from "@/lib/types/database";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ItemDialog } from "./item-dialog";
import { DeleteItemDialog } from "./delete-item-dialog";
import { CategorySidebar } from "@/components/catalog/category-sidebar";
import { moveItemToCategory, hideGlobalCatalogItem, toggleFavoriteCatalogItem, shareCategoryWithTeam, bulkDeleteCatalogItems } from "./actions";
import type { CatalogItem, CatalogItemsResult } from "./actions";
import { tableStyles } from "@/lib/styles/table-styles";
import { cn } from "@/lib/utils";
import { EmptyCatalogState } from "@/components/catalog/empty-catalog-state";
import { AICatalogImportDialog } from "@/components/catalog/ai-catalog-import-dialog";
import { CatalogToolbar } from "./_parts/CatalogToolbar";
import { CatalogRow } from "./_parts/CatalogRow";
import { CatalogPagination } from "./_parts/CatalogPagination";
import { CatalogMoveDialog } from "./_parts/CatalogMoveDialog";
import { KnrImportDialog } from "./_parts/KnrImportDialog";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Trash2, X, Loader2, CheckSquare, Square, BookPlus, Lock } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CatalogTableProps {
  initialData: CatalogItemsResult;
  categories: { id: string; name: string; user_id?: string | null }[];
  initialSearch: string;
  initialCategory: string;
  initialType: string;
  isPro: boolean;
  itemCounts: Record<string, number>;
  totalCatalogCount: number;
  favoriteIds: string[];
  showFavorites: boolean;
  userTeam?: Team | null;
  currentView?: "core" | "own" | "all";
}

export function CatalogTable({
  initialData,
  categories,
  initialSearch,
  initialCategory,
  initialType,
  isPro,
  itemCounts,
  totalCatalogCount,
  favoriteIds,
  showFavorites,
  userTeam,
  currentView = "core",
}: CatalogTableProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [category, setCategory] = useState(initialCategory);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [itemToMove, setItemToMove] = useState<CatalogItem | null>(null);
  const [targetCategoryId, setTargetCategoryId] = useState<string>("");
  const [hidingItemId, setHidingItemId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set(favoriteIds));
  const [togglingFavorite, setTogglingFavorite] = useState<string | null>(null);
  const [isAIImportOpen, setIsAIImportOpen] = useState(false);
  const [knrImportItem, setKnrImportItem] = useState<CatalogItem | null>(null);
  const [isKnrDialogOpen, setIsKnrDialogOpen] = useState(false);
  const [showShareConfirm, setShowShareConfirm] = useState(false);
  const [pendingShare, setPendingShare] = useState<{ categoryId: string; categoryName: string } | null>(null);
  const [showHideConfirm, setShowHideConfirm] = useState(false);
  const [pendingHide, setPendingHide] = useState<{ itemId: string; itemName: string } | null>(null);

  const isOwnView = currentView === "own";

  const ownItems = initialData.items.filter((i) => i.user_id !== null);
  const allOwnSelected = ownItems.length > 0 && ownItems.every((i) => selectedIds.has(i.id));
  const someSelected = selectedIds.size > 0;

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSelectAll = () => {
    if (allOwnSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(ownItems.map((i) => i.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.size) return;
    setIsBulkDeleting(true);
    try {
      const result = await bulkDeleteCatalogItems(Array.from(selectedIds));
      if (result.error) {
        toast({ title: "Błąd", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Usunięto", description: `Usunięto ${result.count} pozycji z katalogu` });
        setSelectedIds(new Set());
        router.refresh();
      }
    } catch {
      toast({ title: "Błąd", description: "Nie udało się usunąć pozycji", variant: "destructive" });
    } finally {
      setIsBulkDeleting(false);
      setShowBulkDeleteConfirm(false);
    }
  };

  const handleViewChange = (view: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set("view", view);
    params.delete("page");
    params.delete("category");
    router.replace(`/dashboard/catalog?${params.toString()}`, { scroll: false });
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    const params = new URLSearchParams(window.location.search);
    if (value && value !== "all") {
      params.set("category", value);
    } else {
      params.delete("category");
    }
    router.replace(`/dashboard/catalog?${params.toString()}`, { scroll: false });
  };

  const handleTypeChange = (value: string) => {
    const params = new URLSearchParams(window.location.search);
    if (value && value !== "all") {
      params.set("type", value);
    } else {
      params.delete("type");
    }
    params.delete("page");
    router.replace(`/dashboard/catalog?${params.toString()}`, { scroll: false });
  };

  const handleToggleFavoritesFilter = () => {
    const params = new URLSearchParams(window.location.search);
    if (showFavorites) {
      params.delete("favorites");
    } else {
      params.set("favorites", "true");
    }
    params.delete("page");
    router.replace(`/dashboard/catalog?${params.toString()}`, { scroll: false });
  };

  const handleToggleFavorite = async (itemId: string) => {
    setTogglingFavorite(itemId);
    try {
      const result = await toggleFavoriteCatalogItem(itemId);
      setFavorites((prev) => {
        const newSet = new Set(prev);
        if (result.isFavorite) {
          newSet.add(itemId);
        } else {
          newSet.delete(itemId);
        }
        return newSet;
      });
      router.refresh();
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast({ title: "Błąd", description: "Błąd podczas dodawania/usuwania z ulubionych", variant: "destructive" });
    } finally {
      setTogglingFavorite(null);
    }
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set("page", newPage.toString());
    router.replace(`/dashboard/catalog?${params.toString()}`, { scroll: false });
  };

  const handleMoveItem = async () => {
    if (!itemToMove || !targetCategoryId) return;
    try {
      await moveItemToCategory(itemToMove.id, targetCategoryId === "uncategorized" ? null : targetCategoryId);
      setIsMoveDialogOpen(false);
      setItemToMove(null);
      setTargetCategoryId("");
      router.refresh();
    } catch (error) {
      console.error("Error moving item:", error);
    }
  };

  const handleShareCategory = (categoryId: string, categoryName: string) => {
    if (!userTeam) return;
    setPendingShare({ categoryId, categoryName });
    setShowShareConfirm(true);
  };

  const executeShareCategory = async () => {
    if (!pendingShare || !userTeam) return;
    setShowShareConfirm(false);
    try {
      const result = await shareCategoryWithTeam(pendingShare.categoryId, userTeam.id);
      router.refresh();
      if (result.message) {
        toast({ title: "Informacja", description: result.message });
      } else if (result.sharedCount > 0) {
        toast({ title: "Udostępniono", description: `Udostępniono ${result.sharedCount} pozycji zespołowi!` });
      } else {
        toast({ title: "Brak pozycji", description: "Możesz udostępnić tylko własne pozycje (nie z globalnego katalogu).", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error sharing category:", error);
      toast({ title: "Błąd", description: "Błąd podczas udostępniania kategorii", variant: "destructive" });
    } finally {
      setPendingShare(null);
    }
  };

  const handleHideItem = (itemId: string, itemName: string) => {
    setPendingHide({ itemId, itemName });
    setShowHideConfirm(true);
  };

  const executeHideItem = async () => {
    if (!pendingHide) return;
    setShowHideConfirm(false);
    setHidingItemId(pendingHide.itemId);
    try {
      await hideGlobalCatalogItem(pendingHide.itemId);
      router.refresh();
      toast({ title: "Ukryto", description: `Pozycja "${pendingHide.itemName}" została ukryta.` });
    } catch (error) {
      console.error("Error hiding item:", error);
      const errorMessage = error instanceof Error ? error.message : "Błąd podczas ukrywania pozycji";
      toast({ title: "Błąd", description: errorMessage, variant: "destructive" });
    } finally {
      setHidingItemId(null);
      setPendingHide(null);
    }
  };

  return (
    <div className="flex gap-4 h-auto md:h-[calc(100vh-16rem)]">
      {/* Category Sidebar - Hidden on mobile */}
      <div className="hidden md:block">
        <CategorySidebar
          categories={categories}
          selectedCategoryId={category || null}
          onSelectCategory={(catId) => handleCategoryChange(catId || "all")}
          totalItems={totalCatalogCount}
          itemsPerCategory={itemCounts}
          userTeam={userTeam}
          onShareCategory={handleShareCategory}
          currentView={currentView}
          onViewChange={handleViewChange}
          onAddItem={() => { setSelectedItem(null); setIsDialogOpen(true); }}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col overflow-hidden">
        <CatalogToolbar
          categories={categories}
          selectedCategoryId={category || null}
          totalCatalogCount={totalCatalogCount}
          itemCounts={itemCounts}
          userTeam={userTeam}
          isPro={isPro}
          showFavorites={showFavorites}
          currentView={currentView}
          onCategoryChange={handleCategoryChange}
          onViewChange={handleViewChange}
          onAddItem={() => { setSelectedItem(null); setIsDialogOpen(true); }}
          onToggleFavoritesFilter={handleToggleFavoritesFilter}
          onAIImportOpen={() => setIsAIImportOpen(true)}
          onShareCategory={handleShareCategory}
        />

        {/* ── Scrollable content: Catalog + KNR sections ── */}
        <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0 pb-4">

          {/* Section 1 header — only shown when KNR section also present */}
          {initialData.knrNorms && initialData.knrNorms.length > 0 && initialSearch.length > 2 && (
            <div className="px-4 py-2 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Twoje i Globalne Pozycje</span>
              <span className="text-[10px] text-slate-400">(Ceny &amp; PDF)</span>
            </div>
          )}

          {/* Mobile scroll hint */}
          <div className="md:hidden px-2 py-1.5 bg-blue-50 dark:bg-blue-950/30 border-b border-blue-200 dark:border-blue-800">
            <p className="text-[10px] text-blue-700 dark:text-blue-300 text-center">← Przesuń w bok, aby zobaczyć więcej →</p>
          </div>

          {initialData.items.length === 0 && initialData.total === 0 && !initialSearch ? (
            <div className="p-4"><EmptyCatalogState /></div>
          ) : initialData.items.length === 0 && initialData.total === 0 && initialSearch ? (
            <div className="px-4 py-3 text-sm text-slate-400 dark:text-slate-500 italic">
              Brak własnych pozycji dla &quot;{initialSearch}&quot; — sprawdź Bazę KNR poniżej.
            </div>
          ) : (
            <Table className="min-w-[600px] sm:min-w-[800px] table-fixed">
              <TableHeader className="sticky top-0 bg-slate-50 dark:bg-slate-900 z-10">
                <TableRow>
                  <TableHead className="w-[36px] min-w-[36px] p-2 text-center">
                    <button onClick={handleSelectAll} className="p-0.5 rounded" title={allOwnSelected ? "Odznacz wszystkie" : "Zaznacz wszystkie własne"}>
                      {allOwnSelected
                        ? <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        : someSelected
                          ? <CheckSquare className="w-4 h-4 text-blue-400 dark:text-blue-600 opacity-60" />
                          : <Square className="w-4 h-4 text-slate-400 dark:text-slate-500" />}
                    </button>
                  </TableHead>
                  <TableHead className={cn(tableStyles.headerCell, "text-xs sm:text-sm p-2 sm:p-3 w-[28%]")}>Nazwa</TableHead>
                  <TableHead className={cn(tableStyles.headerCell, "text-xs sm:text-sm hidden md:table-cell p-2 sm:p-3 w-[15%]")}>Kategoria</TableHead>
                  <TableHead className={cn(tableStyles.headerCell, "text-xs sm:text-sm hidden lg:table-cell p-2 sm:p-3 w-[8%]")}>Jedn.</TableHead>
                  <TableHead className={cn(tableStyles.headerCell, "text-xs sm:text-sm p-2 sm:p-3 w-[16%]")}>Robocizna</TableHead>
                  <TableHead className={cn(tableStyles.headerCell, "text-xs sm:text-sm p-2 sm:p-3 w-[16%]")}>Materiał</TableHead>
                  <TableHead className={cn(tableStyles.headerCell, "text-right text-xs sm:text-sm p-2 sm:p-3 w-[10%]")}>Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialData.items.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className={tableStyles.empty}>Brak pozycji do wyświetlenia (spróbuj zmienić filtry)</TableCell></TableRow>
                ) : (
                  initialData.items.map((item) => (
                    <CatalogRow
                      key={item.id} item={item} isPro={isPro}
                      isFavorite={favorites.has(item.id)}
                      isTogglingFavorite={togglingFavorite === item.id}
                      isHiding={hidingItemId === item.id}
                      isSelected={selectedIds.has(item.id)}
                      userTeam={userTeam}
                      onEdit={(i) => { setSelectedItem(i); setIsDialogOpen(true); }}
                      onDelete={(i) => { setSelectedItem(i); setIsDeleteDialogOpen(true); }}
                      onMove={(i) => { setItemToMove(i); setTargetCategoryId(i.category_id || "uncategorized"); setIsMoveDialogOpen(true); }}
                      onDuplicate={(i) => { setSelectedItem({ ...i, id: "", name: `${i.name} (kopia)`, user_id: "new" }); setIsDialogOpen(true); }}
                      onToggleFavorite={handleToggleFavorite}
                      onHide={handleHideItem}
                      onToggleSelect={handleToggleSelect}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {/* ── Section 2: Baza Referencyjna KNR 2026 ── */}
          {initialData.knrNorms && initialData.knrNorms.length > 0 && (
            <div className="border-t-2 border-orange-200 dark:border-orange-900/40 mt-1">
              {/* Section header */}
              <div className="px-4 py-2.5 flex items-center justify-between bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-widest">Baza Referencyjna KNR 2026</span>
                  <span className="text-[10px] text-orange-400">(Normy rbh)</span>
                </div>
                <span className="text-[10px] text-orange-400">{initialData.knrNorms.length} norm</span>
              </div>

              <div className="relative overflow-x-auto pb-4">
                <Table className="min-w-[600px]">
                  <TableHeader>
                    <TableRow className="bg-orange-50/60 dark:bg-orange-950/20">
                      <TableHead className="text-xs p-2 sm:p-3 w-[35%] text-orange-700 dark:text-orange-400">Nazwa normy</TableHead>
                      <TableHead className="text-xs p-2 sm:p-3 w-[22%] text-orange-700 dark:text-orange-400">Kod KNR</TableHead>
                      <TableHead className="text-xs p-2 sm:p-3 w-[8%] text-orange-700 dark:text-orange-400">Jedn.</TableHead>
                      <TableHead className="text-xs p-2 sm:p-3 w-[18%] text-orange-700 dark:text-orange-400">Robocizna (MAZ)</TableHead>
                      <TableHead className="text-xs p-2 sm:p-3 w-[17%] text-right text-orange-700 dark:text-orange-400">Dodaj</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(isPro ? initialData.knrNorms : initialData.knrNorms.slice(0, 3)).map((norm) => (
                      <TableRow key={norm.id} className="hover:bg-orange-50/40 dark:hover:bg-orange-950/10">
                        <TableCell className="p-2 sm:p-3 text-sm font-medium text-slate-800 dark:text-slate-200">{norm.name}</TableCell>
                        <TableCell className="p-2 sm:p-3">
                          <span className="text-[10px] font-mono font-semibold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/40 px-1.5 py-0.5 rounded border border-green-200 dark:border-green-800">
                            {norm.knr_ref ?? norm.category_name}
                          </span>
                        </TableCell>
                        <TableCell className="p-2 sm:p-3 text-xs text-slate-500">{norm.unit}</TableCell>
                        <TableCell className="p-2 sm:p-3 text-sm font-medium text-green-700 dark:text-green-400">
                          {norm.base_labor_price > 0 ? `${norm.base_labor_price.toFixed(2)} zł` : "—"}
                        </TableCell>
                        <TableCell className="p-2 sm:p-3 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-[11px] text-orange-700 border-orange-300 hover:bg-orange-50 dark:text-orange-400 dark:border-orange-700 dark:hover:bg-orange-950/40"
                            onClick={() => { setKnrImportItem(norm); setIsKnrDialogOpen(true); }}
                          >
                            <BookPlus className="w-3 h-3 mr-1" />
                            Dodaj
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Hard Demo blur for free users */}
                {!isPro && initialData.knrNorms.length > 3 && (
                  <div className="h-16 bg-gradient-to-t from-white dark:from-slate-900 to-transparent flex items-end justify-center pb-3">
                    <div className="flex items-center gap-1.5 bg-orange-500 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg">
                      <Lock className="w-3 h-3" />
                      <span>{initialData.knrNorms.length - 3} więcej norm — pakiet PRO</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        <CatalogPagination
          page={initialData.page}
          totalPages={initialData.totalPages}
          total={initialData.total}
          onPageChange={handlePageChange}
        />

        {/* Bulk action floating bar */}
        {someSelected && (
          <div className="sticky bottom-3 z-30 flex justify-center pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-2xl border border-slate-700 dark:border-slate-300 animate-in slide-in-from-bottom-4 fade-in duration-300">
              <span className="text-xs sm:text-sm font-semibold tabular-nums whitespace-nowrap shrink-0">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold mr-1">{selectedIds.size}</span>
                <span className="hidden sm:inline">zaznaczono</span>
              </span>
              <div className="w-px h-5 bg-slate-600 dark:bg-slate-400 shrink-0" />
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-2 sm:px-3 text-xs text-red-400 dark:text-red-600 hover:bg-red-950 dark:hover:bg-red-100 gap-1 shrink-0"
                onClick={() => setShowBulkDeleteConfirm(true)}
                disabled={isBulkDeleting}
                title="Usuń zaznaczone"
              >
                {isBulkDeleting
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                  : <Trash2 className="w-3.5 h-3.5 shrink-0" />}
                <span className="hidden sm:inline">Usuń</span>
              </Button>
              <div className="w-px h-5 bg-slate-600 dark:bg-slate-400 shrink-0" />
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-slate-400 dark:text-slate-500 hover:bg-slate-800 dark:hover:bg-slate-200 shrink-0"
                onClick={() => setSelectedIds(new Set())}
                title="Odznacz wszystko"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Bulk delete confirmation dialog */}
        <AlertDialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Usuń zaznaczone pozycje</AlertDialogTitle>
              <AlertDialogDescription>
                Czy na pewno chcesz usunąć <strong>{selectedIds.size}</strong> zaznaczone pozycje z katalogu?
                Ta akcja jest nieodwracalna.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isBulkDeleting}>Anuluj</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isBulkDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Usuń {selectedIds.size} pozycji
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <ItemDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          item={selectedItem}
          categories={categories}
          userTeam={userTeam}
          isPro={isPro}
        />

        <DeleteItemDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          item={selectedItem}
        />

        <AICatalogImportDialog
          open={isAIImportOpen}
          onOpenChange={setIsAIImportOpen}
          onSuccess={() => router.refresh()}
          userTeam={userTeam}
        />

        {isMoveDialogOpen && itemToMove && (
          <CatalogMoveDialog
            item={itemToMove}
            categories={categories}
            targetCategoryId={targetCategoryId}
            onTargetChange={setTargetCategoryId}
            onConfirm={handleMoveItem}
            onClose={() => { setIsMoveDialogOpen(false); setItemToMove(null); }}
          />
        )}

        <KnrImportDialog
          item={knrImportItem}
          open={isKnrDialogOpen}
          onOpenChange={setIsKnrDialogOpen}
        />

        {/* Share category confirmation dialog */}
        <AlertDialog open={showShareConfirm} onOpenChange={setShowShareConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Udostępnij kategorię zespołowi</AlertDialogTitle>
              <AlertDialogDescription>
                Czy na pewno chcesz udostępnić wszystkie pozycje z kategorii{" "}
                <strong>&quot;{pendingShare?.categoryName}&quot;</strong> zespołowi{" "}
                <strong>&quot;{userTeam?.name}&quot;</strong>?
                Pozycje będą widoczne dla wszystkich członków zespołu.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setPendingShare(null)}>Anuluj</AlertDialogCancel>
              <AlertDialogAction onClick={executeShareCategory} className="bg-blue-600 hover:bg-blue-700 text-white">
                Udostępnij
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Hide item confirmation dialog */}
        <AlertDialog open={showHideConfirm} onOpenChange={setShowHideConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Ukryj pozycję</AlertDialogTitle>
              <AlertDialogDescription>
                Czy na pewno chcesz ukryć pozycję{" "}
                <strong>&quot;{pendingHide?.itemName}&quot;</strong>?
                Pozycja zniknie z Twojego katalogu i rynku. Możesz ją przywrócić w Ustawieniach.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setPendingHide(null)}>Anuluj</AlertDialogCancel>
              <AlertDialogAction onClick={executeHideItem} className="bg-orange-600 hover:bg-orange-700 text-white">
                Ukryj
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}