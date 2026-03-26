"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Crown,
  FolderKanban,
  ListChecks,
  Send,
  Sparkles,
  ArrowUpDown,
  UserCheck,
  UserX,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import type { UserActivityData } from "./actions";

interface UserActivityTableProps {
  users: UserActivityData[];
}

type SortKey =
  | "email"
  | "projects_count"
  | "project_items_count"
  | "offers_sent"
  | "ai_requests"
  | "last_sign_in_at"
  | "created_at";

function getEngagementLevel(user: UserActivityData): {
  label: string;
  color: string;
  score: number;
} {
  const score =
    user.projects_count * 3 +
    user.project_items_count * 1 +
    user.offers_sent * 5 +
    user.custom_catalog_items * 2 +
    user.ai_requests * 2;

  if (score === 0)
    return { label: "Nieaktywny", color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400", score };
  if (score <= 5)
    return { label: "Początkujący", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300", score };
  if (score <= 20)
    return { label: "Aktywny", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300", score };
  return { label: "Power User", color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300", score };
}

function formatRelative(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: pl });
  } catch {
    return "—";
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("pl-PL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export function UserActivityTable({ users }: UserActivityTableProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("project_items_count");
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const enrichedUsers = useMemo(
    () => users.map((u) => ({ ...u, engagement: getEngagementLevel(u) })),
    [users]
  );

  const filtered = useMemo(() => {
    let result = enrichedUsers;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.email.toLowerCase().includes(q) ||
          u.full_name.toLowerCase().includes(q) ||
          u.company_name.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      let aVal: number | string = 0;
      let bVal: number | string = 0;

      switch (sortKey) {
        case "email":
          aVal = a.email;
          bVal = b.email;
          break;
        case "projects_count":
          aVal = a.projects_count;
          bVal = b.projects_count;
          break;
        case "project_items_count":
          aVal = a.project_items_count;
          bVal = b.project_items_count;
          break;
        case "offers_sent":
          aVal = a.offers_sent;
          bVal = b.offers_sent;
          break;
        case "ai_requests":
          aVal = a.ai_requests;
          bVal = b.ai_requests;
          break;
        case "last_sign_in_at":
          aVal = a.last_sign_in_at || "";
          bVal = b.last_sign_in_at || "";
          break;
        case "created_at":
          aVal = a.created_at;
          bVal = b.created_at;
          break;
      }

      if (typeof aVal === "string") {
        return sortAsc ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
      }
      return sortAsc ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

    return result;
  }, [enrichedUsers, search, sortKey, sortAsc]);

  // Summary stats
  const totalUsers = users.length;
  const proUsers = users.filter((u) => u.is_pro).length;
  const activeUsers = users.filter((u) => getEngagementLevel(u).score > 0).length;
  const inactiveUsers = totalUsers - activeUsers;

  const SortButton = ({ field, children }: { field: SortKey; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-auto p-0 font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
      onClick={() => handleSort(field)}
    >
      {children}
      <ArrowUpDown className="w-3 h-3 ml-1" />
    </Button>
  );

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-slate-200 dark:border-slate-700">
          <CardContent className="p-3 sm:p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40">
              <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">{totalUsers}</div>
              <div className="text-xs text-slate-500">Wszyscy</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-700">
          <CardContent className="p-3 sm:p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40">
              <Crown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">{proUsers}</div>
              <div className="text-xs text-slate-500">PRO</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-700">
          <CardContent className="p-3 sm:p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/40">
              <Sparkles className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">{activeUsers}</div>
              <div className="text-xs text-slate-500">Aktywni</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-700">
          <CardContent className="p-3 sm:p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
              <UserX className="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">{inactiveUsers}</div>
              <div className="text-xs text-slate-500">Nieaktywni</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          id="admin-user-activity-search"
          name="admin-user-activity-search"
          aria-label="Szukaj po email, nazwisku lub firmie"
          placeholder="Szukaj po email, nazwisku lub firmie..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[220px]">
                  <SortButton field="email">Użytkownik</SortButton>
                </TableHead>
                <TableHead className="text-center w-[90px]">Status</TableHead>
                <TableHead className="text-center w-[100px]">Zaangażowanie</TableHead>
                <TableHead className="text-center">
                  <SortButton field="projects_count">
                    <FolderKanban className="w-3.5 h-3.5 mr-1 inline" />
                    Projekty
                  </SortButton>
                </TableHead>
                <TableHead className="text-center">
                  <SortButton field="project_items_count">
                    <ListChecks className="w-3.5 h-3.5 mr-1 inline" />
                    Pozycje
                  </SortButton>
                </TableHead>
                <TableHead className="text-center">
                  <SortButton field="offers_sent">
                    <Send className="w-3.5 h-3.5 mr-1 inline" />
                    Oferty
                  </SortButton>
                </TableHead>
                <TableHead className="text-center">
                  <SortButton field="ai_requests">
                    <Sparkles className="w-3.5 h-3.5 mr-1 inline" />
                    AI
                  </SortButton>
                </TableHead>
                <TableHead className="w-[130px]">
                  <SortButton field="last_sign_in_at">
                    <Clock className="w-3.5 h-3.5 mr-1 inline" />
                    Ostatnio
                  </SortButton>
                </TableHead>
                <TableHead className="w-[100px]">
                  <SortButton field="created_at">Rejestracja</SortButton>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    {search ? "Brak wyników wyszukiwania" : "Brak użytkowników"}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((user) => (
                  <TableRow key={user.user_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                    {/* User info */}
                    <TableCell>
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate text-slate-900 dark:text-slate-100">
                          {user.full_name || user.email.split("@")[0]}
                        </div>
                        <div className="text-xs text-slate-500 truncate">{user.email}</div>
                        {user.company_name && (
                          <div className="text-xs text-slate-400 truncate">{user.company_name}</div>
                        )}
                      </div>
                    </TableCell>

                    {/* PRO badge */}
                    <TableCell className="text-center">
                      {user.is_pro ? (
                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 gap-1">
                          <Crown className="w-3 h-3" />
                          PRO
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-500">Free</Badge>
                      )}
                    </TableCell>

                    {/* Engagement */}
                    <TableCell className="text-center">
                      <Badge className={`${user.engagement.color} text-xs`}>
                        {user.engagement.label}
                      </Badge>
                    </TableCell>

                    {/* Projects */}
                    <TableCell className="text-center">
                      <span className={`font-semibold text-sm ${user.projects_count > 0 ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`}>
                        {user.projects_count}
                      </span>
                    </TableCell>

                    {/* Items */}
                    <TableCell className="text-center">
                      <span className={`font-semibold text-sm ${user.project_items_count > 0 ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}`}>
                        {user.project_items_count}
                      </span>
                    </TableCell>

                    {/* Offers */}
                    <TableCell className="text-center">
                      <div>
                        <span className={`font-semibold text-sm ${user.offers_sent > 0 ? "text-green-600 dark:text-green-400" : "text-slate-400"}`}>
                          {user.offers_sent}
                        </span>
                        {user.offers_accepted > 0 && (
                          <span className="text-xs text-green-500 ml-1">
                            ({user.offers_accepted} ✓)
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* AI */}
                    <TableCell className="text-center">
                      <span className={`font-semibold text-sm ${user.ai_requests > 0 ? "text-purple-600 dark:text-purple-400" : "text-slate-400"}`}>
                        {user.ai_requests}
                      </span>
                    </TableCell>

                    {/* Last sign-in */}
                    <TableCell>
                      <div className="text-xs text-slate-600 dark:text-slate-300">
                        {formatRelative(user.last_sign_in_at)}
                      </div>
                    </TableCell>

                    {/* Created at */}
                    <TableCell>
                      <div className="text-xs text-slate-500">
                        {formatDate(user.created_at)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
