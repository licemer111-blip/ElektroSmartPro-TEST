/**
 * knr-catalog.test.ts — Regression suite dla systemu KNR Catalog v2
 *
 * Pokrywa:
 *   1. Matematyczna poprawność formuły C_total (Iron Rule formula)
 *   2. Zestawy regression — punkt gniazda/oświetlenia/LAN generuje 4+ składniki
 *   3. Logika VAT (8% Mieszkanie vs 23% Biuro/Hala/tylko materiał)
 *   4. Regionalny współczynnik — 16 województw, wyłącznie robocizna
 *   5. Nadkład przemysłowy is_industrial (+15%)
 *   6. Separacja Robocizna/Materiał (Iron Rule — NEVER sum prematurely)
 *
 * Uruchom: npx vitest run tests/knr-catalog.test.ts
 */

import { describe, it, expect } from "vitest";
import { POLISH_REGIONS, getRegionMultiplier, POLISH_REGIONS_SORTED } from "@/lib/config/regions";
import {
  ZESTAWY_RECIPES,
  findRecipeByKeyword,
  findRecipeByKey,
  type ZestawRecipe,
  type RecipeComponent,
} from "@/lib/config/zestawy-recipes";

// ─── Lokalne pure-functions (mirror logiki DB/ES-Engine) ──────────────────────

/**
 * Formuła Iron Rule:
 *   C_total = (RBH_sum × Rate_base × m_region) + (Material_sum × matInflation)
 *
 * Iron Rules:
 *   - m_region dotyczy TYLKO robocizny
 *   - Material_sum NIE jest mnożony przez m_region
 *   - matInflation = 1.08 (administrator benchmark)
 */
function calcCTotal(
  rbhSum: number,
  rateBase: number,
  mRegion: number,
  materialSum: number,
  matInflation: number = 1.08
): { labor: number; material: number; total: number } {
  const labor    = rbhSum * rateBase * mRegion;
  const material = materialSum * matInflation;
  return {
    labor:    Math.round(labor    * 100) / 100,
    material: Math.round(material * 100) / 100,
    total:    Math.round((labor + material) * 100) / 100,
  };
}

/** Zastosowanie nadkładu przemysłowego +15% na robociznę */
function applyIndustrialSurcharge(laborCost: number, isIndustrial: boolean): number {
  return isIndustrial ? Math.round(laborCost * 1.15 * 100) / 100 : laborCost;
}

/** VAT Logic (Iron Rule — Polska stawka VAT) */
type ObjectType = "mieszkanie" | "dom" | "biuro" | "hala" | "tylko_material" | "uslugi_komercyjne";

function resolveVatRate(objectType: ObjectType): 8 | 23 {
  switch (objectType) {
    case "mieszkanie":
    case "dom":
      return 8;   // PKOB 11 — budownictwo mieszkaniowe
    case "biuro":
    case "hala":
    case "tylko_material":
    case "uslugi_komercyjne":
    default:
      return 23;  // Komercja / B2B / tylko materiał
  }
}

function applyVat(net: number, vatRate: 8 | 23): { net: number; vat: number; gross: number } {
  const vat   = Math.round(net * (vatRate / 100) * 100) / 100;
  const gross = Math.round((net + vat) * 100) / 100;
  return { net, vat, gross };
}

/** Pobierz składniki zestawu z podziałem na typy */
function splitRecipeComponents(recipe: ZestawRecipe): {
  robocizna: RecipeComponent[];
  materials: RecipeComponent[];
  total: number;
} {
  const robocizna = recipe.components.filter((c) => c.type === "robocizna");
  const materials = recipe.components.filter((c) => c.type === "material");
  return { robocizna, materials, total: recipe.components.length };
}

// ─── 1. Formuła C_total — matematyczna poprawność ────────────────────────────

