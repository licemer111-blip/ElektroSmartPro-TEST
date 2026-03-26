"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  createCatalogCategory,
  updateCatalogCategory,
} from "@/app/dashboard/catalog/category-actions";
import { useRouter } from "next/navigation";

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  category?: { id: string; name: string } | null;
}

export function CategoryDialog({
  open,
  onOpenChange,
  mode,
  category,
}: CategoryDialogProps) {
  const [name, setName] = useState(category?.name || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // Update name when category changes
  useEffect(() => {
    if (category) {
      setName(category.name);
    } else {
      setName("");
    }
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (mode === "create") {
        const result = await createCatalogCategory(name);

        if (result.success) {
          toast({
            title: "Sukces",
            description: `Kategoria "${result.category?.name}" została utworzona`,
          });
          onOpenChange(false);
          setName("");
          router.refresh();
        } else {
          toast({
            title: "Błąd",
            description: result.error || "Nie udało się utworzyć kategorii",
            variant: "destructive",
          });
        }
      } else if (mode === "edit" && category) {
        const result = await updateCatalogCategory(category.id, name);

        if (result.success) {
          toast({
            title: "Sukces",
            description: `Kategoria "${name}" została zaktualizowana`,
          });
          onOpenChange(false);
          router.refresh();
        } else {
          toast({
            title: "Błąd",
            description: result.error || "Nie udało się zaktualizować kategorii",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Category dialog error:", error);
      toast({
        title: "Błąd",
        description: "Wystąpił nieoczekiwany błąd",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? "Dodaj Nową Kategorię" : "Edytuj Kategorię"}
            </DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? "Uzupełnij dane nowej kategorii katalogowej"
                : "Wprowadź zmiany w kategorii"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nazwa kategorii *</Label>
              <Input
                id="name"
                name="name"
                autoComplete="off"
                placeholder="np. Moje instalacje, Smart Home..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
                required
                maxLength={100}
                autoFocus
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kategorie pomagają organizować pozycje katalogowe
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Anuluj
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              onClick={(e) => {
                // Form submit will handle it
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {mode === "create" ? "Dodaj Kategorię" : "Zapisz Zmiany"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
