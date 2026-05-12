"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileText, Plus, Sparkles } from "lucide-react";
import { useModalStore } from "@/hooks/use-modal-store";
import { Button } from "@/components/ui/button";
import { createDemoProject } from "@/app/dashboard/actions";
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
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [demoError, setDemoError] = useState<string | null>(null);

  const handleCreateProject = () => {
    if (!isPro) {
      onOpen("proModal");
      return;
    }
    onOpen("createProject", {
      regions,
      objectTypes,
      currentProjectCount: 0,
      isPro,
      maxProjects,
    });
  };

  const handleOpenDemo = () => {
    setDemoError(null);
    startTransition(async () => {
      const result = await createDemoProject();
      if (result.projectId) {
        router.push(`/dashboard/projects/${result.projectId}`);
      } else if (result.error) {
        setDemoError(result.error);
      }
    });
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-5">
        <FileText className="w-8 h-8 text-slate-400" />
      </div>
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1.5">
        Zacznij od swojego pierwszego projektu!
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6">
        Utwórz swój pierwszy kosztorys — dodaj pozycje z katalogu, a ES-Engine automatycznie wyliczy robociznę na podstawie norm KNR i Twojej stawki r-g.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Button onClick={handleCreateProject} size="default">
          <Plus className="w-4 h-4 mr-1.5" />
          Nowy projekt
        </Button>

        <div className="text-xs text-slate-400">lub</div>

        <Button
          variant="outline"
          size="default"
          onClick={handleOpenDemo}
          disabled={isPending}
          className="border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
        >
          <Sparkles className="w-4 h-4 mr-1.5" />
          {isPending ? "Otwieram demo..." : "Otwórz projekt demonstracyjny"}
        </Button>
      </div>

      {demoError && (
        <p className="mt-3 text-xs text-red-500">{demoError}</p>
      )}
    </div>
  );
}
