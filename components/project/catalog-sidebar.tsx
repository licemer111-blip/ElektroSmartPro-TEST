"use client";

import { useState, useEffect, useRef, useCallback, useId } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Search, Package, LayoutGrid, List, Loader2, PlusCircle, FolderPlus, Users, Lock, Star, ChevronDown, ChevronUp, Clock, TrendingUp, Copy, User, PanelLeftClose } from "lucide-react";
import { BlurredPrice } from "@/components/ui/blurred-price";
import type { Team } from "@/lib/types/database";
import type { CatalogCategory, CatalogItem } from "@/lib/types/database";
import { addCatalogItemToProject, importItemsToProject, addProjectItemDirect } from "@/app/dashboard/projects/[id]/actions";
import { createCatalogItem, updateCatalogItem, toggleFavoriteCatalogItem, getFavoriteCatalogItems } from "@/app/dashboard/catalog/actions";
import { useToast } from "@/hooks/use-toast";
import { notifyDataChanged } from "@/hooks/use-synced-action";
import { useCatalogSearch } from "@/hooks/useCatalogSearch";
import { useSearchMode } from "@/hooks/use-search-mode";
import { SearchModeSelector } from "@/components/catalog/SearchModeSelector";
import { CatalogItem as CatalogItemCard } from "./catalog/CatalogItem";
import { CategoryNav } from "./catalog/CategoryNav";
import { AutocompleteItemInput } from "@/components/catalog/autocomplete-item-input";
import { CategoryDialog } from "@/components/catalog/category-dialog";
import { CopyFromProjectDialog } from "./copy-from-project-dialog";
import { AIProjectImportDialog } from "./ai-project-import-dialog";
import { useTabSyncOptional } from "./tab-sync-context";

interface CatalogSidebarProps {
  projectId: string;
  categories: CatalogCategory[];
  catalogItemsByCategory: { categoryId: string; items: CatalogItem[] }[];
  isPro: boolean;
  userTeam?: Team | null;
  projectStatus?: string;
  onCollapse?: () => void;
}

type RecentItem = { id: string; name: string; unit: string; base_material_price: number; base_labor_price: number; useCount: number; lastUsed: number };

