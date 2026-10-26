import { findCanonicalL0 } from "@/lib/services/canonical-knr-l0";

export interface CatalogWorkInput {
  user_id?: string | null;
  name: string;
  unit: string;
  labor_norm_rbh?: number | null;
  knr_code?: string | null;
  base_material_price?: number | null;
  base_labor_price?: number | null;
}

export interface ResolvedCatalogWork {
  hours: number;
  code: string | null;
  source: "stored" | "es" | "none";
}

/** Hours for a shared catalog row. Stored rbh wins. Otherwise the same ES list the estimate already uses. */
export function resolveCatalogHours(item: CatalogWorkInput): ResolvedCatalogWork {
  const stored = Number(item.labor_norm_rbh) || 0;
  if (stored > 0) {
    return { hours: stored, code: item.knr_code ?? null, source: "stored" };
  }
  const match = findCanonicalL0(item.name, item.unit);
  if (match) {
    return { hours: match.laborNorm, code: match.knrCode, source: "es" };
  }
  return { hours: 0, code: item.knr_code ?? null, source: "none" };
}

/** Base labor zł. Region is applied later, on the estimate screen. */
export function laborFromHours(hours: number, hourlyRate: number): number {
  if (hours <= 0 || hourlyRate < 1) return 0;
  return Math.round(hours * hourlyRate * 100) / 100;
}

function pln(value: number): string {
  return value.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** What the catalog row shows. Shared rows show hours. Personal rows show the electrician's own zł. */
export function catalogAsideText(item: CatalogWorkInput): string {
  if (item.user_id) {
    const mat = Number(item.base_material_price) || 0;
    const lab = Number(item.base_labor_price) || 0;
    const parts: string[] = [];
    if (mat > 0) parts.push(`${pln(mat)} zł mat.`);
    if (lab > 0) parts.push(`${pln(lab)} zł rob.`);
    return parts.length > 0 ? parts.join(" · ") : "twoja pozycja";
  }
  const { hours } = resolveCatalogHours(item);
  if (hours > 0) {
    return `${hours.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} rbh`;
  }
  return "bez normy";
}
