"use client";

import { useState, useTransition, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Database, Tag, Loader2, AlertCircle, Sparkles, Brain } from "lucide-react";
import {
  getSystemDictionaryStats,
  searchSystemDictionary,
  searchSystemDictionaryByCategory,
  searchDictionaryWithAI,
  type DictionaryEntry,
  type DictionaryStats,
} from "../actions";

const CATEGORY_LABELS: Record<string, string> = {
  aparatura: "Aparatura elektryczna",
  bezpieczenstwo: "Bezpieczeństwo / CCTV",
  dali_awaryjne: "DALI / Oświetlenie awaryjne",
  dali_bms: "DALI / BMS / Automatyka",
  demontaz: "Demontaże",
  demontaze: "Demontaże",
  ev_ladowanie: "EV / Ładowarki",
  fotowoltaika: "Fotowoltaika / OZE / EV",
  gniazda_wylaczniki: "Gniazda i wyłączniki",
  hvac: "HVAC / Klimatyzacja",
  infrastruktura: "Infrastruktura",
  instalacje_podstawowe: "Instalacje elektryczne",
  interkomy: "Domofony / Interkomy",
  it_siec: "IT / Sieć",
  kable_silnopradowe: "Kable silnoprądowe",
  kable_slabopradowe: "Kable słaboprądowe",
  led_dekoracyjny: "LED Dekoracyjny",
  ogrod_basen: "Ogród i Baseny",
  ogrzewanie: "Ogrzewanie elektryczne",
  osprzet: "Osprzęt instalacyjny",
  oswietlenie: "Oświetlenie",
  oswietlenie_przemyslowe: "Oświetlenie Przemysłowe",
  oze_ev: "Fotowoltaika / OZE / EV",
  pomiary: "Pomiary",
  pomiary_dokumentacja: "Pomiary i Dokumentacja",
  ppoz: "PPOŻ / Gaśnicza",
  ppoz_ssp: "PPOŻ + SSP",
  prace_dodatkowe: "Prace dodatkowe",
  prace_ziemne: "Prace ziemne",
  prad_budowlany: "Plac Budowy",
  prowadzenie: "Prowadzenie instalacji",
  przygotowanie: "Przygotowanie placu budowy",
  przylacza_wlz: "Przyłącza i WLZ",
  pv_ev: "Fotowoltaika / OZE / EV",
  remonty: "Remonty i pomiary",
  remonty_pomiary: "Remonty i pomiary",
  rozdzielnice: "Rozdzielnice i tablice",
  rury_trasy: "Rury i trasy kablowe",
  serwis_awarie: "Serwis i Awarie",
  smart_home: "Smart Home / KNX",
  ssp: "SSP / Sygnalizacja pożaru",
  swiatlowody: "Światłowody",
  trasy_przemyslowe: "Trasy przemysłowe",
  uziemienie: "Uziomy i Odgromowa",
  uziem_odgrom: "Uziomy i Odgromowa",
  zasilanie_awaryjne: "Zasilanie Awaryjne (UPS/AGR)",
  zasilanie_gwar: "Zasilanie gwarantowane",
  zestawy: "Zestawy montażowe",
};

