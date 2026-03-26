"use client";

import { useCallback } from "react";
import { useGlobalSettings, formatDisplayPrice } from "@/hooks/use-global-settings";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DollarSign, BarChart3, Target, Users, Percent,
  ArrowUpRight, Activity, CheckCircle,
} from "lucide-react";

interface OverviewData {
  totalRevenue: number;
  totalProjects: number;
  averageProjectValue: number;
  growthRate: number;
  activeClients: number;
  conversionRate: number;
}

interface AnalyticsStatsGridProps {
  overview: OverviewData;
}

export function AnalyticsStatsGrid({ overview }: AnalyticsStatsGridProps) {
  const { vatMode, priceDisplay } = useGlobalSettings();

  const formatCurrency = useCallback((amount: number) => {
    const displayAmount = formatDisplayPrice(amount, vatMode, priceDisplay);
    return new Intl.NumberFormat("pl-PL", {
      style: "currency", currency: "PLN",
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(displayAmount);
  }, [vatMode, priceDisplay]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
      {/* Revenue — wide card */}
      <Card className="col-span-2 border-0 shadow-lg bg-gradient-to-br from-blue-600 to-indigo-700 text-white overflow-hidden relative">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
              <DollarSign className="h-5 w-5" />
            </div>
            <Badge className="bg-white/20 text-white border-0 text-xs">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              {overview.growthRate.toFixed(1)}%
            </Badge>
          </div>
          <div>
            <p className="text-xs font-medium opacity-80 mb-1">Całkowity przychód</p>
            <p className="text-2xl font-bold mb-1">{formatCurrency(overview.totalRevenue)}</p>
            <div className="flex items-center gap-2 text-xs opacity-75">
              <CheckCircle className="h-3 w-3" />
              <span>+{formatCurrency(overview.totalRevenue * 0.18)} vs poprzedni</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects */}
      <Card className="border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
              <BarChart3 className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-green-600" />
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Projekty</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{overview.totalProjects}</p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">+2 nowe</p>
        </CardContent>
      </Card>

      {/* Avg Value */}
      <Card className="border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <Badge variant="secondary" className="text-xs">65%</Badge>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Śr. wartość</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{formatCurrency(overview.averageProjectValue)}</p>
          <Progress value={65} className="h-1 mt-2" />
        </CardContent>
      </Card>

      {/* Clients */}
      <Card className="border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <Activity className="h-4 w-4 text-green-600" />
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Klienci</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{overview.activeClients}</p>
          <p className="text-xs text-slate-500 mt-1">95% retencja</p>
        </CardContent>
      </Card>

      {/* Conversion */}
      <Card className="border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
              <Percent className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-green-600" />
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Konwersja</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{overview.conversionRate.toFixed(1)}%</p>
          <p className="text-xs text-green-600 mt-1">+2.3%</p>
        </CardContent>
      </Card>
    </div>
  );
}
