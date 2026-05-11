"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BlurredPrice } from "@/components/ui/blurred-price";
import { getEffectiveIsPro } from "@/lib/auth/entitlements";
import { PriceAdjuster } from "@/components/project/price-adjuster";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Calculator,
  Download,
  FileSpreadsheet,
  ChevronUp,
  ChevronDown,
  Lock,
  LayoutGrid,
} from "lucide-react";
import { toggleMaterialsOwnedByCustomer } from "@/app/dashboard/projects/[id]/actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { notifyDataChanged } from "@/hooks/use-synced-action";
import { useKnrMultiplier } from "@/hooks/useKnrMultiplier";
import type { ProjectItem, ProjectWithRelations, Profile } from "@/lib/types/database";
import { ProfitabilityReportDialog } from "@/components/project/profitability-report-dialog";
import { ShareOfferDialog } from "@/components/project/share-offer-dialog";

interface MobileSummaryBarProps {
  project: ProjectWithRelations;
  items: ProjectItem[];
  profile?: Profile | null;
  onDownloadPDF?: () => Promise<void>;
  isDownloading?: boolean;
  pdfNotes?: string;
  onPdfNotesChange?: (notes: string) => void;
}

export function MobileSummaryBar({
  project,
  items,
  profile,
  onDownloadPDF,
  isDownloading = false,
  pdfNotes = "",
  onPdfNotesChange,
}: MobileSummaryBarProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const isPro = getEffectiveIsPro(profile);
  const { multiplier: knrMultiplier } = useKnrMultiplier();
  const isFinal = project.status === "final";
  const vatRate = project.vat_rate;
  const materialsOwnedByCustomer = project.materials_owned_by_customer;
  const regionName = project.regions?.name || "Brak";
  const regionModifier = project.regions?.price_modifier || 1.0;

  // Calculate totals
  let baseMaterialTotal = 0;
  let baseLaborTotal = 0;
  items.forEach((item) => {
    const matPrice = item.final_material_price ?? item.material_price ?? 0;
    const labPrice = item.final_labor_price ?? item.labor_price ?? 0;
    if (!materialsOwnedByCustomer) baseMaterialTotal += matPrice * item.quantity;
    baseLaborTotal += labPrice * item.quantity;
  });
  const adj = 1 + (project.adjustment_percentage || 0) / 100;
  const materialTotal = baseMaterialTotal * adj;
  const laborTotal = baseLaborTotal * knrMultiplier * adj;
  const subtotal = materialTotal + laborTotal;
  const vatAmount = (subtotal * vatRate) / 100;
  const grandTotal = subtotal + vatAmount;

  const handleToggleMaterials = async (enabled: boolean) => {
    const result = await toggleMaterialsOwnedByCustomer(project.id, enabled);
    if (result?.error) {
      toast({ title: "Błąd", description: result.error, variant: "destructive" });
    } else {
      notifyDataChanged("materials-toggle");
      router.refresh();
    }
  };

  const handleExportPDF = async () => {
    if (!isFinal) {
      toast({ title: "📋 Najpierw zapisz projekt", description: "Kliknij 'Zapisz finalny', aby wygenerować PDF", variant: "destructive" });
      return;
    }
    if (onDownloadPDF) await onDownloadPDF();
  };

  const handleExportExcel = async () => {
    if (!isFinal) {
      toast({ title: "📋 Najpierw zapisz projekt", description: "Kliknij 'Zapisz finalny', aby eksportować do Excel", variant: "destructive" });
      return;
    }
    try {
      const { exportProjectToExcel } = await import("@/lib/utils/excel-export");
      const result = exportProjectToExcel(project, items, isPro, knrMultiplier);

      // Save copy to project storage for client portal
      if (result?.buffer) {
        try {
          const base64 = btoa(String.fromCharCode(...new Uint8Array(result.buffer)));
          const { saveGeneratedDocumentToProject } = await import("@/app/dashboard/projects/[id]/document-actions");
          await saveGeneratedDocumentToProject(project.id, base64, result.storageName, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        } catch { /* non-critical */ }
      }

      toast({ title: "Sukces!", description: "Wyeksportowano do Excel" });
    } catch {
      toast({ title: "Błąd", description: "Nie udało się wyeksportować", variant: "destructive" });
    }
  };

  // Section breakdown
  const [showSections, setShowSections] = useState(false);
  const sectionBreakdown = (() => {
    const sections = new Map<string, number>();
    const parentIds = new Set(items.filter(i => i.is_assembly_child).map(i => i.parent_assembly_id).filter(Boolean));
    items.forEach(item => {
      if (item.is_assembly_child) return;
      const sec = item.section || "Inne";
      const prev = sections.get(sec) || 0;
      if (parentIds.has(item.id)) {
        const children = items.filter(c => c.parent_assembly_id === item.id);
        const childSum = children.reduce((acc, c) => {
          const cMat = materialsOwnedByCustomer ? 0 : (c.final_material_price ?? c.material_price ?? 0) * c.quantity;
          const cLab = (c.final_labor_price ?? c.labor_price ?? 0) * c.quantity * knrMultiplier;
          return acc + (cMat + cLab);
        }, 0);
        sections.set(sec, prev + childSum * adj);
      } else {
        const mat = materialsOwnedByCustomer ? 0 : (item.final_material_price ?? item.material_price ?? 0) * item.quantity;
        const lab = (item.final_labor_price ?? item.labor_price ?? 0) * item.quantity * knrMultiplier;
        sections.set(sec, prev + (mat + lab) * adj);
      }
    });
    return Array.from(sections.entries()).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total);
  })();
  const hasSections = sectionBreakdown.length > 1 || (sectionBreakdown.length === 1 && sectionBreakdown[0].name !== "Inne");

  return (
    <div className="fixed bottom-16 left-0 right-0 z-40 lg:hidden">
      {/* Collapsed bar - always visible */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button className="w-full bg-gradient-to-r from-blue-50 via-white to-blue-50 dark:from-blue-950/30 dark:via-slate-900 dark:to-blue-950/30 border-t-2 border-blue-400 dark:border-blue-600 shadow-[0_-4px_16px_rgba(59,130,246,0.15)] dark:shadow-[0_-4px_16px_rgba(59,130,246,0.2)] px-4 py-2.5 flex items-center justify-between active:bg-blue-50 dark:active:bg-slate-800 transition-colors animate-[summaryPulse_2.5s_ease-in-out_infinite]">
            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes summaryPulse {
                0%, 100% { box-shadow: 0 -4px 16px rgba(59,130,246,0.15); border-color: rgb(96,165,250); }
                50% { box-shadow: 0 -4px 24px rgba(59,130,246,0.35); border-color: rgb(37,99,235); }
              }
            `}} />
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-blue-500 dark:bg-blue-600 animate-pulse">
                <Calculator className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <p className="text-[10px] text-muted-foreground leading-none mb-0.5">{isPro ? "Suma brutto" : "Suma brutto (Tryb Demo)"}</p>
                <p className="text-xl font-extrabold text-blue-600 dark:text-blue-400 leading-none tracking-tight">
                  <BlurredPrice value={grandTotal} isPro={isPro} />
                </p>
                {!isPro && (
                  <p className="text-[9px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5 leading-none">🔒 Zupgraduj aby odblokować</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isFinal && (
                <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-600 dark:text-amber-400">
                  🔒
                </Badge>
              )}
              <Badge variant="outline" className="text-[10px]">
                {items.length} poz.
              </Badge>
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            </div>
          </button>
        </SheetTrigger>

        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader className="pb-3">
            <SheetTitle className="flex items-center gap-2 text-base">
              <Calculator className="w-5 h-5" />
              Podsumowanie
            </SheetTitle>
            <SheetDescription className="sr-only">
              Podsumowanie kosztorysu projektu wraz z opcjami eksportu.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4">
            {/* Region */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm flex items-center justify-between">
              <span className="text-blue-700 dark:text-blue-300 font-medium">{regionName}</span>
              <Badge variant="outline" className="text-xs">×{regionModifier.toFixed(2)}</Badge>
            </div>

            {/* Materials toggle */}
            <div
              className={`rounded-lg border p-3 flex items-center justify-between ${
                materialsOwnedByCustomer
                  ? "bg-green-50/50 dark:bg-green-950/20 border-green-300 dark:border-green-700"
                  : "bg-red-50/50 dark:bg-red-950/20 border-red-300 dark:border-red-700"
              } ${isFinal ? "cursor-not-allowed opacity-70" : ""}`}
              onClick={() => {
                if (isFinal) {
                  toast({
                    title: "🔒 Projekt zablokowany",
                    description: "Odblokuj projekt, aby zmienić ustawienia materiałów",
                    variant: "destructive",
                  });
                }
              }}
            >
              <Label htmlFor="summary-mobile-materials-toggle" className="text-sm font-medium cursor-pointer">
                {materialsOwnedByCustomer ? "Tylko Robocizna" : "Robocizna + Materia\u0142y"}
              </Label>
              <Switch
                id="summary-mobile-materials-toggle"
                name="summary-mobile-materials-toggle"
                checked={materialsOwnedByCustomer}
                onCheckedChange={isFinal ? undefined : handleToggleMaterials}
                className={`scale-90${isFinal ? " pointer-events-none opacity-50" : ""}`}
              />
            </div>

            {/* Price adjuster */}
            <PriceAdjuster
              projectId={project.id}
              basePrice={subtotal + (subtotal * vatRate / 100)}
              initialAdjustment={project.adjustment_percentage || 0}
              isPro={isPro}
              disabled={isFinal}
              instanceId="mobile"
            />

            <Separator />

            {/* Price breakdown */}
            {!isPro && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-800 rounded-lg p-3 flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <p className="text-xs text-amber-800 dark:text-amber-200">Tryb Demo — upgrade do PRO aby zobaczyć ceny</p>
              </div>
            )}

            <div className="space-y-2">
              {!materialsOwnedByCustomer && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Materiały</span>
                  <span className="font-medium"><BlurredPrice value={materialTotal} isPro={isPro} /></span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Robocizna</span>
                <span className="font-medium"><BlurredPrice value={laborTotal} isPro={isPro} /></span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Netto</span>
                <span className="font-semibold"><BlurredPrice value={subtotal} isPro={isPro} /></span>
              </div>
              {hasSections && (
                <div className="pt-1">
                  <button
                    onClick={() => setShowSections(!showSections)}
                    className="flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 w-full"
                  >
                    <LayoutGrid className="w-3 h-3" />
                    <span className="font-medium">Wg pomieszczeń</span>
                    {showSections ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
                  </button>
                  {showSections && (
                    <div className="mt-1.5 space-y-1 pl-1 border-l-2 border-purple-200 dark:border-purple-800">
                      {sectionBreakdown.map((sec) => (
                        <div key={sec.name} className="flex justify-between items-center pl-2">
                          <span className="text-[11px] text-purple-700 dark:text-purple-300 truncate max-w-[120px]">{sec.name}</span>
                          <span className="text-[11px] font-medium text-purple-800 dark:text-purple-200">
                            <BlurredPrice value={sec.total} isPro={isPro} />
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">VAT ({vatRate}%)</span>
                <span className="font-medium"><BlurredPrice value={vatAmount} isPro={isPro} /></span>
              </div>
              <Separator />
              <div className="flex justify-between items-center pt-1">
                <span className="font-bold">Suma brutto</span>
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  <BlurredPrice value={grandTotal} isPro={isPro} className="text-xl" />
                </span>
              </div>
            </div>

            {/* PDF Notes */}
            <div className="space-y-2">
              <Label htmlFor="summary-mobile-remarks" className="text-sm">Uwagi do kosztorysu</Label>
              <Textarea
                id="summary-mobile-remarks"
                name="summary-mobile-remarks"
                placeholder="Np. Oferta ważna 14 dni..."
                value={pdfNotes}
                onChange={(e) => onPdfNotesChange?.(e.target.value)}
                className="min-h-[60px] text-sm"
                disabled={isDownloading}
              />
            </div>

            {/* Portal klienta */}
            <div className={isFinal ? "relative pb-1" : "pb-1"}>
              {isFinal && (
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 rounded-xl opacity-60 blur-sm animate-pulse" />
              )}
              <div className="relative [&_button]:w-full [&_button]:h-10 [&_button]:text-sm">
                <ShareOfferDialog
                  projectId={project.id}
                  projectName={project.name}
                  clientName={project.client_name}
                  disabled={!isFinal}
                  projectTotal={grandTotal}
                />
              </div>
            </div>

            {/* Profitability */}
            <div className="pb-1">
              <ProfitabilityReportDialog projectId={project.id} projectName={project.name} isPro={isPro} />
            </div>

            {/* Export buttons */}
            <div className="grid grid-cols-2 gap-2 pb-4">
              <Button
                onClick={handleExportPDF}
                disabled={isDownloading || !isFinal}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg"
                size="lg"
              >
                <Download className="w-4 h-4 mr-1.5" />
                {isDownloading ? "..." : "PDF"}
              </Button>
              <Button
                onClick={handleExportExcel}
                disabled={isDownloading || !isFinal}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg"
                size="lg"
              >
                <FileSpreadsheet className="w-4 h-4 mr-1.5" />
                Excel
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
