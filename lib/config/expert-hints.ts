/**
 * lib/config/expert-hints.ts
 * ─────────────────────────────────────────────────────────────────
 * Expert Hints v1.8 — Mandatory Material Inclusions (Positive Logic) + Smart Pack Multiplicity.
 *
 * "If it mentions X, it always needs Y" — deterministic expert rules.
 * No AI inference needed: keyword → required materials.
 *
 * Three layers:
 *   1. EXPERT_HINT_RULES  — keyword-triggered material additions
 *   2. getSurfaceMaterials — substrate-specific mounting hardware
 *   3. getExpertHints      — public API merging both layers
 *
 * Pure data/functions — no server deps, safe for vitest.
 *
 * Exports:
 *   EXPERT_HINT_RULES       — rule array (for tests/inspection)
 *   SURFACE_MATERIALS       — surface-to-item map (for tests)
 *   getSurfaceMaterials(name) → MaterialBillItem[]
 *   getExpertHints(name)      → MaterialBillItem[]  (merged, deduped)
 */

import type { MaterialBillItem } from "@/lib/config/material-bill-bridge";

// ─────────────────────────────────────────────────────────────────
// Surface Sensitivity Materials
// ─────────────────────────────────────────────────────────────────

export const SURFACE_MATERIALS: Record<"BETON" | "GK" | "DREWNO" | "METAL", MaterialBillItem> = {
  BETON: {
    id:          "sh_kolek_beton",
    category:    "HARDWARE",
    label:       "Kołek rozporowy fi8×40 op.100szt (beton/cegła)",
    unit:        "op",
    qtyFactor:   0.02,
    slug:        "kolek-fi8",
    refPricePLN: 24.00,
    note:        "2 kołki na punkt. Typ S8 — do betonu i cegły pełnej.",
  },
  GK: {
    id:           "sh_kolek_gk",
    category:     "HARDWARE",
    label:        "Kołek do płyt GK Molly M5 op.20szt",
    unit:         "op",
    qtyFactor:    0.10,
    slug:         "kolek-gk-molly",
    refPricePLN:  18.00,
    unitsPerPack: 20,
    note:         "Smart Pack: ceil(N_punkt/20) paczek Molly. 2 kołki na punkt w GK.",
  },
  DREWNO: {
    id:           "sh_wkret_drewno",
    category:     "HARDWARE",
    label:        "Wkręty do drewna 4×40 op.100szt",
    unit:         "op",
    qtyFactor:    0.04,
    slug:         "wkret-drewno-4x40",
    refPricePLN:  12.00,
    unitsPerPack: 100,
    note:         "Smart Pack: ceil(N_punkt/100) paczek wkrętów. 4 wkręty na punkt.",
  },
  METAL: {
    id:          "sh_kolek_metal",
    category:    "HARDWARE",
    label:       "Kołek gwintowany M6×30 op.20szt (do stali/metalu)",
    unit:        "op",
    qtyFactor:   0.10,
    slug:        "kolek-gwintowany-m6",
    refPricePLN: 18.00,
    note:        "2 kołki M6 na punkt w stalowej konstrukcji (wieszak, drabinka).",
  },
};

const BETON_RE  = /beton|żelbe|zelbe|monolit|cegł/i;
const GK_RE     = /\bgk\b|karton.gips|gipsokart|sucha\s+zab|płyta\s+gk/i;
const DREWNO_RE = /\bdrewn|deskow|szkielet|ruszto/i;
const METAL_RE  = /\bstalow|metalow|stalowa|drabinka.*stal|szyna.*stal|koryto.*stal/i;

/**
 * Returns surface-specific mounting hardware based on substrate keywords.
 * Priority: beton > GK > drewno (at most one surface type per item).
 */
export function getSurfaceMaterials(itemName: string): MaterialBillItem[] {
  if (BETON_RE.test(itemName))  return [SURFACE_MATERIALS.BETON];
  if (GK_RE.test(itemName))     return [SURFACE_MATERIALS.GK];
  if (DREWNO_RE.test(itemName)) return [SURFACE_MATERIALS.DREWNO];
  if (METAL_RE.test(itemName))  return [SURFACE_MATERIALS.METAL];
  return [];
}

// ─────────────────────────────────────────────────────────────────
// Expert Hint Rules (Mandatory Inclusions)
// ─────────────────────────────────────────────────────────────────

export interface ExpertHintRule {
  /** Human-readable description for logs/debug. */
  id:         string;
  /** Regex tested against item name (case-insensitive, original text). */
  pattern:    RegExp;
  /** Materials to auto-include when pattern matches. */
  materials:  MaterialBillItem[];
}

