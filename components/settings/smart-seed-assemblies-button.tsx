"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Boxes, CheckCircle, AlertCircle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { seedAssembliesSmart } from "@/app/dashboard/catalog/seed-actions";

interface SeedResult {
  success: boolean;
  summary: { added: number; skipped: number; errors: number; total: number };
  results: { added: string[]; skipped: string[]; errors: string[] };
}

export function SmartSeedAssembliesButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<SeedResult | null>(null);
  const { toast } = useToast();

  const handleSeed = () => {
    startTransition(async () => {
      const response = await seedAssembliesSmart();
      
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
          title: "Zestawy uzupełnione!",
          description: `Dodano ${response.summary.added} nowych zestawów, pominięto ${response.summary.skipped} duplikatów.`,
        });
      }
    });
  };

  return (
    <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950/20 dark:border-purple-800">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Boxes className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <CardTitle className="text-purple-900 dark:text-purple-100">Uzupełnij Zestawy (Funkcje)</CardTitle>
        </div>
        <CardDescription className="text-purple-800 dark:text-purple-300">
          Dodaj 30+ gotowych zestawów elektrycznych (Gniazda, Oświetlenie, AGD, Smart Home, itp.)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700">
          <Info className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          <AlertTitle className="text-purple-900 dark:text-purple-100">Jak to działa?</AlertTitle>
          <AlertDescription className="text-purple-800 dark:text-purple-300 text-sm">
            System utworzy gotowe szablony zestawów (tylko nazwy i opisy). 
            Możesz później dodać do nich pozycje z katalogu. <strong>Zero duplikatów!</strong>
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <p className="text-sm text-purple-800 dark:text-purple-300 font-medium">
            📦 Przykładowe zestawy:
          </p>
          <ul className="text-xs text-purple-700 dark:text-purple-400 space-y-1 ml-4 list-disc">
            <li><strong>Podstawowe:</strong> Punkt Gniazda 230V, Punkt Oświetleniowy, Włącznik</li>
            <li><strong>Kuchnia:</strong> Płyta Indukcyjna 400V, Zmywarka, Piekarnik</li>
            <li><strong>Teletechnika:</strong> Punkt RJ45, TV/SAT, Zestaw Multimedialny</li>
            <li><strong>Smart Home:</strong> Roleta Elektryczna, Włącznik Smart WiFi</li>
            <li><strong>Rozdzielnica:</strong> Obwód 1-faz, 3-faz, RCD, SPD</li>
            <li><strong>Zewnętrzne:</strong> Oświetlenie Ogrodowe, Brama, Wideodomofon</li>
            <li><strong>Łazienka:</strong> Gniazdo IP44, Oświetlenie Lustra, Wentylator</li>
            <li><strong>Fotowoltaika:</strong> Falownik PV, Okablowanie DC</li>
            <li><strong>Monitoring:</strong> Kamera IP POE, Rejestrator</li>
            <li><strong>Garaż:</strong> Oświetlenie LED, Gniazdo Warsztatowe</li>
          </ul>
        </div>

        <Button 
          onClick={handleSeed} 
          disabled={isPending}
          className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uzupełnianie zestawów...
            </>
          ) : (
            <>
              <Boxes className="mr-2 h-4 w-4" />
              Uzupełnij Zestawy
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
                    Pokaż dodane zestawy ({result.results.added.length})
                  </summary>
                  <ul className="mt-2 text-xs text-green-700 dark:text-green-400 space-y-0.5 ml-4 list-disc max-h-48 overflow-y-auto">
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
