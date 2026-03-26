"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Download, CheckCircle, AlertCircle, Info, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { exportCurrentCatalog } from "@/app/dashboard/settings/actions";

export function ExportCatalogButton() {
  const [isPending, startTransition] = useTransition();
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);
  const [itemCount, setItemCount] = useState<number>(0);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const { toast } = useToast();

  const handleExport = () => {
    startTransition(async () => {
      const response = await exportCurrentCatalog();
      
      if (response.error || !response.success) {
        toast({
          title: "Błąd eksportu",
          description: response.error || "Nie udało się wyeksportować katalogu",
          variant: "destructive",
        });
        return;
      }

      setExportSuccess(true);
      setItemCount(response.count || 0);
      setSuccessMessage(response.message || "Plik zapisany pomyślnie!");
      
      toast({
        title: "Katalog wyeksportowany!",
        description: response.message || `Pomyślnie wyeksportowano ${response.count} pozycji.`,
      });
    });
  };

  return (
    <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Download className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <CardTitle className="text-amber-900 dark:text-amber-100">
            Eksport Katalogu do JSON
          </CardTitle>
        </div>
        <CardDescription className="text-amber-800 dark:text-amber-300">
          Wyeksportuj swój katalog do pliku JSON (dla administratorów)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700">
          <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-amber-900 dark:text-amber-100">Dla administratorów</AlertTitle>
          <AlertDescription className="text-amber-800 dark:text-amber-300 text-sm">
            Ta funkcja eksportuje WSZYSTKIE pozycje z Twojego katalogu do formatu JSON. 
            Użyj tego, aby utworzyć plik <code className="bg-amber-200 dark:bg-amber-900 px-1 rounded">master-catalog-items.json</code> dla funkcji Smart Seed.
          </AlertDescription>
        </Alert>

        <Button 
          onClick={handleExport} 
          disabled={isPending}
          className="w-full bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Eksportowanie...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Eksportuj Katalog
            </>
          )}
        </Button>

        {exportSuccess && (
          <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertTitle className="text-green-900 dark:text-green-100">Eksport zakończony!</AlertTitle>
            <AlertDescription className="text-green-800 dark:text-green-300 text-sm space-y-3">
              <div>
                <strong>{successMessage}</strong>
              </div>
              
              <div className="bg-white dark:bg-green-900/20 p-3 rounded border border-green-200 dark:border-green-800">
                <p className="text-xs font-medium mb-2">📊 Szczegóły eksportu:</p>
                <ul className="text-xs space-y-1">
                  <li>✅ Wyeksportowano: <strong>{itemCount} pozycji</strong></li>
                  <li>📁 Lokalizacja: <code className="bg-green-200 dark:bg-green-900 px-1 rounded">lib/data/master-catalog-items.json</code></li>
                  <li>🔄 Status: Plik zapisany bezpośrednio na dysku</li>
                </ul>
              </div>

              <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                <p className="text-xs font-medium mb-2">✨ Co dalej?</p>
                <ol className="text-xs space-y-1 list-decimal list-inside">
                  <li>Plik <code className="bg-green-200 dark:bg-green-900 px-1 rounded">master-catalog-items.json</code> został automatycznie zaktualizowany</li>
                  <li>Zrestartuj serwer deweloperski (jeśli potrzeba)</li>
                  <li>Przetestuj funkcję "Uzupełnij Katalog" - powinna teraz używać {itemCount} pozycji</li>
                </ol>
              </div>

              <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                <p className="text-xs text-green-700 dark:text-green-400">
                  💡 <strong>Wskazówka:</strong> Możesz teraz kliknąć "Uzupełnij Katalog" w sekcji powyżej, 
                  aby przetestować import z nowym plikiem master catalog.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
