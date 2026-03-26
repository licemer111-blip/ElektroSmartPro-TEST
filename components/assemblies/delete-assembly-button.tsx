"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { deleteUserAssembly } from "@/app/dashboard/assemblies/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DeleteAssemblyButtonProps {
  assemblyId: string;
  assemblyName: string;
}

export function DeleteAssemblyButton({ assemblyId, assemblyName }: DeleteAssemblyButtonProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);

    try {
      const result = await deleteUserAssembly(assemblyId);

      if (result.error) {
        toast({
          title: "Błąd",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Usunięto",
          description: result.message || "Zestaw został usunięty",
        });
        // Refresh the page to show updated data
        window.location.reload();
      }
    } catch (error) {
      console.error("Error deleting assembly:", error);
      toast({
        title: "Błąd",
        description: "Wystąpił nieoczekiwany błąd",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-red-600 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4 text-red-600" />
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Czy na pewno chcesz usunąć ten zestaw?</AlertDialogTitle>
          <AlertDialogDescription>
            Zestaw <strong>"{assemblyName}"</strong> zostanie trwale usunięty. Tej operacji nie można cofnąć.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Anuluj</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Usuwanie...
              </>
            ) : (
              "Usuń"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