function getCategoryLabel(cat: string): string {
  if (CATEGORY_LABELS[cat]) return CATEGORY_LABELS[cat];
  return cat.split(/[_\-]+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

type SearchMode = "normal" | "ai";

function MatchTypeBadge({ type }: { type?: string }) {
  if (!type || type === "exact") return null;
  if (type === "fuzzy")
    return (
      <span className="ml-1 inline-flex items-center px-1 py-0 rounded text-[9px] font-semibold bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
        ~fuzzy
      </span>
    );
  if (type === "partial")
    return (
      <span className="ml-1 inline-flex items-center px-1 py-0 rounded text-[9px] font-semibold bg-sky-100 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
        ~partial
      </span>
    );
  return null;
}

export function SystemDictionaryBrowser() {
  const [stats, setStats] = useState<DictionaryStats | null>(null);
  const [query, setQuery] = useState("");
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchMode, setSearchMode] = useState<SearchMode>("normal");
  const [aiExplanation, setAiExplanation] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const res = await getSystemDictionaryStats();
      if (res.success && res.stats) setStats(res.stats);
    });
  }, []);

  const handleSearch = () => {
    if (query.trim().length < 2) return;
    setIsSearching(true);
    setHasSearched(true);
    setSearchMode("normal");
    setAiExplanation("");
    startTransition(async () => {
      const res = await searchSystemDictionary(query.trim());
      setEntries(res.success ? res.entries : []);
      setIsSearching(false);
    });
  };

  const handleCategorySearch = (cat: string, label: string) => {
    setQuery(label);
    setIsSearching(true);
    setHasSearched(true);
    setSearchMode("normal");
    setAiExplanation("");
    startTransition(async () => {
      const res = await searchSystemDictionaryByCategory(cat);
      setEntries(res.success ? res.entries : []);
      setIsSearching(false);
    });
  };

  const handleAiSearch = () => {
    if (query.trim().length < 2) return;
    setIsAiSearching(true);
    setSearchMode("ai");
    setAiExplanation("");
    startTransition(async () => {
      const res = await searchDictionaryWithAI(query.trim());
      setEntries(res.success ? res.entries : []);
      setAiExplanation(res.explanation ?? "");
      setIsAiSearching(false);
    });
  };

  const isLoading = isSearching || isAiSearching || isPending;

  return (
    <Card className="dark:bg-slate-900 dark:border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Database className="h-4 w-4 text-orange-500" />
          Globalna Baza ES-KNR (L2)
          <Badge className="ml-1 text-[10px] px-1.5 py-0 bg-orange-500 text-white">ZAWSZE AKTYWNA</Badge>
        </CardTitle>
        <CardDescription className="text-xs">
          Sprawdź, co jest już dostępne w globalnym słowniku — nie musisz tego wgrywać do swojej bazy
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        {stats ? (
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 p-3 text-center">
              <div className="text-xl font-black text-orange-700 dark:text-orange-400">
                {stats.totalEntries.toLocaleString("pl-PL")}+
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">norm KNR</div>
            </div>
            <div className="rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 p-3 text-center">
              <div className="text-xl font-black text-orange-700 dark:text-orange-400">{stats.categoryCount}</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">kategorii</div>
            </div>
            <div className="rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 p-3 text-center">
              <div className="text-xl font-black text-orange-700 dark:text-orange-400">KNR</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">5-08 / 5-09</div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Ładowanie statystyk...
          </div>
        )}

        {/* Category pills */}
        {stats && (
          <div className="flex flex-wrap gap-1.5">
            {stats.categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategorySearch(cat, getCategoryLabel(cat))}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400 hover:border-orange-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
              >
                <Tag className="h-2.5 w-2.5" />
                {getCategoryLabel(cat)}
              </button>
            ))}
          </div>
        )}

        {/* Search row */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <Input
              id="knr-dict-search"
              name="knr-dict-search"
              aria-label="Szukaj w bazie KNR"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="mufa, spawanie, kabel 3x2.5, zarobienie końców…"
              className="pl-8 h-9 text-sm"
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={query.trim().length < 2 || isLoading}
            size="sm"
            className="h-9 bg-orange-500 hover:bg-orange-600 text-white gap-1.5 px-3"
          >
            {isSearching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
            Szukaj
          </Button>
        </div>

        {/* AI Explanation banner */}
        {searchMode === "ai" && aiExplanation && (
          <div className="rounded-lg border border-orange-200 dark:border-orange-800/50 bg-orange-50 dark:bg-orange-950/20 px-3 py-2 flex items-start gap-2">
            <Brain className="h-3.5 w-3.5 text-orange-500 mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-orange-700 dark:text-orange-300 leading-relaxed">{aiExplanation}</p>
          </div>
        )}

        {/* Results */}
        {hasSearched && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            {isLoading ? (
              <div className="p-6 flex items-center justify-center gap-2 text-xs text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                {isAiSearching ? "ES-Engine analizuje zapytanie…" : "Szukam w bazie…"}
              </div>
            ) : entries.length === 0 ? (
              /* ── Empty state with AI fallback button ── */
              <div className="p-5 text-center space-y-3">
                <AlertCircle className="h-5 w-5 mx-auto text-amber-400" />
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    Nie znaleziono w bazie L2
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Spróbuj innej pisowni lub zapytaj ES-Engine — zna synonimy branżowe i odmiany
                  </p>
                </div>
                <Button
                  onClick={handleAiSearch}
                  disabled={query.trim().length < 2 || isLoading}
                  size="sm"
                  variant="outline"
                  className="gap-2 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950/30"
                >
                  {isAiSearching ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  Zapytaj ES-Engine
                </Button>
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left px-3 py-2 font-semibold text-slate-500">Słowo kluczowe</th>
                    <th className="text-left px-3 py-2 font-semibold text-slate-500 hidden sm:table-cell">Kategoria</th>
                    <th className="text-left px-3 py-2 font-semibold text-slate-500">KNR</th>
                    <th className="text-right px-3 py-2 font-semibold text-slate-500">Norma r-g</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {entries.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-3 py-2">
                        <div className="font-medium text-slate-800 dark:text-slate-200 flex items-center flex-wrap gap-0.5">
                          {e.keyword}
                          <MatchTypeBadge type={e.match_type} />
                        </div>
                        {e.label && (
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[200px] mt-0.5">
                            {e.label}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 hidden sm:table-cell">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 text-[10px] font-medium">
                          {getCategoryLabel(e.category)}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {e.knr_ref ? (
                          <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                            {e.knr_ref}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {e.labor_norm_rbh != null ? (
                          <span className="font-bold text-orange-600 dark:text-orange-400">
                            {e.labor_norm_rbh} rbh/{e.unit}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {/* Footer hint */}
                  <tr className="border-t border-dashed border-slate-200 dark:border-slate-700/50">
                    <td colSpan={4} className="px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">
                          {entries.length} wyników
                          {searchMode === "ai" && (
                            <span className="ml-1 text-orange-500">· wyszukiwanie semantyczne</span>
                          )}
                        </span>
                        {searchMode === "normal" && (
                          <button
                            onClick={handleAiSearch}
                            disabled={isLoading}
                            className="inline-flex items-center gap-1 text-[10px] text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
                          >
                            <Sparkles className="h-2.5 w-2.5" />
                            Poszerz wyniki semantycznie
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        )}

        {!hasSearched && (
          <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center">
            Kliknij kategorię powyżej lub wpisz nazwę — fuzzy search prze&shy;baczy literówki
          </p>
        )}
      </CardContent>
    </Card>
  );
}
