"use client";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
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
import { deleteAICatalogItems, deleteAIAssemblies } from "@/app/dashboard/settings/ai-actions";

export function AIContentManager() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCatalogConfirm, setShowCatalogConfirm] = useState(false);
  const [showAssembliesConfirm, setShowAssembliesConfirm] = useState(false);
  const { toast } = useToast();

  const handleDeleteCatalogItems = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteAICatalogItems();
      
      if (result.success) {
        toast({
          title: "✅ Sukces",
          description: `Usunięto ${result.deletedCount} pozycji katalogowych wygenerowanych przez AI`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "❌ Błąd",
          description: result.error || "Nie udało się usunąć pozycji",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "❌ Błąd",
        description: "Wystąpił nieoczekiwany błąd",
      });
    } finally {
      setIsDeleting(false);
      setShowCatalogConfirm(false);
    }
  };

  const handleDeleteAssemblies = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteAIAssemblies();
      
      if (result.success) {
        toast({
          title: "✅ Sukces",
          description: `Usunięto ${result.deletedCount} zestawów wygenerowanych przez AI`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "❌ Błąd",
          description: result.error || "Nie udało się usunąć zestawów",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "❌ Błąd",
        description: "Wystąpił nieoczekiwany błąd",
      });
    } finally {
      setIsDeleting(false);
      setShowAssembliesConfirm(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Info Card */}
      <Alert className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-2 border-amber-200 dark:border-amber-800">
        <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        <AlertDescription className="text-slate-900 dark:text-slate-100">
          <p className="font-semibold text-base mb-2">
            ⚙️ Zarządzanie Treścią ES-Engine
          </p>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            Możesz usunąć wszystkie pozycje katalogowe i zestawy wygenerowane przez ES Creator. 
            Pozycje oznaczone znaczkiem <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
              <Sparkles className="w-2.5 h-2.5" />
              ES
            </span> zostaną trwale usunięte.
          </p>
        </AlertDescription>
      </Alert>

      {/* Action Buttons */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Delete ES Catalog Items */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border-2 border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Pozycje Katalogowe</h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Usuń wszystkie pozycje katalogowe wygenerowane przez ES Creator
          </p>
          <Button
            variant="destructive"
            onClick={() => setShowCatalogConfirm(true)}
            disabled={isDeleting}
            className="w-full"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Usuwanie...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Usuń Pozycje AI
              </>
            )}
          </Button>
        </div>

        {/* Delete AI Assemblies */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border-2 border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Zestawy (Assemblies)</h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Usuń wszystkie zestawy wygenerowane przez ES-Engine Assembly Creator
          </p>
          <Button
            variant="destructive"
            onClick={() => setShowAssembliesConfirm(true)}
            disabled={isDeleting}
            className="w-full"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Usuwanie...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Usuń Zestawy ES
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-slate-700 dark:text-slate-300">
          <p className="font-medium text-slate-900 dark:text-slate-100 mb-1">
            ⚠️ Uwaga: Operacja nieodwracalna
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Po usunięciu, treść wygenerowana przez AI nie może być przywrócona. 
            Upewnij się, że chcesz trwale usunąć te elementy przed potwierdzeniem.
          </p>
        </div>
      </div>

      {/* Confirmation Dialog - Catalog Items */}
      <AlertDialog open={showCatalogConfirm} onOpenChange={setShowCatalogConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Usunąć pozycje katalogowe AI?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Ta operacja usunie wszystkie pozycje katalogowe wygenerowane przez ES Creator (oznaczone znaczkiem ES).
              <br /><br />
              <strong className="text-red-600 dark:text-red-400">
                Tej operacji nie można cofnąć!
              </strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCatalogItems}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Usuwanie...
                </>
              ) : (
                "Usuń Pozycje AI"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation Dialog - Assemblies */}
      <AlertDialog open={showAssembliesConfirm} onOpenChange={setShowAssembliesConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Usunąć zestawy ES?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Ta operacja usunie wszystkie zestawy (assemblies) wygenerowane przez ES-Engine Assembly Creator (oznaczone znaczkiem ES).
              <br /><br />
              <strong className="text-red-600 dark:text-red-400">
                Tej operacji nie można cofnąć!
              </strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAssemblies}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Usuwanie...
                </>
              ) : (
                "Usuń Zestawy ES"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
