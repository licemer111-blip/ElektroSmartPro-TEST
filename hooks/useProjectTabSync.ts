"use client";

import { useState, useEffect, useCallback } from "react";
import { useTabSyncOptional } from "@/components/project/tab-sync-context";
import type { ProjectTab } from "@/components/project/project-view-client";

interface UseProjectTabSyncResult {
  activeTab: ProjectTab;
  setActiveTab: (tab: ProjectTab) => void;
  handleTabChange: (tab: ProjectTab) => void;
}

export function useProjectTabSync(): UseProjectTabSyncResult {
  const tabSyncContext = useTabSyncOptional();

  const [localActiveTab, setLocalActiveTab] = useState<ProjectTab>("estimate");

  // Use context if available, otherwise use local state
  const activeTab = tabSyncContext?.activeTab ?? localActiveTab;
  const setActiveTab = tabSyncContext?.setActiveTab ?? setLocalActiveTab;

  // Sync local state with context when context changes (follower mode)
  useEffect(() => {
    if (tabSyncContext?.activeTab && tabSyncContext.activeTab !== localActiveTab) {
      setLocalActiveTab(tabSyncContext.activeTab);
    }
  }, [tabSyncContext?.activeTab, localActiveTab]);

  // Tab change handler — updates both local state and context
  const handleTabChange = useCallback(
    (tab: ProjectTab) => {
      setLocalActiveTab(tab);
      if (tabSyncContext) {
        tabSyncContext.setActiveTab(tab);
      }
    },
    [tabSyncContext]
  );

  return { activeTab, setActiveTab, handleTabChange };
}
