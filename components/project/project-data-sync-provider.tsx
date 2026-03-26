"use client";

import { useProjectDataSync } from "@/hooks/use-project-data-sync";

interface ProjectDataSyncProviderProps {
  projectId: string;
  userId: string;
}

/**
 * Provider component for project data synchronization
 * Renders nothing - just sets up the real-time sync
 */
export function ProjectDataSyncProvider({ projectId, userId }: ProjectDataSyncProviderProps) {
  // Hook sets up the broadcast function globally via dataSyncEmitter
  useProjectDataSync(projectId, userId);
  return null; // Invisible component
}
