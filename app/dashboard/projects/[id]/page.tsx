import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import type { CatalogItem } from "@/lib/types/database";
import { DynamicCatalogSidebar } from "@/components/project/dynamic-catalog-sidebar";
import { ProjectLayoutWithHeader } from "@/components/project/project-layout-with-header";
import { AddUserAssemblyDialog } from "@/components/project/add-user-assembly-dialog";
import { ProjectPageClient } from "@/components/project/project-page-client";
import { AutoNegotiationReview } from "@/components/project/auto-negotiation-review";
import { PayPerExportResultToast } from "@/components/billing/pay-per-export-result-toast";
import { ProjectContentClient } from "@/components/project/project-content-client";
import { ProjectQuickSwitcher } from "@/components/project/project-quick-switcher";
import { ProjectTracker } from "@/components/project/project-tracker";
import { ProjectTools } from "@/components/project/project-tools";
import {
  getProjectDetails,
  getProjectItems,
  getCatalogCategories,
  getCatalogItemsByCategory,
  getUserTeamForProjectPage,
  getUserProjectRole,
} from "./actions";
import { getProjectCommentCount, getLastProjectChange } from "./stats-actions";
import { getProjectPhotos } from "./photo-actions";
import { getProfile } from "@/app/dashboard/settings/actions";
import { getUserAssemblies } from "@/app/dashboard/assemblies/actions";
import { getProjects, getRegions } from "@/app/dashboard/actions";
import { createClient } from "@/utils/supabase/server";
import { logger } from "@/lib/logger";
import { getEffectiveIsPro } from "@/lib/auth/entitlements";

// ⚡ CRITICAL: Force dynamic rendering for collaborative features
// This ensures shared projects always show fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 300;

interface ProjectPageProps {
  params: Promise<{
    id: string;
  }>;
}

