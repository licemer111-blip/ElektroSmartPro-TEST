"use client";

import { Button } from "@/components/ui/button";
import { BlurredPrice } from "@/components/ui/blurred-price";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Package, Pencil, Trash2, Wrench } from "lucide-react";
import type { AssemblyItemInput } from "@/components/assemblies/AssemblyItemsList";

export interface AssemblyModuleListProps {
  items: AssemblyItemInput[];
  isPro: boolean;
  onShowAddForm: () => void;
  onStartEdit: (index: number) => void;
  onRemoveItem: (index: number) => void;
}

export function AssemblyModuleList({
  items,
  isPro,
  onShowAddForm,
  onStartEdit,
  onRemoveItem,
}: AssemblyModuleListProps) {
  const totalMaterial = items
    .filter((i) => i.type === "material")
    .reduce((s, i) => s + i.price * i.quantity, 0);
  const totalLabor = items
    .filter((i) => i.type === "labor")
    .reduce((s, i) => s + i.price * i.quantity, 0);
  const total = totalMaterial + totalLabor;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Package className="w-4 h-4 text-blue-500" />
          Pozycje zestawu
          {items.length > 0 && (
            <Badge variant="secondary" className="text-[10px]">{items.length}</Badge>
          )}
        </h3>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onShowAddForm}
          className="h-7 text-xs gap-1"
        >
          <Plus className="w-3 h-3" />
          Dodaj pozycję
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
          <Package className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
          <p>Brak pozycji — kliknij &quot;Dodaj pozycję&quot;</p>
        </div>
      ) : (
        <div className="space-y-1">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 group"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {item.type === "material" ? (
                  <Package className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                ) : (
                  <Wrench className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                )}
                <span className="text-sm truncate font-medium">{item.name}</span>
                <Badge variant="outline" className="text-[10px] flex-shrink-0">
                  {item.quantity} {item.unit}
                </Badge>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 w-20 text-right">
                  <BlurredPrice value={item.price * item.quantity} isPro={isPro} showBadge={!isPro} className="text-sm font-semibold" />
                </span>
                <button
                  type="button"
                  onClick={() => onStartEdit(index)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all"
                  title="Edytuj pozycję"
                >
                  <Pencil className="w-3.5 h-3.5 text-blue-500" />
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveItem(index)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
                  title="Usuń pozycję"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <Card className="bg-slate-50 dark:bg-slate-900">
          <CardContent className="pt-4 pb-3">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Materiały:</span>
                <span className="font-medium">
                  <BlurredPrice value={totalMaterial} isPro={isPro} showBadge={!isPro} className="font-medium" />
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Robocizna:</span>
                <span className="font-medium">
                  <BlurredPrice value={totalLabor} isPro={isPro} showBadge={!isPro} className="font-medium" />
                </span>
              </div>
              <div className="flex justify-between pt-1.5 border-t font-bold text-base">
                <span>Razem:</span>
                <span className="text-blue-600 dark:text-blue-400">
                  <BlurredPrice value={total} isPro={isPro} showBadge={!isPro} className="text-base font-bold" />
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
