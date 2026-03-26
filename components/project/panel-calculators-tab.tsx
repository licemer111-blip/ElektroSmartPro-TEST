"use client";
import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import { Wrench, Info, FileDown, ArrowRight } from "lucide-react";
import { CALCULATOR_LINKS } from "./rozdzielnica/din-modules-catalog";

export function PanelCalculatorsTab() {
  return (
    <TabsContent value="calculators" className="flex-1 overflow-y-auto mt-3">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-blue-500" />
          <p className="text-xs text-slate-600 dark:text-slate-400">Kalkulatory przydatne przy projektowaniu i doborze rozdzielnic</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CALCULATOR_LINKS.map((calc) => {
            const CIcon = calc.icon;
            return (
              <a key={calc.id} href={calc.href}
                className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 hover:border-transparent hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
                <div className={`h-1.5 bg-gradient-to-r ${calc.gradient}`} />
                <div className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${calc.gradient} flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 group-hover:shadow-lg transition-all duration-300`}>
                      <CIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{calc.title}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{calc.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {calc.features.map((f, i) => (
                        <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">{f}</span>
                      ))}
                    </div>
                    <div className={`w-7 h-7 rounded-full bg-gradient-to-r ${calc.gradient} flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-md`}>
                      <ArrowRight className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                </div>
                <div className={`absolute inset-0 bg-gradient-to-br ${calc.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300 pointer-events-none`} />
              </a>
            );
          })}
        </div>

        <div className="space-y-2 mt-1">
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800">
            <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed">
              <strong>Wyniki kalkulatorów</strong> zostaną automatycznie dołączone jako <strong>pliki PDF</strong> do kompletu dokumentów wyceny — kosztorysu, oferty i portalu klienta.
            </div>
          </div>
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border border-emerald-200 dark:border-emerald-800">
            <FileDown className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
            <div className="text-[11px] text-emerald-800 dark:text-emerald-300 leading-relaxed">
              <strong>Rozdzielnica PDF</strong> — specyfikacja tablicy rozdzielczej zostanie wygenerowana jako osobny dokument PDF i dołączona do pakietu: wycena + kalkulatory + rozdzielnica → klient.
            </div>
          </div>
        </div>
      </div>
    </TabsContent>
  );
}
