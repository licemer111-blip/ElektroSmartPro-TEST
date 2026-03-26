"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FolderKanban, Clock, CheckCircle, Archive, ChevronRight, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";

interface ProjectListItem {
  id: string;
  name: string;
  status: string;
  created_at: string;
  client_name?: string | null;
  object_types?: {
    name: string;
  } | null;
}

interface ProjectSelectListProps {
  projects: ProjectListItem[];
  skipAutoRedirect?: boolean;
}

/**
 * Project Select List
 * 
 * Shows a list of projects for the user to choose from
 * Automatically redirects to last visited project if found in localStorage
 */
export function ProjectSelectList({ projects, skipAutoRedirect = false }: ProjectSelectListProps) {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(!skipAutoRedirect);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Check for last visited project on mount
  useEffect(() => {
    if (skipAutoRedirect) return;

    const lastProjectId = localStorage.getItem("lastProjectId");
    
    if (lastProjectId) {
      // Check if this project still exists
      const projectExists = projects.find(p => p.id === lastProjectId);
      
      if (projectExists) {
        // Redirect to last visited project
        setSelectedProjectId(lastProjectId);
        router.push(`/dashboard/projects/${lastProjectId}`);
        return;
      }
    }
    
    // No valid last project, show selection UI
    setIsRedirecting(false);
  }, [projects, router, skipAutoRedirect]);

  const handleProjectSelect = (projectId: string) => {
    setIsRedirecting(true);
    setSelectedProjectId(projectId);
    localStorage.setItem("lastProjectId", projectId);
    router.push(`/dashboard/projects/${projectId}`);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "draft":
        return {
          icon: Clock,
          label: "Roboczy",
          color: "text-amber-600 dark:text-amber-400",
          bgColor: "bg-amber-100 dark:bg-amber-900/30",
        };
      case "final":
        return {
          icon: CheckCircle,
          label: "Finalny",
          color: "text-green-600 dark:text-green-400",
          bgColor: "bg-green-100 dark:bg-green-900/30",
        };
      case "archived":
        return {
          icon: Archive,
          label: "Zarchiwizowany",
          color: "text-slate-600 dark:text-slate-400",
          bgColor: "bg-slate-100 dark:bg-slate-800",
        };
      default:
        return {
          icon: FolderKanban,
          label: status,
          color: "text-slate-600 dark:text-slate-400",
          bgColor: "bg-slate-100 dark:bg-slate-800",
        };
    }
  };

  // Show loading state while checking for last project
  if (isRedirecting) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-600" />
          <p className="text-slate-600 dark:text-slate-400">
            Ładowanie projektu...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-3">
      <div className="text-sm text-slate-600 dark:text-slate-400 mb-4">
        Wybierz projekt ({projects.length})
      </div>

      {projects.map((project) => {
        const statusConfig = getStatusConfig(project.status);
        const StatusIcon = statusConfig.icon;
        const isSelected = selectedProjectId === project.id;

        return (
          <Card
            key={project.id}
            className="cursor-pointer transition-all hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 group"
            onClick={() => handleProjectSelect(project.id)}
          >
            <CardContent className="p-4 md:p-6">
              <div className="flex items-start justify-between gap-4">
                {/* Left side - Icon and Info */}
                <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
                  {/* Icon */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                    <FolderKanban className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>

                  {/* Project Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base md:text-lg mb-1 truncate">
                      {project.name}
                    </h3>
                    
                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs md:text-sm text-slate-600 dark:text-slate-400">
                      {/* Status Badge */}
                      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full ${statusConfig.bgColor}`}>
                        <StatusIcon className={`w-3 h-3 ${statusConfig.color}`} />
                        <span className={statusConfig.color}>{statusConfig.label}</span>
                      </div>

                      {/* Object Type */}
                      {project.object_types?.name && (
                        <>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <span>{project.object_types.name}</span>
                        </>
                      )}

                      {/* Client Name */}
                      {project.client_name && (
                        <>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <span className="truncate">{project.client_name}</span>
                        </>
                      )}

                      {/* Time ago */}
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span className="text-slate-500 dark:text-slate-500">
                        {formatDistanceToNow(new Date(project.created_at), {
                          addSuffix: true,
                          locale: pl,
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right side - Action button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-shrink-0 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors"
                  disabled={isSelected}
                >
                  {isSelected ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
