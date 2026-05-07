"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Download, FileSpreadsheet, Save, Check, Lock } from "lucide-react";
import { ShareOfferDialog } from "@/components/project/share-offer-dialog";
import { DocumentationDialog } from "@/components/project/project-documentation-tab";
import { UnlockPdfButton } from "@/components/billing/unlock-pdf-button";
import { StartTrialButton } from "@/components/billing/start-trial-button";
import { TrialStatusBadge } from "@/components/billing/trial-status-badge";
import { hasUsedTrial, isTrialActive, TRIAL_DURATION_DAYS } from "@/lib/auth/entitlements";
import { PAY_PER_EXPORT_ENABLED } from "@/lib/config/tier-limits";
import { useState as useLocalState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useKnrMultiplier } from "@/hooks/useKnrMultiplier";
import { HintTooltip } from "@/components/ui/hint-tooltip";
import { HINTS } from "@/lib/hints/hint-content";
import { updateProjectPdfNotes } from "@/app/dashboard/projects/[id]/_actions/project-meta";
import type { ProjectWithRelations, ProjectItem, Profile } from "@/lib/types/database";

interface SummaryExportPanelProps {
  project: ProjectWithRelations;
  items: ProjectItem[];
  profile?: Profile | null;
  isPro: boolean;
  isFinal: boolean;
  grandTotal: number;
  pdfNotes: string;
  onPdfNotesChange?: (notes: string) => void;
  onDownloadPDF?: () => Promise<void>;
  isDownloading: boolean;
  onPdfNotesSaved?: (notes: string) => void;
}

