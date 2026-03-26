"use client";
import React from "react";
import { Info } from "lucide-react";

export function PanelEmptyState() {
  return (
    <div className="rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 p-4 space-y-3 shadow-sm">
      <div className="flex items-center gap-2">
        <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
        <h3 className="text-xs font-bold text-blue-800 dark:text-blue-300">Jak zacząć?</h3>
      </div>
      <div className="space-y-1.5 text-[10px] text-slate-700 dark:text-slate-300 leading-relaxed">
        <p><strong className="text-blue-600">1.</strong> Wybierz <strong>obudowę</strong> (24-288 modułów) z listy powyżej</p>
        <p><strong className="text-blue-600">2.</strong> Kliknij <strong>moduł z katalogu</strong> z lewej strony → dodaj do szyny DIN</p>
        <p><strong className="text-blue-600">3.</strong> Ustaw <strong>rating</strong> (np. 16A, 40A) klikając na moduł</p>
        <p><strong className="text-blue-600">4.</strong> Dodaj <strong>label</strong> (opis obwodu: &quot;Kuchnia gniazdka&quot;)</p>
        <p><strong className="text-blue-600">5.</strong> Przejdź do <strong>Schemat</strong> → AI wygeneruje schemat wieloliniowy</p>
        <p className="pt-2 mt-2 border-t border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-400 font-medium">
          💡 <strong>Tip:</strong> Użyj <strong className="text-orange-600">ES-Engine</strong> (pomarańczowy przycisk) aby zaprojektować automatycznie!
        </p>
      </div>
    </div>
  );
}
