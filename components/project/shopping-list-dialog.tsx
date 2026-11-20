"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { applyOwnMaterialPrice } from "@/app/dashboard/projects/[id]/_actions/project-items";
import { materialGaps, shoppingLines } from "@/lib/estimate/offer-readiness";
import type { ProjectItem } from "@/lib/types/database";

interface ShoppingListDialogProps {
  projectId: string;
  items: ProjectItem[];
  materialsOwnedByCustomer: boolean;
}

export function ShoppingListDialog({ projectId, items, materialsOwnedByCustomer }: ShoppingListDialogProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const lines = shoppingLines(items, materialsOwnedByCustomer);
  const gaps = materialGaps(items, materialsOwnedByCustomer);

  const fill = async (itemId: string) => {
    setPendingId(itemId);
    const result = await applyOwnMaterialPrice(projectId, itemId);
    setPendingId(null);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Cena materiału wzięta z Twojego cennika");
    router.refresh();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="w-full">
          <ShoppingCart className="w-4 h-4 mr-2" />
          Lista zakupów{gaps.length > 0 ? ` (${gaps.length} bez ceny)` : ""}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Co kupić</DialogTitle>
          <DialogDescription>
            Ilość z kosztorysu. Cena tylko z Twojego cennika. Klient nie dostaje tej listy mailem.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto space-y-2">
          {lines.length === 0 ? <p className="text-sm text-slate-500">Brak pozycji do zamówienia.</p> : null}
          {lines.map((line) => {
            const gap = gaps.find((item) => item.name === line.name && item.unit === line.unit);
            return (
              <div key={`${line.name}-${line.unit}`} className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-2">
                <div>
                  <p className="text-sm font-medium">{line.name}</p>
                  <p className="text-xs text-slate-500">{line.quantity} {line.unit}</p>
                </div>
                <div className="text-right">
                  {materialsOwnedByCustomer ? (
                    <p className="text-xs text-slate-500">Inwestor</p>
                  ) : line.materialUnit > 0 ? (
                    <p className="text-sm">{line.materialUnit.toFixed(2)} zł/{line.unit}</p>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-xs text-amber-700">Dopisz z hurtowni</p>
                      {gap ? (
                        <Button type="button" size="sm" variant="outline" disabled={pendingId === gap.id} onClick={() => fill(gap.id)}>
                          {pendingId === gap.id ? "Szukam…" : "Z mojego cennika"}
                        </Button>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
