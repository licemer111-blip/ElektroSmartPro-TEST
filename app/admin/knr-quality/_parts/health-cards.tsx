"use client";

import { Database, Star, TrendingUp, AlertTriangle, CheckCircle2, Activity } from "lucide-react";
import type { EngineHealthStats } from "../actions";

interface HealthCardsProps {
  stats: EngineHealthStats;
}

export function HealthCards({ stats }: HealthCardsProps) {
  const l3Status = stats.l3Rate <= 5 ? "ok" : stats.l3Rate <= 15 ? "warn" : "critical";

  const cards = [
    {
      label: "L0 Gold (knr_norms)",
      value: stats.l0Total.toLocaleString("pl"),
      sub: `${stats.l0VerifiedCount} zweryfikowanych`,
      icon: Star,
      color: "amber",
      tooltip: "Złota baza — bezpośrednie KNR lookup (najwyższa precyzja)",
    },
    {
      label: "L2 Słownik (es_dictionary)",
      value: stats.l2Total.toLocaleString("pl"),
      sub: "normy systemowe",
      icon: Database,
      color: "blue",
      tooltip: "Słownik roboczy — fuzzy matching Phase 2",
    },
    {
      label: "L0 Coverage",
      value: stats.auditTotal > 0 ? `${stats.l0Coverage}%` : "—",
      sub: `z ${stats.auditTotal.toLocaleString("pl")} wycen`,
      icon: TrendingUp,
      color: stats.l0Coverage >= 60 ? "emerald" : stats.l0Coverage >= 30 ? "amber" : "red",
      tooltip: "% wycen gdzie L0 (KNR direct) znalazł dopasowanie",
    },
    {
      label: "L3 Rate (AI fallback)",
      value: stats.auditTotal > 0 ? `${stats.l3Rate}%` : "—",
      sub: `${stats.auditL3 + stats.auditUnmatched} pozycji AI`,
      icon: l3Status === "ok" ? CheckCircle2 : AlertTriangle,
      color: l3Status === "ok" ? "emerald" : l3Status === "warn" ? "amber" : "red",
      tooltip: "% wycen które nie znalazły dopasowania i trafiły do AI (cel: <5%)",
    },
    {
      label: "Audit L1 Exact",
      value: stats.auditL1.toLocaleString("pl"),
      sub: "precyzyjne trafienia",
      icon: Activity,
      color: "emerald",
      tooltip: "Pozycje dopasowane dokładnie (keyword_normalized hit)",
    },
    {
      label: "Audit L2 Fuzzy",
      value: stats.auditL2.toLocaleString("pl"),
      sub: "kandydaci do awansu L0",
      icon: Database,
      color: "violet",
      tooltip: "Pozycje dopasowane rozmycie — najlepsi kandydaci do promowania do L0",
    },
  ];

  const colorMap: Record<string, { bg: string; border: string; icon: string; text: string; sub: string }> = {
    amber:   { bg: "bg-amber-50 dark:bg-amber-950/20",   border: "border-amber-200 dark:border-amber-800",   icon: "text-amber-600 dark:text-amber-400",   text: "text-amber-900 dark:text-amber-100",   sub: "text-amber-600/80 dark:text-amber-400/80" },
    blue:    { bg: "bg-blue-50 dark:bg-blue-950/20",     border: "border-blue-200 dark:border-blue-800",     icon: "text-blue-600 dark:text-blue-400",     text: "text-blue-900 dark:text-blue-100",     sub: "text-blue-600/80 dark:text-blue-400/80" },
    emerald: { bg: "bg-emerald-50 dark:bg-emerald-950/20", border: "border-emerald-200 dark:border-emerald-800", icon: "text-emerald-600 dark:text-emerald-400", text: "text-emerald-900 dark:text-emerald-100", sub: "text-emerald-600/80 dark:text-emerald-400/80" },
    red:     { bg: "bg-red-50 dark:bg-red-950/20",       border: "border-red-200 dark:border-red-800",       icon: "text-red-600 dark:text-red-400",       text: "text-red-900 dark:text-red-100",       sub: "text-red-600/80 dark:text-red-400/80" },
    violet:  { bg: "bg-violet-50 dark:bg-violet-950/20", border: "border-violet-200 dark:border-violet-800", icon: "text-violet-600 dark:text-violet-400", text: "text-violet-900 dark:text-violet-100", sub: "text-violet-600/80 dark:text-violet-400/80" },
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map(({ label, value, sub, icon: Icon, color }) => {
        const c = colorMap[color] ?? colorMap.blue;
        return (
          <div
            key={label}
            title={label}
            className={`rounded-xl border p-4 flex flex-col gap-2 ${c.bg} ${c.border}`}
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 leading-tight">
                {label}
              </p>
              <Icon className={`w-3.5 h-3.5 shrink-0 ${c.icon}`} />
            </div>
            <p className={`text-2xl font-bold leading-none ${c.text}`}>{value}</p>
            <p className={`text-[10px] leading-tight ${c.sub}`}>{sub}</p>
          </div>
        );
      })}
    </div>
  );
}
