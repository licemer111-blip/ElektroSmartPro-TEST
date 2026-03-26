"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Zap, FileText, Plus, Minus, Cable, Wrench,
  ChevronDown, ChevronUp, Pencil, Check, X,
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { RailModule } from "@/components/project/panel-configurator-types";
import type { BOMGroupedModule, BOMAccessoryItem } from "@/components/project/rozdzielnica/_parts/useBOMData";

export interface BOMPreviewProps {
  groupedModules: BOMGroupedModule[];
  consumables: BOMAccessoryItem[];
  laborItems: BOMAccessoryItem[];
  totalMaterialCost: number;
  totalLaborCost: number;
  selectedEnclosure: { modules: number; rows: number; name: string; price: number; laborPrice: number };
  isPro: boolean;
  showPrices: boolean;
  manufacturerCoeff: number;
  editingAccessoryUid: string | null;
  updateModule: (uid: string, changes: Partial<RailModule>) => void;
  removeModule: (uid: string) => void;
  setEditingAccessoryUid: React.Dispatch<React.SetStateAction<string | null>>;
}

export function BOMPreview({
  groupedModules,
  consumables,
  laborItems,
  totalMaterialCost,
  totalLaborCost,
  selectedEnclosure,
  isPro,
  showPrices,
  manufacturerCoeff,
  editingAccessoryUid,
  updateModule,
  removeModule,
  setEditingAccessoryUid,
}: BOMPreviewProps) {
  const { toast } = useToast();

  return (
    <div className="space-y-4">
      {/* Header totals */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300">Kosztorys i Specyfikacja</h3>
          <Badge variant="secondary" className="text-xs h-5 px-2">
            {groupedModules.length + consumables.length + laborItems.length} poz.
          </Badge>
        </div>
        {isPro && showPrices && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-600 dark:text-slate-400">
              Mat: {groupedModules.reduce((s, g) => s + g.perUnitMat * g.totalQty, 0).toFixed(0)} zł
            </span>
            <span className="text-xs text-slate-600 dark:text-slate-400">
              Rob: {groupedModules.reduce((s, g) => s + g.perUnitLab * g.totalQty, 0).toFixed(0)} zł
            </span>
            <span className="text-sm font-bold text-blue-600">
              {(totalMaterialCost + totalLaborCost - selectedEnclosure.price - selectedEnclosure.laborPrice).toFixed(0)} zł
            </span>
          </div>
        )}
      </div>

      {/* DIN modules group */}
      {groupedModules.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            Moduły DIN na szynach
          </h4>
          <div className="space-y-1">
            {groupedModules.map((group) => {
              const { firstItem, perUnitMat, perUnitLab, totalPrice, isZug, module, totalQty } = group;
              const isEditing = editingAccessoryUid === firstItem.uid;
              const Icon = module.icon;
              return (
                <React.Fragment key={group.key}>
                  <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-white/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors group">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Icon className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                      <span className="text-xs text-slate-700 dark:text-slate-300 truncate">
                        {firstItem.customName || module.namePl}{firstItem.rating ? ` ${firstItem.rating}A` : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 min-w-[40px] text-center">
                        {totalQty} szt.
                      </span>
                      {isPro && showPrices && (
                        <>
                          <span className="text-xs text-slate-500 dark:text-slate-400 min-w-[60px] text-right">{perUnitMat.toFixed(0)} zł</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 min-w-[60px] text-right">{perUnitLab.toFixed(0)} zł</span>
                          <span className="text-xs font-semibold text-emerald-600 min-w-[70px] text-right">{totalPrice.toFixed(0)} zł</span>
                        </>
                      )}
                      <button
                        onClick={() => setEditingAccessoryUid(prev => prev === firstItem.uid ? null : firstItem.uid)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all"
                        title="Edytuj"
                      >
                        <Pencil className="w-3 h-3 text-blue-500" />
                      </button>
                    </div>
                  </div>
                  {isEditing && (
                    <BOMInlineEditForm
                      item={firstItem}
                      isZug={isZug}
                      isDinModule
                      isPro={isPro}
                      defaultMat={Math.round(module.defaultPrice * manufacturerCoeff * 100) / 100}
                      defaultLab={module.defaultLaborPrice}
                      accentClass="emerald"
                      updateModule={updateModule}
                      onClose={() => setEditingAccessoryUid(null)}
                      onSave={(name) => { setEditingAccessoryUid(null); toast({ title: "Zapisano", description: name }); }}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Accessories */}
      {(consumables.length > 0 || laborItems.length > 0) && (
        <>
          <div className="text-xs text-slate-600 dark:text-slate-400 italic">
            ⚠️ Poniższe pozycje <strong>nie zajmują miejsca na szynach DIN</strong> — materiały montażowe, okablowanie i usługi.
          </div>
          <div className="grid grid-cols-2 gap-3">
            {/* Consumables */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-orange-700 dark:text-orange-300 flex items-center gap-1.5">
                <Cable className="w-3.5 h-3.5" />
                Materiały pomocnicze
              </h4>
              <div className="space-y-1">
                {consumables.map(({ item, qty, unit, totalPrice, isEditing }) => (
                  <BOMAccessoryRow
                    key={item.uid}
                    item={item}
                    qty={qty}
                    unit={unit}
                    totalPrice={totalPrice}
                    isEditing={isEditing}
                    isPro={isPro}
                    showPrices={showPrices}
                    colorClass="orange"
                    manufacturerCoeff={manufacturerCoeff}
                    updateModule={updateModule}
                    removeModule={removeModule}
                    setEditingAccessoryUid={setEditingAccessoryUid}
                    toast={toast}
                  />
                ))}
                {consumables.length === 0 && (
                  <div className="text-xs text-slate-400 dark:text-slate-500 italic px-2 py-3 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
                    Brak materiałów
                  </div>
                )}
              </div>
            </div>

            {/* Labor items */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5" />
                Robocizna
              </h4>
              <div className="space-y-1">
                {laborItems.map(({ item, qty, unit, totalPrice, isEditing }) => (
                  <BOMAccessoryRow
                    key={item.uid}
                    item={item}
                    qty={qty}
                    unit={unit}
                    totalPrice={totalPrice}
                    isEditing={isEditing}
                    isPro={isPro}
                    showPrices={showPrices}
                    colorClass="emerald"
                    manufacturerCoeff={manufacturerCoeff}
                    updateModule={updateModule}
                    removeModule={removeModule}
                    setEditingAccessoryUid={setEditingAccessoryUid}
                    toast={toast}
                  />
                ))}
                {laborItems.length === 0 && (
                  <div className="text-xs text-slate-400 dark:text-slate-500 italic px-2 py-3 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
                    Brak robocizny
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

interface BOMAccessoryRowProps {
  item: RailModule;
  qty: number;
  unit: string;
  totalPrice: number;
  isEditing: boolean;
  isPro: boolean;
  showPrices: boolean;
  colorClass: "orange" | "emerald";
  manufacturerCoeff: number;
  updateModule: (uid: string, changes: Partial<RailModule>) => void;
  removeModule: (uid: string) => void;
  setEditingAccessoryUid: React.Dispatch<React.SetStateAction<string | null>>;
  toast: ReturnType<typeof useToast>["toast"];
}

function BOMAccessoryRow({
  item, qty, unit, totalPrice, isEditing, isPro, showPrices,
  colorClass, manufacturerCoeff, updateModule, removeModule,
  setEditingAccessoryUid, toast,
}: BOMAccessoryRowProps) {
  const Icon = item.module.icon;
  const hoverBorder = colorClass === "orange"
    ? "hover:border-orange-300 dark:hover:border-orange-700"
    : "hover:border-emerald-300 dark:hover:border-emerald-700";
  const priceColor = colorClass === "orange" ? "text-orange-600" : "text-emerald-600";

  return (
    <React.Fragment>
      <div className={`flex items-center justify-between px-2 py-1.5 rounded-lg bg-white/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 ${hoverBorder} transition-colors group`}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Icon className={`w-3 h-3 ${colorClass === "orange" ? "text-orange-600" : "text-emerald-600"} flex-shrink-0`} />
          <span className="text-xs text-slate-700 dark:text-slate-300 truncate">
            {item.customName || item.module.namePl}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/50 rounded px-1.5 py-0.5 border border-slate-300 dark:border-slate-600">
            <button
              onClick={() => updateModule(item.uid, { quantity: Math.max(1, qty - 1) })}
              className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors"
              title="Zmniejsz ilość"
            >
              <Minus className="w-2.5 h-2.5 text-slate-600 dark:text-slate-400" />
            </button>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 min-w-[28px] text-center">
              {qty} {unit}
            </span>
            <button
              onClick={() => updateModule(item.uid, { quantity: qty + 1 })}
              className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors"
              title="Zwiększ ilość"
            >
              <Plus className="w-2.5 h-2.5 text-slate-600 dark:text-slate-400" />
            </button>
          </div>
          {isPro && showPrices && (
            <span className={`text-xs font-semibold ${priceColor} min-w-[50px] text-right`}>
              {totalPrice.toFixed(0)} zł
            </span>
          )}
          <button
            onClick={() => setEditingAccessoryUid(item.uid)}
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all"
            title="Edytuj"
          >
            <Pencil className="w-3 h-3 text-blue-500" />
          </button>
          <button
            onClick={() => removeModule(item.uid)}
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
            title="Usuń"
          >
            <X className="w-3 h-3 text-red-500" />
          </button>
        </div>
      </div>

      {isEditing && (
        <BOMInlineEditForm
          item={item}
          isPro={isPro}
          isZug={false}
          defaultMat={Math.round(item.module.defaultPrice * manufacturerCoeff * 100) / 100}
          defaultLab={item.module.defaultLaborPrice}
          showQty
          accentClass={colorClass}
          updateModule={updateModule}
          onClose={() => setEditingAccessoryUid(null)}
          onSave={(name) => { setEditingAccessoryUid(null); toast({ title: "Zapisano", description: name }); }}
        />
      )}
    </React.Fragment>
  );
}

interface BOMInlineEditFormProps {
  item: RailModule;
  isPro: boolean;
  isZug: boolean;
  isDinModule?: boolean;
  defaultMat: number;
  defaultLab: number;
  showQty?: boolean;
  accentClass: "emerald" | "orange";
  updateModule: (uid: string, changes: Partial<RailModule>) => void;
  onClose: () => void;
  onSave: (name: string) => void;
}

function BOMInlineEditForm({
  item, isPro, isZug, isDinModule = false, defaultMat, defaultLab, showQty = false, accentClass,
  updateModule, onClose, onSave,
}: BOMInlineEditFormProps) {
  const borderColor = accentClass === "emerald"
    ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50/80 dark:bg-emerald-950/20"
    : "border-orange-300 dark:border-orange-700 bg-orange-50/80 dark:bg-orange-950/20";
  const saveBg = accentClass === "emerald"
    ? "bg-emerald-600 hover:bg-emerald-700"
    : "bg-orange-600 hover:bg-orange-700";
  const qty = item.quantity || 1;
  const hasRatingOptions = isDinModule && item.module.ratingOptions && item.module.ratingOptions.length > 0;
  const isBreaker = isDinModule && (item.module.category === "breaker" || item.module.category === "rcbo" || item.module.category === "rcd");
  const isSinglePhase = isDinModule && item.module.modules === 1;

  return (
    <div className={`rounded-lg border ${borderColor} px-3 py-2 shadow-sm mt-1`}>
      {isDinModule && (
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Edytuj moduł</p>
      )}
      <div className="flex items-end gap-2 flex-wrap">
        {/* Opis / Nazwa */}
        <div className="flex-1 min-w-[120px]">
          <label htmlFor={`bom-desc-${item.uid}`} className="text-[11px] font-semibold text-slate-500 block">Opis obwodu</label>
          <Input
            id={`bom-desc-${item.uid}`}
            name={`bom-desc-${item.uid}`}
            value={isDinModule ? (item.label || "") : (item.customName || item.module.namePl)}
            onChange={(e) => isDinModule
              ? updateModule(item.uid, { label: e.target.value })
              : updateModule(item.uid, { customName: e.target.value })
            }
            className="h-6 text-[11px]"
            placeholder={isDinModule ? "np. oświetlenie salon" : item.module.namePl}
          />
        </div>
        {/* Rating (Prąd) — tylko DIN z ratingOptions */}
        {hasRatingOptions && (
          <div className="w-[70px]">
            <label className="text-[11px] font-semibold text-slate-500 block">Prąd (A)</label>
            <Select
              name={`bom-rating-${item.uid}`}
              value={String(item.rating ?? item.module.defaultRating ?? "")}
              onValueChange={(v) => updateModule(item.uid, { rating: parseInt(v) })}
            >
              <SelectTrigger id={`bom-rating-${item.uid}`} aria-label="Prąd" className="h-6 text-[11px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {item.module.ratingOptions!.map((r) => (
                  <SelectItem key={r} value={String(r)} className="text-xs">{r}A</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {/* Nr obwodu — tylko DIN */}
        {isDinModule && (
          <div className="w-[50px]">
            <label htmlFor={`bom-nr-${item.uid}`} className="text-[11px] font-semibold text-slate-500 block">Nr</label>
            <Input
              id={`bom-nr-${item.uid}`}
              name={`bom-nr-${item.uid}`}
              value={item.circuitNumber || ""}
              onChange={(e) => updateModule(item.uid, { circuitNumber: e.target.value })}
              className="h-6 text-[11px]"
              placeholder="1"
            />
          </div>
        )}
        {/* Faza — tylko 1P DIN */}
        {isSinglePhase && (
          <div className="w-[60px]">
            <label className="text-[11px] font-semibold text-slate-500 block">Faza</label>
            <Select
              name={`bom-phase-${item.uid}`}
              value={item.phase || "__none__"}
              onValueChange={(v) => updateModule(item.uid, { phase: v === "__none__" ? undefined : v as "L1" | "L2" | "L3" })}
            >
              <SelectTrigger id={`bom-phase-${item.uid}`} aria-label="Faza" className="h-6 text-[10px]"><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__" className="text-xs">—</SelectItem>
                <SelectItem value="L1" className="text-xs">L1</SelectItem>
                <SelectItem value="L2" className="text-xs">L2</SelectItem>
                <SelectItem value="L3" className="text-xs">L3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        {/* Kabel — tylko breaker/rcbo */}
        {isBreaker && (
          <div className="w-[110px]">
            <label htmlFor={`bom-cable-${item.uid}`} className="text-[11px] font-semibold text-slate-500 block">Przewód</label>
            <Input
              id={`bom-cable-${item.uid}`}
              name={`bom-cable-${item.uid}`}
              value={item.cableType || ""}
              onChange={(e) => updateModule(item.uid, { cableType: e.target.value })}
              className="h-6 text-[11px]"
              placeholder="3×2.5 mm²"
            />
          </div>
        )}
        {/* isZug terminal count */}
        {isZug && (
          <div className="w-[70px]">
            <label htmlFor={`bom-terminals-${item.uid}`} className="text-[11px] font-semibold text-slate-500 block">Ilość szt.</label>
            <Input
              id={`bom-terminals-${item.uid}`}
              name={`bom-terminals-${item.uid}`}
              aria-label="Ilość złączek"
              type="number" min={1} max={200} step={1}
              value={item.terminalCount || 15}
              onChange={(e) => updateModule(item.uid, { terminalCount: Math.max(1, parseInt(e.target.value) || 1) })}
              className="h-6 text-[11px]"
            />
          </div>
        )}
        {showQty && (
          <div className="w-[70px]">
            <label htmlFor={`bom-qty-${item.uid}`} className="text-[11px] font-semibold text-slate-500 block">Ilość</label>
            <Input
              id={`bom-qty-${item.uid}`}
              name={`bom-qty-${item.uid}`}
              aria-label="Ilość"
              type="number" min={1} step={1}
              value={qty}
              onChange={(e) => updateModule(item.uid, { quantity: parseInt(e.target.value) || 1 })}
              className="h-6 text-[11px]"
            />
          </div>
        )}
        {/* Ceny — Material i Robocizna */}
        <div className="w-[75px]">
          <label htmlFor={`bom-mat-${item.uid}`} className="text-[11px] font-semibold text-slate-500 block">Materiał (zł)</label>
          {isPro ? (
            <Input
              id={`bom-mat-${item.uid}`}
              name={`bom-mat-${item.uid}`}
              aria-label="Cena materiału"
              type="number" min={0} step={0.01}
              placeholder={String(defaultMat)}
              value={item.customMaterialPrice ?? ""}
              onChange={(e) => updateModule(item.uid, { customMaterialPrice: e.target.value === "" ? undefined : parseFloat(e.target.value) || 0 })}
              className="h-6 text-[11px]"
            />
          ) : (
            <div className="h-6 flex items-center text-[11px] text-slate-400 font-medium">***</div>
          )}
        </div>
        <div className="w-[75px]">
          <label htmlFor={`bom-lab-${item.uid}`} className="text-[11px] font-semibold text-slate-500 block">Robocizna (zł)</label>
          {isPro ? (
            <Input
              id={`bom-lab-${item.uid}`}
              name={`bom-lab-${item.uid}`}
              aria-label="Cena robocizny"
              type="number" min={0} step={0.01}
              placeholder={String(defaultLab)}
              value={item.customLaborPrice ?? ""}
              onChange={(e) => updateModule(item.uid, { customLaborPrice: e.target.value === "" ? undefined : parseFloat(e.target.value) || 0 })}
              className="h-6 text-[11px]"
            />
          ) : (
            <div className="h-6 flex items-center text-[11px] text-slate-400 font-medium">***</div>
          )}
        </div>
        <Button
          size="sm"
          className={`h-7 px-3 text-xs ${saveBg} text-white gap-1`}
          onClick={() => onSave(item.label || item.customName || item.module.namePl)}
        >
          <Check className="w-3 h-3" />
          OK
        </Button>
        <Button
          size="sm" variant="ghost"
          className="h-7 px-2 text-xs"
          onClick={onClose}
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}
