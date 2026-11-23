"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ShoppingCart, Copy } from "lucide-react";
import { toast } from "sonner";
import { applyOwnMaterialPrice } from "@/app/dashboard/projects/[id]/_actions/project-items";
import { materialGaps, shoppingLines } from "@/lib/estimate/offer-readiness";
import type { ProjectItem } from "@/lib/types/database";

interface ShoppingListDialogProps {
  projectId: string;
  items: ProjectItem[];
  materialsOwnedByCustomer: boolean;
}

function money(value: number) {
  return value.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function qty(value: number) {
  return value.toLocaleString("pl-PL", { maximumFractionDigits: 2 });
}

export function ShoppingListDialog({ projectId, items, materialsOwnedByCustomer }: ShoppingListDialogProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const lines = shoppingLines(items, materialsOwnedByCustomer);
  const gaps = materialGaps(items, materialsOwnedByCustomer);

  if (materialsOwnedByCustomer || lines.length === 0) return null;

  const positions = lines.length === 1 ? "pozycja" : lines.length % 10 >= 2 && lines.length % 10 <= 4 && (lines.length % 100 < 12 || lines.length % 100 > 14) ? "pozycje" : "pozycji";
  const priced = lines.filter((line) => line.materialUnit > 0);
  const total = priced.reduce((sum, line) => sum + line.materialUnit * line.quantity, 0);
  const missing = lines.length - priced.length;

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

  const copyList = async () => {
    const body = lines.map((line) => {
      const amount = line.materialUnit > 0
        ? `${money(line.materialUnit)} zł/${line.unit} = ${money(line.materialUnit * line.quantity)} zł`
        : "brak ceny";
      return `${line.name} — ${qty(line.quantity)} ${line.unit} — ${amount}`;
    }).join("\n");
    const text = `Lista zakupów\n${body}\nSuma znanych cen: ${money(total)} zł`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Lista skopiowana");
    } catch {
      toast.error("Nie udało się skopiować listy");
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="w-full justify-start">
          <ShoppingCart className="w-4 h-4 mr-2" />
          Lista zakupów
          <span className="ml-auto text-[11px] font-normal text-slate-500">
            {missing > 0 ? `${missing} bez ceny` : `${money(total)} zł`}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Co kupić</DialogTitle>
          <DialogDescription>
            Ilość z kosztorysu. Cena z wiersza albo z Twojego cennika. Tej listy nie dostaje klient.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2">
          <div>
            <p className="text-sm font-semibold">{lines.length} {positions}</p>
            <p className="text-[11px] text-slate-500">
              {missing > 0 ? `${missing} bez ceny materiału` : "Wszystkie mają cenę"}
            </p>
          </div>
          <p className="text-sm font-semibold tabular-nums">{money(total)} zł</p>
        </div>
        <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-1">
          {lines.map((line) => {
            const gap = gaps.find((item) => item.name === line.name && item.unit === line.unit);
            const known = line.materialUnit > 0;
            return (
              <div
                key={`${line.name}-${line.unit}`}
                className={`flex items-start justify-between gap-3 rounded-lg border px-3 py-2 ${
                  known
                    ? "border-slate-200 dark:border-slate-700"
                    : "border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/20"
                }`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-snug">{line.name}</p>
                  <p className="text-xs text-slate-500">{qty(line.quantity)} {line.unit}</p>
                </div>
                <div className="text-right shrink-0">
                  {known ? (
                    <>
                      <p className="text-sm font-semibold tabular-nums">{money(line.materialUnit * line.quantity)} zł</p>
                      <p className="text-[11px] text-slate-500">{money(line.materialUnit)} zł/{line.unit}</p>
                    </>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-xs text-amber-700 dark:text-amber-300">Dopisz cenę z hurtowni</p>
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
        <Button type="button" variant="outline" size="sm" className="w-full" onClick={copyList}>
          <Copy className="w-3.5 h-3.5 mr-2" />
          Kopiuj listę
        </Button>
      </DialogContent>
    </Dialog>
  );
}