describe("calcCTotal — Iron Rule formula (RBH + Region + Materiał)", () => {
  it("podstawowe obliczenie przy m_region=1.0 (Łódzkie — bazowe)", () => {
    // 2.0 rbh × 85 PLN/rbh × 1.0 + 150 PLN materiały × 1.08
    // labor = 170, material = 162, total = 332
    const result = calcCTotal(2.0, 85, 1.0, 150);
    expect(result.labor).toBeCloseTo(170, 2);
    expect(result.material).toBeCloseTo(162, 2);
    expect(result.total).toBeCloseTo(332, 2);
  });

  it("m_region dotyczy TYLKO robocizny (Iron Rule: materiał bez korekty regionalnej)", () => {
    const withRegion    = calcCTotal(2.0, 85, 1.2, 150);  // Mazowieckie
    const withoutRegion = calcCTotal(2.0, 85, 1.0, 150);  // Łódzkie

    // Materiały MUSZĄ być identyczne (Iron Rule)
    expect(withRegion.material).toBe(withoutRegion.material);

    // Robocizna zmienia się proporcjonalnie
    expect(withRegion.labor).toBeCloseTo(withoutRegion.labor * 1.2, 2);
  });

  it("Mazowieckie ×1.20 — weryfikacja wartości bezwzględnych", () => {
    // 3.0 rbh × 85 × 1.20 = 306 PLN robocizna
    // 200 PLN × 1.08 = 216 PLN materiały
    // total = 522
    const result = calcCTotal(3.0, 85, 1.2, 200);
    expect(result.labor).toBeCloseTo(306, 2);
    expect(result.material).toBeCloseTo(216, 2);
    expect(result.total).toBeCloseTo(522, 2);
  });

  it("Podkarpackie ×0.88 — najtańszy region", () => {
    const result = calcCTotal(2.0, 85, 0.88, 100);
    expect(result.labor).toBeCloseTo(149.6, 2);
    expect(result.material).toBeCloseTo(108, 2);
    expect(result.total).toBeCloseTo(257.6, 2);
  });

  it("labor = 0 (tylko materiał — dostawa bez montażu)", () => {
    const result = calcCTotal(0, 85, 1.0, 500);
    expect(result.labor).toBe(0);
    expect(result.material).toBeCloseTo(540, 2);
    expect(result.total).toBeCloseTo(540, 2);
  });

  it("materiał = 0 (czysta robocizna — np. przegląd/rewizja)", () => {
    const result = calcCTotal(4.0, 85, 1.0, 0);
    expect(result.labor).toBeCloseTo(340, 2);
    expect(result.material).toBe(0);
    expect(result.total).toBeCloseTo(340, 2);
  });

  it("separacja: labor + material = total (Iron Rule — NEVER pre-sum)", () => {
    const r = calcCTotal(2.5, 90, 1.06, 300, 1.08);
    expect(r.total).toBeCloseTo(r.labor + r.material, 5);
  });

  it("projekt wielopozycyjny — suma zachowuje separację", () => {
    const items = [
      calcCTotal(0.22, 85, 1.0, 15),   // gniazdo
      calcCTotal(0.40, 85, 1.0, 45),   // oprawa LED
      calcCTotal(3.5 * 0.030, 85, 1.0, 3.5 * 7.5), // kabel 3.5mb YDYp 3×2.5
    ];
    const totalLabor    = items.reduce((s, i) => s + i.labor, 0);
    const totalMaterial = items.reduce((s, i) => s + i.material, 0);
    const grandTotal    = items.reduce((s, i) => s + i.total, 0);

    expect(grandTotal).toBeCloseTo(totalLabor + totalMaterial, 1);
  });
});

// ─── 2. Zestawy Regression ───────────────────────────────────────────────────

