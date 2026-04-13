"use client";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PriceAdjuster } from "@/components/project/price-adjuster";
import { NarzutyPanel } from "@/components/project/narzuty-panel";
import { toggleMaterialsOwnedByCustomer } from "@/app/dashboard/projects/[id]/actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { notifyDataChanged } from "@/hooks/use-synced-action";
import { useKnrMultiplier } from "@/hooks/useKnrMultiplier";
import { Calculator, CheckCircle, AlertTriangle, Sparkles, TrendingUp, Percent, ChevronDown } from "lucide-react";
import { HintTooltip } from "@/components/ui/hint-tooltip";
import { HINTS } from "@/lib/hints/hint-content";
import { cn } from "@/lib/utils";
import type { ProjectItem, ProjectWithRelations, Profile } from "@/lib/types/database";
import { calcNarzuty } from "@/lib/pricing-calculations";
import { SummaryFinancialTotals } from "./_parts/summary/SummaryFinancialTotals";
import { SummaryExportPanel } from "./_parts/summary/SummaryExportPanel";

interface RegionItem {
  id: string;
  name: string;
  price_modifier: number;
}

interface ProjectSummaryProps {
  project: ProjectWithRelations;
  items: ProjectItem[];
  profile?: Profile | null;
  colorMode?: boolean;
  bruttoMode?: boolean;
  onDownloadPDF?: () => Promise<void>;
  isDownloading?: boolean;
  pdfNotes?: string;
  onPdfNotesChange?: (notes: string) => void;
  projectStatus?: string;
  /** Live region UUID from useProjectPricing — keeps regionModifier in sync without full page refresh */
  liveRegionId?: string;
  /** Full regions list for live regionModifier lookup */
  regions?: RegionItem[];
}

