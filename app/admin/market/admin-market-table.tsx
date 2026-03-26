"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, TrendingUp, TrendingDown, ArrowRight, Shield, ShieldCheck, ShieldAlert, Edit, Activity, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { normalizePolish } from "@/lib/utils";
import type { AdminMarketItem } from "./actions";
import { simulateMarketMovement } from "./actions";
import { MarketItemEditor } from "./market-item-editor";
import { ImportItemsDialog } from "./import-items-dialog";
import { AiGenerateDialog } from "./ai-generate-dialog";
import { AiValidateDialog } from "./ai-validate-dialog";

interface AdminMarketTableProps {
  items: AdminMarketItem[];
  total: number;
}

export function AdminMarketTable({ items, total }: AdminMarketTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<AdminMarketItem | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const { toast } = useToast();

  // Filter items by search term
  const filteredItems = items.filter((item) => {
    if (!searchTerm) return true;
    const normalized = normalizePolish(searchTerm.toLowerCase());
    const normalizedName = normalizePolish(item.name.toLowerCase());
    const normalizedCategory = normalizePolish(item.category_name.toLowerCase());
    return normalizedName.includes(normalized) || normalizedCategory.includes(normalized);
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pl-PL", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pl-PL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-red-600" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-green-600" />;
      default:
        return <ArrowRight className="w-4 h-4 text-slate-500" />;
    }
  };

  const getTrendLabel = (trend: string) => {
    switch (trend) {
      case "up":
        return "Rosną";
      case "down":
        return "Spadają";
      default:
        return "Stabilne";
    }
  };

  const getConfidenceIcon = (level: string) => {
    switch (level) {
      case "high":
        return <ShieldCheck className="w-4 h-4 text-green-600" />;
      case "medium":
        return <Shield className="w-4 h-4 text-amber-600" />;
      default:
        return <ShieldAlert className="w-4 h-4 text-slate-500" />;
    }
  };

  const getConfidenceLabel = (level: string) => {
    switch (level) {
      case "high":
        return "Wysoka";
      case "medium":
        return "Średnia";
      default:
        return "Niska";
    }
  };

  const handleEdit = (item: AdminMarketItem) => {
    setSelectedItem(item);
    setIsEditorOpen(true);
  };

  const handleSimulateMarket = async () => {
    setIsSimulating(true);
    try {
      const result = await simulateMarketMovement();
      
      if (result.success) {
        toast({
          title: "✅ Cały rynek zaktualizowany!",
          description: `Pomyślnie zaktualizowano ${result.updated} pozycji globalnych. Wszystkie ceny i trendy zostały odświeżone.`,
        });
        
        // Reload the page to show updated data
        window.location.reload();
      } else {
        toast({
          title: "❌ Błąd symulacji",
          description: result.error || "Nie udało się zaktualizować rynku",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error simulating market:", error);
      toast({
        title: "❌ Błąd",
        description: "Wystąpił nieoczekiwany błąd podczas symulacji",
        variant: "destructive",
      });
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <CardTitle className="text-base sm:text-lg">
              Pozycje katalogowe - Market Intelligence
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <Badge variant="outline" className="text-xs sm:text-sm">
                {total} pozycji globalnych
              </Badge>
              <ImportItemsDialog />
              <AiGenerateDialog />
              <AiValidateDialog />
              <Button
                variant="outline"
                size="sm"
                onClick={handleSimulateMarket}
                disabled={isSimulating}
                className="gap-2 border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-400 dark:hover:bg-purple-950/30 text-xs sm:text-sm"
              >
                {isSimulating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="hidden sm:inline">Symulacja...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <Activity className="w-4 h-4" />
                    <span className="hidden sm:inline">Symuluj Ruch Rynku</span>
                    <span className="sm:hidden">Symuluj</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              id="admin-market-search"
              name="admin-market-search"
              aria-label="Szukaj po nazwie lub kategorii"
              type="text"
              placeholder="Szukaj po nazwie lub kategorii..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {searchTerm && (
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              Znaleziono: {filteredItems.length} z {total} pozycji
            </p>
          )}
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30%] text-xs sm:text-sm">Nazwa</TableHead>
                  <TableHead className="text-xs sm:text-sm hidden md:table-cell">Kategoria</TableHead>
                  <TableHead className="text-right text-xs sm:text-sm">Cena Bazowa</TableHead>
                  <TableHead className="text-right text-xs sm:text-sm hidden lg:table-cell">Zakres Rynkowy</TableHead>
                  <TableHead className="text-center text-xs sm:text-sm hidden sm:table-cell">Trend</TableHead>
                  <TableHead className="text-center text-xs sm:text-sm hidden lg:table-cell">Pewność</TableHead>
                  <TableHead className="text-xs sm:text-sm hidden xl:table-cell">Weryfikacja</TableHead>
                  <TableHead className="text-center text-xs sm:text-sm">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                      {searchTerm
                        ? "Nie znaleziono pozycji spełniających kryteria"
                        : "Brak pozycji do wyświetlenia"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => {
                    const basePrice = item.base_labor_price + item.base_material_price;
                    const hasRange = item.price_min && item.price_max;

                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium text-xs sm:text-sm truncate max-w-[200px]">{item.name}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline" className="text-xs">
                            {item.category_name}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs sm:text-sm whitespace-nowrap">
                          {formatPrice(basePrice)} zł
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs sm:text-sm hidden lg:table-cell whitespace-nowrap">
                          {hasRange ? (
                            <span>
                              {formatPrice(item.price_min!)} - {formatPrice(item.price_max!)} zł
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center hidden sm:table-cell">
                          <div className="flex items-center justify-center gap-1">
                            {getTrendIcon(item.price_trend)}
                            <span className="text-xs hidden md:inline">{getTrendLabel(item.price_trend)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center hidden lg:table-cell">
                          <div className="flex items-center justify-center gap-1">
                            {getConfidenceIcon(item.confidence_level)}
                            <span className="text-xs hidden xl:inline">{getConfidenceLabel(item.confidence_level)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm text-slate-600 hidden xl:table-cell">
                          {formatDate(item.last_verified_at)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(item)}
                            className="hover:bg-blue-50 dark:hover:bg-blue-950/30 text-xs sm:text-sm"
                          >
                            <Edit className="w-4 h-4 sm:mr-1" />
                            <span className="hidden sm:inline">Edytuj</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {selectedItem && (
        <MarketItemEditor
          item={selectedItem}
          open={isEditorOpen}
          onOpenChange={setIsEditorOpen}
        />
      )}
    </>
  );
}
