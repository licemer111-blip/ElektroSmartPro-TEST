"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { LayoutGrid, List, Search, Filter, Archive, Trash2, ArchiveRestore, X, CheckSquare, Square, Loader2, Columns3, CalendarDays, FolderOpen } from "lucide-react";
import { ProjectCategorySidebar } from "./project-category-sidebar";
import { ProjectListView } from "./project-list-view";
import { ProjectCard } from "./project-card";
import { ProjectKanbanView } from "./project-kanban-view";
import { ProjectCalendarView } from "./project-calendar-view";
import { normalizePolish, searchComparator } from "@/lib/utils";
import { bulkDeleteProjects, bulkArchiveProjects, bulkRestoreProjects } from "@/app/dashboard/actions";
import type { ProjectWithRelations } from "@/lib/types/database";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProjectCategory {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
  client_name: string | null;
  status: string;
  category_id: string | null;
  user_id?: string;
  created_at: string;
  regions?: { name: string };
  object_types?: { name: string };
  project_members?: { role: string; status: string }[];
}

interface ProjectsManagerViewProps {
  projects: Project[];
  categories: ProjectCategory[];
  selectedCategoryId: string | null;
  currentUserId?: string;
}

export function ProjectsManagerView({
  projects,
  categories,
  selectedCategoryId: initialCategoryId,
  currentUserId,
}: ProjectsManagerViewProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list" | "kanban" | "calendar">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedCategoryId = searchParams.get("category") || initialCategoryId;

  // Toggle project selection
  const toggleProjectSelection = (projectId: string) => {
    setSelectedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  // Select all visible projects
  const selectAllVisible = () => {
    const filteredIds = filteredProjects.map(p => p.id);
    setSelectedProjects(new Set(filteredIds));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedProjects(new Set());
    setSelectionMode(false);
  };

  // Bulk delete handler
  const handleBulkDelete = () => {
    if (selectedProjects.size === 0) return;
    setShowBulkDeleteConfirm(true);
  };

  const executeBulkDelete = async () => {
    setShowBulkDeleteConfirm(false);
    setBulkLoading(true);
    const result = await bulkDeleteProjects(Array.from(selectedProjects));
    setBulkLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Usunięto ${result.deletedCount} projektów`);
      clearSelection();
      router.refresh();
    }
  };

  // Bulk archive handler
  const handleBulkArchive = async () => {
    if (selectedProjects.size === 0) return;

    setBulkLoading(true);
    const result = await bulkArchiveProjects(Array.from(selectedProjects));
    setBulkLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Zarchiwizowano ${result.archivedCount} projektów`);
      clearSelection();
      router.refresh();
    }
  };

  // Bulk restore handler
  const handleBulkRestore = async () => {
    if (selectedProjects.size === 0) return;

    setBulkLoading(true);
    const result = await bulkRestoreProjects(Array.from(selectedProjects));
    setBulkLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Przywrócono ${result.restoredCount} projektów`);
      clearSelection();
      router.refresh();
    }
  };

  const handleSelectCategory = (categoryId: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (categoryId) {
      params.set("category", categoryId);
    } else {
      params.delete("category");
    }
    router.push(`/dashboard?${params.toString()}`, { scroll: false });
  };

  // Count archived projects
  const archivedCount = projects.filter((p) => p.status === "archived").length;

  // Active (non-archived) projects only for counts and regular filtering
  const activeProjects = projects.filter((p) => p.status !== "archived");

  // Calculate items per category — only non-archived projects
  const itemsPerCategory = activeProjects.reduce((acc, item) => {
    const catId = item.category_id || "uncategorized";
    acc[catId] = (acc[catId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Filter by archive status / category
  let filteredProjects: Project[];
  if (selectedCategoryId === "archived") {
    filteredProjects = projects.filter((p) => p.status === "archived");
  } else {
    filteredProjects = showArchived
      ? projects
      : activeProjects;

    if (selectedCategoryId === "uncategorized") {
      filteredProjects = filteredProjects.filter((p) => !p.category_id);
    } else if (selectedCategoryId) {
      filteredProjects = filteredProjects.filter((p) => p.category_id === selectedCategoryId);
    }
  }

  // Filter by search
  if (searchQuery.trim()) {
    const normalizedQuery = normalizePolish(searchQuery);
    filteredProjects = filteredProjects
      .filter((project) =>
        normalizePolish(project.name).includes(normalizedQuery) ||
        (project.client_name && normalizePolish(project.client_name).includes(normalizedQuery))
      )
      .sort((a, b) =>
        searchComparator(normalizedQuery, normalizePolish(a.name), normalizePolish(b.name))
      );
  }

  return (
    <div className="flex gap-4 h-auto md:h-[calc(100vh-20rem)]">
      {/* Category Sidebar - Hidden on mobile */}
      <div className="hidden md:block">
        <ProjectCategorySidebar
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={handleSelectCategory}
          totalItems={activeProjects.length}
          itemsPerCategory={itemsPerCategory}
          archivedCount={archivedCount}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col">
        {/* Bulk Selection Toolbar */}
        {selectionMode && selectedProjects.size > 0 && (
          <div className="p-3 border-b border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              {/* Selection info */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearSelection}
                  className="text-blue-600 h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
                <span className="font-medium text-sm text-blue-900 dark:text-blue-100">
                  Wybrano: {selectedProjects.size}
                </span>
                <Button
                  size="sm"
                  variant="link"
                  onClick={selectAllVisible}
                  className="text-blue-600 text-xs sm:text-sm h-auto p-0"
                >
                  Zaznacz wszystkie ({filteredProjects.length})
                </Button>
              </div>
              {/* Actions */}
              <div className="flex items-center gap-2 ml-10 sm:ml-0">
                {showArchived ? (
                  <Button
                    size="sm"
                    onClick={handleBulkRestore}
                    disabled={bulkLoading}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm h-8"
                  >
                    {bulkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArchiveRestore className="w-4 h-4" />}
                    <span className="hidden sm:inline ml-2">Przywróć</span>
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleBulkArchive}
                    disabled={bulkLoading}
                    className="bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm h-8"
                  >
                    {bulkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
                    <span className="hidden sm:inline ml-2">Archiwizuj</span>
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={bulkLoading}
                  variant="destructive"
                  className="text-xs sm:text-sm h-8"
                >
                  {bulkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  <span className="hidden sm:inline ml-2">Usuń</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Toolbar Header */}
        <div className="p-3 md:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Mobile Category Toggle */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button size="sm" className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all hover:scale-105">
                    <Filter className="w-4 h-4 mr-2" />
                    Kategorie
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] p-0">
                  <SheetHeader className="p-4 border-b">
                    <SheetTitle>Kategorie Projektów</SheetTitle>
                    <SheetDescription className="sr-only">
                      Wybierz kategorię, aby filtrować projekty
                    </SheetDescription>
                  </SheetHeader>
                  <div className="overflow-y-auto h-[calc(100vh-80px)]">
                    <ProjectCategorySidebar
                      categories={categories}
                      selectedCategoryId={selectedCategoryId}
                      onSelectCategory={handleSelectCategory}
                      totalItems={activeProjects.length}
                      itemsPerCategory={itemsPerCategory}
                      archivedCount={archivedCount}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* View Toggle */}
            <div className="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg gap-0.5">
              {([
                { key: "grid" as const, icon: LayoutGrid, label: "Karty" },
                { key: "list" as const, icon: List, label: "Lista" },
                { key: "kanban" as const, icon: Columns3, label: "Kanban" },
                { key: "calendar" as const, icon: CalendarDays, label: "Kalendarz" },
              ]).map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setViewMode(key)}
                  className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-md text-[11px] sm:text-xs font-medium transition-all ${
                    viewMode === key
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="project-search"
                name="project-search"
                type="text"
                aria-label="Szukaj projektów"
                placeholder="Szukaj projektów..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Archive + Selection — side by side */}
            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2">
              {archivedCount > 0 && (
                <Button
                  size="sm"
                  onClick={() => setShowArchived(!showArchived)}
                  title={showArchived ? "Ukryj zarchiwizowane" : "Pokaż zarchiwizowane"}
                  className={`w-full sm:w-auto ${showArchived 
                    ? "bg-amber-500 hover:bg-amber-600 text-white shadow-md" 
                    : "bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-amber-300 dark:hover:border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20"}`}
                >
                  <Archive className="w-4 h-4 mr-1" />
                  <span className="text-xs">{archivedCount}</span>
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectionMode(!selectionMode);
                  if (selectionMode) {
                    setSelectedProjects(new Set());
                  }
                }}
                title={selectionMode ? "Wyłącz zaznaczanie" : "Tryb zaznaczania"}
                className={`w-full sm:w-auto ${selectionMode 
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md border-blue-600" 
                  : ""}`}
              >
                {selectionMode ? <CheckSquare className="w-4 h-4 mr-1" /> : <Square className="w-4 h-4 mr-1" />}
                <span className="text-xs">{selectionMode ? "Anuluj" : "Zaznacz"}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-3 md:p-4">
          {viewMode === "list" ? (
            <ProjectListView
              projects={filteredProjects}
              categories={categories}
              currentUserId={currentUserId}
            />
          ) : viewMode === "kanban" ? (
            <ProjectKanbanView projects={filteredProjects} />
          ) : viewMode === "calendar" ? (
            <ProjectCalendarView projects={filteredProjects} />
          ) : (
            <div>
              {filteredProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-500 dark:text-slate-400">
                  <FolderOpen className="w-12 h-12 mb-3 text-slate-300 dark:text-slate-600" />
                  <p className="text-sm font-medium">Brak projektów do wyświetlenia</p>
                  <p className="text-xs mt-1">Spróbuj zmienić filtry lub kryteria wyszukiwania</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 animate-in fade-in duration-500">
                  {filteredProjects.map((project, index) => (
                    <div 
                      key={project.id} 
                      className="animate-in slide-in-from-bottom-4 fade-in duration-500 relative h-full"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {selectionMode && (
                        <div 
                          className="absolute top-2 left-2 z-10"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleProjectSelection(project.id);
                          }}
                        >
                          <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center cursor-pointer transition-all ${
                            selectedProjects.has(project.id)
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-blue-400"
                          }`}>
                            {selectedProjects.has(project.id) && (
                              <CheckSquare className="w-4 h-4" />
                            )}
                          </div>
                        </div>
                      )}
                      <div 
                        className={`h-full ${selectionMode ? "cursor-pointer" : ""}`}
                        onClick={() => selectionMode && toggleProjectSelection(project.id)}
                      >
                        <ProjectCard project={project as unknown as ProjectWithRelations} currentUserId={currentUserId} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Info Footer */}
        <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 px-4 py-3">
          <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
            <div>
              Wyświetlono <span className="font-semibold text-slate-900 dark:text-slate-100">{filteredProjects.length}</span> z <span className="font-semibold text-slate-900 dark:text-slate-100">{projects.length}</span> projektów
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
      <AlertDialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usuń projekty</AlertDialogTitle>
            <AlertDialogDescription>
              Czy na pewno chcesz usunąć <strong>{selectedProjects.size}</strong> projektów? Ta operacja jest nieodwracalna.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={executeBulkDelete} className="bg-red-600 hover:bg-red-700 text-white">Usuń</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
