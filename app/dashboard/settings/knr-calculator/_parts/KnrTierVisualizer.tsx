"use client";

// ═══════════════════════════════════════════════════════════════════
// knr-calculator/_parts/KnrTierVisualizer.tsx
// KnrPageHeader — compact status panel (mode indicator + P1→P2→AI)
// KnrTierVisualizer — full 4-tier hierarchy (kept for reference, not rendered)
// ═══════════════════════════════════════════════════════════════════

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Calculator, Lock, Crown, Info, Shield, BookOpen, Database, Brain, Zap } from "lucide-react";
import { useSearchMode } from "@/hooks/use-search-mode";

interface KnrPageHeaderProps {
  isPro: boolean;
  useCustomRates?: boolean;
}

export function KnrPageHeader({ isPro }: KnrPageHeaderProps) {
  const { mode: searchMode } = useSearchMode();

  const P_NODES = [
    {
      id: "P1",
      label: "Własna Baza",
      desc: "Twój prywatny katalog · stawka własna RBH · najwyższy priorytet",
      active: searchMode === "own",
      activeColor: "border-violet-400 bg-violet-50 dark:border-violet-600 dark:bg-violet-950/30",
      idColor: "bg-violet-600",
      inactiveColor: "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 opacity-40",
    },
    {
      id: "HYB",
      label: "Hybrydowy",
      desc: "Twój katalog ma priorytet · KNR fallback dla braków · oba źródła w wyszukiwaniu",
      active: searchMode === "hybrid",
      activeColor: "border-blue-400 bg-blue-50 dark:border-blue-600 dark:bg-blue-950/30",
      idColor: "bg-blue-500",
      inactiveColor: "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 opacity-40",
    },
    {
      id: "P2",
      label: "ES-Engine",
      desc: "Normy KNR 5-08 · stawki regionu · automatyczne dopasowanie",
      active: searchMode === "engine",
      activeColor: "border-orange-400 bg-orange-50 dark:border-orange-600 dark:bg-orange-950/30",
      idColor: "bg-orange-500",
      inactiveColor: "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 opacity-40",
    },
    {
      id: "AI",
      label: "ES Engine (on-demand)",
      desc: "Wycena ES Engine — tylko na żądanie użytkownika (przycisk Wyceń w tabeli)",
      active: false,
      activeColor: "",
      idColor: "bg-violet-500",
      inactiveColor: "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 opacity-30",
    },
  ];

  const modeDesc =
    searchMode === "own" ? "Tryb Własny — Twoje stawki mają najwyższy priorytet (P1)" :
    searchMode === "hybrid" ? "Tryb Hybrydowy — Twój katalog priorytetowy + KNR fallback (HYB)" :
    "ES-Engine 2026 — L1 Katalog + L2 Normy KNR + ES Engine on-demand (P2)";

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-5 py-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Title */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
            searchMode === "own" ? "bg-violet-600" : searchMode === "hybrid" ? "bg-blue-600" : "bg-orange-500"
          }`}>
            {searchMode === "hybrid" ? <Zap className="w-5 h-5 text-white" /> : <Calculator className="w-5 h-5 text-white" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white truncate">
                Centrum Kalkulacji i Norm
              </h1>
              {isPro
                ? <Badge className="bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-500/20 dark:text-amber-200 dark:border-amber-400/30 text-[10px] gap-1 flex-shrink-0"><Crown className="w-2.5 h-2.5" />PRO</Badge>
                : <Badge className="bg-slate-200 text-slate-600 border-slate-300 dark:bg-slate-500/30 dark:text-slate-300 dark:border-slate-500/30 text-[10px] gap-1 flex-shrink-0"><Lock className="w-2.5 h-2.5" />DEMO</Badge>
              }
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="inline-flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-400 font-medium px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex-shrink-0">
                      <Shield className="w-2.5 h-2.5" />
                      Separacja kosztów
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs text-xs">
                    System rygorystycznie oddziela <strong>Robociznę</strong> od <strong>Materiałów</strong>. Nakłady rbh i ceny materiałów nigdy nie są sumowane przedwcześnie.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{modeDesc}</p>
          </div>
        </div>

        {/* P1 → P2 → AI status bar */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider hidden sm:block mr-1">Hierarchia:</span>
          {P_NODES.map((p, i) => (
            <div key={p.id} className="flex items-center gap-1">
              {i > 0 && <span className="text-slate-300 dark:text-slate-600 text-xs font-bold">→</span>}
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border cursor-default transition-all ${p.active ? p.activeColor : p.inactiveColor}`}>
                      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-black text-white flex-shrink-0 ${p.idColor}`}>{p.id}</span>
                      <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 hidden md:block">{p.label}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs max-w-[200px]">
                    <p className="font-semibold">{p.label}</p>
                    <p className="text-slate-400 mt-0.5">{p.desc}</p>
                    {p.active && <p className="text-emerald-500 mt-0.5 font-medium">✓ Aktywny priorytet</p>}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── KnrTierVisualizer — kept but not rendered in main layout ──────────────
// (available for future "Dowiedz się więcej" expandable panel)

interface KnrTierVisualizerProps {
  isPro: boolean;
}

export function KnrTierVisualizer({ isPro: _isPro }: KnrTierVisualizerProps) {
  const TIERS = [
    { id: "T1", label: "Twoje Normy", icon: BookOpen, color: "from-violet-500 to-purple-600" },
    { id: "T2", label: "ES-KNR 2026", icon: Database, color: "from-blue-500 to-cyan-600" },
    { id: "T3", label: "Katalog Rynkowy", icon: Shield, color: "from-emerald-500 to-teal-600" },
    { id: "T4", label: "Szacunek ES-Engine", icon: Brain, color: "from-orange-500 to-amber-500" },
  ];
  return (
    <div className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
      {TIERS.map((t, i) => {
        const Icon = t.icon;
        return (
          <div key={t.id} className="flex items-center gap-2">
            {i > 0 && <span className="text-slate-300 dark:text-slate-600 text-xs">→</span>}
            <div className="flex items-center gap-1.5">
              <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${t.color} flex items-center justify-center`}>
                <Icon className="w-3 h-3 text-white" />
              </div>
              <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 hidden sm:block">{t.label}</span>
            </div>
          </div>
        );
      })}
      <Info className="w-3.5 h-3.5 text-slate-300 ml-auto flex-shrink-0" />
    </div>
  );
}
