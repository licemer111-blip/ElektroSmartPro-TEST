"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useModalStore } from "@/hooks/use-modal-store";
import { useToast } from "@/hooks/use-toast";
import { addMaterialsToProject } from "@/app/dashboard/ai-lab/actions";
import { getProjects } from "@/app/dashboard/actions";
import { FolderPlus, Loader2, CheckCircle2 } from "lucide-react";
import type { ProjectWithRelations } from "@/lib/types/database";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function AddToProjectModal() {
  const { isOpen, type, data, onClose } = useModalStore();
  const { toast } = useToast();
  const [projects, setProjects] = useState<ProjectWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const isModalOpen = isOpen && type === "addToProject";
  const materials = data?.materials || [];

  // Load projects when modal opens
  useEffect(() => {
    if (isModalOpen) {
      setIsLoading(true);
      getProjects()
        .then((fetchedProjects) => {
          setProjects(fetchedProjects);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error("Failed to load projects:", error);
          toast({
            title: "❌ Błąd ładowania",
            description: "Nie udało się załadować listy projektów",
            variant: "destructive",
          });
          setIsLoading(false);
        });
    }
  }, [isModalOpen, toast]);

  const handleAddToProject = async () => {
    if (!selectedProjectId) {
      toast({
        title: "⚠️ Wybierz projekt",
        description: "Musisz wybrać projekt, do którego chcesz dodać materiały",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await addMaterialsToProject(selectedProjectId, materials);

      if (result.success) {
        toast({
          title: "✅ Materiały dodane!",
          description: `Dodano ${result.addedCount} pozycji do projektu`,
        });
        
        // Call onSuccess callback if provided
        if (data?.onSuccess) {
          data.onSuccess();
        }

        onClose();
      } else {
        toast({
          title: "❌ Błąd",
          description: result.error || "Nie udało się dodać materiałów",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adding materials:", error);
      toast({
        title: "❌ Błąd",
        description: "Wystąpił nieoczekiwany błąd",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FolderPlus className="w-5 h-5 text-blue-600" />
            Dodaj materiały do projektu
          </DialogTitle>
          <DialogDescription className="text-sm">
            Wybierz projekt, do którego chcesz dodać {materials.length} wybranych materiałów z ES Import
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          )}

          {/* Empty State */}
          {!isLoading && projects.length === 0 && (
            <div className="text-center py-8">
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                Nie masz jeszcze żadnych projektów
              </p>
              <Button
                onClick={() => {
                  onClose();
                  // You can open create project modal here if needed
                }}
                variant="outline"
                className="gap-2"
              >
                <FolderPlus className="w-4 h-4" />
                Utwórz pierwszy projekt
              </Button>
            </div>
          )}

          {/* Projects List */}
          {!isLoading && projects.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-3">
                Wybierz projekt:
              </p>
              <div className="grid gap-2 max-h-96 overflow-y-auto">
                {projects.map((project) => (
                  <Card
                    key={project.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedProjectId === project.id
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                        : "hover:border-blue-300"
                    }`}
                    onClick={() => setSelectedProjectId(project.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {selectedProjectId === project.id && (
                              <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            )}
                            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                              {project.name}
                            </h3>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {project.regions && (
                              <Badge variant="outline" className="text-[10px]">
                                📍 {project.regions.name}
                              </Badge>
                            )}
                            {project.object_types && (
                              <Badge variant="outline" className="text-[10px]">
                                🏢 {project.object_types.name}
                              </Badge>
                            )}
                            <Badge 
                              variant={project.status === "final" ? "default" : "secondary"} 
                              className="text-[10px]"
                            >
                              {project.status === "final" ? "✅ Finał" : "📝 Draft"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            Anuluj
          </Button>
          <Button
            onClick={handleAddToProject}
            disabled={!selectedProjectId || isSubmitting}
            className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Dodawanie...
              </>
            ) : (
              <>
                <FolderPlus className="w-4 h-4" />
                Dodaj do projektu
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