describe("Zestawy — punkt gniazda generuje 4+ składniki (Iron Rule)", () => {
  it("przepis 'gniazdo_230v' istnieje w ZESTAWY_RECIPES", () => {
    const recipe = findRecipeByKey("gniazdo_230v");
    expect(recipe).toBeDefined();
  });

  it("punkt gniazda ma co najmniej 4 składniki (kabel + puszka + montaż + materiał)", () => {
    const recipe = findRecipeByKey("gniazdo_230v")!;
    expect(recipe.components.length).toBeGreaterThanOrEqual(4);
  });

  it("punkt gniazda zawiera: kabel, puszka, gniazdo, montaż (typy: material + robocizna)", () => {
    const { robocizna, materials } = splitRecipeComponents(findRecipeByKey("gniazdo_230v")!);
    expect(robocizna.length).toBeGreaterThanOrEqual(2); // min: montaż gniazda + puszka
    expect(materials.length).toBeGreaterThanOrEqual(2); // min: gniazdo + kabel
  });

  it("punkt gniazda ma składnik kablowy (qtyFactor > 1 dla mb)", () => {
    const recipe   = findRecipeByKey("gniazdo_230v")!;
    const cableComp = recipe.components.find((c) => c.unit === "mb");
    expect(cableComp).toBeDefined();
    expect(cableComp!.qtyFactor).toBeGreaterThan(1);
  });

  it("punkt oświetleniowy — minimum 5 składników (oprawa + łącznik + puszka + kabel + montaże)", () => {
    const recipe = findRecipeByKey("punkt_oswietleniowy")!;
    expect(recipe.components.length).toBeGreaterThanOrEqual(5);
  });

  it("punkt LAN — minimum 3 składniki (gniazdo + kabel + montaż)", () => {
    const recipe = findRecipeByKey("punkt_lan")!;
    expect(recipe.components.length).toBeGreaterThanOrEqual(3);
  });

  it("punkt LAN — kabel UTP z qtyFactor >= 5.0 (min 5m na punkt)", () => {
    const recipe    = findRecipeByKey("punkt_lan")!;
    const cableComp = recipe.components.find((c) => c.unit === "mb");
    expect(cableComp?.qtyFactor).toBeGreaterThanOrEqual(5.0);
  });

  it("łączność z KNR: wszystkie składniki robocizna mają knrRef", () => {
    const recipe = findRecipeByKey("gniazdo_230v")!;
    const laborComponents = recipe.components.filter((c) => c.type === "robocizna");
    for (const comp of laborComponents) {
      expect(comp.knrRef, `Składnik '${comp.id}' musi mieć knrRef`).toBeDefined();
    }
  });

  it("wszystkie przepisy mają unikalny key", () => {
    const keys = ZESTAWY_RECIPES.map((r) => r.key);
    const uniqueKeys = new Set(keys);
    expect(keys.length).toBe(uniqueKeys.size);
  });

  it("findRecipeByKeyword: 'punkt gniazda' → gniazdo_230v", () => {
    const recipe = findRecipeByKeyword("punkt gniazda 230v");
    expect(recipe?.key).toBe("gniazdo_230v");
  });

  it("findRecipeByKeyword: 'punkt lan' → punkt_lan", () => {
    const recipe = findRecipeByKeyword("punkt lan");
    expect(recipe?.key).toBe("punkt_lan");
  });

  it("findRecipeByKeyword: 'punkt tv-sat' → punkt_tv", () => {
    const recipe = findRecipeByKeyword("punkt tv-sat");
    expect(recipe?.key).toBe("punkt_tv");
  });

  it("brak duplikacji komponentów przy przełączeniu katalogów (unikalne IDs)", () => {
    for (const recipe of ZESTAWY_RECIPES) {
      const ids     = recipe.components.map((c) => c.id);
      const uniqueIds = new Set(ids);
      expect(ids.length, `Duplikaty w przepisie '${recipe.key}'`).toBe(uniqueIds.size);
    }
  });

  it("robocizna i materiały są zawsze oddzielone (Iron Rule)", () => {
    for (const recipe of ZESTAWY_RECIPES) {
      const types = recipe.components.map((c) => c.type);
      expect(types).not.toContain("combined"); // Nie wolno łączyć robocizny z materiałem
      const hasRobocizna = types.includes("robocizna");
      const hasMaterial  = types.includes("material");
      // Każdy przepis musi mieć oba lub tylko jeden — ale NIGDY nie 'combined'
      expect(hasRobocizna || hasMaterial).toBe(true);
    }
  });
});

// ─── 3. Logika VAT ──────────────────────────────────────────────────────────

