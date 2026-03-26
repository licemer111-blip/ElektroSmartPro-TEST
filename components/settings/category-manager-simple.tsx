"use client";

import { useState, useTransition, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, Folder } from "lucide-react";
import { createCategory, getCategories } from "@/app/dashboard/settings/actions";
import { toast } from "sonner";

export function CategoryManagerSimple() {
  const [categoryName, setCategoryName] = useState("");
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const result = await getCategories();
      if (result.success && result.categories) {
        setCategories(result.categories);
      } else {
        toast.error("Błąd", {
          description: result.error || "Nie udało się pobrać kategorii",
        });
      }
    } catch (error) {
      console.error("Error loading categories:", error);
      toast.error("Błąd", {
        description: "Wystąpił nieoczekiwany błąd podczas ładowania kategorii",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCategory = () => {
    if (!categoryName.trim()) {
      toast.error("Błąd", {
        description: "Nazwa kategorii nie może być pusta",
      });
      return;
    }

    startTransition(async () => {
      try {
        const result = await createCategory(categoryName.trim());

        if (result.success && result.category) {
          toast.success("Sukces!", {
            description: `Kategoria "${result.category.name}" została utworzona`,
          });
          setCategoryName("");
          // Reload categories to show the new one
          await loadCategories();
        } else {
          toast.error("Błąd", {
            description: result.error || "Nie udało się utworzyć kategorii",
          });
        }
      } catch (error) {
        console.error("Error creating category:", error);
        toast.error("Błąd", {
          description: "Wystąpił nieoczekiwany błąd",
        });
      }
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isPending) {
      handleCreateCategory();
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="flex gap-3">
        <Input
          id="new-category-name"
          name="new-category-name"
          type="text"
          aria-label="Nazwa nowej kategorii"
          placeholder="Nazwa nowej kategorii (np. Hala - Pneumatyka)"
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isPending}
          className="flex-1"
          maxLength={100}
        />
        <Button
          onClick={handleCreateCategory}
          disabled={isPending || !categoryName.trim()}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Dodawanie...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Dodaj
            </>
          )}
        </Button>
      </div>

      {/* Categories List */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Folder className="w-4 h-4" />
          Istniejące Kategorie ({categories.length})
        </h3>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
            Brak kategorii. Dodaj pierwszą kategorię powyżej.
          </div>
        ) : (
          <div className="max-h-48 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Badge
                  key={category.id}
                  variant="secondary"
                  className="px-3 py-1.5 text-sm bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100 border border-purple-300 dark:border-purple-700"
                >
                  {category.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Info Note */}
      <div className="text-xs text-slate-500 dark:text-slate-400 bg-purple-50 dark:bg-purple-950/30 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
        💡 <strong>Wskazówka:</strong> Kategorie są globalne i będą dostępne dla wszystkich pozycji w katalogu. 
        Możesz używać konwencji nazewnictwa jak "Sektor - Typ" (np. "Biuro - Zasilanie", "Hala - Oświetlenie").
      </div>
    </div>
  );
}
