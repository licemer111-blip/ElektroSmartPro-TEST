"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertTriangle, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { deleteCatalogItem } from "./actions";
import type { CatalogItem } from "./actions";

interface DeleteItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: CatalogItem | null;
}

export function DeleteItemDialog({
  open,
  onOpenChange,
  item,
}: DeleteItemDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [usedInProjects, setUsedInProjects] = useState<string[]>([]);

  const handleDelete = async () => {
    if (!item) return;

    setIsDeleting(true);
    setUsedInProjects([]);

    try {
      const result = await deleteCatalogItem(item.id);

      if (!result.success) {
        if (result.usedInProjects && result.usedInProjects.length > 0) {
          setUsedInProjects(result.usedInProjects);
          return;
        }
        if (result.error === "GLOBAL_ITEM") {
          toast({
            title: "Nie można usunąć",
            description: "To jest globalna pozycja. Możesz ją ukryć wyłączając 'Globalny Katalog' w Ustawieniach.",
            variant: "destructive",
          });
          return;
        }
        toast({
          title: "Błąd",
          description: result.error || "Nie udało się usunąć pozycji",
          variant: "destructive",
        });
        return;
      }

      toast({ title: "Sukces", description: "Pozycja została usunięta" });
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast({
        title: "Błąd",
        description: error instanceof Error ? error.message : "Nie udało się usunąć pozycji",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) setUsedInProjects([]);
    onOpenChange(val);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <AlertDialogTitle>Usuń Pozycję</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            {usedInProjects.length > 0 ? (
              <span className="block space-y-3">
                <span className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-200">
                  <FolderOpen className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600" />
                  <span>
                    <span className="font-semibold block mb-1">
                      Pozycja jest używana w {usedInProjects.length === 1 ? "projekcie" : "projektach"} i nie może zostać usunięta.
                    </span>
                    <span className="text-sm block mb-2">
                      Najpierw usuń pozycję z poniższych projektów, a następnie spróbuj ponownie:
                    </span>
                    <span className="block space-y-1">
                      {usedInProjects.map((name) => (
                        <span key={name} className="flex items-center gap-1.5 text-sm font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                          {name}
                        </span>
                      ))}
                    </span>
                  </span>
                </span>
              </span>
            ) : item?.user_id === null ? (
              <>
                <span className="font-semibold text-red-600">⚠️ To jest globalna pozycja!</span>
                <br />
                <br />
                Pozycja{" "}
                <span className="font-semibold text-slate-900">{item?.name}</span>{" "}
                jest częścią globalnego katalogu i nie może zostać usunięta.
                <br />
                <br />
                Jeśli chcesz ukryć globalne pozycje, wyłącz opcję{" "}
                <span className="font-semibold">"Globalny Katalog"</span> w Ustawieniach.
              </>
            ) : (
              <>
                Czy na pewno chcesz usunąć pozycję{" "}
                <span className="font-semibold text-slate-900">{item?.name}</span>?
                <br />
                <br />
                Ta akcja jest nieodwracalna. Pozycja zostanie trwale usunięta z katalogu.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {usedInProjects.length > 0 ? (
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Zamknij
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isDeleting}
              >
                Anuluj
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting || item?.user_id === null}
              >
                {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {item?.user_id === null ? "Nie można usunąć" : "Usuń Pozycję"}
              </Button>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
