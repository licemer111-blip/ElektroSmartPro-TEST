"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  CheckCircle2, AlertTriangle, XCircle, RefreshCw,
  Users, CreditCard, Bot, MessageSquare, Activity,
  TrendingUp, Server, Zap, Crown, UserX, ShieldAlert,
  Clock, Mail, BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MonitoringData, ServiceStatus } from "./actions";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s temu`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min temu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h temu`;
  return d.toLocaleDateString("pl-PL");
}

function StatusDot({ status }: { status: ServiceStatus["status"] }) {
  if (status === "ok") return <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />;
  if (status === "warn") return <span className="w-2 h-2 rounded-full bg-amber-400 inline-block animate-pulse" />;
  return <span className="w-2 h-2 rounded-full bg-red-500 inline-block animate-pulse" />;
}

function StatusIcon({ status }: { status: ServiceStatus["status"] }) {
  if (status === "ok") return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
  if (status === "warn") return <AlertTriangle className="w-4 h-4 text-amber-500" />;
  return <XCircle className="w-4 h-4 text-red-500" />;
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ title, value, subtitle, icon: Icon, color, alert }: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: "emerald" | "blue" | "red" | "amber" | "violet" | "slate";
  alert?: boolean;
}) {
  const palette = {
    emerald: { bg: "from-emerald-50 to-emerald-100/40 dark:from-emerald-950/30 dark:to-emerald-900/10 border-emerald-200 dark:border-emerald-800", icon: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400", text: "text-emerald-700 dark:text-emerald-300" },
    blue:    { bg: "from-blue-50 to-blue-100/40 dark:from-blue-950/30 dark:to-blue-900/10 border-blue-200 dark:border-blue-800", icon: "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400", text: "text-blue-700 dark:text-blue-300" },
    red:     { bg: "from-red-50 to-red-100/40 dark:from-red-950/30 dark:to-red-900/10 border-red-200 dark:border-red-800", icon: "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400", text: "text-red-700 dark:text-red-300" },
    amber:   { bg: "from-amber-50 to-amber-100/40 dark:from-amber-950/30 dark:to-amber-900/10 border-amber-200 dark:border-amber-800", icon: "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400", text: "text-amber-700 dark:text-amber-300" },
    violet:  { bg: "from-violet-50 to-violet-100/40 dark:from-violet-950/30 dark:to-violet-900/10 border-violet-200 dark:border-violet-800", icon: "bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400", text: "text-violet-700 dark:text-violet-300" },
    slate:   { bg: "from-slate-50 to-slate-100/40 dark:from-slate-900/30 dark:to-slate-800/10 border-slate-200 dark:border-slate-700", icon: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400", text: "text-slate-700 dark:text-slate-300" },
  }[color];

  return (
    <Card className={cn("bg-gradient-to-br border", palette.bg, alert && "ring-2 ring-red-400")}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className={cn("p-2 rounded-lg", palette.icon)}>
            <Icon className="w-4 h-4" />
          </div>
          {alert && <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5">!</Badge>}
        </div>
        <div className="mt-3">
          <p className={cn("text-2xl font-bold", palette.text)}>{value}</p>
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-0.5">{title}</p>
          {subtitle && <p className="text-[10px] text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function MonitoringClient({ data }: { data: MonitoringData }) {
  const [activeTab, setActiveTab] = useState("overview");

  const conversionRate = data.stats.totalUsers > 0
    ? Math.round((data.stats.proUsers / data.stats.totalUsers) * 100)
    : 0;

  const overallServiceStatus = data.services.some(s => s.status === "error")
    ? "error"
    : data.services.some(s => s.status === "warn")
    ? "warn"
    : "ok";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Monitoring Systemu
          </h1>
          <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Ostatnia aktualizacja: {new Date(data.generatedAt).toLocaleTimeString("pl-PL")}
          </p>
        </div>
        <a
          href="/admin/monitoring"
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Odśwież
        </a>
      </div>

      {/* Service Status Bar */}
      <Card className={cn(
        "border",
        overallServiceStatus === "ok" && "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800",
        overallServiceStatus === "warn" && "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800",
        overallServiceStatus === "error" && "bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800",
      )}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Server className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Status Serwisów</span>
            {overallServiceStatus === "ok" && <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]">Wszystkie OK</Badge>}
            {overallServiceStatus === "warn" && <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">Ostrzeżenia</Badge>}
            {overallServiceStatus === "error" && <Badge variant="destructive" className="text-[10px]">Błędy!</Badge>}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {data.services.map(svc => (
              <div key={svc.name} className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <StatusDot status={svc.status} />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{svc.name}</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight truncate">{svc.detail}</p>
                {svc.latencyMs !== undefined && (
                  <p className="text-[10px] font-mono text-slate-500">{svc.latencyMs}ms</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard title="Użytkownicy" value={data.stats.totalUsers} subtitle={`${conversionRate}% konwersja`} icon={Users} color="blue" />
        <KpiCard title="PRO" value={data.stats.proUsers} subtitle={`${data.stats.activeSubscriptions} aktywnych sub.`} icon={Crown} color="violet" />
        <KpiCard title="Błędy Stripe" value={data.stats.stripeErrors} subtitle="Nieudane eventy" icon={CreditCard} color={data.stats.stripeErrors > 0 ? "red" : "emerald"} alert={data.stats.stripeErrors > 0} />
        <KpiCard title="Feedback" value={data.stats.pendingFeedback} subtitle="Oczekujące" icon={MessageSquare} color={data.stats.pendingFeedback > 0 ? "amber" : "emerald"} alert={data.stats.pendingFeedback > 0} />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="overview" className="text-xs">
            <BarChart3 className="w-3.5 h-3.5 mr-1" />Przegląd
          </TabsTrigger>
          <TabsTrigger value="errors" className="text-xs relative">
            <ShieldAlert className="w-3.5 h-3.5 mr-1" />Błędy
            {data.stats.stripeErrors > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center">{data.stats.stripeErrors}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="users" className="text-xs">
            <Users className="w-3.5 h-3.5 mr-1" />Użytkownicy
          </TabsTrigger>
          <TabsTrigger value="ai" className="text-xs">
            <Bot className="w-3.5 h-3.5 mr-1" />AI
          </TabsTrigger>
          <TabsTrigger value="feedback" className="text-xs relative">
            <MessageSquare className="w-3.5 h-3.5 mr-1" />Feedback
            {data.stats.pendingFeedback > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] flex items-center justify-center">{data.stats.pendingFeedback}</span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── OVERVIEW TAB ── */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Business stats */}
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  Statystyki Biznesowe
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                {[
                  { label: "Wszyscy użytkownicy", value: data.stats.totalUsers, color: "bg-blue-500" },
                  { label: "PRO użytkownicy", value: data.stats.proUsers, color: "bg-violet-500" },
                  { label: "Free użytkownicy", value: data.stats.freeUsers, color: "bg-slate-400" },
                  { label: "Aktywne subskrypcje", value: data.stats.activeSubscriptions, color: "bg-emerald-500" },
                  { label: "Wszystkie projekty", value: data.stats.totalProjects, color: "bg-amber-500" },
                  { label: "Wywołania AI dziś", value: data.stats.aiCallsToday, color: "bg-pink-500" },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn("w-2 h-2 rounded-full", row.color)} />
                      <span className="text-xs text-slate-600 dark:text-slate-400">{row.label}</span>
                    </div>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{row.value}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Konwersja Free → PRO</span>
                    <span className="text-sm font-bold text-violet-600 dark:text-violet-400">{conversionRate}%</span>
                  </div>
                  <div className="mt-1.5 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${conversionRate}%` }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  Ostatnia Aktywność
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {data.activity.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">Brak aktywności</p>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {data.activity.slice(0, 15).map(item => (
                      <div key={item.id} className="flex items-start gap-2 py-1.5 border-b border-slate-50 dark:border-slate-800/60 last:border-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge variant="outline" className="text-[9px] px-1 py-0 font-mono">{item.action_type}</Badge>
                            <span className="text-[10px] text-slate-400">{item.user_email ?? item.user_id.slice(0, 8) + "…"}</span>
                          </div>
                          {item.description && (
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.description}</p>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0">{formatTime(item.created_at)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── ERRORS TAB ── */}
        <TabsContent value="errors" className="mt-4">
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-red-500" />
                Błędy Stripe / Billing
                <Badge variant="outline" className="text-[10px]">{data.billingErrors.length} rekordów</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {data.billingErrors.length === 0 ? (
                <div className="flex flex-col items-center py-10 gap-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  <p className="text-sm text-slate-500">Brak błędów płatności 🎉</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs">Event</TableHead>
                        <TableHead className="text-xs">Użytkownik</TableHead>
                        <TableHead className="text-xs">Błąd</TableHead>
                        <TableHead className="text-xs">Czas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.billingErrors.map(err => (
                        <TableRow key={err.id} className={err.status === "failed" ? "bg-red-50/40 dark:bg-red-950/10" : ""}>
                          <TableCell>
                            <Badge
                              variant={err.status === "failed" ? "destructive" : err.status === "success" ? "default" : "outline"}
                              className="text-[10px] px-1.5"
                            >
                              {err.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs font-mono text-slate-600 dark:text-slate-400 max-w-[160px] truncate">
                            {err.event_type}
                          </TableCell>
                          <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                            {err.user_email ?? <span className="text-slate-400">—</span>}
                          </TableCell>
                          <TableCell className="text-xs text-red-600 dark:text-red-400 max-w-[200px] truncate">
                            {err.error_message ?? <span className="text-slate-400">—</span>}
                          </TableCell>
                          <TableCell className="text-xs text-slate-400 whitespace-nowrap">
                            {formatTime(err.created_at)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── USERS TAB ── */}
        <TabsContent value="users" className="mt-4">
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                Ostatni Użytkownicy
                <Badge variant="outline" className="text-[10px]">{data.recentUsers.length} rekordów</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Plan</TableHead>
                      <TableHead className="text-xs">Email</TableHead>
                      <TableHead className="text-xs">Firma</TableHead>
                      <TableHead className="text-xs">Sub. do</TableHead>
                      <TableHead className="text-xs">Anulowanie</TableHead>
                      <TableHead className="text-xs">Rejestracja</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recentUsers.map(user => (
                      <TableRow key={user.id}>
                        <TableCell>
                          {user.is_pro ? (
                            <Badge className="bg-violet-100 text-violet-700 border-violet-200 text-[10px] px-1.5">
                              <Crown className="w-2.5 h-2.5 mr-0.5" /> PRO
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] px-1.5 text-slate-500">
                              <UserX className="w-2.5 h-2.5 mr-0.5" /> Free
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {user.email ?? <span className="text-slate-400">—</span>}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                          {user.company_name ?? <span className="text-slate-400">—</span>}
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">
                          {user.current_period_end
                            ? new Date(user.current_period_end).toLocaleDateString("pl-PL")
                            : <span className="text-slate-400">—</span>}
                        </TableCell>
                        <TableCell>
                          {user.cancel_at_period_end === true ? (
                            <Badge variant="destructive" className="text-[10px] px-1.5">Anuluje</Badge>
                          ) : user.is_pro ? (
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] px-1.5">Aktywna</Badge>
                          ) : <span className="text-slate-400 text-xs">—</span>}
                        </TableCell>
                        <TableCell className="text-xs text-slate-400 whitespace-nowrap">
                          {formatTime(user.created_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── AI TAB ── */}
        <TabsContent value="ai" className="mt-4">
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Bot className="w-4 h-4 text-pink-500" />
                Użycie AI
                <Badge variant="outline" className="text-[10px]">{data.aiUsage.length} rekordów</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {data.aiUsage.length === 0 ? (
                <div className="flex flex-col items-center py-10 gap-2">
                  <Bot className="w-8 h-8 text-slate-300" />
                  <p className="text-sm text-slate-500">Brak danych o użyciu AI</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Funkcja</TableHead>
                        <TableHead className="text-xs">Użytkownik</TableHead>
                        <TableHead className="text-xs">Wywołania</TableHead>
                        <TableHead className="text-xs">Reset</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.aiUsage.map((row, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] font-mono px-1.5">
                              {row.function_name}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                            {row.user_email ?? row.user_id.slice(0, 12) + "…"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-pink-600 dark:text-pink-400">{row.usage_count}</span>
                              <div className="flex-1 max-w-[80px] h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-pink-500 rounded-full"
                                  style={{ width: `${Math.min(100, (row.usage_count / 200) * 100)}%` }}
                                />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-slate-400">
                            {row.reset_at ? new Date(row.reset_at).toLocaleDateString("pl-PL") : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── FEEDBACK TAB ── */}
        <TabsContent value="feedback" className="mt-4">
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amber-500" />
                Opinie i Zgłoszenia
                <Badge variant="outline" className="text-[10px]">{data.feedback.length} rekordów</Badge>
                {data.stats.pendingFeedback > 0 && (
                  <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">
                    {data.stats.pendingFeedback} nowych
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {data.feedback.length === 0 ? (
                <div className="flex flex-col items-center py-10 gap-2">
                  <MessageSquare className="w-8 h-8 text-slate-300" />
                  <p className="text-sm text-slate-500">Brak opinii</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.feedback.map(item => (
                    <div
                      key={item.id}
                      className={cn(
                        "p-3 rounded-lg border",
                        item.status === "new"
                          ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
                          : "bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] px-1.5",
                            item.type === "bug" && "border-red-300 text-red-600",
                            item.type === "feature" && "border-blue-300 text-blue-600",
                            item.type === "contact" && "border-emerald-300 text-emerald-600",
                          )}
                        >
                          {item.type}
                        </Badge>
                        {item.status === "new" && (
                          <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] px-1.5">
                            <Zap className="w-2.5 h-2.5 mr-0.5" /> Nowe
                          </Badge>
                        )}
                        <span className="text-[10px] text-slate-400 ml-auto">{formatTime(item.created_at)}</span>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{item.message}</p>
                      {(item.contact_email || item.user_email) && (
                        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-400">
                          <Mail className="w-3 h-3" />
                          {item.contact_email ?? item.user_email}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
