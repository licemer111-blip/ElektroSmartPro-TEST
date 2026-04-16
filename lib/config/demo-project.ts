/**
 * ═══════════════════════════════════════════════════════════════════════════
 * demo-project.ts — Seed data for the onboarding showcase project
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * When a user finishes the onboarding wizard (first-time setup), we auto-create
 * a realistic sample project "Mieszkanie 60 m² — Kompletna instalacja elektryczna"
 * so they can immediately see:
 *   - The full cost breakdown (Robocizna + Materiał + VAT)
 *   - How sections/categories look in the UI
 *   - What a finished kosztorys looks like exported to PDF (no DEMO watermark,
 *     because is_demo_project=true bypasses the paywall — they see the premium
 *     output on day one)
 *
 * This is THE primary aha-moment of the product.
 *
 * Data model:
 *   - Prices stored as BASE netto (no region modifier, no markup applied)
 *   - regionModifier is applied later at display-time by calcRowPrices
 *   - labor_norm is per-unit r-g (rbh) — KNR 5-04 / 5-08 references
 *   - confidence_level "verified" means this row is sourced from a real KNR
 *
 * IMPORTANT: Keep this dataset realistic. It's the user's first impression
 * of calculation quality.
 * ═══════════════════════════════════════════════════════════════════════════
 */

export interface DemoProjectItem {
  section: string;
  name: string;
  unit: string;
  quantity: number;
  /** Material BASE netto price per unit (PLN) — no region modifier */
  material_price: number;
  /** Labor BASE netto price per unit (PLN) — no region modifier */
  labor_price: number;
  /** KNR reference (real or analog) */
  knr_code: string | null;
  /** Hours per unit (rbh/szt lub rbh/mb) — used for "Pokaż r-g" display */
  labor_norm: number | null;
  /** Item description for better readability in UI */
  description?: string;
}

export interface DemoProjectSeed {
  name: string;
  client_name: string;
  client_address: string;
  client_nip: string | null;
  vat_rate: number;
  pdf_notes: string;
  items: DemoProjectItem[];
}

/**
 * "Mieszkanie 60 m² — Kompletna instalacja elektryczna"
 * Realistic 2-bedroom apartment wiring job. ~18 positions,
 * grouped into 5 technical sections.
 *
 * Target total: ~14,800 PLN netto (8% VAT → ~15,980 PLN brutto).
 * Matches market rates for mid-standard Mazowieckie apartment installation.
 */