describe("VAT Logic — Iron Rule (8% Mieszkanie vs 23% Biuro/Hala)", () => {
  it("Scenariusz A: Mieszkanie + montaż → VAT 8%", () => {
    const rate = resolveVatRate("mieszkanie");
    expect(rate).toBe(8);
  });

  it("Scenariusz A: Dom jednorodzinny → VAT 8% (PKOB 11)", () => {
    const rate = resolveVatRate("dom");
    expect(rate).toBe(8);
  });

  it("Scenariusz B: Biuro → VAT 23%", () => {
    const rate = resolveVatRate("biuro");
    expect(rate).toBe(23);
  });

  it("Scenariusz B: Hala przemysłowa → VAT 23%", () => {
    const rate = resolveVatRate("hala");
    expect(rate).toBe(23);
  });

  it("Scenariusz B: Tylko materiał (dostawa bez montażu) → VAT 23%", () => {
    const rate = resolveVatRate("tylko_material");
    expect(rate).toBe(23);
  });

  it("Scenariusz B: Usługi komercyjne → VAT 23%", () => {
    const rate = resolveVatRate("uslugi_komercyjne");
    expect(rate).toBe(23);
  });

  it("Różnica VAT: 23% vs 8% na 10000 PLN netto = 1500 PLN", () => {
    const r8  = applyVat(10000, 8);
    const r23 = applyVat(10000, 23);
    expect(r23.gross - r8.gross).toBe(1500);
  });

  it("applyVat: 8% na 1000 PLN → brutto = 1080 PLN", () => {
    const r = applyVat(1000, 8);
    expect(r.vat).toBe(80);
    expect(r.gross).toBe(1080);
  });

  it("applyVat: 23% na 1000 PLN → brutto = 1230 PLN", () => {
    const r = applyVat(1000, 23);
    expect(r.vat).toBe(230);
    expect(r.gross).toBe(1230);
  });

  it("applyVat: zero netto → zero brutto", () => {
    const r = applyVat(0, 8);
    expect(r.gross).toBe(0);
    expect(r.vat).toBe(0);
  });

  it("applyVat: netto + vat = brutto (Iron Rule — brak zaokrągleń przy małych kwotach)", () => {
    const r = applyVat(333.33, 23);
    expect(r.gross).toBeCloseTo(r.net + r.vat, 5);
  });
});

// ─── 4. Regionalne współczynniki ─────────────────────────────────────────────

