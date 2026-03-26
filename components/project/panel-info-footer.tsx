"use client";
import { DIN_MODULES_COUNT } from "@/lib/data/din-modules-stats";
import React from "react";
import { Zap, Shield, FileDown, Sparkles, ArrowDown } from "lucide-react";

export function PanelInfoFooter() {
  return (
    <div className="mt-8 mb-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <Zap className="w-3 h-3 text-blue-500" />
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ElektroSmart PRO</span>
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50">
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-blue-800 dark:text-blue-300 mb-0.5">Normy PN-HD 60364</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">Konfigurator zgodny z PN-HD 60364-4-41, PN-EN 61439-1/2 oraz Warunkami Technicznymi WT 2021.</p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
            <FileDown className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 mb-0.5">Wycena wg KNR 2026</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">Ceny robocizny wg KNR 5-04, 5-08, 5-09, 5-10. Stawki regionalne dla 16 województw. Baza ES-KNR 2026.</p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/50">
          <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-orange-500" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-orange-800 dark:text-orange-300 mb-0.5">ES-Engine — Silnik ekspertowy</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">Automatyczny projekt rozdzielnicy, schemat jednokreskowy, wycena ES-Engine oraz walidacja selektywności zabezpieczeń.</p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/50">
          <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center flex-shrink-0">
            <ArrowDown className="w-4 h-4 text-violet-600" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-violet-800 dark:text-violet-300 mb-0.5">Eksport PDF / CSV</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">Specyfikacja techniczna PDF z kosztorysem, schemat SVG, eksport CSV do Excela z kodami KNR.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center">
            <Zap className="w-3 h-3 text-white" />
          </div>
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">ElektroSmart PRO</span>
          <span className="text-[10px] text-slate-400">— Konfigurator Rozdzielnicy v2.0</span>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-slate-400 dark:text-slate-500">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />{DIN_MODULES_COUNT}+ modułów DIN</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-400" />Wizualizacja Live</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-orange-400" />ES-Engine</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-violet-400" />Kosztorys KNR</span>
        </div>
        <div className="text-[10px] text-slate-400">
          &copy; 2026 ElektroSmart · Wszelkie prawa zastrzeżone
        </div>
      </div>
    </div>
  );
}