export const DEMO_PROJECT: DemoProjectSeed = {
  name: "Mieszkanie 60 m² — Kompletna instalacja elektryczna [DEMO]",
  client_name: "Jan Kowalski",
  client_address: "ul. Demo 1/15, 00-001 Warszawa",
  client_nip: null,
  vat_rate: 8, // residential
  pdf_notes:
    "To jest przykładowy projekt demonstracyjny wygenerowany automatycznie po utworzeniu konta. " +
    "Możesz go edytować, kopiować lub usunąć. Pokazuje on jak wygląda pełny kosztorys ElektroSmart PRO " +
    "z podziałem Robocizna / Materiał, zestawami 360°, normami KNR 2026 i automatycznym przeliczaniem VAT.",
  items: [
    // ══ I. PRACE PRZYGOTOWAWCZE ═══════════════════════════════════════════
    {
      section: "I. Prace przygotowawcze",
      name: "Bruzdowanie w ścianach z cegły pod przewody",
      unit: "mb",
      quantity: 85,
      material_price: 0.80,
      labor_price: 8.50,  // ~0.10 rbh × 85 PLN/rbh
      knr_code: "KNR 5-08 0301-01",
      labor_norm: 0.10,
      description: "Bruzda pod przewody YDYp 3×2.5 / 3×1.5, głębokość ~20mm",
    },
    {
      section: "I. Prace przygotowawcze",
      name: "Kucie otworów pod puszki w cegle",
      unit: "szt",
      quantity: 38,
      material_price: 1.20,
      labor_price: 6.80,  // ~0.08 rbh × 85 PLN/rbh
      knr_code: "KNR 5-08 0401-01",
      labor_norm: 0.08,
      description: "Otwór Φ60mm pod puszkę natynkową / podtynkową",
    },

    // ══ II. TRASY KABLOWE ═══════════════════════════════════════════════
    {
      section: "II. Okablowanie",
      name: "Przewód YDYp 3×2.5 mm² 450/750V (gniazda obwody dedykowane)",
      unit: "mb",
      quantity: 60,
      material_price: 4.20,
      labor_price: 4.25,  // ~0.05 rbh × 85 PLN/rbh
      knr_code: "KNR 5-08 0201-02",
      labor_norm: 0.05,
      description: "Obwody gniazd 16A — salon, kuchnia, lazienka",
    },
    {
      section: "II. Okablowanie",
      name: "Przewód YDYp 3×1.5 mm² 450/750V (oświetlenie)",
      unit: "mb",
      quantity: 95,
      material_price: 2.80,
      labor_price: 4.25,
      knr_code: "KNR 5-08 0201-01",
      labor_norm: 0.05,
      description: "Obwody oświetleniowe 10A — wszystkie pomieszczenia",
    },
    {
      section: "II. Okablowanie",
      name: "Przewód YDYp 5×2.5 mm² 450/750V (kuchenka elektryczna)",
      unit: "mb",
      quantity: 12,
      material_price: 7.80,
      labor_price: 5.95,  // ~0.07 rbh × 85 PLN/rbh
      knr_code: "KNR 5-08 0201-03",
      labor_norm: 0.07,
      description: "Zasilanie kuchenki indukcyjnej 7.2 kW (3f)",
    },
    {
      section: "II. Okablowanie",
      name: "Kabel UTP kat.6 4×2×0.5 mm",
      unit: "mb",
      quantity: 35,
      material_price: 2.40,
      labor_price: 4.25,
      knr_code: "KNR AL-01 0302-01",
      labor_norm: 0.05,
      description: "Internet/LAN do salonu i sypialni",
    },

    // ══ III. OSPRZĘT ════════════════════════════════════════════════════
    {
      section: "III. Osprzęt elektryczny",
      name: "Puszka natynkowa Φ60 głęboka",
      unit: "szt",
      quantity: 38,
      material_price: 1.80,
      labor_price: 5.95,
      knr_code: "KNR 5-08 0501-01",
      labor_norm: 0.07,
    },
    {
      section: "III. Osprzęt elektryczny",
      name: "Gniazdo wtyczkowe 2P+Z 16A podtynkowe (pojedyncze)",
      unit: "szt",
      quantity: 22,
      material_price: 18.50,
      labor_price: 21.25,  // 0.25 rbh × 85
      knr_code: "KNR 5-08 0601-01",
      labor_norm: 0.25,
      description: "Ramka + mechanizm — standard markowy (Schneider/Legrand)",
    },
    {
      section: "III. Osprzęt elektryczny",
      name: "Gniazdo wtyczkowe podwójne 2×(2P+Z) 16A",
      unit: "szt",
      quantity: 8,
      material_price: 32.00,
      labor_price: 25.50,  // 0.30 rbh × 85
      knr_code: "KNR 5-08 0601-02",
      labor_norm: 0.30,
      description: "Salon/kuchnia — większe obciążenie",
    },
    {
      section: "III. Osprzęt elektryczny",
      name: "Łącznik jednobiegunowy z podświetleniem",
      unit: "szt",
      quantity: 14,
      material_price: 22.00,
      labor_price: 17.00,  // 0.20 rbh × 85
      knr_code: "KNR 5-08 0701-01",
      labor_norm: 0.20,
    },
    {
      section: "III. Osprzęt elektryczny",
      name: "Łącznik schodowy (krzyżowy)",
      unit: "szt",
      quantity: 4,
      material_price: 28.00,
      labor_price: 21.25,
      knr_code: "KNR 5-08 0701-02",
      labor_norm: 0.25,
      description: "Sterowanie oświetleniem korytarz/sypialnia",
    },
    {
      section: "III. Osprzęt elektryczny",
      name: "Oprawa sufitowa LED panel 36W 4000K",
      unit: "szt",
      quantity: 8,
      material_price: 95.00,
      labor_price: 34.00,  // 0.40 rbh × 85
      knr_code: "KNR 5-08 0801-01",
      labor_norm: 0.40,
      description: "Oświetlenie główne pokoi — 600×600 mm",
    },
    {
      section: "III. Osprzęt elektryczny",
      name: "Oprawa łazienkowa LED IP44 18W",
      unit: "szt",
      quantity: 3,
      material_price: 120.00,
      labor_price: 42.50,  // 0.50 rbh × 85
      knr_code: "KNR 5-08 0801-02",
      labor_norm: 0.50,
      description: "Lazienka + kuchnia nad blatem — strefa wilgoci",
    },

    // ══ IV. ROZDZIELNICA ═══════════════════════════════════════════════
    {
      section: "IV. Rozdzielnica",
      name: "Rozdzielnica mieszkaniowa podtynkowa 3×12 modułów",
      unit: "szt",
      quantity: 1,
      material_price: 280.00,
      labor_price: 255.00,  // 3.0 rbh × 85
      knr_code: "KNR 5-08 0901-01",
      labor_norm: 3.00,
      description: "Obudowa IP40 + listwa N/PE",
    },
    {
      section: "IV. Rozdzielnica",
      name: "Wyłącznik różnicowoprądowy RCBO 16A 30mA (B)",
      unit: "szt",
      quantity: 8,
      material_price: 145.00,
      labor_price: 17.00,
      knr_code: "KNR 5-08 0902-03",
      labor_norm: 0.20,
      description: "Ochrona każdego obwodu — 8 RCBO 1P+N",
    },
    {
      section: "IV. Rozdzielnica",
      name: "Wyłącznik nadprądowy S303B 25A (główny)",
      unit: "szt",
      quantity: 1,
      material_price: 95.00,
      labor_price: 21.25,
      knr_code: "KNR 5-08 0902-01",
      labor_norm: 0.25,
    },
    {
      section: "IV. Rozdzielnica",
      name: "Podłączenie rozdzielnicy do licznika (WLZ)",
      unit: "szt",
      quantity: 1,
      material_price: 45.00,
      labor_price: 127.50,  // 1.5 rbh × 85
      knr_code: "KNR 5-08 0903-01",
      labor_norm: 1.50,
      description: "Zasilanie główne 5×6mm² Cu + próba napięciowa",
    },

    // ══ V. POMIARY I ODBIORY ══════════════════════════════════════════
    {
      section: "V. Pomiary i odbiory",
      name: "Pomiar rezystancji izolacji całej instalacji",
      unit: "kpl",
      quantity: 1,
      material_price: 0,
      labor_price: 170.00,  // 2.0 rbh × 85
      knr_code: "KNR 5-08 1001-01",
      labor_norm: 2.00,
    },
    {
      section: "V. Pomiary i odbiory",
      name: "Pomiar skuteczności ochrony przeciwporażeniowej (pętla zwarcia)",
      unit: "kpl",
      quantity: 1,
      material_price: 0,
      labor_price: 127.50,  // 1.5 rbh × 85
      knr_code: "KNR 5-08 1001-02",
      labor_norm: 1.50,
    },
    {
      section: "V. Pomiary i odbiory",
      name: "Protokół odbiorowy + opis techniczny",
      unit: "kpl",
      quantity: 1,
      material_price: 0,
      labor_price: 85.00,  // 1.0 rbh × 85
      knr_code: "KNR 5-08 1002-01",
      labor_norm: 1.00,
    },
  ],
};

/**
 * Compute the expected net total — used in tests & for sanity-check on seed.
 */
export function computeDemoTotal(): { material: number; labor: number; net: number } {
  let material = 0;
  let labor = 0;
  for (const item of DEMO_PROJECT.items) {
    material += item.material_price * item.quantity;
    labor += item.labor_price * item.quantity;
  }
  return {
    material: Math.round(material * 100) / 100,
    labor: Math.round(labor * 100) / 100,
    net: Math.round((material + labor) * 100) / 100,
  };
}
