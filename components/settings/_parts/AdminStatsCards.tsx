import { Card, CardContent } from "@/components/ui/card";
import { Users, TrendingUp, Crown, UserX } from "lucide-react";

interface Stats {
  totalUsers: number;
  proUsers: number;
  freeUsers: number;
  monthlyRevenue: number;
}

interface AdminStatsCardsProps {
  stats: Stats | null;
}

export function AdminStatsCards({ stats }: AdminStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="border-slate-200 dark:border-slate-800 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-slate-900">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Wszyscy Użytkownicy
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                {stats?.totalUsers || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 dark:border-slate-800 bg-gradient-to-br from-yellow-50 to-white dark:from-yellow-950/20 dark:to-slate-900">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Użytkownicy PRO
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                {stats?.proUsers || 0}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
              <Crown className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-white dark:from-slate-950/20 dark:to-slate-900">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Użytkownicy FREE
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                {stats?.freeUsers || 0}
              </p>
            </div>
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <UserX className="w-6 h-6 text-slate-600 dark:text-slate-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 dark:border-slate-800 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-slate-900">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Przychód Miesięczny
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                {stats?.monthlyRevenue || 0} zł
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
