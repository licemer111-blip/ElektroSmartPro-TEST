"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Loader2, Crown, ShieldCheck } from "lucide-react";
import type { Profile } from "@/lib/types/database";

interface AdminUsersTableProps {
  users: Profile[];
  refreshing: boolean;
  togglingUserId: string | null;
  togglingAdminUserId: string | null;
  onRefresh: () => void;
  onTogglePro: (userId: string, currentStatus: boolean) => void;
  onToggleAdmin: (userId: string, currentRole: string) => void;
}

export function AdminUsersTable({
  users,
  refreshing,
  togglingUserId,
  togglingAdminUserId,
  onRefresh,
  onTogglePro,
  onToggleAdmin,
}: AdminUsersTableProps) {
  return (
    <Card className="border-slate-200 dark:border-slate-800">
      <CardHeader className="border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Lista Użytkowników</CardTitle>
            <CardDescription className="mt-1">
              Zarządzaj statusem subskrypcji użytkowników
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Odśwież
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Email</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Firma</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Rola</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Data Utworzenia</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500 dark:text-slate-400">
                    Brak użytkowników
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3 px-4 text-sm text-slate-900 dark:text-slate-100">
                      {(user as Profile & { email?: string }).email || user.id}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                      {user.company_name || "—"}
                    </td>
                    <td className="py-3 px-4">
                      {user.role === "admin" ? (
                        <Badge className="bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200 border-red-200 dark:border-red-800">
                          <ShieldCheck className="w-3 h-3 mr-1" />
                          ADMIN
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-600 dark:text-slate-400">
                          USER
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {user.is_pro ? (
                        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800">
                          <Crown className="w-3 h-3 mr-1" />
                          PRO
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-600 dark:text-slate-400">
                          FREE
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString("pl-PL") : "—"}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onToggleAdmin(user.id, user.role || "user")}
                          disabled={togglingAdminUserId === user.id}
                        >
                          {togglingAdminUserId === user.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : user.role === "admin" ? (
                            "Usuń Admin"
                          ) : (
                            "Nadaj Admin"
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onTogglePro(user.id, user.is_pro)}
                          disabled={togglingUserId === user.id}
                        >
                          {togglingUserId === user.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : user.is_pro ? (
                            "Usuń PRO"
                          ) : (
                            "Nadaj PRO"
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {users.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              Brak użytkowników
            </div>
          ) : (
            users.map((user) => (
              <Card key={user.id} className="border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Email</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {(user as Profile & { email?: string }).email || user.id}
                      </p>
                    </div>
                    {user.is_pro ? (
                      <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800 flex-shrink-0">
                        <Crown className="w-3 h-3 mr-1" />
                        PRO
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-slate-600 dark:text-slate-400 flex-shrink-0">
                        FREE
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Firma</p>
                      <p className="text-slate-700 dark:text-slate-300 truncate">{user.company_name || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Data utworzenia</p>
                      <p className="text-slate-700 dark:text-slate-300">
                        {user.created_at
                          ? new Date(user.created_at).toLocaleDateString("pl-PL", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })
                          : "—"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onTogglePro(user.id, user.is_pro)}
                    disabled={togglingUserId === user.id}
                    className="w-full"
                  >
                    {togglingUserId === user.id ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : user.is_pro ? (
                      "Usuń PRO"
                    ) : (
                      "Nadaj PRO"
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
