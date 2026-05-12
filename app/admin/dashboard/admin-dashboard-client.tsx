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
  DollarSign, Activity, Brain, BarChart3,
  Wrench, FlaskConical, Loader2, CheckCircle, AlertCircle, Trash2,
  RefreshCw, ArrowUpRight, ChevronRight, Zap, SlidersHorizontal,
  LayoutGrid,
} from "lucide-react";
import { resetStats } from "@/app/admin/actions";
import type { AdminKpiData, VoivodeshipStat, PopularAssemblyStat } from "@/app/admin/actions";

interface Props {
  kpi: AdminKpiData | null;
  voivodeships: VoivodeshipStat[];
  assemblies: PopularAssemblyStat[];
  errors: { kpi?: string; voiv?: string; assembly?: string };
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon: Icon, iconBg, trend,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; iconBg: string; trend?: { label: string; positive?: boolean };
}) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 leading-none">{value}</p>
        {sub && <p className="text-[11px] text-slate-400 mt-1">{sub}</p>}
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-[11px] font-medium ${trend.positive !== false ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}>
          <ArrowUpRight className="w-3 h-3 shrink-0" />
          {trend.label}
        </div>
      )}
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-600 mb-3">
      {children}
    </p>
  );
}

// ─── Quick nav card ───────────────────────────────────────────────────────────

