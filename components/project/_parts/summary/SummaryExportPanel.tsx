"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Download, FileSpreadsheet, Lock } from "lucide-react";
import { UnlockPdfButton } from "@/components/billing/unlock-pdf-button";
import { StartTrialButton } from "@/components/billing/start-trial-button";
import { TrialStatusBadge } from "@/components/billing/trial-status-badge";
import { hasUsedTrial, isTrialActive, TRIAL_DURATION_DAYS } from "@/lib/auth/entitlements";
import { PAY_PER_EXPORT_ENABLED } from "@/lib/config/tier-limits";
import { useToast } from "@/hooks/use-toast";
import { useKnrMultiplier } from "@/hooks/useKnrMultiplier";
import { HintTooltip } from "@/components/ui/hint-tooltip";
import { HINTS } from "@/lib/hints/hint-content";
import { updateProjectPdfNotes } from "@/app/dashboard/projects/[id]/_actions/project-meta";
import { joinOfferNotes, type OfferTerms } from "@/lib/offer-terms";
import { OfferTermsFields } from "@/components/project/offer-terms-fields";
import { ShoppingListDialog } from "@/components/project/shopping-list-dialog";
import { OfferStatusLine } from "@/components/project/offer-status-line";
import type { ProjectWithRelations, ProjectItem, Profile } from "@/lib/types/database";

interface SummaryExportPanelProps {
  project: ProjectWithRelations;
  items: ProjectItem[];
  profile?: Profile | null;
  isPro: boolean;
  grandTotal: number;
  pdfNotes: string;
  onPdfNotesChange?: (notes: string) => void;
  offerTerms: OfferTerms;
  onOfferTermsChange: (terms: OfferTerms) => void;
  onDownloadPDF?: () => Promise<void>;
  isDownloading: boolean;
  pricesAreBrutto?: boolean;
  onPdfNotesSaved?: (notes: string) => void;
}

export function SummaryExportPanel({
  project,
  items,
  profile,
  isPro,
  grandTotal,
  pdfNotes,
  onPdfNotesChange,
  offerTerms,
  onOfferTermsChange,
  onDownloadPDF,
  isDownloading,
  pricesAreBrutto,
  onPdfNotesSaved,
}: SummaryExportPanelProps) {
  const { toast } = useToast();
  const { multiplier: knrMultiplier } = useKnrMultiplier();
  const handleSavePdfNotes = async () => {
    const result = await updateProjectPdfNotes(project.id, joinOfferNotes(offerTerms, pdfNotes));
    if (result.error) {
      toast({ title: "Błąd", description: result.error, variant: "destructive" });
    } else {
      onPdfNotesSaved?.(pdfNotes);
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
      const result = exportProjectToExcel(
        { ...project, brutto_mode: pricesAreBrutto ?? project.brutto_mode },
        items,
        isPro,
        knrMultiplier,
      );
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
      <OfferStatusLine projectId={project.id} />
      <ShoppingListDialog
        projectId={project.id}
        items={items}
        materialsOwnedByCustomer={project.materials_owned_by_customer}
      />
      <div className="space-y-2">
        <OfferTermsFields
          idPrefix="desktop-offer"
          terms={offerTerms}
          onChange={onOfferTermsChange}
          onBlur={() => { void handleSavePdfNotes(); }}
          disabled={isDownloading}
        />
        <Label htmlFor="pdf-notes" className="text-sm font-medium">
          Uwagi do kosztorysu (opcjonalne)
        </Label>
        <Textarea
          id="pdf-notes"
          name="pdf-notes"
          placeholder="Np. Oferta ważna 14 dni. Cena nie zawiera robót przygotowawczych..."
          value={pdfNotes}
          onChange={(e) => onPdfNotesChange?.(e.target.value)}
          onBlur={() => { void handleSavePdfNotes(); }}
          className="bg-white dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400 min-h-[80px] text-sm"
          disabled={isDownloading}
        />
        <p className="text-xs text-muted-foreground">Tekst pojawi się na końcu dokumentu PDF. Zapisuje się po wyjściu z pola.</p>
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
        <div className="relative w-full">
          <div className="flex w-full rounded-lg overflow-hidden shadow-lg border-2 border-red-400/50">
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
