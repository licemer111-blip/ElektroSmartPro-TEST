"use client";
import { SYSTEM_STATS_FALLBACK } from "@/constants/system";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NewProjectButton } from "@/components/dashboard/new-project-button";
import { ProjectSelectList } from "@/components/project/project-select-list";
import { TemplatesPageClient } from "@/components/templates/templates-page-client";
import { FolderKanban, FileText, Plus, ArrowRight, Zap, Copy, PenTool, Upload } from "lucide-react";
import { DemoProjectButton } from "@/components/project/demo-project-button";
import type { ProjectTemplate } from "@/app/dashboard/templates/actions";
import type { Region, ObjectType } from "@/lib/types/database";

interface ProjectListItem {
  id: string;
  name: string;
  status: string;
  created_at: string;
  client_name?: string | null;
  object_types?: { name: string } | null;
}

interface ProjectsWithTemplatesClientProps {
  projects: ProjectListItem[];
  templates: ProjectTemplate[];
  regions: Region[];
  objectTypes: ObjectType[];
  isPro: boolean;
  maxProjects: number;
  currentProjectCount: number;
  defaultRegionId?: string | null;
}

export function ProjectsWithTemplatesClient({
  projects,
  templates,
  regions,
  objectTypes,
  isPro,
  maxProjects,
  currentProjectCount,
  defaultRegionId = null,
}: ProjectsWithTemplatesClientProps) {
  const [activeTab, setActiveTab] = useState("projects");

  return (
    <div className="min-h-screen">
      <main className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 shadow-lg shadow-blue-500/20 mb-4">
            <FolderKanban className="w-8 h-8 md:w-10 md:h-10 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Kreator Kosztorysów
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base max-w-2xl mx-auto">
            Projekty i szablony w jednym miejscu
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 h-10 mb-6 bg-slate-100 dark:bg-slate-800/50">
            <TabsTrigger
              value="projects"
              className="gap-2 text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm"
            >
              <FolderKanban className="w-4 h-4" />
              Projekty
              {projects.length > 0 && (
                <span className="text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full font-semibold">
                  {projects.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="templates"
              className="gap-2 text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm"
            >
              <FileText className="w-4 h-4" />
              Szablony
              {templates.length > 0 && (
                <span className="text-[10px] bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded-full font-semibold">
                  {templates.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Projects tab */}
          <TabsContent value="projects" className="mt-0">
            {projects.length === 0 ? (
              <div className="max-w-2xl mx-auto">
                <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-900/50 p-8 text-center mb-4">
                  {/* Icon */}
                  <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 mb-5">
                    <FolderKanban className="w-10 h-10 text-white" />
                  </div>

                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                    Zacznij od swojego pierwszego projektu!
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6 text-sm">
                    Masz {SYSTEM_STATS_FALLBACK.normsLabelPlus} norm KNR i pełen arsenał narzędzi. Wybierz sposób startu:
                  </p>

                  {/* 4 ways */}
                  <div className="grid grid-cols-2 gap-3 mb-7 text-left">
                    <div className="flex items-start gap-3 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/50 rounded-lg p-3">
                      <div className="w-7 h-7 rounded-md bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Zap className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-orange-800 dark:text-orange-300">Szybka Wycena</p>
                        <p className="text-[11px] text-orange-700/70 dark:text-orange-400/70">Wpisz pozycje — AI wyliczy ceny w minuty</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800/50 rounded-lg p-3">
                      <div className="w-7 h-7 rounded-md bg-violet-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Upload className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-violet-800 dark:text-violet-300">ES Import</p>
                        <p className="text-[11px] text-violet-700/70 dark:text-violet-400/70">Wgraj przedmiar PDF/Excel — system wyciągnie pozycje</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-lg p-3">
                      <div className="w-7 h-7 rounded-md bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <PenTool className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-blue-800 dark:text-blue-300">Ręcznie</p>
                        <p className="text-[11px] text-blue-700/70 dark:text-blue-400/70">Dodaj pozycje z katalogu KNR</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/50 rounded-lg p-3">
                      <div className="w-7 h-7 rounded-md bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Copy className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-green-800 dark:text-green-300">Szablony</p>
                        <p className="text-[11px] text-green-700/70 dark:text-green-400/70">Użyj gotowego wzorca</p>
                      </div>
                    </div>
                  </div>

                  <NewProjectButton
                    regions={regions}
                    objectTypes={objectTypes}
                    currentProjectCount={0}
                    isPro={isPro}
                    maxProjects={maxProjects}
                    defaultRegionId={defaultRegionId}
                  />
                  <div className="my-3 flex items-center gap-2">
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                    <span className="text-[11px] text-slate-400">lub</span>
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                  </div>
                  <DemoProjectButton />
                  <p className="text-xs text-slate-400 mt-3">
                    Ceny automatycznie dostosowane do Twojego województwa!
                  </p>
                </div>
              </div>
            ) : (
              <ProjectSelectList projects={projects} skipAutoRedirect />
            )}
          </TabsContent>

          {/* Templates tab */}
          <TabsContent value="templates" className="mt-0">
            <TemplatesPageClient templates={templates} />
          </TabsContent>
        </Tabs>

        {/* Back to Dashboard link */}
        <div className="text-center mt-6">
          <a
            href="/dashboard"
            className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors inline-flex items-center gap-2"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            Powrót do Dashboard
          </a>
        </div>
      </main>
    </div>
  );
}
