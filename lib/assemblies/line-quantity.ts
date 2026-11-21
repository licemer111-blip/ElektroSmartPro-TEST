/** Meters of cable in a kit. A typed route replaces those meters. It does not multiply them. */

export function isCableUnit(unit: string): boolean {
  const u = unit.trim().toLowerCase().replace(/\s+/g, "");
  return u === "mb" || u === "m" || u === "m.b." || u === "mb.";
}

export function assemblyLineQuantity(
  itemQuantity: number,
  unit: string,
  setCount: number,
  cableLength?: number | null,
): number {
  const sets = setCount > 0 ? setCount : 1;
  const perSet =
    isCableUnit(unit) && cableLength != null && cableLength > 0
      ? cableLength
      : itemQuantity;
  return sets * perSet;
}

export interface AssemblyPriceInput {
  type: "material" | "labor";
  price: number;
  hours: number | null;
  hourlyRate: number;
  knrCode?: string | null;
}

export interface AssemblyPriceResult {
  material: number;
  labor: number;
  hours: number | null;
  knrCode: string | null;
  /** Flat zł with no hours. The estimate must not apply the voivodeship on top. */
  manual: boolean;
}

/** Labor with hours is hours × the project rate, region added later on screen. */
export function assemblyPricesForEstimate(input: AssemblyPriceInput): AssemblyPriceResult {
  if (input.type !== "labor") {
    return { material: input.price, labor: 0, hours: null, knrCode: null, manual: false };
  }
  const hours = input.hours != null && input.hours > 0 ? input.hours : null;
  if (hours != null && input.hourlyRate >= 1) {
    return {
      material: 0,
      labor: Math.round(hours * input.hourlyRate * 100) / 100,
      hours,
      knrCode: input.knrCode ?? null,
      manual: false,
    };
  }
  if (hours != null) {
    return {
      material: 0,
      labor: input.price,
      hours,
      knrCode: input.knrCode ?? null,
      manual: false,
    };
  }
  return {
    material: 0,
    labor: input.price,
    hours: null,
    knrCode: null,
    manual: input.price > 0,
  };
}

export interface CatalogPickLine {
  name: string;
  unit: string;
  type: "material" | "labor";
  price: number;
  quantity: number;
  laborNorm: number | null;
  knrCode: string | null;
}

/** A cennik row with both sides becomes two kit lines, so neither price nor the hours are dropped. */
export function linesFromCatalogPick(pick: {
  name: string;
  unit: string;
  materialPrice: number;
  laborPrice: number;
  hours: number | null;
  knrCode: string | null;
}): CatalogPickLine[] {
  const material = Number(pick.materialPrice) || 0;
  const labor = Number(pick.laborPrice) || 0;
  const hours = pick.hours != null && pick.hours > 0 ? pick.hours : null;
  const hasMaterial = material > 0;
  const hasLabor = labor > 0 || hours != null;
  const base = { name: pick.name.trim(), unit: pick.unit || "szt", quantity: 1 };
  if (hasMaterial && hasLabor) {
    return [
      { ...base, type: "material", price: material, laborNorm: null, knrCode: null },
      { ...base, type: "labor", price: labor, laborNorm: hours, knrCode: pick.knrCode },
    ];
  }
  if (hasLabor) {
    return [{ ...base, type: "labor", price: labor, laborNorm: hours, knrCode: pick.knrCode }];
  }
  return [{ ...base, type: "material", price: material, laborNorm: null, knrCode: null }];
}
