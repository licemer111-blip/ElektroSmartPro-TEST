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
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import { adminUpdateUser, adminResetAiUsage, adminDeleteUser } from "@/app/admin/actions";
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
  const { toast } = useToast();
  const router = useRouter();

  const handleResetAi = () => {
    startResetTransition(async () => {
      const result = await adminResetAiUsage(user.id);
      if (result.success) {
        toast({ title: "Liczniki AI zresetowane", description: `Wszystkie liczniki AI użytkownika ${user.email} zostały wyzerowane.` });
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
        toast({ title: "Zapisano", description: `Profil użytkownika ${user.email} zaktualizowany.` });
        router.refresh();
        onClose();
      } else {
        toast({ title: "Błąd", description: result.error, variant: "destructive" });
      }
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-blue-500" />
            Manual Override
          </DialogTitle>
          <DialogDescription className="sr-only">Panel administracyjny do ręcznej zmiany parametrów użytkownika.</DialogDescription>
        </DialogHeader>

        <div className="space-y-1 py-1">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{user.email}</p>
          {user.company_name && <p className="text-xs text-slate-500">{user.company_name}</p>}
        </div>

        <div className="space-y-5 py-2">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="admin-user-pro" className="text-sm font-medium">Status PRO</Label>
              <p className="text-xs text-slate-500 mt-0.5">Aktywuje wszystkie funkcje PRO</p>
            </div>
            <Switch id="admin-user-pro" name="admin-user-pro" aria-label="Status PRO" checked={isPro} onCheckedChange={setIsPro} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="admin-user-is-admin" className="text-sm font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-violet-500" />
                Status Admin
              </Label>
              <p className="text-xs text-slate-500 mt-0.5">Dostęp do panelu /admin</p>
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

          <div className="space-y-2">
            <Label className="text-sm font-medium">Limit projektów (max_projects)</Label>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setMaxProjects(Math.max(1, maxProjects - 1))}>−</Button>
              <Input
                id="admin-max-projects"
                name="admin-max-projects"
                aria-label="Limit projektów"
                type="number"
                min={1}
                max={9999}
                value={maxProjects}
                onChange={(e) => setMaxProjects(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-24 text-center"
              />
              <Button variant="outline" size="sm" onClick={() => setMaxProjects(maxProjects + 1)}>+</Button>
              <Button variant="ghost" size="sm" className="text-xs text-slate-400" onClick={() => setMaxProjects(999)}>∞ PRO</Button>
              <Button variant="ghost" size="sm" className="text-xs text-slate-400" onClick={() => setMaxProjects(3)}>3 Free</Button>
            </div>
            <p className="text-xs text-slate-400">3 = Free tier, 999 = PRO (bez limitu)</p>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Liczniki AI (miesięczne)</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetAi}
            disabled={isPendingReset || isPending}
            className="w-full gap-2 border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-950/30"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isPendingReset ? "animate-spin" : ""}`} />
            {isPendingReset ? "Resetowanie..." : "Resetuj liczniki AI"}
          </Button>
          <p className="text-[10px] text-slate-400 mt-1">
            Zeruje ai_usage_count + wszystkie ai_usage_stats dla tego użytkownika
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending || isPendingReset}>Anuluj</Button>
          <Button onClick={handleSave} disabled={isPending || isPendingReset}>
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
  const [filterPro, setFilterPro] = useState<"all" | "pro" | "free">("all");
  const [overrideUser, setOverrideUser] = useState<AdminUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null);
  const router = useRouter();

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
    return r;
  }, [users, search, filterPro]);

  const totalPages = Math.ceil(total / pageSize);

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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Wszyscy", value: total, icon: Users, color: "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400" },
          { label: "PRO", value: users.filter(u => u.is_pro).length, icon: Crown, color: "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400" },
          { label: "Free", value: users.filter(u => !u.is_pro).length, icon: Users, color: "bg-slate-100 dark:bg-slate-800 text-slate-500" },
          { label: "Aktywni (proj>0)", value: users.filter(u => u.projects_count > 0).length, icon: FolderKanban, color: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${color}`}><Icon className="w-4 h-4" /></div>
              <div>
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{value}</div>
                <div className="text-xs text-slate-500">{label}</div>
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
        <div className="flex gap-1.5">
          {(["all", "pro", "free"] as const).map((f) => (
            <Button
              key={f}
              variant={filterPro === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterPro(f)}
              className="capitalize"
            >
              {f === "all" ? "Wszyscy" : f === "pro" ? "PRO" : "Free"}
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
                <TableHead className="w-[240px]">Użytkownik</TableHead>
                <TableHead className="text-center w-[80px]">Status</TableHead>
                <TableHead className="text-center w-[100px]">Projekty</TableHead>
                <TableHead className="text-center w-[110px]">Max proj.</TableHead>
                <TableHead className="w-[130px]">Ostatnie logowanie</TableHead>
                <TableHead className="w-[110px]">Rejestracja</TableHead>
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
                filtered.map((user) => (
                  <TableRow key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <TableCell>
                      <div className="min-w-0">
                        <div className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
                          {user.full_name || user.email.split("@")[0]}
                        </div>
                        <div className="text-xs text-slate-500 truncate">{user.email}</div>
                        {user.company_name && (
                          <div className="text-xs text-slate-400 truncate">{user.company_name}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        {user.is_pro ? (
                          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 gap-1 text-xs">
                            <Crown className="w-3 h-3" /> PRO
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-500 text-xs">Free</Badge>
                        )}
                        {user.is_admin && (
                          <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 gap-1 text-xs">
                            <ShieldCheck className="w-3 h-3" /> Admin
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`font-semibold text-sm ${user.projects_count > 0 ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`}>
                        {user.projects_count}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="text-xs font-mono">
                        {user.max_projects >= 999 ? "∞" : user.max_projects}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="w-3 h-3 shrink-0" />
                        {fmtRelative(user.last_sign_in_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-slate-500">{fmtDate(user.created_at)}</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => setOverrideUser(user)}
                          title="Manual Override"
                        >
                          <Settings2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                          onClick={() => setDeleteUser(user)}
                          title="Usuń użytkownika"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                        {user.stripe_customer_id && (
                          <a
                            href={`https://dashboard.stripe.com/customers/${user.stripe_customer_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Otwórz w Stripe"
                          >
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                            </Button>
                          </a>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
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
