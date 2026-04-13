"use client";

import { useState, useMemo, useEffect } from "react";
import { useKnrMultiplier } from "@/hooks/useKnrMultiplier";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  TrendingUp, TrendingDown, DollarSign, PiggyBank, AlertTriangle,
  CheckCircle2, Info, Save,
} from "lucide-react";

interface ProfitMarginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  isPro?: boolean;
  items: {
    id: string;
    name: string;
    unit: string;
    quantity: number;
    final_material_price: number;
    final_labor_price: number;
  }[];
  vatRate: number;
}

const STORAGE_KEY = "elektrosmart_actual_costs";

function getStoredCosts(projectId: string): Record<string, { material: number; labor: number }> {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return all[projectId] || {};
  } catch {
    return {};
  }
}

function setStoredCosts(projectId: string, costs: Record<string, { material: number; labor: number }>) {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    all[projectId] = costs;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {}
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(value);
}

export function ProfitMarginDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
  isPro = false,
  items,
  vatRate,
}: ProfitMarginDialogProps) {
  const { multiplier: knrMultiplier } = useKnrMultiplier();
  const blurPrice = (v: number) => isPro ? formatCurrency(v) : "*** zł";
  const [actualCosts, setActualCosts] = useState<Record<string, { material: number; labor: number }>>({});

  useEffect(() => {
    if (open) {
      setActualCosts(getStoredCosts(projectId));
    }
  }, [open, projectId]);

  const updateCost = (itemId: string, field: "material" | "labor", value: number) => {
    setActualCosts(prev => ({
      ...prev,
      [itemId]: {
        material: field === "material" ? value : (prev[itemId]?.material ?? 0),
        labor: field === "labor" ? value : (prev[itemId]?.labor ?? 0),
      },
    }));
  };

  const handleSave = () => {
    setStoredCosts(projectId, actualCosts);
  };

  // Calculate totals
  const analysis = useMemo(() => {
    let quotedMaterial = 0;
    let quotedLabor = 0;
    let actualMaterialTotal = 0;
    let actualLaborTotal = 0;
    let hasActualData = false;

    for (const item of items) {
      const qty = item.quantity || 1;
      quotedMaterial += (item.final_material_price || 0) * qty;
      quotedLabor += (item.final_labor_price || 0) * qty * knrMultiplier;

      const actual = actualCosts[item.id];
      if (actual && (actual.material > 0 || actual.labor > 0)) {
        hasActualData = true;
        actualMaterialTotal += (actual.material || 0) * qty;
        actualLaborTotal += (actual.labor || 0) * qty;
      } else {
        // Default: assume actual = quoted (with knrMultiplier applied)
        actualMaterialTotal += (item.final_material_price || 0) * qty;
        actualLaborTotal += (item.final_labor_price || 0) * qty * knrMultiplier;
      }
    }

    const quotedNet = quotedMaterial + quotedLabor;
    const actualNet = actualMaterialTotal + actualLaborTotal;
    const profit = quotedNet - actualNet;
    const marginPercent = quotedNet > 0 ? (profit / quotedNet) * 100 : 0;

    return {
      quotedMaterial,
      quotedLabor,
      quotedNet,
      quotedGross: quotedNet * (1 + vatRate / 100),
      actualMaterial: actualMaterialTotal,
      actualLabor: actualLaborTotal,
      actualNet,
      profit,
      marginPercent,
      hasActualData,
    };
  }, [items, actualCosts, vatRate]);

  const marginColor =
    analysis.marginPercent >= 30 ? "text-emerald-600" :
    analysis.marginPercent >= 15 ? "text-amber-600" :
    "text-red-600";

  const marginBg =
    analysis.marginPercent >= 30 ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800" :
    analysis.marginPercent >= 15 ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800" :
    "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
              <PiggyBank className="w-4 h-4 text-white" />
            </div>
            Kalkulator marży
          </DialogTitle>
          <DialogDescription>
            Porównaj ceny z kosztorysu z rzeczywistymi kosztami · {projectName}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2">
          {/* Margin overview cards */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase font-medium">Wycena netto</p>
              <p className={`text-sm font-bold text-blue-700 dark:text-blue-300 ${!isPro ? "blur-sm select-none" : ""}`}>{blurPrice(analysis.quotedNet)}</p>
            </div>
            <div className="rounded-xl border bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase font-medium">Koszty rzeczywiste</p>
              <p className={`text-sm font-bold ${!isPro ? "blur-sm select-none" : ""}`}>{blurPrice(analysis.actualNet)}</p>
            </div>
            <div className={`rounded-xl border p-3 text-center ${marginBg}`}>
              <p className="text-[10px] text-muted-foreground uppercase font-medium">Zysk netto</p>
              <p className={`text-sm font-bold ${marginColor} ${!isPro ? "blur-sm select-none" : ""}`}>
                {isPro ? (analysis.profit >= 0 ? "+" : "") + formatCurrency(analysis.profit) : "*** zł"}
              </p>
            </div>
            <div className={`rounded-xl border p-3 text-center ${marginBg}`}>
              <p className="text-[10px] text-muted-foreground uppercase font-medium">Marża</p>
              <p className={`text-lg font-bold ${marginColor}`}>
                {analysis.marginPercent.toFixed(1)}%
              </p>
              {analysis.marginPercent < 15 && (
                <p className="text-[9px] text-red-600 flex items-center justify-center gap-0.5">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  Poniżej progu
                </p>
              )}
            </div>
          </div>

          {/* Industry benchmark */}
          <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-3 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground">
              <strong>Benchmark branżowy:</strong> Średnia marża w instalacjach elektrycznych to 25–35%.
              {analysis.marginPercent >= 25 ? (
                <span className="text-emerald-600 ml-1">Twoja marża jest w normie.</span>
              ) : analysis.marginPercent >= 15 ? (
                <span className="text-amber-600 ml-1">Rozważ podwyższenie cen o {(25 - analysis.marginPercent).toFixed(0)}%.</span>
              ) : (
                <span className="text-red-600 ml-1">Uwaga! Marża poniżej rentowności. Zweryfikuj wycenę.</span>
              )}
            </div>
          </div>

          {/* Breakdown: Material vs Labor */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border p-3">
              <p className="text-[10px] text-muted-foreground uppercase font-medium mb-2">Materiały</p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Wycena:</span>
                  <span className={`font-medium ${!isPro ? "blur-sm select-none" : ""}`}>{blurPrice(analysis.quotedMaterial)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rzeczywiste:</span>
                  <span className={`font-medium ${!isPro ? "blur-sm select-none" : ""}`}>{blurPrice(analysis.actualMaterial)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t">
                  <span className="text-muted-foreground">Różnica:</span>
                  <span className={`font-bold ${analysis.quotedMaterial - analysis.actualMaterial >= 0 ? "text-emerald-600" : "text-red-600"} ${!isPro ? "blur-sm select-none" : ""}`}>
                    {blurPrice(Math.abs(analysis.quotedMaterial - analysis.actualMaterial))}
                  </span>
                </div>
              </div>
            </div>
            <div className="rounded-xl border p-3">
              <p className="text-[10px] text-muted-foreground uppercase font-medium mb-2">Robocizna</p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Wycena:</span>
                  <span className={`font-medium ${!isPro ? "blur-sm select-none" : ""}`}>{blurPrice(analysis.quotedLabor)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rzeczywiste:</span>
                  <span className={`font-medium ${!isPro ? "blur-sm select-none" : ""}`}>{blurPrice(analysis.actualLabor)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t">
                  <span className="text-muted-foreground">Różnica:</span>
                  <span className={`font-bold ${analysis.quotedLabor - analysis.actualLabor >= 0 ? "text-emerald-600" : "text-red-600"} ${!isPro ? "blur-sm select-none" : ""}`}>
                    {blurPrice(Math.abs(analysis.quotedLabor - analysis.actualLabor))}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Per-item cost entry */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Koszty rzeczywiste pozycji
            </p>
            <div className="border rounded-xl overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-[1fr_70px_70px] sm:grid-cols-[1fr_80px_80px] gap-1 px-2 sm:px-3 py-2 bg-slate-50 dark:bg-slate-800/50 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b">
                <span>Pozycja</span>
                <span className="text-right">Mat.</span>
                <span className="text-right">Rob.</span>
              </div>
              <div className="max-h-[40vh] overflow-y-auto divide-y">
                {items.map((item) => {
                  const actual = actualCosts[item.id];
                  return (
                    <div key={item.id} className="grid grid-cols-[1fr_70px_70px] sm:grid-cols-[1fr_80px_80px] gap-1 px-2 sm:px-3 py-1.5 items-center hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium truncate">{item.name}</p>
                        <p className="text-[9px] text-muted-foreground">
                          Wycena: <span className={!isPro ? "blur-sm select-none" : ""}>{blurPrice(item.final_material_price)}</span> + <span className={!isPro ? "blur-sm select-none" : ""}>{blurPrice(item.final_labor_price)}</span> / {item.unit}
                        </p>
                      </div>
                      <Input
                        id={`actual-mat-${item.id}`}
                        name={`actual-mat-${item.id}`}
                        type="number"
                        step="0.01"
                        min="0"
                        aria-label={`Rzeczywisty koszt materiału: ${item.name}`}
                        placeholder={String(item.final_material_price)}
                        value={actual?.material ?? ""}
                        onChange={(e) => updateCost(item.id, "material", parseFloat(e.target.value) || 0)}
                        className="h-7 text-[11px] text-right p-1"
                      />
                      <Input
                        id={`actual-lab-${item.id}`}
                        name={`actual-lab-${item.id}`}
                        type="number"
                        step="0.01"
                        min="0"
                        aria-label={`Rzeczywisty koszt robocizny: ${item.name}`}
                        placeholder={String(item.final_labor_price)}
                        value={actual?.labor ?? ""}
                        onChange={(e) => updateCost(item.id, "labor", parseFloat(e.target.value) || 0)}
                        className="h-7 text-[11px] text-right p-1"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t">
          <p className="text-[10px] text-muted-foreground">
            Dane kosztów zapisywane lokalnie w przeglądarce
          </p>
          <Button onClick={handleSave} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
            <Save className="w-3.5 h-3.5 mr-1.5" />
            Zapisz koszty
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
