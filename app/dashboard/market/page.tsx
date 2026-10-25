import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, TrendingUp, MapPin, Clock, Zap, Target, AlertCircle, Activity, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { MarketTable } from "@/components/market/market-table";
import { getMarketData, getMarketCategories, getTotalCatalogCount } from "./actions";
import { POLISH_REGIONS_SORTED } from "@/lib/config/regions";

// Force dynamic rendering to always get fresh is_pro status
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Monitor Rynku Elektrycznego",
  description: "Ceny katalogu i współczynniki robocizny dla 16 województw. Materiały bez korekty regionu.",
};

const VOIVODESHIPS = POLISH_REGIONS_SORTED.map((region) => ({
  id: region.id,
  name: region.name,
  modifier: region.multiplier,
  trend: region.multiplier > 1.001 ? "up" as const : region.multiplier < 0.999 ? "down" as const : "stable" as const,
}));

export default async function MarketAnalysisPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string; priceType?: string; page?: string }>;
}) {
  const params = await searchParams;
  const search = params.search || "";
  const categoryId = params.category || "";
  const priceType = (params.priceType as "labor" | "material") || "labor";
  const page = Number(params.page) || 1;

  const [marketData, categories, totalCatalogCount] = await Promise.all([
    getMarketData({ search, categoryId, priceType, page, pageSize: 20 }),
    getMarketCategories(),
    getTotalCatalogCount(),
  ]);

  const topRegions = VOIVODESHIPS.slice(0, 3);
  const highest = VOIVODESHIPS[0];
  const lowest = VOIVODESHIPS[VOIVODESHIPS.length - 1];

  return (
    <div className="min-h-screen animate-in fade-in duration-500 bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-950 dark:to-blue-950/10">
      <PageContainer maxWidth="xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-600/20">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Monitor Rynku</h1>
            </div>
            <p className="text-slate-500 dark:text-slate-400 ml-12">
              Współczynnik robocizny względem średniej krajowej. Materiały bez korekty.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{totalCatalogCount}+</div>
              <div className="text-xs text-slate-500">pozycji</div>
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>
            <div className="text-right hidden sm:block">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">16</div>
              <div className="text-xs text-slate-500">woj.</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Left Column - Trends */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            {/* Weekly Trends */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Zap className="w-5 h-5" />
                  </div>
                  <Badge className="bg-white/30 text-white border-white/40">max</Badge>
                </div>
                <div className="mb-1">
                  <div className="text-4xl font-bold mb-1">+{((highest.modifier - 1) * 100).toFixed(0)}%</div>
                  <div className="text-sm text-green-100">{highest.name}</div>
                </div>
                <div className="flex items-center gap-2 text-xs text-green-100">
                  <span>Najwyższy współczynnik robocizny</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <Badge className="bg-white/30 text-white border-white/40">min</Badge>
                </div>
                <div className="mb-1">
                  <div className="text-4xl font-bold mb-1">{((lowest.modifier - 1) * 100).toFixed(0)}%</div>
                  <div className="text-sm text-orange-100">{lowest.name}</div>
                </div>
                <div className="flex items-center gap-2 text-xs text-orange-100">
                  <span>Najniższy współczynnik robocizny</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Middle Column - Regional Heatmap */}
          <div className="col-span-12 lg:col-span-6">
            <Card className="border-slate-200 dark:border-slate-800 shadow-lg h-full">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Mapa cenowa Polski</h3>
                  </div>
                  <Badge variant="outline" className="text-xs">Województwa</Badge>
                </div>

                {/* Regional Grid */}
                <div className="grid grid-cols-3 gap-2">
                  {VOIVODESHIPS.map((region) => {
                    const percentage = (region.modifier - 1) * 100;
                    const isHigh = percentage >= 10;
                    const isLow = percentage < 0;
                    return (
                      <div
                        key={region.id}
                        className={`p-3 rounded-lg border-2 transition-all hover:scale-105 cursor-pointer ${isHigh
                          ? 'bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-800'
                          : isLow
                            ? 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800'
                            : 'bg-blue-50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800'
                          }`}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-tight">{region.name.split(' ')[0]}</span>
                          {region.trend === "up" && <ArrowUpRight className="w-3 h-3 text-green-600" />}
                          {region.trend === "down" && <ArrowDownRight className="w-3 h-3 text-red-500" />}
                          {region.trend === "stable" && <Minus className="w-3 h-3 text-slate-400" />}
                        </div>
                        <div className={`text-lg font-bold ${isHigh ? 'text-green-600 dark:text-green-400' : isLow ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'
                          }`}>
                          {percentage > 0 ? '+' : ''}{percentage.toFixed(0)}%
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          ×{region.modifier.toFixed(2)} robocizna
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 p-3 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-semibold text-indigo-900 dark:text-indigo-100">Legenda</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px]">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-green-400"></div>
                      <span className="text-slate-600 dark:text-slate-400">Wysoko (+10%) 💰</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-blue-400"></div>
                      <span className="text-slate-600 dark:text-slate-400">Średnio</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-red-400"></div>
                      <span className="text-slate-600 dark:text-slate-400">Nisko (&lt;0%) ⚠️</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Quick Stats */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            {/* Price Leaders */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Najwyższy współczynnik</h3>
                </div>
                <div className="space-y-2">
                  {topRegions.map((region) => (
                    <div key={region.id} className="flex items-center justify-between">
                      <span className="text-xs text-slate-600 dark:text-slate-400">{region.name}</span>
                      <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        ×{region.modifier.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Market Activity */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-4 h-4 text-green-600" />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Jak liczy wycena</h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Województwo mnoży tylko robociznę. Cena materiału w katalogu zostaje bez tej korekty. To stałe współczynniki, nie notowanie z giełdy.
                </p>
              </CardContent>
            </Card>

            {/* Last Update */}
            <Card className="border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <div>
                    <div className="text-xs font-semibold text-indigo-900 dark:text-indigo-100">Źródło współczynnika</div>
                    <div className="text-xs text-indigo-700 dark:text-indigo-300">Ten sam zestaw, co w kosztorysie</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Market Data Table */}
        <MarketTable
          initialData={marketData}
          categories={categories}
          voivodeships={VOIVODESHIPS}
          initialSearch={search}
          initialCategory={categoryId}
          initialPriceType={priceType}
          isSubscribed={true}
          totalCatalogCount={totalCatalogCount}
        />

        <div className="h-8"></div>
      </PageContainer>
    </div>
  );
}
