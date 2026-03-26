"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Loader2,
  BarChart3,
  Wallet,
  Banknote,
  Timer,
  Target,
} from "lucide-react";
import { getProjectProfitability, type ProfitabilityData } from "@/app/dashboard/projects/[id]/profitability-actions";
import { cn } from "@/lib/utils";

interface ProfitabilityReportDialogProps {
  projectId: string;
  projectName: string;
  isPro?: boolean;
  disabled?: boolean;
}

export function ProfitabilityReportDialog({ projectId, projectName, isPro, disabled }: ProfitabilityReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ProfitabilityData | null>(null);

  useEffect(() => {
    if (open) {
      setLoading(true);
      getProjectProfitability(projectId).then((result: ProfitabilityData | null) => {
        setData(result);
        setLoading(false);
      });
    }
  }, [open, projectId]);

  const formatPrice = (v: number) =>
    isPro ? new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(v) : "*** zł";

  const formatHours = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md" disabled={disabled}>
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Rentowność</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            Raport rentowności
          </DialogTitle>
          <DialogDescription className="sr-only">
            Analiza rentowności projektu z podziałem na materiały i robociznę.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : !data ? (
          <div className="text-center py-8 text-sm text-slate-400">
            Brak danych do analizy
          </div>
        ) : (
          <div className="space-y-4">
            {/* Main profit card */}
            <Card className={cn(
              "border-0 shadow-lg",
              data.netProfit >= 0
                ? "bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/20"
                : "bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/20"
            )}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-slate-500">Zysk netto</span>
                  {data.netProfit >= 0 ? (
                    <Badge className="bg-green-100 text-green-700 gap-0.5">
                      <TrendingUp className="w-3 h-3" />+{data.marginPercent.toFixed(1)}%
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-700 gap-0.5">
                      <TrendingDown className="w-3 h-3" />{data.marginPercent.toFixed(1)}%
                    </Badge>
                  )}
                </div>
                <div className={cn(
                  "text-3xl font-bold",
                  data.netProfit >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"
                )}>
                  {formatPrice(data.netProfit)}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {projectName}
                </p>
              </CardContent>
            </Card>

            {/* Revenue vs Costs */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="border-slate-200 dark:border-slate-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <Wallet className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-[10px] font-medium text-slate-500 uppercase">Przychód</span>
                  </div>
                  <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
                    {formatPrice(data.totalRevenue)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 space-y-0.5">
                    <div>Materiał: {formatPrice(data.materialRevenue)}</div>
                    <div>Robocizna: {formatPrice(data.laborRevenue)}</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 dark:border-slate-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                      <Banknote className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <span className="text-[10px] font-medium text-slate-500 uppercase">Koszty</span>
                  </div>
                  <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
                    {formatPrice(data.totalCosts)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 space-y-0.5">
                    <div>Materiał: {formatPrice(data.materialCost)}</div>
                    <div>Czas pracy: {formatPrice(data.laborCost)}</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Time tracking summary */}
            <Card className="border-slate-200 dark:border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                      <Timer className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Czas pracy</span>
                  </div>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {data.totalMinutes > 0 ? formatHours(data.totalMinutes) : "Brak danych"}
                  </span>
                </div>
                {data.totalMinutes > 0 && data.hourlyRate > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Stawka: {formatPrice(data.hourlyRate)}/h</span>
                      <span>Efektywna: {formatPrice(data.effectiveHourlyRate)}/h</span>
                    </div>
                    <Progress
                      value={Math.min(100, (data.effectiveHourlyRate / data.hourlyRate) * 100)}
                      className="h-1.5"
                    />
                    <div className="text-[10px] text-slate-400">
                      {data.effectiveHourlyRate >= data.hourlyRate
                        ? "✅ Stawka efektywna powyżej planowanej"
                        : "⚠️ Stawka efektywna poniżej planowanej — projekt zajął więcej czasu"}
                    </div>
                  </div>
                )}
                {data.totalMinutes === 0 && (
                  <p className="text-[10px] text-slate-400">Brak wpisów śledzenia czasu. Uruchom timer na stronie „Śledzenie czasu" aby porównać planowane vs faktyczne koszty.</p>
                )}
              </CardContent>
            </Card>

            {/* Margin bar */}
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-medium text-slate-500">Marża projektu</span>
                <span className={cn(
                  "text-xs font-bold",
                  data.marginPercent >= 20 ? "text-emerald-600" : data.marginPercent >= 0 ? "text-amber-600" : "text-red-600"
                )}>
                  {data.marginPercent.toFixed(1)}%
                </span>
              </div>
              <Progress
                value={Math.max(0, Math.min(100, data.marginPercent))}
                className="h-2"
              />
              <div className="flex justify-between mt-1 text-[9px] text-slate-400">
                <span>0%</span>
                <span className="text-amber-500">20%</span>
                <span>50%+</span>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
