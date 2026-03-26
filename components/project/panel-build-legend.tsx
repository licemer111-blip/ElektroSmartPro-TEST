"use client";
import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Info, LayoutGrid } from "lucide-react";
import type { RailModule } from "./panel-configurator-types";
import { getCategoryColor } from "./panel-configurator-helpers";

interface PanelBuildLegendProps {
  railModules: RailModule[];
  getShortName: (rm: RailModule) => string;
}

const CATEGORY_LABELS: Record<string, string> = {
  breaker: "Rozłączniki / SZR / Wyłączniki",
  rcd: "Ochrona różnicowa",
  rcbo: "Kombinowane (RCBO)",
  switch: "Rozłączniki / SZR / Wyłączniki",
  spd: "Ochrony / Ograniczniki",
  contactor: "Styczniki / Przekaźniki",
  motor_control: "Napędy / Falowniki / Zasilacze",
  timer: "Przełączniki / Zasilacze / Zasilacze",
  monitoring: "Pomiar / Monitoring",
  automation: "KNX / BMS / Sterowniki",
  compensation: "Zabezpieczenia / Kondensatory",
  terminal: "Złączki / Końcówki / Zaciski",
  consumable: "Materiały montażowe",
  wiring: "Przewody / Okablowanie",
  labor: "Robocizna / Usługi montażowe",
};

export function PanelBuildLegend({ railModules, getShortName }: PanelBuildLegendProps) {
  if (railModules.length === 0) return null;

  return (
    <div className="rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 via-slate-50 to-blue-50 dark:from-blue-950/30 dark:via-slate-900/30 dark:to-blue-950/30 p-3 space-y-3">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-blue-600" />
          <h4 className="text-xs font-bold text-blue-800 dark:text-blue-300">Wskazówki i skróty</h4>
        </div>
        <div className="grid grid-cols-3 gap-x-3 gap-y-1 text-[10px] text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1.5"><kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[9px] font-mono">Klik</kbd><span>edycja rating, label</span></div>
          <div className="flex items-center gap-1.5"><kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[9px] font-mono">Drag</kbd><span>przestaw kolejność</span></div>
          <div className="flex items-center gap-1.5"><kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[9px] font-mono">RCD</kbd><span>grupuje MCB (max 6)</span></div>
          <div className="flex items-center gap-1.5"><kbd className="px-1 py-0.5 bg-orange-500 text-white rounded text-[9px] font-mono">AI</kbd><span>automatyczny projekt</span></div>
          <div className="flex items-center gap-1.5"><kbd className="px-1 py-0.5 bg-emerald-600 text-white rounded text-[9px] font-mono">Zapisz</kbd><span>zapisz konfigurację</span></div>
          <div className="flex items-center gap-1.5"><kbd className="px-1 py-0.5 bg-blue-600 text-white rounded text-[9px] font-mono">Podsumowanie</kbd><span>dodaj do projektu</span></div>
        </div>
      </div>

      <div className="pt-2 border-t border-blue-200 dark:border-blue-700">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="legend" className="border-none">
            <AccordionTrigger className="py-2 hover:no-underline">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-3.5 h-3.5 text-blue-600" />
                <h4 className="text-xs font-bold text-blue-800 dark:text-blue-300">Legenda oznaczeń</h4>
                <Badge variant="secondary" className="text-[9px] h-4 px-1.5">{railModules.length} pozycji</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="max-h-[200px] overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                <table className="w-full text-[10px]">
                  <thead className="bg-blue-100 dark:bg-blue-950/50 sticky top-0">
                    <tr>
                      <th className="px-2 py-1 text-left font-bold text-blue-800 dark:text-blue-300">Lp.</th>
                      <th className="px-2 py-1 text-left font-bold text-blue-800 dark:text-blue-300">Skrót</th>
                      <th className="px-2 py-1 text-left font-bold text-blue-800 dark:text-blue-300">Nazwa urządzenia</th>
                      <th className="px-2 py-1 text-left font-bold text-blue-800 dark:text-blue-300">Kategoria</th>
                      <th className="px-2 py-1 text-center font-bold text-blue-800 dark:text-blue-300">Prąd</th>
                      <th className="px-2 py-1 text-center font-bold text-blue-800 dark:text-blue-300">Szt.</th>
                      <th className="px-2 py-1 text-center font-bold text-blue-800 dark:text-blue-300">Mod.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const moduleGroups = new Map<string, { module: RailModule; count: number }>();
                      railModules.forEach(rm => {
                        const key = `${rm.module.id}-${rm.rating || 0}`;
                        const existing = moduleGroups.get(key);
                        if (existing) existing.count++;
                        else moduleGroups.set(key, { module: rm, count: 1 });
                      });
                      return Array.from(moduleGroups.values()).map((group, idx) => {
                        const rm = group.module;
                        const shortName = getShortName(rm);
                        const categoryLabel = CATEGORY_LABELS[rm.module.category] || rm.module.category;
                        const moduleColor = getCategoryColor(rm.module.category);
                        return (
                          <tr key={idx} className="border-b border-slate-100 dark:border-slate-800 hover:bg-blue-50/50 dark:hover:bg-blue-950/20">
                            <td className="px-1.5 py-1 text-slate-600 dark:text-slate-400">{idx + 1}</td>
                            <td className="px-1.5 py-1">
                              <Badge variant="outline" className="text-[8px] h-3.5 px-0.5 font-mono font-bold" style={{ borderColor: moduleColor, color: moduleColor }}>{shortName}</Badge>
                            </td>
                            <td className="px-1.5 py-1">
                              <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: moduleColor }} />
                                <span className="text-slate-700 dark:text-slate-300 font-medium text-[10px]">{rm.module.namePl}</span>
                              </div>
                            </td>
                            <td className="px-1.5 py-1 text-slate-600 dark:text-slate-400">{categoryLabel}</td>
                            <td className="px-1.5 py-1 text-center font-bold text-slate-800 dark:text-slate-200">{rm.rating ? `${rm.rating}A` : "—"}</td>
                            <td className="px-1.5 py-1 text-center font-bold text-blue-600 dark:text-blue-400">{group.count}</td>
                            <td className="px-1.5 py-1 text-center text-slate-600 dark:text-slate-400">{rm.module.modules || 1}</td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
