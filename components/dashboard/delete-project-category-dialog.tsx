"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { useToast } from "@/hooks/use-toast";
import { deleteProjectCategory } from "@/app/dashboard/actions";
import { Loader2 } from "lucide-react";

interface ProjectCategory {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
}

interface DeleteProjectCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: ProjectCategory | null;
  itemCount: number;
}

export function DeleteProjectCategoryDialog({
  open,
  onOpenChange,
  category,
  itemCount,
}: DeleteProjectCategoryDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleDelete = async () => {
    if (!category) return;

    setIsDeleting(true);

    try {
      const result = await deleteProjectCategory(category.id);

      if (result.error) {
        toast({
          title: "Błąd",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sukces",
          description: "Kategoria została usunięta",
        });
        onOpenChange(false);
        router.refresh();
      }
    } catch (error) {
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
          <AlertDialogTitle>Czy na pewno chcesz usunąć tę kategorię?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                Usuwasz kategorię: <strong>{category?.name}</strong>
              </p>
              
              {itemCount > 0 ? (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm">
                  <p className="text-red-800 dark:text-red-200 font-medium">
                    ⚠️ Ta kategoria zawiera {itemCount} {itemCount === 1 ? "projekt" : "projektów"}
                  </p>
                  <p className="text-red-700 dark:text-red-300 mt-1">
                    Nie można usunąć kategorii zawierającej projekty. Najpierw przenieś lub usuń projekty z tej kategorii.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Ta akcja jest nieodwracalna. Kategoria zostanie trwale usunięta.
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            Anuluj
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting || itemCount > 0}
            className="bg-red-600 text-white hover:bg-red-700 shadow-sm border-transparent disabled:bg-slate-400"
          >
            {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Usuń kategorię
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
