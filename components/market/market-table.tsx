"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, MapPin, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus, Lock, Hammer, Package, Grid3x3, List, ArrowUpDown, Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MarketDataResult } from "@/app/dashboard/market/actions";
import { REGIONAL_MODIFIERS, getRegionalPrice, formatPrice } from "@/lib/data/market-data";
import { getWeeklyTrend, formatTrendValue } from "@/lib/utils/market-trends";

interface MarketTableProps {
  initialData: MarketDataResult;
  categories: Array<{ id: string; name: string }>;
  voivodeships: Array<{ id: string; name: string }>;
  initialSearch: string;
  initialCategory: string;
  initialPriceType: "labor" | "material";
  isSubscribed: boolean;
  totalCatalogCount: number;
}

export function MarketTable({
  initialData,
  categories,
  voivodeships,
  initialSearch,
  initialCategory,
  initialPriceType,
  isSubscribed,
  totalCatalogCount,
}: MarketTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selectedRegion, setSelectedRegion] = useState<string>("mazowieckie");
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [priceView, setPriceView] = useState<"labor" | "material">(initialPriceType);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"price-asc" | "price-desc" | "name-asc" | "name-desc">("name-asc");
  const [trendFilter, setTrendFilter] = useState<"all" | "up" | "down" | "stable">("all");

  const handleSearch = (value: string) => {
    setSearch(value);
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    const params = new URLSearchParams(searchParams);
    if (value && value !== "all") {
      params.set("category", value);
    } else {
      params.delete("category");
    }
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handlePriceTypeChange = (value: "labor" | "material") => {
    setPriceView(value);
    const params = new URLSearchParams(searchParams);
    params.set("priceType", value);
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const regionalModifier = REGIONAL_MODIFIERS[selectedRegion] || 1.0;
  const modifierPercent = ((regionalModifier - 1) * 100).toFixed(0);
  const modifierSign = regionalModifier >= 1 ? "+" : "";

  // Sort and filter items
  const sortedItems = useMemo(() => {
    let items = [...initialData.items];

    // Filter by trend first
    if (trendFilter !== "all") {
      items = items.filter(item => {
        const trend = getWeeklyTrend(item.id);
        return trend.direction === trendFilter;
      });
    }

    return items.sort((a, b) => {
      if (sortBy === "name-asc") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "name-desc") {
        return b.name.localeCompare(a.name);
      } else if (sortBy === "price-asc" || sortBy === "price-desc") {
        const priceA = priceView === "labor"
          ? getRegionalPrice(a.base_labor_price, selectedRegion)
          : getRegionalPrice(a.base_material_price, selectedRegion);
        const priceB = priceView === "labor"
          ? getRegionalPrice(b.base_labor_price, selectedRegion)
          : getRegionalPrice(b.base_material_price, selectedRegion);

        return sortBy === "price-asc" ? priceA - priceB : priceB - priceA;
      }
      return 0;
    });
  }, [initialData.items, sortBy, priceView, selectedRegion, trendFilter]);

  return (
    <>
      {/* Compact Control Bar */}
      <Card className="mb-4 border-slate-200 dark:border-slate-800 shadow-lg">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
            {/* Region Selector */}
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="bg-white dark:bg-slate-900">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-indigo-600" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                {voivodeships.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={category || "all"} onValueChange={handleCategoryChange}>
              <SelectTrigger className="bg-white dark:bg-slate-900">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-blue-600" />
                  <SelectValue placeholder="Wszystkie" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort Selector */}
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="bg-white dark:bg-slate-900">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-purple-600" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Nazwa (A-Z)</SelectItem>
                <SelectItem value="name-desc">Nazwa (Z-A)</SelectItem>
                <SelectItem value="price-asc">Cena (rosnąco)</SelectItem>
                <SelectItem value="price-desc">Cena (malejąco)</SelectItem>
              </SelectContent>
            </Select>

            {/* Search */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="market-search"
                name="market-search"
                type="text"
                aria-label="Szukaj pozycji rynkowych"
                placeholder="Szukaj pozycji..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 bg-white dark:bg-slate-900"
              />
            </div>
          </div>

          {/* Type Toggle + View Mode + Trend Filter + Regional Info */}
          <div className="flex items-center justify-between gap-3">
            <Tabs value={priceView} onValueChange={(v) => handlePriceTypeChange(v as "labor" | "material")} className="flex-1">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="labor" className="flex items-center gap-2 data-[state=active]:bg-green-600 data-[state=active]:text-white">
                  <Hammer className="w-4 h-4" />
                  Robocizna
                </TabsTrigger>
                <TabsTrigger value="material" className="flex items-center gap-2 data-[state=active]:bg-orange-600 data-[state=active]:text-white">
                  <Package className="w-4 h-4" />
                  Materiały
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-0.5 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "h-8 w-8 p-0 transition-all",
                  viewMode === "grid"
                    ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                )}
                title="Karty"
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("list")}
                className={cn(
                  "h-8 w-8 p-0 transition-all",
                  viewMode === "list"
                    ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                )}
                title="Lista"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>

            {/* Trend Filter */}
            <div className="flex items-center gap-0.5 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTrendFilter(trendFilter === "up" ? "all" : "up")}
                className={cn(
                  "h-8 w-8 p-0 transition-all",
                  trendFilter === "up"
                    ? "bg-blue-600 shadow-sm hover:bg-blue-700"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                )}
                title="Rosnące"
              >
                <TrendingUp className={cn("w-4 h-4", trendFilter === "up" ? "text-white" : "text-green-600")} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTrendFilter(trendFilter === "down" ? "all" : "down")}
                className={cn(
                  "h-8 w-8 p-0 transition-all",
                  trendFilter === "down"
                    ? "bg-blue-600 shadow-sm hover:bg-blue-700"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                )}
                title="Spadające"
              >
                <TrendingDown className="w-4 h-4 text-red-600" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PRO Notice */}
      {!isSubscribed && (
        <Card className="mb-4 border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-amber-600" />
              <div>
                <h4 className="font-semibold text-sm text-amber-900 dark:text-amber-100 mb-1">
                  Ceny dostępne w wersji PRO
                </h4>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Przejdź na plan PRO aby zobaczyć szczegółowe ceny i trendy rynkowe
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {search || category || trendFilter !== "all"
              ? `Znaleziono ${sortedItems.length}`
              : `${totalCatalogCount} pozycji`}
          </h3>
        </div>

        {sortedItems.length === 0 ? (
          <Card className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-12 text-center">
              <p className="text-slate-500">Nie znaleziono pozycji</p>
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sortedItems.map((item) => {
              const regionalMaterial = getRegionalPrice(item.base_material_price, selectedRegion);
              const regionalLabor = getRegionalPrice(item.base_labor_price, selectedRegion);
              const displayPrice = priceView === "labor" ? regionalLabor : regionalMaterial;
              const trend = getWeeklyTrend(item.id);

              return (
                <Card
                  key={item.id}
                  className={cn(
                    "border-2 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]",
                    priceView === "labor"
                      ? "border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600"
                      : "border-orange-200 dark:border-orange-800 hover:border-orange-400 dark:hover:border-orange-600"
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-1 line-clamp-2">
                          {item.name}
                        </h4>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {item.category_name}
                          </Badge>
                          <span className="text-xs text-slate-500">{item.unit}</span>
                          {item.knr_code && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded px-1.5 py-0.5">
                              <Hash className="w-2.5 h-2.5" />
                              {item.knr_code}
                            </span>
                          )}
                        </div>
                      </div>

                      {isSubscribed && (
                        <div className={cn(
                          "p-1.5 rounded-lg flex items-center gap-1",
                          trend.direction === "up" && "bg-green-100 dark:bg-green-900/30",
                          trend.direction === "down" && "bg-red-100 dark:bg-red-900/30",
                          trend.direction === "stable" && "bg-slate-100 dark:bg-slate-800"
                        )}>
                          {trend.direction === "up" && <TrendingUp className="w-3 h-3 text-green-600" />}
                          {trend.direction === "down" && <TrendingDown className="w-3 h-3 text-red-600" />}
                          {trend.direction === "stable" && <Minus className="w-3 h-3 text-slate-400" />}
                          <span className={cn(
                            "text-xs font-mono font-bold",
                            trend.direction === "up" && "text-green-600",
                            trend.direction === "down" && "text-red-600",
                            trend.direction === "stable" && "text-slate-500"
                          )}>
                            {formatTrendValue(trend.value)}
                          </span>
                        </div>
                      )}

                      {!isSubscribed && (
                        <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                          <Lock className="w-3 h-3 text-slate-400" />
                        </div>
                      )}
                    </div>

                    <div className={cn(
                      "p-4 rounded-lg mt-2",
                      priceView === "labor"
                        ? "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20"
                        : "bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20"
                    )}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                            {priceView === "labor" ? "Robocizna" : "Materiał"}
                          </p>
                          {isSubscribed ? (
                            <p className={cn(
                              "text-2xl font-bold",
                              priceView === "labor" ? "text-green-600 dark:text-green-400" : "text-orange-600 dark:text-orange-400"
                            )}>
                              {formatPrice(displayPrice)}
                            </p>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Lock className="w-4 h-4 text-slate-400" />
                              <span className="text-xl font-bold text-slate-400">****</span>
                            </div>
                          )}
                        </div>

                        <div className={cn(
                          "p-3 rounded-lg",
                          priceView === "labor"
                            ? "bg-green-200 dark:bg-green-900/50"
                            : "bg-orange-200 dark:bg-orange-900/50"
                        )}>
                          {priceView === "labor" ? (
                            <Hammer className={cn("w-6 h-6", "text-green-600 dark:text-green-400")} />
                          ) : (
                            <Package className={cn("w-6 h-6", "text-orange-600 dark:text-orange-400")} />
                          )}
                        </div>
                      </div>

                      {isSubscribed && regionalModifier !== 1.0 && (
                        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-600 dark:text-slate-400">Cena bazowa:</span>
                            <span className="font-mono text-slate-500">
                              {formatPrice(priceView === "labor" ? item.base_labor_price : item.base_material_price)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          /* List View */
          <Card className="border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-800">
                    <TableHead className="w-[35%]">Nazwa</TableHead>
                    <TableHead>Kategoria</TableHead>
                    <TableHead className="text-center">Jedn.</TableHead>
                    <TableHead className="text-center">{priceView === "labor" ? "Robocizna" : "Materiał"}</TableHead>
                    <TableHead className="text-center">Trend t/t</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedItems.map((item) => {
                    const regionalMaterial = getRegionalPrice(item.base_material_price, selectedRegion);
                    const regionalLabor = getRegionalPrice(item.base_labor_price, selectedRegion);
                    const displayPrice = priceView === "labor" ? regionalLabor : regionalMaterial;
                    const trend = getWeeklyTrend(item.id);

                    return (
                      <TableRow
                        key={item.id}
                        className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-cyan-50/50 dark:hover:from-blue-950/20 dark:hover:to-cyan-950/20 transition-colors"
                      >
                        <TableCell className="font-medium">
                          <div>{item.name}</div>
                          {item.knr_code && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded px-1.5 py-0.5 mt-0.5">
                              <Hash className="w-2.5 h-2.5" />
                              {item.knr_code}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {item.category_name}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-sm">{item.unit}</TableCell>
                        <TableCell className="text-center">
                          {isSubscribed ? (
                            <span className={cn(
                              "font-bold",
                              priceView === "labor" ? "text-green-600" : "text-orange-600"
                            )}>
                              {formatPrice(displayPrice)}
                            </span>
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              <Lock className="w-3 h-3 text-slate-400" />
                              <span className="text-slate-400">****</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {isSubscribed ? (
                            <Badge variant="outline" className={cn(
                              "text-xs font-mono",
                              trend.direction === "up" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
                              trend.direction === "down" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
                              trend.direction === "stable" && "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                            )}>
                              {trend.direction === "up" && <TrendingUp className="w-3 h-3 inline mr-1" />}
                              {trend.direction === "down" && <TrendingDown className="w-3 h-3 inline mr-1" />}
                              {trend.direction === "stable" && <Minus className="w-3 h-3 inline mr-1" />}
                              {formatTrendValue(trend.value)}
                            </Badge>
                          ) : (
                            <Lock className="w-3 h-3 text-slate-400 mx-auto" />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>

      {/* Pagination */}
      {initialData.totalPages > 1 && (
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Strona {initialData.page} z {initialData.totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePageChange(initialData.page - 1)}
                  disabled={initialData.page === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Poprzednia
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePageChange(initialData.page + 1)}
                  disabled={initialData.page === initialData.totalPages}
                >
                  Następna
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
