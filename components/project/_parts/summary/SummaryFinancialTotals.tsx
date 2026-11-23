"use client";

import { useState } from "react";
import { LayoutGrid, ChevronDown, ChevronUp, Zap } from "lucide-react";
import { BlurredPrice } from "@/components/ui/blurred-price";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SectionBreakdownItem {
  name: string;
  mat: number;
  lab: number;
  count: number;
  total: number;
}

interface Totals {
  materialTotal: number;
  laborTotal: number;
  baseSubtotal: number;
  subtotal: number;
  kpAmount: number;
  zAmount: number;
  kzAmount: number;
  totalNarzuty: number;
  subtotalWithNarzuty: number;
  contingencyAmount?: number;        // v3.0: rezerwa budżetowa amount
  subtotalWithContingency?: number;  // v3.0: subtotalWithNarzuty + contingency
  vatAmount: number;
  grandTotal: number;
  adjustmentAmount: number;
  // Clean Table architecture additions
  sumaBazowaNetto: number;         // Σ raw base prices × qty (no region, no adj)
  regionalCorrectionAmount: number; // sumaBazowaNetto × (regionModifier - 1)
  regionModifier: number;
  regionName: string;
  // VAT breakdown (optional — for split 8%/23% display)
  vatMaterialAmount?: number;  // VAT on materials
  vatLaborAmount?: number;     // VAT on labor
  vatMaterialRate?: number;    // e.g. 23
  vatLaborRate?: number;       // e.g. 8
}


interface SummaryFinancialTotalsProps {
  totals: Totals;
  isPro: boolean;
  vatRate: number;
  vatRateMaterial?: number; // separate VAT rate for materials (default = vatRate)
  vatRateLabor?: number;    // separate VAT rate for labor (default = vatRate)
  bruttoMode?: boolean;
  materialsOwnedByCustomer: boolean;
  sectionBreakdown: SectionBreakdownItem[];
  projectId: string;
  equipmentTotal?: number;
}

