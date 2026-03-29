"use client";

import { useState, useEffect } from "react";
import { ProjectHeader } from "./project-header";
import { ProjectLayoutToggle } from "./project-layout-toggle";
import { Sparkles, Eye } from "lucide-react";
import type { Region, ProjectItem, ProjectPhoto } from "@/lib/types/database";

interface ProjectLayoutWithHeaderProps {
  // Header props
  projectId: string;
  projectName: string;
  projectStatus: string;
  vatRate: number;
  objectTypeName?: string;
  clientName?: string | null;
  clientAddress?: string | null;
  clientNip?: string | null;
  projectItems?: ProjectItem[];
  regionId?: string | null;
  regionName?: string | null;
  allRegions?: Region[];
  userHasInFaktKey?: boolean;
  projectTotal?: number;
  projectLaborRate?: number;
  userProfile?: {
    full_name?: string;
    company_name?: string;
    phone?: string;
    email?: string;
    nip?: string;
    address?: string;
    logo_url?: string;
  };
  isPro?: boolean;
  isDemoProject?: boolean;
  assignedTo?: string | null;
  isOwner?: boolean;
  projectColor?: string | null;
  onCoPilotClick?: () => void;
  userId?: string;
  photos?: ProjectPhoto[];
  isReadOnly?: boolean;
  
  // Layout props
  catalogSidebar: React.ReactNode;
  children: React.ReactNode;
}

export function ProjectLayoutWithHeader({
  projectId,
  projectName,
  projectStatus,
  vatRate,
  objectTypeName,
  clientName,
  clientAddress,
  clientNip,
  projectItems,
  regionId,
  regionName,
  allRegions,
  userHasInFaktKey,
  projectTotal,
  projectLaborRate,
  userProfile,
  isPro,
  isDemoProject = false,
  assignedTo,
  isOwner,
  projectColor,
  onCoPilotClick,
  userId,
  photos,
  isReadOnly,
  catalogSidebar,
  children,
}: ProjectLayoutWithHeaderProps) {
  return (
    <div className="flex flex-col">
      {isDemoProject && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 mb-3 rounded-xl bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-950/40 dark:to-blue-950/40 border border-violet-200 dark:border-violet-800/60 shadow-sm">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <Sparkles className="w-4 h-4 text-violet-500 flex-shrink-0" />
            <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">
              Projekt Pokazowy
            </span>
            <span className="hidden sm:inline text-xs text-violet-500 dark:text-violet-400">
              &mdash; Tylko do odczytu. Pełny przykładowy kosztorys bez blokad cenowych.
            </span>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-100 dark:bg-violet-900/50 border border-violet-200 dark:border-violet-700/60">
            <Eye className="w-3 h-3 text-violet-500" />
            <span className="text-[10px] font-semibold text-violet-600 dark:text-violet-300 uppercase tracking-wide">Tryb podglądu</span>
          </div>
        </div>
      )}
      <ProjectHeader
        projectId={projectId}
        projectName={projectName}
        projectStatus={projectStatus}
        vatRate={vatRate}
        objectTypeName={objectTypeName}
        clientName={clientName}
        clientAddress={clientAddress}
        clientNip={clientNip}
        projectItems={projectItems}
        regionId={regionId}
        regionName={regionName}
        allRegions={allRegions}
        userHasInFaktKey={userHasInFaktKey}
        projectTotal={projectTotal}
        projectLaborRate={projectLaborRate}
        userProfile={userProfile}
        isPro={isPro}
        assignedTo={assignedTo}
        isOwner={isOwner}
        projectColor={projectColor}
        onCoPilotClick={onCoPilotClick}
        userId={userId}
        photos={photos}
        isReadOnly={isReadOnly}
      />
      
      <ProjectLayoutToggle
        catalogSidebar={catalogSidebar}
      >
        {children}
      </ProjectLayoutToggle>
    </div>
  );
}
