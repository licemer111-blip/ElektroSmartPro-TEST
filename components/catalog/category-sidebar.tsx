"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Folder, FolderOpen, Pencil, Trash2, MoreVertical, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CategoryDialog } from "./category-dialog";
import { DeleteCategoryDialog } from "./delete-category-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Category {
  id: string;
  name: string;
  user_id?: string | null;
}

interface Team {
  id: string;
  name: string;
}

interface CategorySidebarProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  totalItems: number;
  itemsPerCategory?: Record<string, number>;
  userTeam?: Team | null;
  onShareCategory?: (categoryId: string, categoryName: string) => void;
  currentView?: "core" | "own" | "all";
  onViewChange?: (view: string) => void;
  onAddItem?: () => void;
}

export function CategorySidebar({
  categories,
  selectedCategoryId,
  onSelectCategory,
  totalItems,
  itemsPerCategory = {},
  userTeam,
  onShareCategory,
  currentView = "core",
  onViewChange,
  onAddItem,
}: CategorySidebarProps) {
  const isOwnView = currentView === "own";
  const isGlobalView = currentView === "core" || currentView === "all";
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (category: Category) => {
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  };

  const handleShareCategory = async (category: Category) => {
    if (onShareCategory) {
      onShareCategory(category.id, category.name);
    }
  };

  // In own view: show categories that have items (AI items use global categories with user_id=null)
  // Don't filter by category.user_id — filter by whether the category has any items
  const visibleCategories = isOwnView
    ? categories.filter((c) => (itemsPerCategory[c.id] || 0) > 0)
    : categories;

  return (
    <>
      <div className="w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col h-fit max-h-[calc(100vh-16rem)] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-3">
            <Folder className="w-4 h-4" />
            Kategorie Pozycji
          </h3>


          {isOwnView && (
            <div className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 border-2 border-slate-200 dark:border-slate-700 shadow-sm">
              <button
                onClick={() => setIsCreateDialogOpen(true)}
                className="flex-1 text-[10px] font-semibold py-1.5 rounded-md transition-all bg-purple-600 text-white hover:bg-purple-700"
              >
                + Kategoria
              </button>
              {onAddItem && (
                <button
                  onClick={onAddItem}
                  className="flex-1 text-[10px] font-semibold py-1.5 rounded-md transition-all bg-purple-600 text-white hover:bg-purple-700"
                >
                  + Pozycja
                </button>
              )}
            </div>
          )}
        </div>

        {/* Category List */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* All Items */}
          <button
            onClick={() => onSelectCategory(null)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors",
              selectedCategoryId === null
                ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
            )}
          >
            <div className="flex items-center gap-2">
              {selectedCategoryId === null ? (
                <FolderOpen className="h-4 w-4" />
              ) : (
                <Folder className="h-4 w-4" />
              )}
              <span>Wszystkie</span>
            </div>
            <Badge variant="secondary" className="text-xs">
              {totalItems}
            </Badge>
          </button>

          {/* User Categories */}
          <div className="mt-2 space-y-1">
            {visibleCategories.map((category) => {
              const isSelected = selectedCategoryId === category.id;
              const itemCount = itemsPerCategory[category.id] || 0;
              
              return (
                <div
                  key={category.id}
                  className={cn(
                    "group relative flex items-center justify-between px-2 py-2 rounded-md text-sm transition-colors cursor-pointer",
                    isSelected
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
                  )}
                  onClick={() => onSelectCategory(category.id)}
                >
                  <div className="flex items-center gap-1.5 flex-1 min-w-0 pr-1">
                    {isSelected ? (
                      <FolderOpen className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <Folder className="w-4 h-4 flex-shrink-0" />
                    )}
                    <span className="truncate text-xs">{category.name}</span>
                  </div>
                
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 min-w-[20px] flex items-center justify-center">
                      {itemCount}
                    </Badge>
                    
                    {/* Dropdown Menu - always visible */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <button className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        {/* Edit */}
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(category);
                          }}
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Edytuj nazwę
                        </DropdownMenuItem>
                        
                        {/* Share with team - if user has team */}
                        {userTeam && onShareCategory && itemCount > 0 && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShareCategory(category);
                              }}
                            >
                              <Share2 className="w-4 h-4 mr-2 text-blue-600" />
                              <span className="text-blue-600">
                                Udostępnij zespołowi ({itemCount})
                              </span>
                            </DropdownMenuItem>
                          </>
                        )}
                        
                        <DropdownMenuSeparator />
                        
                        {/* Delete */}
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(category);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Usuń kategorię
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Category Management Dialogs */}
      <CategoryDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        mode="create"
      />
      
      <CategoryDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        mode="edit"
        category={selectedCategory}
      />
      
      <DeleteCategoryDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        category={selectedCategory}
      />
    </>
  );
}
