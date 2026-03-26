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
      description="Masz 4 sposoby: (1) ⚡ Szybka Wycena — kosztorys w 60 sekund. (2) � ES Import — wgraj PDF/Excel, ES-Engine wyciągnie materiały z cenami. (3) 📋 Szablony — użyj gotowego wzorca. (4) ✏️ Ręcznie — dodaj pozycje z katalogu. Ceny automatycznie dostosowane do Twojego województwa!"
      action={{
        label: "Nowy Projekt",
        onClick: handleCreateProject,
        icon: Plus,
      }}
      variant="circuit"
    />
  );
}
