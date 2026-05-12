import type { Metadata } from "next";
import { getProjects, getRegions, getObjectTypes } from "@/app/dashboard/actions";
import { getProfile } from "@/app/dashboard/settings/actions";
import { getTemplates } from "@/app/dashboard/templates/actions";
import { ProjectsWithTemplatesClient } from "@/components/project/projects-with-templates-client";
import { getEffectiveIsPro } from "@/lib/auth/entitlements";
import { getEffectiveMaxProjects } from "@/lib/config/tier-limits";

export const metadata: Metadata = {
  title: "Projekty — Kosztorysy Elektryczne",
  description: "Wszystkie Twoje kosztorysy w jednym miejscu — twórz, edytuj, udostępniaj i śledź statusy wycen instalacji elektrycznych",
};

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const [projects, regions, objectTypes, profileResult, templates] = await Promise.all([
    getProjects(),
    getRegions(),
    getObjectTypes(),
    getProfile(),
    getTemplates(),
  ]);

  const profile = profileResult.data;

  // No auto-redirect — always show project list with tabs (Projekty / Szablony)

  const projectsList = projects.map(p => ({
    id: p.id,
    name: p.name,
    status: p.status,
    created_at: p.created_at,
    client_name: p.client_name,
    object_types: p.object_types,
  }));

  const effectiveIsPro = getEffectiveIsPro(profile as Parameters<typeof getEffectiveIsPro>[0]);
  const effectiveMaxProjects = getEffectiveMaxProjects(profile as Parameters<typeof getEffectiveMaxProjects>[0]);
  const nonDemoCount = projects.filter(p => !('is_demo_project' in p) || !p.is_demo_project).length;

  return (
    <ProjectsWithTemplatesClient
      projects={projectsList}
      templates={templates}
      regions={regions}
      objectTypes={objectTypes}
      isPro={effectiveIsPro}
      maxProjects={effectiveMaxProjects}
      currentProjectCount={nonDemoCount}
      defaultRegionId={profile?.default_region_id ?? null}
    />
  );
}
