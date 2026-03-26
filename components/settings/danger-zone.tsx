"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Trash2, Layers, AlertTriangle, Bomb } from "lucide-react";
import { deleteAllCatalogItems, deleteAllAssemblies, deleteAllCatalogItemsIncludingGlobal } from "@/app/dashboard/settings/actions";
import { toast } from "sonner";

export function DangerZone() {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteCatalogItems = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteAllCatalogItems();
      
      if (result.success) {
        toast.success(`Usunięto ${result.count || 0} Twoich pozycji`, {
          description: "Twoje osobiste pozycje zostały usunięte",
        });
      } else {
        toast.error("Błąd usuwania", {
          description: result.error || "Nie udało się usunąć pozycji",
        });
      }
    } catch (error) {
      toast.error("Błąd", {
        description: "Wystąpił nieoczekiwany błąd",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteALLIncludingGlobal = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteAllCatalogItemsIncludingGlobal();
      
      if (result.success) {
        toast.success(`Usunięto ${result.count || 0} WSZYSTKICH pozycji (globalnych + osobistych)`, {
          description: "Cała baza katalogu została wyczyszczona. Zastosuj teraz migracje SQL!",
          duration: 5000,
        });
      } else {
        toast.error("Błąd usuwania", {
          description: result.error || "Nie udało się usunąć pozycji",
        });
      }
    } catch (error) {
      toast.error("Błąd", {
        description: "Wystąpił nieoczekiwany błąd",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAssemblies = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteAllAssemblies();
      
      if (result.success) {
        toast.success(`Usunięto ${result.count || 0} zestawów`, {
          description: "Wszystkie zestawy zostały trwale usunięte",
        });
      } else {
        toast.error("Błąd usuwania", {
          description: result.error || "Nie udało się usunąć zestawów",
        });
      }
    } catch (error) {
      toast.error("Błąd", {
        description: "Wystąpił nieoczekiwany błąd",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="border-2 border-red-200 dark:border-red-900/50 bg-white dark:!bg-slate-900">
      <CardHeader className="border-b border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20">
        <div className="flex items-center gap-3">
          <div className="bg-red-100 dark:bg-red-900/50 rounded-lg p-2">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <CardTitle className="text-xl text-red-900 dark:text-red-100">
              Strefa Zagrożenia
            </CardTitle>
            <CardDescription className="mt-1 text-red-700 dark:text-red-300">
              Ostrożnie: Te akcje są nieodwracalne
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {/* Delete All Catalog Items */}
        <div className="flex items-start justify-between p-4 border border-slate-200 dark:border-slate-800 rounded-lg">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                Usuń Wszystkie Pozycje
              </h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Trwale usuwa wszystkie TWOJE osobiste pozycje. Nie można tego cofnąć.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                disabled={isDeleting}
                className="ml-4"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Usuń Moje Pozycje
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  Usuń Twoje osobiste pozycje?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Ta akcja jest <strong>nieodwracalna</strong>. Wszystkie TWOJE osobiste pozycje
                  zostaną trwale usunięte.
                  <br />
                  <br />
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">
                    ℹ️ Globalne pozycje (dostępne dla wszystkich) NIE zostaną usunięte.
                  </span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Anuluj</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteCatalogItems}
                  className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                >
                  Tak, usuń moje pozycje
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Delete ALL Including Global - NUCLEAR OPTION */}
        <div className="flex items-start justify-between p-4 border-2 border-red-500 dark:border-red-600 rounded-lg bg-red-50 dark:bg-red-950/30">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Bomb className="w-4 h-4 text-red-700 dark:text-red-400" />
              <h3 className="font-semibold text-red-900 dark:text-red-100">
                Usuń WSZYSTKO (włącznie z globalnymi) 💣
              </h3>
            </div>
            <p className="text-sm text-red-700 dark:text-red-300 mb-2">
              <strong>⚠️ UWAGA:</strong> Usuwa CAŁĄ bazę katalogu (globalne + osobiste pozycje).
            </p>
            <p className="text-xs text-red-600 dark:text-red-400">
              Użyj przed zastosowaniem migracji SQL do czystego resetu bazy danych.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                disabled={isDeleting}
                className="ml-4 bg-red-700 hover:bg-red-800"
              >
                <Bomb className="w-4 h-4 mr-2" />
                USUŃ WSZYSTKO
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                  <Bomb className="w-6 h-6" />
                  OSTATECZNE OSTRZEŻENIE!
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-3">
                  <p className="text-base font-semibold text-red-600 dark:text-red-400">
                    Ta akcja usunie CAŁĄ bazę katalogu (wszystkie pozycje: globalne + osobiste)!
                  </p>
                  <div className="bg-red-100 dark:bg-red-950/50 p-3 rounded-md">
                    <p className="text-sm text-red-800 dark:text-red-200 font-semibold mb-2">
                      Co zostanie usunięte:
                    </p>
                    <ul className="text-sm text-red-700 dark:text-red-300 list-disc list-inside space-y-1">
                      <li>Wszystkie globalne pozycje (dostępne dla wszystkich użytkowników)</li>
                      <li>Wszystkie Twoje osobiste pozycje</li>
                      <li>Cała zawartość katalogu zostanie wyczyszczona</li>
                    </ul>
                  </div>
                  <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">
                    ✅ Po usunięciu zastosuj 7 migracji SQL aby załadować nowy katalog!
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Anuluj (Bezpieczna opcja)</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteALLIncludingGlobal}
                  className="bg-red-700 hover:bg-red-800 focus:ring-red-700"
                >
                  💣 TAK, USUŃ WSZYSTKO
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Delete All Assemblies */}
        <div className="flex items-start justify-between p-4 border border-slate-200 dark:border-slate-800 rounded-lg">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-4 h-4 text-red-600 dark:text-red-400" />
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                Usuń Wszystkie Zestawy
              </h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Trwale usuwa wszystkie zestawy z Twojego konta. Nie można tego cofnąć.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                disabled={isDeleting}
                className="ml-4"
              >
                <Layers className="w-4 h-4 mr-2" />
                Usuń Zestawy
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  Czy na pewno chcesz usunąć wszystkie zestawy?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Ta akcja jest <strong>nieodwracalna</strong>. Wszystkie zestawy
                  zostaną trwale usunięte. Będziesz musiał ponownie wygenerować zestawy.
                  <br />
                  <br />
                  <span className="text-red-600 dark:text-red-400 font-semibold">
                    To nie wpłynie na Twoje projekty, ale usunie wszystkie zestawy.
                  </span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Anuluj</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAssemblies}
                  className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                >
                  Tak, usuń wszystkie zestawy
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Warning Message */}
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 dark:text-amber-200">
            <p className="font-semibold mb-1">Ważne informacje:</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>"Usuń Moje Pozycje"</strong> - usuwa tylko TWOJE osobiste pozycje</li>
              <li><strong>"Usuń WSZYSTKO"</strong> 💣 - usuwa CAŁĄ bazę (globalne + osobiste)</li>
              <li>Twoje projekty i kosztorysy NIE zostaną usunięte</li>
              <li>Po usunięciu zastosuj migracje SQL w zakładce "Baza Danych"</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
