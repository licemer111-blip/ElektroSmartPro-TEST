"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FolderKanban, Loader2 } from "lucide-react";

interface Project {
  id: string;
  name: string;
  status: string;
}

interface ProjectQuickSwitcherProps {
  currentProjectId: string;
  projects: Project[];
  currentProjectName: string;
}

/**
 * Project Quick Switcher
 * 
 * Allows users to quickly switch between projects without going back to the list
 * Replaces the static project title with an interactive dropdown
 */
export function ProjectQuickSwitcher({
  currentProjectId,
  projects,
  currentProjectName,
}: ProjectQuickSwitcherProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  // Save current project ID to localStorage whenever it changes
  useEffect(() => {
    if (currentProjectId) {
      localStorage.setItem("lastProjectId", currentProjectId);
    }
  }, [currentProjectId]);

  const handleProjectChange = (projectId: string) => {
    if (projectId === currentProjectId) return;

    setIsNavigating(true);
    // Save to localStorage before navigation
    localStorage.setItem("lastProjectId", projectId);
    // Navigate to the new project
    router.push(`/dashboard/projects/${projectId}`);
  };

  return (
    <div className="flex items-center gap-2 md:gap-3">
      <div className="bg-indigo-100 dark:bg-indigo-900/50 rounded-lg p-1.5 md:p-2">
        <FolderKanban className="w-4 h-4 md:w-5 md:h-5 text-indigo-600 dark:text-indigo-400" />
      </div>
      
      <div className="flex-1 min-w-0">
        <Select
          value={currentProjectId}
          onValueChange={isNavigating ? undefined : handleProjectChange}
        >
          <SelectTrigger className={`w-full max-w-md h-auto py-1.5 md:py-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900${isNavigating ? " pointer-events-none opacity-70" : ""}`}>
            <SelectValue>
              <div className="flex items-center gap-2">
                {isNavigating && <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" />}
                <span className="font-semibold text-base md:text-lg text-slate-900 dark:text-slate-100 truncate">
                  {currentProjectName}
                </span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {projects.map((project) => (
              <SelectItem
                key={project.id}
                value={project.id}
                className="cursor-pointer"
              >
                <div className="flex items-center justify-between w-full gap-3">
                  <span className="font-medium">{project.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {project.status === "draft"
                      ? "Roboczy"
                      : project.status === "final"
                      ? "Finalny"
                      : "Zarchiwizowany"}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 hidden md:block">
          Wybierz projekt z listy, aby przełączyć się między kosztorysami
        </p>
      </div>
    </div>
  );
}
