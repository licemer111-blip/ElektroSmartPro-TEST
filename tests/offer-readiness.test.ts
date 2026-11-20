import { describe, expect, it } from "vitest";
import { laborDiffersFromHours, materialGaps, shoppingLines } from "@/lib/estimate/offer-readiness";
import type { ProjectItem } from "@/lib/types/database";

function line(partial: Partial<ProjectItem>): ProjectItem {
  return {
    id: "1",
    project_id: "p",
    catalog_item_id: null,
    name: "Przewód YDYp 3x2,5",
    unit: "mb",
    quantity: 10,
    final_material_price: 0,
    final_labor_price: 1.6,
    labor_norm: 0.16,
    ...partial,
  } as ProjectItem;
}

describe("offer readiness", () => {
  it("asks for a material price before the cable goes to the client", () => {
    const gaps = materialGaps([line({})], false);
    expect(gaps).toHaveLength(1);
    expect(materialGaps([line({})], true)).toHaveLength(0);
    expect(materialGaps([line({ name: "Bruzdowanie w cegle", final_material_price: 0 })], false)).toHaveLength(0);
  });

  it("marks labor that is not hours times the rate", () => {
    expect(laborDiffersFromHours(line({ final_labor_price: 12.8, labor_norm: 0.16 }), 80)).toBe(false);
    expect(laborDiffersFromHours(line({ final_labor_price: 40, labor_norm: 0.022 }), 80)).toBe(true);
  });

  it("builds a purchase list with quantity", () => {
    const list = shoppingLines([
      line({ quantity: 4 }),
      line({ id: "2", quantity: 6, final_material_price: 3 }),
    ], false);
    expect(list).toHaveLength(1);
    expect(list[0].quantity).toBe(10);
    expect(list[0].materialUnit).toBeCloseTo(1.8);
  });
});
