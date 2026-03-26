"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { notifyDataChanged } from "@/hooks/use-synced-action";
import {
  toggleProjectStatus,
  updateProjectRegion,
} from "@/app/dashboard/projects/[id]/actions";
import { duplicateProject } from "@/app/dashboard/actions";
import { archiveProject, restoreProject } from "@/app/dashboard/projects/tags-actions";

interface UseProjectHeaderActionsParams {
  projectId: string;
  projectStatus: string;
}

export function useProjectHeaderActions({
  projectId,
  projectStatus,
}: UseProjectHeaderActionsParams) {
  const { toast } = useToast();
  const router = useRouter();

  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingRegion, setIsUpdatingRegion] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  const handleToggleStatus = async () => {
    setIsSaving(true);
    try {
      const result = await toggleProjectStatus(projectId);
      if (result.error) {
        toast({ title: "Błąd", description: result.error, variant: "destructive" });
      } else {
        const isDraft = result.newStatus === "draft";
        toast({
          title: "Sukces!",
          description: isDraft
            ? "Projekt odblokowany - możesz go edytować"
            : "Projekt zablokowany - gotowy do eksportu",
        });
        if (!isDraft) {
          window.dispatchEvent(new CustomEvent("project-finalized", { detail: { projectId } }));
        }
        notifyDataChanged("status-changed");
        router.refresh();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegionChange = async (newRegionId: string) => {
    setIsUpdatingRegion(true);
    try {
      const result = await updateProjectRegion(projectId, newRegionId);
      if (result.error) {
        toast({ title: "Błąd", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Sukces!", description: "Województwo zostało zmienione. Ceny zostały przeliczone." });
        notifyDataChanged("region-changed");
        router.refresh();
      }
    } catch {
      toast({ title: "Błąd", description: "Nie udało się zmienić województwa", variant: "destructive" });
    } finally {
      setIsUpdatingRegion(false);
    }
  };

  const handleDuplicateProject = async () => {
    setIsDuplicating(true);
    try {
      const result = await duplicateProject(projectId);
      if (result.error) {
        toast({ title: "Błąd", description: result.error, variant: "destructive" });
      } else if (result.success && result.projectId) {
        toast({ title: "Sukces!", description: result.message || "Projekt został skopiowany" });
        router.push(`/dashboard/projects/${result.projectId}`);
      }
    } catch {
      toast({ title: "Błąd", description: "Wystąpił błąd podczas kopiowania projektu", variant: "destructive" });
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleArchiveToggle = async () => {
    setIsArchiving(true);
    try {
      const isArchived = projectStatus === "archived";
      const result = isArchived
        ? await restoreProject(projectId)
        : await archiveProject(projectId);
      if (result.error) {
        toast({ title: "Błąd", description: result.error, variant: "destructive" });
      } else {
        toast({
          title: "Sukces!",
          description: isArchived
            ? "Projekt został przywrócony z archiwum"
            : "Projekt został zarchiwizowany",
        });
        notifyDataChanged("archive-changed");
        router.refresh();
      }
    } catch {
      toast({ title: "Błąd", description: "Wystąpił błąd", variant: "destructive" });
    } finally {
      setIsArchiving(false);
    }
  };

  return {
    isSaving,
    isUpdatingRegion,
    isDuplicating,
    isArchiving,
    handleToggleStatus,
    handleRegionChange,
    handleDuplicateProject,
    handleArchiveToggle,
  };
}
