"use client";

import { useState, useEffect } from "react";
import { ProjectHeader } from "./project-header";
import { ProjectLayoutToggle } from "./project-layout-toggle";
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
