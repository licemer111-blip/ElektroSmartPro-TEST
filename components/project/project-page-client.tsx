"use client";

import { useState } from "react";
import { ProjectHeader } from "@/components/project/project-header";
import type { Region, ProjectItem } from "@/lib/types/database";

interface ProjectPageClientProps {
  id: string;
  project: {
    name: string;
    status: string;
    vat_rate: number;
    object_types?: { name: string } | null;
    client_name?: string | null;
    client_address?: string | null;
    client_nip?: string | null;
    region_id?: string | null;
    regions?: { name: string } | null;
    rate_source?: string | null;
    user_id: string;
    assigned_to?: string | null;
    color?: string | null;
  };
  items: ProjectItem[];
  profile: {
    id: string;
    infakt_api_key?: string | null;
    full_name?: string | null;
    company_name?: string | null;
    phone?: string | null;
    email?: string | null;
    nip?: string | null;
    address?: string | null;
    logo_url?: string | null;
  } | null;
  userId: string;
  isPro: boolean;
  userAssembliesLength: number;
  categories: Array<{ id: string; name: string }>;
  catalogItemsByCategory: Array<Record<string, unknown>>;
  allRegions: Array<{ id: string; name: string }>;
  commentCount?: number;
  lastChange?: string;
  onCoPilotClick?: () => void;
}

export function ProjectPageClient({
  id,
  project,
  items,
  profile,
  userId,
  isPro,
  userAssembliesLength,
  categories,
  catalogItemsByCategory,
  allRegions,
  onCoPilotClick,
}: ProjectPageClientProps) {
  return (
    <ProjectHeader
      projectId={id}
      projectName={project.name}
      projectStatus={project.status}
      isPro={isPro}
      vatRate={project.vat_rate}
      objectTypeName={project.object_types?.name}
      clientName={project.client_name}
      clientAddress={project.client_address}
      clientNip={project.client_nip}
      projectItems={items}
      regionId={project.region_id}
      regionName={project.regions?.name || "Brak regionu"}
      allRegions={allRegions as Region[]}
      userHasInFaktKey={!!profile?.infakt_api_key}
      projectTotal={items.reduce((sum, item) => sum + (item.quantity * ((item.material_price || 0) + (item.labor_price || 0))), 0)}
      userProfile={profile ? {
        full_name: profile.full_name || undefined,
        company_name: profile.company_name || undefined,
        phone: profile.phone || undefined,
        email: profile.email || undefined,
        nip: profile.nip || undefined,
        address: profile.address || undefined,
        logo_url: profile.logo_url || undefined,
      } : undefined}
      assignedTo={project.assigned_to}
      isOwner={project.user_id === profile?.id}
      projectColor={project.color}
      onCoPilotClick={onCoPilotClick}
    />
  );
}
