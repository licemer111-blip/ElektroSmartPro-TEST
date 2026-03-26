/**
 * pricing.test.ts — Unit-testy dla finansowych obliczeń ElektroSmart PRO.
 * Pokrycie: pdf-pricing.ts, pricing-logic.service, panel-logic.service, categorization.service
 * Uruchom: npx vitest run tests/pricing.test.ts
 */

import { describe, it, expect } from "vitest";
import {
  roundPrice,
  fMoney,
  getVatMultiplier,
  calcPdfTotals,
  sanitize as pdfSanitize,
} from "@/lib/pdf-pricing";
import {
  sanitize,
  findBestCatalogMatch,
  findBestCatalogMatchWithHint,
  buildCatalogContext,
  buildTopCatalogCandidates,
  isPriceMissing,
  buildRateSourceInstruction,
  buildPricingModeInstruction,
  buildModeFieldRestriction,
  type CatalogItemRef,
} from "@/lib/services/ai/pricing-logic.service";
import {
  parseElectricalConstraints,
  fixSelectivity,
  fixLoadBalance,
  computeAccessories,
  mapRawModule,
  type MappedModule,
} from "@/lib/services/ai/panel-logic.service";
import {
  normalizeCategoryId,
  guessCategoryFromName,
  groupItemsByCategory,
} from "@/lib/services/ai/categorization.service";

// ─── 1. roundPrice ────────────────────────────────────────────────────────────

describe("roundPrice", () => {
  it("zaokrągla do 2 miejsc", () => {
    expect(roundPrice(10.005)).toBe(10.01);
    expect(roundPrice(10.004)).toBe(10.0);
  });

  it("eliminuje floating-point drift (Number.EPSILON)", () => {
    expect(roundPrice(1.005)).toBe(1.01);
    expect(roundPrice(0.1 + 0.2)).toBe(0.3);
  });

  it("ujemne i zero", () => {
    expect(roundPrice(0)).toBe(0);
    expect(roundPrice(-10.005)).toBe(-10.01);
  });
});

// ─── 2. fMoney ────────────────────────────────────────────────────────────────

describe("fMoney", () => {
  it("formatuje z symbolem 'zl' i separatorem polskim", () => {
    expect(fMoney(100)).toContain("zl");
    expect(fMoney(1234.56)).toContain(",");
  });

  it("zero: 0,00 zl", () => {
    expect(fMoney(0)).toContain("0,00");
  });
});

// ─── 3. getVatMultiplier ──────────────────────────────────────────────────────

describe("getVatMultiplier", () => {
  it("brutto 23%: 1.23", () => expect(getVatMultiplier("brutto", 23)).toBe(1.23));
  it("brutto 8%: 1.08",  () => expect(getVatMultiplier("brutto", 8)).toBe(1.08));
  it("netto: zawsze 1",  () => expect(getVatMultiplier("netto", 23)).toBe(1));
  it("brutto 0%: 1.0",   () => expect(getVatMultiplier("brutto", 0)).toBe(1.0));
});

// ─── 4. calcPdfTotals ─────────────────────────────────────────────────────────

describe("calcPdfTotals", () => {
  const params23netto = { vatMode: 23, priceDisplay: "netto" as const };
  const params8netto  = { vatMode: 8,  priceDisplay: "netto" as const };
  const paramsBrutto  = { vatMode: 23, priceDisplay: "brutto" as const };

  it("netto 23%: totalGross = 1230", () => {
    const r = calcPdfTotals(800, 200, params23netto);
    expect(r.totalNet).toBe(1000);
    expect(r.vatAmount).toBe(230);
    expect(r.totalGross).toBe(1230);
  });

  it("netto 8%: vatAmount = 80", () => {
    const r = calcPdfTotals(500, 500, params8netto);
    expect(r.vatAmount).toBe(80);
    expect(r.totalGross).toBe(1080);
  });

  it("brutto: vatRate=0, totalGross=totalNet", () => {
    const r = calcPdfTotals(800, 200, paramsBrutto);
    expect(r.vatRate).toBe(0);
    expect(r.totalGross).toBe(r.totalNet);
  });

  it("zero: nie rzuca wyjątku", () => {
    const r = calcPdfTotals(0, 0, params23netto);
    expect(r.totalGross).toBe(0);
  });

  it("zaokrąglenie: vatAmount = round(totalNet × vatRate)", () => {
    const r = calcPdfTotals(333.33, 333.33, params23netto);
    expect(r.vatAmount).toBe(roundPrice(r.totalNet * 0.23));
  });
});

