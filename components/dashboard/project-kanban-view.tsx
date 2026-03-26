"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  FileText, Clock, CheckCircle2, Archive, User, MapPin, Building2, FolderOpen,
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  client_name: string | null;
  status: string;
  created_at: string;
  regions?: { name: string };
  object_types?: { name: string };
}

interface ProjectKanbanViewProps {
  projects: Project[];
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Dziś";
  if (diffDays === 1) return "Wczoraj";
  if (diffDays < 7) return `${diffDays} dni temu`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} tyg. temu`;
  return d.toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
}

const COLUMNS = [
  {
    key: "draft",
    label: "Robocze",
    icon: FileText,
    headerBg: "bg-blue-600",
    cardBorder: "border-l-blue-500",
    emptyIcon: "text-blue-200 dark:text-blue-800",
    countBg: "bg-blue-500/20 text-blue-700 dark:text-blue-300",
    colBg: "bg-blue-50/50 dark:bg-blue-950/10",
    colBorder: "border-blue-200/60 dark:border-blue-800/40",
  },
  {
    key: "final",
    label: "Ukończone",
    icon: CheckCircle2,
    headerBg: "bg-emerald-600",
    cardBorder: "border-l-emerald-500",
    emptyIcon: "text-emerald-200 dark:text-emerald-800",
    countBg: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300",
    colBg: "bg-emerald-50/50 dark:bg-emerald-950/10",
    colBorder: "border-emerald-200/60 dark:border-emerald-800/40",
  },
  {
    key: "archived",
    label: "Archiwum",
    icon: Archive,
    headerBg: "bg-slate-500",
    cardBorder: "border-l-slate-400",
    emptyIcon: "text-slate-200 dark:text-slate-700",
    countBg: "bg-slate-500/20 text-slate-600 dark:text-slate-400",
    colBg: "bg-slate-50/50 dark:bg-slate-800/20",
    colBorder: "border-slate-200/60 dark:border-slate-700/40",
  },
];

export function ProjectKanbanView({ projects }: ProjectKanbanViewProps) {
  const grouped = useMemo(() => {
    const map: Record<string, Project[]> = { draft: [], final: [], archived: [] };
    for (const p of projects) {
      const key = p.status === "archived" ? "archived" : p.status === "final" ? "final" : "draft";
      map[key].push(p);
    }
    return map;
  }, [projects]);

  const total = projects.length || 1;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 h-full">
      {COLUMNS.map((col) => {
        const Icon = col.icon;
        const items = grouped[col.key] || [];
        const pct = Math.round((items.length / total) * 100);

        return (
          <div key={col.key} className={`flex flex-col rounded-xl border ${col.colBorder} ${col.colBg} overflow-hidden shadow-sm`}>
            {/* Column header */}
            <div className={`${col.headerBg} px-3 py-2.5 flex items-center justify-between`}>
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <Icon className="w-4 h-4" />
                {col.label}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/70 font-medium">{pct}%</span>
                <span className="text-xs font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">
                  {items.length}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-slate-200/50 dark:bg-slate-700/30">
              <div className={`h-full ${col.headerBg} transition-all duration-500`} style={{ width: `${pct}%` }} />
            </div>

            {/* Column items */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2 max-h-[55vh]">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <FolderOpen className={`w-10 h-10 mb-2 ${col.emptyIcon}`} />
                  <p className="text-xs font-medium text-slate-400 dark:text-slate-500">Brak projektów</p>
                  <p className="text-[10px] text-slate-400/70 dark:text-slate-500/70 mt-0.5">
                    {col.key === "draft" ? "Utwórz nowy projekt" : col.key === "final" ? "Zapisz projekt jako finalny" : "Archiwizuj ukończone projekty"}
                  </p>
                </div>
              ) : (
                items.map((project) => (
                  <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
                    <div className={`bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 border-l-[3px] ${col.cardBorder} p-3 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group`}>
                      <p className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {project.name}
                      </p>

                      {project.client_name && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1.5">
                          <User className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{project.client_name}</span>
                        </p>
                      )}

                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {project.regions?.name && (
                          <Badge variant="outline" className="text-[9px] h-[18px] px-1.5 gap-0.5 font-normal">
                            <MapPin className="w-2.5 h-2.5" />
                            {project.regions.name}
                          </Badge>
                        )}
                        {project.object_types?.name && (
                          <Badge variant="outline" className="text-[9px] h-[18px] px-1.5 gap-0.5 font-normal">
                            <Building2 className="w-2.5 h-2.5" />
                            {project.object_types.name}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {timeAgo(project.created_at)}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
