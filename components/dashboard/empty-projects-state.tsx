"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { FileText, Plus } from "lucide-react";
import { useModalStore } from "@/hooks/use-modal-store";
import type { Region, ObjectType } from "@/lib/types/database";

interface EmptyProjectsStateProps {
  regions: Region[];
  objectTypes: ObjectType[];
  isPro: boolean;
  maxProjects: number;
}

export function EmptyProjectsState({
  regions,
  objectTypes,
  isPro,
  maxProjects,
}: EmptyProjectsStateProps) {
  const { onOpen } = useModalStore();

  const handleCreateProject = () => {
    onOpen("createProject", {
      regions,
      objectTypes,
      currentProjectCount: 0,
      isPro,
      maxProjects,
    });
  };

  return (
    <EmptyState
      icon={FileText}
      title="Zacznij od swojego pierwszego projektu!"
      description="Utwórz swój pierwszy kosztorys — dodaj pozycje z katalogu, a ES-Engine automatycznie wyliczy robociznę na podstawie norm KNR i Twojej stawki r-g."
      action={{
        label: "Nowy Projekt",
        onClick: handleCreateProject,
        icon: Plus,
      }}
      variant="circuit"
    />
  );
}
