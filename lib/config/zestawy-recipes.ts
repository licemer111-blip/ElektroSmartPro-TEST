// ═══════════════════════════════════════════════════════════════════
// lib/config/zestawy-recipes.ts
// ES-Engine Zestaw Recipes — 9 composite assembly definitions.
// Each recipe maps to an es_dictionary composite entry (is_composite=true)
// and defines all child components with quantity coefficients per parent unit.
// ═══════════════════════════════════════════════════════════════════

import type { MontageMode } from "@/app/dashboard/settings/knr-calculator/_parts/KnrEngineCalibration";

export type RecipeComponentType = "robocizna" | "material";

export interface RecipeComponent {
  id: string;                       // stable unique key within recipe
  type: RecipeComponentType;
  label: string;
  unit: string;
  qtyFactor: number;                // quantity per parent unit (e.g. 3.5 mb per szt)
  knrRef?: string;                  // KNR code (only for robocizna)
  laborNormRbh?: number;            // labor norm rbh/unit (only for robocizna)
  onlyForMontage?: MontageMode[];   // if set, component only included when calibration.defaultMontage is in this list
}

export interface ZestawRecipe {
  key: string;                      // stable key, used in notes metadata
  keywords: string[];               // normalized keywords matching es_dictionary entries
  label: string;                    // human-readable assembly name
  components: RecipeComponent[];
}

// ─── 9 Base Recipes ───────────────────────────────────────────────────────────

