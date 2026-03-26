"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BlurredPrice } from "@/components/ui/blurred-price";
import { Plus, Loader2, Star, Pencil, Users, AlertTriangle, Brain, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CatalogItem as CatalogItemType } from "@/lib/types/database";

// ─── Types ────────────────────────────────────────────────────────────────────────

interface CatalogItemProps {
  item: CatalogItemType;
  viewMode: "card" | "list";
  isPro: boolean;
  isAdding: boolean;
  isFavorite: boolean;
  isTogglingFavorite: boolean;
  onAdd: () => void;
  onEdit: () => void;
  onToggleFavorite: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const CatalogItem = React.memo(function CatalogItem({
  item,
  viewMode,
  isPro,
  isAdding,
  isFavorite,
  isTogglingFavorite,
  onAdd,
  onEdit,
  onToggleFavorite,
}: CatalogItemProps) {
  const addBtnClass = "bg-blue-600 text-white hover:bg-blue-700 shadow-sm border-transparent";
  const total = item.base_material_price + item.base_labor_price;
  const isSuspect = item.base_labor_price === 0 && item.base_material_price === 0;

  if (viewMode === "card") {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-3 space-y-2">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-medium text-sm leading-tight">{item.name}</h4>
                {item.is_assembly_parent && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">Zestaw</Badge>
                )}
                {item.visibility === "team" && item.team_id && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                    <Users className="w-2.5 h-2.5 mr-0.5" />Zespół
                  </Badge>
                )}
                {item.user_id === null ? (
                  <span title="ES-Engine — globalny katalog" className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                    <Brain className="w-2.5 h-2.5" />ES
                  </span>
                ) : (
                  <span title="Twój katalog osobisty" className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                    <User className="w-2.5 h-2.5" />
                  </span>
                )}
                {isSuspect && (
                  <span
                    title="Brak danych cenowych — wymagana ręczna weryfikacja."
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-700 cursor-help"
                  >
                    <AlertTriangle className="w-2.5 h-2.5" />
                    <span>Uzupełnij</span>
                  </span>
                )}
              </div>
              {item.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
              )}
            </div>
          </div>

          {/* Price row */}
          <div className="flex items-center justify-between">
            <div className="text-xs space-y-0.5">
              <div className="text-muted-foreground">
                Jednostka: <span className="font-medium">{item.unit}</span>
              </div>
              <BlurredPrice value={total} isPro={isPro} className="font-semibold text-slate-900 dark:text-slate-100" showBadge={!isPro} />
            </div>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" onClick={onToggleFavorite} disabled={isTogglingFavorite}
                className={cn("h-8 w-8 p-0", isFavorite ? "text-amber-500 hover:text-amber-600" : "text-slate-300 hover:text-amber-400 dark:text-slate-600 dark:hover:text-amber-400")}
                title={isFavorite ? "Usuń z ulubionych" : "Dodaj do ulubionych"}>
                {isTogglingFavorite ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Star className={cn("w-3.5 h-3.5", isFavorite && "fill-amber-500")} />}
              </Button>
              <Button size="sm" variant="outline" onClick={onEdit} className="h-8 w-8 p-0" title="Edytuj">
                <Pencil className="w-3 h-3" />
              </Button>
              <Button size="sm" onClick={onAdd} disabled={isAdding} className={addBtnClass}>
                {isAdding ? "..." : <Plus className="w-3 h-3" />}
              </Button>
            </div>
          </div>

          {/* Split price */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t">
            <div>
              <span className="text-muted-foreground">Materiały:</span>
              <div><BlurredPrice value={item.base_material_price} isPro={isPro} className="font-medium text-sm" /></div>
            </div>
            <div>
              <span className="text-muted-foreground">Robocizna:</span>
              <div><BlurredPrice value={item.base_labor_price} isPro={isPro} className="font-medium text-sm" /></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // List view
  return (
    <div className="flex items-center justify-between gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 flex-wrap">
          <h4 className="font-medium text-xs leading-tight truncate">{item.name}</h4>
          {item.is_assembly_parent && (
            <Badge variant="outline" className="text-[9px] px-1 py-0">Zestaw</Badge>
          )}
          {item.visibility === "team" && item.team_id && (
            <Badge className="text-[9px] px-1 py-0 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              <Users className="w-2 h-2" />
            </Badge>
          )}
          {item.user_id === null ? (
            <span title="ES-Engine" className="inline-flex items-center px-1 py-0.5 rounded text-[9px] font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
              <Brain className="w-2.5 h-2.5" />
            </span>
          ) : (
            <span title="Twój katalog" className="inline-flex items-center px-1 py-0.5 rounded text-[9px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              <User className="w-2.5 h-2.5" />
            </span>
          )}
          {isSuspect && (
            <span
              title="Brak danych cenowych — wymagana ręczna weryfikacja."
              className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded-full text-[9px] font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-700 cursor-help"
            >
              <AlertTriangle className="w-2 h-2" />
              <span>Uzupełnij</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
          <span>{item.unit}</span>
          <span>•</span>
          <BlurredPrice value={total} isPro={isPro} className="font-semibold text-slate-900 dark:text-slate-100" showBadge={!isPro} />
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button size="sm" variant="ghost" onClick={onToggleFavorite} disabled={isTogglingFavorite}
          className={cn("h-7 w-7 p-0", isFavorite ? "text-amber-500 hover:text-amber-600" : "text-slate-300 hover:text-amber-400 dark:text-slate-600 dark:hover:text-amber-400")}
          title={isFavorite ? "Usuń z ulubionych" : "Dodaj do ulubionych"}>
          {isTogglingFavorite ? <Loader2 className="w-3 h-3 animate-spin" /> : <Star className={cn("w-3 h-3", isFavorite && "fill-amber-500")} />}
        </Button>
        <Button size="sm" variant="outline" onClick={onEdit} className="h-7 w-7 p-0" title="Edytuj">
          <Pencil className="w-3 h-3" />
        </Button>
        <Button size="sm" onClick={onAdd} disabled={isAdding} className={addBtnClass}>
          {isAdding ? "..." : <Plus className="w-3 h-3" />}
        </Button>
      </div>
    </div>
  );
});
