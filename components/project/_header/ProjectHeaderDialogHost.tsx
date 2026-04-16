"use client";

import { useEffect } from "react";
import { importItemsToProject } from "@/app/dashboard/projects/[id]/actions";
import { notifyDataChanged } from "@/hooks/use-synced-action";
import type { ProjectItem } from "@/lib/types/database";

import { RenameProjectDialog } from "@/components/project/RenameProjectDialog";
import { SaveAsTemplateDialog } from "@/components/project/save-as-template-dialog";
import { VariantComparisonDialog } from "@/components/project/variant-comparison-dialog";
import { ProfitMarginDialog } from "@/components/project/profit-margin-dialog";
import { AssignProjectDialog } from "@/components/project/assign-project-dialog";
import { ClientDataDialog } from "@/components/project/ClientDataDialog";
import { AIProjectImportDialog } from "@/components/project/ai-project-import-dialog";
import { CoPilotSession } from "@/components/project/copilot-session";
import { ProjectLiveChat } from "@/components/project/project-live-chat";

export interface DialogHostState {
  isRenameOpen: boolean;
  isAssignOpen: boolean;
  isClientOpen: boolean;
  isTemplateOpen: boolean;
  isVariantOpen: boolean;
  isMarginOpen: boolean;
  isAIImportOpen: boolean;
  isCoPilotActive: boolean;
  isChatOpen: boolean;
}

export type DialogHostAction =
  | { type: "SET_RENAME"; open: boolean }
  | { type: "SET_ASSIGN"; open: boolean }
  | { type: "SET_CLIENT"; open: boolean }
  | { type: "SET_TEMPLATE"; open: boolean }
  | { type: "SET_VARIANT"; open: boolean }
  | { type: "SET_MARGIN"; open: boolean }
  | { type: "SET_AI_IMPORT"; open: boolean }
  | { type: "SET_COPILOT"; open: boolean }
  | { type: "SET_CHAT"; open: boolean };

export function dialogHostReducer(
  state: DialogHostState,
  action: DialogHostAction
): DialogHostState {
  switch (action.type) {
    case "SET_RENAME": return { ...state, isRenameOpen: action.open };
    case "SET_ASSIGN": return { ...state, isAssignOpen: action.open };
    case "SET_CLIENT": return { ...state, isClientOpen: action.open };
    case "SET_TEMPLATE": return { ...state, isTemplateOpen: action.open };
    case "SET_VARIANT": return { ...state, isVariantOpen: action.open };
    case "SET_MARGIN": return { ...state, isMarginOpen: action.open };
    case "SET_AI_IMPORT": return { ...state, isAIImportOpen: action.open };
    case "SET_COPILOT": return { ...state, isCoPilotActive: action.open };
    case "SET_CHAT": return { ...state, isChatOpen: action.open };
  }
}

export const initialDialogHostState: DialogHostState = {
  isRenameOpen: false,
  isAssignOpen: false,
  isClientOpen: false,
  isTemplateOpen: false,
  isVariantOpen: false,
  isMarginOpen: false,
  isAIImportOpen: false,
  isCoPilotActive: false,
  isChatOpen: false,
};

interface ProjectHeaderDialogHostProps {
  projectId: string;
  projectName: string;
  projectStatus: string;
  vatRate: number;
  clientName?: string | null;
  clientAddress?: string | null;
  clientNip?: string | null;
  projectItems?: ProjectItem[];
  assignedTo?: string | null;
  isOwner?: boolean;
  userId?: string;
  isPro?: boolean;
  userProfile?: {
    full_name?: string;
    company_name?: string;
    email?: string;
  };
  // External sync for "Following mode"
  isExternalSync?: boolean;
  externalAiImportOpen?: boolean;
  // State from reducer
  state: DialogHostState;
  dispatch: React.Dispatch<DialogHostAction>;
}

export function ProjectHeaderDialogHost({
  projectId,
  projectName,
  projectStatus,
  vatRate,
  clientName,
  clientAddress,
  clientNip,
  projectItems = [],
  assignedTo,
  isOwner = false,
  isPro = false,
  userId,
  userProfile,
  isExternalSync,
  externalAiImportOpen,
  state,
  dispatch,
}: ProjectHeaderDialogHostProps) {
  // Apply follower-mode sync for AI Import
  useEffect(() => {
    if (!isExternalSync) return;
    if (externalAiImportOpen !== undefined && externalAiImportOpen !== state.isAIImportOpen) {
      dispatch({ type: "SET_AI_IMPORT", open: externalAiImportOpen });
    }
  }, [isExternalSync, externalAiImportOpen, state.isAIImportOpen, dispatch]);

  return (
    <>
      <RenameProjectDialog
        open={state.isRenameOpen}
        onOpenChange={(open) => dispatch({ type: "SET_RENAME", open })}
        projectId={projectId}
        currentName={projectName}
      />

      <SaveAsTemplateDialog
        projectId={projectId}
        projectName={projectName}
        open={state.isTemplateOpen}
        onOpenChange={(open) => dispatch({ type: "SET_TEMPLATE", open })}
      />

      <VariantComparisonDialog
        open={state.isVariantOpen}
        onOpenChange={(open) => dispatch({ type: "SET_VARIANT", open })}
        projectName={projectName}
        isPro={isPro}
        projectItems={(projectItems).map((item) => ({
          name: item.name,
          unit: item.unit,
          quantity: item.quantity,
          final_material_price: item.final_material_price ?? 0,
          final_labor_price: item.final_labor_price ?? 0,
        }))}
        vatRate={vatRate}
        clientName={clientName}
      />

      <ProfitMarginDialog
        open={state.isMarginOpen}
        onOpenChange={(open) => dispatch({ type: "SET_MARGIN", open })}
        projectId={projectId}
        projectName={projectName}
        items={(projectItems).map((item) => ({
          id: item.id,
          name: item.name,
          unit: item.unit,
          quantity: item.quantity,
          final_material_price: item.final_material_price ?? 0,
          final_labor_price: item.final_labor_price ?? 0,
        }))}
        vatRate={vatRate}
      />

      {isOwner && (
        <AssignProjectDialog
          projectId={projectId}
          currentAssignedTo={assignedTo}
          open={state.isAssignOpen}
          onOpenChange={(open) => dispatch({ type: "SET_ASSIGN", open })}
        />
      )}

      <ClientDataDialog
        open={state.isClientOpen}
        onOpenChange={(open) => dispatch({ type: "SET_CLIENT", open })}
        projectId={projectId}
        initialName={clientName}
        initialAddress={clientAddress}
        initialNip={clientNip}
      />

      <AIProjectImportDialog
        open={state.isAIImportOpen}
        onOpenChange={(open) => dispatch({ type: "SET_AI_IMPORT", open })}
        projectId={projectId}
        onImport={async (items) => {
          const result = await importItemsToProject(projectId, items);
          if (result.success) {
            notifyDataChanged("item-added");
          }
          return result;
        }}
      />

      <CoPilotSession
        projectId={projectId}
        isOpen={state.isCoPilotActive}
        onClose={() => dispatch({ type: "SET_COPILOT", open: false })}
      />

      {userId && (
        <ProjectLiveChat
          projectId={projectId}
          userId={userId}
          userName={
            userProfile?.full_name ||
            userProfile?.company_name ||
            userProfile?.email
          }
          isOpen={state.isChatOpen}
          onClose={() => dispatch({ type: "SET_CHAT", open: false })}
        />
      )}
    </>
  );
}
