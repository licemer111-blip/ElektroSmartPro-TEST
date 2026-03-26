import type { Metadata } from "next";
import { AlertTriangle, CheckCircle2, FlaskConical } from "lucide-react";
import { getEngineHealthStats, getL0MissAnalysis, getDictionaryRows } from "./actions";
import { HealthCards } from "./_parts/health-cards";
import { MissAnalysisTable } from "./_parts/miss-analysis-table";
import { DictionaryBrowser } from "./_parts/dictionary-browser";

export const metadata: Metadata = { title: "KNR Quality Hub — Admin | ElektroSmart PRO" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function KnrQualityHubPage() {
  const [stats, missEntries, dictRows] = await Promise.all([
    getEngineHealthStats(),
    getL0MissAnalysis(50),
    getDictionaryRows(),
  ]);

  const isHealthy = stats.l3Rate <= 5;
  const isWarning = stats.l3Rate > 5 && stats.l3Rate <= 15;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-950/40">
            <FlaskConical className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">KNR Quality Hub</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              ES-Engine · analiza jakości dopasowań · awanse L2 → L0
            </p>
          </div>
        </div>

        {stats.auditTotal > 0 && (
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
            isHealthy
              ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-400"
              : isWarning
              ? "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-400"
              : "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/20 dark:border-red-800 dark:text-red-400"
          }`}>
            {isHealthy
              ? <CheckCircle2 className="w-3.5 h-3.5" />
              : <AlertTriangle className="w-3.5 h-3.5" />}
            L3 Rate: {stats.l3Rate}%
            <span className="opacity-70">{isHealthy ? "OK" : isWarning ? "Uwaga" : "KRYTYCZNY"}</span>
          </div>
        )}
      </div>

      {/* Alert if L3 rate high */}
      {stats.auditTotal > 0 && stats.l3Rate > 5 && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              L3 rate przekroczył próg 5% ({stats.l3Rate}%)
            </p>
            <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-0.5">
              ES-Engine nie znalazł dopasowań L1/L2 dla{" "}
              <strong>{stats.auditL3 + stats.auditUnmatched}</strong> pozycji.
              Użyj tabeli poniżej aby awansować najczęstsze pozycje do L0.
            </p>
          </div>
        </div>
      )}

      {/* DB Health Monitor */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
          Database Health Monitor
        </h2>
        <HealthCards stats={stats} />
      </section>

      {/* L0 Miss Analysis */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
          L0 Miss Analysis · Awanse do L0 ({missEntries.length})
        </h2>
        <MissAnalysisTable entries={missEntries} />
      </section>

      {/* Dictionary Browser */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
          Dictionary Browser · es_dictionary L2 ({dictRows.length.toLocaleString("pl")} wpisów)
        </h2>
        <DictionaryBrowser rows={dictRows} />
      </section>
    </div>
  );
}
