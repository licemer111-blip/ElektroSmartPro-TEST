"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useModalStore } from "@/hooks/use-modal-store";
import type { Region, ObjectType } from "@/lib/types/database";

interface NewProjectButtonProps {
  regions: Region[];
  objectTypes: ObjectType[];
  currentProjectCount: number;
  isPro: boolean;
  maxProjects: number;
  defaultRegionId?: string | null;
  hourlyRate?: number;
}

export function NewProjectButton({
  regions,
  objectTypes,
  currentProjectCount,
  isPro,
  maxProjects,
  defaultRegionId,
  hourlyRate,
}: NewProjectButtonProps) {
  const { onOpen } = useModalStore();
  
  // Check if user hit project limit
  const isAtLimit = !isPro && currentProjectCount >= maxProjects;

  const handleClick = () => {
    // ⚠️ DEMO MODE CHECK - Show ProModal if at limit
    if (isAtLimit) {
      onOpen('proModal');
    } else {
      onOpen('createProject', {
        regions,
        objectTypes,
        currentProjectCount,
        isPro,
        maxProjects,
        defaultRegionId,
        hourlyRate,
      });
    }
  };

  return (
    <Button 
      size="lg" 
      onClick={handleClick}
      data-tour="new-project"
      className="bg-blue-600 text-white hover:bg-blue-700 shadow-sm border-transparent w-full md:w-auto"
    >
      <Plus className="mr-2 h-4 md:h-5" />
      <span className="hidden sm:inline">{isAtLimit ? "Nowy projekt (Wymaga PRO)" : "Nowy projekt"}</span>
      <span className="sm:hidden">{isAtLimit ? "Nowy (PRO)" : "Nowy projekt"}</span>
    </Button>
  );
}
