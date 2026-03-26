"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChevronLeft, ChevronRight, FileText, CheckCircle2,
  Archive, User, Calendar, X, ExternalLink, Clock,
  FolderOpen, Plus, TrendingUp,
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  client_name: string | null;
  status: string;
  created_at: string;
  updated_at?: string;
  vat_rate?: number;
}

interface ProjectCalendarViewProps {
  projects: Project[];
}

const DAYS_PL = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Ndz"];
const MONTHS_PL = [
  "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
  "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień",
];

const STATUS_CONFIG: Record<string, { dot: string; label: string; bg: string; text: string }> = {
  draft: { dot: "bg-blue-500", label: "Robocze", bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-700 dark:text-blue-300" },
  final: { dot: "bg-emerald-500", label: "Ukończone", bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-300" },
  archived: { dot: "bg-slate-400", label: "Archiwum", bg: "bg-slate-50 dark:bg-slate-800/50", text: "text-slate-600 dark:text-slate-400" },
};

export function ProjectCalendarView({ projects }: ProjectCalendarViewProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => { setCurrentDate(new Date(year, month - 1, 1)); setSelectedDay(null); };
  const nextMonth = () => { setCurrentDate(new Date(year, month + 1, 1)); setSelectedDay(null); };
  const goToday = () => {
    const now = new Date();
    setCurrentDate(now);
    const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    setSelectedDay(key);
  };

  // Group projects by creation date
  const projectsByDay = useMemo(() => {
    const map: Record<string, Project[]> = {};
    for (const p of projects) {
      const d = new Date(p.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (!map[key]) map[key] = [];
      map[key].push(p);
    }
    return map;
  }, [projects]);

  // Monthly stats
  const monthStats = useMemo(() => {
    const monthProjects = projects.filter(p => {
      const d = new Date(p.created_at);
      return d.getFullYear() === year && d.getMonth() === month;
    });
    return {
      total: monthProjects.length,
      draft: monthProjects.filter(p => p.status === "draft").length,
      final: monthProjects.filter(p => p.status === "final").length,
      archived: monthProjects.filter(p => p.status === "archived").length,
    };
  }, [projects, year, month]);

  // Calendar grid
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startDay = (firstDayOfMonth.getDay() + 6) % 7;
  const totalCells = Math.ceil((startDay + daysInMonth) / 7) * 7;

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const cells: { day: number | null; key: string; isToday: boolean }[] = [];
  for (let i = 0; i < totalCells; i++) {
    if (i < startDay || i >= startDay + daysInMonth) {
      cells.push({ day: null, key: `empty-${i}`, isToday: false });
    } else {
      const day = i - startDay + 1;
      const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      cells.push({ day, key, isToday: key === todayKey });
    }
  }

  const selectedDayProjects = selectedDay ? (projectsByDay[selectedDay] || []) : [];
  const selectedDayLabel = selectedDay ? (() => {
    const parts = selectedDay.split("-");
    return `${parseInt(parts[2])} ${MONTHS_PL[parseInt(parts[1]) - 1]} ${parts[0]}`;
  })() : "";

  const handleDayClick = (key: string, day: number | null) => {
    if (!day) return;
    setSelectedDay(prev => prev === key ? null : key);
  };

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl px-3 py-2.5 shadow-sm">
        <div className="flex items-center gap-1.5">
          <Button size="sm" onClick={prevMonth} className="h-7 w-7 p-0 bg-white/20 hover:bg-white/30 text-white border-0">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-sm font-bold min-w-[140px] text-center text-white">
            {MONTHS_PL[month]} {year}
          </h2>
          <Button size="sm" onClick={nextMonth} className="h-7 w-7 p-0 bg-white/20 hover:bg-white/30 text-white border-0">
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button size="sm" onClick={goToday} className="text-[11px] h-7 bg-white/20 hover:bg-white/30 text-white border-0 ml-1">
            Dziś
          </Button>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-medium text-white/80 flex items-center gap-1">
            <Calendar className="w-2.5 h-2.5" />
            {monthStats.total} proj.
          </span>
          {monthStats.draft > 0 && (
            <span className="text-[10px] font-medium bg-white/20 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-300" />
              {monthStats.draft}
            </span>
          )}
          {monthStats.final > 0 && (
            <span className="text-[10px] font-medium bg-white/20 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
              {monthStats.final}
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-3 flex-col lg:flex-row flex-1 min-h-0">
        {/* Calendar grid */}
        <div className="flex-1 min-w-0">
          <div>
            <div>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-700 rounded-t-lg overflow-hidden">
                {DAYS_PL.map((d, i) => (
                  <div key={d} className={`text-center py-1.5 text-[10px] sm:text-xs font-semibold uppercase tracking-wider ${
                    i >= 5 ? "bg-slate-100 dark:bg-slate-800/80 text-slate-400" : "bg-slate-50 dark:bg-slate-800 text-muted-foreground"
                  }`}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Grid */}
              <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-700 rounded-b-lg overflow-hidden">
                {cells.map((cell) => {
                  const dayProjects = cell.day ? (projectsByDay[cell.key] || []) : [];
                  const isSelected = selectedDay === cell.key;
                  const hasProjects = dayProjects.length > 0;

                  return (
                    <button
                      key={cell.key}
                      onClick={() => handleDayClick(cell.key, cell.day)}
                      disabled={!cell.day}
                      className={`bg-white dark:bg-slate-900 p-1 min-h-[44px] sm:min-h-[65px] text-left transition-all relative ${
                        !cell.day ? "bg-slate-50/50 dark:bg-slate-800/30 cursor-default" : "cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-950/20"
                      } ${cell.isToday ? "ring-2 ring-inset ring-blue-500" : ""
                      } ${isSelected ? "ring-2 ring-inset ring-orange-500 bg-orange-50/50 dark:bg-orange-950/20" : ""}`}
                    >
                      {cell.day && (
                        <>
                          <span className={`text-[10px] font-medium ${
                            cell.isToday ? "bg-blue-600 text-white rounded-full w-5 h-5 inline-flex items-center justify-center" :
                            isSelected ? "bg-orange-500 text-white rounded-full w-5 h-5 inline-flex items-center justify-center" :
                            "text-muted-foreground"
                          }`}>
                            {cell.day}
                          </span>
                          {hasProjects && (
                            <div className="mt-0.5 space-y-0.5 hidden sm:block">
                              {dayProjects.slice(0, 2).map((p) => (
                                <div key={p.id} className="flex items-center gap-1 px-1 py-0.5 rounded text-[9px] truncate">
                                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_CONFIG[p.status]?.dot || "bg-slate-400"}`} />
                                  <span className="truncate font-medium">{p.name}</span>
                                </div>
                              ))}
                              {dayProjects.length > 2 && (
                                <span className="text-[9px] text-muted-foreground px-1 font-medium">
                                  +{dayProjects.length - 2} więcej
                                </span>
                              )}
                            </div>
                          )}
                          {/* Project count indicator dot */}
                          {hasProjects && !isSelected && (
                            <div className="absolute top-1 right-1">
                              <div className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-[8px] font-bold text-blue-600 dark:text-blue-400">
                                {dayProjects.length}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-2 px-1 flex-wrap">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-blue-500" /> Robocze
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-emerald-500" /> Ukończone
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-slate-400" /> Archiwum
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground ml-auto">
              <span className="italic">Kliknij dzień, aby zobaczyć projekty</span>
            </div>
          </div>
        </div>

        {/* Side panel — selected day details */}
        <div className={`lg:w-72 xl:w-80 flex-shrink-0 transition-all ${selectedDay ? "block" : "hidden lg:block"}`}>
          {selectedDay ? (
            <Card className="h-full">
              <CardContent className="p-3 space-y-3">
                {/* Day header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold">{selectedDayLabel}</h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedDayProjects.length} {selectedDayProjects.length === 1 ? "projekt" : "projektów"}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedDay(null)} className="h-7 w-7 p-0">
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Projects list */}
                {selectedDayProjects.length > 0 ? (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {selectedDayProjects.map((project) => {
                      const status = STATUS_CONFIG[project.status] || STATUS_CONFIG.draft;
                      return (
                        <div
                          key={project.id}
                          className={`rounded-lg border p-2.5 ${status.bg} hover:shadow-md transition-all cursor-pointer`}
                          onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                        >
                          <div className="flex items-start gap-2">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${status.dot}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold truncate">{project.name}</p>
                              {project.client_name && (
                                <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                  <User className="w-2.5 h-2.5" />
                                  {project.client_name}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={`text-[9px] h-4 px-1.5 border ${status.text} ${status.bg}`}>
                                  {status.label}
                                </Badge>
                                <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                                  <Clock className="w-2.5 h-2.5" />
                                  {new Date(project.created_at).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                            </div>
                            <ExternalLink className="w-3 h-3 text-muted-foreground flex-shrink-0 mt-1" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <FolderOpen className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-xs text-muted-foreground font-medium">Brak projektów w tym dniu</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 text-xs h-7"
                      onClick={() => router.push("/dashboard")}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Utwórz nowy projekt
                    </Button>
                  </div>
                )}

                {/* Quick actions */}
                {selectedDayProjects.length > 0 && (
                  <div className="border-t pt-2 space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Szybkie akcje</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[10px] h-7 justify-start"
                        onClick={() => {
                          if (selectedDayProjects.length > 0) {
                            router.push(`/dashboard/projects/${selectedDayProjects[0].id}`);
                          }
                        }}
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        Otwórz pierwszy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[10px] h-7 justify-start"
                        onClick={() => router.push("/dashboard")}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Nowy projekt
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full hidden lg:block">
              <CardContent className="p-4 flex flex-col items-center justify-center h-full text-center">
                <Calendar className="w-10 h-10 text-muted-foreground/20 mb-3" />
                <p className="text-xs font-medium text-muted-foreground">Wybierz dzień</p>
                <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                  Kliknij na dzień w kalendarzu, aby zobaczyć szczegóły projektów
                </p>

                {/* Month summary */}
                {monthStats.total > 0 && (
                  <div className="mt-4 w-full space-y-1.5">
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
                      Podsumowanie miesiąca
                    </p>
                    <div className="space-y-1">
                      {monthStats.draft > 0 && (
                        <div className="flex items-center justify-between text-[11px] px-2 py-1 rounded bg-blue-50 dark:bg-blue-950/20">
                          <span className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-blue-500" /> Robocze
                          </span>
                          <span className="font-semibold">{monthStats.draft}</span>
                        </div>
                      )}
                      {monthStats.final > 0 && (
                        <div className="flex items-center justify-between text-[11px] px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950/20">
                          <span className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" /> Ukończone
                          </span>
                          <span className="font-semibold">{monthStats.final}</span>
                        </div>
                      )}
                      {monthStats.archived > 0 && (
                        <div className="flex items-center justify-between text-[11px] px-2 py-1 rounded bg-slate-50 dark:bg-slate-800/50">
                          <span className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-slate-400" /> Archiwum
                          </span>
                          <span className="font-semibold">{monthStats.archived}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
