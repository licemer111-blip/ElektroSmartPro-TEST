"use client";

import { useState, useTransition } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useKnrMultiplier } from "@/hooks/useKnrMultiplier";
import { addProjectItemDirect } from "@/app/dashboard/projects/[id]/actions";
import { notifyDataChanged } from "@/hooks/use-synced-action";
import { cn } from "@/lib/utils";
import { UNIT_PRESETS } from "@/lib/validations";

interface QuickItemDialogProps {
  projectId: string;
  projectStatus?: string;
  className?: string;
}

export function QuickItemDialog({
  projectId,
  projectStatus = "draft",
  className,
}: QuickItemDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { multiplier: knrMultiplier } = useKnrMultiplier();

  const [name, setName] = useState("");
  const [unit, setUnit] = useState("szt");
  const [quantity, setQuantity] = useState("1");
  const [materialPrice, setMaterialPrice] = useState("");
  const [laborPrice, setLaborPrice] = useState("");

  const isFinal = projectStatus === "final";

  const resetForm = () => {
    setName("");
    setUnit("szt");
    setQuantity("1");
    setMaterialPrice("");
    setLaborPrice("");
  };

  const handleOpen = (val: boolean) => {
    setOpen(val);
    if (!val) resetForm();
  };

  const handleAdd = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast({ title: "Błąd", description: "Nazwa pozycji jest wymagana", variant: "destructive" });
      return;
    }
    const qty = parseFloat(quantity) || 1;
    const mat = parseFloat(materialPrice) || 0;
    const lab = parseFloat(laborPrice) || 0;

    startTransition(async () => {
      const result = await addProjectItemDirect(projectId, {
        name: trimmedName,
        unit,
        quantity: qty,
        material_price: mat,
        labor_price: lab,
      });

      if (result?.error) {
        toast({ title: "Błąd", description: result.error, variant: "destructive" });
        return;
      }

      notifyDataChanged();
      toast({ title: "Dodano pozycję", description: `"${trimmedName}" dodana do kosztorysu` });
      handleOpen(false);
    });
  };

  return (
    <>
      <Button
        disabled={isFinal}
        onClick={() => handleOpen(true)}
        className={cn("gap-1.5 bg-blue-600 text-white hover:bg-blue-700 shadow-sm border-transparent h-8 text-xs", isFinal && "opacity-50 cursor-not-allowed", className)}
        title="Dodaj pozycję ręcznie bez katalogu"
      >
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">Szybka pozycja</span>
        <span className="sm:hidden">Pozycja</span>
      </Button>

      <Dialog open={open} onOpenChange={handleOpen}>
        <DialogContent className="w-[95vw] max-w-md bg-background">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-600" />
              Szybka pozycja
            </DialogTitle>
            <DialogDescription className="sr-only">
              Formularz ręcznego dodawania nowej pozycji do kosztorysu.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Nazwa */}
            <div className="space-y-1.5">
              <Label htmlFor="qi-name" className="text-sm font-medium">
                Nazwa <span className="text-red-500">*</span>
              </Label>
              <Input
                id="qi-name"
                name="qi-name"
                placeholder="np. Gniazdo podtynkowe 230V"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
                autoFocus
              />
            </div>

            {/* Jednostka + Ilość */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="qi-unit" className="text-sm font-medium">Jednostka</Label>
                <Select name="qi-unit" value={unit} onValueChange={setUnit}>
                  <SelectTrigger id="qi-unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIT_PRESETS.map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="qi-qty" className="text-sm font-medium">Ilość</Label>
                <Input
                  id="qi-qty"
                  name="qi-qty"
                  type="number"
                  min="0.001"
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
            </div>

            {/* Ceny */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="qi-mat" className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  Cena materiału (zł)
                </Label>
                <Input
                  id="qi-mat"
                  name="qi-mat"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={materialPrice}
                  onChange={(e) => setMaterialPrice(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="qi-lab" className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  Cena robocizny (zł)
                </Label>
                <Input
                  id="qi-lab"
                  name="qi-lab"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={laborPrice}
                  onChange={(e) => setLaborPrice(e.target.value)}
                />
              </div>
            </div>

            {/* Preview */}
            {(parseFloat(materialPrice) > 0 || parseFloat(laborPrice) > 0) && (
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm">
                <span className="text-slate-500 dark:text-slate-400">Suma pozycji:</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {((parseFloat(materialPrice) || 0) + (parseFloat(laborPrice) || 0) * knrMultiplier) * (parseFloat(quantity) || 1) > 0
                    ? `${(((parseFloat(materialPrice) || 0) + (parseFloat(laborPrice) || 0) * knrMultiplier) * (parseFloat(quantity) || 1)).toFixed(2)} zł`
                    : "—"}
                </span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => handleOpen(false)} disabled={isPending}>
              Anuluj
            </Button>
            <Button
              onClick={handleAdd}
              disabled={isPending || !name.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Dodawanie...</>
              ) : (
                <><Plus className="w-4 h-4 mr-2" />Dodaj pozycję</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
