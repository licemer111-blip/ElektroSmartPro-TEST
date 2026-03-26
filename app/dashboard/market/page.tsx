import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, TrendingUp, TrendingDown, MapPin, Clock, Zap, Target, AlertCircle, Percent, Package, Activity, ArrowUpRight, ArrowDownRight, Minus, Flame, ArrowUp, ArrowDown, DollarSign, Users } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { getUserProfile } from "../actions";
import { getCurrentWeek } from "@/lib/data/market-data";
import { getMarketPageTrends, getVoivodeshipWeeklyDelta } from "@/lib/utils/market-trends";
import { MarketTable } from "@/components/market/market-table";
import { getMarketData, getMarketCategories, getTotalCatalogCount } from "./actions";

// Force dynamic rendering to always get fresh is_pro status
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Monitor Rynku Elektrycznego",
  description: "Aktualne ceny materiałów elektrycznych, trendy cenowe miedzi i kabli, stawki robocizny w 16 województwach — bądź na bieżąco z rynkiem 2026",
};

const VOIVODESHIPS_BASE = [
  { id: "mazowieckie",        name: "Mazowieckie",        modifier: 1.20 },
  { id: "dolnoslaskie",       name: "Dolnośląskie",       modifier: 1.12 },
  { id: "malopolskie",        name: "Małopolskie",         modifier: 1.10 },
  { id: "slaskie",            name: "Śląskie",             modifier: 1.08 },
  { id: "wielkopolskie",      name: "Wielkopolskie",       modifier: 1.06 },
  { id: "pomorskie",          name: "Pomorskie",           modifier: 1.10 },
  { id: "zachodniopomorskie", name: "Zachodniopomorskie",  modifier: 1.02 },
  { id: "lubuskie",           name: "Lubuskie",            modifier: 0.96 },
  { id: "lodzkie",            name: "Łódzkie",             modifier: 1.00 },
  { id: "kujawsko-pomorskie", name: "Kujawsko-Pomorskie",  modifier: 0.96 },
  { id: "warminsko-mazurskie",name: "Warmińsko-Mazurskie", modifier: 0.85 },
  { id: "podlaskie",          name: "Podlaskie",           modifier: 0.88 },
  { id: "lubelskie",          name: "Lubelskie",           modifier: 0.92 },
  { id: "swietokrzyskie",     name: "Świętokrzyskie",      modifier: 0.90 },
  { id: "opolskie",           name: "Opolskie",            modifier: 0.94 },
  { id: "podkarpackie",       name: "Podkarpackie",        modifier: 0.88 },
];

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

  const [profile, marketData, categories, totalCatalogCount] = await Promise.all([
    getUserProfile(),
    getMarketData({ search, categoryId, priceType, page, pageSize: 20 }),
    getMarketCategories(),
    getTotalCatalogCount(),
  ]);

  const isPro = profile?.is_pro || false;
  const currentWeek = getCurrentWeek();
  const trends = getMarketPageTrends();

  const VOIVODESHIPS = VOIVODESHIPS_BASE.map((v) => {
    const weekly = getVoivodeshipWeeklyDelta(v.id);
    return { ...v, trend: weekly.weeklyDirection, weeklyDelta: weekly.weeklyDelta };
  });

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
              Tydzień {currentWeek}/2026 • Ceny i trendy w czasie rzeczywistym
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
                  <Badge className="bg-white/30 text-white border-white/40">t/t</Badge>
                </div>
                <div className="mb-1">
                  <div className="text-4xl font-bold mb-1">{trends.laborTrend > 0 ? "+" : ""}{trends.laborTrend}%</div>
                  <div className="text-sm text-green-100">Robocizna</div>
                </div>
                <div className="flex items-center gap-2 text-xs text-green-100">
                  <ArrowUp className="w-3 h-3" />
                  <span>{trends.laborTrend >= 2 ? "Wzrost cen robocizny" : "Stabilny wzrost"}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <Badge className="bg-white/30 text-white border-white/40">t/t</Badge>
                </div>
                <div className="mb-1">
                  <div className="text-4xl font-bold mb-1">{trends.materialTrend > 0 ? "+" : ""}{trends.materialTrend}%</div>
                  <div className="text-sm text-orange-100">Materiały</div>
                </div>
                <div className="flex items-center gap-2 text-xs text-orange-100">
                  {trends.materialTrend >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                  <span>Wzrost tydzień do tygodnia</span>
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
                          {region.weeklyDelta > 0 ? "+" : ""}{region.weeklyDelta}p.t/t
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
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Liderzy wzrostu</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600 dark:text-slate-400">Mazowieckie</span>
                    <div className="flex items-center gap-1">
                      <div className="h-1.5 w-16 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 rounded-full" style={{ width: '100%' }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600 dark:text-slate-400">Śląskie</span>
                    <div className="flex items-center gap-1">
                      <div className="h-1.5 w-16 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600 dark:text-slate-400">Pomorskie</span>
                    <div className="flex items-center gap-1">
                      <div className="h-1.5 w-16 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-500 rounded-full" style={{ width: '60%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Market Activity */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-4 h-4 text-green-600" />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Aktywność rynku</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-600 dark:text-slate-400">Stabilne ceny</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{trends.stablePct}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${trends.stablePct}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-600 dark:text-slate-400">Wzrosty</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{trends.upPct}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full" style={{ width: `${trends.upPct}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-600 dark:text-slate-400">Spadki</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{trends.downPct}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${trends.downPct}%` }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Last Update */}
            <Card className="border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <div>
                    <div className="text-xs font-semibold text-indigo-900 dark:text-indigo-100">Ostatnia aktualizacja</div>
                    <div className="text-xs text-indigo-700 dark:text-indigo-300">{trends.lastUpdateDay}, T{currentWeek}</div>
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
          isSubscribed={isPro}
          totalCatalogCount={totalCatalogCount}
        />

        <div className="h-8"></div>
      </PageContainer>
    </div>
  );
}
