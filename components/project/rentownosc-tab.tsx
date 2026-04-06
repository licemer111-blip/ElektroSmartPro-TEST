"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp, TrendingDown, Wallet, Banknote, Timer,
  ShieldCheck, ShieldAlert, ShieldX, MapPin, Percent,
  BarChart3, Loader2, RefreshCw, Info,
} from "lucide-react";
import { type ProfitabilityData } from "@/app/dashboard/projects/[id]/profitability-actions";
import { useRentownosc } from "@/hooks/use-rentownosc";
import { cn } from "@/lib/utils";

interface RentownoscTabProps {
  projectId: string;
  isPro: boolean;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function fmt(v: number, isPro: boolean) {
  if (!isPro) return "*** zł";
  return new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(v);
}

function fmtPct(v: number) {
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
}

function fmtHours(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

// ── sub-components ────────────────────────────────────────────────────────────

function MetricCard({
  label, value, sub, icon: Icon, color, badge, badgeColor,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color: string;
  badge?: string;
  badgeColor?: string;
}) {
  return (
    <Card className="border-slate-200 dark:border-slate-800">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className={`p-1.5 rounded-lg ${color}`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          {badge && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>
              {badge}
            </span>
          )}
        </div>
        <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">{label}</p>
        <p className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-0.5">{value}</p>
        {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// Simple CSS bar chart — no external lib needed
function BarChart({ bars }: { bars: { label: string; value: number; color: string; total: number }[] }) {
  const max = Math.max(...bars.map(b => b.value), 1);
  return (
    <div className="space-y-2.5">
      {bars.map((bar) => (
        <div key={bar.label}>
          <div className="flex justify-between text-[10px] text-slate-500 mb-1">
            <span>{bar.label}</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(bar.value)}
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${bar.color}`}
              style={{ width: `${Math.min(100, (bar.value / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// Donut-style pie using SVG — no external lib
function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return null;

  const r = 40;
  const cx = 60;
  const cy = 60;
  const circumference = 2 * Math.PI * r;

  let offset = 0;
  const arcs = segments.map((seg) => {
    const pct = seg.value / total;
    const dash = pct * circumference;
    const arc = { ...seg, dash, offset, pct };
    offset += dash;
    return arc;
  });

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <svg width="100" height="100" viewBox="0 0 120 120" className="flex-shrink-0 w-20 h-20 sm:w-[100px] sm:h-[100px]">
        {arcs.map((arc, i) => (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            strokeWidth="18"
            className={arc.color}
            strokeDasharray={`${arc.dash} ${circumference - arc.dash}`}
            strokeDashoffset={-arc.offset}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        ))}
        <circle cx={cx} cy={cy} r={r - 9} fill="white" className="dark:fill-slate-900" />
      </svg>
      <div className="space-y-1.5 min-w-0">
        {arcs.map((arc) => (
          <div key={arc.label} className="flex items-center gap-2 text-[10px]">
            <span className={`w-2.5 h-2.5 rounded-sm flex-shrink-0 ${arc.color.replace("stroke-", "bg-")}`} />
            <span className="text-slate-600 dark:text-slate-400 truncate">{arc.label}</span>
            <span className="font-bold text-slate-700 dark:text-slate-300 ml-auto pl-2">
              {(arc.pct * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function KnrSafetyBadge({ score, manual, total }: { score: number; manual: number; total: number }) {
  const manualPct = total > 0 ? (manual / total) * 100 : 0;

  const config =
    manualPct <= 20
      ? { label: "Wysoka pewność", icon: ShieldCheck, bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-800", text: "text-emerald-700 dark:text-emerald-300", bar: "bg-emerald-500", desc: "Większość pozycji posiada zweryfikowane kody KNR." }
      : manualPct <= 50
        ? { label: "Średnie ryzyko", icon: ShieldAlert, bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-800", text: "text-amber-700 dark:text-amber-300", bar: "bg-amber-500", desc: "Część pozycji wymaga ręcznej weryfikacji cen." }
        : { label: "Wysokie ryzyko", icon: ShieldX, bg: "bg-red-50 dark:bg-red-950/30", border: "border-red-200 dark:border-red-800", text: "text-red-700 dark:text-red-300", bar: "bg-red-500", desc: "Ponad połowa pozycji nie ma przypisanych norm KNR — ceny mogą być niedokładne." };

  const Icon = config.icon;

  return (
    <div className={`rounded-xl border p-4 ${config.bg} ${config.border}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${config.text}`} />
          <span className={`text-sm font-bold ${config.text}`}>{config.label}</span>
        </div>
        <span className={`text-2xl font-black ${config.text}`}>{score}%</span>
      </div>
      <Progress value={score} className="h-2 mb-2" />
      <div className="flex justify-between text-[10px] text-slate-500 mb-2">
        <span>0%</span>
        <span className="text-amber-500">50%</span>
        <span>100%</span>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-3">
        <div className="flex items-center gap-1.5 text-[10px]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
          <span className="text-slate-600 dark:text-slate-400">Zweryfikowane KNR:</span>
          <span className="font-bold text-slate-700 dark:text-slate-300">{total - manual}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px]">
          <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
          <span className="text-slate-600 dark:text-slate-400">Manual / Brak:</span>
          <span className="font-bold text-slate-700 dark:text-slate-300">{manual}</span>
        </div>
      </div>
      <p className={`text-[10px] mt-2 ${config.text}`}>{config.desc}</p>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export function RentownoscTab({ projectId, isPro }: RentownoscTabProps) {
  const { data, loading, refresh: load } = useRentownosc(projectId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <BarChart3 className="w-10 h-10 text-slate-300" />
        <p className="text-sm text-slate-500">Brak danych do analizy.</p>
        <p className="text-xs text-slate-400">Dodaj pozycje i wyceń je, aby zobaczyć raport rentowności.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Analiza rentowności</h2>
          <p className="text-xs text-slate-500 mt-0.5">Zysk, narzut i marża — obliczane na żywo z pozycji kosztorysu</p>
        </div>
        <button
          onClick={load}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
          title="Odśwież dane"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Main profit hero card */}
      <Card className={cn(
        "border-0 shadow-lg",
        data.netProfit >= 0
          ? "bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/20"
          : "bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/20"
      )}>
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Zysk netto (szacunkowy)</p>
              <p className={cn(
                "text-2xl sm:text-4xl font-black mt-1 break-all",
                data.netProfit >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"
              )}>
                {fmt(data.netProfit, isPro)}
              </p>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-1.5 leading-relaxed">
                Przychód netto: {fmt(data.totalRevenue, isPro)}<br className="sm:hidden" />
                <span className="hidden sm:inline"> · </span>Brutto: {fmt(data.totalRevenueGross, isPro)}
              </p>
            </div>
            <div className="flex sm:flex-col items-center sm:items-end gap-2 flex-shrink-0">
              <Badge className={cn(
                "text-xs sm:text-sm font-bold px-2 sm:px-3 py-1",
                data.netProfit >= 0
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                  : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
              )}>
                {data.netProfit >= 0
                  ? <TrendingUp className="w-3.5 h-3.5 mr-1 inline" />
                  : <TrendingDown className="w-3.5 h-3.5 mr-1 inline" />
                }
                {fmtPct(data.marginPercent)} marży
              </Badge>
              <span className="text-[10px] text-slate-400">VAT {data.vatRate}%: {fmt(data.vatAmount, isPro)}</span>
            </div>
          </div>

          {/* Margin progress bar */}
          <div className="mt-4">
            <Progress value={Math.max(0, Math.min(100, data.marginPercent))} className="h-2" />
            <div className="flex justify-between mt-1 text-[9px] text-slate-400">
              <span>0%</span>
              <span className="text-amber-500 hidden xs:block">20% (min.)</span>
              <span className="text-emerald-500">50%+</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metric cards row */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="Materiały"
          value={fmt(data.materialRevenue, isPro)}
          sub={`Kz: ${data.kzPercent}% = ${fmt(data.kzAmount, isPro)}`}
          icon={Wallet}
          color="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
        />
        <MetricCard
          label="Robocizna"
          value={fmt(data.laborRevenue, isPro)}
          sub={`Kp: ${data.kpPercent}% · Z: ${data.zPercent}%`}
          icon={Banknote}
          color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
        />
        <MetricCard
          label="Koszty pośrednie (Kp)"
          value={fmt(data.kpAmount, isPro)}
          sub={`${data.kpPercent}% od robocizny`}
          icon={Percent}
          color="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
          badge={`Kp ${data.kpPercent}%`}
          badgeColor="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
        />
        <MetricCard
          label="Zysk kalkulacyjny (Z)"
          value={fmt(data.zAmount, isPro)}
          sub={`${data.zPercent}% od (R+Kp)`}
          icon={TrendingUp}
          color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
          badge={`Z ${data.zPercent}%`}
          badgeColor="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Bar chart: revenue breakdown */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-3">Struktura przychodów</p>
            <BarChart bars={[
              { label: "Materiały (M+Kz)", value: data.materialRevenue, color: "bg-orange-400", total: data.totalRevenue },
              { label: "Robocizna (R)", value: data.laborRevenue - data.kpAmount - data.zAmount, color: "bg-blue-400", total: data.totalRevenue },
              { label: "Koszty pośrednie (Kp)", value: data.kpAmount, color: "bg-amber-400", total: data.totalRevenue },
              { label: "Zysk kalkulacyjny (Z)", value: data.zAmount, color: "bg-emerald-400", total: data.totalRevenue },
            ]} />
          </CardContent>
        </Card>

        {/* Donut: material vs labor split */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-3">Podział M / R</p>
            {data.totalRevenue > 0 ? (
              <DonutChart segments={[
                { label: "Materiały", value: data.materialRevenue, color: "stroke-orange-400" },
                { label: "Robocizna", value: data.laborRevenue, color: "stroke-blue-500" },
              ]} />
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">Brak danych</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* KNR Safety Score */}
      <KnrSafetyBadge
        score={data.knrSafetyScore}
        manual={data.knrManualItems}
        total={data.totalItems}
      />

      {/* Region + Adjustments */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-4">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-3">Modyfikatory wpływające na zysk</p>
          <div className="space-y-2.5">
            {/* Region */}
            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-xs text-slate-600 dark:text-slate-400">Region (województwo)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">{data.regionName}</span>
                <Badge className={cn(
                  "text-[10px] font-bold",
                  data.regionModifier >= 1
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                )}>
                  ×{data.regionModifier.toFixed(2)}
                </Badge>
              </div>
            </div>

            {/* Adjustment */}
            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Percent className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs text-slate-600 dark:text-slate-400">Korekta globalna (rabat/narzut)</span>
              </div>
              <Badge className={cn(
                "text-[10px] font-bold",
                data.adjustmentPercent === 0
                  ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  : data.adjustmentPercent > 0
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                    : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
              )}>
                {data.adjustmentPercent === 0 ? "Brak" : fmtPct(data.adjustmentPercent)}
              </Badge>
            </div>

            {/* Narzuty summary */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-violet-500" />
                <span className="text-xs text-slate-600 dark:text-slate-400">Suma narzutów (Kp+Z+Kz)</span>
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {fmt(data.kpAmount + data.zAmount + data.kzAmount, isPro)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time tracking / PLN per rbh */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Timer className="w-4 h-4 text-violet-500" />
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Zysk na godzinę (PLN/rbh)</p>
          </div>
          {data.totalMinutes > 0 ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 xs:grid-cols-3 gap-2 sm:gap-3">
                <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-900">
                  <p className="text-[9px] text-slate-400 uppercase">Czas pracy</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{fmtHours(data.totalMinutes)}</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-900">
                  <p className="text-[9px] text-slate-400 uppercase">Stawka planowana</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{fmt(data.hourlyRate, isPro)}/h</p>
                </div>
                <div className={cn(
                  "text-center p-2 rounded-lg",
                  data.effectiveHourlyRate >= data.hourlyRate
                    ? "bg-emerald-50 dark:bg-emerald-950/30"
                    : "bg-amber-50 dark:bg-amber-950/30"
                )}>
                  <p className="text-[9px] text-slate-400 uppercase">Efektywna</p>
                  <p className={cn(
                    "text-sm font-bold",
                    data.effectiveHourlyRate >= data.hourlyRate
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-amber-700 dark:text-amber-400"
                  )}>
                    {fmt(data.effectiveHourlyRate, isPro)}/h
                  </p>
                </div>
              </div>
              <Progress
                value={Math.min(100, data.hourlyRate > 0 ? (data.effectiveHourlyRate / data.hourlyRate) * 100 : 0)}
                className="h-1.5"
              />
              <p className="text-[10px] text-slate-400">
                {data.effectiveHourlyRate >= data.hourlyRate
                  ? "✅ Stawka efektywna powyżej planowanej — projekt jest rentowny czasowo."
                  : "⚠️ Stawka efektywna poniżej planowanej — projekt zajął więcej czasu niż zakładano."}
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-400">
              Brak wpisów śledzenia czasu. Uruchom timer w zakładce projektu, aby porównać planowane vs faktyczne koszty robocizny.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Free tier blur overlay */}
      {!isPro && (
        <div className="rounded-xl border border-orange-200 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-950/20 p-4 text-center">
          <p className="text-sm font-semibold text-orange-700 dark:text-orange-300">
            🔒 Szczegółowe kwoty są dostępne w planie PRO
          </p>
          <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
            Zaktualizuj plan, aby zobaczyć pełną analizę rentowności z kwotami.
          </p>
        </div>
      )}
    </div>
  );
}
