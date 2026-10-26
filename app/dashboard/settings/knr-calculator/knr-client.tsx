"use client";

// ═══════════════════════════════════════════════════════════════════
// knr-client.tsx — Centrum Kalkulacji shell
// Główne: Lokalizacja + Hierarchia wycen (L1/L2/L3)
// Zaawansowane (accordion): Sandbox · Kalibracja · Kontekst
// ═══════════════════════════════════════════════════════════════════

import { useState } from "react";
import Link from "next/link";
import { useEngineCalibration } from "@/hooks/use-engine-calibration";
import { useSearchMode } from "@/hooks/use-search-mode";
import { SearchModeSelector } from "@/components/catalog/SearchModeSelector";
import { BrainCog, ChevronDown, Settings2, ArrowLeft } from "lucide-react";
import { KnrImportForm } from "./_parts/KnrImportForm";
import { KnrEngineCalibration } from "./_parts/KnrEngineCalibration";
import { KnrInvestmentContext } from "./_parts/KnrInvestmentContext";
import { KnrSandbox } from "./_parts/KnrSandbox";
import { getRegionById, type PolishRegion } from "@/lib/config/regions";

interface DbRegion {
  id: string;
  name: string;
  slug: string;
  price_modifier: number;
}

interface KnrClientProps {
  initialRate: number;
  initialMaterialMultiplier?: number;
  initialMaterialMargin?: number;
  isPro: boolean;
  initialUseCustomRates?: boolean;
  initialCustomLaborRate?: number | null;
  /** UUID from profiles.default_region_id */
  initialRegionUuid?: string | null;
  /** DB regions for UUID⇒slug conversion in KnrRegionSelector */
  dbRegions?: DbRegion[];
  /** Sprint v1.2: investment context from DB (profiles.investment_context) */
  initialInvestmentContext?: string;
}

function SectionDivider({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
        <Icon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide leading-none">{title}</p>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-none">{subtitle}</p>
      </div>
      <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
    </div>
  );
}

export function KnrClient({ initialRate, initialMaterialMultiplier = 1.08, initialMaterialMargin = 15, isPro, initialUseCustomRates = false, initialCustomLaborRate = null, initialRegionUuid = null, dbRegions = [], initialInvestmentContext = "" }: KnrClientProps) {
  const hourlyRate = initialRate > 0 ? initialRate : 0;
  const hourlyInput = initialRate > 0 ? String(initialRate) : "";
  const useCustomRates = initialUseCustomRates;
  const customLaborRate = initialCustomLaborRate;
  void initialMaterialMultiplier;
  void initialMaterialMargin;

  const effectiveBaseRate = useCustomRates
    ? (customLaborRate ?? hourlyRate)
    : hourlyRate;

  const { mode: searchMode, setMode: setSearchMode } = useSearchMode();
  const { calibration, setCalibration } = useEngineCalibration();
  const [investmentContext, setInvestmentContext] = useState(initialInvestmentContext);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const initialSlug = dbRegions.find(r => r.id === (initialRegionUuid ?? ""))?.slug;
  const [currentRegion] = useState<PolishRegion | undefined>(
    getRegionById(initialSlug)
  );
  const regionMultiplier = currentRegion?.multiplier ?? 1.0;

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-16">

      {/* Back link to main settings Finanse tab */}
      <Link
        href="/dashboard/settings?tab=knr"
        className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Wróć do stawek
      </Link>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 space-y-2">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Co widać w kreatorze i katalogu</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Ten sam przełącznik, co w bocznym panelu kosztorysu. Moje — tylko Twoje pozycje. Baza — tylko baza ES. Razem — obie listy, Twoje na górze.
        </p>
        <SearchModeSelector mode={searchMode} onChange={setSearchMode} className="w-full max-w-md" />
      </div>

      <KnrImportForm />

      <div className="space-y-4">
          <button
            onClick={() => setShowAdvanced((v) => !v)}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 bg-white dark:bg-slate-900 transition-colors group"
          >
            <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
              <Settings2 className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Sprawdź normę i opis obiektu</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 hidden sm:inline">Wyszukiwanie godzin · montaż · opis dla AI</span>
            <ChevronDown className={`w-4 h-4 text-slate-400 ml-auto flex-shrink-0 transition-transform duration-200 ${showAdvanced ? "rotate-180" : ""}`} />
          </button>

          {showAdvanced && (
            <div className="space-y-4">
              <KnrSandbox
                hourlyRate={effectiveBaseRate}
                hourlyInput={hourlyInput}
                isPro={isPro}
                useCustomRates={useCustomRates}
                regionMultiplier={regionMultiplier}
                regionName={currentRegion?.name}
                sensitivity={calibration.sensitivity}
                defaultMontage={calibration.defaultMontage}
                investmentContext={investmentContext}
              />

              <SectionDivider
                icon={BrainCog}
                title="Inteligencja ES-Engine"
                subtitle="Sposób montażu i opis obiektu. Nie zmieniają stawki ani województwa."
              />
              <KnrEngineCalibration
                calibration={calibration}
                onChange={setCalibration}
              />
              <KnrInvestmentContext
                value={investmentContext}
                onChange={setInvestmentContext}
              />
            </div>
          )}
      </div>

    </div>
  );
}
