"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart } from "lucide-react";
import { shoppingLines } from "@/lib/estimate/offer-readiness";
import type { ProjectItem } from "@/lib/types/database";

interface ProjectMaterialsListProps {
  items: ProjectItem[];
  isPro: boolean;
  materialsOwnedByCustomer?: boolean;
}

function money(value: number) {
  return value.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function qty(value: number) {
  return value.toLocaleString("pl-PL", { maximumFractionDigits: 2 });
}

export function ProjectMaterialsList({
  items,
  isPro: _isPro,
  materialsOwnedByCustomer = false,
}: ProjectMaterialsListProps) {
  void _isPro;
  const lines = useMemo(
    () => shoppingLines(items, materialsOwnedByCustomer),
    [items, materialsOwnedByCustomer],
  );
  const total = lines.reduce((sum, line) => sum + (line.materialUnit > 0 ? line.materialUnit * line.quantity : 0), 0);
  const missing = lines.filter((line) => line.materialUnit <= 0).length;

  if (materialsOwnedByCustomer) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <ShoppingCart className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Lista zakupów wyłączona</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            W trybie samej robocizny materiał kupuje klient. Włącz „Robocizna i materiały”, żeby zobaczyć, co zamówić.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Package className="w-4 h-4" />
            Lista zakupów
          </CardTitle>
          <p className="text-sm font-semibold tabular-nums">{money(total)} zł</p>
        </div>
        <p className="text-[11px] text-slate-500">
          {lines.length === 0
            ? "W kosztorysie nie ma towaru do zamówienia."
            : missing > 0
              ? `${lines.length} pozycji, ${missing} bez ceny. Cenę dopiszesz w wierszu albo w podsumowaniu.`
              : `${lines.length} pozycji z ceną z wiersza.`}
        </p>
      </CardHeader>
      {lines.length > 0 && (
        <CardContent className="px-4 pb-4">
          <div className="hidden sm:grid grid-cols-12 gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium text-slate-500">
            <div className="col-span-5">Nazwa</div>
            <div className="col-span-2 text-center">Ilość</div>
            <div className="col-span-2 text-right">Cena</div>
            <div className="col-span-3 text-right">Wartość</div>
          </div>
          <div className="mt-1 space-y-1">
            {lines.map((line) => {
              const known = line.materialUnit > 0;
              return (
                <div
                  key={`${line.name}-${line.unit}`}
                  className={`grid grid-cols-12 gap-2 px-3 py-2.5 rounded-lg border ${
                    known
                      ? "border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      : "border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/20"
                  }`}
                >
                  <div className="col-span-12 sm:col-span-5 text-sm font-medium">{line.name}</div>
                  <div className="col-span-4 sm:col-span-2 text-sm sm:text-center text-slate-500">{qty(line.quantity)} {line.unit}</div>
                  <div className="col-span-4 sm:col-span-2 text-sm sm:text-right text-slate-500">
                    {known ? `${money(line.materialUnit)} zł` : "brak ceny"}
                  </div>
                  <div className="col-span-4 sm:col-span-3 text-sm text-right font-semibold">
                    {known ? `${money(line.materialUnit * line.quantity)} zł` : "—"}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
