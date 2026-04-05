"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft, Save, MoreVertical, Edit, Loader2, CheckCircle,
  User, Copy, FileBox, Archive, ArchiveRestore, UserCog,
  GitCompareArrows, PiggyBank, FileSpreadsheet, Info,
  Sparkles, CircleDollarSign, ChevronDown, Brain,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ProjectItem } from "@/lib/types/database";
import { AIAssistantDialog } from "@/components/project/ai-assistant-dialog";
import { AiPriceEstimatorDialog } from "@/components/project/ai-price-estimator-dialog";
import { ProjectMembersDialog } from "@/components/project/project-members-dialog";
import { PanelConfigurator } from "@/components/project/panel-configurator";
import { DocumentationDialog } from "@/components/project/project-documentation-tab";
import { ShareOfferDialog } from "@/components/project/share-offer-dialog";
import { ProjectTagsManager } from "@/components/project/project-tags-manager";
import { ProjectColorPicker } from "@/components/project/project-color-picker";
import { InvestmentContextPopup } from "@/components/knr/InvestmentContextPopup";
import type { DialogHostAction } from "./ProjectHeaderDialogHost";

interface ProjectHeaderToolbarProps {
  projectId: string;
  projectName: string;
  projectStatus: string;
  vatRate: number;
  objectTypeName?: string;
  clientName?: string | null;
  projectItems?: ProjectItem[];
  regionModifier?: number;
  isPro?: boolean;
  isOwner?: boolean;
  projectColor?: string | null;
  isReadOnly?: boolean;
  projectTotal?: number;
  localSelectedRowIds: Set<string>;
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
  // Action handlers from useProjectHeaderActions
  isSaving: boolean;
  isDuplicating: boolean;
  isArchiving: boolean;
  onToggleStatus: () => void;
  onDuplicate: () => void;
  onArchiveToggle: () => void;
  // Dialog triggers — dispatch into DialogHost
  dispatch: React.Dispatch<DialogHostAction>;
  // External sync for "Following mode"
  isExternalSync?: boolean;
  externalAiAssistantOpen?: boolean;
  externalAiPricerOpen?: boolean;
  externalMembersOpen?: boolean;
  externalDocsOpen?: boolean;
  externalPanelOpen?: boolean;
  onBroadcastDialog: (key: string, open: boolean) => void;
  // CoPilot / Chat triggers
  onCoPilotClick: () => void;
  onChatClick: () => void;
  onAIImportClick: () => void;
}

