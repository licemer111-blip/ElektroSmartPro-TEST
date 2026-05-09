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
  objectTypeSlug?: string | null;
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
  // v4.0: Preview=Apply parity — forwarded through the chain to the AI pricing dialog
  adjustmentMult?: number;
  matMarkupMult?: number;
  labMarkupMult?: number;
  complexityFactor?: number;
  materialsOwnedByCustomer?: boolean;

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
  objectTypeSlug,
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
  adjustmentMult = 1.0,
  matMarkupMult = 1.0,
  labMarkupMult = 1.0,
  complexityFactor = 1.0,
  materialsOwnedByCustomer = false,
  catalogSidebar,
  children,
}: ProjectLayoutWithHeaderProps) {
  return (
    <div className="flex flex-col">
      {isDemoProject && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 mb-3 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/40 dark:to-yellow-950/40 border border-amber-200 dark:border-amber-800/60 shadow-sm">
          <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span className="text-sm text-amber-800 dark:text-amber-300 flex-1 min-w-0">
            <span className="font-bold">To jest projekt demonstracyjny.</span>
            {" "}Możesz go przeglądać i edytować — to dobry sposób żeby poznać system.
            Gdy będziesz gotowy, utwórz własny projekt klikając{" "}
            <span className="font-semibold">„+ Nowy projekt"</span> na dashboardzie.
          </span>
        </div>
      )}
      <ProjectHeader
        projectId={projectId}
        projectName={projectName}
        projectStatus={projectStatus}
        vatRate={vatRate}
        objectTypeName={objectTypeName}
        objectTypeSlug={objectTypeSlug}
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
        adjustmentMult={adjustmentMult}
        matMarkupMult={matMarkupMult}
        labMarkupMult={labMarkupMult}
        complexityFactor={complexityFactor}
        materialsOwnedByCustomer={materialsOwnedByCustomer}
      />
      
      <ProjectLayoutToggle
        catalogSidebar={catalogSidebar}
      >
        {children}
      </ProjectLayoutToggle>
    </div>
  );
}
