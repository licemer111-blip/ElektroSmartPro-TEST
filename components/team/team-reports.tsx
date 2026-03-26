"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/utils/supabase/client";
import {
  BarChart3, Users, Clock, FileText, TrendingUp,
  Loader2, Trophy, Medal, Award,
} from "lucide-react";

interface TeamMember {
  user_id: string;
  role: string;
  profiles?: {
    full_name: string | null;
    email: string | null;
  };
}

interface TeamReportsProps {
  teamId: string;
  members: TeamMember[];
}

interface MemberStats {
  userId: string;
  name: string;
  initials: string;
  projectCount: number;
  totalMinutes: number;
  completedProjects: number;
}

const PODIUM_COLORS = [
  "from-amber-400 to-yellow-500",   // 1st
  "from-slate-300 to-slate-400",     // 2nd
  "from-orange-400 to-amber-600",    // 3rd
];

const PODIUM_ICONS = [
  <Trophy key="1" className="w-4 h-4" />,
  <Medal key="2" className="w-4 h-4" />,
  <Award key="3" className="w-4 h-4" />,
];

export function TeamReports({ teamId, members }: TeamReportsProps) {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");
  const [stats, setStats] = useState<MemberStats[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const supabase = createClient();

      const periodDays = parseInt(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);

      const memberStats: MemberStats[] = [];

      for (const member of members) {
        const name = member.profiles?.full_name || member.profiles?.email || "Użytkownik";
        const parts = name.split(" ");
        const initials = parts.length >= 2
          ? (parts[0][0] + parts[1][0]).toUpperCase()
          : name.substring(0, 2).toUpperCase();

        // Get project count
        const { count: projectCount } = await supabase
          .from("projects")
          .select("id", { count: "exact", head: true })
          .eq("user_id", member.user_id);

        // Get completed projects
        const { count: completedProjects } = await supabase
          .from("projects")
          .select("id", { count: "exact", head: true })
          .eq("user_id", member.user_id)
          .eq("status", "final");

        // Get time entries
        const { data: timeEntries } = await supabase
          .from("time_entries")
          .select("duration_minutes")
          .eq("user_id", member.user_id)
          .gte("started_at", startDate.toISOString());

        const totalMinutes = (timeEntries || []).reduce(
          (sum, e) => sum + (e.duration_minutes || 0),
          0
        );

        memberStats.push({
          userId: member.user_id,
          name,
          initials,
          projectCount: projectCount || 0,
          totalMinutes,
          completedProjects: completedProjects || 0,
        });
      }

      // Sort by total minutes (most active first)
      memberStats.sort((a, b) => b.totalMinutes - a.totalMinutes);
      setStats(memberStats);
      setLoading(false);
    };

    fetchStats();
  }, [members, period, teamId]);

  const formatDuration = (minutes: number) => {
    if (minutes === 0) return "0 min";
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const totalTeamMinutes = stats.reduce((sum, s) => sum + s.totalMinutes, 0);
  const totalProjects = stats.reduce((sum, s) => sum + s.projectCount, 0);
  const totalCompleted = stats.reduce((sum, s) => sum + s.completedProjects, 0);
  const completionRate = totalProjects > 0 ? Math.round((totalCompleted / totalProjects) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
          <p className="text-xs text-muted-foreground">Ładowanie raportów...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Statystyki aktywności
        </h3>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-36 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Ostatnie 7 dni</SelectItem>
            <SelectItem value="30">Ostatnie 30 dni</SelectItem>
            <SelectItem value="90">Ostatnie 90 dni</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/20 p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Czas pracy</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-300">
            {formatDuration(totalTeamMinutes)}
          </div>
        </div>

        <div className="rounded-xl border bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20 p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">Projekty</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-300">
            {totalProjects}
          </div>
        </div>

        <div className="rounded-xl border bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/20 p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-violet-600" />
            <span className="text-[10px] font-medium text-violet-600 dark:text-violet-400 uppercase tracking-wider">Ukończone</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-violet-700 dark:text-violet-300">
            {totalCompleted}
          </div>
        </div>

        <div className="rounded-xl border bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20 p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-orange-600" />
            <span className="text-[10px] font-medium text-orange-600 dark:text-orange-400 uppercase tracking-wider">Skuteczność</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-orange-700 dark:text-orange-300">
            {completionRate}%
          </div>
        </div>
      </div>

      {/* Member activity leaderboard */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Ranking aktywności
        </h4>
        {stats.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Brak danych o aktywności</p>
          </div>
        ) : (
          <div className="space-y-2">
            {stats.map((member, index) => {
              const maxMinutes = Math.max(...stats.map(s => s.totalMinutes), 1);
              const barWidth = Math.max((member.totalMinutes / maxMinutes) * 100, 2);
              const isTop3 = index < 3;

              return (
                <div
                  key={member.userId}
                  className={`relative rounded-xl border p-3 transition-all ${
                    isTop3 ? "bg-gradient-to-r from-background to-muted/30" : "bg-card"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      isTop3
                        ? `bg-gradient-to-br ${PODIUM_COLORS[index]} text-white shadow-sm`
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {isTop3 ? PODIUM_ICONS[index] : index + 1}
                    </div>

                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {member.initials}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate">{member.name}</p>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-medium text-emerald-600 border-emerald-200 dark:border-emerald-800 flex-shrink-0"
                        >
                          <Clock className="w-2.5 h-2.5 mr-1" />
                          {formatDuration(member.totalMinutes)}
                        </Badge>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isTop3
                                ? `bg-gradient-to-r ${PODIUM_COLORS[index]}`
                                : "bg-slate-400"
                            }`}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground flex-shrink-0 w-24 text-right">
                          {member.projectCount} proj. / {member.completedProjects} ukończ.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
