"use client";
/**
 * components/project/_parts/MaterialSuggestionsPanel.tsx
 * ─────────────────────────────────────────────────────────────────
 * Material Brain suggestions panel.
 * Shown when project is in "Klient + Materiały" mode
 * (!materials_owned_by_customer = false).
 *
 * Fetches resolved material bills for all applicable labor items,
 * displays per-item collapsible cards with category badges,
 * quantities, prices (catalog / fallback), and totals.
 */

import { useState, useTransition, useCallback } from "react";
import {
  getMaterialBillForProject,
  type ItemMaterialBill,
  type MaterialBrainResult,
} from "@/app/dashboard/projects/[id]/_actions/material-brain-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  BrainCircuit, ChevronDown, Loader2, RefreshCw,
  Zap, Package, AlertCircle, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MaterialSuggestionsPanelProps {
  projectId: string;
  vatRate: number;
}

const CATEGORY_STYLE: Record<string, { label: string; bg: string; text: string }> = {
  CABLE:       { label: "Kabel",     bg: "bg-amber-100 dark:bg-amber-900/30",   text: "text-amber-700 dark:text-amber-300" },
  BREAKER:     { label: "Zabezp.",   bg: "bg-blue-100 dark:bg-blue-900/30",     text: "text-blue-700 dark:text-blue-300" },
  BOX:         { label: "Puszka",    bg: "bg-violet-100 dark:bg-violet-900/30", text: "text-violet-700 dark:text-violet-300" },
  SOCKET:      { label: "Gniazdo",   bg: "bg-green-100 dark:bg-green-900/30",   text: "text-green-700 dark:text-green-300" },
  PLASTER:     { label: "Gips",      bg: "bg-stone-100 dark:bg-stone-900/30",   text: "text-stone-700 dark:text-stone-300" },
  HARDWARE:    { label: "Osprzęt",   bg: "bg-slate-100 dark:bg-slate-800",      text: "text-slate-600 dark:text-slate-400" },
  CONDUIT:     { label: "Rurka",     bg: "bg-teal-100 dark:bg-teal-900/30",     text: "text-teal-700 dark:text-teal-300" },
  SWITCH:      { label: "Łącznik",   bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-700 dark:text-indigo-300" },
  GENERAL:     { label: "Inny",      bg: "bg-slate-100 dark:bg-slate-800",      text: "text-slate-500 dark:text-slate-400" },
};

function fmt(n: number) {
  return n.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function CategoryBadge({ category }: { category: string }) {
  const s = CATEGORY_STYLE[category] ?? CATEGORY_STYLE.GENERAL;
  return (
    <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold", s.bg, s.text)}>
      {s.label}
    </span>
  );
}

function ItemBillCard({ entry }: { entry: ItemMaterialBill }) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700 bg-white dark:bg-slate-900 transition-colors text-left group">
          <div className="flex items-center gap-2 min-w-0">
            <BrainCircuit className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{entry.itemName}</span>
            <Badge variant="outline" className="text-[9px] px-1 py-0 border-amber-300 text-amber-600">
              {entry.itemQty} szt
            </Badge>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
              {fmt(entry.bill.totalNet)} PLN
            </span>
            <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform", open && "rotate-180")} />
          </div>
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-1 ml-3 pl-3 border-l-2 border-amber-200 dark:border-amber-800 space-y-1 pb-1">
          {entry.bill.items.map((resolved) => (
            <div key={resolved.item.id} className="flex items-center gap-2 py-1">
              <CategoryBadge category={resolved.item.category} />
              <span className="text-xs text-slate-600 dark:text-slate-400 flex-1 min-w-0 truncate">
                {resolved.item.label}
              </span>
              <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">
                {fmt(resolved.scaledQty)} {resolved.item.unit}
              </span>
              <span className="text-[10px] font-mono font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                {fmt(resolved.total.totalNet)} PLN
              </span>
              {resolved.priceSource === "fallback" && (
                <span title="Cena referencyjna (katalog niedostępny)" className="text-[9px] text-amber-500">ref</span>
              )}
            </div>
          ))}

          {/* Item subtotal row */}
          <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-400">
              Razem netto ({entry.bill.items.length} pozycji) · VAT wliczony w cenie brutto
            </span>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-slate-500">netto {fmt(entry.bill.totalNet)}</span>
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                brutto {fmt(entry.bill.totalGross)} PLN
              </span>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function MaterialSuggestionsPanel({ projectId, vatRate }: MaterialSuggestionsPanelProps) {
  const [result, setResult]     = useState<MaterialBrainResult | null>(null);
  const [isPending, startFetch] = useTransition();
  const [fetched, setFetched]   = useState(false);

  const fetch = useCallback(() => {
    startFetch(async () => {
      const data = await getMaterialBillForProject(projectId);
      setResult(data);
      setFetched(true);
    });
  }, [projectId]);

  const hasBills = result && result.bills.length > 0;
  const isEmpty  = fetched && result && result.bills.length === 0;

  return (
    <Card className="border-amber-200 dark:border-amber-800/50 bg-amber-50/30 dark:bg-amber-950/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <BrainCircuit className="w-4 h-4 text-amber-500" />
            <span>Material Brain — Sugestie materiałów</span>
            <Badge className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-0">
              VAT {vatRate}%
            </Badge>
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={fetch}
            disabled={isPending}
            className="h-7 text-xs gap-1.5 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30"
          >
            {isPending
              ? <Loader2 className="w-3 h-3 animate-spin" />
              : <RefreshCw className="w-3 h-3" />}
            {fetched ? "Odśwież" : "Uruchom Mózg"}
          </Button>
        </div>

        {!fetched && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Kliknij „Uruchom Mózg", aby zobaczyć sugestie materiałów dla pozycji robocizny.
            Marża 15% · Odpad kablowy +10% · Ceny z katalogu 2026.
          </p>
        )}
      </CardHeader>

      <CardContent className="pt-0 space-y-2">
        {/* Loading state */}
        {isPending && (
          <div className="flex items-center gap-2 py-4 justify-center text-sm text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
            Analizuję pozycje robocizny…
          </div>
        )}

        {/* Error state */}
        {result?.error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {result.error}
          </div>
        )}

        {/* Empty state — no applicable labor items */}
        {isEmpty && (
          <div className="flex flex-col items-center gap-2 py-5 text-center">
            <Package className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            <p className="text-xs text-slate-500">Brak pozycji robocizny z rozpoznanym materiałem.</p>
            <p className="text-[10px] text-slate-400">Dodaj pozycje jak „Podłączenie pompy" lub „Montaż gniazda".</p>
          </div>
        )}

        {/* Bills list */}
        {hasBills && !isPending && (
          <>
            <div className="space-y-1.5">
              {result.bills.map((entry) => (
                <ItemBillCard key={entry.itemId} entry={entry} />
              ))}
            </div>

            {/* Grand total */}
            <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-800/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Łącznie materiały ({result.bills.length} grup)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">netto {fmt(result.totalNet)} PLN</span>
                  <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                    brutto {fmt(result.totalGross)} PLN
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                <Zap className="w-2.5 h-2.5 inline mr-0.5 text-amber-400" />
                Sugestie materiałowe na podstawie pozycji w kosztorysie — kliknij aby dodać do listy zakupów.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
