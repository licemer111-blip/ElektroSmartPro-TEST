"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sparkles,
  Loader2,
  Package,
  Wrench,
  Check,
  AlertTriangle,
  Upload,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { aiGenerateCatalogItems, aiImportProcessedItems } from "./ai-actions";

export function AiGenerateDialog() {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [generatedItems, setGeneratedItems] = useState<
    Array<{
      name: string;
      category_name: string;
      unit: string;
      base_material_price: number;
      base_labor_price: number;
      ai_confidence: "high" | "medium" | "low";
      ai_note: string | null;
      selected: boolean;
    }>
  >([]);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!description.trim()) return;
    setIsGenerating(true);
    setGeneratedItems([]);

    const result = await aiGenerateCatalogItems(description.trim());

    if (result.error) {
      toast({
        title: "Błąd AI",
        description: result.error,
        variant: "destructive",
      });
    } else if (result.items.length === 0) {
      toast({
        title: "Brak wyników",
        description: "AI nie wygenerowało pozycji. Spróbuj inny opis.",
      });
    } else {
      setGeneratedItems(
        result.items.map((item) => ({ ...item, selected: true }))
      );
      toast({
        title: `Wygenerowano ${result.items.length} pozycji`,
        description: "Sprawdź i zatwierdź pozycje do importu",
      });
    }

    setIsGenerating(false);
  };

  const handleImport = async () => {
    const selected = generatedItems.filter((i) => i.selected);
    if (selected.length === 0) return;

    setIsImporting(true);
    const result = await aiImportProcessedItems(selected);

    if (result.imported > 0) {
      toast({
        title: `Zaimportowano ${result.imported} pozycji!`,
        description:
          result.skipped > 0
            ? `Pominięto ${result.skipped} (brak kategorii)`
            : "Wszystkie pozycje dodane do katalogu globalnego",
      });
      setOpen(false);
      setGeneratedItems([]);
      setDescription("");
      window.location.reload();
    } else {
      toast({
        title: "Błąd importu",
        description: result.errors[0] || "Nie udało się zaimportować",
        variant: "destructive",
      });
    }

    setIsImporting(false);
  };

  const toggleItem = (index: number) => {
    setGeneratedItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const toggleAll = () => {
    const allSelected = generatedItems.every((i) => i.selected);
    setGeneratedItems((prev) =>
      prev.map((item) => ({ ...item, selected: !allSelected }))
    );
  };

  const selectedCount = generatedItems.filter((i) => i.selected).length;

  const getConfidenceBadge = (level: string) => {
    switch (level) {
      case "high":
        return (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[9px]">
            Wysoka
          </Badge>
        );
      case "medium":
        return (
          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[9px]">
            Średnia
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-[9px]">
            Niska
          </Badge>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/30 text-xs sm:text-sm"
        >
          <Sparkles className="w-4 h-4" />
          <span className="hidden sm:inline">ES Generator</span>
          <span className="sm:hidden">ES</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-600" />
            ES Generator Pozycji Katalogowych
          </DialogTitle>
          <DialogDescription>
            Opisz, jakie pozycje chcesz wygenerować, a ES-Engine stworzy je z realistycznymi cenami rynkowymi.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Input */}
          <div className="space-y-2">
            <Label htmlFor="admin-generate-description">Opis pozycji do wygenerowania</Label>
            <Textarea
              id="admin-generate-description"
              name="admin-generate-description"
              aria-label="Opis pozycji do wygenerowania"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="np. Kompletna instalacja elektryczna łazienki — gniazdka, oświetlenie LED, wentylator, ogrzewanie podłogowe..."
              rows={3}
              disabled={isGenerating}
            />
            <p className="text-[10px] text-slate-500">
              Im bardziej szczegółowy opis, tym lepsze wyniki. Możesz podać typ pomieszczenia, wymagane punkty, specjalne wymagania.
            </p>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={!description.trim() || isGenerating}
            className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                AI generuje pozycje...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generuj pozycje
              </>
            )}
          </Button>

          {/* Generated Items */}
          {generatedItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  Wygenerowane pozycje ({generatedItems.length})
                </h4>
                <button
                  onClick={toggleAll}
                  className="text-xs text-blue-600 hover:underline"
                >
                  {generatedItems.every((i) => i.selected)
                    ? "Odznacz wszystkie"
                    : "Zaznacz wszystkie"}
                </button>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {generatedItems.map((item, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                      item.selected
                        ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
                        : "bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700 opacity-60"
                    }`}
                  >
                    <Checkbox
                      checked={item.selected}
                      onCheckedChange={() => toggleItem(index)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium truncate">
                          {item.name}
                        </span>
                        {getConfidenceBadge(item.ai_confidence)}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Package className="w-3 h-3 text-blue-500" />
                          {item.base_material_price.toFixed(2)} zł
                        </span>
                        <span className="flex items-center gap-1">
                          <Wrench className="w-3 h-3 text-orange-500" />
                          {item.base_labor_price.toFixed(2)} zł
                        </span>
                        <Badge variant="outline" className="text-[9px]">
                          {item.unit}
                        </Badge>
                        <Badge variant="secondary" className="text-[9px]">
                          {item.category_name}
                        </Badge>
                      </div>
                      {item.ai_note && (
                        <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {item.ai_note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Import Button */}
              <Button
                onClick={handleImport}
                disabled={selectedCount === 0 || isImporting}
                className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importowanie...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Importuj {selectedCount} pozycji do katalogu
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
