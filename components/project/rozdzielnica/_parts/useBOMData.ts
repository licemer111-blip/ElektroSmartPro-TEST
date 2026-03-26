"use client";

import { useMemo } from "react";
import { getModulePrice, isConsumableCategory, isLaborCategory, getItemUnit } from "@/components/project/panel-configurator-helpers";
import type { RailModule, DinModule } from "@/components/project/panel-configurator-types";

export interface BOMGroupedModule {
  module: DinModule;
  items: RailModule[];
  totalQty: number;
  isZug: boolean;
  firstItem: RailModule;
  perUnitMat: number;
  perUnitLab: number;
  totalPrice: number;
  key: string;
}

export interface BOMAccessoryItem {
  item: RailModule;
  qty: number;
  unit: string;
  totalPrice: number;
  isEditing: boolean;
}

export interface BOMData {
  groupedModules: BOMGroupedModule[];
  consumables: BOMAccessoryItem[];
  laborItems: BOMAccessoryItem[];
  totalModulesPrice: number;
  totalConsumablesPrice: number;
  totalLaborItemsPrice: number;
}

export function useBOMData({
  railModules,
  accessoryItems,
  manufacturerCoeff,
  editingAccessoryUid,
}: {
  railModules: RailModule[];
  accessoryItems: RailModule[];
  manufacturerCoeff: number;
  editingAccessoryUid: string | null;
}): BOMData {
  return useMemo(() => {
    // Group DIN rail modules
    const grouped = new Map<string, { module: DinModule; items: RailModule[]; totalQty: number; isZug: boolean }>();
    railModules.forEach((m) => {
      const key = `${m.module.id}-${m.rating || 0}`;
      const qty = m.isZugBlock ? (m.terminalCount || 15) : 1;
      if (!grouped.has(key)) {
        grouped.set(key, { module: m.module, items: [m], totalQty: qty, isZug: !!m.isZugBlock });
      } else {
        const g = grouped.get(key)!;
        g.items.push(m);
        g.totalQty += qty;
      }
    });

    const groupedModules: BOMGroupedModule[] = Array.from(grouped.entries()).map(([key, g]) => {
      const firstItem = g.items[0];
      const perUnitMat =
        firstItem.customMaterialPrice ??
        Math.round(firstItem.module.defaultPrice * manufacturerCoeff * 100) / 100;
      const perUnitLab = firstItem.customLaborPrice ?? firstItem.module.defaultLaborPrice;
      return {
        module: g.module,
        items: g.items,
        totalQty: g.totalQty,
        isZug: g.isZug,
        firstItem,
        perUnitMat,
        perUnitLab,
        totalPrice: (perUnitMat + perUnitLab) * g.totalQty,
        key,
      };
    });

    const consumables: BOMAccessoryItem[] = accessoryItems
      .filter((m) => isConsumableCategory(m.module.category))
      .map((item) => ({
        item,
        qty: item.quantity || 1,
        unit: getItemUnit(item.module),
        totalPrice: getModulePrice(item, manufacturerCoeff).material + getModulePrice(item, manufacturerCoeff).labor,
        isEditing: editingAccessoryUid === item.uid,
      }));

    const laborItems: BOMAccessoryItem[] = accessoryItems
      .filter((m) => isLaborCategory(m.module.category))
      .map((item) => ({
        item,
        qty: item.quantity || 1,
        unit: getItemUnit(item.module),
        totalPrice: getModulePrice(item, manufacturerCoeff).material + getModulePrice(item, manufacturerCoeff).labor,
        isEditing: editingAccessoryUid === item.uid,
      }));

    const totalModulesPrice = groupedModules.reduce((s, g) => s + g.totalPrice, 0);
    const totalConsumablesPrice = consumables.reduce((s, c) => s + c.totalPrice, 0);
    const totalLaborItemsPrice = laborItems.reduce((s, l) => s + l.totalPrice, 0);

    return {
      groupedModules,
      consumables,
      laborItems,
      totalModulesPrice,
      totalConsumablesPrice,
      totalLaborItemsPrice,
    };
  }, [railModules, accessoryItems, manufacturerCoeff, editingAccessoryUid]);
}
