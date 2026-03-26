"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  Loader2,
  AlertTriangle,
  AlertCircle,
  Info,
  Scan,
  Save,
  Check,
  Sparkles,
  CheckCheck,
  Package,
  Wrench,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { aiValidatePrices } from "./ai-actions";
import { updateMarketIntelligence } from "./actions";

interface PriceAnomaly {
  itemId: string;
  itemName: string;
  issue: string;
  severity: "critical" | "warning" | "info";
  suggestion: string;
  suggestedMaterialPrice: number | null;
  suggestedLaborPrice: number | null;
}

interface EditableAnomaly extends PriceAnomaly {
  editMaterialPrice: string;
  editLaborPrice: string;
  isSaving: boolean;
  isSaved: boolean;
}

export function AiValidateDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [editableAnomalies, setEditableAnomalies] = useState<EditableAnomaly[]>([]);
  const [scanned, setScanned] = useState(false);
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  const { toast } = useToast();

  const handleScan = async () => {
    setIsScanning(true);
    setEditableAnomalies([]);
    setScanned(false);

    const result = await aiValidatePrices();

    if (result.error) {
      toast({
        title: "Błąd",
        description: result.error,
        variant: "destructive",
      });
    } else {
      const editable: EditableAnomaly[] = result.anomalies.map((a) => ({
        ...a,
        editMaterialPrice: a.suggestedMaterialPrice?.toString() ?? "",
        editLaborPrice: a.suggestedLaborPrice?.toString() ?? "",
        isSaving: false,
        isSaved: false,
      }));
      setEditableAnomalies(editable);
      setScanned(true);

      if (result.anomalies.length === 0) {
        toast({
          title: "Wszystko OK!",
          description: "AI nie znalazło anomalii cenowych w katalogu",
        });
      } else {
        toast({
          title: `Znaleziono ${result.anomalies.length} anomalii`,
          description: "Sprawdź wyniki, edytuj ceny i zapisz zmiany",
        });
      }
    }

    setIsScanning(false);
  };

  const updateAnomaly = (index: number, updates: Partial<EditableAnomaly>) => {
    setEditableAnomalies((prev) =>
      prev.map((a, i) => (i === index ? { ...a, ...updates } : a))
    );
  };

  const handleApplySuggestion = (index: number) => {
    const anomaly = editableAnomalies[index];
    updateAnomaly(index, {
      editMaterialPrice:
        anomaly.suggestedMaterialPrice != null
          ? anomaly.suggestedMaterialPrice.toString()
          : anomaly.editMaterialPrice,
      editLaborPrice:
        anomaly.suggestedLaborPrice != null
          ? anomaly.suggestedLaborPrice.toString()
          : anomaly.editLaborPrice,
    });
  };

  const handleSaveSingle = async (index: number) => {
    const anomaly = editableAnomalies[index];
    const materialPrice = anomaly.editMaterialPrice ? parseFloat(anomaly.editMaterialPrice) : undefined;
    const laborPrice = anomaly.editLaborPrice ? parseFloat(anomaly.editLaborPrice) : undefined;

    if (materialPrice === undefined && laborPrice === undefined) {
      toast({
        title: "Brak zmian",
        description: "Wprowadź cenę materiału lub robocizny",
        variant: "destructive",
      });
      return;
    }

    updateAnomaly(index, { isSaving: true });

    const updateData: { base_material_price?: number; base_labor_price?: number } = {};
    if (materialPrice !== undefined && !isNaN(materialPrice)) {
      updateData.base_material_price = materialPrice;
    }
    if (laborPrice !== undefined && !isNaN(laborPrice)) {
      updateData.base_labor_price = laborPrice;
    }

    const result = await updateMarketIntelligence(anomaly.itemId, updateData);

    if (result.success) {
      updateAnomaly(index, { isSaving: false, isSaved: true });
    } else {
      updateAnomaly(index, { isSaving: false });
      toast({
        title: "Błąd",
        description: result.error || `Nie udało się zapisać: ${anomaly.itemName}`,
        variant: "destructive",
      });
    }
  };

  const handleBulkSave = async () => {
    const unsaved = editableAnomalies.filter(
      (a) => !a.isSaved && (a.editMaterialPrice || a.editLaborPrice)
    );

    if (unsaved.length === 0) {
      toast({
        title: "Brak zmian do zapisu",
        description: "Wszystkie pozycje są już zapisane lub nie mają ustawionych cen",
      });
      return;
    }

    setIsBulkSaving(true);
    let saved = 0;
    let failed = 0;

    for (let i = 0; i < editableAnomalies.length; i++) {
      const anomaly = editableAnomalies[i];
      if (anomaly.isSaved || (!anomaly.editMaterialPrice && !anomaly.editLaborPrice)) continue;

      updateAnomaly(i, { isSaving: true });

      const updateData: { base_material_price?: number; base_labor_price?: number } = {};
      if (anomaly.editMaterialPrice) {
        const val = parseFloat(anomaly.editMaterialPrice);
        if (!isNaN(val)) updateData.base_material_price = val;
      }
      if (anomaly.editLaborPrice) {
        const val = parseFloat(anomaly.editLaborPrice);
        if (!isNaN(val)) updateData.base_labor_price = val;
      }

      if (Object.keys(updateData).length === 0) {
        updateAnomaly(i, { isSaving: false });
        continue;
      }

      const result = await updateMarketIntelligence(anomaly.itemId, updateData);
      if (result.success) {
        saved++;
        updateAnomaly(i, { isSaving: false, isSaved: true });
      } else {
        failed++;
        updateAnomaly(i, { isSaving: false });
      }
    }

    setIsBulkSaving(false);

    toast({
      title: `Zapisano ${saved} z ${saved + failed} pozycji`,
      description: failed > 0 ? `${failed} pozycji nie udało się zapisać` : "Wszystkie ceny zostały zaktualizowane",
      variant: failed > 0 ? "destructive" : "default",
    });

    if (saved > 0) {
      router.refresh();
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20";
      case "warning":
        return "border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20";
      default:
        return "border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20";
    }
  };

  const criticalCount = editableAnomalies.filter((a) => a.severity === "critical").length;
  const warningCount = editableAnomalies.filter((a) => a.severity === "warning").length;
  const infoCount = editableAnomalies.filter((a) => a.severity === "info").length;
  const savedCount = editableAnomalies.filter((a) => a.isSaved).length;
  const hasSuggestions = editableAnomalies.some(
    (a) => a.suggestedMaterialPrice != null || a.suggestedLaborPrice != null
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-cyan-300 text-cyan-700 hover:bg-cyan-50 dark:border-cyan-700 dark:text-cyan-400 dark:hover:bg-cyan-950/30 text-xs sm:text-sm"
        >
          <ShieldCheck className="w-4 h-4" />
          <span className="hidden sm:inline">AI Walidator</span>
          <span className="sm:hidden">Waliduj</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[750px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-600" />
            AI Walidator Cen Katalogowych
          </DialogTitle>
          <DialogDescription>
            AI przeskanuje katalog globalny, znajdzie anomalie cenowe — a Ty możesz od razu edytować i zapisać poprawne ceny.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Button
            onClick={handleScan}
            disabled={isScanning}
            className="w-full gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                AI skanuje katalog...
              </>
            ) : (
              <>
                <Scan className="w-4 h-4" />
                {scanned ? "Skanuj ponownie" : "Rozpocznij skan AI"}
              </>
            )}
          </Button>

          {/* Results - no anomalies */}
          {scanned && editableAnomalies.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="font-semibold text-green-700 dark:text-green-400">
                Katalog wygląda dobrze!
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                AI nie znalazło anomalii cenowych w przeskanowanych pozycjach.
              </p>
            </div>
          )}

          {/* Results - with anomalies */}
          {editableAnomalies.length > 0 && (
            <div className="space-y-3">
              {/* Summary + Bulk Actions */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {criticalCount > 0 && (
                    <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {criticalCount} krytycznych
                    </Badge>
                  )}
                  {warningCount > 0 && (
                    <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {warningCount} ostrzeżeń
                    </Badge>
                  )}
                  {infoCount > 0 && (
                    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      <Info className="w-3 h-3 mr-1" />
                      {infoCount} informacyjnych
                    </Badge>
                  )}
                  {savedCount > 0 && (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      <Check className="w-3 h-3 mr-1" />
                      {savedCount} zapisanych
                    </Badge>
                  )}
                </div>
              </div>

              {/* Bulk action buttons */}
              <div className="flex gap-2 flex-wrap">
                {hasSuggestions && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400"
                    onClick={() => {
                      editableAnomalies.forEach((_, i) => handleApplySuggestion(i));
                    }}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Zastosuj wszystkie sugestie AI
                  </Button>
                )}
                <Button
                  size="sm"
                  className="gap-1.5 text-xs bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleBulkSave}
                  disabled={isBulkSaving || savedCount === editableAnomalies.length}
                >
                  {isBulkSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Zapisywanie...
                    </>
                  ) : (
                    <>
                      <CheckCheck className="w-3.5 h-3.5" />
                      Zapisz wszystkie zmiany
                    </>
                  )}
                </Button>
              </div>

              {/* Anomaly List with Inline Editing */}
              <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                {editableAnomalies.map((anomaly, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border transition-all ${
                      anomaly.isSaved
                        ? "border-green-300 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20 opacity-75"
                        : getSeverityColor(anomaly.severity)
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {anomaly.isSaved ? (
                        <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <span className="mt-0.5">{getSeverityIcon(anomaly.severity)}</span>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {anomaly.itemName}
                        </p>
                        <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
                          {anomaly.issue}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          <strong>Sugestia:</strong> {anomaly.suggestion}
                        </p>

                        {/* Inline Price Editor */}
                        {!anomaly.isSaved && (
                          <div className="mt-3 p-2.5 rounded-md bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="flex items-center gap-1 text-[10px] font-medium text-blue-700 dark:text-blue-400 mb-1">
                                  <Package className="w-3 h-3" />
                                  Materiał (zł)
                                </label>
                                <Input
                                  id={`anomaly-mat-${index}`}
                                  name={`anomaly-mat-${index}`}
                                  aria-label={`Cena materiału: ${anomaly.itemName}`}
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="Cena materiału"
                                  value={anomaly.editMaterialPrice}
                                  onChange={(e) =>
                                    updateAnomaly(index, { editMaterialPrice: e.target.value })
                                  }
                                  className="h-8 text-sm"
                                />
                                {anomaly.suggestedMaterialPrice != null && (
                                  <p className="text-[10px] text-blue-600 mt-0.5">
                                    Sugestia AI: {anomaly.suggestedMaterialPrice.toFixed(2)} zł
                                  </p>
                                )}
                              </div>
                              <div>
                                <label className="flex items-center gap-1 text-[10px] font-medium text-orange-700 dark:text-orange-400 mb-1">
                                  <Wrench className="w-3 h-3" />
                                  Robocizna (zł)
                                </label>
                                <Input
                                  id={`anomaly-lab-${index}`}
                                  name={`anomaly-lab-${index}`}
                                  aria-label={`Cena robocizny: ${anomaly.itemName}`}
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="Cena robocizny"
                                  value={anomaly.editLaborPrice}
                                  onChange={(e) =>
                                    updateAnomaly(index, { editLaborPrice: e.target.value })
                                  }
                                  className="h-8 text-sm"
                                />
                                {anomaly.suggestedLaborPrice != null && (
                                  <p className="text-[10px] text-orange-600 mt-0.5">
                                    Sugestia AI: {anomaly.suggestedLaborPrice.toFixed(2)} zł
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Row action buttons */}
                            <div className="flex items-center gap-2 mt-2.5">
                              {(anomaly.suggestedMaterialPrice != null ||
                                anomaly.suggestedLaborPrice != null) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-[11px] gap-1 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400"
                                  onClick={() => handleApplySuggestion(index)}
                                >
                                  <Sparkles className="w-3 h-3" />
                                  Zastosuj sugestię
                                </Button>
                              )}
                              <Button
                                size="sm"
                                className="h-7 text-[11px] gap-1 bg-green-600 hover:bg-green-700 text-white ml-auto"
                                onClick={() => handleSaveSingle(index)}
                                disabled={anomaly.isSaving}
                              >
                                {anomaly.isSaving ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <>
                                    <Save className="w-3 h-3" />
                                    Zapisz
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Saved confirmation */}
                        {anomaly.isSaved && (
                          <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-2 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Ceny zaktualizowane w katalogu globalnym
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
