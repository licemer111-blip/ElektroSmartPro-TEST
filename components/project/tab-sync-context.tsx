"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import type { ProjectTab } from "./project-view-client";
import type { UIStatePayload } from "./collaborator-cursors";

interface TabSyncContextType {
  activeTab: ProjectTab;
  setActiveTab: (tab: ProjectTab) => void;
  // Для внешней синхронизации (от CollaboratorCursors)
  syncTab: (tab: string) => void;
  // UI State sync
  uiState: UIStatePayload;
  setUIState: (state: UIStatePayload) => void;
  syncUIState: (state: UIStatePayload) => void;
  // Flag to check if last change was from external sync
  isExternalSync: boolean;
}

const TabSyncContext = createContext<TabSyncContextType | null>(null);

export function TabSyncProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTabInternal] = useState<ProjectTab>("estimate");
  const [uiState, setUIStateInternal] = useState<UIStatePayload>({
    // Catalog sidebar
    catalogOpen: false,
    expandedCategories: [],
    catalogSearchTerm: "",
    catalogViewMode: "card",
    catalogCreateDialogOpen: false,
    catalogScrollTop: 0,
    catalogEditDialogOpen: false,
    catalogEditItemId: null,
    
    // Dialogs
    openDialog: null,
    
    // Add Assembly Dialog
    assemblyViewMode: "list",
    assemblySelectedId: null,
    assemblyQuantity: 1,
    assemblyDetailOpen: false,
    
    // Estimate table
    colorMode: true,
    filterType: "all",
    estimateSearchOpen: false,
    estimateSearchQuery: "",
    estimateSortBy: "date",
    estimateSortOrder: "asc",
    estimateLegendOpen: true,
    estimateEditItemId: null,
    
    // Main content
    mainScrollTop: 0,
    
    // CoPilot
    coPilotActive: false,

    // Project Header dialogs (Kreator toolbar)
    headerAiAssistantOpen: false,
    headerAiImportOpen: false,
    headerAiPricerOpen: false,
    headerMembersOpen: false,
    headerPanelOpen: false,
    headerDocsOpen: false,
    headerPortalOpen: false,
  });
  const [isExternalSync, setIsExternalSync] = useState(false);

  const setActiveTab = useCallback((tab: ProjectTab) => {
    setIsExternalSync(false);
    setActiveTabInternal(tab);
  }, []);

  // Функция для синхронизации от внешнего источника (CollaboratorCursors)
  const syncTab = useCallback((tab: string) => {
    const validTabs: ProjectTab[] = ["estimate", "materials", "notes", "settings"];
    if (validTabs.includes(tab as ProjectTab)) {
      setIsExternalSync(true);
      setActiveTabInternal(tab as ProjectTab);
    }
  }, []);

  // Local UI state update (from user interaction)
  const setUIState = useCallback((state: UIStatePayload) => {
    setIsExternalSync(false);
    setUIStateInternal(prev => ({ ...prev, ...state }));
  }, []);

  // External UI state sync (from CollaboratorCursors / Following mode)
  const syncUIState = useCallback((state: UIStatePayload) => {
    setIsExternalSync(true);
    setUIStateInternal(prev => ({ ...prev, ...state }));
  }, []);

  return (
    <TabSyncContext.Provider 
      value={{ 
        activeTab, 
        setActiveTab, 
        syncTab,
        uiState,
        setUIState,
        syncUIState,
        isExternalSync,
      }}
    >
      {children}
    </TabSyncContext.Provider>
  );
}

export function useTabSync() {
  const context = useContext(TabSyncContext);
  if (!context) {
    throw new Error("useTabSync must be used within a TabSyncProvider");
  }
  return context;
}

// Hook для использования в компонентах, которые могут быть вне провайдера
export function useTabSyncOptional() {
  return useContext(TabSyncContext);
}
