import type { Metadata } from "next";
import { SYSTEM_STATS_FALLBACK } from "@/constants/system";
import { getCatalogItems, getCatalogCategories, getCategoryItemCounts, getTotalCatalogCount, getFavoriteCatalogItemIds, getUserCategoriesCount } from "./actions";
import { CatalogTable } from "./catalog-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, Lightbulb, PackageSearch, TrendingUp, Star, Layers, DollarSign, Zap, Package } from "lucide-react";
import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { getUserProfile } from "../actions";
import { getUserTeam } from "../team/actions";

// Force dynamic rendering to always get fresh data
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Katalog Materiałów Elektrycznych",
  description: `Profesjonalna baza ${SYSTEM_STATS_FALLBACK.normsLabelPlus} norm KNR z cenami materiałów i robocizny — wyszukiwanie, filtrowanie, ulubione i własne pozycje`,
};

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string; type?: string; page?: string; favorites?: string; view?: string; mode?: string }>;
}) {
  const params = await searchParams;
  const search = params.search || "";
  const categoryId = params.category || "";
  const type = params.type || "all";
  const page = Number(params.page) || 1;
  const showFavorites = params.favorites === "true";

  // Multi-mode: own | engine | hybrid (new) — or legacy view param
  const modeParam = params.mode || params.view || "hybrid";
  const effectiveViewMode: "all" | "core" | "own" =
    modeParam === "engine" ? "core" :
    modeParam === "hybrid" ? "all" :
    modeParam === "core"   ? "core" :
    "own";

  const profile = await getUserProfile();

  const [catalogData, categories, itemCounts, totalCount, favoriteIds, userTeam, userCategoriesCount] = await Promise.all([
    getCatalogItems({ search, categoryId, type, page, pageSize: 20, favoritesOnly: showFavorites, viewMode: effectiveViewMode }).catch(() => ({ items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 })),
    getCatalogCategories().catch(() => []),
    getCategoryItemCounts(effectiveViewMode).catch(() => ({})),
    getTotalCatalogCount(effectiveViewMode).catch(() => 0),
    getFavoriteCatalogItemIds().catch(() => []),
    getUserTeam().catch(() => null),
    getUserCategoriesCount().catch(() => 0),
  ]);

  const isPro = profile?.is_pro || false;

  // Calculate statistics
  const totalItems = totalCount;
  const favoritesCount = favoriteIds.length;
  const categoriesCount = userCategoriesCount;
  const customItemsCount = catalogData.items.filter(item => item.user_id).length;

  // Calculate most used category
  const sortedCounts = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]);
  const topCategory = sortedCounts[0] ? categories.find(c => c.id === sortedCounts[0][0])?.name : "Brak";

  return (
    <div className="min-h-screen animate-in fade-in duration-500">
      <PageContainer maxWidth="xl">
        {/* Header */}
        <PageHeader
          title="Katalog Pozycji"
          description={`Baza ${SYSTEM_STATS_FALLBACK.normsLabelPlus} norm KNR z cenami • Własne pozycje • Przełączaj: Własne / ES-Engine / Hybrydowy`}
          icon={PackageSearch}
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Katalog Pozycji" }
          ]}
        />

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <Card className="border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Wszystkie pozycje</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{totalItems}</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                  <Layers className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Kategorie</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{categoriesCount}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">własnych</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <Zap className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Własne pozycje</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{customItemsCount}</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <Star className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Ulubione</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{favoritesCount}</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                  <TrendingUp className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Top kategoria</p>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-50 truncate">{topCategory || "—"}</p>
            </CardContent>
          </Card>
        </div>


        {/* Categories Overview - Compact */}
        <Card className="mb-6 border-slate-200 dark:border-slate-800 shadow-lg">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-orange-600">
                  <Layers className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Rozkład pozycji według kategorii</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Przegląd Twojego katalogu</p>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">{categoriesCount} własnych kategorii</Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {sortedCounts.slice(0, 12).map(([catId, count]) => {
                const category = categories.find(c => c.id === catId);
                if (!category) return null;
                const colors = [
                  'bg-blue-600', 'bg-green-600', 'bg-orange-600', 'bg-indigo-600',
                  'bg-cyan-600', 'bg-emerald-600', 'bg-amber-600', 'bg-violet-600',
                  'bg-sky-600', 'bg-teal-600', 'bg-rose-600', 'bg-fuchsia-600'
                ];
                const idx = sortedCounts.findIndex(([id]) => id === catId);
                const bgColor = colors[idx % colors.length];
                const isActive = categoryId === catId;

                return (
                  <Link
                    key={catId}
                    href={isActive ? "/dashboard/catalog" : `/dashboard/catalog?category=${catId}`}
                    className={`block p-2.5 border rounded-lg transition-all cursor-pointer ${
                      isActive
                        ? "border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-950/40 ring-2 ring-blue-400/30 dark:ring-blue-500/20 shadow-md"
                        : "border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md hover:bg-blue-50/50 dark:hover:bg-blue-950/20"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${bgColor}`} />
                      <p className={`text-xs font-medium truncate flex-1 ${
                        isActive ? "text-blue-700 dark:text-blue-300" : "text-slate-900 dark:text-slate-100"
                      }`}>{category.name}</p>
                    </div>
                    <p className={`text-lg font-bold ${
                      isActive ? "text-blue-700 dark:text-blue-200" : "text-slate-900 dark:text-slate-50"
                    }`}>{count}</p>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Table Component */}
        <CatalogTable
          initialData={catalogData}
          categories={categories}
          initialSearch={search}
          initialCategory={categoryId}
          initialType={type}
          isPro={isPro}
          itemCounts={itemCounts}
          totalCatalogCount={totalCount}
          favoriteIds={favoriteIds}
          showFavorites={showFavorites}
          userTeam={userTeam}
          currentView={effectiveViewMode}
        />

        {/* Bottom Tips Section */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-green-600 flex-shrink-0">
                  <Star className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-1">
                    Baza ES-Engine
                  </h4>
                  <p className="text-xs text-green-800 dark:text-green-300">
                    {SYSTEM_STATS_FALLBACK.normsLabelPlus} norm KNR z cenami materiału i robocizny. Przełącz tryb w panelu kategorii po lewej.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-orange-600 flex-shrink-0">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-orange-900 dark:text-orange-100 mb-1">
                    Własne pozycje i ES Creator
                  </h4>
                  <p className="text-xs text-orange-800 dark:text-orange-300">
                    Dodawaj pozycje ręcznie lub generuj przez AI. Każda ma osobną cenę materiału i robocizny — używasz ich w kosztorysach.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-600 flex-shrink-0">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    Ceny regionalne
                  </h4>
                  <p className="text-xs text-blue-800 dark:text-blue-300">
                    Stawki robocizny są korygowane wg województwa (np. Mazowieckie +15%). Region ustawiasz w Ustawienia → Finanse.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Extra spacing at bottom */}
        <div className="h-12"></div>
      </PageContainer>
    </div>
  );
}
