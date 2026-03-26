"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { deleteCatalogCategory } from "@/app/dashboard/catalog/category-actions";
import { useRouter } from "next/navigation";

interface DeleteCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: { id: string; name: string } | null;
}

export function DeleteCategoryDialog({
  open,
  onOpenChange,
  category,
}: DeleteCategoryDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleDelete = async () => {
    if (!category) return;

    setIsDeleting(true);

    try {
      const result = await deleteCatalogCategory(category.id);

      if (result.success) {
        toast({
          title: "Sukces",
          description: `Kategoria "${category.name}" została usunięta`,
        });
        onOpenChange(false);
        router.refresh();
      } else {
        toast({
          title: "Błąd",
          description: result.error || "Nie udało się usunąć kategorii",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Delete category error:", error);
      toast({
        title: "Błąd",
        description: "Wystąpił nieoczekiwany błąd",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <AlertDialogTitle>Usuń Kategorię</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            Czy na pewno chcesz usunąć kategorię{" "}
            <span className="font-semibold text-slate-900 dark:text-slate-100">{category?.name}</span>?
            <br />
            <br />
            Ta akcja jest nieodwracalna. Wszystkie pozycje w tej kategorii zostaną przeniesione do "Bez kategorii".
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Anuluj
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Usuń Kategorię
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