// Generate metadata for dynamic routes
export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { id } = await params;
  const project = await getProjectDetails(id);

  return {
    title: project ? `${project.name} | ElektroSmart PRO` : "Projekt | ElektroSmart PRO",
    description: project ? `Kosztorys dla projektu: ${project.name}` : "Zarządzanie projektem",
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  try {
    // Await params to ensure proper resolution on all devices
    const resolvedParams = await params;
    const { id } = resolvedParams;


    // Validate project ID format (UUID format)
    if (!id || typeof id !== 'string' || id === 'undefined' || id.trim() === '') {
      redirect('/dashboard/projects');
    }

    // Additional UUID format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      redirect('/dashboard/projects');
    }

    // Step 0: Get current user for presence/collaboration features
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      redirect('/login');
    }

    // Step 1: Fetch project first to get object_type_id
    const project = await getProjectDetails(id);

    if (!project) {
      // Instead of showing 404, redirect to project selection page
      redirect('/dashboard/projects');
    }

    // Step 2: Fetch remaining data in parallel
    const [items, categories, profileResult, userAssemblies, allProjects, allRegions, commentCount, lastChange, userTeam, photos, userRole] = await Promise.all([
      getProjectItems(id),
      getCatalogCategories(undefined, false, undefined, "personal"), // sourceFilter default — user controls via toggle button
      getProfile(),
      getUserAssemblies(),
      getProjects(),
      getRegions(), // Load all voivodeships for regional selector
      getProjectCommentCount(id),
      getLastProjectChange(id),
      getUserTeamForProjectPage(),
      getProjectPhotos(id),
      getUserProjectRole(id),
    ]);

    const profile = profileResult.data;
    // Demo projects bypass free-tier blur + PDF paywall and are permanently read-only.
    const isDemoProject = project.is_demo_project === true;
    // Only external 'viewer' role (Client Portal) gets read-only lockdown.
    // All team members (editor, elektryk, kierownik, admin, owner) have full access.
    // Demo projects are editable by owner so they can explore all features freely.
    const isReadOnly = userRole === "viewer";
    // v2.1: showPrices flag feeds downstream `isPro` prop. Effective PRO =
    // paid subscription OR active 7-day trial. Demo projects bypass as before.
    const showPrices = getEffectiveIsPro(profile) || isDemoProject;
    // Catalog sidebar always uses real PRO status — never unlocked by demo project.
    // This ensures free users see blurred catalog prices even when on the demo project page.
    const showCatalogPrices = getEffectiveIsPro(profile);

    // ⚡ OPTIMIZATION: Don't fetch all catalog items initially (lazy load in sidebar)
    // This prevents huge payload size and net::ERR_ABORTED errors
    const catalogItemsByCategory: { categoryId: string; items: CatalogItem[] }[] = [];

    const regionModifier = project.regions?.price_modifier || 1.0;
    const regionName = project.regions?.name || "Brak regionu";

    // Prepare projects list for switcher (simplified data)
    const projectsList = allProjects.map(p => ({
      id: p.id,
      name: p.name,
      status: p.status,
    }));

    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 max-w-[1800px] w-full mx-auto px-4 md:px-6 lg:px-8 py-4 flex flex-col">
          {/* Project Quick Switcher */}
          <div className="mb-6">
            <ProjectQuickSwitcher
              currentProjectId={id}
              projects={projectsList}
              currentProjectName={project.name}
            />
          </div>

          {/* Auto-open negotiation review from notification click */}
          <Suspense fallback={null}>
            <AutoNegotiationReview />
          </Suspense>

          {/* v2.0 Pay-per-Export: show success/cancel toast after Stripe redirect */}
          <Suspense fallback={null}>
            <PayPerExportResultToast />
          </Suspense>

          {/* Track project visit */}
          <ProjectTracker
            projectId={id}
            projectName={project.name}
            projectStatus={project.status}
          />

          {/* Main Content with Header and Layout */}
          <div className="flex-1">
            <ProjectLayoutWithHeader
              projectId={id}
              projectName={project.name}
              projectStatus={project.status}
              vatRate={project.vat_rate}
              objectTypeName={project.object_types?.name}
              objectTypeSlug={(project.object_types as { slug?: string } | null)?.slug ?? null}
              clientName={project.client_name}
              clientAddress={project.client_address}
              clientNip={project.client_nip}
              projectItems={items}
              regionId={project.region_id}
              regionName={regionName}
              allRegions={allRegions || []}
              userHasInFaktKey={!!profile?.infakt_api_key}
              projectTotal={items.reduce((sum, item) => sum + (item.quantity * ((item.material_price || 0) + (item.labor_price || 0))), 0)}
              projectLaborRate={project.default_hourly_rate ?? 0}
              userProfile={profile ? {
                full_name: profile.full_name || undefined,
                company_name: profile.company_name || undefined,
                phone: profile.phone || undefined,
                email: profile.email || undefined,
                nip: profile.nip || undefined,
                address: profile.address || undefined,
                logo_url: profile.logo_url || undefined,
              } : undefined}
              isPro={showPrices}
              isDemoProject={isDemoProject}
              assignedTo={project.assigned_to}
              isOwner={project.user_id === profile?.id}
              userId={user.id}
              projectColor={project.color}
              photos={photos}
              isReadOnly={isReadOnly}
              // v4.0: Preview=Apply parity — thread project-level multipliers to ES-Engine dialog
              adjustmentMult={1 + (project.adjustment_percentage || 0) / 100}
              matMarkupMult={1 + (project.mat_markup_pct || 0) / 100}
              labMarkupMult={1 + (project.lab_markup_pct || 0) / 100}
              complexityFactor={1.0}
              materialsOwnedByCustomer={project.materials_owned_by_customer ?? false}
              catalogSidebar={
                <DynamicCatalogSidebar
                  projectId={id}
                  categories={categories}
                  catalogItemsByCategory={catalogItemsByCategory}
                  isPro={showCatalogPrices}
                  userTeam={userTeam}
                  projectStatus={project.status}
                />
              }
            >
              {/* Main Content - Grows naturally, scrolled by parent */}
              <div className="min-w-0 h-auto flex flex-col">
                <div className="min-w-0">
                  <ProjectContentClient
                    project={project}
                    items={items}
                    profile={profile}
                    projectId={id}
                    userId={user.id}
                    isPro={showPrices}
                    currentAssemblyCount={userAssemblies.length}
                    categories={categories}
                    catalogItemsByCategory={catalogItemsByCategory}
                    regions={allRegions || []}
                    isReadOnly={isReadOnly}
                  />
                </div>
                {/* Project Tools - Unified */}
                <div className="mt-4 flex-shrink-0">
                  <ProjectTools
                    projectId={id}
                    projectNotes={project.notes || undefined}
                    lastHistoryUpdate={lastChange || undefined}
                    projectStatus={project.status}
                  />
                </div>
              </div>
            </ProjectLayoutWithHeader>
          </div>
        </main>
      </div>
    );
  } catch (error) {
    // NEXT_REDIRECT is thrown internally by Next.js redirect() — not a real error
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }

    logger.error("ProjectPage: unexpected error", {}, error);

    // If it's a known error, redirect to project selection
    if (error instanceof Error && error.message.includes('not found')) {
      redirect('/dashboard/projects');
    }

    // For other errors, throw to be caught by error boundary
    throw error;
  }
}
