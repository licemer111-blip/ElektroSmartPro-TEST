"use client";

import React from "react";
import type { SourceFilter } from "@/hooks/useCatalogSearch";
import type { Team } from "@/lib/types/database";

export interface CategoryNavProps {
  sourceFilter: SourceFilter;
  onSourceFilterChange: (filter: SourceFilter) => void;
  userTeam?: Team | null;
}

/** Filtr „Moje / Zespół” schowany — na wycenie zostaje przełącznik Moje / Baza / Razem. */
export const CategoryNav = React.memo(function CategoryNav(_props: CategoryNavProps) {
  return null;
});
