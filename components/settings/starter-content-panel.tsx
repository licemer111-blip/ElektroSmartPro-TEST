"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Database, Boxes, Sparkles, ShieldCheck } from "lucide-react";
import { SmartSeedButton } from "./smart-seed-button";
import { SmartSeedAssembliesButton } from "./smart-seed-assemblies-button";
import { ExportCatalogButton } from "./export-catalog-button";
import { ProCatalogGeneratorButton } from "./pro-catalog-generator-button";

export function StarterContentPanel() {
  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-blue-950/30 dark:via-slate-900 dark:to-indigo-950/30 dark:border-blue-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 dark:bg-blue-900/50 rounded-lg p-2">
              <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-2xl text-blue-900 dark:text-blue-100">
                Baza Danych i Konfiguracja
              </CardTitle>
              <CardDescription className="text-blue-700 dark:text-blue-300 mt-1">
                Uzupełnij swoją bazę danych gotowymi materiałami i zestawami
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700">
            <ShieldCheck className="w-3 h-3 mr-1" />
            Bezpieczne
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Info Alert */}
        <Alert className="bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700">
          <Database className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-800 dark:text-blue-300 text-sm">
            <strong>Jak to działa?</strong> System sprawdzi każdą pozycję i doda tylko te, których jeszcze nie masz. 
            <span className="font-semibold"> Istniejące pozycje zostaną pominięte - zero duplikatów!</span>
          </AlertDescription>
        </Alert>

        {/* Seed Buttons Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left: Catalog Items Seed */}
          <div className="flex flex-col justify-between h-full space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">
                  Katalog Pozycji (Materiały)
                </h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Zawiera <strong className="text-blue-600 dark:text-blue-400">~800 pozycji rynkowych</strong> - 
                Kable, Osprzęt, Rozdzielnice, Smart Home, Monitoring, Fotowoltaika (Mieszkanie, Biuro, Przemysł).
              </p>
              
              {/* Benefits Section */}
              <div className="mt-4 mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                Co zyskujesz?
              </div>
              <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-start gap-2">
                  <span>⏱️</span>
                  <span><strong>Oszczędność Czasu:</strong> Ponad 12 godzin ręcznego wpisywania.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span>📊</span>
                  <span><strong>Precyzja:</strong> Ceny oparte na analizie rynku (16 województw).</span>
                </div>
                <div className="flex items-start gap-2">
                  <span>🛡️</span>
                  <span><strong>Bezpieczeństwo:</strong> Import nie nadpisuje Twoich własnych cen.</span>
                </div>
              </div>
            </div>
            
            <SmartSeedButton />
          </div>

          {/* Right: Assemblies Seed */}
          <div className="flex flex-col justify-between h-full space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Boxes className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">
                  Katalog Funkcji (Zestawy)
                </h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Dodaje <strong className="text-purple-600 dark:text-purple-400">44 gotowych zestawów</strong> elektrycznych 
                (Gniazda, Oświetlenie, Smart Home, Rozdzielnice, Teletechnika, Biuro, Hala).
              </p>
              
              {/* Benefits Section */}
              <div className="mt-4 mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                Dlaczego zestawy?
              </div>
              <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-start gap-2">
                  <span>⚡</span>
                  <span><strong>Szybkość:</strong> Dodaj cały punkt instalacyjny jednym kliknięciem.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span>🎯</span>
                  <span><strong>Dokładność:</strong> Normy czasowe i materiały wg. PN-HD.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span>🔧</span>
                  <span><strong>Elastyczność:</strong> Edytuj i twórz własne zestawy.</span>
                </div>
              </div>
            </div>
            
            <SmartSeedAssembliesButton />
          </div>
        </div>

        {/* Bottom Info */}
        <div className="pt-4 border-t border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-slate-700 dark:text-slate-300">
              <p className="font-medium text-slate-900 dark:text-slate-100 mb-1">
                Bezpieczne dodawanie - Nie tworzy duplikatów
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Możesz kliknąć te przyciski wielokrotnie bez obaw. System automatycznie pominie pozycje, 
                które już istnieją w Twojej bazie danych.
              </p>
            </div>
          </div>
        </div>

        {/* Admin Tools */}
        <div className="pt-6 border-t-2 border-purple-200 dark:border-purple-800 space-y-4">
          <div>
            <h3 className="font-semibold text-lg text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Generator Bazy PRO (Standard + Matrix)
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Wygeneruj kompletną bazę danych <strong className="text-purple-600 dark:text-purple-400">(~606 pozycji)</strong> łączącą 
              materiały, robociznę i zestawy w jednej operacji. Obejmuje:
            </p>
            <ul className="text-sm text-slate-600 dark:text-slate-400 mb-4 space-y-1 list-disc list-inside">
              <li><strong>Standard:</strong> Mieszkania, Domy (Gniazda, Oświetlenie, WLZ)</li>
              <li><strong>Matrix:</strong> Biura, Przemysł (Kable 240mm², Trasy, MCCB, SSWiN)</li>
              <li><strong>Dodatkowe:</strong> Smart Home, Monitoring, Fotowoltaika, Demontaże</li>
            </ul>
            <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3 mb-4">
              <p className="text-xs text-purple-900 dark:text-purple-100">
                <strong>⚡ Oszczędność czasu:</strong> ~20+ godzin ręcznego wpisywania | 
                <strong> Kompleksowa baza</strong> dla wszystkich typów projektów
              </p>
            </div>
            <ProCatalogGeneratorButton isPro={true} />
          </div>
          
          <div className="pt-4 border-t border-amber-200 dark:border-amber-800">
            <h3 className="font-semibold text-sm text-amber-900 dark:text-amber-100 mb-2">
              Eksport Katalogu (Admin)
            </h3>
            <ExportCatalogButton />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