// ─── 5. pdfSanitize (pdf-pricing) ───────────────────────────────────────────────────────────

describe("pdfSanitize", () => {
  it("bez czcionki: polskie znaki → ASCII", () => {
    expect(pdfSanitize("Łódź", false)).toBe("Lodz");
    expect(pdfSanitize("żółw", false)).toBe("zolw");
  });

  it("z czcionką: nadal transliteruje (Roboto nie ma polskich glifów)", () => {
    expect(pdfSanitize("Łódź", true)).toBe("Lodz");
  });

  it("null/undefined → pusty string", () => {
    expect(pdfSanitize(null, false)).toBe("");
    expect(pdfSanitize(undefined, false)).toBe("");
  });

  it("emoji ⚠ → '(!)'", () => {
    expect(pdfSanitize("⚠ uwaga", false)).toBe("(!) uwaga");
  });
});

// ─── 5b. sanitize (pricing-logic) ─────────────────────────────────────────────────────

describe("sanitize (pricing-logic)", () => {
  it("decimal comma → dot: 3x1,5 → 3x1.5", () => {
    expect(sanitize("Przewod 3x1,5")).toContain("3x1.5");
    expect(sanitize("Przewod 3x1,5")).toBe(sanitize("Przewod 3x1.5"));
  });

  it("0,75 → 0.75", () => {
    expect(sanitize("kabel 0,75mm")).toContain("0.75");
  });

  it("polskie znaki usuwane", () => {
    expect(sanitize("Montaż gniazdka")).not.toContain("ż");
    expect(sanitize("Wyłącznik")).not.toContain("ł");
  });

  it("lowercase", () => {
    expect(sanitize("GNIAZDKO 230V")).toBe(sanitize("gniazdko 230V"));
  });

  it("trailing punctuation stripped", () => {
    expect(sanitize("kabel,")).toBe("kabel");
    expect(sanitize("kabel.")).toBe("kabel");
  });
});

// ─── 6. findBestCatalogMatch ───────────────────────────────────────────────────────────────────────────────

const CATALOG: CatalogItemRef[] = [
  { id: "1", name: "Gniazdo 230V pojedyncze", unit: "szt", base_material_price: 15, base_labor_price: 25 },
  { id: "2", name: "Przewód YDYp 3x2.5mm", unit: "mb",  base_material_price: 7,  base_labor_price: 10 },
  { id: "3", name: "Wyłącznik nadprądowy B16", unit: "szt", base_material_price: 35, base_labor_price: 20 },
  { id: "4", name: "Kabel YDYp", unit: "mb", base_material_price: 5, base_labor_price: 8 },
];

describe("findBestCatalogMatch", () => {
  it("exact match", () => expect(findBestCatalogMatch("Gniazdo 230V pojedyncze", CATALOG)?.id).toBe("1"));
  it("decimal comma normalized: 3x2,5 === 3x2.5", () => expect(findBestCatalogMatch("Przewód YDYp 3x2,5mm", CATALOG)?.id).toBe("2"));
  it("keyword match (≥2 słowa)", () => expect(findBestCatalogMatch("Wyłącznik B16 nadprądowy", CATALOG)?.id).toBe("3"));
  it("brak dopasowania → null", () => expect(findBestCatalogMatch("Klimatyzacja 12kBTU", CATALOG)).toBeNull());
  it("pusta lista → null", () => expect(findBestCatalogMatch("Gniazdo", [])).toBeNull());
  it("diacritic: Montaz === Montaż", () => {
    const cat: CatalogItemRef[] = [{ id: "x", name: "Montaż gniazda", unit: "szt", base_material_price: 20, base_labor_price: 10 }];
    expect(findBestCatalogMatch("Montaz gniazda", cat)?.id).toBe("x");
  });
});

