"use client";

import { useState, useTransition } from "react";
import { ArrowUpCircle, ChevronDown, ChevronUp, Info, Loader2, TrendingUp, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { promoteToL0 } from "../actions";
import type { L0MissEntry, PromoteToL0Input } from "../actions";

interface MissAnalysisTableProps {
  entries: L0MissEntry[];
}

const LEVEL_COLORS: Record<string, string> = {
  L1: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  L2: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  L3: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  unmatched: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export function MissAnalysisTable({ entries }: MissAnalysisTableProps) {
  const [sortBy, setSortBy] = useState<"frequency" | "level">("frequency");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [promoteEntry, setPromoteEntry] = useState<L0MissEntry | null>(null);
  const [promotedIds, setPromotedIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const sorted = [...entries].sort((a, b) => {
    const dir = sortDir === "desc" ? -1 : 1;
    if (sortBy === "frequency") return (a.frequency - b.frequency) * dir;
    return a.avg_match_level.localeCompare(b.avg_match_level) * dir;
  });

  function toggleSort(col: "frequency" | "level") {
    if (sortBy === col) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortBy(col); setSortDir("desc"); }
  }

  function handlePromote(entry: L0MissEntry) {
    setResult(null);
    setPromoteEntry(entry);
  }

  function confirmPromote() {
    if (!promoteEntry?.es_dict_entry) return;
    const input: PromoteToL0Input = {
      keyword: promoteEntry.es_dict_entry.keyword,
      knr_ref: promoteEntry.es_dict_entry.knr_ref,
      label: promoteEntry.es_dict_entry.label,
      labor_norm_rbh: promoteEntry.es_dict_entry.labor_norm_rbh,
      unit: promoteEntry.es_dict_entry.unit,
      category: promoteEntry.es_dict_entry.category,
    };

    startTransition(async () => {
      const res = await promoteToL0(input);
      setResult(res);
      if (res.success && promoteEntry.es_dict_entry) {
        setPromotedIds((prev) => new Set([...prev, promoteEntry.es_dict_entry!.id]));
        setTimeout(() => setPromoteEntry(null), 1800);
      }
    });
  }

  const SortIcon = ({ col }: { col: "frequency" | "level" }) =>
    sortBy === col ? (
      sortDir === "desc" ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />
    ) : null;

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50">
          <TrendingUp className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Analiza L0 Miss — kandydaci do awansu</h2>
        </div>
        <div className="p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
            <Info className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Brak danych audytu</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Dane pojawią się po uruchomieniu wycen przez użytkowników.<br />
            Każda wycena zapisuje wpis w <code className="text-[10px] bg-slate-100 dark:bg-slate-700 px-1 rounded">pricing_audit_log</code>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-violet-500" />
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Analiza L0 Miss — kandydaci do awansu
            </h2>
            <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-full font-mono">
              {entries.length} pozycji
            </span>
          </div>
          <p className="text-[10px] text-slate-400">Kliknij "Awansuj do L0" aby przenieść normę z L2 → L0 gold</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 text-[10px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2.5 text-left font-semibold">Nazwa pozycji</th>
                <th
                  className="px-3 py-2.5 text-center font-semibold w-24 cursor-pointer hover:text-slate-700 select-none"
                  onClick={() => toggleSort("frequency")}
                >
                  <span className="flex items-center justify-center gap-1">
                    Częstość <SortIcon col="frequency" />
                  </span>
                </th>
                <th
                  className="px-3 py-2.5 text-center font-semibold w-24 cursor-pointer hover:text-slate-700 select-none"
                  onClick={() => toggleSort("level")}
                >
                  <span className="flex items-center justify-center gap-1">
                    Poziom <SortIcon col="level" />
                  </span>
                </th>
                <th className="px-3 py-2.5 text-left font-semibold">Dopasowanie L2</th>
                <th className="px-3 py-2.5 text-center font-semibold w-28">KNR Ref</th>
                <th className="px-3 py-2.5 text-center font-semibold w-32">Akcja</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sorted.map((entry) => {
                const isPromoted = entry.es_dict_entry ? promotedIds.has(entry.es_dict_entry.id) : false;
                return (
                  <tr
                    key={entry.item_name}
                    className={`transition-colors ${
                      isPromoted
                        ? "bg-emerald-50/60 dark:bg-emerald-950/10"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/30"
                    } ${
                      entry.avg_match_level === "L3" || entry.avg_match_level === "unmatched"
                        ? "bg-red-50/30 dark:bg-red-950/10"
                        : ""
                    }`}
                  >
                    <td className="px-3 py-2.5 text-slate-700 dark:text-slate-300 max-w-[240px]">
                      <p className="truncate font-medium">{entry.item_name}</p>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px]">
                        {entry.frequency}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <Badge className={`text-[9px] py-0 px-1.5 ${LEVEL_COLORS[entry.avg_match_level] ?? LEVEL_COLORS.L2}`}>
                        {entry.avg_match_level}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 max-w-[200px]">
                      {entry.es_dict_entry ? (
                        <div>
                          <p className="truncate text-slate-700 dark:text-slate-300">{entry.es_dict_entry.label}</p>
                          <p className="text-[10px] text-slate-400">{entry.es_dict_entry.labor_norm_rbh} rbh · {entry.es_dict_entry.unit}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">brak w słowniku</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono text-[10px] text-slate-400">
                      {entry.best_knr_code ?? "—"}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {isPromoted ? (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-center gap-1">
                          ✓ Awansowano
                        </span>
                      ) : entry.can_promote ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-[10px] px-2 border-violet-200 text-violet-700 hover:bg-violet-50 dark:border-violet-800 dark:text-violet-400 dark:hover:bg-violet-950/30 gap-1"
                          onClick={() => handlePromote(entry)}
                        >
                          <ArrowUpCircle className="w-3 h-3" />
                          Awansuj do L0
                        </Button>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">brak danych</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Promote Modal */}
      <Dialog open={!!promoteEntry} onOpenChange={(open) => { if (!open && !isPending) setPromoteEntry(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <ArrowUpCircle className="w-5 h-5 text-violet-600" />
              Awans do L0 Gold
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Norma zostanie skopiowana z <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-[10px]">es_dictionary</code> (L2) do <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-[10px]">knr_norms</code> (L0) ze statusem <strong>zweryfikowana</strong>.
            </DialogDescription>
          </DialogHeader>

          {promoteEntry?.es_dict_entry && (
            <div className="space-y-2 text-sm">
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
                {[
                  { k: "Opis",        v: promoteEntry.es_dict_entry.label },
                  { k: "Kod KNR",     v: promoteEntry.es_dict_entry.knr_ref },
                  { k: "Norma",       v: `${promoteEntry.es_dict_entry.labor_norm_rbh} rbh` },
                  { k: "Jednostka",   v: promoteEntry.es_dict_entry.unit },
                  { k: "Kategoria",   v: promoteEntry.es_dict_entry.category },
                  { k: "Słowo klucz", v: promoteEntry.es_dict_entry.keyword },
                ].map(({ k, v }) => (
                  <div key={k} className="flex gap-3 px-3 py-1.5">
                    <span className="w-24 shrink-0 text-[11px] font-medium text-slate-500">{k}</span>
                    <span className="text-[11px] text-slate-800 dark:text-slate-200 font-mono truncate">{v}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-start gap-2 p-3 rounded-lg bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 text-[11px] text-violet-700 dark:text-violet-400">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                Norma zostanie ustawiona jako <strong>is_verified = true</strong>. L0 lookup znajdzie ją przy kolejnych wycenach.
              </div>

              {result && (
                <div className={`flex items-center gap-2 p-3 rounded-lg border text-[11px] font-medium ${
                  result.success
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-400"
                    : "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/20 dark:border-red-800 dark:text-red-400"
                }`}>
                  {result.success ? <ArrowUpCircle className="w-3.5 h-3.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 shrink-0" />}
                  {result.message}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPromoteEntry(null)}
              disabled={isPending}
              className="text-xs"
            >
              Anuluj
            </Button>
            <Button
              size="sm"
              onClick={confirmPromote}
              disabled={isPending || (result?.success ?? false)}
              className="text-xs bg-violet-600 hover:bg-violet-700 text-white gap-1.5"
            >
              {isPending ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Awansowanie…</>
              ) : (
                <><ArrowUpCircle className="w-3.5 h-3.5" /> Potwierdź awans</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