export const ZESTAWY_RECIPES: ZestawRecipe[] = [

  // ── 1. Punkt Gniazda 230V ───────────────────────────────────────────────────
  {
    key: "gniazdo_230v",
    keywords: ["zestaw gniazd", "punkt gniazda", "gniazdo 230v"],
    label: "Punkt gniazda 230V",
    components: [
      { id: "gnz_rob_gnz",  type: "robocizna", label: "Montaż gniazda 230V",   unit: "szt", qtyFactor: 1,   knrRef: "KNR 5-04 0301-01", laborNormRbh: 0.22 },
      { id: "gnz_rob_pus",  type: "robocizna", label: "Montaż puszki",          unit: "szt", qtyFactor: 1,   knrRef: "KNR 5-04 0602-01", laborNormRbh: 0.25 },
      { id: "gnz_rob_kab",  type: "robocizna", label: "Okablowanie YDYp 3×2.5", unit: "mb",  qtyFactor: 3.5, knrRef: "KNR 5-04 0101-02", laborNormRbh: 0.03 },
      { id: "gnz_rob_brz",  type: "robocizna", label: "Bruzdowanie",             unit: "mb",  qtyFactor: 3.5, knrRef: "KNR 5-04 0701-01", laborNormRbh: 0.06, onlyForMontage: ["w_tynku", "pod_tynkiem"] },
      { id: "gnz_mat_gnz",  type: "material",  label: "Gniazdo podtynkowe 230V", unit: "szt", qtyFactor: 1   },
      { id: "gnz_mat_pus",  type: "material",  label: "Puszka podtynkowa Ø60",   unit: "szt", qtyFactor: 1   },
      { id: "gnz_mat_kab",  type: "material",  label: "Przewód YDYp 3×2.5",      unit: "mb",  qtyFactor: 3.5 },
    ],
  },

  // ── 2. Punkt Oświetleniowy ───────────────────────────────────────────────────
  {
    key: "punkt_oswietleniowy",
    keywords: ["punkt oswietleniowy", "punkt oświetleniowy"],
    label: "Punkt oświetleniowy",
    components: [
      { id: "ow_rob_opr",  type: "robocizna", label: "Montaż oprawy LED",      unit: "szt", qtyFactor: 1,   knrRef: "KNR 5-04 0401-01", laborNormRbh: 0.40 },
      { id: "ow_rob_lac",  type: "robocizna", label: "Montaż łącznika",        unit: "szt", qtyFactor: 1,   knrRef: "KNR 5-04 0201-01", laborNormRbh: 0.22 },
      { id: "ow_rob_pus",  type: "robocizna", label: "Montaż puszki",          unit: "szt", qtyFactor: 1,   knrRef: "KNR 5-04 0602-01", laborNormRbh: 0.25 },
      { id: "ow_rob_kab",  type: "robocizna", label: "Okablowanie YDYp 3×1.5", unit: "mb",  qtyFactor: 3.5, knrRef: "KNR 5-04 0101-01", laborNormRbh: 0.025 },
      { id: "ow_rob_brz",  type: "robocizna", label: "Bruzdowanie",             unit: "mb",  qtyFactor: 3.5, knrRef: "KNR 5-04 0701-01", laborNormRbh: 0.06, onlyForMontage: ["w_tynku", "pod_tynkiem"] },
      { id: "ow_mat_opr",  type: "material",  label: "Oprawa LED",              unit: "szt", qtyFactor: 1   },
      { id: "ow_mat_lac",  type: "material",  label: "Łącznik podtynkowy",      unit: "szt", qtyFactor: 1   },
      { id: "ow_mat_pus",  type: "material",  label: "Puszka podtynkowa Ø60",   unit: "szt", qtyFactor: 1   },
      { id: "ow_mat_kab",  type: "material",  label: "Przewód YDYp 3×1.5",      unit: "mb",  qtyFactor: 3.5 },
    ],
  },

  // ── 3. Wypust Oświetleniowy (bez łącznika) ────────────────────────────────────
  {
    key: "wypust_oswietleniowy",
    keywords: ["wypust oswietleniowy", "wypust oświetleniowy"],
    label: "Wypust oświetleniowy",
    components: [
      { id: "wp_rob_opr",  type: "robocizna", label: "Montaż oprawy LED",      unit: "szt", qtyFactor: 1,   knrRef: "KNR 5-04 0401-01", laborNormRbh: 0.40 },
      { id: "wp_rob_pus",  type: "robocizna", label: "Montaż puszki",          unit: "szt", qtyFactor: 1,   knrRef: "KNR 5-04 0602-01", laborNormRbh: 0.25 },
      { id: "wp_rob_kab",  type: "robocizna", label: "Okablowanie YDYp 3×1.5", unit: "mb",  qtyFactor: 3.5, knrRef: "KNR 5-04 0101-01", laborNormRbh: 0.025 },
      { id: "wp_rob_brz",  type: "robocizna", label: "Bruzdowanie",             unit: "mb",  qtyFactor: 3.5, knrRef: "KNR 5-04 0701-01", laborNormRbh: 0.06, onlyForMontage: ["w_tynku", "pod_tynkiem"] },
      { id: "wp_mat_opr",  type: "material",  label: "Oprawa LED",              unit: "szt", qtyFactor: 1   },
      { id: "wp_mat_pus",  type: "material",  label: "Puszka podtynkowa Ø60",   unit: "szt", qtyFactor: 1   },
      { id: "wp_mat_kab",  type: "material",  label: "Przewód YDYp 3×1.5",      unit: "mb",  qtyFactor: 3.5 },
    ],
  },

  // ── 4. Zasilanie Rolety ─────────────────────────────────────────────────────
  {
    key: "zasilanie_rolety",
    keywords: ["zasilanie rolety"],
    label: "Zasilanie rolety elektrycznej",
    components: [
      { id: "rol_rob_gnz",  type: "robocizna", label: "Gniazdo 230V do rolety", unit: "szt", qtyFactor: 1,   knrRef: "KNR 5-04 0301-01", laborNormRbh: 0.22 },
      { id: "rol_rob_pus",  type: "robocizna", label: "Montaż puszki",          unit: "szt", qtyFactor: 1,   knrRef: "KNR 5-04 0602-01", laborNormRbh: 0.25 },
      { id: "rol_rob_kab",  type: "robocizna", label: "Okablowanie YDYp 3×1.5", unit: "mb",  qtyFactor: 3.5, knrRef: "KNR 5-04 0101-01", laborNormRbh: 0.025 },
      { id: "rol_rob_brz",  type: "robocizna", label: "Bruzdowanie",             unit: "mb",  qtyFactor: 3.5, knrRef: "KNR 5-04 0701-01", laborNormRbh: 0.06, onlyForMontage: ["w_tynku", "pod_tynkiem"] },
      { id: "rol_mat_gnz",  type: "material",  label: "Gniazdo podtynkowe 230V", unit: "szt", qtyFactor: 1   },
      { id: "rol_mat_pus",  type: "material",  label: "Puszka podtynkowa Ø60",   unit: "szt", qtyFactor: 1   },
      { id: "rol_mat_kab",  type: "material",  label: "Przewód YDYp 3×1.5",      unit: "mb",  qtyFactor: 3.5 },
    ],
  },

  // ── 5. Punkt AGD 16A ─────────────────────────────────────────────────────────
  {
    key: "punkt_agd",
    keywords: ["punkt agd"],
    label: "Punkt AGD 230V 16A",
    components: [
      { id: "agd_rob_gnz",  type: "robocizna", label: "Gniazdo AGD 16A",        unit: "szt", qtyFactor: 1,   knrRef: "KNR 5-04 0301-01", laborNormRbh: 0.22 },
      { id: "agd_rob_pus",  type: "robocizna", label: "Montaż puszki",          unit: "szt", qtyFactor: 1,   knrRef: "KNR 5-04 0602-01", laborNormRbh: 0.25 },
      { id: "agd_rob_kab",  type: "robocizna", label: "Okablowanie YDYp 3×2.5", unit: "mb",  qtyFactor: 3.5, knrRef: "KNR 5-04 0101-02", laborNormRbh: 0.03 },
      { id: "agd_rob_brz",  type: "robocizna", label: "Bruzdowanie",             unit: "mb",  qtyFactor: 3.5, knrRef: "KNR 5-04 0701-01", laborNormRbh: 0.06, onlyForMontage: ["w_tynku", "pod_tynkiem"] },
      { id: "agd_mat_gnz",  type: "material",  label: "Gniazdo AGD 16A",         unit: "szt", qtyFactor: 1   },
      { id: "agd_mat_pus",  type: "material",  label: "Puszka podtynkowa Ø60",   unit: "szt", qtyFactor: 1   },
      { id: "agd_mat_kab",  type: "material",  label: "Przewód YDYp 3×2.5",      unit: "mb",  qtyFactor: 3.5 },
    ],
  },

  // ── 6. Zasilanie Płyty Indukcyjnej ───────────────────────────────────────────
  {
    key: "indukcja",
    keywords: ["zasilanie plyty indukcyjnej", "zasilanie płyty indukcyjnej", "indukcja"],
    label: "Zasilanie płyty indukcyjnej 400V",
    components: [
      { id: "ind_rob_gnz",  type: "robocizna", label: "Gniazdo siłowe 400V",    unit: "szt", qtyFactor: 1,   knrRef: "KNR 5-04 0301-03", laborNormRbh: 0.40 },
      { id: "ind_rob_pus",  type: "robocizna", label: "Montaż puszki",          unit: "szt", qtyFactor: 1,   knrRef: "KNR 5-04 0602-01", laborNormRbh: 0.25 },
      { id: "ind_rob_kab",  type: "robocizna", label: "Okablowanie YDYp 5×2.5", unit: "mb",  qtyFactor: 4.5, knrRef: "KNR 5-04 0101-03", laborNormRbh: 0.035 },
      { id: "ind_rob_brz",  type: "robocizna", label: "Bruzdowanie",             unit: "mb",  qtyFactor: 4.5, knrRef: "KNR 5-04 0701-01", laborNormRbh: 0.06, onlyForMontage: ["w_tynku", "pod_tynkiem"] },
      { id: "ind_mat_gnz",  type: "material",  label: "Gniazdo siłowe 400V/32A", unit: "szt", qtyFactor: 1   },
      { id: "ind_mat_pus",  type: "material",  label: "Puszka podtynkowa Ø60",   unit: "szt", qtyFactor: 1   },
      { id: "ind_mat_kab",  type: "material",  label: "Przewód YDYp 5×2.5",      unit: "mb",  qtyFactor: 4.5 },
    ],
  },

  // ── 7. Punkt TV-SAT ─────────────────────────────────────────────────────────
  {
    key: "punkt_tv",
    keywords: ["punkt tv", "punkt tv-sat"],
    label: "Punkt TV-SAT",
    components: [
      { id: "tv_rob_gnz",  type: "robocizna", label: "Gniazdo antenowe TV-SAT", unit: "szt", qtyFactor: 1,   knrRef: "KNR 5-06 0201-01", laborNormRbh: 0.20 },
      { id: "tv_rob_pus",  type: "robocizna", label: "Montaż puszki",           unit: "szt", qtyFactor: 1,   knrRef: "KNR 5-04 0602-01", laborNormRbh: 0.25 },
      { id: "tv_rob_kab",  type: "robocizna", label: "Kabel RG-6 /100mb",       unit: "mb",  qtyFactor: 5.0, knrRef: "KNR 5-06 0601-01", laborNormRbh: 0.015 },
      { id: "tv_mat_gnz",  type: "material",  label: "Gniazdo antenowe TV-SAT", unit: "szt", qtyFactor: 1   },
      { id: "tv_mat_pus",  type: "material",  label: "Puszka podtynkowa Ø60",   unit: "szt", qtyFactor: 1   },
      { id: "tv_mat_kab",  type: "material",  label: "Kabel RG-6 75Ω",          unit: "mb",  qtyFactor: 5.0 },
    ],
  },

  // ── 8. Punkt LAN ─────────────────────────────────────────────────────────────
  {
    key: "punkt_lan",
    keywords: ["punkt lan", "punkt sieci"],
    label: "Punkt LAN (RJ45 kat.6)",
    components: [
      { id: "lan_rob_gnz",  type: "robocizna", label: "Gniazdo RJ45 kat.6",    unit: "szt", qtyFactor: 1,   knrRef: "KNR 5-06 0201-01", laborNormRbh: 0.20 },
      { id: "lan_rob_pus",  type: "robocizna", label: "Montaż puszki",          unit: "szt", qtyFactor: 1,   knrRef: "KNR 5-04 0602-01", laborNormRbh: 0.25 },
      { id: "lan_rob_kab",  type: "robocizna", label: "Kabel UTP kat.6 /100mb", unit: "mb",  qtyFactor: 5.0, knrRef: "KNR 5-06 0101-01", laborNormRbh: 0.020 },
      { id: "lan_mat_gnz",  type: "material",  label: "Gniazdo RJ45 kat.6",     unit: "szt", qtyFactor: 1   },
      { id: "lan_mat_pus",  type: "material",  label: "Puszka podtynkowa Ø60",  unit: "szt", qtyFactor: 1   },
      { id: "lan_mat_kab",  type: "material",  label: "Kabel UTP kat.6",         unit: "mb",  qtyFactor: 5.0 },
    ],
  },
];

// ─── Lookup helpers ───────────────────────────────────────────────────────────

export function findRecipeByKeyword(input: string): ZestawRecipe | undefined {
  const normalized = input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return ZESTAWY_RECIPES.find((r) =>
    r.keywords.some((kw) => normalized.includes(kw) || kw.includes(normalized))
  );
}

export function findRecipeByKey(key: string): ZestawRecipe | undefined {
  return ZESTAWY_RECIPES.find((r) => r.key === key);
}
