"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Database, CheckCircle, AlertCircle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { seedDatabaseSmart } from "@/app/dashboard/catalog/seed-actions";

interface SeedResult {
  success: boolean;
  summary: { added: number; skipped: number; errors: number; total: number };
  results: { added: string[]; skipped: string[]; errors: string[] };
}

export function SmartSeedButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<SeedResult | null>(null);
  const { toast } = useToast();

  const handleSeed = () => {
    startTransition(async () => {
      const response = await seedDatabaseSmart();
      
      if (response.error) {
        toast({
          title: "Błąd",
          description: response.error,
          variant: "destructive",
        });
        return;
      }

      setResult(response as SeedResult);
      
      if (response.summary) {
        toast({
          title: "Katalog uzupełniony!",
          description: `Dodano ${response.summary.added} nowych pozycji, pominięto ${response.summary.skipped} duplikatów.`,
        });
      }
    });
  };

  return (
    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <CardTitle className="text-blue-900 dark:text-blue-100">Uzupełnij Katalog (Smart)</CardTitle>
        </div>
        <CardDescription className="text-blue-800 dark:text-blue-300">
          Dodaj popularne pozycje rynkowe do katalogu (Smart Home, Monitoring, Fotowoltaika, itp.)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertTitle className="text-blue-900 dark:text-blue-100">Jak to działa?</AlertTitle>
          <AlertDescription className="text-blue-800 dark:text-blue-300 text-sm">
            System sprawdzi każdą pozycję i doda tylko te, których jeszcze nie masz. 
            Istniejące pozycje zostaną pominięte - <strong>zero duplikatów!</strong>
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
            📦 Nowe kategorie i pozycje:
          </p>
          <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1 ml-4 list-disc">
            <li><strong>Smart Home:</strong> Sterowniki rolet Wi-Fi, Przekaźniki, Głowice termostatyczne</li>
            <li><strong>Monitoring:</strong> Kamery IP, Rejestratory, Kable UTP</li>
            <li><strong>Alarmy:</strong> Czujki PIR, Centrale alarmowe</li>
            <li><strong>Fotowoltaika:</strong> Kable solarne, Wtyczki MC4</li>
            <li><strong>Elektromobilność:</strong> Ładowarki Wallbox 11kW</li>
            <li><strong>Prace Ziemne:</strong> Mufy kablowe, Folia kablowa</li>
          </ul>
        </div>

        <Button 
          onClick={handleSeed} 
          disabled={isPending}
          className="w-full bg-blue-600 text-white hover:bg-blue-700 shadow-sm border-transparent"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uzupełnianie katalogu...
            </>
          ) : (
            <>
              <Database className="mr-2 h-4 w-4" />
              Uzupełnij Katalog
            </>
          )}
        </Button>

        {result && (
          <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertTitle className="text-green-900 dark:text-green-100">Operacja zakończona!</AlertTitle>
            <AlertDescription className="text-green-800 dark:text-green-300 text-sm space-y-2">
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="text-center p-2 bg-white dark:bg-green-900/20 rounded">
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                    {result.summary.added}
                  </div>
                  <div className="text-xs text-green-700 dark:text-green-500">Dodane</div>
                </div>
                <div className="text-center p-2 bg-white dark:bg-green-900/20 rounded">
                  <div className="text-lg font-bold text-slate-600 dark:text-slate-400">
                    {result.summary.skipped}
                  </div>
                  <div className="text-xs text-slate-700 dark:text-slate-500">Pominięte</div>
                </div>
                <div className="text-center p-2 bg-white dark:bg-green-900/20 rounded">
                  <div className="text-lg font-bold text-red-600 dark:text-red-400">
                    {result.summary.errors}
                  </div>
                  <div className="text-xs text-red-700 dark:text-red-500">Błędy</div>
                </div>
              </div>
              {result.results.added.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs font-medium text-green-700 dark:text-green-400">
                    Pokaż dodane pozycje ({result.results.added.length})
                  </summary>
                  <ul className="mt-2 text-xs text-green-700 dark:text-green-400 space-y-0.5 ml-4 list-disc">
                    {result.results.added.map((name: string) => (
                      <li key={name}>{name}</li>
                    ))}
                  </ul>
                </details>
              )}
            </AlertDescription>
          </Alert>
        )}

        {result && result.summary.errors > 0 && (
          <Alert className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertTitle className="text-red-900 dark:text-red-100">Uwaga: Wystąpiły błędy</AlertTitle>
            <AlertDescription className="text-red-800 dark:text-red-300 text-sm">
              <details className="mt-2">
                <summary className="cursor-pointer text-xs font-medium">
                  Pokaż błędy ({result.results.errors.length})
                </summary>
                <ul className="mt-2 text-xs space-y-0.5 ml-4 list-disc">
                  {result.results.errors.map((error: string) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </details>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
