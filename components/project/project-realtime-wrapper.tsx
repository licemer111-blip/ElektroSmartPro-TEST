"use client";

import { ReactNode } from "react";
import { TabSyncProvider, useTabSync } from "./tab-sync-context";
import { CollaboratorCursors } from "./collaborator-cursors";
import { ProjectDataSyncProvider } from "./project-data-sync-provider";

interface ProjectRealtimeWrapperProps {
  children: ReactNode;
  projectId: string;
  userId: string;
}

/**
 * Inner wrapper that has access to TabSyncContext
 */
function ProjectRealtimeInner({
  children,
  projectId,
  userId
}: ProjectRealtimeWrapperProps) {
  const { activeTab, syncTab, uiState, syncUIState, isExternalSync } = useTabSync();

  return (
    <div className="relative">
      {/* Auto data synchronization */}
      <ProjectDataSyncProvider projectId={projectId} userId={userId} />

      {/* Realtime cursors container - absolute positioning for content-relative cursors */}
      <div className="pointer-events-none absolute inset-0 z-[9999] min-h-screen w-full">
        <CollaboratorCursors
          projectId={projectId}
          userId={userId}
          activeTab={activeTab}
          onTabSync={syncTab}
          uiState={uiState}
          onUIStateSync={syncUIState}
          isExternalSync={isExternalSync}
        />
      </div>

      {children}
    </div>
  );
}

/**
 * V4.0: Project Realtime Wrapper
 * Provides TabSyncContext and realtime features
 */
export function ProjectRealtimeWrapper({
  children,
  projectId,
  userId
}: ProjectRealtimeWrapperProps) {
  return (
    <TabSyncProvider>
      <ProjectRealtimeInner
        projectId={projectId}
        userId={userId}
      >
        {children}
      </ProjectRealtimeInner>
    </TabSyncProvider>
  );
}
