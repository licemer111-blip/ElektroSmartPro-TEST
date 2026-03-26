"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useModalStore } from "@/hooks/use-modal-store";
import { useEffect, useState, useCallback } from "react";
import { getRegions, getObjectTypes, getUserProfile, getProjects } from "@/app/dashboard/actions";
import type { Region, ObjectType } from "@/lib/types/database";
import { useRouter } from "next/navigation";

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

  // Fetch data function
  const fetchData = useCallback(async () => {
    try {
      const [regions, objectTypes, profile, projects] = await Promise.all([
        getRegions(),
        getObjectTypes(),
        getUserProfile(),
        getProjects(),
      ]);

      setData({
        regions,
        objectTypes,
        currentProjectCount: projects.length,
        isPro: profile?.is_pro || false,
        maxProjects: profile?.max_projects || 3,
        defaultRegionId: profile?.default_region_id ?? null,
      });
    } catch (error: unknown) {
      console.error("❌ [HeaderNewProjectButton] Failed to fetch data:", error);
      
      // Check for Server Action ID mismatch error
      const errorMessage = error instanceof Error ? error.message : "";
      if (errorMessage.includes("Server Action") && errorMessage.includes("not found")) {
        console.error("[HeaderNewProjectButton] Server Action mismatch detected.");
        // Use window.location.reload() if available, otherwise just warn
        if (typeof window !== "undefined") {
           // We could reload, but let's just show a toast or alert if possible
           // or silently fail and let the user reload. 
           // Better to let the user know.
        }
      }
    }
  }, []);

  // Initial data load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleClick = async () => {
    if (isLoading) return;

    // Refresh data before opening modal to ensure accuracy
    setIsLoading(true);
    await fetchData();
    setIsLoading(false);

    if (data) {
      // ⚠️ DEMO MODE CHECK - Show ProModal if at limit
      const isAtLimit = !data.isPro && data.currentProjectCount >= data.maxProjects;
      
      if (isAtLimit) {
        onOpen('proModal');
      } else {
        onOpen('createProject', data);
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
