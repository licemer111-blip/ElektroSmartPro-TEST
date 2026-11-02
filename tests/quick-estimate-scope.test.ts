import { describe, expect, it } from "vitest";
import { generateEstimateItems } from "@/lib/quick-estimate-config";

function qty(objectType: "mieszkanie" | "dom", areaM2: number, roomCount: number, needle: string) {
  const items = generateEstimateItems({
    objectType,
    areaM2,
    roomCount,
    standard: "standard",
  });
  return items.find((item) => item.name.toLowerCase().includes(needle))?.quantity;
}

describe("quick estimate scope", () => {
  it("gives a 50 m² flat one RCD and one breaker per circuit", () => {
    expect(qty("mieszkanie", 50, 3, "różnicowoprądowy")).toBe(1);
    expect(qty("mieszkanie", 50, 3, "nadprądowy")).toBe(6);
  });

  it("adds a second RCD only when the flat is larger", () => {
    expect(qty("mieszkanie", 80, 4, "różnicowoprądowy")).toBe(2);
  });

  it("keeps a house on two or three groups, not one RCD per circuit", () => {
    expect(qty("dom", 120, 5, "różnicowoprądowy")).toBe(2);
    expect(qty("dom", 200, 8, "różnicowoprądowy")).toBe(3);
  });
});
