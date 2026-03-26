"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  ExternalLink,
  Settings,
  MapPin,
  Calendar,
  Users,
  FileBox,
  AlertTriangle,
} from "lucide-react";
import type { ProjectWithRelations } from "@/lib/types/database";

interface ProjectPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectWithRelations;
  isTeamProject: boolean;
  hasCollaborators: boolean;
  onOpenSettings: () => void;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "draft":
      return <Badge variant="secondary">Wersja robocza</Badge>;
    case "final":
      return <Badge variant="success">Ukończony</Badge>;
    case "archived":
      return <Badge variant="outline">Zarchiwizowany</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("pl-PL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function ProjectPreviewDialog({
  open,
  onOpenChange,
  project,
  isTeamProject,
  hasCollaborators,
  onOpenSettings,
}: ProjectPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            {project.name}
          </DialogTitle>
          <DialogDescription>Podgląd projektu</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="flex items-center gap-2 flex-wrap">
            {isTeamProject && (
              <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs">
                <Users className="w-3 h-3 mr-1" />Zespół
              </Badge>
            )}
            {hasCollaborators && !isTeamProject && (
              <Badge className="bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs">
                <Users className="w-3 h-3 mr-1" />Współpraca
              </Badge>
            )}
            {getStatusBadge(project.status)}
            <Badge variant="outline">VAT {project.vat_rate}%</Badge>
          </div>

          <div className="space-y-3 py-2">
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <MapPin className="w-4 h-4 text-blue-500" />
                <span>Region</span>
              </div>
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {project.regions?.name || "Brak regionu"}
                {project.regions && (
                  <span className="text-xs text-muted-foreground ml-1">
                    ({(() => { const p = Math.round((project.regions.price_modifier - 1) * 100); return p === 0 ? "baza" : p > 0 ? `+${p}%` : `${p}%`; })()})
                  </span>
                )}
              </span>
            </div>

            {project.object_types && (
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span>Typ obiektu</span>
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {project.object_types.name}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span>Utworzono</span>
              </div>
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {formatDate(project.created_at)}
              </span>
            </div>

            {project.client_name && (
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span>Klient</span>
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {project.client_name}
                </span>
              </div>
            )}

            {((project.item_count ?? 0) > 0 || (project.unpriced_count ?? 0) > 0) && (
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <FileBox className="w-4 h-4 text-blue-500" />
                  <span>Pozycje</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  {(project.item_count ?? 0) > 0 && (
                    <span className="text-slate-900 dark:text-slate-100">{project.item_count} poz.</span>
                  )}
                  {(project.unpriced_count ?? 0) > 0 && (
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {project.unpriced_count} bez ceny
                    </span>
                  )}
                </div>
              </div>
            )}

            {project.notes && (
              <div className="py-2 px-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <p className="text-xs text-slate-500 mb-1">Notatki:</p>
                <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-3">
                  {project.notes}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2 border-t">
            <Button asChild className="flex-1 bg-blue-600 text-white hover:bg-blue-700">
              <Link href={`/dashboard/projects/${project.id}`}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Otwórz projekt
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                onOpenSettings();
              }}
            >
              <Settings className="w-4 h-4 mr-2" />
              Ustawienia
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
