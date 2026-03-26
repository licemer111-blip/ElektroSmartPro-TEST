"use client";

// ═══════════════════════════════════════════════════════════════════
// rozdzielnica/_parts/ModuleSearch.tsx
// Search input + catalog mode toggle + AI action buttons
// ═══════════════════════════════════════════════════════════════════

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap, Loader2 } from "lucide-react";

interface ModuleSearchProps {
  moduleSearch: string;
  setModuleSearch: (v: string) => void;
  catalogMode: "default" | "custom";
  setCatalogMode: (mode: "default" | "custom") => void;
  selectedSlot: { rowIdx: number; slotIdx: number } | null;
  isFinal: boolean;
  setShowAiPanel: React.Dispatch<React.SetStateAction<boolean>>;
  setAiDescription: React.Dispatch<React.SetStateAction<string>>;
  handleAIPricing: () => void;
  isWycenLoading: boolean;
  allModulesCount: number;
}

export function ModuleSearch({
  moduleSearch,
  setModuleSearch,
  catalogMode,
  setCatalogMode,
  selectedSlot,
  isFinal,
  setShowAiPanel,
  setAiDescription,
  handleAIPricing,
  isWycenLoading,
  allModulesCount,
}: ModuleSearchProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* Slot status banner */}
      {!isFinal && (
        selectedSlot ? (
          <div className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-300 dark:border-blue-700 text-[10px] font-semibold text-blue-700 dark:text-blue-300">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse flex-shrink-0" />
            Miejsce R{selectedSlot.rowIdx + 1} aktywne — kliknij urządzenie aby umieścić
          </div>
        ) : (
          <div className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-[10px] text-slate-500 dark:text-slate-400">
            <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 flex-shrink-0" />
            Wybierz miejsce na szynie lub kliknij urządzenie (doda na końcu)
          </div>
        )
      )}

      {/* Search + AI action buttons */}
      <div className="flex gap-1.5">
        <Input
          id="rozdzielnica-module-search"
          name="rozdzielnica-module-search"
          aria-label="Szukaj urządzenia w katalogu rozdzielnicy"
          value={moduleSearch}
          onChange={(e) => setModuleSearch(e.target.value)}
          placeholder="🔍 Szukaj urządzenia w katalogu..."
          className="h-9 text-xs font-medium flex-1 shadow-sm"
        />
        <Button
          size="lg"
          className="h-9 px-2.5 gap-1.5 flex-shrink-0 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold shadow-lg"
          onClick={() => setShowAiPanel(true)}
          title="ES-Engine — zaprojektuj rozdzielnicę automatycznie"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="text-[11px]">ES-Engine</span>
        </Button>
        <Button
          size="lg"
          className="h-9 px-2.5 gap-1.5 flex-shrink-0 bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-lg"
          onClick={handleAIPricing}
          disabled={isWycenLoading || allModulesCount === 0}
          title="Wyceń rozdzielnicę wg KNR 2026 (AI)"
        >
          {isWycenLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
          <span className="text-[11px]">Wyceń</span>
        </Button>
      </div>

      {/* Catalog mode toggle */}
      <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 border-2 border-slate-200 dark:border-slate-700 shadow-sm">
        <button
          onClick={() => setCatalogMode("default")}
          className={`flex-1 text-[11px] font-semibold py-1 rounded-md transition-all ${
            catalogMode === "default" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Katalog
        </button>
        <button
          onClick={() => setCatalogMode("custom")}
          className={`flex-1 text-[11px] font-semibold py-1 rounded-md transition-all ${
            catalogMode === "custom" ? "bg-violet-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Własne
        </button>
      </div>

      {/* Empty search hint — shown inline when no query */}
      {!moduleSearch && catalogMode === "default" && (
        <p className="text-[10px] text-slate-400 dark:text-slate-500 px-0.5">
          Wpisz: 40A, 3P, RCD, SPD, B16... lub kliknij kategorię poniżej
        </p>
      )}
    </div>
  );
}
