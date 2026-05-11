import type { Metadata } from "next";
import { NewProjectButton } from "@/components/dashboard/new-project-button";
import { getProjects, getRegions, getObjectTypes, getUserProfile, getRecentClientActivity } from "./actions";
import { FileText, Clock, CheckCircle, LayoutDashboard, Boxes } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { EmptyProjectsState } from "@/components/dashboard/empty-projects-state";
import { ProjectsManagerView } from "@/components/dashboard/projects-manager-view";
import { createClient } from "@/utils/supabase/server";
import { OnboardingTour } from "@/components/onboarding/onboarding-tour";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { ClientActivityWidget } from "@/components/dashboard/client-activity-widget";
import { getEffectiveMaxProjects } from "@/lib/config/tier-limits";
import { StartTrialButton } from "@/components/billing/start-trial-button";
import { getEffectiveIsPro, hasUsedTrial } from "@/lib/auth/entitlements";

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

  // ── Onboarding gate: show wizard if user hasn't set up basics ──────────
  const needsOnboarding = profile != null
    && !profile.onboarding_completed
    && (!profile.hourly_rate || profile.hourly_rate <= 0);

  if (needsOnboarding) {
    return (
      <div className="min-h-screen animate-in fade-in duration-500">
        <PageContainer maxWidth="xl">
          <OnboardingWizard
            regions={regions}
            userName={profile?.full_name ?? profile?.company_name ?? null}
            userId={user?.id}
          />
        </PageContainer>
      </div>
    );
  }

  const effectivelyPro = getEffectiveIsPro(profile);
  const trialUsed = hasUsedTrial(profile);

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
                currentProjectCount={projects.filter(p => !p.is_demo_project).length}
                isPro={effectivelyPro}
                maxProjects={getEffectiveMaxProjects(profile)}
                defaultRegionId={profile?.default_region_id ?? null}
                hourlyRate={profile?.hourly_rate ?? 0}
              />
            </div>
          </div>

          {/* Trial CTA — shown to free users who haven't used their trial yet */}
          {!effectivelyPro && !trialUsed && (
            <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 px-5 py-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-200/70 dark:border-indigo-800/50 shadow-sm">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-indigo-900 dark:text-indigo-100">
                  🚀 Wypróbuj PRO przez 1 dzień — za darmo, bez karty!
                </p>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">
                  Odblokuj: AI bez limitów, czysty PDF do klienta, Portal Klienta, pełna baza KNR 2026
                </p>
              </div>
              <StartTrialButton variant="compact" />
            </div>
          )}

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
            isPro={effectivelyPro}
            maxProjects={getEffectiveMaxProjects(profile)}
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

            {/* Extra spacing at bottom */}
            <div className="h-12"></div>
          </>
        )}
      </PageContainer>
      <OnboardingTour onboardingCompleted={profile?.onboarding_completed ?? false} />
    </div>
  );
}
