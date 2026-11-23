import type { ProjectItem } from "@/lib/types/database";

const PRODUCT_RE = /przew[oó]d|kabel|y(dyp|ky|dy)|gniazd|opraw|łącznik|lacznik|wyłącznik|wylacznik|włącznik|puszk|rur(k|a)|peszel|osprzęt|osprzet|kaset|szyn|rozdziel|bezpiecznik|r[oó]żnic|koryt|drabink|taśm|tasm|złącz|zlaczk|dławic|dlawic|obudow|ogranicznik|stycznik|przekaźnik|przekaznik|czuj|żarów|zarow|\bled\b|listw|uchwyt|kołek|kolek|ramk/i;

export function storedMaterial(item: ProjectItem): number {
  return Number(item.final_material_price ?? item.material_price ?? 0);
}

export function storedLabor(item: ProjectItem): number {
  return Number(item.final_labor_price ?? item.labor_price ?? 0);
}

function parentIds(items: ProjectItem[]): Set<string> {
  return new Set(items.map((item) => item.parent_assembly_id).filter((id): id is string => Boolean(id)));
}

export function isSellableMaterialLine(item: ProjectItem, materialsOwnedByCustomer: boolean, parents: Set<string>): boolean {
  if (materialsOwnedByCustomer || item.is_investor_material) return false;
  if (parents.has(item.id)) return false;
  if ((Number(item.quantity) || 0) <= 0) return false;
  return PRODUCT_RE.test(item.name);
}

export function materialGaps(items: ProjectItem[], materialsOwnedByCustomer: boolean): ProjectItem[] {
  const parents = parentIds(items);
  return items.filter((item) => isSellableMaterialLine(item, materialsOwnedByCustomer, parents) && storedMaterial(item) <= 0.009);
}

export function laborDiffersFromHours(item: ProjectItem, hourlyRate: number): boolean {
  const norm = Number(item.labor_norm ?? 0);
  if (norm <= 0 || hourlyRate < 1) return false;
  const expected = norm * hourlyRate;
  return Math.abs(storedLabor(item) - expected) > 0.05;
}

export interface ShoppingLine {
  name: string;
  unit: string;
  quantity: number;
  materialUnit: number;
}

export function shoppingLines(items: ProjectItem[], materialsOwnedByCustomer: boolean): ShoppingLine[] {
  if (materialsOwnedByCustomer) return [];
  const parents = parentIds(items);
  const grouped = new Map<string, ShoppingLine>();
  for (const item of items) {
    if (item.is_investor_material) continue;
    if (parents.has(item.id)) continue;
    if ((Number(item.quantity) || 0) <= 0) continue;
    const material = storedMaterial(item);
    if (!isSellableMaterialLine(item, false, parents) && material <= 0) continue;
    const key = `${item.name.trim().toLowerCase()}|${item.unit}`;
    const current = grouped.get(key) ?? { name: item.name, unit: item.unit, quantity: 0, materialUnit: 0 };
    const qty = Number(item.quantity) || 0;
    const previousQty = current.quantity;
    current.quantity += qty;
    current.materialUnit = current.quantity > 0
      ? ((current.materialUnit * previousQty) + (material * qty)) / current.quantity
      : 0;
    grouped.set(key, current);
  }
  return [...grouped.values()];
}
