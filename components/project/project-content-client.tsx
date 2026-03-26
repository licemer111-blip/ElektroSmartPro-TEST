"use client";

import { useState } from "react";
import { ProjectViewClient } from "./project-view-client";
import type { ProjectItem, ProjectWithRelations, Profile, CatalogCategory, CatalogItem } from "@/lib/types/database";

interface Region {
  id: string;
  name: string;
  slug: string;
  price_modifier: number;
}

interface ProjectContentClientProps {
  project: ProjectWithRelations;
  items: ProjectItem[];
  profile: Profile | null;
  projectId: string;
  userId: string;
  isPro: boolean;
  currentAssemblyCount: number;
  categories: CatalogCategory[];
  catalogItemsByCategory: { categoryId: string; items: CatalogItem[] }[];
  regions: Region[];
  isCoPilotActive?: boolean;
  onCoPilotToggle?: () => void;
  isReadOnly?: boolean;
}

export function ProjectContentClient({
  project,
  items,
  profile,
  projectId,
  userId,
  isPro,
  currentAssemblyCount,
  categories,
  catalogItemsByCategory,
  regions,
  isCoPilotActive: externalCoPilotActive,
  onCoPilotToggle,
  isReadOnly = false,
}: ProjectContentClientProps) {
  const [internalCoPilotActive, setInternalCoPilotActive] = useState(false);
  const isCoPilotActive = externalCoPilotActive ?? internalCoPilotActive;
  
  const handleCoPilotClose = () => {
    if (onCoPilotToggle) {
      onCoPilotToggle();
    } else {
      setInternalCoPilotActive(false);
    }
  };

  return (
    <ProjectViewClient
      project={project}
      items={items}
      profile={profile}
      projectId={projectId}
      userId={userId}
      isPro={isPro}
      currentAssemblyCount={currentAssemblyCount}
      categories={categories}
      catalogItemsByCategory={catalogItemsByCategory}
      regions={regions}
      isCoPilotActive={isCoPilotActive}
      onCoPilotClose={handleCoPilotClose}
      isReadOnly={isReadOnly}
    />
  );
}
