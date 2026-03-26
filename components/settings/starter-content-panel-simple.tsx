"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Database, ShieldCheck, Sparkles } from "lucide-react";

interface StarterContentPanelSimpleProps {
  isPro?: boolean;
  catalogStats?: {
    globalCount: number;
    userCount: number;
    totalCount: number;
    hiddenCount: number;
  };
}

export function StarterContentPanelSimple({ isPro = false, catalogStats }: StarterContentPanelSimpleProps) {
  const stats = catalogStats || { globalCount: 0, userCount: 0, totalCount: 0, hiddenCount: 0 };

  return (
    <div className="space-y-6">
      {/* Main Info Card */}
      <Alert className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border-2 border-purple-200 dark:border-purple-800">
        <Database className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        <AlertDescription className="text-slate-900 dark:text-slate-100">
          <p className="font-semibold text-lg mb-2">
            ⚡ Baza Norm KNR i ES-Engine
          </p>
          <p className="text-sm mb-3">
            System opiera się na wbudowanych normach roboczogodzin (KNR 5-08, 4-03) oraz inteligentnym silniku ES-Engine.
            {stats.userCount > 0 ? (
              <> Dodatkowo posiadasz <span className="font-bold text-purple-600 dark:text-purple-400">{stats.userCount}</span> Twoich własnych pozycji w prywatnym katalogu.</>
            ) : (
              <> Dodawaj własne pozycje w zakładce <strong>Katalog</strong>, aby rozbudować prywatną bazę.</>
            )}
          </p>
          {stats.hiddenCount > 0 && (
            <p className="text-sm mb-3 text-amber-700 dark:text-amber-400">
              ⚠️ Masz <span className="font-semibold">{stats.hiddenCount}</span> ukrytych pozycji. 
              Przejdź do zakładki <strong>"Katalog & Dane"</strong> aby je przywrócić.
            </p>
          )}
          <div className="bg-white/70 dark:bg-slate-900/50 rounded-lg p-3 mt-3 border border-purple-200 dark:border-purple-800">
            <p className="text-xs text-slate-700 dark:text-slate-300">
              <strong>💡 Jak korzystać:</strong>
            </p>
            <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-400 mt-1 space-y-1">
              <li>Wyszukuj gotowe <strong>Zestawy</strong> i <strong>Pozycje</strong> bezpośrednio w Kreatorze.</li>
              <li>System automatycznie rozbija Zestawy na <strong>Robociznę (r-g)</strong> i <strong>Materiały</strong>.</li>
              <li>Dodawaj własne, niestandardowe pozycje w zakładce <strong>Katalog</strong>, aby dostosować system do swoich potrzeb.</li>
            </ul>
          </div>
        </AlertDescription>
      </Alert>

      {/* Control Panel */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border-2 border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Zarządzanie Katalogiem</h3>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Wszystkie funkcje zarządzania katalogiem znajdują się na tej stronie.
        </p>
        <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
          <li className="flex items-start gap-2">
            <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
            <span><strong>Katalog / Własne:</strong> Przełączaj widok w sidebarze Katalogu — globalny lub tylko Twoje pozycje</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
            <span><strong>Własne Pozycje:</strong> Dodawaj niestandardowe pozycje w zakładce Katalog</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-600 dark:text-amber-400 font-bold">⚡</span>
            <span><strong>ES-Engine:</strong> Automatyczne przeliczanie norm czasowych w oparciu o wybrane województwo.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400 font-bold">�️</span>
            <span><strong>Zarządzanie prywatną bazą:</strong> Dodawaj, edytuj i usuwaj własne pozycje materiałowe oraz usługi.</span>
          </li>
        </ul>
      </div>

      {/* Safety Note */}
      <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
        <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-slate-700 dark:text-slate-300">
          <p className="font-medium text-slate-900 dark:text-slate-100 mb-1">
            🔒 Ochrona Globalnych Pozycji
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Globalne pozycje są chronione przed przypadkowym usunięciem. Możesz je tylko ukryć
            lub edytować (system automatycznie utworzy Twoją osobistą kopię z sufiksem <strong>(Moja)</strong>).
          </p>
        </div>
      </div>

    </div>
  );
}
