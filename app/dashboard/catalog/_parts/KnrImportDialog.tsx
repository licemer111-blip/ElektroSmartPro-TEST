"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { createCatalogItem } from "../actions";
import type { CatalogItem } from "../actions";

interface KnrImportDialogProps {
  item: CatalogItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KnrImportDialog({ item, open, onOpenChange }: KnrImportDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [materialPrice, setMaterialPrice] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const laborPrice = item?.base_labor_price ?? 0;

  const handleImport = async () => {
    if (!item) return;
    setIsImporting(true);
    try {
      await createCatalogItem({
        name: item.name,
        unit: item.unit,
        base_labor_price: laborPrice,
        base_material_price: parseFloat(materialPrice) || 0,
        visibility: "personal",
      });
      toast({
        title: "Dodano do katalogu",
        description: `„${item.name}" zapisano w Twoich pozycjach`,
      });
      onOpenChange(false);
      setMaterialPrice("");
      router.refresh();
    } catch {
      toast({
        title: "Błąd",
        description: "Nie udało się dodać pozycji do katalogu",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-orange-500" />
            Importuj normę KNR do katalogu
          </DialogTitle>
          <DialogDescription>
            Pozycja zostanie dodana do Twoich pozycji katalogowych z normą robocizny z KNR 2026.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* KNR info badge */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
            <span className="text-[10px] font-mono font-bold text-green-700 dark:text-green-400 whitespace-nowrap">
              {item.knr_ref ?? item.category_name}
            </span>
            <span className="text-xs text-green-800 dark:text-green-300 truncate font-medium">
              {item.name}
            </span>
          </div>

          {/* Labor (read-only from KNR) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Robocizna (z normy KNR)</Label>
              <div className="h-9 px-3 flex items-center rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300">
                {laborPrice.toFixed(2)} zł
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Jednostka</Label>
              <div className="h-9 px-3 flex items-center rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-500">
                {item.unit}
              </div>
            </div>
          </div>

          {/* Material price (optional input) */}
          <div className="space-y-1.5">
            <Label htmlFor="mat-price" className="text-xs">
              Cena materiału <span className="text-slate-400">(opcjonalnie)</span>
            </Label>
            <div className="relative">
              <Input
                id="mat-price"
                name="mat-price"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={materialPrice}
                onChange={(e) => setMaterialPrice(e.target.value)}
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">zł</span>
            </div>
            <p className="text-[10px] text-slate-400">
              Możesz uzupełnić cenę materiału później w katalogu.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isImporting}>
            Anuluj
          </Button>
          <Button
            onClick={handleImport}
            disabled={isImporting}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {isImporting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Dodawanie...</>
            ) : (
              <><BookOpen className="w-4 h-4 mr-2" />Dodaj do katalogu</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
