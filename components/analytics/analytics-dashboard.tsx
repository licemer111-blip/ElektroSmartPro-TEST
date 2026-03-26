"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Target, ShoppingCart, Activity } from "lucide-react";
import { AnalyticsFilters } from "./_parts/AnalyticsFilters";
import { AnalyticsStatsGrid } from "./_parts/AnalyticsStatsGrid";
import { AnalyticsCharts } from "./_parts/AnalyticsCharts";

interface AnalyticsData {
  overview: {
    totalRevenue: number;
    totalProjects: number;
    averageProjectValue: number;
    growthRate: number;
    activeClients: number;
    conversionRate: number;
  };
  profitability: {
    byRegion: Array<{ region: string; revenue: number; projects: number; margin: number }>;
    byType: Array<{ type: string; revenue: number; projects: number; avgValue: number }>;
    materials: Array<{ category: string; cost: number; usage: number; trend: "up" | "down" | "stable" }>;
  };
  predictions: {
    nextMonthRevenue: number;
    seasonalTrend: "increasing" | "decreasing" | "stable";
    topOpportunities: Array<{ title: string; potential: number; confidence: number }>;
  };
}

interface AnalyticsDashboardProps {
  data: AnalyticsData;
  timeRange: "week" | "month" | "quarter" | "year";
  onTimeRangeChange: (range: "week" | "month" | "quarter" | "year") => void;
}

export function AnalyticsDashboard({ data, timeRange, onTimeRangeChange }: AnalyticsDashboardProps) {
  return (
    <div className="space-y-6 pb-8">
      <AnalyticsFilters timeRange={timeRange} onTimeRangeChange={onTimeRangeChange} />

      <AnalyticsStatsGrid overview={data.overview} />

      <AnalyticsCharts
        profitability={data.profitability}
        predictions={data.predictions}
        totalRevenue={data.overview.totalRevenue}
        timeRange={timeRange}
      />

      {/* Bottom Banner */}
      <Card className="border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50">
        <CardContent className="p-5">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-green-600 flex-shrink-0">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">Zwiększ rentowność</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">Skoncentruj się na regionach z najwyższą marżą</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-orange-600 flex-shrink-0">
                <ShoppingCart className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">Optymalizuj koszty</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">Monitoruj trendy cenowe materiałów</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-indigo-700 flex-shrink-0">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">Planuj z ES-Engine</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">Prognozy ES-Engine wspierają planowanie zleceń</p>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
              <strong>Wskazówka:</strong> Dane aktualizują się automatycznie przy każdej zmianie projektów 📈
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}