"use client";
import React from "react";
import type { Manufacturer } from "./panel-configurator-types";
import { ENCLOSURE_OPTIONS } from "./rozdzielnica/din-modules-catalog";

interface PanelEnclosureHeaderProps {
  selectedEnclosure: (typeof ENCLOSURE_OPTIONS)[number];
  selectedManufacturer: Manufacturer;
  manufacturerCoeff: number;
  modulesPerRow: number;
}

export function PanelEnclosureHeader({
  selectedEnclosure, selectedManufacturer, manufacturerCoeff, modulesPerRow,
}: PanelEnclosureHeaderProps) {
  return (
    <div className="flex items-center justify-between px-1.5 pb-1.5 border-b border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-sm shadow-green-400/50 animate-pulse" />
        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">
          {selectedEnclosure.name}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 shadow-sm">
          🏭 {selectedManufacturer.name}{selectedManufacturer.country ? ` (${selectedManufacturer.country})` : ""}
          {manufacturerCoeff !== 1.0 && <span className="text-indigo-500">×{manufacturerCoeff.toFixed(2)}</span>}
        </span>
        <span className="text-[11px] text-slate-400 font-medium">{selectedEnclosure.rows} rzędów × {modulesPerRow} mod.</span>
        <div className="flex gap-0.5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="w-1.5 h-3 rounded-sm bg-slate-300 dark:bg-slate-600" />
          ))}
        </div>
      </div>
    </div>
  );
}
