"use client";

import { useRouter } from "next/navigation";
import {
  Pencil, Trash2, Lock, FolderInput, EyeOff, Star, Sparkles, Brain,
  Users, MoreVertical, Copy, Share2, UserMinus, Globe, BadgeCheck,
  Square, CheckSquare, AlertTriangle,
} from "lucide-react";
import type { Team } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableCell, TableRow } from "@/components/ui/table";
import { MarketPriceDisplay } from "@/components/catalog/market-price-display";
import { updateCatalogItemVisibility } from "../actions";
import type { CatalogItem } from "../actions";
import { tableStyles, badgeStyles } from "@/lib/styles/table-styles";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface CatalogRowProps {
  item: CatalogItem;
  isPro: boolean;
  isFavorite: boolean;
  isTogglingFavorite: boolean;
  isHiding: boolean;
  isSelected?: boolean;
  userTeam?: Team | null;
  onEdit: (item: CatalogItem) => void;
  onDelete: (item: CatalogItem) => void;
  onMove: (item: CatalogItem) => void;
  onDuplicate: (item: CatalogItem) => void;
  onToggleFavorite: (itemId: string) => void;
  onHide: (itemId: string, itemName: string) => void;
  onToggleSelect?: (itemId: string) => void;
}

export function CatalogRow({
  item,
  isPro,
  isFavorite,
  isTogglingFavorite,
  isHiding,
  isSelected = false,
  userTeam,
  onEdit,
  onDelete,
  onMove,
  onDuplicate,
  onToggleFavorite,
  onHide,
  onToggleSelect,
}: CatalogRowProps) {
  const router = useRouter();
  const { toast } = useToast();

  return (
    <TableRow className={cn(
      tableStyles.row,
      "group relative transition-all duration-300",
      isSelected
        ? "bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-950/50"
        : "hover:bg-gradient-to-r hover:from-blue-50/50 hover:via-cyan-50/50 hover:to-indigo-50/50 dark:hover:from-blue-950/20 dark:hover:via-cyan-950/20 dark:hover:to-indigo-950/20 hover:shadow-md"
    )}>
      {/* Checkbox — only for own items (user_id !== null) */}
      {onToggleSelect && item.user_id !== null && (
        <TableCell className="w-[36px] min-w-[36px] p-2 text-center">
          <button
            onClick={() => onToggleSelect(item.id)}
            className="p-0.5 rounded"
            aria-label={`Zaznacz ${item.name}`}
          >
            {isSelected
              ? <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              : <Square className="w-4 h-4 text-slate-300 dark:text-slate-600 hover:text-slate-500" />}
          </button>
        </TableCell>
      )}
      {/* Placeholder cell for global items so columns stay aligned */}
      {onToggleSelect && item.user_id === null && (
        <TableCell className="w-[36px] min-w-[36px] p-2" />
      )}
      <TableCell className={cn(tableStyles.cell, "font-medium text-xs sm:text-sm p-2 sm:p-3 w-[28%]")}>
        <div className="flex items-start gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 flex-shrink-0 mt-0.5 hover:bg-amber-50 dark:hover:bg-amber-950/30"
            onClick={() => onToggleFavorite(item.id)}
            disabled={isTogglingFavorite}
            title={isFavorite ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
          >
            <Star className={cn("w-4 h-4 transition-colors", isFavorite ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-600")} />
          </Button>
          <div className="min-w-0 flex-1">
            <p
              className="text-xs sm:text-sm font-medium leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors duration-300"
              title={item.name}
            >
              {item.name}
            </p>
            <div className="flex flex-wrap gap-1 mt-1">
              {item.user_id === null && (
                <span
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                  title="Pozycja z globalnego katalogu (tylko do odczytu)"
                >
                  <Globe className="w-2.5 h-2.5" />
                  Global
                </span>
              )}
              {item.user_id !== null && item.market_comment && item.market_comment.includes("AI Generated") && (
                <span
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                  title="Pozycja wygenerowana przez ES-Engine"
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  ES
                </span>
              )}
              {item.user_id !== null && (() => {
                const laborKeywords = /montaż|kucie|układanie|bruzdowanie|podłączenie|pomiar|instalacj/i;
                const isLaborType = laborKeywords.test(item.name);
                const isSuspect = (item.base_labor_price === 0 && item.base_material_price === 0)
                  || (isLaborType && item.base_labor_price === 0);
                if (!isSuspect) return null;
                return (
                  <span
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
                    title={isLaborType && item.base_labor_price === 0
                      ? "Pozycja robocizny bez ceny — wymagana ręczna korekta lub użyj 'Napraw ceny'."
                      : "Brak ceny robocizny i materiału. Edytuj i uzupełnij ceny."}
                  >
                    <AlertTriangle className="w-2.5 h-2.5" />
                    Uzupełnij
                  </span>
                );
              })()}
              {item.isAiSuggestion && (
                <span
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 text-violet-700 dark:text-violet-300 border border-violet-300 dark:border-violet-700"
                  title={item.knr_ref ? `Sugestia ES-Engine — KNR: ${item.knr_ref}` : "Sugestia ES-Engine z bazy KNR 2026"}
                >
                  <Brain className="w-2.5 h-2.5" />
                  Sugestia ES
                </span>
              )}
              {!item.isAiSuggestion && item.knr_ref && (
                <span
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                  title={`Zweryfikowano z KNR 2026 — ${item.knr_ref}`}
                >
                  <BadgeCheck className="w-2.5 h-2.5" />
                  KNR
                </span>
              )}
              {item.visibility === "team" && item.team_id && (
                <span
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                  title="Pozycja udostępniona zespołowi"
                >
                  <Users className="w-2.5 h-2.5" />
                  Zespół
                </span>
              )}
            </div>
          </div>
        </div>
      </TableCell>

      <TableCell className={cn(tableStyles.cell, "text-xs sm:text-sm hidden md:table-cell p-2 sm:p-3 w-[15%]")}>
        <span className={cn(badgeStyles.default, "text-[10px] sm:text-xs")}>
          {item.category_name || "Bez kategorii"}
        </span>
      </TableCell>

      <TableCell className={cn(tableStyles.cell, "text-xs sm:text-sm hidden lg:table-cell p-2 sm:p-3 w-[8%]")}>
        {item.unit}
      </TableCell>

      <TableCell className={cn(tableStyles.cell, "p-2 sm:p-3 w-[17%]")}>
        <MarketPriceDisplay
          basePrice={item.base_labor_price}
          priceMin={item.price_min}
          priceMax={item.price_max}
          trend={item.price_trend}
          confidenceLevel={item.confidence_level}
          confidenceReason={item.confidence_reason}
          marketComment={item.market_comment}
          lastVerifiedAt={item.last_verified_at}
          isPro={isPro}
        />
      </TableCell>

      <TableCell className={cn(tableStyles.cell, "p-2 sm:p-3 w-[17%]")}>
        <MarketPriceDisplay
          basePrice={item.base_material_price}
          priceMin={item.price_min}
          priceMax={item.price_max}
          trend={item.price_trend}
          confidenceLevel={item.confidence_level}
          confidenceReason={item.confidence_reason}
          marketComment={item.market_comment}
          lastVerifiedAt={item.last_verified_at}
          isPro={isPro}
        />
      </TableCell>

      <TableCell className={cn(tableStyles.cell, "text-right p-2 sm:p-3 w-[18%]")}>
        <div className="flex justify-end">
          {item.isAiSuggestion ? (
            <span className="text-[10px] text-slate-400 dark:text-slate-600 italic px-2">KNR</span>
          ) : isPro ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onEdit(item)}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edytuj
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onMove(item)}>
                  <FolderInput className="w-4 h-4 mr-2" />
                  Przenieś do kategorii
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate(item)}>
                  <Copy className="w-4 h-4 mr-2" />
                  Duplikuj
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {item.user_id !== null && userTeam && (
                  <>
                    {item.visibility === "team" ? (
                      <DropdownMenuItem
                        onClick={async () => {
                          try {
                            await updateCatalogItemVisibility(item.id, "personal");
                            router.refresh();
                          } catch {
                            toast({ title: "Błąd", description: "Błąd podczas zmiany widoczności", variant: "destructive" });
                          }
                        }}
                      >
                        <UserMinus className="w-4 h-4 mr-2" />
                        Usuń z zespołu
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={async () => {
                          try {
                            await updateCatalogItemVisibility(item.id, "team", userTeam.id);
                            router.refresh();
                          } catch {
                            toast({ title: "Błąd", description: "Błąd podczas udostępniania", variant: "destructive" });
                          }
                        }}
                      >
                        <Share2 className="w-4 h-4 mr-2 text-blue-600" />
                        <span className="text-blue-600">Udostępnij zespołowi</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                  </>
                )}

                {item.user_id === null && (
                  <DropdownMenuItem onClick={() => onHide(item.id, item.name)} disabled={isHiding}>
                    <EyeOff className="w-4 h-4 mr-2 text-amber-600" />
                    <span className="text-amber-600">Ukryj</span>
                  </DropdownMenuItem>
                )}

                {item.user_id !== null && (
                  <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => onDelete(item)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Usuń
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              disabled
              className="opacity-50 cursor-not-allowed h-7 w-7 p-0 sm:h-8 sm:w-8"
              title="Edycja dostępna w pakiecie PRO"
            >
              <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
