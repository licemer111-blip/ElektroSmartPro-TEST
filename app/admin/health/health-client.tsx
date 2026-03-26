"use client";

import React, { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  CheckCircle2, AlertTriangle, XCircle, RefreshCw, Wrench,
  TrendingUp, Shield, Database, Zap, Clock, Activity, BookOpen,
  Package, Cpu, BarChart3, FileText, ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { repairUncertainPrices } from "./actions";
import type { CatalogHealthReport, OriginTypeHealth } from "./actions";

// ─── Status helpers ───────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: OriginTypeHealth["status"] }) {
  if (status === "ok") return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
  if (status === "warn") return <AlertTriangle className="w-4 h-4 text-amber-500" />;
  return <XCircle className="w-4 h-4 text-red-500" />;
}

function CategoryBadge({ cat }: { cat: OriginTypeHealth["category"] }) {
  const map: Record<string, string> = {
    material:    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400",
    labor:       "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400",
    consumable:  "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-400",
    system:      "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400",
  };
  return (
    <span className={cn("px-1.5 py-0.5 text-[10px] font-medium rounded border", map[cat])}>
      {cat}
    </span>
  );
}

function KpiCard({
  title, value, subtitle, icon: Icon, color, trend,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: "emerald" | "blue" | "red" | "amber";
  trend?: "up" | "down" | "neutral";
}) {
  const bg = {
    emerald: "from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 border-emerald-200 dark:border-emerald-800",
    blue:    "from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800",
    red:     "from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 border-red-200 dark:border-red-800",
    amber:   "from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 border-amber-200 dark:border-amber-800",
  }[color];
  const iconColor = {
    emerald: "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40",
    blue:    "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40",
    red:     "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40",
    amber:   "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40",
  }[color];
  const valColor = {
    emerald: "text-emerald-700 dark:text-emerald-300",
    blue:    "text-blue-700 dark:text-blue-300",
    red:     "text-red-700 dark:text-red-300",
    amber:   "text-amber-700 dark:text-amber-300",
  }[color];

  return (
    <Card className={cn("border bg-gradient-to-br", bg)}>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">{title}</p>
            <p className={cn("text-3xl font-bold", valColor)}>{value}</p>
            {subtitle && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
          </div>
          <div className={cn("p-2.5 rounded-xl flex-shrink-0", iconColor)}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        {trend && (
          <div className="mt-3 flex items-center gap-1">
            <TrendingUp className={cn("w-3.5 h-3.5", trend === "up" ? "text-emerald-500" : trend === "down" ? "text-red-500" : "text-slate-400")} />
            <span className="text-[11px] text-slate-500">
              {trend === "up" ? "Poprawa" : trend === "down" ? "Wymaga uwagi" : "Bez zmian"}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ value, color = "blue" }: { value: number; color?: string }) {
  const barColor = {
    blue: "bg-blue-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
  }[color] ?? "bg-blue-500";

  return (
    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
      <div
        className={cn("h-1.5 rounded-full transition-all duration-500", barColor)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}


function formatBytes(bytes: number) {
  if (bytes === 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

// ─── Compact stat tile ────────────────────────────────────────────────────────

function StatTile({
  label, value, sub, icon: Icon, color,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className={cn("rounded-xl border p-3 flex items-start gap-2.5", color)}>
      <Icon className="w-4 h-4 shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70 truncate">{label}</p>
        <p className="text-xl font-bold leading-tight">{value}</p>
        {sub && <p className="text-[10px] opacity-60 truncate mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Main client component ────────────────────────────────────────────────────

interface HealthClientProps {
  report: CatalogHealthReport;
}

export function HealthClient({ report }: HealthClientProps) {
  const [isPending, startTransition] = useTransition();
  const [repairResult, setRepairResult] = useState<{ repaired: number; skipped: number } | null>(null);
  const [activeTab, setActiveTab] = useState<"origin" | "catalog" | "rag" | "engine">("origin");

  const handleRepair = () => {
    startTransition(async () => {
      const result = await repairUncertainPrices();
      setRepairResult(result);
    });
  };

  const errorRows = report.rows.filter(r => r.status === "error");
  const warnRows = report.rows.filter(r => r.status === "warn");
  const okRows = report.rows.filter(r => r.status === "ok");
  const es = report.engineStats;

  const knrPct = es.totalProjectItems > 0
    ? Math.round((es.knrCoveredItems / es.totalProjectItems) * 100)
    : 0;
  const verifiedPct = report.projectItemStats.withOriginId > 0
    ? Math.round((report.verifiedTotal / report.projectItemStats.withOriginId) * 100)
    : 0;

  const TABS = [
    { id: "origin",  label: "ES Engine Rack",    icon: Zap },
    { id: "catalog", label: "Katalog pozycji",   icon: Package },
    { id: "rag",     label: "Baza Wiedzy (RAG)", icon: BookOpen },
    { id: "engine",  label: "Silnik ES",         icon: Cpu },
  ] as const;

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600 shrink-0" />
            Health Monitor
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(report.generatedAt).toLocaleString("pl-PL")} · ES-KNR 2026 · Zestawy v2.0
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => window.location.reload()} className="gap-1.5 h-8">
          <RefreshCw className="w-3.5 h-3.5" /> Odśwież
        </Button>
      </div>

      {/* ── Top KPI row (6 tiles) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatTile
          label="Ceny pokryte"
          value={`${report.priceCoveragePct}%`}
          sub={`${report.rows.filter(r => r.avgMaterialPrice != null || r.avgLaborPrice != null).length}/${report.totalChecked} typów`}
          icon={TrendingUp}
          color="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800"
        />
        <StatTile
          label="KNR normy"
          value={`${report.knrCoveragePct}%`}
          sub={`${report.rows.filter(r => r.hasKnrNorm).length}/${report.totalChecked} typów`}
          icon={Database}
          color="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800"
        />
        <StatTile
          label="Uncertain"
          value={report.uncertainTotal}
          sub={report.uncertainTotal === 0 ? "Brak błędów ✓" : `${errorRows.length} typów z błędami`}
          icon={XCircle}
          color={report.uncertainTotal === 0
            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800"
            : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800"}
        />
        <StatTile
          label="Katalog pozycji"
          value={es.totalCatalogItems}
          sub={`${es.categoriesCount} kategorii`}
          icon={Package}
          color="bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-800"
        />
        <StatTile
          label="ES-Dictionary"
          value={es.totalEsDictionary}
          sub="norm KNR w bazie"
          icon={BookOpen}
          color="bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-800"
        />
        <StatTile
          label="Projekty aktywne"
          value={es.activeProjects}
          sub={`${es.totalProjectItems} pozycji łącznie`}
          icon={BarChart3}
          color="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800"
        />
      </div>

      {/* ── Coverage progress bars ── */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="px-4 py-3 space-y-2.5">
          {[
            { label: "Ceny materiałów / robocizna", value: report.priceCoveragePct, color: "emerald" as const },
            { label: "Pokrycie KNR (normy robocizny)", value: report.knrCoveragePct, color: "blue" as const },
            { label: "Pozycje VERIFIED w projektach", value: verifiedPct, color: "emerald" as const },
            { label: "Pozycje z kodem KNR", value: knrPct, color: "indigo" as const },
          ].map(({ label, value, color }) => (
            <div key={label} className="space-y-0.5">
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>{label}</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{value}%</span>
              </div>
              <ProgressBar value={value} color={color === "indigo" ? "blue" : color} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ── Alert banners ── */}
      {errorRows.length > 0 && (
        <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
          <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-red-800 dark:text-red-300">
              {errorRows.length} błędów · {report.uncertainTotal} pozycji UNCERTAIN
            </p>
            <p className="text-[11px] text-red-600 dark:text-red-400 mt-0.5 truncate">
              {errorRows.map(r => r.displayName).join(", ")}
            </p>
          </div>
          <Button
            size="sm"
            onClick={handleRepair}
            disabled={isPending || report.uncertainTotal === 0}
            className="shrink-0 gap-1.5 bg-red-600 hover:bg-red-700 text-white h-7 text-xs px-2"
          >
            {isPending ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Wrench className="w-3 h-3" />}
            Napraw
          </Button>
        </div>
      )}
      {errorRows.length === 0 && warnRows.length > 0 && (
        <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-amber-800 dark:text-amber-300">{warnRows.length} typów bez cen</p>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 truncate">
              {warnRows.map(r => r.displayName).join(", ")}
            </p>
          </div>
        </div>
      )}
      {repairResult && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-xs text-emerald-800 dark:text-emerald-300">
            Naprawa: <strong>{repairResult.repaired}</strong> naprawionych · <strong>{repairResult.skipped}</strong> pominięto
          </span>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex gap-0.5 border-b border-slate-200 dark:border-slate-800">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors",
              activeTab === id
                ? "border-blue-600 text-blue-700 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            {label}
            {id === "origin" && (
              <span className={cn(
                "ml-0.5 text-[9px] font-bold px-1 py-0.5 rounded-full",
                errorRows.length > 0 ? "bg-red-100 text-red-600" :
                warnRows.length > 0 ? "bg-amber-100 text-amber-600" :
                "bg-emerald-100 text-emerald-600"
              )}>
                {errorRows.length > 0 ? errorRows.length : warnRows.length > 0 ? warnRows.length : okRows.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab: ES Engine Rack (Origin Types) ── */}
      {activeTab === "origin" && (
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="py-2.5 px-4">
            <CardTitle className="text-xs flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-indigo-500" />
              Typy modułów — ES Engine Rack · synchronizacja
              <Badge variant="secondary" className="text-[9px] px-1.5">{report.rows.length} typów</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="text-[10px] text-slate-500 uppercase tracking-wide bg-slate-50 dark:bg-slate-800/50">
                  <TableHead className="pl-4 py-2">Typ / Nazwa</TableHead>
                  <TableHead className="py-2">Kategoria</TableHead>
                  <TableHead className="py-2">KNR</TableHead>
                  <TableHead className="text-right py-2">Norma</TableHead>
                  <TableHead className="text-right py-2">Mat.</TableHead>
                  <TableHead className="text-right py-2">Rob.</TableHead>
                  <TableHead className="text-right py-2">L3</TableHead>
                  <TableHead className="text-right py-2">L2A</TableHead>
                  <TableHead className="text-center py-2">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.rows.map(row => (
                  <TableRow
                    key={row.originType}
                    className={cn(
                      "text-xs",
                      row.status === "error" && "bg-red-50/60 dark:bg-red-950/10",
                      row.status === "warn" && "bg-amber-50/60 dark:bg-amber-950/10",
                    )}
                  >
                    <TableCell className="pl-4 py-2 font-medium">
                      <div className="flex flex-col leading-tight">
                        <span className="text-xs">{row.displayName}</span>
                        <span className="text-[9px] text-slate-400 font-mono">{row.originType}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2"><CategoryBadge cat={row.category} /></TableCell>
                    <TableCell className="py-2">
                      {row.knrCode ? (
                        <span className="text-[9px] font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-600 dark:text-slate-400">{row.knrCode}</span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-[10px] py-2">
                      {row.laborNorm != null ? `${row.laborNorm}` : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-[10px] py-2">
                      {row.avgMaterialPrice != null
                        ? `${row.avgMaterialPrice.toFixed(0)} zł`
                        : row.category === "labor"
                          ? <span className="text-slate-300">—</span>
                          : <span className="text-amber-500 font-medium">brak</span>
                      }
                    </TableCell>
                    <TableCell className="text-right font-mono text-[10px] py-2">
                      {row.avgLaborPrice != null
                        ? `${row.avgLaborPrice.toFixed(0)} zł`
                        : <span className="text-slate-300">—</span>
                      }
                    </TableCell>
                    <TableCell className="text-right py-2">
                      {row.uncertainCount > 0 ? (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                          {row.uncertainCount}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-[10px]">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right py-2">
                      <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-medium">
                        {row.verifiedCount}
                      </span>
                    </TableCell>
                    <TableCell className="text-center py-2">
                      <StatusIcon status={row.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4 text-[10px] text-slate-400">
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" />{okRows.length} OK</span>
              <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-amber-500" />{warnRows.length} Warn</span>
              <span className="flex items-center gap-1"><XCircle className="w-3 h-3 text-red-500" />{errorRows.length} Error</span>
              <span className="ml-auto">L3 = Uncertain · L2A = Verified</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Tab: Katalog pozycji ── */}
      {activeTab === "catalog" && (
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="py-2.5 px-4">
            <CardTitle className="text-xs flex items-center gap-2">
              <Package className="w-3.5 h-3.5 text-blue-500" />
              Katalog pozycji — pokrycie cenowe
              <Badge variant="secondary" className="text-[9px] px-1.5">{report.catalogStats.length} kategorii</Badge>
              <span className="ml-auto text-[10px] text-slate-400 font-normal">
                {es.totalCatalogItems} pozycji łącznie
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="text-[10px] text-slate-500 uppercase tracking-wide bg-slate-50 dark:bg-slate-800/50">
                  <TableHead className="pl-4 py-2">Kategoria</TableHead>
                  <TableHead className="text-right py-2">Pozycji</TableHead>
                  <TableHead className="text-right py-2">Z KNR</TableHead>
                  <TableHead className="text-right py-2">Zweryfik.</TableHead>
                  <TableHead className="text-right py-2">Śr. cena</TableHead>
                  <TableHead className="py-2 w-28">Wypełnienie</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.catalogStats.map((stat, i) => (
                  <TableRow key={i} className="text-xs">
                    <TableCell className="pl-4 py-2 font-medium">{stat.category}</TableCell>
                    <TableCell className="text-right py-2 font-mono">{stat.itemCount}</TableCell>
                    <TableCell className="text-right py-2">
                      {stat.withKnr > 0
                        ? <span className="text-emerald-600 font-medium">{stat.withKnr}</span>
                        : <span className="text-slate-300">0</span>
                      }
                    </TableCell>
                    <TableCell className="text-right py-2">
                      {stat.verified > 0
                        ? <span className="text-blue-600 font-medium">{stat.verified}</span>
                        : <span className="text-slate-300">0</span>
                      }
                    </TableCell>
                    <TableCell className="text-right font-mono text-[10px] py-2">
                      {stat.avgPrice > 0
                        ? `${stat.avgPrice.toFixed(0)} zł`
                        : <span className="text-amber-500 font-medium text-[9px]">brak</span>
                      }
                    </TableCell>
                    <TableCell className="py-2 w-28">
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1">
                          <ProgressBar
                            value={Math.min(100, (stat.itemCount / 15) * 100)}
                            color={stat.itemCount >= 15 ? "emerald" : stat.itemCount >= 5 ? "amber" : "red"}
                          />
                        </div>
                        <span className="text-[9px] text-slate-400 w-6 text-right">{stat.itemCount}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ── Tab: Baza Wiedzy RAG ── */}
      {activeTab === "rag" && (() => {
        const kn = report.knrNormsStats;
        return (
          <div className="space-y-3">
            {/* KNR Norms DB — primary */}
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader className="py-2.5 px-4">
                <CardTitle className="text-xs flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-violet-500" />
                  Baza KNR — normy zaimportowane (PostgreSQL)
                  <Badge className="text-[9px] px-1.5 bg-violet-100 text-violet-700 border-violet-200">
                    {kn.total} norm
                  </Badge>
                  <Badge variant="secondary" className="text-[9px] px-1.5">
                    {kn.byCatalog.length} katalogów
                  </Badge>
                  {kn.lastImport && (
                    <span className="ml-auto text-[9px] text-slate-400 font-normal">
                      Ostatni import: {new Date(kn.lastImport).toLocaleString("pl-PL")}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
                  {kn.byCatalog.map(cat => (
                    <div key={cat.prefix} className="flex items-center justify-between p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate font-mono">{cat.prefix}</p>
                        {cat.lastUpdate && (
                          <p className="text-[9px] text-slate-400 truncate">{new Date(cat.lastUpdate).toLocaleDateString("pl-PL")}</p>
                        )}
                      </div>
                      <span className="ml-2 shrink-0 text-xs font-bold text-violet-600 dark:text-violet-400">{cat.count}</span>
                    </div>
                  ))}
                </div>
                {kn.total === 0 && (
                  <p className="text-[11px] text-slate-400 italic">
                    Brak norm KNR — wgraj pliki JSON w sekcji Baza Wiedzy
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Storage bucket — secondary, just what’s there */}
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader className="py-2.5 px-4">
                <CardTitle className="text-xs flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-blue-500" />
                  Pliki AI-kontekstu (bucket ai-knowledge-base)
                  <Badge variant="secondary" className="text-[9px] px-1.5">
                    {kn.bucketFiles.length} plików
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                {kn.bucketFiles.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">Brak plików w bucket — można dodać pliki .txt/.json z kontekstem AI</p>
                ) : (
                  <div className="space-y-1">
                    {kn.bucketFiles.map(f => (
                      <div key={f.name} className="flex items-center gap-2 py-1 border-b border-slate-100 dark:border-slate-800 last:border-0">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                        <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 flex-1 truncate">{f.name}</span>
                        <span className="text-[9px] text-slate-400 shrink-0">{formatBytes(f.size)}</span>
                        {f.updatedAt && (
                          <span className="text-[9px] text-slate-400 shrink-0">{new Date(f.updatedAt).toLocaleDateString("pl-PL")}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );
      })()}

      {/* ── Tab: Silnik ES — runtime stats ── */}
      {activeTab === "engine" && (
        <div className="space-y-4">
          {/* Engine overview cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Stawka RBH</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">{es.baseRbhRate} <span className="text-sm font-normal">PLN/rbh</span></p>
              <p className="text-[10px] text-slate-400 mt-0.5">Bazowa stawka admina (P3)</p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Mnożnik mat.</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">×{es.matMultiplier.toFixed(2)}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Inflacja materiałów 2026</p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">ES-Dictionary</p>
              <p className="text-2xl font-bold text-violet-600 dark:text-violet-400 mt-0.5">{es.totalEsDictionary}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">norm KNR w bazie</p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Katalog</p>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">{es.totalCatalogItems}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{es.categoriesCount} kategorii</p>
            </div>
          </div>

          {/* Confidence breakdown — L1/L2/L3 colors */}
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="py-2.5 px-4">
              <CardTitle className="text-xs flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-violet-500" />
                Rozkład Confidence Level — wszystkie projekty
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {([
                  { lvl: "verified",  label: "L2A Verified",  cls: "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800" },
                  { lvl: "analog",    label: "L2B Analog",    cls: "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800" },
                  { lvl: "estimated", label: "L3 Szacunek",   cls: "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800" },
                  { lvl: "uncertain", label: "Uncertain",     cls: "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800" },
                  { lvl: "manual",    label: "Ręczna",        cls: "bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700" },
                  { lvl: "unmatched", label: "L1 Katalog",    cls: "bg-violet-50 border-violet-200 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-800" },
                ] as const).map(({ lvl, label, cls }) => {
                  const count = report.projectItemStats.byConfidence[lvl] ?? 0;
                  return (
                    <div key={lvl} className={cn("flex flex-col items-center p-2.5 rounded-xl border", cls)}>
                      <span className="text-xl font-bold">{count}</span>
                      <span className="text-[9px] font-semibold uppercase tracking-wide mt-0.5 text-center">{label}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* User KNR dictionary stats */}
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="py-2.5 px-4">
              <CardTitle className="text-xs flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-violet-500" />
                ES-Dictionary — Wpisy użytkowników vs Globalne
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">Globalne (seed)</p>
                  <p className="text-xl font-bold text-violet-600 dark:text-violet-400">{report.userKnrStats.globalEntries}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">wpisów w bazie</p>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">Użytkowników (własne)</p>
                  <p className={cn("text-xl font-bold", report.userKnrStats.userEntries > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400")}>
                    {report.userKnrStats.userEntries}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {report.userKnrStats.userEntries === 0 ? "brak importów" : "zaimportowanych"}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">Kategorie user</p>
                  <p className={cn("text-xl font-bold", report.userKnrStats.userCategories.length > 0 ? "text-blue-600 dark:text-blue-400" : "text-slate-400")}>
                    {report.userKnrStats.userCategories.length}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">typów kategorii</p>
                </div>
              </div>
              {report.userKnrStats.userEntries > 0 && Object.keys(report.userKnrStats.userByCategory).length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(report.userKnrStats.userByCategory).map(([cat, count]) => (
                    <span key={cat} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                      {cat}
                      <span className="font-bold">{count}</span>
                    </span>
                  ))}
                </div>
              )}
              {report.userKnrStats.userEntries === 0 && (
                <p className="text-[11px] text-slate-400 italic">
                  Brak własnych norm KNR — użytkownicy mogą importować pliki XLSX/CSV w Ustawieniach → Baza Wiedzy
                </p>
              )}
            </CardContent>
          </Card>

          {/* ES Engine waterfall reminder */}
          <Card className="border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900 dark:to-slate-800/50">
            <CardContent className="px-4 py-4">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-blue-500" />
                ES-Engine — Hierarchia źródeł cen (P1 → P2 → P3)
              </p>
              <div className="space-y-1">
                {[
                  { tier: "P1", color: "bg-violet-500", label: "Katalog prywatny elektryka", desc: "use_custom_rates=true → custom_labor_rate × region_modifier" },
                  { tier: "P2", color: "bg-blue-500",   label: "Stawka bazowa elektryka",   desc: "profiles.hourly_rate × region_modifier (gdy P1 wyłączony)" },
                  { tier: "P3", color: "bg-amber-500",  label: "Stawka domyślna (fallback)",  desc: `admin_settings = ${es.baseRbhRate} PLN/rbh × region_modifier (gdy P1+P2 brak)` },
                ].map(({ tier, color, label, desc }) => (
                  <div key={tier} className="flex items-start gap-2.5 py-1.5">
                    <span className={cn("text-[10px] font-bold text-white px-1.5 py-0.5 rounded shrink-0 mt-0.5", color)}>{tier}</span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">{label}</p>
                      <p className="text-[10px] text-slate-400 font-mono truncate">{desc}</p>
                    </div>
                    <ArrowUpRight className="w-3 h-3 text-slate-300 shrink-0 mt-1" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Footer ── */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
        <span>Wszystkich pozycji: <strong className="text-slate-600 dark:text-slate-300">{report.projectItemStats.total}</strong></span>
        <span>Z panelu rozdzielnicy: <strong className="text-slate-600 dark:text-slate-300">{report.projectItemStats.withOriginId}</strong></span>
        <span>Z kodem KNR: <strong className="text-slate-600 dark:text-slate-300">{es.knrCoveredItems}</strong> ({knrPct}%)</span>
      </div>
    </div>
  );
}
