"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Search, Crown, Users, ChevronLeft, ChevronRight,
  Settings2, FolderKanban, Clock, ExternalLink, ShieldCheck, RotateCcw, Trash2,
  Brain, Rocket, Timer, CalendarClock, Ban,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import { adminUpdateUser, adminResetAiUsage, adminDeleteUser, adminGrantTrial, adminResetTrial } from "@/app/admin/actions";
import type { AdminUser } from "@/app/admin/actions";

interface Props {
  users: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
  error?: string;
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return "—"; }
}

function fmtRelative(d: string | null) {
  if (!d) return "—";
  try { return formatDistanceToNow(new Date(d), { addSuffix: true, locale: pl }); }
  catch { return "—"; }
}

interface OverrideDialogProps {
  user: AdminUser;
  onClose: () => void;
}

function OverrideDialog({ user, onClose }: OverrideDialogProps) {
  const [isPro, setIsPro] = useState(user.is_pro);
  const [isAdmin, setIsAdmin] = useState(user.is_admin);
  const [maxProjects, setMaxProjects] = useState(user.max_projects);
  const [isPending, startTransition] = useTransition();
  const [isPendingReset, startResetTransition] = useTransition();
  const [isPendingTrial, startTrialTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const trialActive = user.trial_ends_at && new Date(user.trial_ends_at) > new Date();
  const trialUsed = !!user.trial_started_at;

  const handleResetAi = () => {
    startResetTransition(async () => {
      const result = await adminResetAiUsage(user.id);
      if (result.success) {
        toast({ title: "Liczniki AI zresetowane", description: `AI usage: 0` });
        router.refresh();
      } else {
        toast({ title: "Błąd", description: result.error, variant: "destructive" });
      }
    });
  };

  const handleGrantTrial = () => {
    startTrialTransition(async () => {
      const result = await adminGrantTrial(user.id, 7);
      if (result.success) {
        toast({ title: "Trial nadany", description: `7-dniowy trial aktywowany dla ${user.email}` });
        router.refresh();
      } else {
        toast({ title: "Błąd", description: result.error, variant: "destructive" });
      }
    });
  };

  const handleResetTrial = () => {
    startTrialTransition(async () => {
      const result = await adminResetTrial(user.id);
      if (result.success) {
        toast({ title: "Trial zresetowany", description: `Użytkownik może ponownie aktywować trial` });
        router.refresh();
      } else {
        toast({ title: "Błąd", description: result.error, variant: "destructive" });
      }
    });
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await adminUpdateUser(user.id, {
        is_pro: isPro,
        max_projects: maxProjects,
        role: isAdmin ? "admin" : "user",
      });
      if (result.success) {
        toast({ title: "Zapisano", description: `Profil zaktualizowany.` });
        router.refresh();
        onClose();
      } else {
        toast({ title: "Błąd", description: result.error, variant: "destructive" });
      }
    });
  };

  const anyPending = isPending || isPendingReset || isPendingTrial;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-blue-500" />
            Zarządzanie użytkownikiem
          </DialogTitle>
          <DialogDescription className="sr-only">Panel administracyjny do ręcznej zmiany parametrów użytkownika.</DialogDescription>
        </DialogHeader>

        {/* User Info Card */}
        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{user.email}</p>
              <p className="text-xs text-slate-500">{user.full_name || "—"} · {user.company_name || "Brak firmy"}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              {user.is_pro ? (
                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 text-[10px]">PRO</Badge>
              ) : (
                <Badge variant="outline" className="text-[10px]">Free</Badge>
              )}
              {user.is_admin && <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 text-[10px]">Admin</Badge>}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-[10px]">
            <div className="text-center p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700">
              <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{user.projects_count}</p>
              <p className="text-slate-400">Projekty</p>
            </div>
            <div className="text-center p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700">
              <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{user.ai_usage_count}</p>
              <p className="text-slate-400">AI requests</p>
            </div>
            <div className="text-center p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700">
              <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{user.hourly_rate ? `${user.hourly_rate} zł` : "—"}</p>
              <p className="text-slate-400">Stawka r-g</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-700">
            <span>Rejestracja: {fmtDate(user.created_at)}</span>
            <span>Logowanie: {fmtRelative(user.last_sign_in_at)}</span>
            <span>Onboarding: {user.onboarding_completed ? "✓" : "✗"}</span>
          </div>
        </div>

        {/* Status Controls */}
        <div className="space-y-4 py-2">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="admin-user-pro" className="text-sm font-medium">Status PRO</Label>
              <p className="text-[10px] text-slate-500 mt-0.5">Aktywuje wszystkie funkcje PRO (permanent)</p>
            </div>
            <Switch id="admin-user-pro" name="admin-user-pro" aria-label="Status PRO" checked={isPro} onCheckedChange={(v) => { setIsPro(v); if (v) setMaxProjects(999); else setMaxProjects(1); }} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="admin-user-is-admin" className="text-sm font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-violet-500" />
                Status Admin
              </Label>
              <p className="text-[10px] text-slate-500 mt-0.5">Dostęp do panelu /admin</p>
            </div>
            <Switch
              id="admin-user-is-admin"
              name="admin-user-is-admin"
              aria-label="Status Admin"
              checked={isAdmin}
              onCheckedChange={setIsAdmin}
              className="data-[state=checked]:bg-violet-600"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Limit projektów</Label>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setMaxProjects(Math.max(1, maxProjects - 1))}>−</Button>
              <Input
                id="admin-max-projects"
                name="admin-max-projects"
                aria-label="Limit projektów"
                type="number"
                min={1}
                max={9999}
                value={maxProjects}
                onChange={(e) => setMaxProjects(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 text-center h-8"
              />
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setMaxProjects(maxProjects + 1)}>+</Button>
              <Button variant="ghost" size="sm" className="text-[10px] text-slate-400 h-8" onClick={() => setMaxProjects(999)}>∞ PRO</Button>
              <Button variant="ghost" size="sm" className="text-[10px] text-slate-400 h-8" onClick={() => setMaxProjects(1)}>1 Free</Button>
            </div>
          </div>
        </div>

        {/* Trial Management */}
        <div className="border-t border-slate-200 dark:border-slate-700 pt-3 space-y-2">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
            <Rocket className="w-3.5 h-3.5 text-indigo-500" />
            Trial 7-dniowy
          </p>
          <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 p-2.5">
            {trialActive ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300">Trial AKTYWNY</p>
                  <p className="text-[10px] text-indigo-500">Do: {fmtDate(user.trial_ends_at)} ({fmtRelative(user.trial_ends_at)})</p>
                </div>
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 text-[10px]">
                  <Timer className="w-3 h-3 mr-0.5" /> Aktywny
                </Badge>
              </div>
            ) : trialUsed ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Trial WYKORZYSTANY</p>
                  <p className="text-[10px] text-slate-400">Rozpoczął: {fmtDate(user.trial_started_at)} · Zakończył: {fmtDate(user.trial_ends_at)}</p>
                </div>
                <Badge variant="outline" className="text-[10px] text-slate-400">
                  <Ban className="w-3 h-3 mr-0.5" /> Wygasł
                </Badge>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">Nigdy nie aktywował triala</p>
                <Badge variant="outline" className="text-[10px] text-slate-400">Nieaktywny</Badge>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGrantTrial}
              disabled={anyPending}
              className="flex-1 gap-1.5 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400"
            >
              <Rocket className={`w-3 h-3 ${isPendingTrial ? "animate-pulse" : ""}`} />
              {isPendingTrial ? "..." : "Nadaj trial (7 dni)"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetTrial}
              disabled={anyPending || !trialUsed}
              className="flex-1 gap-1.5 text-xs border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400"
            >
              <RotateCcw className="w-3 h-3" />
              Resetuj trial
            </Button>
          </div>
        </div>

        {/* AI Counters */}
        <div className="border-t border-slate-200 dark:border-slate-700 pt-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-emerald-500" />
              AI Usage: <span className="font-bold text-slate-800 dark:text-slate-200">{user.ai_usage_count}</span> / miesiąc
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetAi}
              disabled={anyPending}
              className="h-7 gap-1 text-[10px] border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400"
            >
              <RotateCcw className={`w-3 h-3 ${isPendingReset ? "animate-spin" : ""}`} />
              {isPendingReset ? "..." : "Reset AI"}
            </Button>
          </div>
        </div>

        {/* Subscription Info */}
        {(user.stripe_customer_id || user.subscription_id) && (
          <div className="border-t border-slate-200 dark:border-slate-700 pt-3 space-y-1.5">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <CalendarClock className="w-3.5 h-3.5 text-green-500" />
              Subskrypcja Stripe
            </p>
            <div className="text-[10px] text-slate-500 space-y-0.5">
              {user.subscription_id && <p>Sub ID: <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{user.subscription_id}</code></p>}
              {user.current_period_end && <p>Okres do: {fmtDate(user.current_period_end)}</p>}
              {user.stripe_customer_id && (
                <a
                  href={`https://dashboard.stripe.com/customers/${user.stripe_customer_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                >
                  <ExternalLink className="w-3 h-3" /> Otwórz w Stripe
                </a>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={onClose} disabled={anyPending}>Anuluj</Button>
          <Button onClick={handleSave} disabled={anyPending}>
            {isPending ? "Zapisywanie..." : "Zapisz zmiany"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteDialogProps {
  user: AdminUser;
  onClose: () => void;
}

function DeleteDialog({ user, onClose }: DeleteDialogProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await adminDeleteUser(user.id);
      if (result.success) {
        toast({ title: "Użytkownik usunięty", description: `Konto ${user.email} zostało trwale usunięte.` });
        router.refresh();
        onClose();
      } else {
        toast({ title: "Błąd usuwania", description: result.error, variant: "destructive" });
      }
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="w-4 h-4" />
            Usuń użytkownika
          </DialogTitle>
          <DialogDescription>
            Ta operacja jest nieodwracalna. Wszystkie dane użytkownika zostaną trwale usunięte.
          </DialogDescription>
        </DialogHeader>
        <div className="py-3 px-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
          <p className="text-sm font-medium text-red-800 dark:text-red-300">{user.email}</p>
          {user.company_name && <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{user.company_name}</p>}
          <p className="text-xs text-red-500 mt-1">{user.projects_count} projektów · konto {user.is_pro ? "PRO" : "Free"}</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>Anuluj</Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
            className="gap-2"
          >
            <Trash2 className={`w-3.5 h-3.5 ${isPending ? "animate-pulse" : ""}`} />
            {isPending ? "Usuwanie..." : "Usuń trwale"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AdminUsersClient({ users, total, page, pageSize, error }: Props) {
  const [search, setSearch] = useState("");
  const [filterPro, setFilterPro] = useState<"all" | "pro" | "free" | "trial" | "inactive">("all");
  const [overrideUser, setOverrideUser] = useState<AdminUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null);
  const router = useRouter();

  const now = new Date();

  const filtered = useMemo(() => {
    let r = users;
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(u =>
        u.email.toLowerCase().includes(q) ||
        u.full_name.toLowerCase().includes(q) ||
        u.company_name.toLowerCase().includes(q)
      );
    }
    if (filterPro === "pro") r = r.filter(u => u.is_pro);
    if (filterPro === "free") r = r.filter(u => !u.is_pro);
    if (filterPro === "trial") r = r.filter(u => u.trial_ends_at && new Date(u.trial_ends_at) > now);
    if (filterPro === "inactive") r = r.filter(u => u.projects_count === 0 && !u.onboarding_completed);
    return r;
  }, [users, search, filterPro]);

  const totalPages = Math.ceil(total / pageSize);

  // Quick stats from current page data
  const trialActiveCount = users.filter(u => u.trial_ends_at && new Date(u.trial_ends_at) > now).length;
  const avgAi = users.length > 0 ? Math.round(users.reduce((s, u) => s + u.ai_usage_count, 0) / users.length) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Użytkownicy</h1>
          <p className="text-sm text-slate-500 mt-1">{total} zarejestrowanych użytkowników</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Wszyscy", value: total, icon: Users, color: "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400" },
          { label: "PRO", value: users.filter(u => u.is_pro).length, icon: Crown, color: "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400" },
          { label: "Free", value: users.filter(u => !u.is_pro).length, icon: Users, color: "bg-slate-100 dark:bg-slate-800 text-slate-500" },
          { label: "Trial aktywny", value: trialActiveCount, icon: Rocket, color: "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400" },
          { label: "Aktywni", value: users.filter(u => u.projects_count > 0).length, icon: FolderKanban, color: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400" },
          { label: "Śr. AI/user", value: avgAi, icon: Brain, color: "bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardContent className="p-3 flex items-center gap-2.5">
              <div className={`p-1.5 rounded-lg ${color}`}><Icon className="w-3.5 h-3.5" /></div>
              <div>
                <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{value}</div>
                <div className="text-[10px] text-slate-500">{label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            id="admin-users-search"
            name="admin-users-search"
            aria-label="Szukaj użytkowników"
            placeholder="Szukaj po email, nazwisku, firmie..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {([
            { key: "all", label: "Wszyscy" },
            { key: "pro", label: "PRO" },
            { key: "free", label: "Free" },
            { key: "trial", label: "Trial" },
            { key: "inactive", label: "Nieaktywni" },
          ] as const).map(({ key, label }) => (
            <Button
              key={key}
              variant={filterPro === key ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterPro(key)}
              className="text-xs"
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card className="border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                <TableHead className="w-[220px]">Użytkownik</TableHead>
                <TableHead className="text-center w-[80px]">Status</TableHead>
                <TableHead className="text-center w-[60px]">Proj.</TableHead>
                <TableHead className="text-center w-[90px]">Trial</TableHead>
                <TableHead className="text-center w-[50px]">AI</TableHead>
                <TableHead className="w-[110px]">Aktywność</TableHead>
                <TableHead className="w-[80px] text-center">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-slate-400">
                    {search ? "Brak wyników wyszukiwania" : "Brak użytkowników"}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((user) => {
                  const userTrialActive = user.trial_ends_at && new Date(user.trial_ends_at) > now;
                  const userTrialUsed = !!user.trial_started_at;
                  return (
                  <TableRow key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <TableCell>
                      <div className="min-w-0">
                        <div className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
                          {user.full_name || user.email.split("@")[0]}
                        </div>
                        <div className="text-xs text-slate-500 truncate">{user.email}</div>
                        {user.company_name && (
                          <div className="text-[10px] text-slate-400 truncate">{user.company_name}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        {user.is_pro ? (
                          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 gap-0.5 text-[10px] px-1.5">
                            <Crown className="w-2.5 h-2.5" /> PRO
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-500 text-[10px] px-1.5">Free</Badge>
                        )}
                        {user.is_admin && (
                          <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 gap-0.5 text-[10px] px-1.5">
                            <ShieldCheck className="w-2.5 h-2.5" /> Admin
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`font-bold text-sm ${user.projects_count > 0 ? "text-blue-600 dark:text-blue-400" : "text-slate-300 dark:text-slate-600"}`}>
                        {user.projects_count}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {userTrialActive ? (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 text-[10px] px-1.5 gap-0.5">
                          <Timer className="w-2.5 h-2.5" /> Aktywny
                        </Badge>
                      ) : userTrialUsed ? (
                        <Badge variant="outline" className="text-[10px] px-1.5 text-slate-400">Wygasł</Badge>
                      ) : (
                        <span className="text-[10px] text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`text-xs font-mono ${user.ai_usage_count > 0 ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-slate-300 dark:text-slate-600"}`}>
                        {user.ai_usage_count}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <Clock className="w-3 h-3 shrink-0" />
                        {fmtRelative(user.last_sign_in_at)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => setOverrideUser(user)}
                          title="Zarządzanie"
                        >
                          <Settings2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                          onClick={() => setDeleteUser(user)}
                          title="Usuń"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>Strona {page + 1} z {totalPages} ({total} użytkowników)</span>
          <div className="flex gap-2">
            <Button
              variant="outline" size="sm"
              disabled={page === 0}
              onClick={() => router.push(`/admin/users?page=${page - 1}`)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline" size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => router.push(`/admin/users?page=${page + 1}`)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Override Dialog */}
      {overrideUser && (
        <OverrideDialog user={overrideUser} onClose={() => setOverrideUser(null)} />
      )}

      {/* Delete Dialog */}
      {deleteUser && (
        <DeleteDialog user={deleteUser} onClose={() => setDeleteUser(null)} />
      )}
    </div>
  );
}