export function ProjectHeaderToolbar({
  projectId,
  projectName,
  projectStatus,
  vatRate,
  objectTypeName,
  clientName,
  projectItems = [],
  regionModifier = 1.0,
  isPro = false,
  isOwner = false,
  projectColor,
  isReadOnly = false,
  projectTotal = 0,
  localSelectedRowIds,
  projectLaborRate,
  userProfile,
  isSaving,
  isDuplicating,
  isArchiving,
  onToggleStatus,
  onDuplicate,
  onArchiveToggle,
  dispatch,
  isExternalSync,
  externalAiAssistantOpen,
  externalAiPricerOpen,
  externalMembersOpen,
  externalDocsOpen,
  externalPanelOpen,
  onBroadcastDialog,
  onCoPilotClick,
  onChatClick,
  onAIImportClick,
}: ProjectHeaderToolbarProps) {
  const { toast } = useToast();
  const isFinal = projectStatus === "final";

  const [esAssistOpen, setEsAssistOpen] = useState(false);
  const [esWycenaOpen, setEsWycenaOpen] = useState(false);
  const [investmentContextOpen, setInvestmentContextOpen] = useState(false);

  return (
    <div className="mb-4">
      {/* Back link */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Powrót do listy
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 w-full">
        {/* Row 1: Name + Edit dropdown */}
        <div className="flex flex-col gap-2 min-w-0 lg:pl-[18px]">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap flex-shrink-0">
              {projectName}
            </h1>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 flex-shrink-0"
                  aria-label="Otwórz menu opcji projektu"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem
                  onClick={() => dispatch({ type: "SET_RENAME", open: true })}
                  disabled={isDuplicating}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Zmień nazwę
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => dispatch({ type: "SET_CLIENT", open: true })}
                  disabled={isDuplicating}
                >
                  <User className="mr-2 h-4 w-4" />
                  Dane klienta
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDuplicate} disabled={isDuplicating}>
                  {isDuplicating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Copy className="mr-2 h-4 w-4" />
                  )}
                  Kopiuj projekt
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => dispatch({ type: "SET_TEMPLATE", open: true })}
                >
                  <FileBox className="mr-2 h-4 w-4" />
                  Zapisz jako szablon
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => dispatch({ type: "SET_VARIANT", open: true })}
                >
                  <GitCompareArrows className="mr-2 h-4 w-4" />
                  Warianty wyceny
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => dispatch({ type: "SET_MARGIN", open: true })}
                >
                  <PiggyBank className="mr-2 h-4 w-4" />
                  Kalkulator marży
                </DropdownMenuItem>
                {isOwner && (
                  <DropdownMenuItem
                    onClick={() => dispatch({ type: "SET_ASSIGN", open: true })}
                  >
                    <UserCog className="mr-2 h-4 w-4" />
                    Przypisz projekt
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onArchiveToggle} disabled={isArchiving}>
                  {isArchiving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : projectStatus === "archived" ? (
                    <ArchiveRestore className="mr-2 h-4 w-4" />
                  ) : (
                    <Archive className="mr-2 h-4 w-4" />
                  )}
                  {projectStatus === "archived"
                    ? "Przywróć z archiwum"
                    : "Archiwizuj projekt"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Status badges row */}
          <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap no-scrollbar pb-0.5">
            <Badge
              variant={
                projectStatus === "draft"
                  ? "secondary"
                  : "success"
              }
            >
              {projectStatus === "draft"
                ? "Wersja robocza"
                : projectStatus === "final"
                ? "Ukończony"
                : "Zarchiwizowany"}
            </Badge>
            <Badge variant="outline">VAT {vatRate}%</Badge>
            {objectTypeName && <Badge variant="outline">{objectTypeName}</Badge>}
            <ProjectTagsManager projectId={projectId} compact />
            <ProjectColorPicker
              projectId={projectId}
              currentColor={projectColor}
              compact
            />
          </div>
        </div>

        {/* Row 2: Action buttons */}
        <div className="lg:pl-[18px]">
          {isReadOnly ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-[11px] font-semibold border border-amber-300 dark:border-amber-700 select-none">
              <Info className="h-3.5 w-3.5" />
              Tryb podglądu
            </span>
          ) : (
            <div className="inline-flex flex-col lg:flex-row gap-1 p-1 bg-blue-50/50 dark:bg-slate-800/50 rounded-lg border border-blue-100 dark:border-slate-700/50 w-full lg:w-fit max-w-full">

              {/* Hidden dialog containers — controlled via externalOpen */}
              <div className="hidden">
                <AIAssistantDialog
                  projectId={projectId}
                  isPro={isPro}
                  projectStatus={projectStatus}
                  externalOpen={esAssistOpen || (isExternalSync ? (externalAiAssistantOpen ?? false) : false)}
                  onExternalOpenChange={(v) => { setEsAssistOpen(v); onBroadcastDialog("headerAiAssistantOpen", v); }}
                />
                <AiPriceEstimatorDialog
                  projectId={projectId}
                  itemCount={projectItems.length}
                  projectStatus={projectStatus}
                  selectedRowIds={localSelectedRowIds.size > 0 ? localSelectedRowIds : undefined}
                  externalOpen={esWycenaOpen || (isExternalSync ? (externalAiPricerOpen ?? false) : false)}
                  onExternalOpenChange={(v) => { setEsWycenaOpen(v); onBroadcastDialog("headerAiPricerOpen", v); }}
                  rateIsDefault={!projectLaborRate || projectLaborRate <= 0}
                />
              </div>

              {/* Group 1: ES-Engine dropdown + Uczestnicy */}
              <div className="flex items-center gap-1 overflow-x-auto flex-nowrap no-scrollbar">
                {/* ✨ ES-Engine unified dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      disabled={isFinal}
                      className={`h-7 sm:h-8 text-[11px] sm:text-xs gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white flex-shrink-0 rounded-md shadow-[0_0_14px_rgba(249,115,22,0.55)] hover:shadow-[0_0_20px_rgba(249,115,22,0.75)] ring-1 ring-orange-400/40 transition-shadow duration-200 ${isFinal ? "opacity-50 cursor-not-allowed shadow-none ring-0" : ""}`}
                    >
                      <Sparkles className="h-3.5 w-3.5 drop-shadow-sm" />
                      <span className="font-semibold">ES-Engine</span>
                      <ChevronDown className="h-3 w-3 opacity-70" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuLabel className="text-[10px] text-slate-400 font-normal uppercase tracking-wide">Inteligentna wycena</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => setInvestmentContextOpen(true)}>
                      <Brain className="mr-2 h-4 w-4 text-amber-500" />
                      <div className="flex flex-col">
                        <span className="text-xs font-medium">Kontekst Inwestycji</span>
                        <span className="text-[10px] text-slate-400">Opisz obiekt dla lepszych norm KNR</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        if (isFinal) { toast({ title: "🔒 Projekt zablokowany", description: "Odblokuj projekt, aby używać ES-Engine", variant: "destructive" }); return; }
                        setEsAssistOpen(true);
                        onBroadcastDialog("headerAiAssistantOpen", true);
                      }}
                    >
                      <Sparkles className="mr-2 h-4 w-4 text-amber-500" />
                      <div className="flex flex-col">
                        <span className="text-xs font-medium">ES Asystent</span>
                        <span className="text-[10px] text-slate-400">Porad, pomoc, analiza</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        if (isFinal) { toast({ title: "🔒 Projekt zablokowany", description: "Odblokuj projekt, aby importować pozycje", variant: "destructive" }); return; }
                        onAIImportClick();
                      }}
                    >
                      <FileSpreadsheet className="mr-2 h-4 w-4 text-amber-500" />
                      <div className="flex flex-col">
                        <span className="text-xs font-medium">ES Import</span>
                        <span className="text-[10px] text-slate-400">Z pliku, PDF, tekstu</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        if (isFinal) { toast({ title: "🔒 Projekt zablokowany", description: "Odblokuj projekt, aby wyceniać", variant: "destructive" }); return; }
                        setEsWycenaOpen(true);
                        onBroadcastDialog("headerAiPricerOpen", true);
                      }}
                      disabled={projectItems.length === 0}
                    >
                      <CircleDollarSign className="mr-2 h-4 w-4 text-orange-500" />
                      <div className="flex flex-col">
                        <span className="text-xs font-medium">ES Wycena (L1+L2+L3)</span>
                        <span className="text-[10px] text-slate-400">{projectItems.length} pozycji · normy KNR</span>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <ProjectMembersDialog
                  projectId={projectId}
                  isOwner
                  onCoPilotClick={onCoPilotClick}
                  onLiveChatClick={onChatClick}
                  projectStatus={projectStatus}
                  externalOpen={isExternalSync ? (externalMembersOpen ?? false) : undefined}
                  onExternalOpenChange={(v) => onBroadcastDialog("headerMembersOpen", v)}
                />
              </div>

              <div className="hidden lg:block w-px h-5 bg-slate-200 dark:bg-slate-700 mx-0.5 flex-shrink-0 self-center" />

              {/* Group 2: Panel / Dok / Share / Zapisz */}
              <div className="flex items-center gap-1 overflow-x-auto flex-nowrap no-scrollbar flex-wrap sm:flex-nowrap">
                <PanelConfigurator
                  projectId={projectId}
                  isPro={isPro}
                  projectStatus={projectStatus}
                  regionModifier={regionModifier}
                  userProfile={userProfile}
                  isReadOnly={isReadOnly}
                  externalOpen={isExternalSync ? (externalPanelOpen ?? false) : undefined}
                  onExternalOpenChange={(v) => onBroadcastDialog("headerPanelOpen", v)}
                />
                <InvestmentContextPopup
                  externalOpen={investmentContextOpen}
                  onExternalOpenChange={setInvestmentContextOpen}
                />
                <DocumentationDialog
                  projectId={projectId}
                  projectStatus={projectStatus}
                  projectName={projectName}
                  itemCount={projectItems.length}
                  externalOpen={
                    isExternalSync ? (externalDocsOpen ?? false) : undefined
                  }
                  onExternalOpenChange={(v) =>
                    onBroadcastDialog("headerDocsOpen", v)
                  }
                />
                {/* ShareOfferDialog moved to SummaryExportPanel — hidden here to avoid duplication */}
                <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-0.5 flex-shrink-0" />
                <Button
                  onClick={onToggleStatus}
                  disabled={isSaving}
                  size="sm"
                  className={`h-7 sm:h-8 text-[11px] sm:text-xs gap-1.5 flex-shrink-0 rounded-md ${
                    projectStatus === "final"
                      ? "bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  } text-white transition-colors`}
                  data-save-project
                  title={
                    projectStatus === "final"
                      ? "Kliknij aby odblokować edycję"
                      : "Kliknij aby zablokować i umożliwić eksport"
                  }
                >
                  {isSaving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : projectStatus === "final" ? (
                    <CheckCircle className="h-3.5 w-3.5" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  {projectStatus === "final" ? "🔒 Zapisany" : "Zapisz"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
