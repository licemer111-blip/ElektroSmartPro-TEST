"use client";

import React from "react";
import { Zap, Hammer, Package, ArrowRight, Info } from "lucide-react";
import {
  expandToAssembly,
  SECTOR_LABELS,
  type ProjectSector,
  type SmartExpansionResult,
} from "@/lib/ai/smart-mapping-engine";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SmartAssemblyPanelProps {
  itemName: string;
  quantity: number;
  sector: ProjectSector;
  laborRate: number;
  knrMultiplier: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SmartAssemblyPanel({
  itemName,
  quantity,
  sector,
  laborRate,
  knrMultiplier,
}: SmartAssemblyPanelProps) {
  const result = expandToAssembly(itemName, quantity, sector, laborRate, knrMultiplier);

  if (!result.triggered) {
    return (
      <div className="p-3 text-xs text-slate-500 flex items-center gap-1.5">
        <Info className="w-3.5 h-3.5 flex-shrink-0" />
        Brak definicji zestawu dla tej pozycji.
      </div>
    );
  }

  const expansion = result as SmartExpansionResult;
  const rbhPerPoint = quantity > 0 ? expansion.totalRBH / quantity : expansion.totalRBH;
  const unitLabel = expansion.context.category === "TRASY" ? "mb" : "pkt";

  return (
    <div className="w-[360px] max-w-[94vw] p-0 text-xs">
      {/* Header */}
      <div className="flex items-start gap-2 px-3 pt-3 pb-2 bg-orange-50 dark:bg-orange-950/30 border-b border-orange-200 dark:border-orange-800 rounded-t-md">
        <Zap className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-orange-800 dark:text-orange-300 leading-tight">
            {expansion.templateName}
          </p>
          <p className="text-orange-600 dark:text-orange-400 mt-0.5 leading-tight">
            Sektor: {SECTOR_LABELS[expansion.sector]}
          </p>
        </div>
        <span className="shrink-0 text-[9px] font-mono bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 px-1.5 py-0.5 rounded border border-orange-200 dark:border-orange-700">
          #{expansion.templateId.split("_").pop()}
        </span>
      </div>

      {/* Confirmation message */}
      <div className="px-3 py-2 bg-amber-50 dark:bg-amber-950/20 border-b border-amber-100 dark:border-amber-900">
        <p className="text-amber-800 dark:text-amber-300 leading-snug">
          Rozpoznano{" "}
          <span className="font-semibold">
            &apos;{expansion.matchedKeyword}&apos;
          </span>{" "}
          dla sektora{" "}
          <span className="font-semibold">{SECTOR_LABELS[sector].split(" ")[0]}</span>.
          Zastosowano Zestaw{" "}
          <span className="font-mono font-semibold">#{expansion.templateId}</span>.
        </p>
      </div>

      {/* Ingredient table */}
      <div className="px-3 pt-2 pb-1">
        <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
          Składniki zestawu ({quantity} {unitLabel})
        </p>
        <div className="space-y-0.5">
          {expansion.items.map((item, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-2 py-1 px-1.5 rounded ${
                item.isLabor
                  ? "bg-green-50 dark:bg-green-950/20"
                  : "bg-orange-50 dark:bg-orange-950/20"
              }`}
            >
              {item.isLabor ? (
                <Hammer className="w-2.5 h-2.5 text-green-600 dark:text-green-400 flex-shrink-0" />
              ) : (
                <Package className="w-2.5 h-2.5 text-orange-500 dark:text-orange-400 flex-shrink-0" />
              )}
              <span className="flex-1 min-w-0 truncate text-slate-700 dark:text-slate-300">
                {item.label}
              </span>
              <span className="shrink-0 text-slate-400 dark:text-slate-500 text-[10px]">
                {item.quantity.toFixed(1)} {item.unit}
              </span>
              <ArrowRight className="w-2 h-2 text-slate-300 dark:text-slate-600 flex-shrink-0" />
              <span
                className={`shrink-0 font-mono font-semibold text-[10px] ${
                  item.isLabor
                    ? "text-green-700 dark:text-green-400"
                    : "text-orange-600 dark:text-orange-400"
                }`}
              >
                {item.rbhTotal.toFixed(3)} rbh
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="px-3 pb-3 pt-2 border-t border-slate-100 dark:border-slate-800 mt-1 space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="text-slate-500 dark:text-slate-400">
            Łączny nakład robocizny:
          </span>
          <span className="font-semibold font-mono text-slate-800 dark:text-slate-200">
            {expansion.totalRBH.toFixed(2)} rbh
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-500 dark:text-slate-400">
            Na {unitLabel} ({rbhPerPoint.toFixed(3)} rbh/{unitLabel}):
          </span>
          <span className="font-semibold text-green-700 dark:text-green-400">
            {expansion.totalLaborPLN.toFixed(2)} zł rob.
          </span>
        </div>
        {expansion.totalMaterialPLN > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400">
              Materiały szacunkowe:
            </span>
            <span className="font-semibold text-orange-600 dark:text-orange-400">
              ~{expansion.totalMaterialPLN.toFixed(2)} zł mat.
            </span>
          </div>
        )}

        {/* KNR multiplier note */}
        <p className="text-[9px] text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800 leading-tight">
          Formuła: Σ(RBH_bazowe × mnożnik_KNR {knrMultiplier.toFixed(2)} × ilość).
          Stawka r-g: {laborRate} PLN/rbh.
        </p>
      </div>
    </div>
  );
}
