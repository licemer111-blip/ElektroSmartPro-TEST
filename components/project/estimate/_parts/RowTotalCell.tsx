"use client";

import { TableCell } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BlurredPrice } from "@/components/ui/blurred-price";
import { cn } from "@/lib/utils";
import { roundPrice } from "@/hooks/use-global-settings";
import type { ProjectItem } from "@/lib/types/database";

// ── Calculation chain parser ────────────────────────────────────────────────
interface CalcModifiers {
  norm: number | null;
  cable: number | null;
  surface: number | null;
  laborMod: number | null;
}

function parseCalcModifiers(note: string | null | undefined): CalcModifiers {
  if (!note) return { norm: null, cable: null, surface: null, laborMod: null };
  const normMatch    = note.match(/norma:\s*([\d.]+)\s*rbh/);
  const cableMatch   = note.match(/\u00d7([\d.]+)\s*kabel/);
  const surfaceMatch = note.match(/\u00d7([\d.]+)\s*pod[\u0142l]/i);
  const laborMatch   = note.match(/\u00d7([\d.]+)\s*KNR/);
  return {
    norm:     normMatch    ? parseFloat(normMatch[1])    : null,
    cable:    cableMatch   ? parseFloat(cableMatch[1])   : null,
    surface:  surfaceMatch ? parseFloat(surfaceMatch[1]) : null,
    laborMod: laborMatch   ? parseFloat(laborMatch[1])   : null,
  };
}

const singleCellBorderClass = "border border-slate-300 dark:border-slate-700 bg-clip-padding align-top";

interface RowTotalCellProps {
  materialUnit: number;
  laborUnit: number;
  rowTotal: number;
  confidenceLevel: string | null | undefined;
  isPro: boolean;
  compactView: boolean;
  colorMode: boolean;
  bruttoMode: boolean;
  vatRate: number;
  adjustmentMultiplier: number;
  item: ProjectItem;
  regionModifier: number;
}