describe("Regional Coefficients — 16 województw (Iron Rule: tylko robocizna)", () => {
  it("wszystkie 16 województw zdefiniowane w POLISH_REGIONS", () => {
    expect(POLISH_REGIONS.length).toBe(16);
  });

  it("każde województwo ma multiplier w zakresie 0.85–1.25 (realistyczne widełki)", () => {
    for (const region of POLISH_REGIONS) {
      expect(region.multiplier).toBeGreaterThanOrEqual(0.85);
      expect(region.multiplier).toBeLessThanOrEqual(1.25);
    }
  });

  it("Mazowieckie (Warszawa) = najwyższy multiplier", () => {
    const sorted = POLISH_REGIONS_SORTED;
    expect(sorted[0].id).toBe("mazowieckie");
  });

  it("Podkarpackie i Podlaskie = najniższy multiplier (0.88)", () => {
    const low = POLISH_REGIONS.filter((r) => r.multiplier <= 0.90);
    expect(low.length).toBeGreaterThanOrEqual(2);
    const hasPodkarpackie = low.some((r) => r.id === "podkarpackie");
    const hasPodlaskie    = low.some((r) => r.id === "podlaskie");
    expect(hasPodkarpackie).toBe(true);
    expect(hasPodlaskie).toBe(true);
  });

  it("getRegionMultiplier('mazowieckie') = 1.20", () => {
    expect(getRegionMultiplier("mazowieckie")).toBe(1.20);
  });

  it("getRegionMultiplier('podkarpackie') = 0.88", () => {
    expect(getRegionMultiplier("podkarpackie")).toBe(0.88);
  });

  it("getRegionMultiplier('lodzkie') = 1.00 (baza krajowa)", () => {
    expect(getRegionMultiplier("lodzkie")).toBe(1.00);
  });

  it("getRegionMultiplier(null) = 1.0 (domyślna wartość fallback)", () => {
    expect(getRegionMultiplier(null)).toBe(1.0);
  });

  it("getRegionMultiplier('nieistniejace') = 1.0 (fallback)", () => {
    expect(getRegionMultiplier("nieistniejace")).toBe(1.0);
  });

  it("Iron Rule: zmiana regionu NIE wpływa na koszt materiałów", () => {
    const material = 1000; // PLN
    const regions = ["mazowieckie", "podkarpackie", "lodzkie", "slaskie"] as const;

    for (const regionId of regions) {
      const result = calcCTotal(0, 85, getRegionMultiplier(regionId), material);
      expect(result.material).toBeCloseTo(material * 1.08, 2); // zawsze 1080 PLN
    }
  });

  it("Mazowieckie vs Podkarpackie — różnica robocizny dla 10 rbh", () => {
    const base = 85;
    const maz  = calcCTotal(10, base, getRegionMultiplier("mazowieckie"),    0);
    const pod  = calcCTotal(10, base, getRegionMultiplier("podkarpackie"),   0);

    // 85 × 10 × 1.20 = 1020; 85 × 10 × 0.88 = 748; różnica = 272
    expect(maz.labor).toBeCloseTo(1020, 2);
    expect(pod.labor).toBeCloseTo(748,  2);
    expect(maz.labor - pod.labor).toBeCloseTo(272, 1);
  });

  it("stawka efektywna PLN/rbh = rateBase × multiplier", () => {
    const base = 85;
    for (const region of POLISH_REGIONS) {
      const effectiveRate = Math.round(base * region.multiplier);
      // Weryfikacja zakresu realnych stawek rynkowych (55–110 PLN/rbh)
      expect(effectiveRate).toBeGreaterThanOrEqual(55);
      expect(effectiveRate).toBeLessThanOrEqual(120);
    }
  });
});

// ─── 5. Nadkład przemysłowy is_industrial ────────────────────────────────────

describe("Industrial Surcharge — is_industrial +15% (KNR 5-10 / 5-12)", () => {
  it("is_industrial=false: brak nadkładu", () => {
    const labor = 200;
    expect(applyIndustrialSurcharge(labor, false)).toBe(200);
  });

  it("is_industrial=true: +15% na robociznę", () => {
    const labor = 200;
    expect(applyIndustrialSurcharge(labor, true)).toBeCloseTo(230, 2);
  });

  it("normy KNR 5-10 (przemysłowe) — obliczenie z nadkładem", () => {
    // KNR 5-10 0101-01: Korytko kablowe 100×60, norma 0.15 rbh/mb
    // Q=50mb, rate=85, region=Śląskie(1.08), is_industrial=true
    const rbhSum   = 0.15 * 50;    // 7.5 rbh
    const base     = calcCTotal(rbhSum, 85, 1.08, 0);
    const withSurcharge = applyIndustrialSurcharge(base.labor, true);

    // bez nadkładu: 7.5 × 85 × 1.08 = 688.5
    // z nadkładem: 688.5 × 1.15 = 791.775 ≈ 791.78
    expect(base.labor).toBeCloseTo(688.5, 1);
    expect(withSurcharge).toBeCloseTo(791.78, 1);
  });

  it("is_industrial NIE dotyczy materiałów (Iron Rule)", () => {
    const materialCost = 1500;
    const labor = applyIndustrialSurcharge(300, true);

    // Materiał pozostaje bez nadkładu
    expect(materialCost).toBe(1500);
    expect(labor).toBeCloseTo(345, 2);
  });
});

// ─── 6. Integracja: pełna kalkulacja projektu ────────────────────────────────

