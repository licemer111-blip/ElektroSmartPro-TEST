"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Folder, 
  FolderOpen, 
  Pencil, 
  Trash2,
  Package,
  MoreVertical,
  Share2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AssemblyCategoryDialog } from "./assembly-category-dialog";
import { DeleteAssemblyCategoryDialog } from "./delete-assembly-category-dialog";

interface AssemblyCategory {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
}

interface Team {
  id: string;
  name: string;
}

interface AssemblyCategorySidebarProps {
  categories: AssemblyCategory[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  totalItems: number;
  itemsPerCategory: Record<string, number>;
  userTeam?: Team | null;
  onShareCategory?: (categoryId: string, categoryName: string) => void;
  onAddAssembly?: () => void;
}

export function AssemblyCategorySidebar({
  categories,
  selectedCategoryId,
  onSelectCategory,
  totalItems,
  itemsPerCategory,
  userTeam,
  onShareCategory,
  onAddAssembly,
}: AssemblyCategorySidebarProps) {
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AssemblyCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<AssemblyCategory | null>(null);

  const uncategorizedCount = itemsPerCategory["uncategorized"] || 0;

  const handleEditCategory = (category: AssemblyCategory) => {
    setEditingCategory(category);
    setIsCategoryDialogOpen(true);
  };

  const handleDeleteCategory = (category: AssemblyCategory) => {
    setDeletingCategory(category);
    setIsDeleteDialogOpen(true);
  };

  const handleShareCategory = (category: AssemblyCategory) => {
    if (onShareCategory) {
      onShareCategory(category.id, category.name);
    }
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
            Kategorie Zestawów
          </h3>
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 border-2 border-slate-200 dark:border-slate-700 shadow-sm">
            <button
              onClick={handleCreateNew}
              className="flex-1 text-[10px] font-semibold py-1.5 rounded-md transition-all bg-blue-600 text-white hover:bg-blue-700"
            >
              + Kategoria
            </button>
            {onAddAssembly && (
              <button
                onClick={onAddAssembly}
                className="flex-1 text-[10px] font-semibold py-1.5 rounded-md transition-all bg-blue-600 text-white hover:bg-blue-700"
              >
                + Zestaw
              </button>
            )}
          </div>
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
                <Package className="w-4 h-4" />
                <span>Wszystkie</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {totalItems}
              </Badge>
            </button>

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
                    group relative flex items-center justify-between px-2 py-2 rounded-md text-sm transition-colors cursor-pointer
                    ${
                      isSelected
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
                    }
                  `}
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
                      {count}
                    </Badge>
                    
                    {/* Dropdown Menu - always in DOM, opacity changes on hover */}
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
                            handleEditCategory(category);
                          }}
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Edytuj nazwę
                        </DropdownMenuItem>
                        
                        {/* Share with team - if user has team */}
                        {userTeam && onShareCategory && count > 0 && (
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
                                Udostępnij zespołowi ({count})
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
                            handleDeleteCategory(category);
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
        </ScrollArea>
      </div>

      {/* Dialogs */}
      <AssemblyCategoryDialog
        open={isCategoryDialogOpen}
        onOpenChange={setIsCategoryDialogOpen}
        category={editingCategory}
      />

      <DeleteAssemblyCategoryDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        category={deletingCategory}
        itemCount={deletingCategory ? itemsPerCategory[deletingCategory.id] || 0 : 0}
      />
    </>
  );
}
