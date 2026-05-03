"use client";

import { useState, useEffect, useReducer } from "react";
import { useTabSyncOptional } from "@/components/project/tab-sync-context";
import type { Region, ProjectItem } from "@/lib/types/database";
import { ProjectHeaderToolbar } from "./_header/ProjectHeaderToolbar";
import {
  ProjectHeaderDialogHost,
  dialogHostReducer,
  initialDialogHostState,
} from "./_header/ProjectHeaderDialogHost";
import { useProjectHeaderActions } from "./_header/useProjectHeaderActions";

interface ProjectHeaderProps {
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
  isFinal?: boolean;
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
  photos?: import("@/lib/types/database").ProjectPhoto[];
  isReadOnly?: boolean;
  selectedRowIds?: Set<string>;
  // v4.0: Preview=Apply parity — forwarded to AiPriceEstimatorDialog via toolbar
  adjustmentMult?: number;
  matMarkupMult?: number;
  labMarkupMult?: number;
  complexityFactor?: number;
  materialsOwnedByCustomer?: boolean;
}

export function ProjectHeader({
  projectId,
  projectName,
  projectStatus,
  vatRate,
  objectTypeName,
  clientName,
  clientAddress,
  clientNip,
  projectItems = [],
  regionId,
  allRegions = [],
  projectTotal = 0,
  projectLaborRate,
  userProfile,
  assignedTo,
  isOwner = false,
  projectColor,
  userId,
  isReadOnly = false,
  isPro = false,
  selectedRowIds,
  adjustmentMult = 1.0,
  matMarkupMult = 1.0,
  labMarkupMult = 1.0,
  complexityFactor = 1.0,
  materialsOwnedByCustomer = false,
}: ProjectHeaderProps) {
  const regionModifier =
    allRegions.find((r) => r.id === regionId)?.price_modifier ?? 1.0;

  const [dialogState, dispatch] = useReducer(
    dialogHostReducer,
    initialDialogHostState
  );

  const [localSelectedRowIds, setLocalSelectedRowIds] = useState<Set<string>>(
    selectedRowIds ?? new Set()
  );

  useEffect(() => {
    const handler = (e: Event) => {
      const { projectId: evtId, ids } = (
        e as CustomEvent<{ projectId: string; ids: string[] }>
      ).detail;
      if (evtId !== projectId) return;
      setLocalSelectedRowIds(new Set(ids));
    };
    window.addEventListener("estimate-selection-changed", handler);
    return () => window.removeEventListener("estimate-selection-changed", handler);
  }, [projectId]);

  const tabSyncCtx = useTabSyncOptional();

  const broadcastHeaderDialog = (key: string, open: boolean) => {
    tabSyncCtx?.setUIState({ [key]: open });
  };

  const actions = useProjectHeaderActions({
    projectId,
    projectStatus,
  });

  return (
    <>
      <ProjectHeaderToolbar
        projectId={projectId}
        projectName={projectName}
        projectStatus={projectStatus}
        vatRate={vatRate}
        objectTypeName={objectTypeName}
        clientName={clientName}
        projectItems={projectItems}
        regionModifier={regionModifier}
        isPro={isPro}
        isOwner={isOwner}
        projectColor={projectColor}
        isReadOnly={isReadOnly}
        projectTotal={projectTotal}
        localSelectedRowIds={localSelectedRowIds}
        projectLaborRate={projectLaborRate}
        adjustmentMult={adjustmentMult}
        matMarkupMult={matMarkupMult}
        labMarkupMult={labMarkupMult}
        complexityFactor={complexityFactor}
        materialsOwnedByCustomer={materialsOwnedByCustomer}
        userProfile={userProfile}
        isSaving={actions.isSaving}
        isDuplicating={actions.isDuplicating}
        isArchiving={actions.isArchiving}
        onToggleStatus={actions.handleToggleStatus}
        onDuplicate={actions.handleDuplicateProject}
        onArchiveToggle={actions.handleArchiveToggle}
        dispatch={dispatch}
        isExternalSync={tabSyncCtx?.isExternalSync}
        externalAiAssistantOpen={tabSyncCtx?.uiState.headerAiAssistantOpen}
        externalAiPricerOpen={tabSyncCtx?.uiState.headerAiPricerOpen}
        externalMembersOpen={tabSyncCtx?.uiState.headerMembersOpen}
        externalDocsOpen={tabSyncCtx?.uiState.headerDocsOpen}
        externalPanelOpen={tabSyncCtx?.uiState.headerPanelOpen}
        onBroadcastDialog={broadcastHeaderDialog}
        onCoPilotClick={() => dispatch({ type: "SET_COPILOT", open: true })}
        onChatClick={() => dispatch({ type: "SET_CHAT", open: true })}
        onAIImportClick={() => {
          dispatch({ type: "SET_AI_IMPORT", open: true });
          broadcastHeaderDialog("headerAiImportOpen", true);
        }}
      />

      <ProjectHeaderDialogHost
        projectId={projectId}
        projectName={projectName}
        projectStatus={projectStatus}
        vatRate={vatRate}
        clientName={clientName}
        clientAddress={clientAddress}
        clientNip={clientNip}
        projectItems={projectItems}
        assignedTo={assignedTo}
        isOwner={isOwner}
        isPro={isPro}
        userId={userId}
        userProfile={userProfile}
        isExternalSync={tabSyncCtx?.isExternalSync}
        externalAiImportOpen={tabSyncCtx?.uiState.headerAiImportOpen}
        state={dialogState}
        dispatch={dispatch}
      />
    </>
  );
}

