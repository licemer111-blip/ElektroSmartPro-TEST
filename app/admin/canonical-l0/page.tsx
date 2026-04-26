import type { Metadata } from "next";
import { SlidersHorizontal } from "lucide-react";
import { listCanonicalL0Entries } from "./actions";
import { CanonicalL0Table } from "./_parts/canonical-l0-table";

export const metadata: Metadata = {
  title: "L0 Canonical — Admin | ElektroSmart PRO",
};
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CanonicalL0AdminPage() {
  const entries = await listCanonicalL0Entries();
  const overriddenCount = entries.filter((e) => e.overrideId !== null).length;
  const disabledCount = entries.filter((e) => e.disabled).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/40">
            <SlidersHorizontal className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              L0 Canonical KNR — overrides
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Edycja norm robocizny / cen materiałowych dla{" "}
              <strong>{entries.length}</strong> pozycji canonical bez deploya
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {overriddenCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 font-medium">
              {overriddenCount} z override
            </span>
          )}
          {disabledCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 font-medium">
              {disabledCount} wyłączonych
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
            cache 60s
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <p className="text-[11px] text-slate-500 leading-relaxed">
            <strong className="text-slate-700 dark:text-slate-300">
              Jak to działa:
            </strong>{" "}
            tabela bazowa pochodzi z{" "}
            <code className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">
              lib/services/canonical-knr-l0.ts
            </code>{" "}
            (regex + KNR + norma). Override zapisywane są w tabeli{" "}
            <code className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">
              canonical_l0_overrides
            </code>{" "}
            i nakładane na bazę przy starcie pipeline. Puste pola = wartość
            hardcoded. Disabled = pozycja pomijana, kontekst spada do L1/L2/L3.
            Cache 60s — zmiana będzie widoczna po max 60 sek (lub natychmiast po
            kolejnym Wyceń).
          </p>
        </div>
        <CanonicalL0Table entries={entries} />
      </div>
    </div>
  );
}