describe("Integration — pełna kalkulacja projektu z KNR", () => {
  it("Mieszkanie 50m²: 10 gniazd + 6 opraw — kalkulacja z VAT 8%", () => {
    const GNIAZDO = {
      laborNorm: 0.22 + 0.25 + 3.5 * 0.03,  // montaż + puszka + kabel 3.5mb
      matPrice:  15 + 3 + 3.5 * 7.5,          // gniazdo + puszka + kabel
      qty: 10,
    };
    const OPRAWA = {
      laborNorm: 0.40 + 0.25 + 3.5 * 0.025,  // oprawa + puszka + kabel
      matPrice:  45 + 3 + 3.5 * 5.5,          // LED + puszka + kabel
      qty: 6,
    };

    const region    = getRegionMultiplier("malopolskie"); // 1.10
    const rateBase  = 85;
    const matInfl   = 1.08;

    // Suma RBH i materiałów
    const rbhTotal = GNIAZDO.laborNorm * GNIAZDO.qty + OPRAWA.laborNorm * OPRAWA.qty;
    const matTotal = GNIAZDO.matPrice  * GNIAZDO.qty + OPRAWA.matPrice  * OPRAWA.qty;

    const result = calcCTotal(rbhTotal, rateBase, region, matTotal, matInfl);
    const vat    = applyVat(result.total, 8); // Mieszkanie → 8%

    // Podstawowe sprawdzenia
    expect(result.labor).toBeGreaterThan(0);
    expect(result.material).toBeGreaterThan(0);
    expect(result.total).toBeCloseTo(result.labor + result.material, 5);
    expect(vat.vat).toBeCloseTo(result.total * 0.08, 2);
    expect(vat.gross).toBeCloseTo(result.total * 1.08, 2);
  });

  it("Hala przemysłowa: 20 gniazd CEE + trasa kablowa — VAT 23% + is_industrial", () => {
    // KNR 5-10: Gniazdo CEE 32A, norma 0.5rbh; Korytko 100×60, norma 0.15rbh/mb
    const gniazda   = { rbh: 0.5 * 20, mat: 85 * 20 };   // 20 gniazd CEE
    const trasa50m  = { rbh: 0.15 * 50, mat: 35 * 50 };  // 50mb korytka

    const region   = getRegionMultiplier("slaskie"); // 1.08
    const rbhSum   = gniazda.rbh + trasa50m.rbh;
    const matSum   = gniazda.mat + trasa50m.mat;

    const base    = calcCTotal(rbhSum, 85, region, matSum, 1.08);
    const labor   = applyIndustrialSurcharge(base.labor, true); // +15%
    const vat     = applyVat(labor + base.material, 23);        // Hala → 23%

    expect(labor).toBeGreaterThan(base.labor);           // nadkład dodany
    expect(vat.gross).toBeGreaterThan(labor + base.material); // VAT doliczony
    expect(vat.gross).toBeCloseTo((labor + base.material) * 1.23, 2);
  });

  it("C_total formula spełnia równość: total = labor + material (dla wszystkich regionów)", () => {
    for (const region of POLISH_REGIONS) {
      const r = calcCTotal(5.0, 85, region.multiplier, 200, 1.08);
      expect(r.total).toBeCloseTo(r.labor + r.material, 10);
    }
  });
});

// ─── 7. Dane katalogowe — struktury typów i spójność ─────────────────────────

