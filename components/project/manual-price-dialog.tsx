"use client";

import { useState, useTransition } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, PenLine, X } from "lucide-react";
import type { AiPriceEstimate } from "@/app/dashboard/projects/[id]/ai-actions";
import { updateProjectItem } from "@/app/dashboard/projects/[id]/_actions/project-items";

interface ManualPriceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  estimate: AiPriceEstimate;
  projectId: string;
  onSaved: (updated: AiPriceEstimate) => void;
}

export function ManualPriceDialog({
  open,
  onOpenChange,
  estimate,
  projectId,
  onSaved,
}: ManualPriceDialogProps) {
  const isAlreadyManual = estimate.note?.startsWith("Uściślone (cena ręczna)");
  const [manualMat, setManualMat] = useState(
    isAlreadyManual && estimate.suggestedMaterial > 0 ? String(estimate.suggestedMaterial) : ""
  );
  const [manualLab, setManualLab] = useState(
    isAlreadyManual && estimate.suggestedLabor > 0 ? String(estimate.suggestedLabor) : ""
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const parsedMat = parseFloat(manualMat.replace(",", "."));
  const parsedLab = parseFloat(manualLab.replace(",", "."));
  const hasValues = !isNaN(parsedMat) || !isNaN(parsedLab);
  const mat = isNaN(parsedMat) ? 0 : parsedMat;
  const lab = isNaN(parsedLab) ? 0 : parsedLab;

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const dbResult = await updateProjectItem(projectId, estimate.itemId, {
        final_material_price: mat,
        final_labor_price: lab,
        confidence_level: "manual",
      });

      if (dbResult?.error) {
        setError(dbResult.error);
        return;
      }

      onSaved({
        ...estimate,
        suggestedMaterial: mat,
        suggestedLabor: lab,
        confidence: "high" as const,
        note: "Uściślone (cena ręczna)",
        isAmbiguous: false,
        knrCode: null,
        knrSource: null,
        laborNorm: null,
      });
      onOpenChange(false);
    });
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[102] bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          className="fixed left-[50%] top-[50%] z-[103] translate-x-[-50%] translate-y-[-50%] w-full max-w-sm bg-white dark:bg-slate-950 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col gap-4 focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
                <PenLine className="w-4 h-4 text-violet-500" />
                Cena ręczna
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Wpisz cenę materiału i robocizny ręcznie</p>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Item name */}
          <div className="rounded-md bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
            {estimate.name}
            <span className="ml-2 text-xs text-slate-400 font-normal">
              × {estimate.quantity} {estimate.unit}
            </span>
          </div>

          {/* Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="manual-mat" className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                Materiał (PLN/jm.)
              </label>
              <Input
                id="manual-mat"
                name="manual-mat"
                type="number"
                min="0"
                step="0.01"
                placeholder="np. 120.00"
                value={manualMat}
                onChange={(e) => setManualMat(e.target.value)}
                className="h-9 text-sm"
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="manual-lab" className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                Robocizna (PLN/jm.)
              </label>
              <Input
                id="manual-lab"
                name="manual-lab"
                type="number"
                min="0"
                step="0.01"
                placeholder="np. 35.00"
                value={manualLab}
                onChange={(e) => setManualLab(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>

          {/* Summary */}
          {hasValues && (
            <div className="rounded-md bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 px-3 py-2 text-xs text-violet-700 dark:text-violet-300">
              <span className="font-medium">{(mat + lab).toFixed(2)} PLN/jm.</span>
              {" · "}
              razem: <span className="font-bold">{((mat + lab) * estimate.quantity).toFixed(2)} PLN</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Anuluj
            </Button>
            <Button
              size="sm"
              className="flex-1 text-white bg-violet-600 hover:bg-violet-700"
              onClick={handleSave}
              disabled={isPending || !hasValues}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Zapisuję...
                </>
              ) : (
                <>
                  <PenLine className="w-3.5 h-3.5 mr-1.5" />
                  Zapisz cenę ręczną
                </>
              )}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
