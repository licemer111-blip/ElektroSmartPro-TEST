"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { deleteAssemblyCategory } from "@/app/dashboard/actions";
import { Loader2, AlertTriangle } from "lucide-react";

interface AssemblyCategory {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
}

interface DeleteAssemblyCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: AssemblyCategory | null;
  itemCount: number;
}

export function DeleteAssemblyCategoryDialog({
  open,
  onOpenChange,
  category,
  itemCount,
}: DeleteAssemblyCategoryDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleDelete = async () => {
    if (!category) return;

    setIsDeleting(true);

    try {
      const result = await deleteAssemblyCategory(category.id);

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
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <AlertDialogTitle>Usuń Kategorię</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            {itemCount > 0 ? (
              <>
                <span className="font-semibold text-red-600">⚠️ Ta kategoria zawiera {itemCount} {itemCount === 1 ? "zestaw" : "zestawów"}!</span>
                <br />
                <br />
                Nie można usunąć kategorii zawierającej zestawy. Najpierw przenieś lub usuń zestawy z kategorii{" "}
                <span className="font-semibold text-slate-900 dark:text-slate-100">{category?.name}</span>.
              </>
            ) : (
              <>
                Czy na pewno chcesz usunąć kategorię{" "}
                <span className="font-semibold text-slate-900 dark:text-slate-100">{category?.name}</span>?
                <br />
                <br />
                Ta akcja jest nieodwracalna. Kategoria zostanie trwale usunięta.
              </>
            )}
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
            disabled={isDeleting || itemCount > 0}
          >
            {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {itemCount > 0 ? "Nie można usunąć" : "Usuń Kategorię"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
