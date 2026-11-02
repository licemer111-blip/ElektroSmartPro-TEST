import { describe, expect, it } from "vitest";
import { catalogNameMatches } from "@/lib/catalog/catalog-search";
import { resolveCatalogHours } from "@/lib/catalog/catalog-work";
import { dedupeObjectTypes, vatForObjectType } from "@/lib/projects/object-vat";

describe("catalog name search", () => {
  it("finds a switch written without Polish letters", () => {
    expect(catalogNameMatches("lacznik", "Łącznik pojedynczy p/t")).toBe(true);
  });

  it("does not treat a breaker as a light switch", () => {
    expect(catalogNameMatches("lacznik", "Wyłącznik nadprądowy 1P")).toBe(false);
    expect(catalogNameMatches("łącznik", "Wyłącznik nadprądowy 1P")).toBe(false);
  });

  it("still finds the breaker by its own name", () => {
    expect(catalogNameMatches("wylacznik", "Wyłącznik nadprądowy 1P")).toBe(true);
  });

  it("treats bruzda and bruzdowanie as the same work", () => {
    expect(catalogNameMatches("bruzda", "Bruzdowanie w cegle")).toBe(true);
    expect(catalogNameMatches("bruzda", "Bruzda w cegle 20x20mm")).toBe(true);
  });

  it("does not match a socket cable when the query is just a socket", () => {
    expect(catalogNameMatches("gniazdo", "Kabel gniazdkowy")).toBe(false);
    expect(catalogNameMatches("gniazdo", "Gniazdo 230V p/t pojedyncze")).toBe(true);
  });
});

describe("shared catalog hours", () => {
  it("uses the ES brick-chase norm even when an old row stored a different hour", () => {
    const resolved = resolveCatalogHours({
      user_id: null,
      name: "Bruzda w cegle 20x20mm",
      unit: "m",
      labor_norm_rbh: 0.28,
    });
    expect(resolved.hours).toBe(0.85);
    expect(resolved.source).toBe("es");
  });

  it("keeps the electrician's own stored hours", () => {
    const resolved = resolveCatalogHours({
      user_id: "user-1",
      name: "Bruzda w cegle 20x20mm",
      unit: "m",
      labor_norm_rbh: 1.1,
      knr_code: null,
    });
    expect(resolved.hours).toBe(1.1);
    expect(resolved.source).toBe("stored");
  });
});

describe("object type VAT", () => {
  it("starts an apartment at 8 percent", () => {
    expect(vatForObjectType("Mieszkanie / Dom (VAT 8/23%)", 23)).toBe(8);
  });

  it("starts an office at 23 percent", () => {
    expect(vatForObjectType("Biuro / Lokale (VAT 23%)", 23)).toBe(23);
  });

  it("shows one row when old names collapse to the same label", () => {
    const rows = dedupeObjectTypes([
      { id: "1", name: "Biuro / Lokale (VAT 23%)", slug: "biuro" },
      { id: "2", name: "Lokal usługowy", slug: "lokal-uslugowy" },
      { id: "3", name: "Mieszkanie / Dom (VAT 8/23%)", slug: "mieszkanie" },
    ]);
    expect(rows.map((row) => row.id)).toEqual(["3", "1"]);
  });
});