export const EXPERT_HINT_RULES: ExpertHintRule[] = [

  // ── Wypust / Oprawa / Lampa → Kostka WAGO ─────────────────────
  // Every lighting outlet/fixture needs a WAGO connector for wire join.
  {
    id:      "lighting-wago",
    pattern: /\b(wypust|opraw|oswietl|lampa|swiatl)/i,
    materials: [
      {
        id:           "eh_wago_3p",
        category:     "HARDWARE",
        label:        "Kostka WAGO 3-przewodowa op.50szt",
        unit:         "op",
        qtyFactor:    0.02,
        slug:         "wago-3p",
        refPricePLN:  18.50,
        unitsPerPack: 50,
        note:         "Smart Pack: ceil(N_lamp/50) paczek WAGO. 1 kostka na połączenie L+N+PE.",
      },
    ],
  },

  // ── Siła / 3-faz / Indukcja → Złącze siłowe CEE ────────────────
  // 3-phase and induction items need a CEE industrial socket/plug.
  {
    id:      "power-cee",
    pattern: /sił[aą]|3.faz|trójfaz|indukcj|siłow/i,
    materials: [
      {
        id:          "eh_cee_16a",
        category:    "SOCKET",
        label:       "Złącze siłowe 3-fazowe 16A 5P (CEE)",
        unit:        "szt",
        qtyFactor:   1,
        slug:        "zlacze-silowe-16a",
        refPricePLN: 45.00,
        note:        "Wtyczka+gniazdo CEE IP44 5P 16A. Standard 3-fazowy TN-S.",
      },
    ],
  },

  // ── Rozdzielnica / Tablica → Szyna N/PE + SPD ──────────────────
  // Every distribution board needs neutral/PE busbars and surge protection.
  {
    id:      "db-busbars-spd",
    pattern: /rozdzielni|tablica\s+rozdziel|szafa\s+rozdziel/i,
    materials: [
      {
        id:          "eh_szyna_n",
        category:    "HARDWARE",
        label:       "Szyna grzebieniowa N (neutral busbar)",
        unit:        "szt",
        qtyFactor:   1,
        slug:        "szyna-grzebieniowa-n",
        refPricePLN: 25.00,
        note:        "Szyna N do rozdzielnicy. Zestaw: szyna + zaciski.",
      },
      {
        id:          "eh_szyna_pe",
        category:    "HARDWARE",
        label:       "Szyna grzebieniowa PE (earth busbar)",
        unit:        "szt",
        qtyFactor:   1,
        slug:        "szyna-grzebieniowa-pe",
        refPricePLN: 22.00,
        note:        "Szyna PE/uziemienie do rozdzielnicy.",
      },
      {
        id:          "eh_spd_t2",
        category:    "BREAKER",
        label:       "Ogranicznik przepięć T2 C/3P+N (SPD)",
        unit:        "szt",
        qtyFactor:   1,
        slug:        "spd-t2-3pn",
        refPricePLN: 180.00,
        note:        "Ochrona przepięciowa kat. C (T2). Wymagana w nowych instalacjach wg PN-IEC.",
      },
    ],
  },

  // ── KNX / Automatyka / DALI → Nakoneczniki НШВИ ─────────────────
  // Bus/automation wiring always needs ferrule terminals for screw clamps.
  {
    id:      "knx-ferrules",
    pattern: /\b(knx|automatyk|bus|magistral|dali|smart.home|home.automat)/i,
    materials: [
      {
        id:          "eh_nsvi",
        category:    "HARDWARE",
        label:       "Nakoneczniki НШВИ 0.75mm² op.100szt",
        unit:        "op",
        qtyFactor:   0.10,
        slug:        "nsvi-0.75",
        refPricePLN: 14.00,
        note:        "10 nakoneczników НШВИ na urządzenie KNX/bus. Do zacisków śrubowych.",
      },
    ],
  },

  // ── Cluster 9: PV / OZE → Złącze MC4 + Ochronnik DC ───────────────────────
  // Every PV string/panel circuit needs MC4 connectors and DC surge protection.
  {
    id:      "pv-mc4-spd",
    pattern: /\b(panel.*pv|fotowoltaik|inwerter|falownik.*pv|solar|pv\b|kabel.*dc.*solar|string.*pv)/i,
    materials: [
      {
        id:          "eh_mc4_pair",
        category:    "HARDWARE",
        label:       "Złącze MC4 para (M+F) IP67 dc solar",
        unit:        "szt",
        qtyFactor:   2,
        slug:        "zlacze-mc4-para",
        refPricePLN: 8.50,
        note:        "2 złącza MC4 (wejście + wyjście) na panel/string. IP67, 1000V DC.",
      },
      {
        id:          "eh_spd_dc_pv",
        category:    "BREAKER",
        label:       "Ochronnik DC SPD Typ 2 1000V (PV)",
        unit:        "szt",
        qtyFactor:   0.05,
        slug:        "spd-dc-typ2-1000v",
        refPricePLN: 75.00,
        note:        "1 ochronnik DC na całą instalację (~20 panelów). SPD Typ2 1000V DC.",
      },
    ],
  },

  // ── Cluster 10: Przemysł / Drabinka metalowa → Wieszak prętowy + Śruba M8 ────────
  // Metal cable trays and ladders always need threaded rod hangers and M8 hardware.
  {
    id:      "industrial-tray-hardware",
    pattern: /\b(szynoprzewod|szyna.*pradow|busbar|drabinka.*kablowa|drabinka.*metalow|koryto.*metalow|korytko.*drabinkow|taca.*kablowa)/i,
    materials: [
      {
        id:          "eh_wieszak_pretowy",
        category:    "HARDWARE",
        label:       "Wieszak prętowy M8/M10 ×1000mm (do drabinki)",
        unit:        "szt",
        qtyFactor:   1,
        slug:        "wieszak-pretowy-m8",
        refPricePLN: 12.00,
        note:        "Wieszak prętowy na każdy punkt mocowania drabinki kablowej.",
      },
      {
        id:          "eh_sruba_m8",
        category:    "HARDWARE",
        label:       "Śruba M8×20 + nakrętka + podkładka op.10szt",
        unit:        "op",
        qtyFactor:   0.20,
        slug:        "sruba-m8-komplet",
        refPricePLN: 9.00,
        note:        "2 śruby M8 na punkt mocowania. Komplet: śruba + nakrętka + podkładka.",
      },
    ],
  },

  // ── Cluster 11: PPOż / E30 / E90 → Klipsy ognioodporne + oznaczniki ──────────
  // Fire-resistant lines require special certified metal clips every 30cm.
  {
    id:      "fire-e30-e90-clips",
    pattern: /\b(e30|e90|p30|p90|ognioodporn|linia.*e30|linia.*e90|kabel.*e30|kabel.*nhxh|bezhalogen.*e90)/i,
    materials: [
      {
        id:          "eh_klips_e90",
        category:    "HARDWARE",
        label:       "Klips metalowy ognioodporny E30/E90 (co 30cm) szt",
        unit:        "szt",
        qtyFactor:   3.5,
        slug:        "klips-e90-metalowy",
        refPricePLN: 2.80,
        note:        "Certyfikowany klips ognioodporny co 30cm = ~3.5 szt/mb linii E30/E90.",
      },
      {
        id:          "eh_oznacznik_e90",
        category:    "HARDWARE",
        label:       "Oznacznik kabla E30/E90 (opaska identyfikacyjna) op.10szt",
        unit:        "op",
        qtyFactor:   0.05,
        slug:        "oznacznik-e90",
        refPricePLN: 5.50,
        note:        "Wymagane oznaczenie kabli E30/E90 co 5mb (norma SSP).",
      },
    ],
  },

  // ── Cluster 11: SSP/PPOż → Gniazdo bazowe + uszczelniacze ──────────────────────
  // Fire detectors require a mounting base (socket) for the sensor head.
  {
    id:      "ssp-czujka-base",
    pattern: /\b(czujka.*dym|czujka.*termody|czujka.*optyczna|czujka.*ssp|detektor.*dym)/i,
    materials: [
      {
        id:          "eh_gniazdo_ssp",
        category:    "HARDWARE",
        label:       "Gniazdo bazowe do czujki SSP (standard EN54)",
        unit:        "szt",
        qtyFactor:   1,
        slug:        "gniazdo-bazowe-ssp",
        refPricePLN: 12.00,
        note:        "1 gniazdo bazowe na czujkę SSP. EN54-kompatybilne.",
      },
    ],
  },

  // ── Cluster 12: Floorbox / Biuro → Gniazdo Data + Support montażowy ────────────
  // Floor boxes always need a data/video outlet module and a mounting frame.
  {
    id:      "floorbox-data-support",
    pattern: /\b(floorbox|laczek.*podlog|kanal.*podlog|floor.*box|gniazdo.*podlog)/i,
    materials: [
      {
        id:          "eh_gniazdo_data_rj45",
        category:    "SOCKET",
        label:       "Moduł gniazda RJ45 Cat6 (do floorbox)",
        unit:        "szt",
        qtyFactor:   1,
        slug:        "modul-rj45-cat6-floor",
        refPricePLN: 22.00,
        note:        "1 moduł RJ45 Cat6 na punkt danych w floorbox.",
      },
      {
        id:          "eh_support_floorbox",
        category:    "HARDWARE",
        label:       "Support montażowy floorbox (ramka podtynkowa)",
        unit:        "szt",
        qtyFactor:   1,
        slug:        "support-floorbox-ramka",
        refPricePLN: 18.00,
        note:        "Ramka montażowa (support) floorbox do podłogi technicznej/jastrychu.",
      },
    ],
  },

];

// ─────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────

/**
 * Returns all expert-hint materials for a given item name.
 *
 * Combines:
 *   1. EXPERT_HINT_RULES — keyword-triggered mandatory inclusions
 *   2. getSurfaceMaterials — substrate-specific mounting hardware
 *
 * Items are deduplicated by id (safe if multiple rules fire).
 * Returns [] if no rule matches (no extra items needed).
 */
export function getExpertHints(itemName: string): MaterialBillItem[] {
  const matched: MaterialBillItem[] = [];

  for (const rule of EXPERT_HINT_RULES) {
    if (rule.pattern.test(itemName)) {
      matched.push(...rule.materials);
    }
  }

  matched.push(...getSurfaceMaterials(itemName));

  const seen = new Set<string>();
  return matched.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}
