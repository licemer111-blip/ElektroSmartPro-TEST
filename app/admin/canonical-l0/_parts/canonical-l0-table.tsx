"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Search,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Save,
  Power,
  PowerOff,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  saveCanonicalL0Override,
  deleteCanonicalL0Override,
  type AdminEntryView,
} from "../actions";

interface RowDraft {
  laborNorm: string;
  materialPrice: string;
  knrCode: string;
  notes: string;
  disabled: boolean;
  dirty: boolean;
}

interface CanonicalL0TableProps {
  entries: AdminEntryView[];
}

function formatNum(v: number | null | undefined, decimals = 2): string {
  if (v == null) return "";
  return Number(v).toFixed(decimals);
}

function parseOptional(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  const n = Number(trimmed.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export function CanonicalL0Table({ entries }: CanonicalL0TableProps) {
  const { toast } = useToast();
  const [filter, setFilter] = useState("");
  const [showOnlyOverridden, setShowOnlyOverridden] = useState(false);
  const [, startTransition] = useTransition();
  const [savingId, setSavingId] = useState<string | null>(null);

  // Row-level drafts keyed by entry_description (natural key)
  const initialDrafts = useMemo<Record<string, RowDraft>>(() => {
    const out: Record<string, RowDraft> = {};
    for (const e of entries) {
      out[e.description] = {
        laborNorm: formatNum(e.laborNormOverride, 4),
        materialPrice: formatNum(e.materialPriceOverride, 2),
        knrCode: e.knrCodeOverride ?? "",
        notes: e.notes ?? "",
        disabled: e.disabled,
        dirty: false,
      };
    }
    return out;
  }, [entries]);
  const [drafts, setDrafts] = useState<Record<string, RowDraft>>(initialDrafts);

  const updateDraft = (desc: string, patch: Partial<RowDraft>) => {
    setDrafts((prev) => ({
      ...prev,
      [desc]: { ...prev[desc], ...patch, dirty: true },
    }));
  };

  const filteredEntries = useMemo(() => {
    const f = filter.trim().toLowerCase();
    return entries.filter((e) => {
      if (showOnlyOverridden && e.overrideId === null) return false;
      if (f.length === 0) return true;
      return (
        e.description.toLowerCase().includes(f) ||
        e.knrCode.toLowerCase().includes(f) ||
        e.effectiveKnrCode.toLowerCase().includes(f)
      );
    });
  }, [entries, filter, showOnlyOverridden]);

  const handleSave = (entry: AdminEntryView) => {
    const draft = drafts[entry.description];
    if (!draft) return;

    setSavingId(entry.description);
    startTransition(async () => {
      const result = await saveCanonicalL0Override({
        entry_description: entry.description,
        labor_norm_override: parseOptional(draft.laborNorm),
        material_price_override: parseOptional(draft.materialPrice),
        knr_code_override: draft.knrCode.trim().length > 0 ? draft.knrCode.trim() : null,
        disabled: draft.disabled,
        notes: draft.notes.trim().length > 0 ? draft.notes.trim() : null,
      });
      setSavingId(null);
      if (result.success) {
        toast({ title: "✓ Zapisano", description: entry.description, duration: 2000 });
        setDrafts((prev) => ({
          ...prev,
          [entry.description]: { ...prev[entry.description], dirty: false },
        }));
      } else {
        toast({
          title: "Błąd zapisu",
          description: result.error ?? "Nieznany błąd",
          variant: "destructive",
        });
      }
    });
  };

  const handleReset = (entry: AdminEntryView) => {
    setSavingId(entry.description);
    startTransition(async () => {
      const result = await deleteCanonicalL0Override(entry.description);
      setSavingId(null);
      if (result.success) {
        toast({
          title: "↻ Przywrócono baseline",
          description: entry.description,
          duration: 2000,
        });
        setDrafts((prev) => ({
          ...prev,
          [entry.description]: {
            laborNorm: "",
            materialPrice: "",
            knrCode: "",
            notes: "",
            disabled: false,
            dirty: false,
          },
        }));
      } else {
        toast({
          title: "Błąd resetu",
          description: result.error ?? "Nieznany błąd",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <Input
            type="text"
            placeholder="Szukaj po opisie / KNR…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
        <Button
          type="button"
          size="sm"
          variant={showOnlyOverridden ? "default" : "outline"}
          className="h-8 text-xs"
          onClick={() => setShowOnlyOverridden((v) => !v)}
        >
          {showOnlyOverridden ? "Pokaż wszystkie" : "Tylko z override"}
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-400 min-w-[280px]">
                Opis pozycji
              </th>
              <th className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-400 w-[120px]">
                KNR
              </th>
              <th className="px-3 py-2 text-right font-medium text-slate-600 dark:text-slate-400 w-[100px]">
                Norma rbh
              </th>
              <th className="px-3 py-2 text-right font-medium text-slate-600 dark:text-slate-400 w-[110px]">
                Materiał PLN
              </th>
              <th className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-400 w-[60px]">
                Jedn.
              </th>
              <th className="px-3 py-2 text-center font-medium text-slate-600 dark:text-slate-400 w-[70px]">
                Status
              </th>
              <th className="px-3 py-2 text-right font-medium text-slate-600 dark:text-slate-400 w-[160px]">
                Akcje
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-slate-400">
                  Brak pozycji spełniających kryteria
                </td>
              </tr>
            ) : (
              filteredEntries.map((entry) => {
                const draft = drafts[entry.description];
                if (!draft) return null;
                const isOverridden = entry.overrideId !== null;
                const isSaving = savingId === entry.description;

                return (
                  <tr
                    key={entry.description}
                    className={`border-b border-slate-100 dark:border-slate-900 transition-colors ${
                      draft.disabled
                        ? "bg-red-50/40 dark:bg-red-950/10"
                        : isOverridden
                        ? "bg-amber-50/40 dark:bg-amber-950/10"
                        : "hover:bg-slate-50 dark:hover:bg-slate-900/40"
                    }`}
                  >
                    <td className="px-3 py-2">
                      <div
                        className={`text-slate-800 dark:text-slate-200 ${
                          draft.disabled ? "line-through opacity-60" : ""
                        }`}
                      >
                        {entry.description}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-600 font-mono mt-0.5 truncate max-w-md">
                        {entry.patternSource}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="text"
                        placeholder={entry.baseKnrCode}
                        value={draft.knrCode}
                        onChange={(e) =>
                          updateDraft(entry.description, { knrCode: e.target.value })
                        }
                        disabled={draft.disabled}
                        className="h-7 text-[11px] font-mono"
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder={entry.baseLaborNorm.toFixed(4)}
                        value={draft.laborNorm}
                        onChange={(e) =>
                          updateDraft(entry.description, { laborNorm: e.target.value })
                        }
                        disabled={draft.disabled}
                        className="h-7 text-[11px] text-right font-mono"
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder={
                          entry.baseMaterialPrice != null
                            ? entry.baseMaterialPrice.toFixed(2)
                            : "—"
                        }
                        value={draft.materialPrice}
                        onChange={(e) =>
                          updateDraft(entry.description, {
                            materialPrice: e.target.value,
                          })
                        }
                        disabled={draft.disabled}
                        className="h-7 text-[11px] text-right font-mono"
                      />
                    </td>
                    <td className="px-3 py-2 text-slate-500 font-mono text-[11px]">
                      {entry.unit}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateDraft(entry.description, { disabled: !draft.disabled })
                        }
                        title={draft.disabled ? "Włącz pozycję" : "Wyłącz pozycję (skip w pipeline)"}
                        className={`mx-auto flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                          draft.disabled
                            ? "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 hover:bg-red-200"
                            : "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200"
                        }`}
                      >
                        {draft.disabled ? (
                          <>
                            <PowerOff className="w-3 h-3" />
                            OFF
                          </>
                        ) : (
                          <>
                            <Power className="w-3 h-3" />
                            ON
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1">
                        {draft.dirty && (
                          <span
                            title="Zmiany niezapisane"
                            className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400"
                          >
                            <AlertTriangle className="w-3 h-3" />
                          </span>
                        )}
                        {!draft.dirty && isOverridden && (
                          <span
                            title="Pozycja z override"
                            className="inline-flex items-center text-[10px] text-blue-600 dark:text-blue-400"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                          </span>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleSave(entry)}
                          disabled={isSaving || !draft.dirty}
                          className="h-7 px-2 text-[10px]"
                        >
                          <Save className="w-3 h-3 mr-1" />
                          Zapisz
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleReset(entry)}
                          disabled={isSaving || !isOverridden}
                          title="Usuń override → przywróć wartość hardcoded"
                          className="h-7 px-2 text-[10px]"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
        Pokazano <strong>{filteredEntries.length}</strong> z{" "}
        <strong>{entries.length}</strong> pozycji canonical L0.
      </div>
    </div>
  );
}
