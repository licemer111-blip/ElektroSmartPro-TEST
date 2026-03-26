"use client";

import React from "react";
import { Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { computePhaseLoads, type CircuitInput } from "@/lib/power-logic";
import type { PanelSection } from "../panel-configurator-types";

export interface PowerBalanceData {
  mainRating: number;
  status: "ok" | "empty" | "warning" | "overload";
  loadPercent: number;
  effectiveLoad: number;
  totalPowerKW: number;
  diversityFactor: number;
  totalCircuits: number;
  is3Phase: boolean;
}

export interface PhaseBalancerProps {
  sectionPowerBalance: Record<number, PowerBalanceData>;
  activeSectionIdx: number;
  sections: PanelSection[];
}

export function PhaseBalancer({ sectionPowerBalance, activeSectionIdx, sections }: PhaseBalancerProps) {
  const pb = sectionPowerBalance[activeSectionIdx];
  if (!pb || pb.mainRating === 0) return null;

  const barColor = pb.status === "ok" ? "#22c55e" : pb.status === "warning" ? "#f59e0b" : "#ef4444";
  const barWidth = Math.min(pb.loadPercent, 120);

  let phaseBadges: null | { L1: number; L2: number; L3: number; asymPct: number } = null;
  if (pb.is3Phase) {
    const sec = sections[activeSectionIdx];
    const phCircuits = sec.modules
      .filter(m => m.module.category === "breaker" || m.module.category === "rcbo")
      .map(m => ({
        uid: m.uid,
        label: m.label,
        rating: m.rating || m.module.defaultRating || 0,
        phase: m.phase,
        poles: m.module.modules || 1,
      }));
    if (phCircuits.length > 0) {
      const pl = computePhaseLoads(phCircuits, true, pb.mainRating);
      phaseBadges = { L1: pl.phaseLoads.L1, L2: pl.phaseLoads.L2, L3: pl.phaseLoads.L3, asymPct: pl.asymmetryPct };
    }
  }

  return (
                      <div className="px-1.5 py-1.5 space-y-1.5">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <Activity className="w-3.5 h-3.5 text-slate-500" />
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                              Bilans mocy
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-slate-500">
                              {pb.is3Phase ? "3F" : "1F"} • Główny: {pb.mainRating}A • Kj={pb.diversityFactor} ({pb.totalCircuits} obw.)
                            </span>
                            <span className="font-bold" style={{ color: barColor }}>
                              {pb.effectiveLoad}A / {pb.mainRating}A ({pb.loadPercent}%)
                            </span>
                            <span className="text-slate-400">
                              ~{pb.totalPowerKW} kW
                            </span>
                          </div>
                        </div>
                        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${barWidth}%`, background: barColor }}
                          />
                        </div>
                        {pb.status === "overload" && (
                          <p className="text-[11px] text-red-500 font-semibold mt-0.5">
                            Przeciążenie! Obciążenie przekracza zabezpieczenie główne przy jednoczesnym włączeniu wszystkich obwodów (scenariusz teoretyczny — w praktyce stosuje się współczynnik jednoczesności).
                          </p>
                        )}
                        {/* Phase Header Badges [L1: xA] [L2: xA] [L3: xA] */}
                        {phaseBadges && (
                          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                            {(["L1", "L2", "L3"] as const).map(ph => {
                              const load = phaseBadges![ph];
                              const overload = pb.mainRating > 0 && load > pb.mainRating;
                              const warn = pb.mainRating > 0 && load > pb.mainRating * 0.85;
                              const ok = !overload && !warn;
                              return (
                                <span
                                  key={ph}
                                  className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold border ${
                                    overload
                                      ? "bg-red-100 dark:bg-red-900/30 border-red-400 text-red-700 dark:text-red-300"
                                      : warn
                                      ? "bg-amber-100 dark:bg-amber-900/30 border-amber-400 text-amber-700 dark:text-amber-300"
                                      : "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400"
                                  }`}
                                  title={`Faza ${ph}: ${load}A${overload ? " — PRZECIĄŻENIE!" : warn ? " — wysoka wartość (>85%)" : " — OK"}`}
                                >
                                  {overload ? "⚠ " : ok ? "✓ " : ""}{ph}: {load}A
                                </span>
                              );
                            })}
                            {phaseBadges.asymPct > 30 && (
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                                Asymetria {phaseBadges.asymPct}%
                              </span>
                            )}
                          </div>
                        )}
                      </div>
  );
}
