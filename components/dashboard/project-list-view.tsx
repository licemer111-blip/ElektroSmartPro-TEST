"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Eye, Trash2, FolderInput, Users } from "lucide-react";
import { moveProjectToCategory, deleteProject } from "@/app/dashboard/actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProjectCategory {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  client_name: string | null;
  status: string;
  category_id: string | null;
  created_at: string;
  user_id?: string;
  regions?: { name: string };
  object_types?: { name: string };
  project_members?: { role: string; status: string }[];
}

interface ProjectListViewProps {
  projects: Project[];
  categories: ProjectCategory[];
  currentUserId?: string;
}

export function ProjectListView({ projects, categories, currentUserId }: ProjectListViewProps) {
  const [projectToMove, setProjectToMove] = useState<Project | null>(null);
  const [targetCategoryId, setTargetCategoryId] = useState<string>("");
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const handleMoveClick = (project: Project) => {
    setProjectToMove(project);
    setTargetCategoryId(project.category_id || "uncategorized");
    setIsMoveDialogOpen(true);
  };

  const handleMoveProject = async () => {
    if (!projectToMove) return;
    const categoryId = targetCategoryId === "uncategorized" ? null : targetCategoryId;
    const result = await moveProjectToCategory(projectToMove.id, categoryId);

    if (result.error) {
      toast({ title: "Błąd", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Sukces", description: "Projekt został przeniesiony" });
      setIsMoveDialogOpen(false);
      setProjectToMove(null);
      router.refresh();
    }
  };

  const handleDelete = (projectId: string) => {
    setPendingDeleteId(projectId);
  };

  const executeDelete = async () => {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    const result = await deleteProject(id);
    if (result.error) {
      toast({ title: "Błąd", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Sukces", description: "Projekt został usunięty" });
      router.refresh();
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      draft: "bg-gray-100 text-gray-800",
      in_progress: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      archived: "bg-slate-100 text-slate-800",
    };
    const labels: Record<string, string> = {
      draft: "Szkic",
      in_progress: "W trakcie",
      completed: "Zakończony",
      archived: "Archiwalny",
    };
    return (
      <Badge className={variants[status] || ""}>
        {labels[status] || status}
      </Badge>
    );
  };

  return (
    <>
      <div className="border rounded-lg overflow-x-auto bg-white dark:bg-slate-900">
        <Table className="w-full table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50%] sm:w-auto truncate">Nazwa projektu</TableHead>
              <TableHead className="hidden sm:table-cell">Klient</TableHead>
              <TableHead className="w-[30%] sm:w-auto">Status</TableHead>
              <TableHead className="hidden md:table-cell">Typ</TableHead>
              <TableHead className="hidden md:table-cell">Region</TableHead>
              <TableHead className="w-[20%] sm:w-auto text-right">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                  Brak projektów do wyświetlenia
                </TableCell>
              </TableRow>
            ) : (
              projects.map((project) => {
                const category = categories.find(c => c.id === project.category_id);
                const isTeamProject = currentUserId && project.user_id && project.user_id !== currentUserId;
                // Współpraca = invited collaborators only (owner is auto-added, so exclude role 'owner')
                const hasCollaborators = project.project_members?.some((m) => m.role !== "owner") ?? false;
                return (
                  <TableRow key={project.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800 ${isTeamProject ? "bg-blue-50/50 dark:bg-blue-950/20" : ""}`}>
                    <TableCell className="font-medium overflow-hidden">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Link href={`/dashboard/projects/${project.id}`} className="hover:text-blue-600 truncate">
                          {project.name}
                        </Link>
                        {isTeamProject && (
                          <Badge className="hidden sm:inline-flex bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[10px] px-1.5 py-0 h-5 flex-shrink-0">
                            <Users className="w-2.5 h-2.5 mr-0.5" />
                            Zespół
                          </Badge>
                        )}
                        {hasCollaborators && !isTeamProject && (
                          <Badge className="hidden sm:inline-flex bg-gradient-to-r from-violet-500 to-purple-600 text-white text-[10px] px-1.5 py-0 h-5 flex-shrink-0">
                            <Users className="w-2.5 h-2.5 mr-0.5" />
                            Współpraca
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{project.client_name || "-"}</TableCell>
                    <TableCell>{getStatusBadge(project.status)}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{project.object_types?.name || "-"}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{project.regions?.name || "-"}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" aria-label="Otwórz menu projektu">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/projects/${project.id}`}>
                              <Eye className="w-4 h-4 mr-2" />
                              Otwórz
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleMoveClick(project)}>
                            <FolderInput className="w-4 h-4 mr-2" />
                            Przenieś do kategorii
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(project.id)}
                            className="text-red-600 dark:text-red-400"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Usuń
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Move Dialog */}
      {isMoveDialogOpen && projectToMove && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Przenieś do kategorii</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Przenieś <strong>{projectToMove.name}</strong> do innej kategorii
            </p>
            <Select value={targetCategoryId} onValueChange={setTargetCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Wybierz kategorię" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uncategorized">Bez kategorii</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setIsMoveDialogOpen(false);
                  setProjectToMove(null);
                }}
              >
                Anuluj
              </Button>
              <Button onClick={handleMoveProject}>Przenieś</Button>
            </div>
          </div>
        </div>
      )}
      <AlertDialog open={!!pendingDeleteId} onOpenChange={(open) => !open && setPendingDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usuń projekt</AlertDialogTitle>
            <AlertDialogDescription>Czy na pewno chcesz usunąć ten projekt? Tej operacji nie można cofnąć.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-red-600 hover:bg-red-700 text-white">Usuń</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
