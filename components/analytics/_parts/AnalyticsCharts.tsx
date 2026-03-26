"use client";

import { useCallback } from "react";
import { useGlobalSettings, formatDisplayPrice } from "@/hooks/use-global-settings";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp, TrendingDown, BarChart3, PieChart, ShoppingCart,
  Calendar, Target, Activity, AlertCircle, Zap,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProfitabilityData {
  byRegion: Array<{ region: string; revenue: number; projects: number; margin: number }>;
  byType: Array<{ type: string; revenue: number; projects: number; avgValue: number }>;
  materials: Array<{ category: string; cost: number; usage: number; trend: "up" | "down" | "stable" }>;
}

interface PredictionsData {
  nextMonthRevenue: number;
  seasonalTrend: "increasing" | "decreasing" | "stable";
  topOpportunities: Array<{ title: string; potential: number; confidence: number }>;
}

interface AnalyticsChartsProps {
  profitability: ProfitabilityData;
  predictions: PredictionsData;
  totalRevenue: number;
  timeRange: "week" | "month" | "quarter" | "year";
}

export function AnalyticsCharts({ profitability, predictions, totalRevenue, timeRange }: AnalyticsChartsProps) {
  const { vatMode, priceDisplay } = useGlobalSettings();

  const formatCurrency = useCallback((amount: number) => {
    const displayAmount = formatDisplayPrice(amount, vatMode, priceDisplay);
    return new Intl.NumberFormat("pl-PL", {
      style: "currency", currency: "PLN",
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(displayAmount);
  }, [vatMode, priceDisplay]);

  const REGION_COLORS = [
    { bg: "bg-blue-600", text: "text-blue-600" },
    { bg: "bg-green-600", text: "text-green-600" },
    { bg: "bg-orange-500", text: "text-orange-500" },
    { bg: "bg-indigo-600", text: "text-indigo-600" },
  ];

  return (
    <Tabs defaultValue="profitability" className="space-y-4">
      <TabsList className="grid w-full grid-cols-4 bg-slate-100 dark:bg-slate-800 p-1">
        <TabsTrigger value="profitability" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
          <PieChart className="w-4 h-4 mr-2" />
          Rentowność
        </TabsTrigger>
        <TabsTrigger value="materials" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
          <ShoppingCart className="w-4 h-4 mr-2" />
          Materiały
        </TabsTrigger>
        <TabsTrigger value="seasonal" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
          <Calendar className="w-4 h-4 mr-2" />
          Trendy
        </TabsTrigger>
        <TabsTrigger value="predictions" className="data-[state=active]:bg-indigo-700 data-[state=active]:text-white">
          <Activity className="w-4 h-4 mr-2" />
          Prognozy
        </TabsTrigger>
      </TabsList>

      {/* ── Profitability ── */}
      <TabsContent value="profitability" className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border-slate-200 dark:border-slate-800 shadow-lg">
            <CardHeader className="pb-3 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-950/20 dark:to-slate-900/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-600"><PieChart className="h-4 w-4 text-white" /></div>
                  <CardTitle className="text-base">Przychód według regionu</CardTitle>
                </div>
                <Badge variant="secondary" className="text-xs">{profitability.byRegion.length} reg.</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {profitability.byRegion.map((region, index) => {
                const percentage = totalRevenue > 0 ? (region.revenue / totalRevenue) * 100 : 0;
                const color = REGION_COLORS[index % REGION_COLORS.length];
                return (
                  <div key={region.region} className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:shadow-md transition-shadow bg-slate-50/50 dark:bg-slate-900/20">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${color.bg}`} />
                        <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">{region.region}</span>
                      </div>
                      <Badge className={`${color.bg} text-white border-0 text-xs font-mono`}>{formatCurrency(region.revenue)}</Badge>
                    </div>
                    <Progress value={percentage} className="h-1.5 mb-2" />
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" />{region.projects} proj.</span>
                        <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />{region.margin.toFixed(1)}% marża</span>
                      </div>
                      <span className={`font-semibold ${color.text}`}>{percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 shadow-lg">
            <CardHeader className="pb-3 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-orange-50 to-slate-50 dark:from-orange-950/20 dark:to-slate-900/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-orange-600"><BarChart3 className="h-4 w-4 text-white" /></div>
                  <CardTitle className="text-base">Projekty według typu</CardTitle>
                </div>
                <Badge variant="secondary" className="text-xs">{profitability.byType.length} kat.</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {profitability.byType.map((type) => {
                const percentage = totalRevenue > 0 ? (type.revenue / totalRevenue) * 100 : 0;
                return (
                  <div key={type.type} className="p-3 border-2 border-slate-200 dark:border-slate-700 rounded-lg hover:border-orange-400 dark:hover:border-orange-600 hover:shadow-md transition-all bg-white dark:bg-slate-900/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{type.type}</p>
                          <Badge variant="outline" className="text-xs">{type.projects} proj.</Badge>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Średnia: {formatCurrency(type.avgValue)}</p>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-orange-600 text-white border-0 mb-1">{formatCurrency(type.revenue)}</Badge>
                        <p className="text-xs font-semibold text-orange-600">{percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                    <Progress value={percentage} className="h-1.5" />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* ── Materials ── */}
      <TabsContent value="materials" className="space-y-4">
        <Card className="border-slate-200 dark:border-slate-800 shadow-lg">
          <CardHeader className="pb-3 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-orange-50 to-slate-50 dark:from-orange-950/20 dark:to-slate-900/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-orange-600"><ShoppingCart className="h-4 w-4 text-white" /></div>
                <div>
                  <CardTitle className="text-base">Wykorzystanie i koszty materiałów</CardTitle>
                  <CardDescription className="text-xs">Analiza wydatków na materiały</CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">{profitability.materials.length} kategorii</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid gap-3 md:grid-cols-2">
              {profitability.materials.map((material) => (
                <div key={material.category} className="p-4 border-2 border-slate-200 dark:border-slate-700 rounded-lg hover:shadow-md hover:border-orange-300 dark:hover:border-orange-700 transition-all bg-gradient-to-br from-white to-slate-50 dark:from-slate-900/50 dark:to-slate-800/50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2.5 rounded-xl bg-orange-600 shadow-md"><Zap className="h-5 w-5 text-white" /></div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-0.5">{material.category}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{material.usage} proj.</Badge>
                          <div className="flex items-center gap-1">
                            {material.trend === "up" && <><TrendingUp className="h-3 w-3 text-green-500" /><span className="text-xs font-medium text-green-600 dark:text-green-400">↑</span></>}
                            {material.trend === "down" && <><TrendingDown className="h-3 w-3 text-red-500" /><span className="text-xs font-medium text-red-600 dark:text-red-400">↓</span></>}
                            {material.trend === "stable" && <span className="text-xs font-medium text-slate-500">→</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="font-bold text-lg text-slate-900 dark:text-slate-100">{formatCurrency(material.cost)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ── Seasonal ── */}
      <TabsContent value="seasonal" className="space-y-4">
        <Card className="border-slate-200 dark:border-slate-800 shadow-lg">
          <CardHeader className="pb-3 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-green-50 to-slate-50 dark:from-green-950/20 dark:to-slate-900/20">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-green-600"><Calendar className="h-4 w-4 text-white" /></div>
              <div>
                <CardTitle className="text-base">Trendy sezonowe</CardTitle>
                <CardDescription className="text-xs">Analiza sezonowości biznesu</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-6">
                <div className="inline-flex p-6 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 shadow-xl mb-4">
                  <Calendar className="h-16 w-16 text-white" />
                </div>
                <p className="text-2xl font-bold mb-2 text-slate-900 dark:text-slate-100">
                  Trend:{" "}
                  <span className="text-green-600 dark:text-green-400">
                    {predictions.seasonalTrend === "increasing" ? "Wzrostowy ↗" : predictions.seasonalTrend === "decreasing" ? "Spadkowy ↘" : "Stabilny →"}
                  </span>
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  {predictions.seasonalTrend === "increasing" && "Sezon letni pokazuje zwiększone zapotrzebowanie na instalacje elektryczne. Oczekiwany wzrost o 25% w nadchodzącym kwartale."}
                  {predictions.seasonalTrend === "decreasing" && "Sezon zimowy zazwyczaj charakteryzuje się wolniejszym ukończeniem projektów."}
                  {predictions.seasonalTrend === "stable" && "Stabilne zapotrzebowanie przez cały sezon."}
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {([
                  { code: "Q1", name: "Styczeń–Marzec", season: "Zima", icon: "❄️", value: 85 },
                  { code: "Q2", name: "Kwiecień–Czerwiec", season: "Wiosna", icon: "🌱", value: 120 },
                  { code: "Q3", name: "Lipiec–Wrzesień", season: "Lato", icon: "☀️", value: 95 },
                  { code: "Q4", name: "Październik–Grudzień", season: "Jesień", icon: "🍂", value: 110 },
                ] as const).map((quarter, i) => {
                  const colors = [
                    { border: "border-blue-300", bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-600 dark:text-blue-400", badge: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" },
                    { border: "border-green-300", bg: "bg-green-50 dark:bg-green-950/30", text: "text-green-600 dark:text-green-400", badge: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300" },
                    { border: "border-orange-300", bg: "bg-orange-50 dark:bg-orange-950/30", text: "text-orange-600 dark:text-orange-400", badge: "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300" },
                    { border: "border-indigo-300", bg: "bg-indigo-50 dark:bg-indigo-950/30", text: "text-indigo-600 dark:text-indigo-400", badge: "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300" },
                  ];
                  const color = colors[i];
                  return (
                    <div key={quarter.code} className={`p-3 border-2 ${color.border} ${color.bg} dark:border-slate-700 rounded-lg`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">{quarter.icon}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${color.badge}`}>{quarter.code}</span>
                      </div>
                      <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">{quarter.season}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-2 leading-tight">{quarter.name}</p>
                      <p className={`text-2xl font-bold ${color.text}`}>{quarter.value}%</p>
                      <div className="mt-2"><Progress value={quarter.value} className="h-1.5" /></div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ── Predictions ── */}
      <TabsContent value="predictions" className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border-slate-200 dark:border-slate-800 shadow-lg">
            <CardHeader className="pb-3 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-indigo-50 to-slate-50 dark:from-indigo-950/20 dark:to-slate-900/20">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-700"><Activity className="h-4 w-4 text-white" /></div>
                <div>
                  <CardTitle className="text-base">Prognozowany przychód</CardTitle>
                  <CardDescription className="text-xs">ES-Engine — analiza na następny miesiąc</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-800 shadow-xl mb-4">
                  <TrendingUp className="w-12 h-12 text-white" />
                </div>
                <p className="text-4xl font-bold mb-2 text-indigo-600 dark:text-indigo-400">{formatCurrency(predictions.nextMonthRevenue)}</p>
                <Badge className="mb-4 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                  Prognoza na {timeRange === "week" ? "następny tydzień" : "następny miesiąc"}
                </Badge>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Pewność prognozy</span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">75%</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
                <div className="p-3 border border-indigo-200 dark:border-indigo-800 rounded-lg bg-indigo-50 dark:bg-indigo-950/30">
                  <p className="text-xs text-indigo-800 dark:text-indigo-300 flex items-center justify-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Oparte na 12 miesiącach danych historycznych
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 shadow-lg">
            <CardHeader className="pb-3 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-green-50 to-slate-50 dark:from-green-950/20 dark:to-slate-900/20">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-green-600"><Target className="h-4 w-4 text-white" /></div>
                <div>
                  <CardTitle className="text-base">Najlepsze możliwości</CardTitle>
                  <CardDescription className="text-xs">Potencjalne projekty do rozwoju</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {predictions.topOpportunities.map((opp, index) => {
                const badgeColors = ["bg-green-600", "bg-blue-600", "bg-orange-600"];
                return (
                  <div key={index} className="p-3 border-2 border-slate-200 dark:border-slate-700 rounded-lg hover:shadow-md hover:border-green-300 dark:hover:border-green-700 transition-all bg-gradient-to-r from-white to-green-50/30 dark:from-slate-900/50 dark:to-green-950/10">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start gap-2 flex-1">
                        <div className="px-2 py-1 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-bold text-xs">#{index + 1}</div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-0.5">{opp.title}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">Potencjał wzrostu</p>
                        </div>
                      </div>
                      <Badge className={`${badgeColors[index % badgeColors.length]} text-white border-0 ml-2`}>{formatCurrency(opp.potential)}</Badge>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 dark:text-slate-400">Pewność</span>
                        <span className="font-semibold text-green-600 dark:text-green-400">{Math.round(opp.confidence * 100)}%</span>
                      </div>
                      <Progress value={opp.confidence * 100} className="h-1.5" />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}
