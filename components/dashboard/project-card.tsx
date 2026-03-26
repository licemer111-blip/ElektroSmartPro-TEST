"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteProject } from "@/app/dashboard/actions";
import { duplicateProject } from "@/app/dashboard/projects/[id]/actions";
import { archiveProject, restoreProject } from "@/app/dashboard/projects/tags-actions";
import {
  MoreVertical,
  Trash2,
  Edit,
  MapPin,
  Calendar,
  Users,
  Loader2,
  Settings,
  FileText,
  ExternalLink,
  Copy,
  Link2,
  Archive,
  ArchiveRestore,
  FileBox,
  LayoutGrid,
  Send,
  Eye,
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SaveAsTemplateDialog } from "@/components/project/save-as-template-dialog";
import { ProjectEditSettingsDialog } from "@/components/dashboard/ProjectEditSettingsDialog";
import { ProjectPreviewDialog } from "@/components/dashboard/ProjectPreviewDialog";
import type { ProjectWithRelations } from "@/lib/types/database";

interface ProjectCardProps {
  project: ProjectWithRelations;
  currentUserId?: string;
}

export function ProjectCard({ project, currentUserId }: ProjectCardProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { toast } = useToast();
  
  // Check if this is a team project (user is member, not owner)
  const isTeamProject = currentUserId && project.user_id !== currentUserId;
  // Współpraca = invited collaborators only (owner is auto-added to project_members, so exclude them)
  const hasCollaborators = project.project_members?.some((m) => m.role !== "owner") ?? false;
  
  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteProject(project.id);

    if (result?.error) {
      toast({
        title: "Błąd",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Projekt usunięty",
        description: "Projekt został pomyślnie usunięty",
      });
    }

    setIsDeleting(false);
    setShowDeleteDialog(false);
  };

  const handleDuplicate = async () => {
    setIsDuplicating(true);
    try {
      const result = await duplicateProject(project.id, `${project.name} (kopia)`);
      if (result?.error) {
        toast({
          title: "Błąd",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Projekt zduplikowany",
          description: "Kopia projektu została utworzona",
        });
        router.refresh();
      }
    } catch (error) {
      console.error("Error duplicating project:", error);
      toast({
        title: "Błąd",
        description: "Nie udało się zduplikować projektu",
        variant: "destructive",
      });
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/dashboard/projects/${project.id}`;
    navigator.clipboard.writeText(url).then(() => {
      toast({ title: "Link skopiowany", description: url });
    }).catch(() => {
      toast({ title: "Błąd", description: "Nie udało się skopiować linku", variant: "destructive" });
    });
  };

  const handleArchiveToggle = async () => {
    setIsArchiving(true);
    try {
      const isArchived = project.status === "archived";
      const result = isArchived
        ? await restoreProject(project.id)
        : await archiveProject(project.id);

      if (result?.error) {
        toast({
          title: "Błąd",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: isArchived ? "Projekt przywrócony" : "Projekt zarchiwizowany",
          description: isArchived
            ? "Projekt został przywrócony z archiwum"
            : "Projekt został przeniesiony do archiwum",
        });
        router.refresh();
      }
    } catch (error) {
      console.error("Error toggling archive:", error);
      toast({
        title: "Błąd",
        description: "Nie udało się zmienić statusu projektu",
        variant: "destructive",
      });
    } finally {
      setIsArchiving(false);
    }
  };

  const getOfferBadge = () => {
    switch (project.offer_link_status) {
      case "pending":
        return (
          <Badge className="bg-blue-100 text-blue-700 border border-blue-200 text-[10px] px-1.5 py-0">
            <Send className="w-2.5 h-2.5 mr-0.5" />
            Oferta wysłana
          </Badge>
        );
      case "viewed":
        return (
          <Badge className="bg-amber-100 text-amber-700 border border-amber-200 text-[10px] px-1.5 py-0">
            <Eye className="w-2.5 h-2.5 mr-0.5" />
            Oferta otwarta
          </Badge>
        );
      case "negotiating":
        return (
          <Badge className="bg-orange-100 text-orange-700 border border-orange-200 text-[10px] px-1.5 py-0 animate-pulse">
            <MessageSquare className="w-2.5 h-2.5 mr-0.5" />
            Negocjacja
          </Badge>
        );
      case "accepted":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] px-1.5 py-0">
            <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
            Zaakceptowano
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-700 border border-red-200 text-[10px] px-1.5 py-0">
            <XCircle className="w-2.5 h-2.5 mr-0.5" />
            Odrzucono
          </Badge>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = () => {
    switch (project.status) {
      case "draft":
        return <Badge variant="secondary">Wersja robocza</Badge>;
      case "final":
        return <Badge variant="success">Ukończony</Badge>;
      case "archived":
        return <Badge variant="outline">Zarchiwizowany</Badge>;
      default:
        return <Badge>{project.status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <>
      <Card
        className={`group relative overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer border hover:border-transparent dark:hover:border-transparent hover:-translate-y-1 bg-white dark:bg-slate-900 h-full min-h-[240px] flex flex-col ${
          isTeamProject 
            ? "border-blue-300 dark:border-blue-700" 
            : "border-slate-200 dark:border-slate-800"
        }`}
        onClick={(e) => {
          // Suppress preview if dropdown menu was recently open (portal click bubbles to card)
          if (menuOpen) return;
          const target = e.target as HTMLElement;
          if (target.closest('button') || target.closest('a')) return;
          setShowPreview(true);
        }}
      >
        {/* Team project indicator stripe */}
        {isTeamProject && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
        )}
        
        {/* Animated gradient background */}
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
          isTeamProject 
            ? "bg-gradient-to-br from-blue-500/[0.04] via-indigo-500/[0.04] to-purple-500/[0.04] dark:from-blue-500/[0.08] dark:via-indigo-500/[0.08] dark:to-purple-500/[0.08]"
            : "bg-gradient-to-br from-blue-500/[0.02] via-cyan-500/[0.02] to-indigo-500/[0.02] dark:from-blue-500/[0.04] dark:via-cyan-500/[0.04] dark:to-indigo-500/[0.04]"
        }`}></div>
        
        {/* Glowing border effect */}
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-40 transition-opacity duration-300 rounded-lg blur-sm -z-10 group-hover:blur-md ${
          isTeamProject
            ? "bg-gradient-to-r from-blue-500/40 via-indigo-500/40 to-purple-500/40"
            : "bg-gradient-to-r from-blue-500/40 via-cyan-400/40 to-indigo-500/40"
        }`}></div>
        
        <CardHeader className="relative pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <Link
                href={`/dashboard/projects/${project.id}`}
                className="hover:no-underline block"
              >
                <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors duration-300 truncate">
                  {project.name}
                </h3>
              </Link>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {isTeamProject && (
                  <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[10px] px-1.5 py-0">
                    <Users className="w-2.5 h-2.5 mr-0.5" />
                    Zespół
                  </Badge>
                )}
                {hasCollaborators && !isTeamProject && (
                  <Badge className="bg-gradient-to-r from-violet-500 to-purple-600 text-white text-[10px] px-1.5 py-0">
                    <Users className="w-2.5 h-2.5 mr-0.5" />
                    Współpraca
                  </Badge>
                )}
                {getStatusBadge()}
                {getOfferBadge()}
                <Badge variant="outline" className="text-xs">
                  VAT {project.vat_rate}%
                </Badge>
              </div>
            </div>

            <DropdownMenu onOpenChange={(open) => {
                setMenuOpen(open);
                // Keep suppression for a short tick after close so the card onClick doesn't fire
                if (!open) setTimeout(() => setMenuOpen(false), 200);
              }}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Otwórz menu projektu"
                  className="h-8 w-8 flex-shrink-0 opacity-60 hover:opacity-100 group-hover:opacity-100 focus:opacity-100 data-[state=open]:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                  Akcje projektu
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* Navigation */}
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                    className="cursor-pointer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Otwórz projekt
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowEditDialog(true)}
                    className="cursor-pointer"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Ustawienia
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                {/* Organize */}
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={handleDuplicate}
                    disabled={isDuplicating}
                    className="cursor-pointer"
                  >
                    {isDuplicating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Copy className="mr-2 h-4 w-4" />
                    )}
                    {isDuplicating ? "Duplikowanie..." : "Duplikuj projekt"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleCopyLink}
                    className="cursor-pointer"
                  >
                    <Link2 className="mr-2 h-4 w-4" />
                    Kopiuj link
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowTemplateDialog(true)}
                    className="cursor-pointer"
                  >
                    <FileBox className="mr-2 h-4 w-4" />
                    Zapisz jako szablon
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                {/* Archive / Delete */}
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={handleArchiveToggle}
                    disabled={isArchiving}
                    className="cursor-pointer"
                  >
                    {isArchiving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : project.status === "archived" ? (
                      <ArchiveRestore className="mr-2 h-4 w-4" />
                    ) : (
                      <Archive className="mr-2 h-4 w-4" />
                    )}
                    {isArchiving
                      ? "Przetwarzanie..."
                      : project.status === "archived"
                        ? "Przywróć z archiwum"
                        : "Archiwizuj"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50 cursor-pointer"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Usuń projekt
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="relative text-sm flex-1 flex flex-col">
          <div className="space-y-2">
            <div className="flex items-center text-slate-600">
              <MapPin className="mr-2 h-4 w-4 text-slate-400" />
              <span>
                {project.regions?.name || "Brak regionu"}
                {project.regions && (
                  <span className="text-xs text-muted-foreground ml-1">
                    ({(() => { const p = Math.round((project.regions.price_modifier - 1) * 100); return p === 0 ? "baza" : p > 0 ? `+${p}%` : `${p}%`; })()})
                  </span>
                )}
              </span>
            </div>

            {project.object_types && (
              <div className="flex items-center text-slate-600">
                <FileText className="mr-2 h-4 w-4 text-slate-400" />
                <span>{project.object_types.name}</span>
              </div>
            )}

            <div className="flex items-center gap-3 text-xs pt-2">
              {(project.item_count !== undefined && project.item_count > 0) && (
                <span className="flex items-center gap-1 text-slate-500">
                  <FileBox className="h-3 w-3" />
                  {project.item_count} poz.
                </span>
              )}
              {(project.section_count !== undefined && project.section_count > 0) && (
                <span className="flex items-center gap-1 text-purple-500">
                  <LayoutGrid className="h-3 w-3" />
                  {project.section_count} sek.
                </span>
              )}
              {(project.unpriced_count !== undefined && project.unpriced_count > 0) && (
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium" title={`${project.unpriced_count} pozycji bez wyceny`}>
                  <AlertTriangle className="h-3 w-3" />
                  {project.unpriced_count} bez ceny
                </span>
              )}
              <span className="flex items-center gap-1 text-slate-500 ml-auto">
                <Calendar className="h-3 w-3" />
                {formatDate(project.created_at)}
              </span>
            </div>
          </div>

          <div className="pt-3 mt-auto">
            <Button 
              asChild 
              size="sm"
              className="w-full bg-blue-600 text-white hover:bg-blue-700 shadow-sm border-transparent"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <Link href={`/dashboard/projects/${project.id}`}>
                Otwórz projekt
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Czy na pewno chcesz usunąć?</AlertDialogTitle>
            <AlertDialogDescription>
              Projekt <strong>{project.name}</strong> zostanie trwale usunięty.
              Ta operacja jest nieodwracalna.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Anuluj
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-blue-600 text-white hover:bg-blue-700 shadow-sm border-transparent"
            >
              {isDeleting ? "Usuwanie..." : "Usuń projekt"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ProjectEditSettingsDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        project={project}
      />

      {/* Save as Template Dialog */}
      <SaveAsTemplateDialog
        projectId={project.id}
        projectName={project.name}
        open={showTemplateDialog}
        onOpenChange={setShowTemplateDialog}
      />

      <ProjectPreviewDialog
        open={showPreview}
        onOpenChange={setShowPreview}
        project={project}
        isTeamProject={!!isTeamProject}
        hasCollaborators={hasCollaborators}
        onOpenSettings={() => setShowEditDialog(true)}
      />
    </>
  );
}
