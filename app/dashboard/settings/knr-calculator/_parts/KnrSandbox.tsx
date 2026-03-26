"use client";

// ═══════════════════════════════════════════════════════════════════
// knr-calculator/_parts/KnrSandbox.tsx
// Sandbox: search KNR norms, show nakłady + stawka R-G + koszt
// Blur logic for FREE/Demo users (Iron Rule #1)
// ═══════════════════════════════════════════════════════════════════

import { useState, useTransition, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Search, Sparkles, CheckCircle2, AlertCircle, Loader2,
  Lock, Crown,
} from "lucide-react";
import { searchKnrNorm } from "../actions";
import { useSearchMode } from "@/hooks/use-search-mode";

type SearchResult = {
  name: string;
  norm: number;
  unit: string;
  source: "KNR" | "User" | "AI";
  knrCode?: string;
  laborCost: number;
  confidence: "high" | "medium" | "low";
};

const SOURCE_COLORS: Record<string, string> = {
  KNR: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  User: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  AI: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
};

const CONFIDENCE_COLORS: Record<string, string> = {
  high: "text-emerald-600 dark:text-emerald-400",
  medium: "text-amber-600 dark:text-amber-400",
  low: "text-orange-600 dark:text-orange-400",
};

interface KnrSandboxProps {
  hourlyRate: number;
  hourlyInput: string;
  totalCoeff?: number;
  isPro: boolean;
  coeffLabel?: string | null;
  useCustomRates?: boolean;
  regionMultiplier?: number;
  regionName?: string;
  sensitivity?: "restrykcyjna" | "optymalna" | "elastyczna";
  defaultMontage?: "bez_wyboru" | "pod_tynkiem" | "w_tynku" | "w_rurach" | "na_wierzchu" | "w_korytku" | "na_drabince" | "ziemny" | "sufitowo";
  investmentContext?: string;
}

