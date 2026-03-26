import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { NewProjectButton } from "@/components/dashboard/new-project-button";
import { getProjects, getRegions, getObjectTypes, getUserProfile, getRecentClientActivity } from "./actions";
import { FileText, Clock, CheckCircle, Lightbulb, LayoutDashboard, Sparkles, Boxes } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { EmptyProjectsState } from "@/components/dashboard/empty-projects-state";
import { ProjectsManagerView } from "@/components/dashboard/projects-manager-view";
import { createClient } from "@/utils/supabase/server";
import { OnboardingTour } from "@/components/onboarding/onboarding-tour";
import { ClientActivityWidget } from "@/components/dashboard/client-activity-widget";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Dashboard — Twoje Projekty",
  description: "Centrum dowodzenia elektryka — projekty, statystyki, aktywność zespołu i szybki dostęp do narzędzi ES-Engine",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch data server-side
  const [projects, regions, objectTypes, profile, categoriesData, recentActivity] = await Promise.all([
    getProjects(),
    getRegions(),
    getObjectTypes(),
    getUserProfile(),
    user ? supabase.from("project_categories").select("*").eq("user_id", user.id).order("name") : Promise.resolve({ data: [] }),
    getRecentClientActivity(),
  ]);

  const categories = categoriesData.data || [];

  // Calculate stats
  const draftCount = projects.filter((p) => p.status === "draft").length;
  const finalCount = projects.filter((p) => p.status === "final").length;
  const totalCount = projects.length;

  return (
    <div className="min-h-screen animate-in fade-in duration-500">
      <PageContainer maxWidth="xl">
        {/* Welcome Section */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="p-2 md:p-3 rounded-xl bg-blue-600 shadow-lg shadow-blue-500/20">
                <LayoutDashboard className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Dashboard</h1>
                <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-1">Ekspertowy System Kosztorysowy | KNR | Nakłady r-g | ES-Engine</p>
              </div>
            </div>
            <div className="w-full md:w-auto">
              <NewProjectButton
                regions={regions}
                objectTypes={objectTypes}
                currentProjectCount={projects.length}
                isPro={profile?.is_pro || false}
                maxProjects={profile?.max_projects || 3}
                defaultRegionId={profile?.default_region_id ?? null}
              />
            </div>
          </div>

          {/* Quick Start Guide - Compact 3-step */}
          {projects.length > 0 && projects.length <= 3 && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">1</div>
                <div>
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">Otwórz projekt</p>
                  <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">Kliknij na projekt — otworzysz kosztorys z podziałem Robocizna/Materiał</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">2</div>
                <div>
                  <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">Dodaj pozycje</p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">Z katalogu KNR, zestawów (Puszka+Kabel+Bruzda) lub AI</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center text-white font-bold text-sm">3</div>
                <div>
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">Eksportuj PDF</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">Wyślij PDF klientowi lub udostępnij przez Portal Klienta</p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Projects Manager or Empty State */}
        {projects.length === 0 ? (
          <EmptyProjectsState
            regions={regions}
            objectTypes={objectTypes}
            isPro={profile?.is_pro || false}
            maxProjects={profile?.max_projects || 3}
          />
        ) : (
          <>
            {/* Projects info bar */}
            <div className="mb-6 p-4 sm:p-5 rounded-2xl border border-blue-200/60 dark:border-blue-900/40 bg-gradient-to-r from-blue-50/80 via-slate-50/50 to-indigo-50/80 dark:from-blue-950/30 dark:via-slate-900/50 dark:to-indigo-950/30 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-blue-600/10 dark:bg-blue-500/15">
                      <Boxes className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    Twoje projekty
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 ml-10">
                    Kosztorysy z podziałem Robocizna/Materiał — filtruj, sortuj, eksportuj
                  </p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-800/50 shadow-sm">
                    <FileText className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                    <span className="text-sm font-bold text-blue-700 dark:text-blue-300">{totalCount}</span>
                    <span className="text-xs text-blue-500/80 dark:text-blue-400/70">łącznie</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/50 shadow-sm">
                    <Clock className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                    <span className="text-sm font-bold text-amber-700 dark:text-amber-300">{draftCount}</span>
                    <span className="text-xs text-amber-500/80 dark:text-amber-400/70">robocze</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200/70 dark:border-green-800/50 shadow-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400" />
                    <span className="text-sm font-bold text-green-700 dark:text-green-300">{finalCount}</span>
                    <span className="text-xs text-green-500/80 dark:text-green-400/70">ukończone</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Client Activity Widget */}
            {recentActivity.length > 0 && (
              <div className="mb-6">
                <ClientActivityWidget activities={recentActivity} />
              </div>
            )}

            <ProjectsManagerView
              projects={projects}
              categories={categories}
              selectedCategoryId={params.category || null}
              currentUserId={user?.id}
            />

            {/* Informational Footer Banner */}
            <Card className="mt-6 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-slate-50/50 to-blue-50/50 dark:from-slate-950/20 dark:to-blue-950/20 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                    <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
                      💡 Zaawansowane funkcje projektów
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Wykorzystaj pełny potencjał kreatora kosztorysów
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                    <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-blue-900 dark:text-blue-100">🔌 Konfigurator Rozdzielnicy</p>
                      <p className="text-[10px] text-blue-700 dark:text-blue-400 mt-0.5">
                        120+ modułów DIN w 15 kategoriach — schemat jednokreskowy AI, eksport PDF/SVG
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-3 rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800">
                    <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-violet-900 dark:text-violet-100">📐 Nakłady r-g (KNR)</p>
                      <p className="text-[10px] text-violet-700 dark:text-violet-400 mt-0.5">
                        600+ norm KNR 5-04/5-08/5-09 — rbh w PDF, Zestawy 360°
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                    <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-100">🤝 Współpraca Zespołowa</p>
                      <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                        Zaproś współpracownika — wspólne projekty i katalog
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
                    <Sparkles className="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-orange-900 dark:text-orange-100">⚡ Szybka Wycena</p>
                      <p className="text-[10px] text-orange-700 dark:text-orange-400 mt-0.5">
                        Kosztorys AI w 60 sekund — typ obiektu, metraż, region
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-3 rounded-lg bg-white/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700">
                    <FileText className="w-4 h-4 text-slate-600 dark:text-slate-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">📋 Szablony</p>
                      <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5">
                        Twórz projekty z gotowych szablonów w sekundy
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-3 rounded-lg bg-white/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700">
                    <Boxes className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">� ES Import</p>
                      <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5">
                        Wgraj PDF/Excel → ES-Engine wyciągnie materiały z cenami
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center">
                    <strong className="text-blue-600 dark:text-blue-400">Wskazówka:</strong> Zestawy 360° automatycznie dodają Puszkę + Kabel + Bruzdę do każdego punktu elektrycznego!
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Extra spacing at bottom */}
            <div className="h-12"></div>
          </>
        )}
      </PageContainer>
      <OnboardingTour onboardingCompleted={profile?.onboarding_completed ?? false} />
    </div>
  );
}