export function CatalogSidebar({ projectId, categories: initialCategories, catalogItemsByCategory, isPro, userTeam, projectStatus = "draft", onCollapse }: CatalogSidebarProps) {
  const searchId = useId();
  const isFinal = projectStatus === "final";
  const { toast } = useToast();
  const router = useRouter();

  const initialCatalogMap = catalogItemsByCategory.reduce((acc, cat) => { acc[cat.categoryId] = cat.items; return acc; }, {} as Record<string, CatalogItem[]>);

  const { mode: searchMode, setMode: setSearchMode } = useSearchMode();
  const { categories, visibleCategories, loadedItems, loadingCategory, searchTerm, setSearchTerm, isSearching, sourceFilter, setSourceFilter, expandedCategory, setExpandedCategory, filterItems, getItemsForCategory } = useCatalogSearch({ initialCategories, initialItemsByCategory: initialCatalogMap, searchMode });

  const [viewMode, setViewMode] = useState<"card" | "list">("list");
  const [addingItemId, setAddingItemId] = useState<string | null>(null);
  const [quickAddTab, setQuickAddTab] = useState<"recent" | "top" | "favorites">("recent");
  const [quickAddExpanded, setQuickAddExpanded] = useState(false);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [favoriteItems, setFavoriteItems] = useState<CatalogItem[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);
  const [togglingFavorite, setTogglingFavorite] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isAddingToProject, setIsAddingToProject] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("szt");
  const [newItemMaterial, setNewItemMaterial] = useState("");
  const [newItemLabor, setNewItemLabor] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("");
  const [newItemVisibility, setNewItemVisibility] = useState<"personal" | "team">("personal");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [editItemName, setEditItemName] = useState("");
  const [editItemUnit, setEditItemUnit] = useState("szt");
  const [editItemMaterial, setEditItemMaterial] = useState("");
  const [editItemLabor, setEditItemLabor] = useState("");
  const [editItemCategory, setEditItemCategory] = useState("");
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isExternalScrollRef = useRef(false);
  const scrollThrottleRef = useRef<NodeJS.Timeout | null>(null);
  const tabSyncContext = useTabSyncOptional();

  // ─── Stable refs for tabSyncContext to avoid loops ─────────────────────
  const tabSyncSetUIStateRef = useRef(tabSyncContext?.setUIState);
  const tabSyncIsExternalSyncRef = useRef(tabSyncContext?.isExternalSync);
  tabSyncSetUIStateRef.current = tabSyncContext?.setUIState;
  tabSyncIsExternalSyncRef.current = tabSyncContext?.isExternalSync;

  useEffect(() => {
    try {
      const stored = localStorage.getItem("elektrosmart_recent_items_v2");
      if (stored) { setRecentItems(JSON.parse(stored)); }
      else {
        const old = localStorage.getItem("elektrosmart_recent_items");
        if (old) {
          const oldItems = JSON.parse(old) as Array<{ id: string; name: string; unit: string; base_material_price: number; base_labor_price: number }>;
          const migrated: RecentItem[] = oldItems.map((item, idx) => ({ ...item, useCount: oldItems.length - idx, lastUsed: Date.now() - idx * 60000 }));
          setRecentItems(migrated);
          localStorage.setItem("elektrosmart_recent_items_v2", JSON.stringify(migrated));
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    getFavoriteCatalogItems().then(items => { setFavoriteItems(items as unknown as CatalogItem[]); setFavoriteIds(new Set(items.map(i => i.id))); setFavoritesLoaded(true); }).catch(() => setFavoritesLoaded(true));
  }, []);

  useEffect(() => {
    if (tabSyncIsExternalSyncRef.current) return;
    tabSyncSetUIStateRef.current?.({
      expandedCategories: expandedCategory ? [expandedCategory] : [],
      catalogSearchTerm: searchTerm,
      catalogViewMode: viewMode,
      catalogCreateDialogOpen: isCreateDialogOpen,
      catalogEditDialogOpen: isEditDialogOpen,
      catalogEditItemId: editItemId,
      openDialog: isCreateDialogOpen ? "create-item" : isCategoryDialogOpen ? "create-category" : isEditDialogOpen ? "edit-item" : null,
    });
  }, [expandedCategory, isCreateDialogOpen, isCategoryDialogOpen, isEditDialogOpen, editItemId, searchTerm, viewMode]);

  useEffect(() => {
    if (!tabSyncContext?.isExternalSync) return;
    const ui = tabSyncContext.uiState;
    if (ui?.expandedCategories !== undefined) { const next = ui.expandedCategories?.length > 0 ? ui.expandedCategories[0] : ""; if (next !== expandedCategory) setExpandedCategory(next); }
    if (ui?.catalogSearchTerm !== undefined && ui.catalogSearchTerm !== searchTerm) setSearchTerm(ui.catalogSearchTerm);
    if (ui?.catalogViewMode && ui.catalogViewMode !== viewMode) setViewMode(ui.catalogViewMode);
    if (ui?.catalogCreateDialogOpen !== undefined && ui.catalogCreateDialogOpen !== isCreateDialogOpen) setIsCreateDialogOpen(ui.catalogCreateDialogOpen);
    if (ui?.catalogEditDialogOpen !== undefined && ui.catalogEditDialogOpen !== isEditDialogOpen) setIsEditDialogOpen(ui.catalogEditDialogOpen);
    if (ui?.openDialog !== undefined) { const shouldCatOpen = ui.openDialog === "create-category"; if (shouldCatOpen !== isCategoryDialogOpen) setIsCategoryDialogOpen(shouldCatOpen); }
    if (ui?.catalogScrollTop !== undefined && scrollContainerRef.current) { if (Math.abs(scrollContainerRef.current.scrollTop - ui.catalogScrollTop) > 10) { isExternalScrollRef.current = true; scrollContainerRef.current.scrollTop = ui.catalogScrollTop; } }
  }, [tabSyncContext?.isExternalSync, tabSyncContext?.uiState?.expandedCategories, tabSyncContext?.uiState?.catalogSearchTerm, tabSyncContext?.uiState?.catalogViewMode, tabSyncContext?.uiState?.catalogEditDialogOpen, tabSyncContext?.uiState?.catalogCreateDialogOpen, tabSyncContext?.uiState?.catalogScrollTop, tabSyncContext?.uiState?.openDialog]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (isExternalScrollRef.current) { isExternalScrollRef.current = false; return; }
    if (tabSyncIsExternalSyncRef.current) return;
    const scrollTop = e.currentTarget.scrollTop;
    if (scrollThrottleRef.current) clearTimeout(scrollThrottleRef.current);
    scrollThrottleRef.current = setTimeout(() => { tabSyncSetUIStateRef.current?.({ catalogScrollTop: scrollTop }); }, 50);
  }, []);

  const trackRecentItem = useCallback((item: { id: string; name: string; unit: string; base_material_price: number; base_labor_price: number }) => {
    setRecentItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      const newItem: RecentItem = { ...item, useCount: (existing?.useCount || 0) + 1, lastUsed: Date.now() };
      const updated = [newItem, ...prev.filter(i => i.id !== item.id)].slice(0, 20);
      try { localStorage.setItem("elektrosmart_recent_items_v2", JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  const handleToggleFavorite = useCallback(async (item: CatalogItem) => {
    setTogglingFavorite(item.id);
    try {
      const result = await toggleFavoriteCatalogItem(item.id);
      if (result.success) {
        if (result.isFavorite) { setFavoriteItems(prev => [item, ...prev]); setFavoriteIds(prev => new Set([...prev, item.id])); toast({ title: "Dodano do ulubionych", description: item.name }); }
        else { setFavoriteItems(prev => prev.filter(i => i.id !== item.id)); setFavoriteIds(prev => { const next = new Set(prev); next.delete(item.id); return next; }); toast({ title: "Usunięto z ulubionych", description: item.name }); }
      }
    } catch { toast({ title: "Błąd", description: "Nie udało się zmienić ulubionych", variant: "destructive" }); }
    setTogglingFavorite(null);
  }, [toast]);

  const handleAddItem = async (catalogItemId: string, itemName: string, itemMeta?: { unit: string; base_material_price: number; base_labor_price: number }) => {
    if (isFinal) { toast({ title: "Projekt zablokowany", description: "Odblokuj projekt, aby dodawać pozycje do kosztorysu", variant: "destructive" }); return; }
    setAddingItemId(catalogItemId);
    const result = await addCatalogItemToProject(projectId, catalogItemId);
    if ("error" in result) { toast({ title: "Błąd", description: result.error, variant: "destructive" }); }
    else if ("success" in result && result.success) {
      if (itemMeta) trackRecentItem({ id: catalogItemId, name: itemName, ...itemMeta });
      if (result.isAssembly) { toast({ title: "Zestaw dodany!", description: `${itemName} został rozwinięty na elementy składowe` }); }
      else { toast({ title: "Dodano do kosztorysu", description: itemName }); }
      notifyDataChanged("item-added"); router.refresh();
    }
    setAddingItemId(null);
  };

  const openEditDialog = (item: CatalogItem) => { setEditItemId(item.id); setEditItemName(item.name); setEditItemUnit(item.unit); setEditItemMaterial(String(item.base_material_price)); setEditItemLabor(String(item.base_labor_price)); setEditItemCategory(item.category_id || ""); setIsEditDialogOpen(true); };

  const handleEditSave = async () => {
    if (!editItemId || !editItemName.trim()) { toast({ title: "Błąd", description: "Nazwa pozycji jest wymagana", variant: "destructive" }); return; }
    setIsEditing(true);
    try {
      await updateCatalogItem(editItemId, { name: editItemName.trim(), unit: editItemUnit, base_material_price: parseFloat(editItemMaterial) || 0, base_labor_price: parseFloat(editItemLabor) || 0, category_id: editItemCategory || undefined });
      toast({ title: "Sukces", description: "Pozycja została zaktualizowana" }); setIsEditDialogOpen(false); notifyDataChanged("catalog-item-updated"); router.refresh();
    } catch (error) { toast({ title: "Błąd", description: error instanceof Error ? error.message : "Nie udało się zaktualizować pozycji", variant: "destructive" }); }
    setIsEditing(false);
  };

  const resetCreateForm = () => { setNewItemName(""); setNewItemUnit("szt"); setNewItemMaterial(""); setNewItemLabor(""); setNewItemCategory(""); setNewItemVisibility("personal"); };

  const handleAddToProject = async () => {
    if (isFinal) { toast({ title: "Projekt zablokowany", description: "Odblokuj projekt, aby dodawać pozycje", variant: "destructive" }); return; }
    if (!newItemName.trim()) { toast({ title: "Błąd", description: "Nazwa pozycji jest wymagana", variant: "destructive" }); return; }
    setIsAddingToProject(true);
    try {
      const result = await addProjectItemDirect(projectId, {
        name: newItemName.trim(),
        unit: newItemUnit,
        material_price: parseFloat(newItemMaterial) || 0,
        labor_price: parseFloat(newItemLabor) || 0,
      });
      if (result && "error" in result && result.error) {
        toast({ title: "Błąd", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Sukces", description: "Pozycja dodana bezpośrednio do kosztorysu" });
        resetCreateForm(); setIsCreateDialogOpen(false); notifyDataChanged("project-item-added"); router.refresh();
      }
    } catch (error) { toast({ title: "Błąd", description: error instanceof Error ? error.message : "Nie udało się dodać pozycji", variant: "destructive" }); }
    setIsAddingToProject(false);
  };

  const handleQuickCreate = async () => {
    if (isFinal) { toast({ title: "Projekt zablokowany", description: "Odblokuj projekt, aby tworzyć nowe pozycje", variant: "destructive" }); return; }
    if (!newItemName.trim()) { toast({ title: "Błąd", description: "Nazwa pozycji jest wymagana", variant: "destructive" }); return; }
    setIsCreating(true);
    try {
      const createData: { name: string; unit: string; base_material_price: number; base_labor_price: number; category_id?: string; visibility?: "personal" | "team"; team_id?: string } = { name: newItemName.trim(), unit: newItemUnit, base_material_price: parseFloat(newItemMaterial) || 0, base_labor_price: parseFloat(newItemLabor) || 0, category_id: newItemCategory || undefined, visibility: newItemVisibility };
      if (newItemVisibility === "team" && userTeam?.id) createData.team_id = userTeam.id;
      await createCatalogItem(createData);
      toast({ title: "Sukces", description: newItemVisibility === "team" ? "Pozycja dodana i udostępniona zespołowi" : "Pozycja została dodana" });
      resetCreateForm(); setIsCreateDialogOpen(false); notifyDataChanged("catalog-item-created"); router.refresh();
    } catch (error) { toast({ title: "Błąd", description: error instanceof Error ? error.message : "Nie udało się zapisać pozycji", variant: "destructive" }); }
    setIsCreating(false);
  };

  const topUsedItems = [...recentItems].sort((a, b) => b.useCount - a.useCount).slice(0, 15);


  return (
    <div className="h-full flex flex-col overflow-hidden min-h-0">
      <CardHeader className="flex-shrink-0 bg-white dark:bg-slate-900 py-2.5 px-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {onCollapse && (
              <button
                onClick={onCollapse}
                className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800/60 shadow-sm ring-2 ring-blue-300/50 dark:ring-blue-600/30 animate-pulse hover:animate-none transition-colors flex-shrink-0"
                title="Ukryj katalog"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )}
            <CardTitle className="flex items-center gap-2 text-sm">
              <Package className="w-4 h-4" />
              Katalog pozycji
            </CardTitle>
          </div>
          <div className="flex items-center gap-0.5 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-md flex-shrink-0">
            <button onClick={() => setViewMode("card")} className={`p-1 rounded transition-all ${viewMode === "card" ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600" : "text-slate-400 hover:text-slate-600"}`}>
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setViewMode("list")} className={`p-1 rounded transition-all ${viewMode === "list" ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600" : "text-slate-400 hover:text-slate-600"}`}>
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </CardHeader>

      <div className="flex-1 min-h-0 overflow-hidden flex flex-col p-3">
        {/* ── Source mode selector ──────────────────────────────────────────────────── */}
        <SearchModeSelector
          mode={searchMode}
          onChange={setSearchMode}
          className="w-full mb-2 flex-shrink-0"
        />
        <CategoryNav sourceFilter={sourceFilter} onSourceFilterChange={setSourceFilter} userTeam={userTeam} />

        <div className="mb-3 flex items-center gap-1 p-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700/50 flex-shrink-0 overflow-hidden">
          <Button onClick={() => setIsCreateDialogOpen(true)} variant="ghost" size="sm" className="flex-1 min-w-0 h-7 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 gap-1 px-1">
            <PlusCircle className="w-3.5 h-3.5 flex-shrink-0" /><span className="truncate">Pozycja</span>
          </Button>
          <Button onClick={() => setIsCategoryDialogOpen(true)} variant="ghost" size="sm" className="flex-1 min-w-0 h-7 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 gap-1 px-1">
            <FolderPlus className="w-3.5 h-3.5 flex-shrink-0" /><span className="truncate">Kategoria</span>
          </Button>
          <Button onClick={() => { if (isFinal) { toast({ title: "Projekt zablokowany", description: "Odblokuj projekt, aby dodawac pozycje", variant: "destructive" }); return; } setIsCopyDialogOpen(true); }} variant="ghost" size="sm" className="flex-1 min-w-0 h-7 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 gap-1 px-1" disabled={isFinal}>
            <Copy className="w-3.5 h-3.5 flex-shrink-0" /><span className="truncate">Z proj.</span>
          </Button>
        </div>

        <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 min-h-0 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">

          {!searchTerm && (recentItems.length > 0 || favoriteItems.length > 0) && (
            <div className="mb-3">
              <button onClick={() => setQuickAddExpanded(!quickAddExpanded)} className="w-full flex items-center justify-between px-1 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider hover:text-blue-800 dark:hover:text-blue-300 transition-colors">
                <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5" />Szybki dostep</span>
                {quickAddExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {quickAddExpanded && (
                <>
                  <div className="flex gap-0.5 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg mt-1 mb-2">
                    <button onClick={() => setQuickAddTab("recent")} className={`flex-1 flex items-center justify-center gap-1 px-1.5 py-1 rounded-md text-[10px] font-medium transition-all ${quickAddTab === "recent" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"}`}>
                      <Clock className="w-3 h-3" />Ostatnio
                      {recentItems.length > 0 && <Badge variant={quickAddTab === "recent" ? "outline" : "secondary"} className={`text-[8px] h-3.5 px-1 ${quickAddTab === "recent" ? "border-white/40 text-white" : ""}`}>{recentItems.length}</Badge>}
                    </button>
                    <button onClick={() => setQuickAddTab("top")} className={`flex-1 flex items-center justify-center gap-1 px-1.5 py-1 rounded-md text-[10px] font-medium transition-all ${quickAddTab === "top" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"}`}>
                      <TrendingUp className="w-3 h-3" />Top
                    </button>
                    <button onClick={() => setQuickAddTab("favorites")} className={`flex-1 flex items-center justify-center gap-1 px-1.5 py-1 rounded-md text-[10px] font-medium transition-all ${quickAddTab === "favorites" ? "bg-amber-500 text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"}`}>
                      <Star className="w-3 h-3" />Ulubione
                      {favoriteItems.length > 0 && <Badge variant={quickAddTab === "favorites" ? "outline" : "secondary"} className={`text-[8px] h-3.5 px-1 ${quickAddTab === "favorites" ? "border-white/40 text-white" : ""}`}>{favoriteItems.length}</Badge>}
                    </button>
                  </div>
                  <div className="space-y-1">
                    {quickAddTab === "recent" && (recentItems.length === 0
                      ? <p className="text-[11px] text-muted-foreground text-center py-3">Dodaj pozycje do kosztorysu, aby pojawily sie tutaj</p>
                      : recentItems.slice(0, 10).map(item => (
                        <div key={`recent-${item.id}`} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 hover:bg-blue-100/50 dark:hover:bg-blue-900/30 transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{item.name}</p>
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <span>{item.unit}</span><span className="text-muted-foreground/40">|</span>
                              <BlurredPrice value={item.base_material_price + item.base_labor_price} isPro={isPro} className="font-semibold" showBadge={!isPro} />
                              {item.useCount > 1 && <><span className="text-muted-foreground/40">|</span><span className="text-blue-500">x{item.useCount}</span></>}
                            </div>
                          </div>
                          <Button size="sm" onClick={() => handleAddItem(item.id, item.name, { unit: item.unit, base_material_price: item.base_material_price, base_labor_price: item.base_labor_price })} disabled={addingItemId === item.id} className="h-7 w-7 p-0 bg-blue-600 text-white hover:bg-blue-700 shadow-sm flex-shrink-0">
                            {addingItemId === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                          </Button>
                        </div>
                      ))
                    )}
                    {quickAddTab === "top" && (topUsedItems.length === 0
                      ? <p className="text-[11px] text-muted-foreground text-center py-3">Uzywaj pozycji, aby zobaczyc ranking</p>
                      : topUsedItems.slice(0, 10).map((item, idx) => (
                        <div key={`top-${item.id}`} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30 transition-colors">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className={`text-[10px] font-bold w-4 text-center flex-shrink-0 ${idx === 0 ? "text-amber-500" : idx === 1 ? "text-slate-400" : idx === 2 ? "text-amber-700" : "text-muted-foreground"}`}>{idx + 1}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{item.name}</p>
                              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <span>{item.unit}</span><span className="text-muted-foreground/40">|</span>
                                <BlurredPrice value={item.base_material_price + item.base_labor_price} isPro={isPro} className="font-semibold" showBadge={!isPro} />
                                <span className="text-muted-foreground/40">|</span><span className="text-emerald-600 font-medium">x{item.useCount}</span>
                              </div>
                            </div>
                          </div>
                          <Button size="sm" onClick={() => handleAddItem(item.id, item.name, { unit: item.unit, base_material_price: item.base_material_price, base_labor_price: item.base_labor_price })} disabled={addingItemId === item.id} className="h-7 w-7 p-0 bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm flex-shrink-0">
                            {addingItemId === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                          </Button>
                        </div>
                      ))
                    )}
                    {quickAddTab === "favorites" && (!favoritesLoaded
                      ? <div className="flex justify-center py-3"><Loader2 className="h-4 w-4 animate-spin text-amber-500" /></div>
                      : favoriteItems.length === 0
                        ? <div className="text-center py-3"><Star className="w-5 h-5 mx-auto mb-1 text-muted-foreground/30" /><p className="text-[11px] text-muted-foreground">Kliknij gwiazdke przy pozycji, aby dodac do ulubionych</p></div>
                        : favoriteItems.map(item => (
                          <div key={`fav-${item.id}`} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 hover:bg-amber-100/50 dark:hover:bg-amber-900/30 transition-colors">
                            <button onClick={() => handleToggleFavorite(item)} disabled={togglingFavorite === item.id} className="flex-shrink-0 text-amber-500 hover:text-amber-600 transition-colors" title="Usun z ulubionych">
                              {togglingFavorite === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Star className="w-3.5 h-3.5 fill-amber-500" />}
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{item.name}</p>
                              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <span>{item.unit}</span><span className="text-muted-foreground/40">|</span>
                                <BlurredPrice value={item.base_material_price + item.base_labor_price} isPro={isPro} className="font-semibold" showBadge={!isPro} />
                              </div>
                            </div>
                            <Button size="sm" onClick={() => handleAddItem(item.id, item.name, { unit: item.unit, base_material_price: item.base_material_price, base_labor_price: item.base_labor_price })} disabled={addingItemId === item.id} className="h-7 w-7 p-0 bg-amber-500 text-white hover:bg-amber-600 shadow-sm flex-shrink-0">
                              {addingItemId === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                            </Button>
                          </div>
                        ))
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id={searchId} name={searchId} aria-label="Szukaj pozycji w katalogu" placeholder="Szukaj pozycji..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 h-9 focus-visible:ring-inset" />
              {isSearching && <div className="absolute right-3 top-1/2 -translate-y-1/2"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>}
            </div>
          </div>

          <Accordion type="single" collapsible className="w-full" value={expandedCategory} onValueChange={setExpandedCategory}>
            {visibleCategories.map((category) => {
              const items = getItemsForCategory(category.id);
              const filteredItems = filterItems(items);
              const isLoaded = loadedItems[category.id] !== undefined;
              if (isLoaded && filteredItems.length === 0) return null;
              if (searchTerm && filteredItems.length === 0) return null;
              return (
                <AccordionItem key={category.id} value={category.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-2">
                      <span className="font-medium">{category.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {isLoaded ? filteredItems.length : ((category as CatalogCategory & { count?: number }).count ?? 0)}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className={viewMode === "card" ? "space-y-2 pt-2" : "space-y-1 pt-2"}>
                      {loadingCategory === category.id ? (
                        <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-blue-500" /></div>
                      ) : (
                        <>
                          {filteredItems.map((item) => (
                            <CatalogItemCard
                              key={item.id}
                              item={item}
                              viewMode={viewMode}
                              isPro={isPro}
                              isAdding={addingItemId === item.id}
                              isFavorite={favoriteIds.has(item.id)}
                              isTogglingFavorite={togglingFavorite === item.id}
                              onAdd={() => handleAddItem(item.id, item.name, { unit: item.unit, base_material_price: item.base_material_price, base_labor_price: item.base_labor_price })}
                              onEdit={() => openEditDialog(item)}
                              onToggleFavorite={() => handleToggleFavorite(item)}
                            />
                          ))}
                          {filteredItems.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Brak pozycji w tej kategorii</p>}
                        </>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>

          {visibleCategories.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Brak kategorii w katalogu</p>
            </div>
          )}

          {sourceFilter !== "all" && visibleCategories.length > 0 && (() => {
            const anyVisible = visibleCategories.some(cat => filterItems(getItemsForCategory(cat.id)).length > 0 || !loadedItems[cat.id]);
            if (!anyVisible) return (
              <div className="text-center py-6 text-muted-foreground">
                <User className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">{sourceFilter === "personal" ? "Brak wlasnych pozycji" : "Brak pozycji zespolu"}</p>
                <p className="text-xs mt-1">{sourceFilter === "personal" ? "Dodaj wlasne pozycje przyciskiem + ponizej" : "Twoj zespol nie udostepnil jeszcze zadnych pozycji"}</p>
              </div>
            );
            return null;
          })()}
        </div>
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>Dodaj Nowa Pozycje</DialogTitle><DialogDescription>Uzupelnij dane nowej pozycji katalogowej</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="item-name">Nazwa pozycji *</Label>
              <AutocompleteItemInput id="item-name" value={newItemName} onChange={setNewItemName} onItemSelect={(sel) => { setNewItemName(sel.name); setNewItemUnit(sel.unit); }} placeholder="np. Gniazdo wtyczkowe 230V" disabled={isCreating} />
              <p className="text-xs text-slate-500 dark:text-slate-400">Zacznij pisac, aby zobaczyc podpowiedzi z Bazy KNR</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="item-category">Kategoria</Label>
              <Select value={newItemCategory || "none"} onValueChange={(v) => setNewItemCategory(v === "none" ? "" : v)}>
                <SelectTrigger id="item-category"><SelectValue placeholder="Wybierz kategorie" /></SelectTrigger>
                <SelectContent><SelectItem value="none">Bez kategorii</SelectItem>{categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="item-unit">Jednostka *</Label>
              <Select value={newItemUnit} onValueChange={setNewItemUnit}>
                <SelectTrigger id="item-unit"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="szt">szt (sztuka)</SelectItem><SelectItem value="mb">mb (metr biezacy)</SelectItem><SelectItem value="m2">m2 (metr kwadratowy)</SelectItem><SelectItem value="kpl">kpl (komplet)</SelectItem><SelectItem value="godz">godz (godzina)</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="grid gap-2"><Label htmlFor="item-labor">Cena Robocizna (PLN) <span className="text-xs text-slate-400 font-normal">(opcjonalne)</span></Label><Input id="item-labor" name="item-labor" type="number" step="0.01" min="0" value={newItemLabor} onChange={(e) => setNewItemLabor(e.target.value)} onFocus={(e) => e.target.select()} /></div>
            <div className="grid gap-2"><Label htmlFor="item-material">Cena Materiał (PLN) <span className="text-xs text-slate-400 font-normal">(opcjonalne)</span></Label><Input id="item-material" name="item-material" type="number" step="0.01" min="0" value={newItemMaterial} onChange={(e) => setNewItemMaterial(e.target.value)} onFocus={(e) => e.target.select()} /></div>
            {userTeam && (
              <div className="grid gap-2 pt-2 border-t">
                <Label className="flex items-center gap-2"><Users className="w-4 h-4" />Udostepnij zespolowi</Label>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    {newItemVisibility === "team" ? <><Users className="w-4 h-4 text-blue-500" /><span className="text-sm">Widoczne dla: <strong>{userTeam.name}</strong></span></> : <><Lock className="w-4 h-4 text-slate-500" /><span className="text-sm text-slate-600 dark:text-slate-400">Tylko dla mnie</span></>}
                  </div>
                  <Switch checked={newItemVisibility === "team"} onCheckedChange={(c) => setNewItemVisibility(c ? "team" : "personal")} />
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => { resetCreateForm(); setIsCreateDialogOpen(false); }} disabled={isCreating || isAddingToProject}>Anuluj</Button>
            <div className="flex gap-2 sm:ml-auto">
              <Button
                variant="outline"
                onClick={handleAddToProject}
                disabled={isAddingToProject || isCreating || !newItemName.trim()}
                className="border-green-500 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30"
              >
                {isAddingToProject ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Dodawanie...</> : <>📝 Dodaj do kosztorysu</>}
              </Button>
              <Button onClick={handleQuickCreate} disabled={isCreating || isAddingToProject || !newItemName.trim()} className="bg-blue-600 hover:bg-blue-700 text-white">
                {isCreating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Zapisywanie...</> : <>📂 Dodaj do katalogu</>}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>Edytuj Pozycje</DialogTitle><DialogDescription>Zaktualizuj dane pozycji katalogowej</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label htmlFor="edit-item-name">Nazwa pozycji *</Label><Input id="edit-item-name" name="edit-item-name" value={editItemName} onChange={(e) => setEditItemName(e.target.value)} placeholder="np. Gniazdo wtyczkowe 230V" disabled={isEditing} /></div>
            <div className="grid gap-2">
              <Label htmlFor="edit-item-category">Kategoria</Label>
              <Select value={editItemCategory || "none"} onValueChange={(v) => setEditItemCategory(v === "none" ? "" : v)}>
                <SelectTrigger id="edit-item-category"><SelectValue placeholder="Wybierz kategorie" /></SelectTrigger>
                <SelectContent><SelectItem value="none">Bez kategorii</SelectItem>{categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-item-unit">Jednostka *</Label>
              <Select value={editItemUnit} onValueChange={setEditItemUnit}>
                <SelectTrigger id="edit-item-unit"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="szt">szt (sztuka)</SelectItem><SelectItem value="mb">mb (metr biezacy)</SelectItem><SelectItem value="m2">m2 (metr kwadratowy)</SelectItem><SelectItem value="kpl">kpl (komplet)</SelectItem><SelectItem value="godz">godz (godzina)</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="grid gap-2"><Label htmlFor="edit-item-labor">Cena Robocizna (PLN)</Label><Input id="edit-item-labor" name="edit-item-labor" type="number" step="0.01" min="0" value={editItemLabor} onChange={(e) => setEditItemLabor(e.target.value)} onFocus={(e) => e.target.select()} /></div>
            <div className="grid gap-2"><Label htmlFor="edit-item-material">Cena Material (PLN)</Label><Input id="edit-item-material" name="edit-item-material" type="number" step="0.01" min="0" value={editItemMaterial} onChange={(e) => setEditItemMaterial(e.target.value)} onFocus={(e) => e.target.select()} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isEditing}>Anuluj</Button>
            <Button onClick={handleEditSave} disabled={isEditing || !editItemName.trim()} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isEditing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Zapisywanie...</> : "Zapisz zmiany"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CategoryDialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen} mode="create" />
      <CopyFromProjectDialog open={isCopyDialogOpen} onOpenChange={setIsCopyDialogOpen} targetProjectId={projectId} />
      <AIProjectImportDialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen} projectId={projectId} onImport={async (items) => { const result = await importItemsToProject(projectId, items); if (result.success) notifyDataChanged("item-added"); return result; }} />
    </div>
  );
}
