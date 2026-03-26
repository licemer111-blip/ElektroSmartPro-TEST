"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { ProjectHistory } from "./project-history";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  History,
  FileText,
  ChevronUp,
  ChevronDown,
  Clock,
  Camera,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import "./project-tools.css";

const ProjectNotes = dynamic(
  () => import("./project-notes").then((m) => ({ default: m.ProjectNotes })),
  { ssr: false }
);

const ProjectPhotoGallery = dynamic(
  () => import("./project-photo-gallery").then((m) => ({ default: m.ProjectPhotoGallery })),
  { ssr: false }
);

interface ProjectToolsProps {
  projectId: string;
  projectNotes?: string;
  lastHistoryUpdate?: string;
  projectStatus?: string;
}

export function ProjectTools({ 
  projectId, 
  projectNotes, 
  lastHistoryUpdate,
  projectStatus = "draft"
}: ProjectToolsProps) {
  const isFinal = projectStatus === "final";
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'history' | 'notes' | 'photos'>('history');

  // Горячие клавиши
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Только если не в инпуте
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Ctrl/Cmd + H - История
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        setActiveTab('history');
        setIsExpanded(true);
      }
      // Ctrl/Cmd + N - Заметки
      else if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        setActiveTab('notes');
        setIsExpanded(true);
      }
      // Escape - Закрыть
      else if (e.key === 'Escape') {
        setIsExpanded(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getRelativeTime = (dateString?: string) => {
    if (!dateString) return null;
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: pl
      });
    } catch {
      return null;
    }
  };

  return (
    <TooltipProvider>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
      {/* Compact Header with inline tabs */}
      <div className="flex items-center justify-between gap-3 p-3">
        <div className="flex items-center gap-4">
          {/* History */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => { setActiveTab('history'); setIsExpanded(!isExpanded || activeTab !== 'history'); }}
                className={`flex items-center gap-1.5 text-sm transition-colors rounded-lg px-2 py-1 ${
                  activeTab === 'history' && isExpanded 
                    ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">Historia</span>
                {lastHistoryUpdate && (
                  <span className="hidden md:inline text-xs text-slate-500 dark:text-slate-500">
                    {getRelativeTime(lastHistoryUpdate)}
                  </span>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent><p>Historia zmian projektu</p></TooltipContent>
          </Tooltip>

          {/* Notes */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => {
                  if (isFinal) { toast({ title: "🔒 Projekt zablokowany", description: "Odblokuj projekt, aby edytować notatki", variant: "destructive" }); return; }
                  setActiveTab('notes'); setIsExpanded(!isExpanded || activeTab !== 'notes');
                }}
                className={`flex items-center gap-1.5 text-sm transition-colors rounded-lg px-2 py-1 ${
                  isFinal
                    ? 'opacity-40 cursor-not-allowed text-slate-400 dark:text-slate-500'
                    : activeTab === 'notes' && isExpanded 
                      ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Notatki</span>
                {projectNotes && (
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent><p>Notatki projektu</p></TooltipContent>
          </Tooltip>

          {/* Photos */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => {
                  if (isFinal) { toast({ title: "🔒 Projekt zablokowany", description: "Odblokuj projekt, aby zarządzać zdjęciami", variant: "destructive" }); return; }
                  setActiveTab('photos'); setIsExpanded(!isExpanded || activeTab !== 'photos');
                }}
                className={`flex items-center gap-1.5 text-sm transition-colors rounded-lg px-2 py-1 ${
                  isFinal
                    ? 'opacity-40 cursor-not-allowed text-slate-400 dark:text-slate-500'
                    : activeTab === 'photos' && isExpanded 
                      ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">Zdjęcia</span>
              </button>
            </TooltipTrigger>
            <TooltipContent><p>Dokumentacja zdjęciowa</p></TooltipContent>
          </Tooltip>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-7 w-7 p-0 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-slate-200 dark:border-slate-700 p-4">
          {activeTab === 'history' && (
            <ProjectHistory projectId={projectId} compact={false} projectStatus={projectStatus} />
          )}

          {activeTab === 'notes' && (
            <ProjectNotes projectId={projectId} initialNotes={projectNotes} compact={true} />
          )}

          {activeTab === 'photos' && (
            <ProjectPhotoGallery projectId={projectId} />
          )}
        </div>
      )}
      </div>
    </TooltipProvider>
  );
}
