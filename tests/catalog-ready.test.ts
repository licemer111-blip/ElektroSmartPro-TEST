import { describe, expect, it } from "vitest";
import { catalogNameMatches, catalogSearchRank, isLegacySizeChase } from "@/lib/catalog/catalog-search";
import { resolveCatalogHours } from "@/lib/catalog/catalog-work";
import { findCanonicalL0 } from "@/lib/services/canonical-knr-l0";
import { dedupeObjectTypes, vatForObjectType } from "@/lib/projects/object-vat";
import { STARTER_KITS, resolveStarterLine } from "@/lib/assemblies/starter-kits";

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
    expect(catalogNameMatches("bruzda", "Kucie bruzd w ścianie (cegła/bloczki)")).toBe(true);
  });

  it("hides the old size-split chase rows", () => {
    expect(isLegacySizeChase("Bruzda w cegle 20x20mm")).toBe(true);
    expect(isLegacySizeChase("Bruzda w betonie 40x40mm")).toBe(true);
    expect(catalogNameMatches("bruzda", "Bruzda w cegle 20x20mm")).toBe(false);
    expect(catalogNameMatches("bruzda", "Bruzda w betonie 40x40mm")).toBe(false);
    expect(catalogNameMatches("bruzda", "Bruzda w płycie G-K")).toBe(true);
    expect(catalogNameMatches("bruzda", "Bruzda w tynku gipsowym")).toBe(true);
  });

  it("does not match a disconnector, a changeover or a word that only contains łącznik", () => {
    expect(catalogNameMatches("lacznik", "Rozłącznik izolacyjny 2P 63A")).toBe(false);
    expect(catalogNameMatches("lacznik", "Włącznik krzyżowy")).toBe(false);
    expect(catalogNameMatches("lacznik", "Przełącznik ATS 63A")).toBe(false);
    expect(catalogNameMatches("lacznik", "Łącznik schodowy p/t")).toBe(true);
  });

  it("does not turn a chase search into cable laying or a glued typo", () => {
    expect(catalogNameMatches("bruzda", "Układanie przewodu w bruździe (za mb)")).toBe(false);
    expect(catalogNameMatches("bruzda", "Montaż YDYp 3x2.5mm² w bruździe")).toBe(false);
    expect(catalogNameMatches("bruzda", "Zaprawianie bruzd")).toBe(false);
    expect(catalogNameMatches("bruzda", "Układanie przewodu w bruździeutr (za mb)")).toBe(false);
  });

  it("ranks the canonical chase name and drops the old size row", () => {
    expect(catalogSearchRank("bruzda", "Bruzdowanie w cegle")).toBeGreaterThan(0);
    expect(catalogSearchRank("bruzda", "Bruzda w cegle 20x20mm")).toBe(0);
  });

  it("keeps cable search on the cable, including one laid in a chase", () => {
    expect(catalogNameMatches("ydyp", "Montaż YDYp 3x2.5mm² w bruździe")).toBe(true);
    expect(catalogNameMatches("ydyp 3x2.5", "Układanie przewodu YDYp 3×2.5")).toBe(true);
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

describe("the same work has one hour in a flat, office, shop or hall", () => {
  const rows: Array<[string, string, number]> = [
    ["Gniazdo 230V p/t pojedyncze", "szt", 0.68],
    ["Łącznik pojedynczy p/t", "szt", 0.45],
    ["Wyłącznik różnicowy", "szt", 0.30],
    ["Wyłącznik nadprądowy 1P", "szt", 0.20],
    ["Puszka podtynkowa", "szt", 0.15],
    ["Punkt świetlny", "szt", 0.35],
    ["Oprawa LED panel 60x60", "szt", 0.72],
    ["Oprawa hermetyczna IP65", "szt", 0.45],
    ["Układanie przewodu YDYp 3x2.5", "mb", 0.16],
    ["Bruzdowanie w cegle", "mb", 0.85],
    ["Bruzdowanie w betonie", "mb", 2],
    ["Bruzdowanie w żelbecie", "mb", 2.5],
    ["Zaprawianie bruzd", "mb", 0.12],
  ];

  it.each(rows)("%s is %s h", (name, unit, hours) => {
    expect(findCanonicalL0(name, unit)?.laborNorm).toBe(hours);
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

describe("starter kits", () => {
  it("takes every line from the ES hour norm and does not invent a material price", () => {
    for (const kit of STARTER_KITS) {
      expect(kit.lines.length).toBeGreaterThan(0);
      for (const line of kit.lines) {
        const resolved = resolveStarterLine(line);
        expect(resolved, line.name).not.toBeNull();
        expect(resolved?.laborNorm).toBeGreaterThan(0);
      }
    }
  });
});
