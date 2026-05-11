"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useModalStore } from "@/hooks/use-modal-store";
import { useEffect, useState, useCallback } from "react";
import { getRegions, getObjectTypes, getUserProfile, getProjects } from "@/app/dashboard/actions";
import type { Region, ObjectType } from "@/lib/types/database";
import { useRouter } from "next/navigation";
import { getEffectiveIsPro } from "@/lib/auth/entitlements";
import { getEffectiveMaxProjects } from "@/lib/config/tier-limits";

export function HeaderNewProjectButton() {
  const { onOpen } = useModalStore();
  const router = useRouter();
  const [data, setData] = useState<{
    regions: Region[];
    objectTypes: ObjectType[];
    currentProjectCount: number;
    isPro: boolean;
    maxProjects: number;
    defaultRegionId: string | null;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch data function — returns fresh data directly to avoid stale state
  const fetchData = useCallback(async () => {
    try {
      const [regions, objectTypes, profile, projects] = await Promise.all([
        getRegions(),
        getObjectTypes(),
        getUserProfile(),
        getProjects(),
      ]);

      const fresh = {
        regions,
        objectTypes,
        currentProjectCount: projects.filter(p => !p.is_demo_project).length,
        isPro: getEffectiveIsPro(profile),
        maxProjects: getEffectiveMaxProjects(profile),
        defaultRegionId: profile?.default_region_id ?? null,
      };
      setData(fresh);
      return fresh;
    } catch (error: unknown) {
      console.error("❌ [HeaderNewProjectButton] Failed to fetch data:", error);
      return null;
    }
  }, []);

  // Initial data load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleClick = async () => {
    if (isLoading) return;

    // Refresh data before opening modal — use RETURNED value to avoid stale state
    setIsLoading(true);
    const fresh = await fetchData();
    setIsLoading(false);

    const current = fresh ?? data;
    if (current) {
      const isAtLimit = !current.isPro && current.currentProjectCount >= current.maxProjects;
      if (isAtLimit) {
        onOpen('proModal');
      } else {
        onOpen('createProject', current);
      }
    }
  };

  // Check if at limit for button text (only affects text, not styling)
  const isAtLimit = data && !data.isPro && data.currentProjectCount >= data.maxProjects;

  return (
    <Button 
      size="sm" 
      data-tour="new-project"
      className="hidden md:flex shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 hover:shadow-blue-500/50 text-white"
      onClick={handleClick}
      disabled={!data || isLoading}
    >
      <Plus className="mr-2 h-4 w-4" />
      {isLoading ? "Ładowanie..." : isAtLimit ? "Nowy Projekt (PRO)" : "Nowy Projekt"}
    </Button>
  );
}
