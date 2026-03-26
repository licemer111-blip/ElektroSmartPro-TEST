"use client";
/**
 * components/project/_parts/MaterialExpertPanel.tsx
 * ─────────────────────────────────────────────────────────────────
 * Material Expert Panel v1.0
 * Full UX for Material Brain: fetch suggestions → review with
 * checkboxes → see calc log → confirm to DB via saveProjectMaterials.
 *
 * Activation: shown when !materials_owned_by_customer (Brain active).
 */

import { useState, useTransition, useCallback, useId } from "react";
import {
  getMaterialBillForProject,
  saveProjectMaterials,
  revalidateProjectMaterialsPage,
  type ItemMaterialBill,
  type MaterialBrainResult,
  type SaveMaterialItem,
} from "@/app/dashboard/projects/[id]/_actions/material-brain-actions";
import { useMaterialBrainCtx } from "./MaterialBrainContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import {
  BrainCircuit, ChevronDown, Loader2, RefreshCw,
  PackagePlus, Info, AlertCircle, CheckSquare2, Package,
  ShieldCheck, Wrench, Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGlobalSettings } from "@/hooks/use-global-settings";
import type { ResolvedBillItem } from "@/lib/services/materials-catalog";
import { SAFETY_DEVICE_RE, getSafetyDeviceLabel } from "@/lib/services/reality-check";

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

interface MaterialExpertPanelProps {
  projectId:       string;
  vatRate:         number;
  /**
   * When set, only this item's bill is shown.
   * Used when opening the panel from a per-row badge (Sheet mode).
   */
  filterItemId?:   string;
  /**
   * Pre-fetched bills from useMaterialBrain.
   * When provided, no fetch is triggered on mount.
   */
  preloadedBills?: Map<string, ItemMaterialBill>;
}

// key = `${laborItemId}__${itemId}` for unique checkbox tracking
type SelectionMap = Record<string, boolean>;

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

const CATEGORY_META: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  CABLE:    { icon: <Layers className="w-3 h-3" />,       label: "Kabel",    color: "text-amber-600 dark:text-amber-400" },
  BREAKER:  { icon: <ShieldCheck className="w-3 h-3" />,  label: "Zabezp.",  color: "text-blue-600 dark:text-blue-400" },
  BOX:      { icon: <Package className="w-3 h-3" />,      label: "Puszka",   color: "text-violet-600 dark:text-violet-400" },
  SOCKET:   { icon: <Wrench className="w-3 h-3" />,       label: "Gniazdo",  color: "text-green-600 dark:text-green-400" },
  HARDWARE: { icon: <Wrench className="w-3 h-3" />,       label: "Osprzęt",  color: "text-slate-500 dark:text-slate-400" },
  PLASTER:  { icon: <Wrench className="w-3 h-3" />,       label: "Gips",     color: "text-stone-500 dark:text-stone-400" },
  GENERAL:  { icon: <Package className="w-3 h-3" />,      label: "Inny",     color: "text-slate-500 dark:text-slate-400" },
};

