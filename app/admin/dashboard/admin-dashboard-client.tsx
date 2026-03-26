"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Users, Crown, TrendingUp, FolderKanban,
  Eye, MousePointerClick, MapPin, Package,
  ArrowUpRight, DollarSign, UserPlus, Zap,
  Activity, Brain, BarChart3, ExternalLink,
  Wrench, FlaskConical, Loader2, CheckCircle, AlertCircle, Trash2,
} from "lucide-react";
import { resetStats } from "@/app/admin/actions";
import type { AdminKpiData, VoivodeshipStat, PopularAssemblyStat } from "@/app/admin/actions";

interface Props {
  kpi: AdminKpiData | null;
  voivodeships: VoivodeshipStat[];
  assemblies: PopularAssemblyStat[];
  errors: { kpi?: string; voiv?: string; assembly?: string };
}

// ─── Tiny stat tile ───────────────────────────────────────────────────────────

function Tile({
  label, value, sub, icon: Icon, color, trend,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
  trend?: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide truncate">{label}</p>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">{value}</p>
          {sub && <p className="text-[11px] text-slate-400 mt-0.5 truncate">{sub}</p>}
        </div>
        <div className={`p-2 rounded-lg shrink-0 ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      {trend && (
        <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
          <ArrowUpRight className="w-3 h-3" />
          {trend}
        </div>
      )}
    </div>
  );
}

// ─── Quick nav link ───────────────────────────────────────────────────────────

function QuickLink({ href, label, icon: Icon, desc }: { href: string; label: string; icon: React.ElementType; desc: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors group"
    >
      <Icon className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-blue-700 dark:group-hover:text-blue-300">{label}</p>
        <p className="text-[10px] text-slate-400 truncate">{desc}</p>
      </div>
      <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-blue-400 shrink-0" />
    </Link>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AdminDashboardClient({ kpi, voivodeships, assemblies, errors }: Props) {
  const fmtPln = (v: number) =>
    v.toLocaleString("pl-PL", { style: "currency", currency: "PLN", maximumFractionDigits: 0 });

  const now = new Date();
  const timeStr = now.toLocaleString("pl-PL", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  const [isPending, startTransition] = useTransition();
  const [resetState, setResetState] = useState<"idle" | "confirm" | "done" | "error">("idle");
  const [resetError, setResetError] = useState("");

  function handleResetClick() {
    if (resetState === "confirm") {
      startTransition(async () => {
        const res = await resetStats();
        if (res.success) setResetState("done");
        else { setResetError(res.error ?? "Błąd"); setResetState("error"); }
        setTimeout(() => setResetState("idle"), 3000);
      });
    } else {
      setResetState("confirm");
      setTimeout(() => setResetState(prev => prev === "confirm" ? "idle" : prev), 5000);
    }
  }

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Dashboard</h1>
          <p className="text-xs text-slate-400 mt-0.5">Odświeżono: {timeStr}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={handleResetClick}
            disabled={isPending}
            className={
              resetState === "confirm"
                ? "border-red-400 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 animate-pulse"
                : resetState === "done"
                ? "border-emerald-400 text-emerald-600 dark:text-emerald-400"
                : "border-slate-300 dark:border-slate-700 text-slate-500 hover:text-red-600 hover:border-red-400"
            }
          >
            {isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : resetState === "done" ? (
              <><CheckCircle className="w-3.5 h-3.5 mr-1" />Zresetowano</>           
            ) : resetState === "error" ? (
              <><AlertCircle className="w-3.5 h-3.5 mr-1" />{resetError}</>           
            ) : resetState === "confirm" ? (
              <><Trash2 className="w-3.5 h-3.5 mr-1" />Potwierdź reset</>
            ) : (
              <><Trash2 className="w-3.5 h-3.5 mr-1" />Resetuj statystyki</>
            )}
          </Button>
        </div>
      </div>

      {errors.kpi && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-300">
          ⚠️ Błąd ładowania KPI: {errors.kpi}
        </div>
      )}

      {kpi && (
        <>
          {/* ── Row 1: Users + Revenue compact 6-tile grid ── */}
          <section>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Użytkownicy & Przychody</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <Tile
                label="Wszyscy"
                value={kpi.totalUsers}
                sub={`+${kpi.newUsersLast30d} / 30d`}
                icon={Users}
                color="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
                trend={`+${kpi.newUsersLast30d} nowych`}
              />
              <Tile
                label="PRO"
                value={kpi.proUsers}
                sub={`+${kpi.newProLast30d} / 30d`}
                icon={Crown}
                color="bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400"
              />
              <Tile
                label="Free"
                value={kpi.freeUsers}
                icon={Users}
                color="bg-slate-100 dark:bg-slate-800 text-slate-500"
              />
              <Tile
                label="Konwersja"
                value={`${kpi.conversionRate}%`}
                sub={`${kpi.proUsers} / ${kpi.totalUsers}`}
                icon={TrendingUp}
                color="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"
              />
              <Tile
                label="Przychód"
                value={fmtPln(kpi.totalRevenuePln)}
                icon={DollarSign}
                color="bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400"
              />
              <Tile
                label="Projekty"
                value={kpi.totalProjects}
                icon={FolderKanban}
                color="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400"
              />
            </div>
          </section>

          {/* ── Row 2: Conversion funnel + progress (merged, no duplicate) ── */}
          <section>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Lejek Blur → Upgrade</p>
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/40 shrink-0">
                      <Eye className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400 uppercase tracking-wide">Blur Views</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{kpi.blurViews}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/40 shrink-0">
                      <MousePointerClick className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400 uppercase tracking-wide">Upgrade Clicks</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{kpi.upgradeClicks}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 shrink-0">
                      <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400 uppercase tracking-wide">Blur → Klik</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{kpi.blurConversionRate}%</p>
                    </div>
                  </div>
                </div>
                {/* Two progress bars in one row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                      <span>Free → PRO</span>
                      <span className="font-semibold text-emerald-600">{kpi.conversionRate}%</span>
                    </div>
                    <Progress value={kpi.conversionRate} className="h-1.5" />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                      <span>{kpi.freeUsers} Free</span>
                      <span>{kpi.proUsers} PRO</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                      <span>Blur → Upgrade</span>
                      <span className="font-semibold text-rose-600">{kpi.blurConversionRate}%</span>
                    </div>
                    <Progress value={kpi.blurConversionRate} className="h-1.5" />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                      <span>{kpi.blurViews} wyświetleń</span>
                      <span>{kpi.upgradeClicks} kliknięć</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </>
      )}

      {/* ── Row 3: Geography + Assemblies + Quick Links ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Voivodeships */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
              Województwa
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pb-2">
            {errors.voiv ? (
              <p className="px-4 text-xs text-red-500">{errors.voiv}</p>
            ) : voivodeships.length === 0 ? (
              <p className="px-4 text-xs text-slate-400">Brak danych</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {voivodeships.slice(0, 8).map((v) => (
                  <div key={v.voivodeship} className="flex items-center justify-between px-4 py-1.5">
                    <span className="text-xs text-slate-700 dark:text-slate-300 truncate flex-1 min-w-0">{v.voivodeship}</span>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <span className="text-[10px] text-slate-400">{v.project_count}p</span>
                      {v.blur_views > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 px-1 rounded">
                          <Eye className="w-2.5 h-2.5" />{v.blur_views}
                        </span>
                      )}
                      {v.upgrade_clicks > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-1 rounded">
                          <MousePointerClick className="w-2.5 h-2.5" />{v.upgrade_clicks}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Popular Assemblies */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Package className="w-4 h-4 text-orange-500 shrink-0" />
              Popularne Zestawy
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pb-2">
            {errors.assembly ? (
              <p className="px-4 text-xs text-red-500">{errors.assembly}</p>
            ) : assemblies.length === 0 ? (
              <p className="px-4 text-xs text-slate-400">Brak danych</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {assemblies.slice(0, 8).map((a, i) => (
                  <div key={a.assembly_name} className="flex items-center gap-2 px-4 py-1.5">
                    <span className="text-[10px] font-mono text-slate-400 w-4 text-right shrink-0">{i + 1}</span>
                    <span className="flex-1 text-xs text-slate-700 dark:text-slate-300 truncate">{a.assembly_name}</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 shrink-0">{a.usage_count}×</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Test Panel */}
        <PaymentTestPanel />

        {/* Quick Links */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500 shrink-0" />
              Szybki dostęp
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 space-y-1.5">
            <QuickLink href="/admin/users"          label="Użytkownicy"    icon={Users}      desc="Zarządzanie & PRO override" />
            <QuickLink href="/admin/market"         label="Market / Ceny"  icon={TrendingUp} desc="Globalna baza cen katalogowych" />
            <QuickLink href="/admin/health"         label="Health Monitor" icon={Activity}   desc="Normy KNR & Stan silnika" />
            <QuickLink href="/admin/knowledge-base" label="Baza Wiedzy"    icon={Brain}      desc="Pliki RAG → ES-Engine kontekst" />
            <QuickLink href="/admin/analytics"      label="Analityka"      icon={BarChart3}  desc="Aktywność & odchylenia cen" />
            <QuickLink href="/dashboard/settings/knr-calculator" label="Kalibracja KNR" icon={Wrench} desc="Silnik ES-Engine + sensitivity" />
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

// ─── Payment Test Panel ───────────────────────────────────────────────────────

function PaymentTestPanel() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const handleTestPayment = async () => {
    setIsLoading(true);
    setResult(null);
    try {
      const response = await fetch("/api/billing/gateway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billingCycle: "monthly",
          vatRate: 23,
          isTest: true,
        }),
      });
      const data = await response.json() as { url?: string; error?: string; details?: string };
      if (!response.ok) throw new Error(data.details ?? data.error ?? "Błąd");
      if (data.url) {
        setResult({ ok: true, message: "Sesja utworzona → przekierowanie..." });
        setTimeout(() => { window.open(data.url, "_blank"); }, 800);
      } else {
        throw new Error("Brak URL sesji");
      }
    } catch (err: unknown) {
      setResult({ ok: false, message: err instanceof Error ? err.message : "Nieznany błąd" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-rose-200 dark:border-rose-800/50 bg-rose-50/50 dark:bg-rose-950/10">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm flex items-center gap-2 text-rose-700 dark:text-rose-400">
          <FlaskConical className="w-4 h-4 shrink-0" />
          Dev — Test Płatności
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Tworzy sesję Stripe z planem miesięcznym + VAT 23%. Weryfikuje webhook → inFakt.
          Używaj tylko konta testowego Stripe.
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={handleTestPayment}
          disabled={isLoading}
          className="h-7 text-xs border-rose-300 text-rose-700 hover:bg-rose-100 dark:border-rose-700 dark:text-rose-400 dark:hover:bg-rose-900/30 gap-1.5"
        >
          {isLoading ? (
            <><Loader2 className="w-3 h-3 animate-spin" />Tworzenie sesji...</>
          ) : (
            <><FlaskConical className="w-3 h-3" />Uruchom test 2 PLN</>
          )}
        </Button>
        {result && (
          <div className={`flex items-center gap-1.5 text-[11px] font-medium ${
            result.ok ? "text-emerald-600" : "text-rose-600"
          }`}>
            {result.ok
              ? <CheckCircle className="w-3.5 h-3.5 shrink-0" />
              : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
            {result.message}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
