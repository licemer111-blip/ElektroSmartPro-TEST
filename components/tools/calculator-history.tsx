"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { History, Trash2, RotateCcw, Clock } from "lucide-react";
import { toast } from "sonner";

export interface HistoryEntry<T = Record<string, any>> {
  id: string;
  timestamp: number;
  label: string;
  inputs: T;
}

interface CalculatorHistoryProps<T = Record<string, any>> {
  calculatorId: string;
  currentInputs: T;
  /** A short label for the current calculation, e.g. "630kVA, Cu 10mm², 25m" */
  currentLabel: string;
  onLoadInputs: (inputs: T) => void;
  maxItems?: number;
}

const STORAGE_PREFIX = "calc-history-";

function getStorageKey(calculatorId: string) {
  return `${STORAGE_PREFIX}${calculatorId}`;
}

function loadHistory<T>(calculatorId: string): HistoryEntry<T>[] {
  try {
    const raw = localStorage.getItem(getStorageKey(calculatorId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory<T>(calculatorId: string, entries: HistoryEntry<T>[]) {
  try {
    localStorage.setItem(getStorageKey(calculatorId), JSON.stringify(entries));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

export function CalculatorHistory<T extends Record<string, any>>({
  calculatorId,
  currentInputs,
  currentLabel,
  onLoadInputs,
  maxItems = 10,
}: CalculatorHistoryProps<T>) {
  const [history, setHistory] = useState<HistoryEntry<T>[]>([]);
  const [open, setOpen] = useState(false);

  // Load history on mount
  useEffect(() => {
    setHistory(loadHistory<T>(calculatorId));
  }, [calculatorId]);

  /** Save current calculation to history */
  const saveCurrentToHistory = useCallback(() => {
    const entry: HistoryEntry<T> = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      label: currentLabel,
      inputs: { ...currentInputs },
    };
    const updated = [entry, ...history].slice(0, maxItems);
    setHistory(updated);
    saveHistory(calculatorId, updated);
    toast.success("Zapisano w historii");
  }, [calculatorId, currentInputs, currentLabel, history, maxItems]);

  const handleLoad = (entry: HistoryEntry<T>) => {
    onLoadInputs(entry.inputs);
    setOpen(false);
    toast.success("Parametry przywrócone");
  };

  const handleClearHistory = () => {
    setHistory([]);
    saveHistory(calculatorId, []);
    toast.success("Historia wyczyszczona");
  };

  const handleDeleteEntry = (id: string) => {
    const updated = history.filter((e) => e.id !== id);
    setHistory(updated);
    saveHistory(calculatorId, updated);
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex items-center gap-2">
      {/* Save button */}
      <Button
        size="sm"
        onClick={saveCurrentToHistory}
        className="gap-1.5 h-8 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
      >
        <Clock className="h-3.5 w-3.5" />
        Zapisz
      </Button>

      {/* History popover */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button size="sm" className="gap-1.5 h-8 px-3 text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white shadow-sm relative">
            <History className="h-3.5 w-3.5" />
            Historia
            {history.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {history.length}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0">
          <div className="p-3 border-b bg-slate-50 dark:bg-slate-900 rounded-t-md">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Historia obliczeń
              </h4>
              {history.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearHistory}
                  className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 px-2"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Wyczyść
                </Button>
              )}
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {history.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                <History className="h-8 w-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                Brak zapisanych obliczeń
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {history.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-2 p-2.5 hover:bg-slate-50 dark:hover:bg-slate-900/50 group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
                        {entry.label}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {formatDate(entry.timestamp)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLoad(entry)}
                        className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Załaduj
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