export function SummaryExportPanel({
  project,
  items,
  profile,
  isPro,
  isFinal,
  grandTotal,
  pdfNotes,
  onPdfNotesChange,
  onDownloadPDF,
  isDownloading,
  onPdfNotesSaved,
}: SummaryExportPanelProps) {
  const { toast } = useToast();
  const { multiplier: knrMultiplier } = useKnrMultiplier();
  const [isSavingNotes, setIsSavingNotes] = useLocalState(false);
  const [notesSaved, setNotesSaved] = useLocalState(false);

  const handleSavePdfNotes = async () => {
    setIsSavingNotes(true);
    const result = await updateProjectPdfNotes(project.id, pdfNotes);
    setIsSavingNotes(false);
    if (result.error) {
      toast({ title: "Błąd", description: result.error, variant: "destructive" });
    } else {
      setNotesSaved(true);
      onPdfNotesSaved?.(pdfNotes);
      toast({ title: "✅ Zapisano", description: "Uwagi zostały zapisane" });
      setTimeout(() => setNotesSaved(false), 2000);
    }
  };

  const handleExportPDF = async () => {
    if (onDownloadPDF) {
      await onDownloadPDF();
    } else {
      toast({ title: "Błąd", description: "Generator PDF nie jest skonfigurowany", variant: "destructive" });
    }
  };

  const handleExportExcel = async () => {
    try {
      const { exportProjectToExcel } = await import("@/lib/utils/excel-export");
      const result = exportProjectToExcel(project, items, isPro, knrMultiplier);
      if (result?.buffer) {
        try {
          const base64 = btoa(String.fromCharCode(...new Uint8Array(result.buffer)));
          const { saveGeneratedDocumentToProject } = await import("@/app/dashboard/projects/[id]/document-actions");
          await saveGeneratedDocumentToProject(
            project.id, base64, result.storageName,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          );
        } catch {
          // Storage save is non-critical
        }
      }
      toast({ title: "Sukces!", description: "Projekt wyeksportowany do Excel" });
    } catch {
      toast({ title: "Błąd", description: "Wystąpił błąd podczas eksportu do Excel", variant: "destructive" });
    }
  };

  return (
    <>
      {/* PDF Notes */}
      <Separator />
      <div className="space-y-2">
        <Label htmlFor="pdf-notes" className="text-sm font-medium">
          Uwagi do kosztorysu (opcjonalne)
        </Label>
        <Textarea
          id="pdf-notes"
          name="pdf-notes"
          placeholder="Np. Oferta ważna 14 dni. Cena nie zawiera robót przygotowawczych..."
          value={pdfNotes}
          onChange={(e) => onPdfNotesChange?.(e.target.value)}
          className="bg-white dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400 min-h-[80px] text-sm"
          disabled={isDownloading}
        />
        <p className="text-xs text-muted-foreground">Tekst pojawi się na końcu dokumentu PDF</p>
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleSavePdfNotes}
            disabled={isSavingNotes}
            className="h-7 px-3 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white border-0"
          >
            {notesSaved ? (
              <><Check className="h-3.5 w-3.5 text-green-500" /><span className="text-green-600">Zapisano</span></>
            ) : isSavingNotes ? (
              <><span className="animate-spin text-xs">⏳</span><span>Zapisuję...</span></>
            ) : (
              <><Save className="h-3.5 w-3.5" /><span>Zapisz</span></>
            )}
          </Button>
        </div>
      </div>

      {/* Portal klienta */}
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Portal &amp; Dokumenty</span>
        <HintTooltip content={HINTS.portalKlienta} side="left" iconOnly />
      </div>
      <div
        className={`relative w-full transition-all duration-150 ${!isFinal ? "opacity-50 cursor-pointer active:scale-95 active:opacity-40" : "hover:brightness-110 hover:scale-[1.01]"}`}
        onClick={!isFinal ? () => toast({ title: "📋 Najpierw zapisz projekt", description: "Kliknij 'Zapisz', aby odblokować Portal klienta", variant: "destructive" }) : undefined}
      >
        {isFinal && (
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 rounded-xl opacity-60 blur-sm animate-pulse" />
        )}
        <div className={`relative [&>button]:w-full [&>button]:h-10 [&>button]:text-sm ${!isFinal ? "pointer-events-none" : ""}`}>
          <ShareOfferDialog
            projectId={project.id}
            projectName={project.name}
            clientName={project.client_name}
            disabled={!isFinal}
            projectTotal={grandTotal}
            userProfile={profile ? {
              full_name: profile.full_name || undefined,
              company_name: profile.company_name || undefined,
              phone: profile.phone || undefined,
              email: profile.email || undefined,
            } : undefined}
          />
        </div>
      </div>

      {/* Dokumentacja */}
      <div
        className={`relative w-full transition-all duration-150 ${!isFinal ? "opacity-50 cursor-pointer active:scale-95 active:opacity-40" : "hover:brightness-110 hover:scale-[1.01]"}`}
        onClick={!isFinal ? () => toast({ title: "📋 Najpierw zapisz projekt", description: "Kliknij 'Zapisz', aby odblokować Dokumentację", variant: "destructive" }) : undefined}
      >
        <div className={`[&>button]:w-full [&>button]:h-9 [&>button]:text-sm ${!isFinal ? "pointer-events-none" : ""}`}>
          <DocumentationDialog
            projectId={project.id}
            projectStatus={project.status as string}
            projectName={project.name}
            itemCount={items.length}
          />
        </div>
      </div>

      {/* Export buttons — v2.0: FREE tier może eksportować, PDF dostaje watermark DEMO */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Eksport</span>
          <div className="flex gap-1">
            <HintTooltip content={HINTS.pdfExport} side="left" iconOnly />
            <HintTooltip content={HINTS.excelExport} side="left" iconOnly />
          </div>
        </div>

        {/* v2.1: Trial status badge — visible during active 7-day trial */}
        {isTrialActive(profile ?? null) && (
          <div className="flex justify-end">
            <TrialStatusBadge profile={profile ?? null} />
          </div>
        )}

        {/* v2.1: FREE — banner Demo + Trial CTA + (optional) Pay-per-Export CTA */}
        {!isPro && !project.paid_export_unlocked_at && (
          <>
            <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <Lock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-blue-800 dark:text-blue-200 leading-tight">
                <span className="font-semibold">Tryb Demo:</span> PDF zostanie oznaczony znakiem wodnym „DEMO”.
                {PAY_PER_EXPORT_ENABLED
                  ? " Aby wysłać czysty PDF do klienta — aktywuj darmowy trial lub kup jednorazowy eksport."
                  : ` Aby wysłać czysty PDF do klienta — aktywuj darmowy ${TRIAL_DURATION_DAYS}-dniowy trial PRO.`}
              </p>
            </div>
            {/* Trial button — only shown to users who have NEVER started a trial */}
            {!hasUsedTrial(profile ?? null) && (
              <StartTrialButton />
            )}
            {/* Pay-per-Export CTA — hidden via feature flag during Stripe Tax + BLIK/P24 validation */}
            {PAY_PER_EXPORT_ENABLED && (
              <UnlockPdfButton projectId={project.id} />
            )}
          </>
        )}

        {/* v2.0: FREE — już opłacono jednorazowy eksport.
            Keep this rendering even when PAY_PER_EXPORT_ENABLED=false so that
            users who paid BEFORE we flipped the flag still see the confirmation. */}
        {!isPro && Boolean(project.paid_export_unlocked_at) && (
          <UnlockPdfButton projectId={project.id} alreadyUnlocked />
        )}

        {/* PDF + Excel buttons */}
        <div
          className={`relative w-full transition-all duration-150 ${!isFinal ? "opacity-50 cursor-pointer active:scale-95 active:opacity-40" : ""}`}
          onClick={!isFinal ? () => toast({ title: "📋 Najpierw zapisz projekt", description: "Kliknij 'Zapisz', aby odblokować eksport PDF i Excel", variant: "destructive" }) : undefined}
        >
          <div className={`flex w-full rounded-lg overflow-hidden shadow-lg border-2 border-red-400/50 ${!isFinal ? "pointer-events-none" : ""}`}>
            <button
              onClick={handleExportPDF}
              disabled={isDownloading}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 disabled:cursor-not-allowed"
              data-export-pdf
            >
              {isDownloading ? (
                <span className="animate-spin">⏳</span>
              ) : (
                <Download className="h-4 w-4 flex-shrink-0" />
              )}
              <span>PDF{!isPro && !project.paid_export_unlocked_at && " (Demo)"}</span>
            </button>
            <div className="w-px flex-shrink-0 bg-red-300/60" />
            <button
              onClick={handleExportExcel}
              disabled={isDownloading}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-500 disabled:cursor-not-allowed"
              data-export-excel
            >
              <FileSpreadsheet className="h-4 w-4 flex-shrink-0" />
              <span>Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="text-xs text-muted-foreground pt-2 border-t">
        <p className="mb-1">💡 Ceny są aktualizowane automatycznie</p>
        <p>Wszystkie wartości w PLN</p>
      </div>
    </>
  );
}