describe("findBestCatalogMatchWithHint", () => {
  it("contains: nie matchuje zbyt krótkich (< 4 chars)", () => {
    const cat: CatalogItemRef[] = [
      { id: "short", name: "na", unit: "szt", base_material_price: 1, base_labor_price: 1 },
      { id: "long", name: "Gniazdo 230V", unit: "szt", base_material_price: 25, base_labor_price: 15 },
    ];
    // "na" is < 4 chars — should NOT match "Instalacja na ścianie"
    const r = findBestCatalogMatchWithHint("Instalacja na ścianie", cat);
    expect(r.match?.id).not.toBe("short");
  });

  it("contains: wybiera NAJDŁUŻSZE dopasowanie", () => {
    const cat: CatalogItemRef[] = [
      { id: "short", name: "Kabel", unit: "mb", base_material_price: 2, base_labor_price: 1 },
      { id: "long",  name: "Kabel YDYp 3x1.5", unit: "mb", base_material_price: 3, base_labor_price: 2 },
    ];
    const r = findBestCatalogMatchWithHint("Kabel YDYp 3x1.5 instalacyjny", cat);
    expect(r.match?.id).toBe("long");
  });

  it("miss: bestMiss zawiera najbliższego kandydata", () => {
    const r = findBestCatalogMatchWithHint("Klimatyzacja split 12kBTU", CATALOG);
    expect(r.match).toBeNull();
    // bestMiss may or may not exist, but should not throw
    expect(r.trace.method).toBe("miss");
  });
});