export function SummaryFinancialTotals({
  totals,
  isPro,
  vatRate,
  vatRateMaterial,
  vatRateLabor,
  bruttoMode = false,
  materialsOwnedByCustomer,
  sectionBreakdown,
  projectId: _projectId,
  equipmentTotal = 0,
}: SummaryFinancialTotalsProps) {
  // VAT breakdown: use separate rates if provided, otherwise single rate for both
  const effectiveVatMat = vatRateMaterial ?? vatRate;
  const effectiveVatLab = vatRateLabor ?? vatRate;
  const vatOnMat = Math.round(totals.materialTotal * (effectiveVatMat / 100) * 100) / 100;
  const vatOnLab = Math.round(totals.laborTotal * (effectiveVatLab / 100) * 100) / 100;
  const totalVat = Math.round((vatOnMat + vatOnLab) * 100) / 100;
  const effectiveNettoBase = totals.subtotalWithContingency ?? totals.subtotalWithNarzuty;
  const totalBrutto = Math.round((effectiveNettoBase + totalVat) * 100) / 100;
  const [showSectionBreakdown, setShowSectionBreakdown] = useState(false);

  const hasSections =
    sectionBreakdown.length > 1 ||
    (sectionBreakdown.length === 1 && sectionBreakdown[0].name !== "Inne pozycje");

  return (
    <div className="space-y-2">
      {bruttoMode ? (
        <div className="rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50/70 dark:bg-amber-950/20 px-3 py-2.5">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
              Razem brutto
            </span>
            <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
              <BlurredPrice value={totalBrutto} isPro={isPro} showBadge={!isPro} />
            </span>
          </div>
          <div className="mt-1.5 flex justify-between items-center text-[11px] text-slate-500">
            <span>Netto</span>
            <BlurredPrice value={effectiveNettoBase} isPro={isPro} showBadge={!isPro} />
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-500">
            <span>VAT {vatRate}%</span>
            <BlurredPrice value={totalVat} isPro={isPro} showBadge={!isPro} />
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/20 px-3 py-2.5">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              Suma netto
            </span>
            <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400">
              <BlurredPrice value={effectiveNettoBase} isPro={isPro} showBadge={!isPro} />
            </span>
          </div>
          <div className="mt-1.5 flex justify-between items-center text-[11px] text-slate-500">
            <span>VAT {vatRate}% doliczysz osobno</span>
            <BlurredPrice value={totalVat} isPro={isPro} showBadge={!isPro} />
          </div>
        </div>
      )}

      {!materialsOwnedByCustomer && (
        <div className="flex justify-between items-center py-1.5 pl-2.5 border-l-2 border-amber-200 dark:border-amber-800">
          <span className="text-xs text-muted-foreground">M — Materiały</span>
          <span className="text-sm text-muted-foreground">
            <BlurredPrice value={totals.materialTotal} isPro={isPro} showBadge={!isPro} />
          </span>
        </div>
      )}
      <div className="flex justify-between items-center py-1.5 pl-2.5 border-l-2 border-emerald-200 dark:border-emerald-800">
        <span className="text-xs text-muted-foreground">R — Robocizna</span>
        <span className="text-sm text-muted-foreground">
          <BlurredPrice value={totals.laborTotal} isPro={isPro} showBadge={!isPro} />
        </span>
      </div>
      {equipmentTotal > 0 && (
        <div className="flex justify-between items-center py-1.5 pl-2.5 border-l-2 border-violet-300 dark:border-violet-700">
          <span className="text-xs text-violet-600 dark:text-violet-400 flex items-center gap-1">
            <Zap className="w-2.5 h-2.5" />
            S — Sprzęt
          </span>
          <span className="text-sm text-violet-600 dark:text-violet-400">
            <BlurredPrice value={equipmentTotal} isPro={isPro} showBadge={!isPro} />
          </span>
        </div>
      )}

      <div className="flex justify-between items-start py-1.5 gap-2">
        <span className="text-xs text-muted-foreground flex flex-col gap-0.5 min-w-0">
          <span className="flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
            Województwo
          </span>
          <span className="text-[10px] text-orange-500 font-semibold pl-2.5">
            ×{totals.regionModifier.toFixed(2)} ({totals.regionName})
          </span>
        </span>
        <span className={`text-xs font-medium flex-shrink-0 pt-0.5 ${totals.regionalCorrectionAmount > 0 ? "text-orange-500" : totals.regionalCorrectionAmount < 0 ? "text-blue-500" : "text-slate-400"}`}>
          {totals.regionalCorrectionAmount > 0 ? "+" : ""}
          <BlurredPrice value={totals.regionalCorrectionAmount} isPro={isPro} />
        </span>
      </div>

      <div className="flex justify-between items-center py-1">
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-[11px] text-muted-foreground border-b border-dotted border-muted-foreground/40 cursor-help">
                Przed województwem
              </span>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-[260px] text-[11px] leading-snug">
              Cena z wierszy, zanim doliczysz województwo. Klientowi podajesz sumę u góry.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <span className="text-[11px] text-muted-foreground">
          <BlurredPrice value={totals.sumaBazowaNetto} isPro={isPro} showBadge={!isPro} />
        </span>
      </div>

      {totals.totalNarzuty > 0 && (
        <div className="flex justify-between items-center py-1.5 text-indigo-600 dark:text-indigo-400">
          <span className="text-xs flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
            Narzuty (Kp+Z+Kz)
          </span>
          <span className="text-xs font-semibold">
            +<BlurredPrice value={totals.totalNarzuty} isPro={isPro} showBadge={!isPro} />
          </span>
        </div>
      )}

      {(totals.contingencyAmount ?? 0) > 0 && (
        <div className="flex justify-between items-center py-1.5 text-orange-600 dark:text-orange-400">
          <span className="text-xs flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
            Rezerwa budżetowa
          </span>
          <span className="text-xs font-semibold">
            +<BlurredPrice value={totals.contingencyAmount!} isPro={isPro} showBadge={!isPro} />
          </span>
        </div>
      )}

      {hasSections && (
        <div className="pt-1">
          <button
            onClick={() => setShowSectionBreakdown(!showSectionBreakdown)}
            className="flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors w-full"
          >
            <LayoutGrid className="w-3 h-3" />
            <span className="font-medium">Podział wg pomieszczeń</span>
            {showSectionBreakdown ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
          </button>
          {showSectionBreakdown && (
            <div className="mt-2 space-y-1.5 pl-1 border-l-2 border-purple-200 dark:border-purple-800">
              {sectionBreakdown.map((sec) => (
                <div key={sec.name} className="flex justify-between items-center pl-2">
                  <span className="text-[11px] text-purple-700 dark:text-purple-300 truncate max-w-[120px]" title={sec.name}>
                    {sec.name} <span className="text-purple-400 dark:text-purple-500">({sec.count})</span>
                  </span>
                  <span className="text-[11px] font-medium text-purple-800 dark:text-purple-200">
                    <BlurredPrice value={sec.total} isPro={isPro} showBadge={!isPro} />
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
