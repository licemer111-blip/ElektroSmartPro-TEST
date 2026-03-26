"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Box, TrendingUp, Hash, DollarSign } from "lucide-react";
import type { ProjectItem } from "@/lib/types/database";

interface ProjectMaterialsListProps {
  items: ProjectItem[];
  isPro: boolean;
  materialsOwnedByCustomer?: boolean;
}

interface MaterialGroup {
  name: string;
  totalQuantity: number;
  unit: string;
  totalMaterialCost: number;
  items: { name: string; quantity: number; materialPrice: number }[];
}

export function ProjectMaterialsList({ 
  items, 
  isPro, 
  materialsOwnedByCustomer = false 
}: ProjectMaterialsListProps) {
  // Group items by name and aggregate quantities
  const materialGroups = useMemo(() => {
    const groups: Record<string, MaterialGroup> = {};

    items.forEach((item) => {
      const key = item.name.toLowerCase().trim();
      const materialPrice = item.final_material_price ?? item.material_price ?? 0;

      if (!groups[key]) {
        groups[key] = {
          name: item.name,
          totalQuantity: 0,
          unit: item.unit,
          totalMaterialCost: 0,
          items: [],
        };
      }

      groups[key].totalQuantity += item.quantity;
      groups[key].totalMaterialCost += materialPrice * item.quantity;
      groups[key].items.push({
        name: item.name,
        quantity: item.quantity,
        materialPrice,
      });
    });

    return Object.values(groups).sort((a, b) => b.totalMaterialCost - a.totalMaterialCost);
  }, [items]);

  const totalMaterialCost = useMemo(
    () => materialGroups.reduce((sum, g) => sum + g.totalMaterialCost, 0),
    [materialGroups]
  );

  const totalPositions = items.length;
  const uniqueMaterials = materialGroups.length;

  const formatPrice = (price: number) => {
    return price.toLocaleString("pl-PL", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Hash className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalPositions}</p>
                <p className="text-xs text-muted-foreground">Pozycji</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{uniqueMaterials}</p>
                <p className="text-xs text-muted-foreground">Unikalnych</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                {materialsOwnedByCustomer ? (
                  <>
                    <p className="text-lg font-bold text-muted-foreground">Materiały klienta</p>
                    <p className="text-xs text-muted-foreground">Ceny ukryte</p>
                  </>
                ) : isPro ? (
                  <>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {formatPrice(totalMaterialCost)} zł
                    </p>
                    <p className="text-xs text-muted-foreground">Łączny koszt materiałów</p>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-bold text-muted-foreground">*** zł</p>
                    <p className="text-xs text-muted-foreground">PRO: zobacz ceny</p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Materials List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Box className="w-5 h-5" />
            Lista materiałów
          </CardTitle>
        </CardHeader>
        <CardContent>
          {materialGroups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Brak materiałów w projekcie. Dodaj pozycje do kosztorysu.
            </div>
          ) : (
            <div className="space-y-2">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium text-muted-foreground">
                <div className="col-span-5">Nazwa materiału</div>
                <div className="col-span-2 text-center">Ilość</div>
                <div className="col-span-2 text-center">Jedn.</div>
                <div className="col-span-3 text-right">Wartość</div>
              </div>

              {/* Items */}
              {materialGroups.map((group, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-2 px-3 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0"
                >
                  <div className="col-span-5">
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {group.name}
                    </span>
                    {group.items.length > 1 && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {group.items.length}x
                      </Badge>
                    )}
                  </div>
                  <div className="col-span-2 text-center font-mono">
                    {group.totalQuantity}
                  </div>
                  <div className="col-span-2 text-center text-muted-foreground">
                    {group.unit}
                  </div>
                  <div className="col-span-3 text-right">
                    {materialsOwnedByCustomer ? (
                      <span className="text-muted-foreground">—</span>
                    ) : isPro ? (
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatPrice(group.totalMaterialCost)} zł
                      </span>
                    ) : (
                      <span className="text-muted-foreground blur-sm">***</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top 5 Most Expensive */}
      {!materialsOwnedByCustomer && isPro && materialGroups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              Top 5 najdroższych pozycji
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {materialGroups.slice(0, 5).map((group, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs font-bold">
                      {index + 1}
                    </span>
                    <span className="font-medium">{group.name}</span>
                    <span className="text-sm text-muted-foreground">
                      ({group.totalQuantity} {group.unit})
                    </span>
                  </div>
                  <span className="font-semibold text-orange-600 dark:text-orange-400">
                    {formatPrice(group.totalMaterialCost)} zł
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