export function RowTotalCell({
  materialUnit, laborUnit, rowTotal,
  confidenceLevel, isPro, compactView, colorMode, bruttoMode, vatRate, adjustmentMultiplier,
  item, regionModifier,
}: RowTotalCellProps) {
  const isManualItem = confidenceLevel === "manual";
  const adjPct = Math.round((adjustmentMultiplier - 1) * 100 * 10) / 10;
  const rowTotalNetto = rowTotal;
  const rowTotalBrutto = roundPrice(rowTotalNetto * (1 + vatRate / 100));
  const rowUnitNetto = roundPrice(materialUnit + laborUnit);
  const rowUnitBrutto = roundPrice(rowUnitNetto * (1 + vatRate / 100));
  const hasAdj = Math.abs(adjPct) >= 0.1;
  const baseTotal = adjustmentMultiplier !== 0 ? rowTotalNetto / adjustmentMultiplier : rowTotalNetto;
  const adjAmount = rowTotalNetto - baseTotal;
  const isAnomalyHigh = rowTotalNetto > 100000;
  const displayTotal = bruttoMode ? rowTotalBrutto : rowTotalNetto;
  const displayUnit  = bruttoMode ? rowUnitBrutto  : rowUnitNetto;

  const content = (
    <div className="space-y-0.5">
      {!compactView && (
        <div className={cn(
          "text-[11px] text-right",
          colorMode ? "text-blue-400 dark:text-blue-600" : "text-slate-400 dark:text-slate-500",
        )}>
          <BlurredPrice value={displayUnit} isPro={isPro} /> /
        </div>
      )}
      <div className={cn(
        "font-bold flex items-center justify-end gap-1",
        compactView ? "text-sm" : "text-sm",
        isAnomalyHigh
          ? "text-red-600 dark:text-red-400"
          : colorMode
            ? "text-blue-700 dark:text-blue-300"
            : "text-slate-900 dark:text-slate-100",
      )}>
        {isAnomalyHigh && (
          <span title="⚠️ Anomalia cenowa! Suma > 100 000 zł — sprawdź cenę jednostkową" className="text-red-500 text-base">⚠️</span>
        )}
        <BlurredPrice value={displayTotal} isPro={isPro} />
      </div>
      {isAnomalyHigh && isPro && (
        <div className="text-[9px] text-red-500 dark:text-red-400 font-medium">Sprawdź ceny!</div>
      )}
      {bruttoMode && isPro && vatRate > 0 && (
        <div className="text-[9px] text-slate-400 dark:text-slate-500">
          netto: {rowTotalNetto.toFixed(2)} zł
        </div>
      )}
    </div>
  );

  // ── Calculation chain (Task 5.1) ──────────────────────────────────────────
  const mods = parseCalcModifiers(item.confidence_note);
  const effectiveNorm = mods.norm ?? item.labor_norm ?? null;
  const baseLabor = item.final_labor_price ?? item.labor_price ?? 0;
  const effectiveLaborUnit = baseLabor * regionModifier;
  const equipmentUnit = (item.equipment_price ?? 0);
  const equipmentTotal = roundPrice(equipmentUnit * item.quantity);
  const effectiveRate = effectiveNorm && effectiveNorm > 0
    ? roundPrice(effectiveLaborUnit / effectiveNorm)
    : null;
  const hasCalcDetail = isPro && (effectiveNorm != null || equipmentUnit > 0);
  const hasTooltip = isPro && (hasAdj || hasCalcDetail);

  const tooltipContent = (
    <div className="space-y-1 min-w-[210px] max-w-[260px]">
      {/* ── Robocizna breakdown ── */}
      {effectiveNorm != null && (
        <>
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide pb-0.5 border-b border-slate-200 dark:border-slate-700">
            R — Robocizna
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-400">Norma KNR:</span>
            <span className="font-medium">{effectiveNorm.toFixed(3)} rbh/jm</span>
          </div>
          {mods.cable != null && (
            <div className={cn("flex justify-between gap-3", mods.cable > 1.0 ? "text-amber-500" : "text-slate-400")}>
              <span>× Przekrój kabla:</span>
              <span className="font-semibold">{mods.cable.toFixed(2)}</span>
            </div>
          )}
          {mods.surface != null && (
            <div className={cn("flex justify-between gap-3", mods.surface > 1.0 ? "text-amber-500" : "text-slate-400")}>
              <span>× Podłoże:</span>
              <span className="font-semibold">{mods.surface.toFixed(2)}</span>
            </div>
          )}
          {mods.laborMod != null && (
            <div className={cn("flex justify-between gap-3", mods.laborMod > 1.0 ? "text-amber-500" : "text-slate-400")}>
              <span>× KNR (wys./trudn.):</span>
              <span className="font-semibold">{mods.laborMod.toFixed(3)}</span>
            </div>
          )}
          {regionModifier !== 1.0 && (
            <div className={cn("flex justify-between gap-3", regionModifier > 1.0 ? "text-amber-500" : "text-blue-400")}>
              <span>× Region:</span>
              <span className="font-semibold">{regionModifier.toFixed(2)}</span>
            </div>
          )}
          {effectiveRate != null && (
            <div className="flex justify-between gap-3 text-emerald-600 dark:text-emerald-400">
              <span>= Stawka efektywna:</span>
              <span className="font-bold">{effectiveRate.toFixed(2)} zł/rbh</span>
            </div>
          )}
          <div className="flex justify-between gap-3 font-medium">
            <span className="text-slate-400">Rob. /jm:</span>
            <span>{laborUnit.toFixed(2)} zł</span>
          </div>
        </>
      )}
      {/* ── Materiały ── */}
      {materialUnit > 0 && (
        <>
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide pb-0.5 border-b border-slate-200 dark:border-slate-700 mt-1">
            M — Materiały
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-400">Mat. /jm:</span>
            <span className="font-medium">{materialUnit.toFixed(2)} zł</span>
          </div>
        </>
      )}
      {/* ── Sprzęt (S) ── */}
      {equipmentUnit > 0 && (
        <>
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide pb-0.5 border-b border-slate-200 dark:border-slate-700 mt-1">
            S — Sprzęt
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-400">Wynajem /jm:</span>
            <span className="font-medium">{equipmentUnit.toFixed(2)} zł</span>
          </div>
        </>
      )}
      {/* ── Negocjacje ── */}
      {hasAdj && (
        <>
          <div className="border-t border-slate-200 dark:border-slate-700 mt-1 pt-1" />
          <div className="flex justify-between gap-3">
            <span className="text-slate-400">{isManualItem ? "Baza (Manual):" : "Baza netto:"}</span>
            <span className="font-medium">{baseTotal.toFixed(2)} zł</span>
          </div>
          <div className={cn("flex justify-between gap-3", adjPct > 0 ? "text-green-500" : "text-red-400")}>
            <span>Negocjacje ({adjPct > 0 ? "+" : ""}{adjPct}%):</span>
            <span className="font-semibold">{adjPct > 0 ? "+" : ""}{adjAmount.toFixed(2)} zł</span>
          </div>
        </>
      )}
      {/* ── Suma ── */}
      <div className="flex justify-between gap-3 border-t border-slate-300 dark:border-slate-600 pt-1 font-bold">
        <span>Suma netto:</span>
        <span className="text-blue-500">{rowTotalNetto.toFixed(2)} zł</span>
      </div>
      {equipmentTotal > 0 && (
        <div className="flex justify-between gap-3 text-[10px] text-slate-400">
          <span>w tym Sprzęt:</span>
          <span>{equipmentTotal.toFixed(2)} zł</span>
        </div>
      )}
      <div className="flex justify-between gap-3 text-amber-500">
        <span>+ VAT ({vatRate}%):</span>
        <span>{(rowTotalBrutto - rowTotalNetto).toFixed(2)} zł</span>
      </div>
      <div className="flex justify-between gap-3 font-bold text-amber-600">
        <span>Brutto:</span>
        <span>{rowTotalBrutto.toFixed(2)} zł</span>
      </div>
    </div>
  );

  return (
    <TableCell className={cn(
      `text-right min-w-[110px] w-[110px] ${singleCellBorderClass}`,
      colorMode ? "bg-blue-50/70 dark:bg-blue-950/20" : "bg-slate-50/50 dark:bg-slate-900/10",
    )}>
      {!hasTooltip ? content : (
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help">{content}</div>
            </TooltipTrigger>
            <TooltipContent side="left" className="text-xs p-2">
              {tooltipContent}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </TableCell>
  );
}