function NavCard({ href, label, icon: Icon, desc, accent }: {
  href: string; label: string; icon: React.ElementType; desc: string; accent: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group"
    >
      <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${accent}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100">{label}</p>
        <p className="text-[10px] text-slate-400 truncate">{desc}</p>
      </div>
      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 shrink-0" />
    </Link>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AdminDashboardClient({ kpi, voivodeships, assemblies, errors }: Props) {
  const fmtPln = (v: number) =>
    v.toLocaleString("pl-PL", { style: "currency", currency: "PLN", maximumFractionDigits: 0 });

  const now = new Date();
  const timeStr = now.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("pl-PL", { day: "2-digit", month: "short", year: "numeric" });

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
    <div className="space-y-8">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-0.5">{dateStr} · {timeStr} · ElektroSmart PRO Admin</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.location.reload()}
            className="h-8 gap-1.5 text-xs border-slate-200 dark:border-slate-700 text-slate-500"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Odśwież
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleResetClick}
            disabled={isPending}
            className={
              resetState === "confirm"
                ? "h-8 text-xs border-red-400 text-red-600 animate-pulse"
                : resetState === "done"
                ? "h-8 text-xs border-emerald-400 text-emerald-600"
                : "h-8 text-xs border-slate-200 dark:border-slate-700 text-slate-500 hover:text-red-600 hover:border-red-300"
            }
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : resetState === "done" ? <><CheckCircle className="w-3.5 h-3.5 mr-1" />Zresetowano</>
              : resetState === "error" ? <><AlertCircle className="w-3.5 h-3.5 mr-1" />{resetError}</>
              : resetState === "confirm" ? <><Trash2 className="w-3.5 h-3.5 mr-1" />Potwierdź</>
              : <><Trash2 className="w-3.5 h-3.5 mr-1" />Reset statystyk</>
            }
          </Button>
        </div>
      </div>

      {errors.kpi && (
        <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Błąd ładowania KPI: {errors.kpi}
        </div>
      )}

      {kpi && (
        <>
          {/* ── KPI Grid ── */}
          <section>
            <SectionLabel>Użytkownicy & Przychody</SectionLabel>
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
              <KpiCard label="Wszyscy" value={kpi.totalUsers}
                sub={`+${kpi.newUsersLast30d} w ost. 30 dni`}
                icon={Users} iconBg="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
                trend={{ label: `+${kpi.newUsersLast30d} nowych` }}
              />
              <KpiCard label="PRO" value={kpi.proUsers}
                sub={`+${kpi.newProLast30d} w ost. 30 dni`}
                icon={Crown} iconBg="bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400"
              />
              <KpiCard label="Free" value={kpi.freeUsers}
                sub="Nieaktywowane"
                icon={Users} iconBg="bg-slate-100 dark:bg-slate-800 text-slate-500"
                trend={{ label: "Do konwersji", positive: false }}
              />
              <KpiCard label="Konwersja" value={`${kpi.conversionRate}%`}
                sub={`${kpi.proUsers} PRO / ${kpi.totalUsers} razem`}
                icon={TrendingUp} iconBg="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"
              />
              <KpiCard label="Przychód" value={fmtPln(kpi.totalRevenuePln)}
                sub="Łącznie payments"
                icon={DollarSign} iconBg="bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400"
              />
              <KpiCard label="Projekty" value={kpi.totalProjects}
                sub="Wszystkie projekty"
                icon={FolderKanban} iconBg="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400"
              />
            </div>
          </section>

          {/* ── Conversion Funnel ── */}
          <section>
            <SectionLabel>Lejek konwersji</SectionLabel>
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <CardContent className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center shrink-0">
                      <Eye className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Blur Views</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{kpi.blurViews}</p>
                      <p className="text-[10px] text-slate-400">wyświetleń cen z blur</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center shrink-0">
                      <MousePointerClick className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Upgrade Clicks</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{kpi.upgradeClicks}</p>
                      <p className="text-[10px] text-slate-400">kliknięć w upgrade</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                      <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Blur → Klik</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{kpi.blurConversionRate}%</p>
                      <p className="text-[10px] text-slate-400">skuteczność lejka</p>
                    </div>
                  </div>
                </div>
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs text-slate-500 font-medium">Free → PRO</span>
                      <span className="text-xs font-bold text-emerald-600">{kpi.conversionRate}%</span>
                    </div>
                    <Progress value={kpi.conversionRate} className="h-2" />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>{kpi.freeUsers} Free</span>
                      <span>{kpi.proUsers} PRO</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs text-slate-500 font-medium">Blur → Upgrade</span>
                      <span className="text-xs font-bold text-rose-600">{kpi.blurConversionRate}%</span>
                    </div>
                    <Progress value={kpi.blurConversionRate} className="h-2" />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>{kpi.blurViews} wyśw.</span>
                      <span>{kpi.upgradeClicks} kliknięć</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </>
      )}

      {/* ── 3-Col Row: Voivodeships | Assemblies | Quick Nav ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Voivodeships */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
              Województwa — Top 8
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pb-3">
            {errors.voiv ? (
              <p className="px-4 pt-2 text-xs text-red-500">{errors.voiv}</p>
            ) : voivodeships.length === 0 ? (
              <p className="px-4 pt-2 text-xs text-slate-400">Brak danych projektów</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {voivodeships.slice(0, 8).map((v) => (
                  <div key={v.voivodeship} className="flex items-center justify-between px-4 py-2">
                    <span className="text-[12px] text-slate-700 dark:text-slate-300 truncate flex-1 min-w-0">{v.voivodeship}</span>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <Badge variant="secondary" className="text-[10px] px-1.5 h-5">{v.project_count}</Badge>
                      {v.blur_views > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 px-1.5 py-0.5 rounded-md">
                          <Eye className="w-2.5 h-2.5" />{v.blur_views}
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
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Package className="w-4 h-4 text-amber-500 shrink-0" />
              Top Zestawy
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pb-3">
            {errors.assembly ? (
              <p className="px-4 pt-2 text-xs text-red-500">{errors.assembly}</p>
            ) : assemblies.length === 0 ? (
              <p className="px-4 pt-2 text-xs text-slate-400">Brak danych</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {assemblies.slice(0, 8).map((a, i) => (
                  <div key={a.assembly_name} className="flex items-center gap-3 px-4 py-2">
                    <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600 w-4 text-right shrink-0">{i + 1}</span>
                    <span className="flex-1 text-[12px] text-slate-700 dark:text-slate-300 truncate">{a.assembly_name}</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 h-5 shrink-0">{a.usage_count}×</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Navigation */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Zap className="w-4 h-4 text-indigo-500 shrink-0" />
              Szybki dostęp
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-3">
            <NavCard href="/admin/users"          label="Użytkownicy"    icon={Users}          desc="Zarządzanie kontami & PRO override" accent="bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400" />
            <NavCard href="/admin/market"         label="Ceny Katalogowe" icon={TrendingUp}      desc="Globalna baza materiałów i robocizny" accent="bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400" />
            <NavCard href="/admin/health"         label="Health Monitor"  icon={Activity}       desc="Stan silnika ES-Engine & normy KNR"   accent="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400" />
            <NavCard href="/admin/canonical-l0"   label="L0 Canonical"   icon={SlidersHorizontal} desc="Overrides bazy KNR L0"             accent="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400" />
            <NavCard href="/admin/analytics"      label="Analityka"       icon={BarChart3}       desc="Aktywność użytkowników & odchylenia" accent="bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400" />
            <NavCard href="/admin/knowledge-base" label="Baza Wiedzy"    icon={Brain}           desc="Pliki RAG dla ES-Engine"             accent="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400" />
          </CardContent>
        </Card>

      </div>

      {/* ── Dev Panel (bottom, compact) ── */}
      <PaymentTestPanel />

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
        body: JSON.stringify({ billingCycle: "monthly", vatRate: 23, isTest: true }),
      });
      const data = await response.json() as { url?: string; error?: string; details?: string };
      if (!response.ok) throw new Error(data.details ?? data.error ?? "Błąd");
      if (data.url) {
        setResult({ ok: true, message: "Sesja Stripe utworzona → otwieranie..." });
        setTimeout(() => { window.open(data.url, "_blank"); }, 600);
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
    <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 px-4 py-3">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center shrink-0">
            <FlaskConical className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <p className="text-[12px] font-semibold text-slate-600 dark:text-slate-400">Dev — Test Płatności Stripe</p>
            <p className="text-[10px] text-slate-400">Plan miesięczny + VAT 23% · tylko konto testowe</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {result && (
            <span className={`flex items-center gap-1 text-[11px] font-medium ${result.ok ? "text-emerald-600" : "text-rose-600"}`}>
              {result.ok ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              {result.message}
            </span>
          )}
          <Button size="sm" variant="outline" onClick={handleTestPayment} disabled={isLoading}
            className="h-7 text-xs border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 gap-1.5"
          >
            {isLoading
              ? <><Loader2 className="w-3 h-3 animate-spin" />Tworzenie...</>
              : <><FlaskConical className="w-3 h-3" />Test 2 PLN</>
            }
          </Button>
        </div>
      </div>
    </div>
  );
}
