"use client";
import React from "react";
import type { RailModule } from "./panel-configurator-types";

interface PanelZugPanelProps {
  railModules: RailModule[];
}

export function PanelZugPanel({ railModules }: PanelZugPanelProps) {
  const circuitCount = railModules.filter(m => m.module.category === "breaker" || m.module.category === "rcbo").length;
  const suggestedZugSlots = Math.ceil(circuitCount * 0.5);
  const zugBlocks = railModules.filter(m => m.isZugBlock);
  const totalTerminals = zugBlocks.reduce((s, m) => s + (m.terminalCount || 15), 0);
  const currentZugSlots = zugBlocks.reduce((s, m) => s + (m.module.modules || 1), 0);
  const hasEnoughZug = currentZugSlots >= suggestedZugSlots;

  if (zugBlocks.length === 0 && circuitCount === 0) return null;

  return (
    <div className={`mb-2 rounded-lg border px-3 py-2 ${zugBlocks.length > 0
      ? "border-amber-300 dark:border-amber-700 bg-amber-50/80 dark:bg-amber-950/20"
      : "border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/20"}`}>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">⚡ ZUG — Listwy zaciskowe</span>
        {zugBlocks.length > 0 ? (
          <span className="text-[10px] text-amber-600 dark:text-amber-500">
            {zugBlocks.length} {zugBlocks.length > 1 ? "bloki" : "blok"} — {totalTerminals} zaczek — {currentZugSlots} mod. DIN
          </span>
        ) : (
          <span className="text-[10px] text-slate-500">brak bloku ZUG</span>
        )}
        <span className={`ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded ${hasEnoughZug && zugBlocks.length > 0
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`}>
          {hasEnoughZug && zugBlocks.length > 0 ? "OK" : `Zalecane: ${suggestedZugSlots} mod.`}
        </span>
      </div>
      <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
        <span>Wzor: ceil({circuitCount} obw. × 0.5) = <strong className="text-slate-700 dark:text-slate-300">{suggestedZugSlots} mod. DIN</strong></span>
        {zugBlocks.length > 0 && !hasEnoughZug && (
          <span className="text-amber-600 dark:text-amber-400 font-semibold">
            — brakuje {suggestedZugSlots - currentZugSlots} mod.
          </span>
        )}
      </div>
    </div>
  );
}
