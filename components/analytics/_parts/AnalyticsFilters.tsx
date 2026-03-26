"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

type TimeRange = "week" | "month" | "quarter" | "year";

interface AnalyticsFiltersProps {
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
}

export function AnalyticsFilters({ timeRange, onTimeRangeChange }: AnalyticsFiltersProps) {
  return (
    <>
      {/* Header + Time Filter */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
            Panel Analityczny
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Przegląd wyników i szczegółowa analiza biznesowa
          </p>
        </div>
        <Tabs value={timeRange} onValueChange={(v) => onTimeRangeChange(v as TimeRange)}>
          <TabsList className="bg-slate-100 dark:bg-slate-800">
            <TabsTrigger value="week" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Tydzień</TabsTrigger>
            <TabsTrigger value="month" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Miesiąc</TabsTrigger>
            <TabsTrigger value="quarter" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Kwartał</TabsTrigger>
            <TabsTrigger value="year" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Rok</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Info Banner */}
      <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-600">
              <AlertCircle className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                📊 Analiza oparta na rzeczywistych danych
              </h4>
              <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                Wszystkie metryki są automatycznie obliczane na podstawie Twoich projektów z wybranego okresu.
                <strong className="ml-1">Przychód</strong> = suma (materiały + robocizna),
                <strong className="ml-1">Marża</strong> = (przychód - koszt) / przychód.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
