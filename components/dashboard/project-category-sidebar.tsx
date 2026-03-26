"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Folder, FolderOpen, Plus, Edit2, Trash2, FolderKanban, Archive } from "lucide-react";
import { ProjectCategoryDialog } from "./project-category-dialog";
import { DeleteProjectCategoryDialog } from "./delete-project-category-dialog";

interface ProjectCategory {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
}

interface ProjectCategorySidebarProps {
  categories: ProjectCategory[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  totalItems: number;
  itemsPerCategory: Record<string, number>;
  archivedCount?: number;
}

export function ProjectCategorySidebar({
  categories,
  selectedCategoryId,
  onSelectCategory,
  totalItems,
  itemsPerCategory,
  archivedCount,
}: ProjectCategorySidebarProps) {
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProjectCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<ProjectCategory | null>(null);

  const uncategorizedCount = itemsPerCategory["uncategorized"] || 0;
  const archived = archivedCount || 0;

  const handleEditCategory = (category: ProjectCategory, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCategory(category);
    setIsCategoryDialogOpen(true);
  };

  const handleDeleteCategory = (category: ProjectCategory, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingCategory(category);
    setIsDeleteDialogOpen(true);
  };

  const handleCreateNew = () => {
    setEditingCategory(null);
    setIsCategoryDialogOpen(true);
  };

  return (
    <>
      <div className="w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col h-fit max-h-[calc(100vh-16rem)] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-3">
            <Folder className="w-4 h-4" />
            Kategorie Projektów
          </h3>
          <Button
            size="sm"
            onClick={handleCreateNew}
            className="w-full bg-blue-600 text-white hover:bg-blue-700 shadow-sm border-transparent"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nowa Kategoria
          </Button>
        </div>

        {/* Categories List */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-1">
            {/* All Items */}
            <button
              onClick={() => onSelectCategory(null)}
              className={`
                w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors
                ${
                  selectedCategoryId === null
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
                }
              `}
            >
              <div className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4" />
                <span>Wszystkie</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {totalItems}
              </Badge>
            </button>

            {/* Archived */}
            {archived > 0 && (
              <button
                onClick={() => onSelectCategory("archived")}
                className={`
                  w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors
                  ${
                    selectedCategoryId === "archived"
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  <Archive className="w-4 h-4 text-amber-500" />
                  <span>Zarchiwizowane</span>
                </div>
                <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                  {archived}
                </Badge>
              </button>
            )}

            {/* Uncategorized */}
            {uncategorizedCount > 0 && (
              <button
                onClick={() => onSelectCategory("uncategorized")}
                className={`
                  w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors
                  ${
                    selectedCategoryId === "uncategorized"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4 text-slate-400" />
                  <span>Bez kategorii</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {uncategorizedCount}
                </Badge>
              </button>
            )}

            {/* User Categories */}
            {categories.map((category) => {
              const count = itemsPerCategory[category.id] || 0;
              const isSelected = selectedCategoryId === category.id;

              return (
                <div
                  key={category.id}
                  className={`
                    group relative flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors cursor-pointer
                    ${
                      isSelected
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
                    }
                  `}
                  onClick={() => onSelectCategory(category.id)}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {isSelected ? (
                      <FolderOpen className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <Folder className="w-4 h-4 flex-shrink-0" />
                    )}
                    <span className="truncate">{category.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="text-xs">
                      {count}
                    </Badge>
                    
                    <div className="hidden group-hover:flex items-center gap-1 ml-1">
                      <button
                        onClick={(e) => handleEditCategory(category, e)}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded"
                        title="Edytuj kategorię"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteCategory(category, e)}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-950 text-red-600 dark:text-red-400 rounded"
                        title="Usuń kategorię"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Dialogs */}
      <ProjectCategoryDialog
        open={isCategoryDialogOpen}
        onOpenChange={setIsCategoryDialogOpen}
        category={editingCategory}
      />

      <DeleteProjectCategoryDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        category={deletingCategory}
        itemCount={deletingCategory ? itemsPerCategory[deletingCategory.id] || 0 : 0}
      />
    </>
  );
}