export function KnrSandbox({ hourlyRate, hourlyInput, totalCoeff = 1, isPro, coeffLabel = null, useCustomRates: _useCustomRates = false, regionMultiplier = 1.0, regionName, sensitivity = "optymalna", defaultMontage = "bez_wyboru", investmentContext = "" }: KnrSandboxProps) {
  const { toast: _toast } = useToast();
  const { mode: searchMode } = useSearchMode();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, startSearch] = useTransition();
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [lastSearchRate, setLastSearchRate] = useState(hourlyRate);
  const [lastCoeff, setLastCoeff] = useState(1);

  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) return;
    setSearchError(null);
    setSearchResults([]);
    const baseRate = parseFloat(hourlyInput) || hourlyRate || 100;
    const rateForSearch = Math.round(baseRate * regionMultiplier);
    setLastSearchRate(rateForSearch);
    setLastCoeff(totalCoeff);
    startSearch(async () => {
      const result = await searchKnrNorm(searchQuery, rateForSearch, sensitivity, defaultMontage, investmentContext);
      if (result.success) {
        setSearchResults(result.results);
      } else {
        setSearchError(result.error ?? "Błąd wyszukiwania");
      }
    });
  }, [searchQuery, hourlyRate, hourlyInput, totalCoeff, sensitivity, defaultMontage, investmentContext]);

  return (
    <Card className="border-2 border-emerald-100 dark:border-emerald-900/40 shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Search className="w-4 h-4 text-white" />
              </div>
              Sandbox — Testuj Wyszukiwanie Norm
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Wpisz nazwę pozycji — system przeszuka KNR i katalog, pokaże nakłady rzeczowe, jednostkę miary i roboczogodziny
            </CardDescription>
            </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            {regionName && regionMultiplier !== 1.0 && (
              <Badge className={`text-xs border ${
                regionMultiplier > 1
                  ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border-orange-300 dark:border-orange-700"
                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
              }`}>
                📍 {regionName} ×{regionMultiplier.toFixed(2)}
              </Badge>
            )}
            {searchMode === "own" && (
              <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 text-xs border border-violet-300 dark:border-violet-700">
                Własna Baza
              </Badge>
            )}
            {searchMode === "hybrid" && (
              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-xs border border-blue-300 dark:border-blue-700">
                ⚡ Hybrydowy
              </Badge>
            )}
            {searchMode === "engine" && (
              <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 text-xs border border-orange-300 dark:border-orange-700">
                ES-Engine
              </Badge>
            )}
            {coeffLabel && (
              <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 text-xs shrink-0">
                Współcz. {coeffLabel}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              id="knr-sandbox-search"
              name="knr-sandbox-search"
              aria-label="Szukaj norm KNR"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
              placeholder="np. gniazdo podwójne, wyłącznik nadprądowy B16, kabel YDYp..."
              className="pl-9 h-11"
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="h-11 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white min-w-[120px]"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Szukaj
          </Button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs text-slate-400">Przykłady:</span>
          {["gniazdo podwójne", "wyłącznik B16", "kabel YDYp", "oprawa LED", "puszka rozgałęźna"].map((ex) => (
            <button
              key={ex}
              onClick={() => setSearchQuery(ex)}
              className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>

        {searchError && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{searchError}
          </div>
        )}

        {searchResults.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Znaleziono {searchResults.length} {searchResults.length === 1 ? "wynik" : "wyniki"}
              </span>
              {lastCoeff > 1 && (
                <Badge className="text-[10px] bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                  z współcz. ×{lastCoeff.toFixed(3)}
                </Badge>
              )}
            </div>

            {searchResults.map((r, i) => {
              const adjustedNorm = parseFloat((r.norm * lastCoeff).toFixed(3));
              const adjustedCost = parseFloat((r.laborCost * lastCoeff).toFixed(2));
              return (
                <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 overflow-hidden">
                  {/* Name + source */}
                  <div className="flex items-start justify-between gap-3 p-4 pb-3">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{r.name}</p>
                      {r.knrCode && <p className="text-xs text-slate-400 mt-0.5 font-mono">{r.knrCode}</p>}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Badge className={`text-[10px] ${SOURCE_COLORS[r.source]}`}>{r.source}</Badge>
                      {!isPro && (
                        <Badge className="text-[10px] bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400 gap-1">
                          <Lock className="w-2.5 h-2.5" />Demo
                        </Badge>
                      )}
                      <span className={`text-xs font-medium ${CONFIDENCE_COLORS[r.confidence]}`}>
                        {r.confidence === "high" ? "★★★" : r.confidence === "medium" ? "★★☆" : "★☆☆"}
                      </span>
                    </div>
                  </div>

                  {/* Metrics grid */}
                  <div className="grid grid-cols-3 gap-0 border-t border-slate-100 dark:border-slate-700">
                    {/* Nakłady rzeczowe — always visible */}
                    <div className="p-3 text-center border-r border-slate-100 dark:border-slate-700">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Nakłady rzeczowe</p>
                      <p className="text-base font-bold text-slate-900 dark:text-slate-100">{adjustedNorm}</p>
                      <p className="text-[10px] text-slate-500">rbh/{r.unit}</p>
                      {lastCoeff > 1 && (
                        <p className="text-[9px] text-rose-500 mt-0.5">base: {r.norm} ×{lastCoeff.toFixed(2)}</p>
                      )}
                    </div>

                    {/* Stawka R-G — blurred for FREE (Iron Rule #1: Demo constraints) */}
                    <div className="p-3 text-center border-r border-slate-100 dark:border-slate-700 relative">
                      <p className="text-[10px] text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">Stawka R-G</p>
                      {isPro ? (
                        <>
                          <p className="text-base font-bold text-blue-700 dark:text-blue-400">{lastSearchRate}</p>
                          <p className="text-[10px] text-slate-500">PLN/rbh {regionMultiplier !== 1.0 ? `(×${regionMultiplier.toFixed(2)})` : ""}</p>
                        </>
                      ) : (
                        <>
                          <p className="text-base font-bold text-blue-700 dark:text-blue-400 blur-sm select-none">###</p>
                          <p className="text-[10px] text-slate-500">PLN/rbh</p>
                        </>
                      )}
                    </div>

                    {/* Koszt całkowity — blurred for FREE (Iron Rule #1) */}
                    <div className="p-3 text-center relative">
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-1">Koszt całkowity</p>
                      {isPro ? (
                        <>
                          <p className="text-base font-bold text-emerald-700 dark:text-emerald-400">{adjustedCost.toFixed(2)}</p>
                          <p className="text-[10px] text-slate-500">PLN/{r.unit}</p>
                        </>
                      ) : (
                        <>
                          <p className="text-base font-bold text-emerald-700 dark:text-emerald-400 blur-sm select-none">##.##</p>
                          <p className="text-[10px] text-slate-500">PLN/{r.unit}</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* FREE CTA banner */}
                  {!isPro && (
                    <div className="flex items-center justify-between gap-3 px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-t border-amber-200 dark:border-amber-800">
                      <div className="flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                        <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                          Zablokowane w wersji Demo
                        </p>
                      </div>
                      <Link href="/dashboard/settings?tab=subscription">
                        <Button size="sm" className="h-7 text-[11px] gap-1 bg-amber-500 hover:bg-amber-600 text-white">
                          <Crown className="w-3 h-3" />
                          Aktywuj Plan PRO
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Global FREE CTA */}
            {!isPro && (
              <div className="rounded-xl border-2 border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                    <Crown className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-amber-900 dark:text-amber-100">
                      Aktywuj Plan PRO, aby odblokować precyzyjne wyliczenia
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                      PRO odblokowuje: pełne nakłady rzeczowe KNR, koszty całkowite, eksport PDF, nieograniczone projekty i priorytetowy ES-Engine.
                    </p>
                  </div>
                  <Link href="/dashboard/settings?tab=subscription" className="flex-shrink-0">
                    <Button className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-white">
                      <Crown className="w-4 h-4" />
                      Uaktualnij
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
