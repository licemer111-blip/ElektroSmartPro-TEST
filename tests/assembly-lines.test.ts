import { describe, expect, it } from "vitest";
import {
  assemblyLineQuantity,
  assemblyPricesForEstimate,
  linesFromCatalogPick,
} from "@/lib/assemblies/line-quantity";

describe("assembly cable length", () => {
  it("replaces the kit meters instead of multiplying them", () => {
    expect(assemblyLineQuantity(12, "mb", 2, 20)).toBe(40);
  });

  it("keeps the kit meters when no route is typed", () => {
    expect(assemblyLineQuantity(12, "mb", 2, null)).toBe(24);
  });

  it("does not treat a socket as cable", () => {
    expect(assemblyLineQuantity(1, "szt", 3, 20)).toBe(3);
  });
});

describe("assembly labor price", () => {
  it("prices labor from hours times the rate", () => {
    const priced = assemblyPricesForEstimate({
      type: "labor",
      price: 999,
      hours: 0.68,
      hourlyRate: 80,
      knrCode: "ES-1",
    });
    expect(priced.labor).toBe(54.4);
    expect(priced.hours).toBe(0.68);
    expect(priced.manual).toBe(false);
    expect(priced.knrCode).toBe("ES-1");
  });

  it("keeps a flat labor amount when there are no hours", () => {
    const priced = assemblyPricesForEstimate({
      type: "labor",
      price: 40,
      hours: null,
      hourlyRate: 80,
    });
    expect(priced.labor).toBe(40);
    expect(priced.hours).toBeNull();
    expect(priced.manual).toBe(true);
  });
});

describe("catalog pick into a kit", () => {
  it("splits a row that has material and hours", () => {
    const lines = linesFromCatalogPick({
      name: "Gniazdo",
      unit: "szt",
      materialPrice: 12,
      laborPrice: 0,
      hours: 0.68,
      knrCode: "ES-G",
    });
    expect(lines).toHaveLength(2);
    expect(lines[0].type).toBe("material");
    expect(lines[0].price).toBe(12);
    expect(lines[1].type).toBe("labor");
    expect(lines[1].laborNorm).toBe(0.68);
  });
});
