"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PanelConfigurator } from "@/components/project/panel-configurator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { LayoutGrid, FolderOpen, Plus, Zap, Shield, FileText, BarChart3 } from "lucide-react";
import { panelStateStore } from "@/lib/panel-state-store";

interface ProjectOption {
  id: string;
  name: string;
  status: string;
}

interface PanelConfiguratorPageClientProps {
  projects: ProjectOption[];
  isPro: boolean;
  userId?: string;
  userProfile?: {
    full_name?: string;
    company_name?: string;
    nip?: string;
    address?: string;
    phone?: string;
    email?: string;
    logo_url?: string;
  };
}

export function PanelConfiguratorPageClient({
  projects,
  isPro,
  userId,
  userProfile,
}: PanelConfiguratorPageClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const resolveInitialProject = (): string => {
    // 1. URL param ?projectId=xxx
    const urlId = searchParams.get("projectId");
    if (urlId && projects.some((p) => p.id === urlId)) return urlId;
    // 2. Last active from localStorage
    const lastId = panelStateStore.getLastActiveProject();
    if (lastId && projects.some((p) => p.id === lastId)) return lastId;
    // 3. Fallback: first project
    return projects[0]?.id || "";
  };

  const [selectedProjectId, setSelectedProjectId] = useState<string>(resolveInitialProject);

  // Sync selection: update URL param + localStorage on every change
  useEffect(() => {
    if (!selectedProjectId) return;
    panelStateStore.setLastActiveProject(selectedProjectId);
    const params = new URLSearchParams(searchParams.toString());
    params.set("projectId", selectedProjectId);
    router.replace(`?${params.toString()}`, { scroll: false });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId]);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="w-full max-w-[1600px] mx-auto py-4 px-4 sm:px-8">
      {/* Project selector */}
      <Card className="mb-4">
        <CardContent className="p-3 flex items-center gap-3">
          <FolderOpen className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400 flex-shrink-0">
            Projekt docelowy:
          </span>
          <Select name="panel-target-project" value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger id="panel-target-project" aria-label="Projekt docelowy" className="h-8 text-xs max-w-xs">
              <SelectValue placeholder="Wybierz projekt..." />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                  {p.status === "final" && " 🔒"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-[10px] text-slate-400 ml-auto">
            Rozdzielnica zostanie dodana do wybranego projektu
          </span>
        </CardContent>
      </Card>

      {/* Panel configurator in page mode */}
      {selectedProjectId ? (
        <PanelConfigurator
          key={selectedProjectId}
          projectId={selectedProjectId}
          isPro={isPro}
          projectStatus={selectedProject?.status || "draft"}
          userId={userId}
          userProfile={userProfile}
          asPage
        />
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-900/50 p-10 text-center">
          {/* Icon */}
          <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25 mb-6">
            <LayoutGrid className="w-10 h-10 text-white" />
          </div>

          {/* Title */}
          <Badge variant="outline" className="mb-3 text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800">
            <Zap className="w-3 h-3 mr-1" />
            Konfigurator Rozdzielnic
          </Badge>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Zaprojektuj swoją rozdzielnicę
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8">
            Wizualny konfigurator tablic rozdzielczych: przeciągnij moduły DIN na szyny, sprawdź bilans faz L1/L2/L3 i wyeksportuj schemat jednokreskowy do PDF.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-600 dark:text-slate-300 shadow-sm">
              <Shield className="w-3.5 h-3.5 text-green-500" />
              200+ modułów DIN w 15 kategoriach
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-600 dark:text-slate-300 shadow-sm">
              <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
              Bilans faz L1/L2/L3
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-600 dark:text-slate-300 shadow-sm">
              <FileText className="w-3.5 h-3.5 text-purple-500" />
              Schemat PDF
            </div>
          </div>

          {/* CTA */}
          <Link href="/dashboard/projects">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white gap-2 px-8">
              <Plus className="w-4 h-4" />
              Utwórz pierwszy projekt
            </Button>
          </Link>
          <p className="text-xs text-slate-400 mt-3">
            Po utworzeniu projektu wróć tutaj i wybierz go z listy powyżej
          </p>
        </div>
      )}
    </div>
  );
}
