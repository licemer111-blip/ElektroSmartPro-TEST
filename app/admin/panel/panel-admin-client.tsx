"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LayoutGrid, Zap, Shield, Package, Wrench, CheckCircle2,
  AlertTriangle, Clock, Activity, Database, BarChart3, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PanelAdminData } from "./page";

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  breaker:      { label: "Wyłączniki MCB/MCCB",   color: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" },
  rcd:          { label: "Wyłączniki RCD",         color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300" },
  rcbo:         { label: "Wyłączniki RCBO",        color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300" },
  spd:          { label: "Ograniczniki SPD",       color: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300" },
  switch:       { label: "Rozłączniki / SZR",      color: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300" },
  contactor:    { label: "Styczniki",              color: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300" },
  motor_control:{ label: "Napędy / VFD",           color: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300" },
  timer:        { label: "Programatory / Timery",  color: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" },
  monitoring:   { label: "Monitoring / Pomiar",    color: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300" },
  automation:   { label: "Automatyka / KNX / PLC", color: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300" },
  compensation: { label: "Kompensacja mocy biernej", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300" },
  enclosure:    { label: "Akcesoria obudowy",      color: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300" },
  terminal:     { label: "Złączki / Końcówki",     color: "bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300" },
  consumable:   { label: "Materiały montażowe",    color: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300" },
  wiring:       { label: "Przewody / Szyny Cu",    color: "bg-lime-100 text-lime-800 dark:bg-lime-950 dark:text-lime-300" },
  labor:        { label: "Robocizna",              color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" },
};

function StatTile({ label, value, sub, icon: Icon, color }: {
  label: string; value: string; sub?: string; icon: React.ElementType; color: string;
}) {
  return (
    <div className={cn("rounded-xl border p-4 flex flex-col gap-1", color)}>
      <div className="flex items-center gap-2 justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70">{label}</p>
        <Icon className="w-4 h-4 opacity-50" />
      </div>
      <p className="text-2xl font-bold leading-tight">{value}</p>
      {sub && <p className="text-[10px] opacity-60">{sub}</p>}
    </div>
  );
}

export function PanelAdminClient({ data }: { data: PanelAdminData }) {
  const hasBugs = data.duplicateIds.length > 0 || data.missingIcons.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <LayoutGrid className="w-5 h-5 text-blue-600" />
          Konfigurator Rozdzielnicy — Panel Administracyjny
        </h1>
        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {new Date(data.generatedAt).toLocaleString("pl-PL")} · ES-KNR 2026 · DIN Rail v3.0
        </p>
      </div>

      {/* Bug alerts */}
      {hasBugs && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
          <p className="text-[11px] font-bold text-red-700 dark:text-red-300 flex items-center gap-1.5 mb-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Wykryto problemy w katalogu DIN
          </p>
          {data.duplicateIds.length > 0 && (
            <p className="text-[10px] text-red-600 dark:text-red-400">
              Duplikaty ID ({data.duplicateIds.length}): {data.duplicateIds.join(", ")}
            </p>
          )}
          {data.missingIcons.length > 0 && (
            <p className="text-[10px] text-red-600 dark:text-red-400 mt-0.5">
              Brakujące ikony ({data.missingIcons.length}): {data.missingIcons.join(", ")}
            </p>
          )}
        </div>
      )}

      {/* KPI tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatTile
          label="Moduły DIN"
          value={data.totalModules.toString()}
          sub={`${data.categories.length} kategorii`}
          icon={Package}
          color="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800"
        />
        <StatTile
          label="Producenci"
          value={data.manufacturers.toString()}
          sub="z współczynnikami"
          icon={Users}
          color="bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700"
        />
        <StatTile
          label="Szablony"
          value={data.templates.toString()}
          sub="gotowych projektów"
          icon={LayoutGrid}
          color="bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-800"
        />
        <StatTile
          label="Obudowy"
          value={data.enclosureOptions.toString()}
          sub="opcji rozmiarów"
          icon={Shield}
          color="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800"
        />
        <StatTile
          label="Użycia w projektach"
          value={data.panelItemStats.total.toString()}
          sub={data.panelItemStats.lastUsed
            ? `Ostatnio: ${new Date(data.panelItemStats.lastUsed).toLocaleDateString("pl-PL")}`
            : "Brak danych"}
          icon={Activity}
          color="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800"
        />
        <StatTile
          label="Status katalogu"
          value={hasBugs ? "⚠ Błędy" : "✓ OK"}
          sub={hasBugs ? "Wymaga naprawy" : "Brak duplikatów"}
          icon={CheckCircle2}
          color={hasBugs
            ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800"
            : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800"
          }
        />
      </div>

      {/* Main grid: catalog + coverage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Catalog breakdown by category */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="py-2.5 px-4">
            <CardTitle className="text-xs flex items-center gap-2">
              <Package className="w-3.5 h-3.5 text-blue-500" />
              Katalog modułów DIN — {data.totalModules} modułów
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-1.5">
            {data.categories.map(cat => {
              const meta = CATEGORY_LABELS[cat.category] ?? { label: cat.category, color: "bg-slate-100 text-slate-700" };
              const barPct = Math.round((cat.count / data.totalModules) * 100);
              return (
                <div key={cat.category} className="flex items-center gap-2">
                  <Badge variant="secondary" className={cn("text-[9px] px-1.5 shrink-0 w-36 justify-center truncate", meta.color)}>
                    {meta.label}
                  </Badge>
                  <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${barPct}%` }} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 w-6 text-right shrink-0">
                    {cat.count}
                  </span>
                  <span className="text-[9px] text-slate-400 w-14 text-right shrink-0">
                    mat. ≈{cat.avgMaterial} zł
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* DB coverage per category */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="py-2.5 px-4">
            <CardTitle className="text-xs flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-violet-500" />
              Pokrycie DB (catalog_items)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-1.5">
            {data.catalogCoverage.map(cov => {
              const meta = CATEGORY_LABELS[cov.category] ?? { label: cov.category, color: "bg-slate-100 text-slate-700" };
              const hasCov = cov.itemsInDb > 0;
              return (
                <div key={cov.category} className="flex items-center gap-2">
                  <Badge variant="secondary" className={cn("text-[9px] px-1.5 shrink-0 w-36 justify-center truncate", meta.color)}>
                    {meta.label}
                  </Badge>
                  {hasCov ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                  )}
                  <span className="text-[10px] text-slate-600 dark:text-slate-400 flex-1">
                    {hasCov ? `${cov.itemsInDb} pozycji` : "Brak w DB"}
                  </span>
                  {hasCov && cov.avgPrice > 0 && (
                    <span className="text-[9px] text-slate-400 shrink-0">≈{cov.avgPrice} zł</span>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* AI config info */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="py-2.5 px-4">
          <CardTitle className="text-xs flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Konfiguracja AI — Wycena rozdzielnicy
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Model AI</p>
              <p className="text-xs font-mono text-slate-700 dark:text-slate-300">gemini-2.5-flash (Tier 1)</p>
              <p className="text-[9px] text-slate-400 mt-0.5">Schemat jednokreskowy + wycena</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Producenci</p>
              <p className="text-xs font-mono text-slate-700 dark:text-slate-300">×0.70 — ×1.25</p>
              <p className="text-[9px] text-slate-400 mt-0.5">Noname → Siemens (8 wariantów)</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Regiony PL</p>
              <p className="text-xs font-mono text-slate-700 dark:text-slate-300">×0.88 — ×1.12</p>
              <p className="text-[9px] text-slate-400 mt-0.5">16 województw — robocizna</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
              <p className="text-[10px] font-bold text-blue-700 dark:text-blue-300 mb-1">Pipeline wyceny AI</p>
              <div className="space-y-0.5 text-[9px] text-blue-600 dark:text-blue-400">
                <p>1. Kontekst RAG (KB) — normy ES-KNR 2026</p>
                <p>2. 4 poziomy pewności: verified / analog / estimated / uncertain</p>
                <p>3. Audyt — Stage 2 weryfikacja przez Gemini</p>
                <p>4. Separacja: Robocizna / Materiał (Iron Rules)</p>
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
              <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 mb-1">Pipeline schematu AI</p>
              <div className="space-y-0.5 text-[9px] text-emerald-600 dark:text-emerald-400">
                <p>1. Gemini builduje drzewo hierarchii PN-EN 61439</p>
                <p>2. Walidacja: ≥70% nodów musi być zwróca</p>
                <p>3. Fallback: lokalny buildTree (deterministyczny)</p>
                <p>4. Enrichment: fazy L1/L2/L3 round-robin auto</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation rules summary */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="py-2.5 px-4">
          <CardTitle className="text-xs flex items-center gap-2">
            <BarChart3 className="w-3.5 h-3.5 text-slate-500" />
            Reguły walidacji elektrycznej (aktywne)
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {[
              { rule: "#1", label: "Kompletność obwodów", desc: "Każdy MCB musi mieć typ obwodu" },
              { rule: "#2", label: "Brakujące ochr. RCD", desc: "≥1 RCD wymagany w sekcji" },
              { rule: "#3", label: "SPD wymagany", desc: "Brak SPD = ostrzeżenie" },
              { rule: "#4", label: "Rozłącznik główny", desc: "Brak odłącznika = błąd" },
              { rule: "#5a", label: "Selektywność MCB→Main", desc: "≥2 progi różnicy prądu" },
              { rule: "#5b", label: "Suma MCB pod RCD", desc: "∑MCB > RCD = ostrzeżenie" },
              { rule: "#5c", label: "Asymetria faz >30%", desc: "Ostrzeżenie przy nierównym obciążeniu" },
              { rule: "#6", label: "Rezerwa ZUG", desc: "Ceil(obw.×0,5) modułów rezerwy" },
              { rule: "#7", label: "Pojemność DIN rail", desc: "Przekroczenie = błąd" },
            ].map(v => (
              <div key={v.rule} className="flex gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-[9px] font-mono text-slate-400 shrink-0 w-6">{v.rule}</span>
                <div>
                  <p className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">{v.label}</p>
                  <p className="text-[9px] text-slate-400">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
