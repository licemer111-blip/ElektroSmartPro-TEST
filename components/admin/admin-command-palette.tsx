"use client";

import { useState, useEffect, useCallback, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Database, Users, Loader2, Zap, ArrowRight } from "lucide-react";
import { commandSearch } from "@/app/admin/knr-quality/actions";
import type { CommandSearchResult } from "@/app/admin/knr-quality/actions";

export function AdminCommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CommandSearchResult[]>([]);
  const [selected, setSelected] = useState(0);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Open on CMD+K / CTRL+K
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setResults([]);
      setSelected(0);
    }
  }, [open]);

  // Debounced search
  const search = useCallback((q: string) => {
    if (q.trim().length < 2) { setResults([]); return; }
    startTransition(async () => {
      const res = await commandSearch(q);
      setResults(res);
      setSelected(0);
    });
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 280);
    return () => clearTimeout(t);
  }, [query, search]);

  // Keyboard navigation
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected((s) => Math.min(s + 1, results.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
    if (e.key === "Enter" && results[selected]) {
      navigate(results[selected]);
    }
  }

  function navigate(item: CommandSearchResult) {
    router.push(item.href);
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Palette */}
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          {isPending
            ? <Loader2 className="w-4 h-4 text-slate-400 animate-spin shrink-0" />
            : <Search className="w-4 h-4 text-slate-400 shrink-0" />
          }
          <input
            ref={inputRef}
            id="admin-palette-search"
            name="admin-palette-search"
            aria-label="Szukaj w panelu admina"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Szukaj normy KNR, użytkownika po NIP/email…"
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none"
          />
          <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[380px] overflow-y-auto">
          {results.length === 0 && query.trim().length >= 2 && !isPending && (
            <div className="px-4 py-8 text-center text-sm text-slate-400">
              Brak wyników dla <strong className="text-slate-600 dark:text-slate-300">&ldquo;{query}&rdquo;</strong>
            </div>
          )}

          {results.length === 0 && query.trim().length < 2 && (
            <div className="px-4 py-6 space-y-3">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold px-1">Szybkie skróty</p>
              {[
                { label: "Normy KNR Quality Hub", href: "/admin/knr-quality", icon: Zap, sub: "L0 miss analysis, awanse" },
                { label: "Użytkownicy", href: "/admin/users", icon: Users, sub: "Zarządzaj kontami" },
                { label: "Baza wiedzy", href: "/admin/knowledge-base", icon: Database, sub: "es_dictionary, knr_norms" },
              ].map(({ label, href, icon: Icon, sub }) => (
                <button
                  key={href}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left transition-colors"
                  onClick={() => { router.push(href); setOpen(false); }}
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</p>
                    <p className="text-[11px] text-slate-400 truncate">{sub}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 ml-auto shrink-0" />
                </button>
              ))}
            </div>
          )}

          {results.length > 0 && (
            <div className="py-1">
              {/* Group norms */}
              {results.filter((r) => r.type === "norm").length > 0 && (
                <>
                  <p className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
                    Normy KNR ({results.filter((r) => r.type === "norm").length})
                  </p>
                  {results.filter((r) => r.type === "norm").map((item, idx) => (
                    <ResultRow
                      key={item.id}
                      item={item}
                      isSelected={selected === idx}
                      onClick={() => navigate(item)}
                      onHover={() => setSelected(idx)}
                    />
                  ))}
                </>
              )}

              {/* Group users */}
              {results.filter((r) => r.type === "user").length > 0 && (
                <>
                  <p className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
                    Użytkownicy ({results.filter((r) => r.type === "user").length})
                  </p>
                  {results.filter((r) => r.type === "user").map((item, idx) => {
                    const globalIdx = results.filter((r) => r.type === "norm").length + idx;
                    return (
                      <ResultRow
                        key={item.id}
                        item={item}
                        isSelected={selected === globalIdx}
                        onClick={() => navigate(item)}
                        onHover={() => setSelected(globalIdx)}
                      />
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <kbd className="font-mono bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-1 text-slate-500">↑↓</kbd>
            nawiguj
          </span>
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <kbd className="font-mono bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-1 text-slate-500">↵</kbd>
            otwórz
          </span>
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <kbd className="font-mono bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-1 text-slate-500">Esc</kbd>
            zamknij
          </span>
        </div>
      </div>
    </div>
  );
}

interface ResultRowProps {
  item: CommandSearchResult;
  isSelected: boolean;
  onClick: () => void;
  onHover: () => void;
}

function ResultRow({ item, isSelected, onClick, onHover }: ResultRowProps) {
  const Icon = item.type === "norm" ? Database : Users;
  return (
    <button
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
        isSelected
          ? "bg-blue-50 dark:bg-blue-950/30"
          : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
      }`}
      onClick={onClick}
      onMouseEnter={onHover}
    >
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
        item.type === "norm"
          ? "bg-violet-100 dark:bg-violet-950/40"
          : "bg-blue-100 dark:bg-blue-950/40"
      }`}>
        <Icon className={`w-3.5 h-3.5 ${
          item.type === "norm" ? "text-violet-600 dark:text-violet-400" : "text-blue-600 dark:text-blue-400"
        }`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{item.title}</p>
        <p className="text-[10px] text-slate-400 truncate">{item.subtitle}</p>
      </div>
      <ArrowRight className={`w-3.5 h-3.5 shrink-0 transition-opacity ${isSelected ? "opacity-60" : "opacity-0"}`} />
    </button>
  );
}
