"use client";

import { CatalogSidebar } from "./catalog-sidebar";
import { Card } from "@/components/ui/card";
import { useCatalogCollapse } from "@/hooks/use-catalog-collapse";
import type { CatalogCategory, CatalogItem } from "@/lib/types/database";
import type { Team } from "@/lib/types/database";

interface DynamicCatalogSidebarProps {
  projectId: string;
  categories: CatalogCategory[];
  catalogItemsByCategory: { categoryId: string; items: CatalogItem[] }[];
  isPro: boolean;
  userTeam?: Team | null;
  projectStatus?: string;
}

export function DynamicCatalogSidebar({
  projectId,
  categories,
  catalogItemsByCategory,
  isPro,
  userTeam,
  projectStatus,
}: DynamicCatalogSidebarProps) {
  const { toggleCatalog } = useCatalogCollapse();

  return (
    <Card className="h-full min-h-0 flex flex-col shadow-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 overflow-hidden">
      <CatalogSidebar
        projectId={projectId}
        categories={categories}
        catalogItemsByCategory={catalogItemsByCategory}
        isPro={isPro}
        userTeam={userTeam}
        projectStatus={projectStatus}
        onCollapse={toggleCatalog}
      />
    </Card>
  );
}
