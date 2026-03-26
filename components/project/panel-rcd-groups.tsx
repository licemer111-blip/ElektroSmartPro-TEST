"use client";
import React from "react";
import { Shield } from "lucide-react";
import type { RailModule } from "./panel-configurator-types";

interface PanelRcdGroupsProps {
  railModules: RailModule[];
}

export function PanelRcdGroups({ railModules }: PanelRcdGroupsProps) {
  if (railModules.length === 0) return null;

  const rcdGroups: Array<{ rcd: RailModule; mcbs: RailModule[] }> = [];
  let currentRcd: RailModule | null = null;
  let currentMcbs: RailModule[] = [];
  railModules.forEach((m) => {
    if (m.module.category === "rcd") {
      if (currentRcd) rcdGroups.push({ rcd: currentRcd, mcbs: currentMcbs });
      currentRcd = m;
      currentMcbs = [];
    } else if (m.module.category === "breaker" && currentRcd) {
      currentMcbs.push(m);
    }
  });
  if (currentRcd) rcdGroups.push({ rcd: currentRcd, mcbs: currentMcbs });

  return (
    <div className="rounded-xl border-2 border-emerald-200 dark:border-emerald-800 bg-gradient-to-r from-emerald-50 via-blue-50 to-emerald-50 dark:from-emerald-950/30 dark:via-blue-950/30 dark:to-emerald-950/30 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-600" />
          <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Struktura RCD</h4>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="text-slate-600 dark:text-slate-400"><strong className="text-slate-800 dark:text-slate-200">{railModules.filter(m => m.module.category === "rcd").length}</strong> RCD</span>
          <span className="text-slate-600 dark:text-slate-400"><strong className="text-slate-800 dark:text-slate-200">{railModules.filter(m => m.module.category === "breaker").length}</strong> MCB</span>
          <span className="text-slate-600 dark:text-slate-400"><strong className="text-slate-800 dark:text-slate-200">{railModules.filter(m => m.module.category === "rcbo").length}</strong> RCBO</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {rcdGroups.length > 0 ? (
          rcdGroups.map((group, idx) => (
            <div key={idx} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700">
              <Shield className="w-3 h-3 text-emerald-600" />
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                RCD {group.rcd.rating}A/{group.rcd.module.name.includes("30mA") ? "30" : group.rcd.module.name.includes("100mA") ? "100" : "300"}mA
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400">→ {group.mcbs.length} MCB</span>
              {group.mcbs.length > 6 && (
                <span className="text-[10px] px-1 py-0.5 bg-amber-500 text-white rounded font-bold">!</span>
              )}
            </div>
          ))
        ) : (
          <span className="text-[11px] text-slate-500 italic">Brak grup RCD — dodaj RCD aby zabezpieczyć obwody</span>
        )}
      </div>
    </div>
  );
}