function fmt(n: number) {
  return n.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function CategoryTag({ category }: { category: string }) {
  const meta = CATEGORY_META[category] ?? CATEGORY_META.GENERAL;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-[10px] font-semibold", meta.color)}>
      {meta.icon}{meta.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────
// Per-item row
// ─────────────────────────────────────────────────────────────────

function MaterialRow({
  resolved,
  selKey,
  checked,
  onCheck,
}: {
  resolved:  ResolvedBillItem;
  selKey:    string;
  checked:   boolean;
  onCheck:   (key: string, val: boolean) => void;
}) {
  const checkId = useId();
  const { item, discreteQty, displayHint, catalogPrice, priceSource, total } = resolved;

  return (
    <div className={cn(
      "flex items-start gap-2.5 px-3 py-2 rounded-lg transition-colors",
      checked ? "bg-amber-50 dark:bg-amber-950/20" : "hover:bg-slate-50 dark:hover:bg-slate-800/30"
    )}>
      <Checkbox
        id={checkId}
        checked={checked}
        onCheckedChange={(v) => onCheck(selKey, Boolean(v))}
        className="mt-0.5 flex-shrink-0 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
      />
      <label htmlFor={checkId} className="flex-1 min-w-0 cursor-pointer">
        <div className="flex items-center gap-2 flex-wrap">
          <CategoryTag category={item.category} />
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300 flex-1 min-w-0">
            {item.label}
          </span>
          {priceSource === "fallback" && (
            <Badge variant="outline" className="text-[9px] px-1 py-0 border-amber-300 text-amber-600">ref</Badge>
          )}
        </div>

        {/* Qty + price row */}
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-[11px] font-mono text-slate-500">
            {displayHint ?? `${discreteQty} ${item.unit}`}
          </span>
          <span className="text-[10px] text-slate-400">×</span>
          <span className="text-[11px] font-mono text-slate-500">{fmt(catalogPrice)} PLN/{item.unit}</span>
          <span className="text-[10px] text-slate-400">→</span>
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
            {fmt(total.totalNet)} PLN netto
          </span>
          <span className="text-[10px] text-slate-400">
            ({fmt(total.totalGross)} brutto)
          </span>
        </div>

        {/* Calc log — transparency line */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 mt-0.5 cursor-help">
                <Info className="w-2.5 h-2.5 text-slate-400 flex-shrink-0" />
                <span className="text-[10px] text-slate-400 truncate max-w-xs">{total.breakdown}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-sm text-xs">
              <p className="font-mono">{total.breakdown}</p>
              {item.note && <p className="mt-1 text-slate-400 italic">{item.note}</p>}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </label>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Per-labor-item group card
// ─────────────────────────────────────────────────────────────────

function LaborGroupCard({
  entry,
  selection,
  onCheck,
  onSelectAll,
}: {
  entry:       ItemMaterialBill;
  selection:   SelectionMap;
  onCheck:     (key: string, val: boolean) => void;
  onSelectAll: (laborItemId: string, val: boolean) => void;
}) {
  const [open, setOpen] = useState(true);
  const groupId = useId();

  const keys      = entry.bill.items.map((ri) => `${entry.itemId}__${ri.item.id}`);
  const allSel    = keys.every((k) => selection[k]);
  const someSel   = keys.some((k) => selection[k]);
  const selCount  = keys.filter((k) => selection[k]).length;
  const groupNet  = entry.bill.items
    .filter((_, i) => selection[keys[i]])
    .reduce((s, ri) => s + ri.total.totalNet, 0);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 cursor-pointer hover:border-amber-300 dark:hover:border-amber-700 transition-colors group select-none">
          <Checkbox
            id={groupId}
            checked={allSel ? true : (someSel ? "indeterminate" : false)}
            onCheckedChange={(v) => {
              onSelectAll(entry.itemId, Boolean(v));
            }}
            onClick={(e) => e.stopPropagation()}
            className="flex-shrink-0 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 data-[state=indeterminate]:bg-amber-400 data-[state=indeterminate]:border-amber-400"
          />
          <BrainCircuit className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{entry.itemName}</p>
            <p className="text-[10px] text-slate-400">
              {entry.bill.items.length} pozycji · qty {entry.itemQty}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {selCount > 0 && (
              <Badge className="text-[10px] px-1.5 py-0 bg-amber-500 text-white">
                {selCount} zaznacz. · {fmt(groupNet)} PLN
              </Badge>
            )}
            <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform", open && "rotate-180")} />
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-1 space-y-0.5">
          {entry.bill.items.map((resolved) => {
            const selKey = `${entry.itemId}__${resolved.item.id}`;
            return (
              <MaterialRow
                key={selKey}
                resolved={resolved}
                selKey={selKey}
                checked={!!selection[selKey]}
                onCheck={onCheck}
              />
            );
          })}

          {/* Group subtotal */}
          <div className="flex items-center justify-between px-3 pt-2 pb-1 border-t border-slate-100 dark:border-slate-800 mt-1">
            <span className="text-[10px] text-slate-400">
              Razem grupa · netto {fmt(entry.bill.totalNet)} PLN
            </span>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
              brutto {fmt(entry.bill.totalGross)} PLN
            </span>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main panel
// ─────────────────────────────────────────────────────────────────

export function MaterialExpertPanel({ projectId, vatRate, filterItemId, preloadedBills }: MaterialExpertPanelProps) {
  const { toast }                     = useToast();
  const [result, setResult]           = useState<MaterialBrainResult | null>(() => {
    // Initialise from preloaded bills immediately (no fetch needed)
    if (!preloadedBills) return null;
    const allBills = [...preloadedBills.values()];
    const filtered = filterItemId
      ? allBills.filter((b) => b.itemId === filterItemId)
      : allBills;
    const totalNet   = filtered.reduce((s, b) => s + b.bill.totalNet,   0);
    const totalGross = filtered.reduce((s, b) => s + b.bill.totalGross, 0);
    return { bills: filtered, totalNet, totalGross };
  });
  const [selection, setSelection]     = useState<SelectionMap>(() => {
    if (!preloadedBills) return {};
    const sel: SelectionMap = {};
    const allBills = filterItemId
      ? [preloadedBills.get(filterItemId)].filter(Boolean) as ItemMaterialBill[]
      : [...preloadedBills.values()];
    for (const entry of allBills) {
      for (const ri of entry.bill.items) {
        sel[`${entry.itemId}__${ri.item.id}`] = true;
      }
    }
    return sel;
  });
  const [isFetching, startFetch]      = useTransition();
  const [isSaving, startSave]         = useTransition();
  const [fetched, setFetched]         = useState(!!preloadedBills);

  const fetchBills = useCallback(() => {
    startFetch(async () => {
      const data = await getMaterialBillForProject(projectId);
      const filtered = filterItemId
        ? { ...data, bills: data.bills.filter((b) => b.itemId === filterItemId) }
        : data;
      setResult(filtered);
      setFetched(true);

      // Auto-select all items on first fetch
      const initialSelection: SelectionMap = {};
      for (const entry of filtered.bills) {
        for (const ri of entry.bill.items) {
          initialSelection[`${entry.itemId}__${ri.item.id}`] = true;
        }
      }
      setSelection(initialSelection);
    });
  }, [projectId, filterItemId]);

  const handleCheck = useCallback((key: string, val: boolean) => {
    setSelection((prev) => ({ ...prev, [key]: val }));
  }, []);

  const handleSelectAll = useCallback((laborItemId: string, val: boolean) => {
    setSelection((prev) => {
      const updated = { ...prev };
      const entry = result?.bills.find((e) => e.itemId === laborItemId);
      if (!entry) return prev;
      for (const ri of entry.bill.items) {
        updated[`${laborItemId}__${ri.item.id}`] = val;
      }
      return updated;
    });
  }, [result]);

  const handleSelectAllGroups = useCallback((val: boolean) => {
    if (!result) return;
    const updated: SelectionMap = {};
    for (const entry of result.bills) {
      for (const ri of entry.bill.items) {
        updated[`${entry.itemId}__${ri.item.id}`] = val;
      }
    }
    setSelection(updated);
  }, [result]);

  const selectedCount = Object.values(selection).filter(Boolean).length;
  const selectedNet   = result?.bills.reduce((sum, entry) => {
    return sum + entry.bill.items
      .filter((ri) => selection[`${entry.itemId}__${ri.item.id}`])
      .reduce((s, ri) => s + ri.total.totalNet, 0);
  }, 0) ?? 0;

  const brainCtx = useMaterialBrainCtx();
  const { showHints } = useGlobalSettings();

  const handleSave = useCallback(() => {
    if (!result || selectedCount === 0) return;
    startSave(async () => {
      for (const entry of result.bills) {
        const selectedItems: SaveMaterialItem[] = entry.bill.items
          .filter((ri) => selection[`${entry.itemId}__${ri.item.id}`])
          .map((ri) => ({
            name:        ri.item.label,
            slug:        ri.item.slug,
            unit:        ri.item.unit,
            qtyRaw:      ri.scaledQty,
            qtyDiscrete: ri.discreteQty,
            basePrice:   ri.catalogPrice,
            wasteFactor: ri.total.withWaste / ri.total.subtotal || 1,
            marginPct:   15,
            vatRate,
            totalNet:    ri.total.totalNet,
            totalGross:  ri.total.totalGross,
            calcLog:     ri.total.breakdown,
            displayHint: ri.displayHint,
          }));

        if (selectedItems.length === 0) continue;

        const res = await saveProjectMaterials(projectId, entry.itemId, selectedItems);
        if (!res.success) {
          toast({ title: "Błąd zapisu", description: res.error, variant: "destructive" });
          return;
        }
      }

      // OPT-3: single revalidation after the entire batch (not per-item).
      // OPT-2: invalidate Brain cache so next panel open fetches fresh data.
      await revalidateProjectMaterialsPage(projectId);
      brainCtx?.refreshBrain();

      toast({
        title: `\u2705 ${selectedCount} pozycji dodanych do projektu`,
        description: `\u0141\u0105cznie netto: ${fmt(selectedNet)} PLN`,
      });
      setSelection({});
    });
  }, [result, selection, selectedCount, selectedNet, projectId, vatRate, toast, brainCtx]);

  const hasBills = result && result.bills.length > 0;
  const isEmpty  = fetched && result && result.bills.length === 0;
  const allSelected = result?.bills.every((e) =>
    e.bill.items.every((ri) => selection[`${e.itemId}__${ri.item.id}`])
  ) ?? false;

  return (
    <Card className="border-amber-200 dark:border-amber-800/50 bg-amber-50/20 dark:bg-amber-950/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle className="flex items-center gap-2 text-sm">
            <BrainCircuit className="w-4 h-4 text-amber-500" />
            <span>Material Expert Panel</span>
            <Badge className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-0">
              VAT {vatRate}% · Marża 15%
            </Badge>
          </CardTitle>
          <Button
            size="sm" variant="outline"
            onClick={fetchBills}
            disabled={isFetching || isSaving}
            className="h-7 text-xs gap-1.5 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30"
          >
            {isFetching ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            {fetched ? "Odśwież" : "Uruchom Mózg"}
          </Button>
        </div>

        {!fetched && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Analizuje pozycje robocizny i proponuje materiały z katalogu 2026.
            Ceny NET · Odpad kabla +10% · Dyskretne zaokrąglenie bezpieczników/puszek.
          </p>
        )}
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Loading */}
        {isFetching && (
          <div className="flex items-center gap-2 py-5 justify-center text-sm text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
            Analizuję pozycje robocizny…
          </div>
        )}

        {/* Error */}
        {result?.error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {result.error}
          </div>
        )}

        {/* Empty */}
        {isEmpty && (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <Package className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            <p className="text-xs text-slate-500">Brak rozpoznanych pozycji robocizny.</p>
            <p className="text-[10px] text-slate-400">Dodaj pozycje jak „Podłączenie pompy ciepła" lub „Montaż gniazda".</p>
          </div>
        )}

        {/* Rule 3 — Safety Integrity: silent expert notification (hidden in Zen Mode) */}
        {hasBills && !isFetching && showHints && (() => {
          const safetyAlerts = result!.bills
            .filter((entry) => SAFETY_DEVICE_RE.test(entry.itemName))
            .filter((entry) => {
              const hasBreakerSelected = entry.bill.items.some(
                (ri) => ri.item.category === "BREAKER" && selection[`${entry.itemId}__${ri.item.id}`]
              );
              return !hasBreakerSelected;
            })
            .map((entry) => getSafetyDeviceLabel(entry.itemName))
            .filter(Boolean) as string[];

          if (safetyAlerts.length === 0) return null;
          return (
            <div className="rounded-xl bg-gradient-to-br from-violet-50 via-purple-50 to-violet-50 dark:from-violet-950/30 dark:via-purple-950/25 dark:to-violet-950/30 border border-violet-200 dark:border-violet-700 shadow-sm overflow-hidden">
              <div className="flex items-start gap-2.5 p-3 text-xs">
                <div className="p-1.5 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex-shrink-0">
                  <ShieldCheck className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-violet-800 dark:text-violet-200 mb-1 flex items-center gap-1">
                    ✨ Ekspert: Brak zabezpieczeń RCD/MCB
                  </p>
                  {safetyAlerts.map((label, i) => (
                    <p key={i} className="text-violet-700 dark:text-violet-300 leading-relaxed">
                      Czy pamiętałeś o RCD dla <strong>{label}</strong>?{" "}
                      <span className="text-violet-500 dark:text-violet-400">Urządzenie wymaga dedykowanego obwodu z MCB + RCD.</span>
                    </p>
                  ))}
                </div>
              </div>
              <div className="border-t border-violet-200 dark:border-violet-700/60 bg-violet-100/60 dark:bg-violet-900/20 px-3 py-2 flex justify-end">
                <span className="text-[10px] text-violet-500 dark:text-violet-400">Sugestia Eksperta ES-Engine • Dodaj RCD/MCB poniżej</span>
              </div>
            </div>
          );
        })()}

        {/* Bills */}
        {hasBills && !isFetching && (
          <>
            {/* Select all bar */}
            <div className="flex items-center gap-2 px-1">
              <Checkbox
                checked={allSelected}
                onCheckedChange={(v) => handleSelectAllGroups(Boolean(v))}
                className="data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
              />
              <span className="text-xs text-slate-500">Zaznacz wszystkie</span>
              <span className="text-xs text-slate-400 ml-auto">
                {selectedCount} / {Object.keys(selection).length} pozycji
              </span>
            </div>

            <div className="space-y-2">
              {result.bills.map((entry) => (
                <LaborGroupCard
                  key={entry.itemId}
                  entry={entry}
                  selection={selection}
                  onCheck={handleCheck}
                  onSelectAll={handleSelectAll}
                />
              ))}
            </div>

            <Separator />

            {/* Grand total + save button */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Zaznaczone: {fmt(selectedNet)} PLN netto
                </p>
                <p className="text-[10px] text-slate-400">
                  Sugestie · nie są dodane do kosztorysu dopóki nie klikniesz "Dodaj"
                </p>
              </div>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={selectedCount === 0 || isSaving || isFetching}
                className="gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm h-10 px-4 shadow-md shadow-amber-500/20 font-semibold disabled:opacity-50 disabled:shadow-none"
              >
                {isSaving
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <PackagePlus className="w-4 h-4" />}
                {isSaving ? "Zapisywanie..." : `Dodaj do projektu${selectedCount > 0 ? ` (${selectedCount})` : ""}`}
              </Button>
            </div>

            {/* "Select all" shortcut */}
            <div className="flex items-center gap-1.5">
              <CheckSquare2 className="w-3 h-3 text-slate-400" />
              <button
                type="button"
                onClick={() => handleSelectAllGroups(true)}
                className="text-[10px] text-slate-400 hover:text-amber-600 transition-colors"
              >
                Zaznacz wszystkie
              </button>
              <span className="text-[10px] text-slate-300">·</span>
              <button
                type="button"
                onClick={() => handleSelectAllGroups(false)}
                className="text-[10px] text-slate-400 hover:text-slate-600 transition-colors"
              >
                Odznacz wszystkie
              </button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