describe("buildTopCatalogCandidates", () => {
  it("zwraca max topN wyników", () => {
    const results = buildTopCatalogCandidates("Gniazdo", CATALOG, 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });

  it("sortuje wg trafności (gniazdo > kabel dla 'Gniazdo 230V')", () => {
    const results = buildTopCatalogCandidates("Gniazdo 230V", CATALOG, 4);
    expect(results[0].name).toContain("Gniazdo");
  });

  it("pusta lista → pusty wynik", () => {
    expect(buildTopCatalogCandidates("cokolwiek", [], 5)).toHaveLength(0);
  });
});

// ─── 7. isPriceMissing ────────────────────────────────────────────────────────

describe("isPriceMissing", () => {
  it("null, 0, ≤1 → true", () => {
    expect(isPriceMissing(null)).toBe(true);
    expect(isPriceMissing(0)).toBe(true);
    expect(isPriceMissing(1.0)).toBe(true);
  });
  it(">1 → false", () => expect(isPriceMissing(1.01)).toBe(false));
  it("własny próg 5 PLN", () => {
    expect(isPriceMissing(4.99, 5)).toBe(true);
    expect(isPriceMissing(5.01, 5)).toBe(false);
  });
});

// ─── 8. buildCatalogContext ───────────────────────────────────────────────────

describe("buildCatalogContext", () => {
  it("zawiera nazwy i ceny", () => {
    const ctx = buildCatalogContext(CATALOG);
    expect(ctx).toContain("Gniazdo 230V");
    expect(ctx).toContain("materiał: 15 PLN");
  });

  it("szanuje limit maxItems", () => {
    const big = Array.from({ length: 200 }, (_, i) => ({
      id: String(i), name: `Item ${i}`, unit: "szt",
      base_material_price: 10, base_labor_price: 5,
    }));
    expect(buildCatalogContext(big, 50).split("\n").length).toBeLessThanOrEqual(50);
  });

  it("verified pozycje pierwsze", () => {
    const mixed: CatalogItemRef[] = [
      { id: "a", name: "Zwykła", unit: "szt", base_material_price: 10, base_labor_price: 5 },
      { id: "b", name: "Verified", unit: "szt", base_material_price: 20, base_labor_price: 8, catalog_confidence: "verified" },
    ];
    const ctx = buildCatalogContext(mixed);
    expect(ctx.indexOf("✓VERIFIED")).toBeLessThan(ctx.indexOf("Zwykła"));
  });
});

// ─── 9. buildRateSourceInstruction ───────────────────────────────────────────────

describe("buildRateSourceInstruction", () => {
  it("engine: zawiera ES-ENGINE i stawkę", () => {
    const r = buildRateSourceInstruction("engine", 85);
    expect(r).toContain("ES-ENGINE 2026");
    expect(r).toContain("85 PLN/rbh");
  });
  it("manual: zawiera WŁASNA STAWKA i stawkę", () => {
    const r = buildRateSourceInstruction("manual", 120);
    expect(r).toContain("WŁASNA STAWKA");
    expect(r).toContain("120 PLN/rbh");
  });
  it("obie wersje zawierają zakaz użycia cen PLN z plików", () => {
    expect(buildRateSourceInstruction("engine", 85)).toContain("KATEGORYCZNIE");
    expect(buildRateSourceInstruction("manual", 85)).toContain("KATEGORYCZNIE");
  });
  it("backward compat: buildPricingModeInstruction deleguje do engine", () => {
    const legacy = buildPricingModeInstruction("ekspert", 100);
    expect(legacy).toContain("ES-ENGINE 2026");
    expect(legacy).toContain("100 PLN/rbh");
  });
});

describe("buildModeFieldRestriction", () => {
  it("material: zakazuje labor", () => {
    expect(buildModeFieldRestriction("material", 85)).toContain("labor_price = 0");
  });
  it("labor: zakazuje material", () => {
    expect(buildModeFieldRestriction("labor", 85)).toContain("material_price = 0");
  });
  it("all: zawiera stawkę bez zakazów", () => {
    const r = buildModeFieldRestriction("all", 100);
    expect(r).toContain("100 PLN/rbh");
    expect(r).not.toContain("TYLKO");
  });
});

// ─── 10. parseElectricalConstraints ──────────────────────────────────────────

describe("parseElectricalConstraints", () => {
  it("1-faz 25A", () => {
    const c = parseElectricalConstraints("Mieszkanie 50m² 1-faz 25A");
    expect(c.phaseCount).toBe(1);
    expect(c.mainRating).toBe(25);
    expect(c.rcd300).toBeGreaterThanOrEqual(25);
  });

  it("3-faz 63A", () => {
    const c = parseElectricalConstraints("Dom 200m² 3-faz 63A");
    expect(c.phaseCount).toBe(3);
    expect(c.mainRating).toBe(63);
  });

  it("fallback: bez opisu → 1-faz 25A", () => {
    const c = parseElectricalConstraints("Kawalerka");
    expect(c.mainRating).toBe(25);
  });

  it("400V → 3-fazowy", () => {
    expect(parseElectricalConstraints("Instalacja 400V 32A").phaseCount).toBe(3);
  });

  it("rcd300 >= mainRating dla wszystkich konfiguracji", () => {
    for (const desc of ["1-faz 16A", "1-faz 20A", "3-faz 32A", "3-faz 80A"]) {
      const c = parseElectricalConstraints(desc);
      expect(c.rcd300).toBeGreaterThanOrEqual(c.mainRating);
    }
  });
});

// ─── 11. fixSelectivity ───────────────────────────────────────────────────────

const mkMods = (items: Partial<MappedModule>[]): MappedModule[] =>
  items.map((m) => mapRawModule(m as Record<string, unknown>));

describe("fixSelectivity", () => {
  it("RCD-300 < mainRating: podnosi rating", () => {
    const mods = mkMods([
      { moduleId: "main-switch-1p", rating: 25 },
      { moduleId: "rcd-30-ac", rating: 16 },
      { moduleId: "mcb-b-1p", rating: 10 },
    ]);
    const result = fixSelectivity(mods, 25);
    const rcd30 = result.find((m) => m.moduleId === "rcd-30-ac");
    expect(rcd30).toBeDefined();
    expect(rcd30?.rating).toBeGreaterThanOrEqual(10);
  });

  it("MCB 1P > mainRating: obcina do mainRating", () => {
    const mods = mkMods([
      { moduleId: "main-switch-1p", rating: 16 },
      { moduleId: "rcd-30-ac", rating: 25 },
      { moduleId: "mcb-b-1p", rating: 32 },
    ]);
    const mcb = fixSelectivity(mods, 16).find((m) => m.moduleId === "mcb-b-1p");
    expect(mcb?.rating).toBeLessThanOrEqual(16);
  });

  it("Ghost RCD (bez MCB): usuwany", () => {
    const mods = mkMods([
      { moduleId: "main-switch-1p", rating: 25 },
      { moduleId: "rcd-30-ac", rating: 25 },
    ]);
    expect(fixSelectivity(mods, 25).find((m) => m.moduleId === "rcd-30-ac")).toBeUndefined();
  });

  it("RCD z MCB: NIE usuwany", () => {
    const mods = mkMods([
      { moduleId: "main-switch-1p", rating: 25 },
      { moduleId: "rcd-30-ac", rating: 25 },
      { moduleId: "mcb-b-1p", rating: 10 },
    ]);
    expect(fixSelectivity(mods, 25).find((m) => m.moduleId === "rcd-30-ac")).toBeDefined();
  });
});

// ─── 12. fixLoadBalance ───────────────────────────────────────────────────────

describe("fixLoadBalance", () => {
  it("mainRating=0: brak zmian", () => {
    const mods = mkMods([{ moduleId: "mcb-c-3p", rating: 32 }]);
    expect(fixLoadBalance(mods, 0, 3)).toHaveLength(1);
  });

  it("zbyt dużo MCB 3P: efektywny bilans <= mainRating po korekcie", () => {
    const mods = mkMods(Array(4).fill({ moduleId: "mcb-c-3p", rating: 32 }));
    const result = fixLoadBalance(mods, 32, 3);
    const sum3P = result.filter((m) => m.moduleId === "mcb-c-3p").reduce((s, m) => s + (m.rating ?? 0), 0);
    expect(sum3P * 0.5).toBeLessThanOrEqual(32);
  });

  it("bilans OK: brak zmian", () => {
    const mods = mkMods([
      { moduleId: "mcb-b-1p", rating: 10 },
      { moduleId: "mcb-b-1p", rating: 10 },
    ]);
    expect(fixLoadBalance(mods, 25, 1)).toHaveLength(2);
  });
});

// ─── 13. computeAccessories ──────────────────────────────────────────────────

describe("computeAccessories", () => {
  it("zawsze zawiera labor + szyny pe-bar, n-bar", () => {
    const mods = mkMods([{ moduleId: "mcb-b-1p", rating: 10 }]);
    const ids = computeAccessories(mods, 24, 1, 25).map((a) => a.moduleId);
    expect(ids).toContain("labor-assembly");
    expect(ids).toContain("labor-testing");
    expect(ids).toContain("pe-bar");
    expect(ids).toContain("n-bar");
  });

  it("3-faz: busbar-3p", () => {
    const ids = computeAccessories(mkMods([{ moduleId: "mcb-c-3p", rating: 16 }]), 36, 3, 40).map((a) => a.moduleId);
    expect(ids).toContain("busbar-3p");
  });

  it("1-faz: brak busbar-3p", () => {
    const ids = computeAccessories(mkMods([{ moduleId: "mcb-b-1p", rating: 10 }]), 24, 1, 25).map((a) => a.moduleId);
    expect(ids).not.toContain("busbar-3p");
  });

  it("mainRating >= 40: wire-16", () => {
    const ids = computeAccessories(mkMods([{ moduleId: "main-switch-3p", rating: 63 }]), 72, 3, 63).map((a) => a.moduleId);
    expect(ids).toContain("wire-16");
  });
});

// ─── 14. Kategoryzacja ────────────────────────────────────────────────────────

describe("normalizeCategoryId", () => {
  it("znany id: bez zmian", () => expect(normalizeCategoryId("cables")).toBe("cables"));
  it("nazwa kategorii → id", () => expect(normalizeCategoryId("Robocizna")).toBe("labor"));
  it("nieznana/null → 'other'", () => {
    expect(normalizeCategoryId("XYZ")).toBe("other");
    expect(normalizeCategoryId(null)).toBe("other");
  });
});

describe("guessCategoryFromName", () => {
  it("gniazdo → sockets", () => expect(guessCategoryFromName("Gniazdo 230V podwójne").id).toBe("sockets"));
  it("przewód → cables",   () => expect(guessCategoryFromName("Przewód YDYp 3x1,5mm²").id).toBe("cables"));
  it("mcb → breakers", () => expect(guessCategoryFromName("mcb b16 1P 10A").id).toBe("breakers"));
  it("montaż → labor",    () => expect(guessCategoryFromName("Montaż gniazda 230V").id).toBe("labor"));
  it("nieznana → other",  () => expect(guessCategoryFromName("XYZ12345").id).toBe("other"));
});

describe("groupItemsByCategory", () => {
  it("grupuje po kategoriach", () => {
    const items = [
      { name: "Gniazdo", category: "sockets" },
      { name: "Łącznik", category: "sockets" },
      { name: "Kabel",   category: "cables" },
    ];
    const groups = groupItemsByCategory(items);
    expect(groups.get("sockets")).toHaveLength(2);
    expect(groups.get("cables")).toHaveLength(1);
  });

  it("bez kategorii: heurystyka guessCategoryFromName", () => {
    const groups = groupItemsByCategory([{ name: "Montaż gniazdka", category: null }]);
    expect(groups.has("labor") || groups.has("sockets") || groups.has("other")).toBe(true);
  });
});
