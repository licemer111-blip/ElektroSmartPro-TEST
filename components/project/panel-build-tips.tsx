"use client";
import React from "react";
import { LayoutGrid } from "lucide-react";
import { DIN_MODULES_COUNT, DIN_MODULES_CATEGORIES } from "@/lib/data/din-modules-stats";

export function PanelBuildTips() {
  return (
    <div className="mt-4 rounded-xl bg-gradient-to-r from-blue-50 via-slate-50 to-blue-50 dark:from-blue-950/30 dark:via-slate-900 dark:to-blue-950/30 border-2 border-blue-200 dark:border-blue-800 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold text-blue-800 dark:text-blue-300">ElektroSmart PRO — Konfigurator Rozdzielnic</h3>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-slate-600 dark:text-slate-400">
          <span>{DIN_MODULES_COUNT}+ modułów DIN</span>
          <span>·</span>
          <span>{DIN_MODULES_CATEGORIES} kategorii</span>
          <span>·</span>
          <span>ES-Engine</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[10px] text-slate-600 dark:text-slate-400">
        <div className="flex items-start gap-2">
          <span className="text-blue-600 font-bold flex-shrink-0">1.</span>
          <span>Wybierz <strong>obudowę</strong> → kliknij <strong>moduł z katalogu</strong></span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-blue-600 font-bold flex-shrink-0">2.</span>
          <span>Ustaw <strong>rating</strong> (16A, 40A) → dodaj <strong>label</strong></span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-blue-600 font-bold flex-shrink-0">3.</span>
          <span>Użyj <strong className="text-orange-600">ES-Engine</strong> do automatycznego projektu</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-blue-600 font-bold flex-shrink-0">4.</span>
          <span><strong>Schemat</strong> → wygeneruj schemat wieloliniowy</span>
        </div>
      </div>
    </div>
  );
}
