"use client";

// ═══════════════════════════════════════════════════════════════════
// knr-client.tsx — Centrum Kalkulacji shell
// Główne: Lokalizacja + Hierarchia wycen (P1/P2/AI)
// Zaawansowane (accordion): Współczynniki · Sandbox · Kalibracja · Kontekst
// ═══════════════════════════════════════════════════════════════════

import { useState } from "react";
import { useEngineCalibration } from "@/hooks/use-engine-calibration";
import { useSearchMode } from "@/hooks/use-search-mode";
import { FolderOpen, SlidersHorizontal, Banknote, BrainCog, MapPin, ChevronDown, Settings2 } from "lucide-react";
import { KnrImportForm } from "./_parts/KnrImportForm";
import { KnrEngineCalibration } from "./_parts/KnrEngineCalibration";
import { KnrInvestmentContext } from "./_parts/KnrInvestmentContext";
import { KnrRateCalculator } from "./_parts/KnrRateCalculator";
import { KnrSandbox } from "./_parts/KnrSandbox";
import { KnrRegionSelector } from "./_parts/KnrRegionSelector";
import { getRegionById, type PolishRegion } from "@/lib/config/regions";

type PageTab = "baza" | "centrum";

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
  const [pageTab, setPageTab] = useState<PageTab>("baza");
  const effectiveInitialRate = initialRate > 0 ? initialRate : 0;

  const [hourlyRate, setHourlyRate] = useState(effectiveInitialRate);
  const [hourlyInput, setHourlyInput] = useState(initialRate > 0 ? String(initialRate) : "");
  const [rateSaved, setRateSaved] = useState(initialRate > 0);

  const [useCustomRates, setUseCustomRates] = useState(initialUseCustomRates);
  const [customLaborRate, setCustomLaborRate] = useState<number | null>(initialCustomLaborRate);
  const [materialMultiplier, setMaterialMultiplier] = useState(initialMaterialMultiplier);
  const [materialMargin, setMaterialMargin] = useState(initialMaterialMargin);

  // Effective base rate for regional preview:
  // P1: custom/profile rate | P2: profiles.hourly_rate
  const effectiveBaseRate = useCustomRates
    ? (customLaborRate ?? hourlyRate)
    : hourlyRate;

  const { calibration, setCalibration } = useEngineCalibration();
  const { mode: searchMode } = useSearchMode();
  const [investmentContext, setInvestmentContext] = useState(initialInvestmentContext);
  const [showAdvanced, setShowAdvanced] = useState(true);
  const initialSlug = dbRegions.find(r => r.id === (initialRegionUuid ?? ""))?.slug;
  const [currentRegion, setCurrentRegion] = useState<PolishRegion | undefined>(
    getRegionById(initialSlug)
  );
  const regionMultiplier = currentRegion?.multiplier ?? 1.0;

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-16">

      {/* Tab switcher */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-0.5 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => setPageTab("baza")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              pageTab === "baza"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            Moje Dane
          </button>
          <button
            onClick={() => setPageTab("centrum")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              pageTab === "centrum"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Ustawienia
          </button>
        </div>
      </div>

      {/* Tab: Moja Baza KNR */}
      {pageTab === "baza" && <KnrImportForm />}

      {/* Tab: Centrum Kalkulacji — 3 sections */}
      {pageTab === "centrum" && (
        <div className="space-y-4">

          {/* ══ SEKCJA 0: LOKALIZACJA ════════════════════════════════════════════════════ */}
          <SectionDivider
            icon={MapPin}
            title="Lokalizacja"
            subtitle="Wójewództwo — współczynnik korygujący stawki r-g"
          />
          <KnrRegionSelector
            initialRegionUuid={initialRegionUuid}
            dbRegions={dbRegions}
            baseHourlyRate={effectiveBaseRate}
            onRegionChange={setCurrentRegion}
          />

          {/* ══ SEKCJA 1: FINANSE ════════════════════════════════════════════════════════ */}
          <SectionDivider
            icon={Banknote}
            title="Finanse"
            subtitle="Twoja stawka roboczogodziny (R-G) — podstawa wszystkich wycen kosztorysowych"
          />
          <KnrRateCalculator
            initialRate={effectiveInitialRate}
            hourlyRate={hourlyRate}
            setHourlyRate={setHourlyRate}
            hourlyInput={hourlyInput}
            setHourlyInput={setHourlyInput}
            rateSaved={rateSaved}
            setRateSaved={setRateSaved}
            useCustomRates={useCustomRates}
            setUseCustomRates={setUseCustomRates}
            customLaborRate={customLaborRate}
            setCustomLaborRate={setCustomLaborRate}
            materialMultiplier={materialMultiplier}
            setMaterialMultiplier={setMaterialMultiplier}
            materialMargin={materialMargin}
            setMaterialMargin={setMaterialMargin}
          />

          {/* ══ ZAAWANSOWANE USTAWIENIA (accordion) ═════════════════ */}
          <button
            onClick={() => setShowAdvanced((v) => !v)}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 bg-white dark:bg-slate-900 transition-colors group"
          >
            <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
              <Settings2 className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Zaawansowane ustawienia silnika</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 hidden sm:inline">Współczynniki · Kalibracja · Kontekst · Sandbox</span>
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
                subtitle="Kalibracja silnika: czułość dopasowań KNR + kontekst inwestycji"
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
      )}

    </div>
  );
}