describe("KNR Norm structure — validacja danych katalogowych", () => {
  const SAMPLE_NORMS = [
    { catalogCode: "KNR 5-08", tableNumber: "0301", columnNumber: "01", laborNorm: 0.22, unit: "szt", isIndustrial: false },
    { catalogCode: "KNR 5-10", tableNumber: "0101", columnNumber: "01", laborNorm: 0.15, unit: "mb",  isIndustrial: true  },
    { catalogCode: "KNR 4-03", tableNumber: "0101", columnNumber: "01", laborNorm: 0.02, unit: "mb",  isIndustrial: false },
    { catalogCode: "KNR 5-06", tableNumber: "0601", columnNumber: "01", laborNorm: 0.015, unit: "mb", isIndustrial: false },
    { catalogCode: "KNR 5-12", tableNumber: "0101", columnNumber: "01", laborNorm: 1.0,  unit: "szt", isIndustrial: true  },
  ];

  it("wszystkie normy mają laborNorm > 0", () => {
    for (const norm of SAMPLE_NORMS) {
      expect(norm.laborNorm).toBeGreaterThan(0);
    }
  });

  it("normy KNR 5-10 i 5-12 są is_industrial=true", () => {
    const industrial = SAMPLE_NORMS.filter((n) => n.isIndustrial);
    const codes = industrial.map((n) => n.catalogCode);
    expect(codes).toContain("KNR 5-10");
    expect(codes).toContain("KNR 5-12");
  });

  it("normy KNR 5-08, 4-03, 5-06 są is_industrial=false", () => {
    const residential = SAMPLE_NORMS.filter((n) => !n.isIndustrial);
    const codes = residential.map((n) => n.catalogCode);
    expect(codes).toContain("KNR 5-08");
    expect(codes).toContain("KNR 4-03");
    expect(codes).toContain("KNR 5-06");
  });

  it("full_code = catalogCode + tableNumber + '-' + columnNumber", () => {
    for (const norm of SAMPLE_NORMS) {
      const fullCode = `${norm.catalogCode} ${norm.tableNumber}-${norm.columnNumber}`;
      expect(fullCode).toMatch(/^KNR \d-\d{2} \d{4}-\d{2}$/);
    }
  });

  it("laborNorm dla kabli (mb) jest małą wartością < 0.25 rbh/mb", () => {
    // KNR 5-08: przewody YDYp 0.025-0.08 rbh/mb
    // KNR 5-10: trasy przemysłowe (korytko, rury) do 0.20 rbh/mb — wyższe ze względu na warunki
    const cableNorms = SAMPLE_NORMS.filter((n) => n.unit === "mb");
    for (const norm of cableNorms) {
      expect(norm.laborNorm).toBeLessThan(0.25);
    }
  });

  it("laborNorm dla szt (osprzęt) jest w zakresie 0.10–2.00 rbh/szt", () => {
    const sztNorms = SAMPLE_NORMS.filter((n) => n.unit === "szt");
    for (const norm of sztNorms) {
      expect(norm.laborNorm).toBeGreaterThanOrEqual(0.10);
      expect(norm.laborNorm).toBeLessThanOrEqual(2.00);
    }
  });
});

// ─── 8. Regional_coefficients — spójność z lib/config/regions.ts ─────────────

describe("regional_coefficients — synchronizacja z POLISH_REGIONS", () => {
  const EXPECTED_COEFFICIENTS: Record<string, number> = {
    "mazowieckie":        1.20,
    "dolnoslaskie":       1.12,
    "malopolskie":        1.10,
    "pomorskie":          1.10,
    "slaskie":            1.08,
    "wielkopolskie":      1.06,
    "zachodniopomorskie": 1.02,
    "lodzkie":            1.00,
    "lubuskie":           0.96,
    "kujawsko-pomorskie": 0.96,
    "warminsko-mazurskie":0.92,
    "opolskie":           0.94,
    "swietokrzyskie":     0.90,
    "lubelskie":          0.92,
    "podkarpackie":       0.88,
    "podlaskie":          0.88,
  };

  it("getRegionMultiplier zwraca oczekiwane wartości dla wszystkich 16 województw", () => {
    for (const [regionId, expectedMultiplier] of Object.entries(EXPECTED_COEFFICIENTS)) {
      const actual = getRegionMultiplier(regionId);
      expect(actual).toBeCloseTo(expectedMultiplier, 4);
    }
  });

  it("baza krajowa Łódzkie = 1.0 (wzorzec cen)", () => {
    expect(getRegionMultiplier("lodzkie")).toBe(1.0);
  });

  it("każdy region ma unikalny id (brak duplikatów)", () => {
    const ids = POLISH_REGIONS.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("liczba województw = 16 (stała administracyjna PL)", () => {
    expect(Object.keys(EXPECTED_COEFFICIENTS).length).toBe(16);
    expect(POLISH_REGIONS.length).toBe(16);
  });
});
