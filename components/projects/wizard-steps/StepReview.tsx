"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft, Loader2, FileText, Package, Minus, Plus, Trash2, RotateCcw, Zap, CheckCircle2,
} from "lucide-react";
import type { EstimateItem } from "@/lib/quick-estimate-config";

interface StepReviewProps {
  items: EstimateItem[];
  vatRate: number;
  totals: { material: number; labor: number; net: number; vatAmount: number; gross: number };
  viewMode: "all" | "material" | "labor";
  creating: boolean;
  wasFallback: boolean;
  isPro?: boolean;
  formatCurrency: (v: number) => string;
  setViewMode: (mode: "all" | "material" | "labor") => void;
  setManualVatRate: (rate: number | null) => void;
  setStep: (s: number) => void;
  handleReset: () => void;
  handleCreate: () => Promise<void>;
  updateItemQuantity: (index: number, newQty: number) => void;
  removeItem: (index: number) => void;
}

function KnrBadge({ code }: { code: string }) {
  const isManual = code === "ES-KNR-MANUAL";
  return (
    <span
      title={isManual
        ? "Ta pozycja nie posiada przypisanej normy KNR w bazie. Ceny mogą wymagać ręcznej korekty."
        : `Kod KNR: ${code}`}
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold cursor-help ${
        isManual
          ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-400/30"
          : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-400/30"
      }`}
    >
      {isManual ? "⚠ Manual / Brak w bazie" : code}
    </span>
  );
}

export function StepReview({
  items, vatRate, totals, viewMode, creating, isPro = false, formatCurrency,
  setViewMode, setManualVatRate, setStep, handleReset, handleCreate,
  updateItemQuantity, removeItem,
}: StepReviewProps) {
  const allBlankPrices = items.every(i => i.base_material_price === 0 && i.base_labor_price === 0);
  // v2.0: FREE users always see full prices. Monetization moved to PDF export / portal klienta.
  const blurPrice = (v: number) => formatCurrency(v);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Przegląd kosztorysu</h2>
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
          <Package className="w-3 h-3 mr-1" />
          {items.filter(i => i.quantity > 0).length} pozycji
        </Badge>
      </div>

      {/* VAT selector + View toggle */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3">
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex-shrink-0">Stawka VAT:</span>
        <div className="flex gap-2">
          {[8, 23].map((rate) => (
            <button
              key={rate}
              onClick={() => setManualVatRate(rate)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${
                vatRate === rate
                  ? "border-orange-500 bg-orange-500 text-white shadow-sm"
                  : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-orange-300"
              }`}
            >
              {rate}%
            </button>
          ))}
        </div>
        <div className="flex gap-1 ml-auto">
          {([
            { key: "all" as const, label: "Wszystko" },
            { key: "material" as const, label: "Materiały" },
            { key: "labor" as const, label: "Robocizna" },
          ]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setViewMode(key)}
              className={`px-3 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                viewMode === key
                  ? key === "material"
                    ? "border-orange-500 bg-orange-500 text-white"
                    : key === "labor"
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-blue-500 bg-blue-500 text-white"
                  : "border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-slate-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* KNR auto-pricing banner */}
      {allBlankPrices && (
        <div className="flex items-start gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/20 border border-emerald-200 dark:border-emerald-800/50">
          <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center mt-0.5">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Ceny KNR zostaną wyliczone automatycznie</p>
            <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/70 mt-0.5">
              Silnik ES-Engine zastosuje normy KNR 2026, Twoje stawki r-g i współczynnik regionalny zaraz po kliknięciu „Utwórz projekt”.
              Każda pozycja otrzyma etykietę „Dlaczego taka cena?” z pełnym rozpisaniem.
            </p>
          </div>
          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
        </div>
      )}

      {/* v2.0: Free-tier info banner — prices visible, PDF export requires PRO */}
      {!isPro && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-300 dark:border-blue-700 text-xs text-blue-700 dark:text-blue-400">
          <span className="font-semibold">Tryb Demo:</span> Wszystkie ceny widoczne. Eksport PDF bez znaku wodnego — tylko w PRO (159 zł/m-c) lub pojedynczy PDF za 29 zł.
        </div>
      )}

      {/* Totals summary */}
      {allBlankPrices ? (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Materiały", color: "orange" },
            { label: "Robocizna", color: "amber" },
            { label: "Brutto", color: "emerald" },
          ].map(({ label, color }) => (
            <div key={label} className={`rounded-xl p-3 text-center border bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700`}>
              <p className="text-[10px] text-muted-foreground uppercase font-medium">{label}</p>
              <p className={`text-xs font-semibold text-${color}-600 dark:text-${color}-400 mt-0.5`}>Wycena KNR</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <div className={`rounded-xl p-3 text-center border transition-all ${
            viewMode === "material" || viewMode === "all"
              ? "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/40"
              : "bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700 opacity-40"
          }`}>
            <p className="text-[10px] text-muted-foreground uppercase font-medium">Materiały</p>
            <p className="text-sm font-bold text-orange-700 dark:text-orange-300">{blurPrice(totals.material)}</p>
          </div>
          <div className={`rounded-xl p-3 text-center border transition-all ${
            viewMode === "labor" || viewMode === "all"
              ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40"
              : "bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700 opacity-40"
          }`}>
            <p className="text-[10px] text-muted-foreground uppercase font-medium">Robocizna</p>
            <p className="text-sm font-bold text-amber-700 dark:text-amber-300">{blurPrice(totals.labor)}</p>
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase font-medium">VAT {vatRate}%</p>
            <p className="text-sm font-bold">{blurPrice(totals.vatAmount)}</p>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border border-emerald-200 dark:border-emerald-800 p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase font-medium">Brutto</p>
            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{blurPrice(totals.gross)}</p>
          </div>
        </div>
      )}

      {/* Items list */}
      <div className="border rounded-xl overflow-hidden">
        <div className="max-h-[50vh] overflow-y-auto divide-y">
          {items.map((item, index) => {
            const displayName = item.name;
            const isLaborItem = item.base_material_price === 0 && item.base_labor_price > 0;
            const isMaterialItem = item.base_labor_price === 0 && item.base_material_price > 0;
            const hidden =
              (viewMode === "material" && isLaborItem) ||
              (viewMode === "labor" && isMaterialItem);
            if (hidden) return null;
            const unitPrice = viewMode === "material"
              ? item.base_material_price
              : viewMode === "labor"
                ? item.base_labor_price
                : item.base_material_price + item.base_labor_price;
            return (
              <div
                key={index}
                className={`flex items-center gap-2 p-2.5 text-sm ${item.quantity === 0 ? "opacity-40" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-xs truncate">{displayName}</p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">
                      {allBlankPrices ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                          <Zap className="w-2.5 h-2.5" /> Cena KNR / {item.unit}
                        </span>
                      ) : (
                        <>
                          <span>{blurPrice(unitPrice)}</span> / {item.unit}
                          {" · "}
                          Razem: <span>{blurPrice(unitPrice * item.quantity)}</span>
                          {viewMode === "all" && item.base_material_price > 0 && item.base_labor_price > 0 && (
                            <span className="ml-1 text-slate-400">
                              (Mat: {formatCurrency(item.base_material_price)} · Rob: {formatCurrency(item.base_labor_price)})
                            </span>
                          )}
                        </>
                      )}
                    </span>
                    {item.knr_code && <KnrBadge code={item.knr_code} />}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button variant="outline" size="sm" className="h-7 w-7 sm:h-6 sm:w-6 p-0"
                    onClick={() => updateItemQuantity(index, item.quantity - 1)}>
                    <Minus className="w-3 h-3" />
                  </Button>
                  <Input
                    id={`review-qty-${index}`}
                    name={`review-qty-${index}`}
                    aria-label={`Ilość: ${item.name}`}
                    type="number" value={item.quantity}
                    onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 0)}
                    className="w-14 h-7 sm:h-6 text-center text-xs p-0" />
                  <Button variant="outline" size="sm" className="h-7 w-7 sm:h-6 sm:w-6 p-0"
                    onClick={() => updateItemQuantity(index, item.quantity + 1)}>
                    <Plus className="w-3 h-3" />
                  </Button>
                  <span className="text-xs sm:text-[10px] text-muted-foreground w-6">{item.unit}</span>
                  <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-6 sm:w-6 p-0 text-muted-foreground hover:text-red-600"
                    onClick={() => removeItem(index)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile: secondary row on top, CTA full-width below. sm+: side-by-side */}
      <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={() => setStep(2)}>
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Zmień parametry
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="flex-1 sm:flex-none gap-1.5 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-600 hover:border-orange-400 hover:text-orange-600"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Nowa wycena
          </Button>
        </div>
        <Button
          onClick={handleCreate}
          disabled={creating || items.filter(i => i.quantity > 0).length === 0}
          className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/20"
          size="lg"
        >
          {creating ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{allBlankPrices ? "Tworzenie i wycena KNR..." : "Tworzenie projektu..."}</>
          ) : (
            allBlankPrices
              ? <><Zap className="w-4 h-4 mr-2" />Utwórz i wyceń z KNR</>
              : <><FileText className="w-4 h-4 mr-2" />{`Utwórz projekt (${formatCurrency(totals.gross)})`}</>
          )}
        </Button>
      </div>
    </div>
  );
}
