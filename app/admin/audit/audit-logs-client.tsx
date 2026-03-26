"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  Shield, TrendingUp, TrendingDown, Minus,
  ChevronLeft, ChevronRight, Search, X,
  FilePlus, FilePen, Trash2, Clock, BarChart3,
} from "lucide-react";
import { getCatalogAuditLogs } from "./actions";
import type { CatalogAuditLog } from "./actions";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuditStats {
  today: number;
  week: number;
  total: number;
  topChangedItems: Array<{ item_name: string; change_count: number }>;
}

interface AuditLogsClientProps {
  initialLogs: CatalogAuditLog[];
  total: number;
  stats: AuditStats;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function OperationBadge({ op }: { op: CatalogAuditLog["operation"] }) {
  if (op === "INSERT") return (
    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800 gap-1">
      <FilePlus className="w-3 h-3" />Dodano
    </Badge>
  );
  if (op === "UPDATE") return (
    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800 gap-1">
      <FilePen className="w-3 h-3" />Zmieniono
    </Badge>
  );
  return (
    <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800 gap-1">
      <Trash2 className="w-3 h-3" />Usunięto
    </Badge>
  );
}

function PriceDiff({
  oldVal, newVal, label,
}: { oldVal: number | null; newVal: number | null; label: string }) {
  if (oldVal === null && newVal === null) return <span className="text-slate-400">—</span>;
  if (oldVal === null) return (
    <span className="text-green-600 dark:text-green-400 font-mono text-xs">
      +{newVal?.toFixed(2)} zł
    </span>
  );
  if (newVal === null) return (
    <span className="text-red-500 font-mono text-xs">{oldVal.toFixed(2)} zł</span>
  );
  const diff = newVal - oldVal;
  const pct  = oldVal !== 0 ? ((diff / oldVal) * 100).toFixed(1) : "∞";
  return (
    <span className={cn(
      "font-mono text-xs flex items-center gap-0.5",
      diff > 0 ? "text-red-500" : diff < 0 ? "text-green-600 dark:text-green-400" : "text-slate-500"
    )}>
      {diff > 0 ? <TrendingUp className="w-3 h-3" /> : diff < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
      {newVal.toFixed(2)} zł
      {diff !== 0 && (
        <span className="text-[10px] opacity-70">({diff > 0 ? "+" : ""}{pct}%)</span>
      )}
    </span>
  );
}

function ConfDiff({ oldVal, newVal }: { oldVal: string | null; newVal: string | null }) {
  if (!oldVal && !newVal) return <span className="text-slate-400">—</span>;
  if (oldVal === newVal) return <span className="text-slate-500 text-xs">{newVal}</span>;
  return (
    <span className="text-xs">
      <span className="text-slate-400 line-through mr-1">{oldVal}</span>
      <span className="text-blue-600 dark:text-blue-400">{newVal}</span>
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pl-PL", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

export function AuditLogsClient({ initialLogs, total, stats }: AuditLogsClientProps) {
  const [logs, setLogs]           = useState<CatalogAuditLog[]>(initialLogs);
  const [page, setPage]           = useState(1);
  const [totalCount, setTotal]    = useState(total);
  const [search, setSearch]       = useState("");
  const [isPending, startTrans]   = useTransition();

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const loadPage = (p: number) => {
    startTrans(async () => {
      const result = await getCatalogAuditLogs(p, PAGE_SIZE);
      setLogs(result.logs);
      setTotal(result.total);
      setPage(p);
    });
  };

  const filtered = search
    ? logs.filter(l =>
        l.item_name.toLowerCase().includes(search.toLowerCase()) ||
        l.operation.toLowerCase().includes(search.toLowerCase())
      )
    : logs;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
          <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Audit Log — Katalog</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Historia zmian pozycji katalogu globalnego</p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Dziś" value={stats.today} icon={<Clock className="w-4 h-4 text-blue-500" />} />
        <StatCard label="Ostatnie 7 dni" value={stats.week} icon={<BarChart3 className="w-4 h-4 text-indigo-500" />} />
        <StatCard label="Łącznie" value={stats.total} icon={<Shield className="w-4 h-4 text-slate-500" />} />
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
          <p className="text-[11px] text-slate-400 mb-1.5">Top zmian (7d)</p>
          <div className="space-y-1">
            {stats.topChangedItems.length === 0
              ? <p className="text-xs text-slate-400">Brak danych</p>
              : stats.topChangedItems.slice(0, 3).map((item) => (
                  <div key={item.item_name} className="flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-600 dark:text-slate-300 truncate">{item.item_name}</span>
                    <span className="text-[11px] font-mono bg-slate-100 dark:bg-slate-800 px-1.5 rounded shrink-0">×{item.change_count}</span>
                  </div>
                ))
            }
          </div>
        </div>
      </div>

      {/* Filter + pagination header */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <Input
            id="audit-log-search"
            name="audit-log-search"
            aria-label="Szukaj po nazwie pozycji"
            placeholder="Szukaj po nazwie..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <span className="text-xs text-slate-500 ml-auto">
          {totalCount} wpisów · str. {page}/{totalPages}
        </span>
        <Button size="sm" variant="outline" className="h-8 w-8 p-0"
          disabled={page <= 1 || isPending} onClick={() => loadPage(page - 1)}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="outline" className="h-8 w-8 p-0"
          disabled={page >= totalPages || isPending} onClick={() => loadPage(page + 1)}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-900">
              <TableHead className="w-[130px] text-xs">Data</TableHead>
              <TableHead className="w-[100px] text-xs">Operacja</TableHead>
              <TableHead className="text-xs">Pozycja</TableHead>
              <TableHead className="text-center text-xs w-[120px]">Materiał (zł/szt)</TableHead>
              <TableHead className="text-center text-xs w-[120px]">Robocizna (zł/szt)</TableHead>
              <TableHead className="text-center text-xs w-[100px]">Pewność</TableHead>
              <TableHead className="text-center text-xs w-[80px]">Trend</TableHead>
              <TableHead className="text-xs w-[90px]">Zmienił</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-slate-400 text-sm">
                  {isPending ? "Ładowanie..." : "Brak wpisów"}
                </TableCell>
              </TableRow>
            ) : filtered.map((log) => (
              <TableRow key={log.id}
                className={cn(
                  "text-xs",
                  log.operation === "DELETE" && "bg-red-50/30 dark:bg-red-950/10",
                  log.operation === "INSERT" && "bg-green-50/30 dark:bg-green-950/10",
                )}>
                <TableCell className="font-mono text-[11px] text-slate-500 whitespace-nowrap">
                  {formatDate(log.changed_at)}
                </TableCell>
                <TableCell><OperationBadge op={log.operation} /></TableCell>
                <TableCell className="max-w-[220px]">
                  <span className="font-medium text-slate-800 dark:text-slate-200 line-clamp-2 leading-snug">
                    {log.item_name}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <PriceDiff oldVal={log.old_mat_price} newVal={log.new_mat_price} label="mat" />
                </TableCell>
                <TableCell className="text-center">
                  <PriceDiff oldVal={log.old_lab_price} newVal={log.new_lab_price} label="rob" />
                </TableCell>
                <TableCell className="text-center">
                  <ConfDiff oldVal={log.old_conf_level} newVal={log.new_conf_level} />
                </TableCell>
                <TableCell className="text-center">
                  <ConfDiff oldVal={log.old_trend} newVal={log.new_trend} />
                </TableCell>
                <TableCell className="font-mono text-[10px] text-slate-400 max-w-[90px] truncate">
                  {log.changed_by ? log.changed_by.slice(0, 8) + "…" : "system"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Bottom pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button size="sm" variant="outline" disabled={page <= 1 || isPending}
            onClick={() => loadPage(page - 1)}>
            <ChevronLeft className="w-4 h-4 mr-1" />Poprzednia
          </Button>
          <span className="text-sm text-slate-500">{page} / {totalPages}</span>
          <Button size="sm" variant="outline" disabled={page >= totalPages || isPending}
            onClick={() => loadPage(page + 1)}>
            Następna<ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-[11px] text-slate-400">{label}</p>
        <p className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight">{value}</p>
      </div>
    </div>
  );
}