export function ProjectSummary({
  project,
  items,
  profile,
  colorMode = true,
  bruttoMode = false,
  onDownloadPDF,
  isDownloading = false,
  pdfNotes = "",
  onPdfNotesChange,
  projectStatus = "draft",
  liveRegionId,
  regions,
}: ProjectSummaryProps) {
  const { toast } = useToast();
  const router = useRouter();
  const projectId = project.id;
  const vatRate = project.vat_rate;
  const materialsOwnedByCustomer = project.materials_owned_by_customer;
  // Prefer live region lookup (updates instantly on cross-tab sync / BroadcastChannel)
  const effectiveRegionId = liveRegionId ?? project.region_id;
  const liveRegionData = regions?.find(r => r.id === effectiveRegionId);
  const regionModifier = liveRegionData?.price_modifier ?? project.regions?.price_modifier ?? 1.0;
  const regionName = liveRegionData?.name ?? project.regions?.name ?? "Brak regionu";
  const isPro = profile?.is_pro || project.is_demo_project === true;
  const isFinal = projectStatus === "final";

  const { multiplier: knrMultiplier } = useKnrMultiplier();

  // Calculate totals - use real prices from database
  const calculateTotals = useMemo(() => () => {
    let rawMaterialBase = 0; // pure base netto, no region, no adj
    let rawLaborBase = 0;    // pure base netto, no region, no adj
    let baseMaterialTotal = 0; // with region modifier
    let baseLaborTotal = 0;    // with region modifier
    let rawEquipmentBase = 0;  // equipment (S) total

    const matMarkupMult   = 1 + (project.mat_markup_pct  || 0) / 100;
    const labMarkupMult   = 1 + (project.lab_markup_pct  || 0) / 100;
    const contingencyPct  = project.contingency_pct   || 0;

    items.forEach((item) => {
      const effectiveMaterialPrice = item.final_material_price ?? item.material_price ?? 0;
      const effectiveLaborPrice = item.final_labor_price ?? item.labor_price ?? 0;
      const isManual = item.confidence_level === "manual";
      const effectiveRegion = isManual ? 1.0 : regionModifier;

      if (!materialsOwnedByCustomer) {
        rawMaterialBase += effectiveMaterialPrice * item.quantity;
        baseMaterialTotal += effectiveMaterialPrice * item.quantity * matMarkupMult;
      }
      rawLaborBase += effectiveLaborPrice * item.quantity;
      baseLaborTotal += effectiveLaborPrice * item.quantity * effectiveRegion * labMarkupMult * knrMultiplier;
      rawEquipmentBase += (item.equipment_price ?? 0) * item.quantity;
    });

    const sumaBazowaNetto = rawMaterialBase + rawLaborBase;
    const baseSubtotalWithRegion = baseMaterialTotal + baseLaborTotal;
    const regionalCorrectionAmount = baseSubtotalWithRegion - sumaBazowaNetto;

    const baseSubtotal = baseSubtotalWithRegion;
    const adjustmentMultiplier = 1 + (project.adjustment_percentage || 0) / 100;
    const materialTotal = baseMaterialTotal * adjustmentMultiplier;
    const laborTotal = baseLaborTotal * adjustmentMultiplier;
    const subtotal = baseSubtotal * adjustmentMultiplier;

    const { kpAmount, zAmount, kzAmount, totalNarzuty } = calcNarzuty(laborTotal, materialTotal, {
      kpPercent: project.kp_percent || 0,
      zPercent: project.z_percent || 0,
      kzPercent: project.kz_percent || 0,
    });

    const subtotalWithNarzuty = subtotal + totalNarzuty;

    // v3.0: Rezerwa budżetowa PRZED VAT
    const contingencyAmount = subtotalWithNarzuty * contingencyPct / 100;
    const subtotalWithContingency = subtotalWithNarzuty + contingencyAmount;

    // VAT Iron Rule: applied to subtotalWithContingency
    const vatAmount = (subtotalWithContingency * vatRate) / 100;
    const grandTotal = subtotalWithContingency + vatAmount;

    return {
      materialTotal, laborTotal, baseSubtotal, subtotal,
      kpAmount, zAmount, kzAmount, totalNarzuty,
      subtotalWithNarzuty, contingencyAmount, subtotalWithContingency,
      vatAmount, grandTotal,
      adjustmentAmount: subtotal - baseSubtotal,
      sumaBazowaNetto,
      regionalCorrectionAmount,
      regionModifier,
      regionName,
      equipmentTotal: rawEquipmentBase,
    };
  }, [items, project, regionModifier, materialsOwnedByCustomer, vatRate, knrMultiplier]);

  const totals = calculateTotals();

  const sectionBreakdown = useMemo(() => {
    const sections = new Map<string, { mat: number; lab: number; count: number }>();
    const parentIds = new Set(items.filter(i => i.is_assembly_child).map(i => i.parent_assembly_id).filter(Boolean));
    const adjustmentMultiplier = 1 + (project.adjustment_percentage || 0) / 100;

    items.forEach(item => {
      if (item.is_assembly_child) return;
      const sec = item.section || "Inne pozycje";
      const prev = sections.get(sec) || { mat: 0, lab: 0, count: 0 };

      if (parentIds.has(item.id)) {
        const children = items.filter(c => c.parent_assembly_id === item.id);
        children.forEach(c => {
          const isChildManual = c.confidence_level === "manual";
          const effRegion = isChildManual ? 1.0 : regionModifier;
          const cMat = materialsOwnedByCustomer ? 0 : (c.final_material_price ?? c.material_price ?? 0) * c.quantity * adjustmentMultiplier;
          const cLab = (c.final_labor_price ?? c.labor_price ?? 0) * c.quantity * adjustmentMultiplier * effRegion * knrMultiplier;
          prev.mat += cMat;
          prev.lab += cLab;
        });
      } else {
        const isManual = item.confidence_level === "manual";
        const effRegion = isManual ? 1.0 : regionModifier;
        const mat = materialsOwnedByCustomer ? 0 : (item.final_material_price ?? item.material_price ?? 0) * item.quantity * adjustmentMultiplier;
        const lab = (item.final_labor_price ?? item.labor_price ?? 0) * item.quantity * adjustmentMultiplier * effRegion * knrMultiplier;
        prev.mat += mat;
        prev.lab += lab;
      }
      prev.count++;
      sections.set(sec, prev);
    });

    return Array.from(sections.entries())
      .map(([name, data]) => ({ name, ...data, total: data.mat + data.lab }))
      .sort((a, b) => b.total - a.total);
  }, [items, project, regionModifier, materialsOwnedByCustomer, knrMultiplier]);

  const handleToggleMaterials = async (enabled: boolean) => {
    const result = await toggleMaterialsOwnedByCustomer(projectId, enabled);
    if (result?.error) {
      toast({ title: "Błąd", description: result.error, variant: "destructive" });
    } else {
      toast({
        title: enabled ? "Tryb: Tylko Robocizna" : "Tryb: Robocizna + Materiały",
        description: enabled ? "Materiały = 0,00 zł · Brain nieaktywny" : "Brain aktywny · Sugestie materiałów dostępne",
      });
      notifyDataChanged("materials-toggle");
      router.refresh();
    }
  };

  const [narzutyOpen, setNarzutyOpen] = useState(false);

  return (
    <Card className="h-full lg:sticky lg:top-20 rounded-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Podsumowanie
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Materials Responsibility Toggle */}
        <div
          className={`rounded-lg border transition-colors ${
            !materialsOwnedByCustomer
              ? "bg-orange-50/50 dark:bg-orange-950/20 border-orange-300 dark:border-orange-700"
              : "bg-green-50/50 dark:bg-green-950/20 border-green-300 dark:border-green-700"
          } ${isFinal ? "cursor-not-allowed opacity-70" : ""}`}
          onClick={() => {
            if (isFinal) {
              toast({ title: "🔒 Projekt zablokowany", description: "Odblokuj projekt, aby zmienić ustawienia materiałów", variant: "destructive" });
            }
          }}
        >
          <div className="px-3 py-2.5 flex items-center justify-between gap-3">
            <Label htmlFor="summary-materials-toggle" className="flex items-center gap-2 min-w-0 cursor-pointer">
              <span className={`text-xs font-medium ${!materialsOwnedByCustomer ? "text-orange-700 dark:text-orange-300" : "text-green-700 dark:text-green-300"}`}>
                {!materialsOwnedByCustomer ? "Robocizna + Materiały" : "Tylko Robocizna"}
              </span>
              <span className="text-[10px] text-slate-400">
                {!materialsOwnedByCustomer ? "· Brain aktywny" : "· materiały = 0,00 zł"}
              </span>
            </Label>
            <Switch
              id="summary-materials-toggle"
              name="summary-materials-toggle"
              checked={materialsOwnedByCustomer}
              onCheckedChange={isFinal ? undefined : handleToggleMaterials}
              className={`scale-75 flex-shrink-0${isFinal ? " pointer-events-none opacity-50" : ""}`}
            />
          </div>
        </div>

        <Separator />

        <SummaryFinancialTotals
          totals={totals}
          isPro={isPro}
          vatRate={vatRate}
          bruttoMode={bruttoMode}
          materialsOwnedByCustomer={materialsOwnedByCustomer}
          sectionBreakdown={sectionBreakdown}
          projectId={projectId}
          equipmentTotal={totals.equipmentTotal}
        />

        {/* Narzuty (Kp + Z + Kz + v3 marże) — collapsible */}
        <Collapsible open={narzutyOpen} onOpenChange={setNarzutyOpen}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left transition-colors",
                (project.kp_percent || 0) > 0 || (project.z_percent || 0) > 0 || (project.kz_percent || 0) > 0
                  ? "border-indigo-200 bg-indigo-50/50 dark:border-indigo-800 dark:bg-indigo-950/10"
                  : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/30",
              )}
            >
              <span className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                <Percent className="w-3.5 h-3.5" />
                Narzuty i Marże
                <HintTooltip content={HINTS.narzutyMarze} side="top" iconOnly />
              </span>
              <span className="flex items-center gap-1.5">
                {((project.kp_percent || 0) > 0 || (project.z_percent || 0) > 0 || (project.kz_percent || 0) > 0) && (
                  <Badge className="text-[9px] px-1 py-0 bg-indigo-500 text-white">aktywne</Badge>
                )}
                <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform", narzutyOpen && "rotate-180")} />
              </span>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-1.5 px-1 pb-1">
              <NarzutyPanel
                projectId={projectId}
                laborTotal={totals.laborTotal}
                materialTotal={totals.materialTotal}
                initialKp={project.kp_percent || 0}
                initialZ={project.z_percent || 0}
                initialKz={project.kz_percent || 0}
                isPro={isPro}
                disabled={isFinal}
                hideHeader
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {(() => {
          const adjMult = 1 + (project.adjustment_percentage || 0) / 100;
          const nettoBase  = (totals.subtotalWithContingency ?? totals.subtotalWithNarzuty) / (adjMult || 1);
          const bruttoBase = totals.grandTotal / (adjMult || 1);
          return (
            <PriceAdjuster
              projectId={projectId}
              basePrice={bruttoMode ? bruttoBase : nettoBase}
              bruttoMode={bruttoMode}
              initialAdjustment={project.adjustment_percentage || 0}
              isPro={isPro}
              disabled={isFinal}
              instanceId="desktop"
            />
          );
        })()}

        <SummaryExportPanel
          project={project}
          items={items}
          profile={profile}
          isPro={isPro}
          isFinal={isFinal}
          grandTotal={totals.grandTotal}
          pdfNotes={pdfNotes}
          onPdfNotesChange={onPdfNotesChange}
          onDownloadPDF={onDownloadPDF}
          isDownloading={isDownloading}
        />
      </CardContent>
    </Card>
  );
}