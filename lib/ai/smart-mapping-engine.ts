// ═══════════════════════════════════════════════════════════════════
// lib/ai/smart-mapping-engine.ts
// ES-Engine Smart Mapping Layer — Contextual Assembly Explosion
//
// Transforms simple item names into professional multi-component estimates
// based on Sacred Words triggers × Sector profiles.
//
// Formula: Total_RBH = Σ (Base_RBH_item × qtyMultiplier × parentQty × knrMultiplier)
//
// Pure functions — NO server deps, NO Supabase. Safe for client + server.
// ═══════════════════════════════════════════════════════════════════

import {
  detectSmartContext,
  buildItemContextPrompt,
  type SmartContext,
} from "./smart-context-mapper";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Project sector determines installation method and assembly ingredient composition.
 * Mapped from project.object_types.slug.
 */
export type ProjectSector = "RESIDENTIAL" | "COMMERCIAL" | "INDUSTRIAL";

/** Human-readable labels for UI display. */
export const SECTOR_LABELS: Record<ProjectSector, string> = {
  RESIDENTIAL: "Mieszkaniowy (Podtynkowy)",
  COMMERCIAL:  "Biurowy/Usługowy (Korytka/G-K)",
  INDUSTRIAL:  "Przemysłowy (Natynkowy IP44+)",
};

/**
 * Per-item override map: keyed by item label, values override template defaults.
 * Stored in project_items.assembly_overrides JSONB.
 */
export interface AssemblyItemOverride {
  qtyMultiplier?: number;
  materialPricePerUnit?: number;
  rbhPerUnit?: number;
}
export type AssemblyOverrides = Record<string, AssemblyItemOverride>;

/** One ingredient in an assembly template. */
export interface AssemblyItemDef {
  label: string;
  knrCode: string;
  unit: "mb" | "szt" | "kpl" | "m2";
  /** Qty per one parent unit (e.g. 3.5 mb per 1 punkt). */
  qtyMultiplier: number;
  /** Base KNR labor norm r-g per unit. */
  rbhPerUnit: number;
  /** True = pure labor (no material cost). False = material item with qty. */
  isLabor: boolean;
  /** Net material price PLN per unit (0 for pure labor). */
  materialPricePerUnit: number;
}

/** Full assembly template for one (trigger × sector) combination. */
export interface AssemblyTemplate {
  /** Unique ID shown in confirmation UI, e.g. "PUNKT_RESIDENTIAL_101". */
  id: string;
  /** Human-readable name. */
  name: string;
  /** Sacred Word trigger category key. */
  triggerKey: AssemblyTriggerKey;
  /** Sector context. */
  sector: ProjectSector;
  /** Short description for confirmation message. */
  description: string;
  /** Ordered list of ingredients. */
  items: AssemblyItemDef[];
}

/** Expanded item with computed quantities. */
export interface ExpandedAssemblyItem {
  label: string;
  knrCode: string;
  unit: string;
  quantity: number;
  rbhPerUnit: number;
  rbhTotal: number;
  materialPricePerUnit: number;
  materialTotal: number;
  isLabor: boolean;
  /** True if this item was modified by an AssemblyOverride. */
  isOverridden?: boolean;
}

/** Result of expanding one estimate item into a full assembly. */
export interface SmartExpansionResult {
  triggered: true;
  templateId: string;
  templateName: string;
  sector: ProjectSector;
  matchedKeyword: string;
  context: SmartContext;
  items: ExpandedAssemblyItem[];
  /** Total labor hours = Σ(rbhPerUnit × qtyMultiplier × parentQty × knrMultiplier). */
  totalRBH: number;
  /** Total labor cost PLN = totalRBH × laborRate. */
  totalLaborPLN: number;
  /** Total net material cost PLN. */
  totalMaterialPLN: number;
  /** One-line confirmation shown in UI. */
  logLine: string;
}

/** Returned when no Sacred Word trigger matched. */
export type SmartExpansionMiss = { triggered: false };

export type SmartExpansionOutcome = SmartExpansionResult | SmartExpansionMiss;

// ─── Sector Mapping ───────────────────────────────────────────────────────────

/** Maps object_types.slug values from DB to ProjectSector. */
const SLUG_TO_SECTOR: Record<string, ProjectSector> = {
  mieszkanie:          "RESIDENTIAL",
  wspolnota:           "RESIDENTIAL",
  biuro:               "COMMERCIAL",
  sklep:               "COMMERCIAL",
  "restauracja-hotel": "COMMERCIAL",
  parking:             "COMMERCIAL",
  serwerownia:         "COMMERCIAL",
  szkola:              "COMMERCIAL",
  szpital:             "COMMERCIAL",
  "przemysl-hala":     "INDUSTRIAL",
  magazyn:             "INDUSTRIAL",
  zewnetrzne:          "INDUSTRIAL",
};

/**
 * Maps a project's object_type slug → ProjectSector.
 * Falls back to RESIDENTIAL for unknown/null slugs.
 */
export function detectSector(objectTypeSlug?: string | null): ProjectSector {
  if (!objectTypeSlug) return "RESIDENTIAL";
  return SLUG_TO_SECTOR[objectTypeSlug.toLowerCase()] ?? "RESIDENTIAL";
}

// ─── Template Key ─────────────────────────────────────────────────────────────

type AssemblyTriggerKey =
  | "PUNKT"
  | "PUNKT_3PHASE"
  | "BIALY_MONTAZ"
  | "WYPUST"
  | "TRASY"
  | "ROZDZIELNICA";

type TemplateIndexKey = `${AssemblyTriggerKey}__${ProjectSector}`;

// ─── Assembly Templates ───────────────────────────────────────────────────────
// Format: Base_RBH from KNR 5-08 / KNR 4-01 calibrated norms (2026).
// qtyMultiplier: qty per 1 parent unit (1 punkt/wypust/mb)

// ── PUNKT: RESIDENTIAL — Podtynkowy (bruzda w cegle + kabel + puszka p/t) ───

const PUNKT_RESIDENTIAL: AssemblyTemplate = {
  id: "PUNKT_RESIDENTIAL_101",
  name: "Punkt instalacyjny — Mieszkanie",
  triggerKey: "PUNKT",
  sector: "RESIDENTIAL",
  description: "Bruzda w cegle/betonie + kabel YDYp 3×2.5mm² (4mb) + puszka p/t + montaż urządzenia (~65 PLN mat.)",
  items: [
    { label: "Bruzdowanie ściany (cegła)",         knrCode: "KNR 5-08 0101",    unit: "mb",  qtyMultiplier: 1.5, rbhPerUnit: 0.85, isLabor: true,  materialPricePerUnit: 0.00 },
    { label: "Kabel YDYp 3×2.5mm²",              knrCode: "KNR 5-08 0202",    unit: "mb",  qtyMultiplier: 4.0, rbhPerUnit: 0.00, isLabor: false, materialPricePerUnit: 7.20 },
    { label: "Układanie kabla YDYp 3×2.5 p/t",     knrCode: "KNR 5-08 0202",    unit: "mb",  qtyMultiplier: 4.0, rbhPerUnit: 0.16, isLabor: true,  materialPricePerUnit: 0.00 },
    { label: "Puszka podtynkowa Ø60mm",           knrCode: "KNR 5-08 0301",    unit: "szt", qtyMultiplier: 1.0, rbhPerUnit: 0.12, isLabor: false, materialPricePerUnit: 3.00 },
    { label: "Urządzenie p/t (gniazdo/wyłącznik)", knrCode: "MAT-GN-01",        unit: "szt", qtyMultiplier: 1.0, rbhPerUnit: 0.00, isLabor: false, materialPricePerUnit: 22.00 },
    { label: "Montaż urządzenia p/t",             knrCode: "KNR 5-08 0401",    unit: "szt", qtyMultiplier: 1.0, rbhPerUnit: 0.68, isLabor: true,  materialPricePerUnit: 0.00 },
  ],
};

// ── PUNKT: COMMERCIAL — Korytka/G-K (brak bruzdy, korytko lub gofra) ─────────

const PUNKT_COMMERCIAL: AssemblyTemplate = {
  id: "PUNKT_COMMERCIAL_102",
  name: "Punkt instalacyjny — Biuro/Usługi",
  triggerKey: "PUNKT",
  sector: "COMMERCIAL",
  description: "Kabel N2XH LSOH 3G2.5mm² (5mb) w korytku + Floorbox podłogowy + montaż urządzenia (~280 PLN mat.)",
  items: [
    { label: "Kabel NHXMH 3×2.5mm² (LSOH, bezhalog.)", knrCode: "KNR 5-08 0303B",   unit: "mb",  qtyMultiplier: 5.0, rbhPerUnit: 0.00, isLabor: false, materialPricePerUnit: 14.50 },
    { label: "Układanie kabla LSOH w korytku",         knrCode: "KNR 5-08 0303B",   unit: "mb",  qtyMultiplier: 5.0, rbhPerUnit: 0.12, isLabor: true,  materialPricePerUnit: 0.00 },
    { label: "Floorbox podłogowy (mechanizm + ramka)", knrCode: "KNR 5-08 0409",   unit: "szt", qtyMultiplier: 1.0, rbhPerUnit: 0.00, isLabor: false, materialPricePerUnit: 340.00 },
    { label: "Urządzenie biurowe (moduł 45×45)",       knrCode: "MAT-GN-03",        unit: "szt", qtyMultiplier: 1.0, rbhPerUnit: 0.00, isLabor: false, materialPricePerUnit: 55.00 },
    { label: "Montaż floorboxa + urządzenia",           knrCode: "KNR 5-08 0409",   unit: "szt", qtyMultiplier: 1.0, rbhPerUnit: 1.80, isLabor: true,  materialPricePerUnit: 0.00 },
  ],
};

// ── PUNKT: INDUSTRIAL — Natynkowy (rura PVC karbowana + puszka IP44) ──────────

const PUNKT_INDUSTRIAL: AssemblyTemplate = {
  id: "PUNKT_INDUSTRIAL_103",
  name: "Punkt instalacyjny — Hala/Przemysł",
  triggerKey: "PUNKT",
  sector: "INDUSTRIAL",
  description: "Kabel YDYp 3×2.5mm² (8mb) w rurze sztywnej PVC + puszka IP54 + gniazdo natynkowe IP44 (~180 PLN mat.)",
  items: [
    { label: "Kabel YDYp 3×2.5mm²",           knrCode: "KNR 5-08 0202",    unit: "mb",  qtyMultiplier: 8.0, rbhPerUnit: 0.00, isLabor: false, materialPricePerUnit: 7.20 },
    { label: "Rura sztywna PVC RS fi 25",      knrCode: "KNR 5-08 0804",    unit: "mb",  qtyMultiplier: 8.0, rbhPerUnit: 0.00, isLabor: false, materialPricePerUnit: 2.80 },
    { label: "Układanie kabla + rur + mocowania", knrCode: "KNR 5-08 0804",    unit: "mb",  qtyMultiplier: 8.0, rbhPerUnit: 0.15, isLabor: true,  materialPricePerUnit: 0.00 },
    { label: "Puszka hermetyczna IP55 n/t",    knrCode: "KNR 5-08 0303",    unit: "szt", qtyMultiplier: 1.0, rbhPerUnit: 0.00, isLabor: false, materialPricePerUnit: 18.00 },
    { label: "Gniazdo IP44/IP54 Schuko",       knrCode: "MAT-GN-04",        unit: "szt", qtyMultiplier: 1.0, rbhPerUnit: 0.00, isLabor: false, materialPricePerUnit: 35.00 },
    { label: "Montaż puszki + gniazda IP44 n/t", knrCode: "KNR 5-08 0405",  unit: "szt", qtyMultiplier: 1.0, rbhPerUnit: 0.98, isLabor: true,  materialPricePerUnit: 0.00 },
  ],
};

// ── PUNKT_3PHASE: RESIDENTIAL ─────────────────────────────────────────────────

const PUNKT_3PHASE_RESIDENTIAL: AssemblyTemplate = {
  id: "PUNKT_3PHASE_RESIDENTIAL_201",
  name: "Punkt 3-fazowy (Siła/Indukcja) — Mieszkanie",
  triggerKey: "PUNKT_3PHASE",
  sector: "RESIDENTIAL",
  description: "Bruzda + kabel YDYp 5×2.5mm² + puszka głęboka p/t + gniazdo CEE 16A",
  items: [
    { label: "Bruzdowanie ściany (cegła)",         knrCode: "KNR 5-08 0101",    unit: "mb",  qtyMultiplier: 4.5, rbhPerUnit: 0.85, isLabor: true,  materialPricePerUnit: 0.00 },
    { label: "Kabel YDYp 5×2.5mm²",               knrCode: "KNR 5-08 0203",    unit: "mb",  qtyMultiplier: 4.5, rbhPerUnit: 0.00, isLabor: false, materialPricePerUnit: 10.50 },
    { label: "Układanie kabla 5×2.5 p/t",          knrCode: "KNR 5-08 0203",    unit: "mb",  qtyMultiplier: 4.5, rbhPerUnit: 0.20, isLabor: true,  materialPricePerUnit: 0.00 },
    { label: "Puszka podtynkowa głęboka",          knrCode: "KNR 5-08 0302",    unit: "szt", qtyMultiplier: 1.0, rbhPerUnit: 0.18, isLabor: false, materialPricePerUnit: 6.00 },
    { label: "Gniazdo 3-faz CEE 16A p/t",          knrCode: "KNR 5-10 0602",    unit: "szt", qtyMultiplier: 1.0, rbhPerUnit: 0.50, isLabor: true,  materialPricePerUnit: 0.00 },
  ],
};

// ── PUNKT_3PHASE: COMMERCIAL ──────────────────────────────────────────────────

const PUNKT_3PHASE_COMMERCIAL: AssemblyTemplate = {
  id: "PUNKT_3PHASE_COMMERCIAL_202",
  name: "Punkt 3-fazowy (Siła/Indukcja) — Biuro",
  triggerKey: "PUNKT_3PHASE",
  sector: "COMMERCIAL",
  description: "Kabel YDYp 5×2.5mm² w korytku + puszka głęboka + gniazdo CEE 16A",
  items: [
    { label: "Kabel YDYp 5×2.5mm²",      knrCode: "KNR 5-08 0203",    unit: "mb",  qtyMultiplier: 4.5, rbhPerUnit: 0.00, isLabor: false, materialPricePerUnit: 10.50 },
    { label: "Układanie kabla w korytku", knrCode: "KNR 5-08 0203",    unit: "mb",  qtyMultiplier: 4.5, rbhPerUnit: 0.20, isLabor: true,  materialPricePerUnit: 0.00 },
    { label: "Puszka głęboka pod G-K",    knrCode: "KNR 5-08 0302",    unit: "szt", qtyMultiplier: 1.0, rbhPerUnit: 0.18, isLabor: false, materialPricePerUnit: 6.00 },
    { label: "Gniazdo 3-faz CEE 16A p/t", knrCode: "KNR 5-10 0602",    unit: "szt", qtyMultiplier: 1.0, rbhPerUnit: 0.50, isLabor: true,  materialPricePerUnit: 0.00 },
  ],
};

// ── PUNKT_3PHASE: INDUSTRIAL ──────────────────────────────────────────────────

const PUNKT_3PHASE_INDUSTRIAL: AssemblyTemplate = {
  id: "PUNKT_3PHASE_INDUSTRIAL_203",
  name: "Punkt 3-fazowy (Siła/Indukcja) — Hala",
  triggerKey: "PUNKT_3PHASE",
  sector: "INDUSTRIAL",
  description: "Rura stalowa EMT + kabel 5×2.5mm² + puszka IP54 + gniazdo CEE 32A natynkowe",
  items: [
    { label: "Kabel YDYp 5×2.5mm²",             knrCode: "KNR 5-08 0203",    unit: "mb",  qtyMultiplier: 4.5, rbhPerUnit: 0.00, isLabor: false, materialPricePerUnit: 10.50 },
    { label: "Rura stalowa BST fi 20-32",        knrCode: "KNR 5-10 1205",    unit: "mb",  qtyMultiplier: 4.5, rbhPerUnit: 0.00, isLabor: false, materialPricePerUnit: 4.50 },
    { label: "Układanie kabla w rurze stalowej", knrCode: "KNR 5-10 1205",    unit: "mb",  qtyMultiplier: 4.5, rbhPerUnit: 0.22, isLabor: true,  materialPricePerUnit: 0.00 },
    { label: "Puszka hermetyczna IP55 n/t",      knrCode: "KNR 5-08 0303",    unit: "szt", qtyMultiplier: 1.0, rbhPerUnit: 0.20, isLabor: false, materialPricePerUnit: 18.00 },
    { label: "Gniazdo 3-faz CEE 32A n/t",        knrCode: "KNR 5-10 0603",    unit: "szt", qtyMultiplier: 1.0, rbhPerUnit: 0.60, isLabor: true,  materialPricePerUnit: 0.00 },
  ],
};

// ── BIALY_MONTAZ: installation-only (no cable / no bruzda) ────────────────────

const BIALY_MONTAZ_RESIDENTIAL: AssemblyTemplate = {
  id: "BIALY_MONTAZ_RESIDENTIAL_301",
  name: "Biały montaż — Mieszkanie",
  triggerKey: "BIALY_MONTAZ",
  sector: "RESIDENTIAL",
  description: "Tylko czysta robocizna montażu mechanizmu p/t (bez kabla i bruzdy)",
  items: [
    { label: "Montaż urządzenia p/t", knrCode: "KNR 5-08 0401", unit: "szt", qtyMultiplier: 1.0, rbhPerUnit: 0.68, isLabor: true, materialPricePerUnit: 0.00 },
  ],
};

const BIALY_MONTAZ_COMMERCIAL: AssemblyTemplate = {
  id: "BIALY_MONTAZ_COMMERCIAL_302",
  name: "Biały Montaż — Biuro",
  triggerKey: "BIALY_MONTAZ",
  sector: "COMMERCIAL",
  description: "Tylko czysta robocizna montażu urządzenia w zabudowie biurowej",
  items: [
    { label: "Montaż urządzenia (biuro/G-K)", knrCode: "KNR 5-08 0401", unit: "szt", qtyMultiplier: 1.0, rbhPerUnit: 0.68, isLabor: true, materialPricePerUnit: 0.00 },
  ],
};

const BIALY_MONTAZ_INDUSTRIAL: AssemblyTemplate = {
  id: "BIALY_MONTAZ_INDUSTRIAL_303",
  name: "Biały Montaż — Hala",
  triggerKey: "BIALY_MONTAZ",
  sector: "INDUSTRIAL",
  description: "Tylko czysta robocizna montażu urządzenia natynkowego IP44+",
  items: [
    { label: "Montaż urządzenia natynk. IP44", knrCode: "KNR 5-08 0405", unit: "szt", qtyMultiplier: 1.0, rbhPerUnit: 0.98, isLabor: true, materialPricePerUnit: 0.00 },
  ],
};

// ── WYPUST: kabel + trasa (bez montażu urządzenia końcowego) ──────────────────

const WYPUST_RESIDENTIAL: AssemblyTemplate = {
  id: "WYPUST_RESIDENTIAL_401",
  name: "Wypust kablowy — Mieszkanie",
  triggerKey: "WYPUST",
  sector: "RESIDENTIAL",
  description: "Bruzda + kabel YDYp 3×1.5mm² p/t (bez montażu urządzenia końcowego)",
  items: [
    { label: "Bruzdowanie ściany (cegła)",         knrCode: "KNR 5-08 0101",    unit: "mb",  qtyMultiplier: 1.5, rbhPerUnit: 0.85, isLabor: true,  materialPricePerUnit: 0.00 },
    { label: "Kabel YDYp 3×1.5mm²",              knrCode: "KNR 5-08 0201",    unit: "mb",  qtyMultiplier: 3.5, rbhPerUnit: 0.00, isLabor: false, materialPricePerUnit: 5.20 },
    { label: "Układanie kabla YDYp 3×1.5 p/t",     knrCode: "KNR 5-08 0201",    unit: "mb",  qtyMultiplier: 3.5, rbhPerUnit: 0.13, isLabor: true,  materialPricePerUnit: 0.00 },
  ],
};

const WYPUST_COMMERCIAL: AssemblyTemplate = {
  id: "WYPUST_COMMERCIAL_402",
  name: "Wypust kablowy — Biuro",
  triggerKey: "WYPUST",
  sector: "COMMERCIAL",
  description: "Kabel YDYp 3×1.5mm² w korytku (bez montażu urządzenia końcowego)",
  items: [
    { label: "Kabel YDYp 3×1.5mm²",      knrCode: "KNR 5-08 0201",    unit: "mb", qtyMultiplier: 3.5, rbhPerUnit: 0.00, isLabor: false, materialPricePerUnit: 5.20 },
    { label: "Układanie kabla w korytku", knrCode: "KNR 5-08 0201",    unit: "mb", qtyMultiplier: 3.5, rbhPerUnit: 0.13, isLabor: true,  materialPricePerUnit: 0.00 },
  ],
};

const WYPUST_INDUSTRIAL: AssemblyTemplate = {
  id: "WYPUST_INDUSTRIAL_403",
  name: "Wypust kablowy — Hala",
  triggerKey: "WYPUST",
  sector: "INDUSTRIAL",
  description: "Kabel YDYp 3×1.5mm² w rurze PVC karbowanej (bez urządzenia końcowego)",
  items: [
    { label: "Kabel YDYp 3×1.5mm²",      knrCode: "KNR 5-08 0201",    unit: "mb", qtyMultiplier: 3.5, rbhPerUnit: 0.00, isLabor: false, materialPricePerUnit: 5.20 },
    { label: "Rura karbowana PVC fi 20", knrCode: "KNR 5-08 0801",    unit: "mb", qtyMultiplier: 3.5, rbhPerUnit: 0.00, isLabor: false, materialPricePerUnit: 1.20 },
    { label: "Układanie kabla + rur n/t", knrCode: "KNR 5-08 0801",    unit: "mb", qtyMultiplier: 3.5, rbhPerUnit: 0.20, isLabor: true,  materialPricePerUnit: 0.00 },
  ],
};

// ── TRASY: rozliczenie per mb ─────────────────────────────────────────────────

const TRASY_RESIDENTIAL: AssemblyTemplate = {
  id: "TRASY_RESIDENTIAL_501",
  name: "Trasa kablowa — Mieszkanie (bruzda)",
  triggerKey: "TRASY",
  sector: "RESIDENTIAL",
  description: "Bruzdowanie ściany + układanie kabli p/t (rozliczenie per mb)",
  items: [
    { label: "Bruzdowanie ściany (cegła)",         knrCode: "KNR 5-08 0101",    unit: "mb", qtyMultiplier: 1.0, rbhPerUnit: 0.85, isLabor: true, materialPricePerUnit: 0.00 },
    { label: "Układanie kabla YDYp p/t",            knrCode: "KNR 5-08 0201",    unit: "mb", qtyMultiplier: 1.0, rbhPerUnit: 0.13, isLabor: true, materialPricePerUnit: 0.00 },
  ],
};

const TRASY_COMMERCIAL: AssemblyTemplate = {
  id: "TRASY_COMMERCIAL_502",
  name: "Trasa kablowa — Biuro (korytko)",
  triggerKey: "TRASY",
  sector: "COMMERCIAL",
  description: "Montaż korytka kablowego PVC 60×60 + układanie kabli (per mb)",
  items: [
    { label: "Korytko kablowe PVC 60×60", knrCode: "KNR 5-08 0703c", unit: "mb", qtyMultiplier: 1.0, rbhPerUnit: 0.00, isLabor: false, materialPricePerUnit: 18.00 },
    { label: "Montaż korytka PVC",        knrCode: "KNR 5-08 0703c", unit: "mb", qtyMultiplier: 1.0, rbhPerUnit: 0.15, isLabor: true,  materialPricePerUnit: 0.00 },
    { label: "Układanie kabla w korytku", knrCode: "KNR 5-08 0201",  unit: "mb", qtyMultiplier: 1.0, rbhPerUnit: 0.13, isLabor: true,  materialPricePerUnit: 0.00 },
  ],
};

const TRASY_INDUSTRIAL: AssemblyTemplate = {
  id: "TRASY_INDUSTRIAL_503",
  name: "Trasa kablowa — Hala (drabinka stalowa)",
  triggerKey: "TRASY",
  sector: "INDUSTRIAL",
  description: "Drabinka kablowa stalowa 100mm + prowadzenie kabli (per mb)",
  items: [
    { label: "Drabinka kablowa stalowa 100mm", knrCode: "KNR 5-10 1201", unit: "mb", qtyMultiplier: 1.0, rbhPerUnit: 0.00, isLabor: false, materialPricePerUnit: 65.00 },
    { label: "Montaż drabinki kablowej",       knrCode: "KNR 5-10 1201", unit: "mb", qtyMultiplier: 1.0, rbhPerUnit: 0.18, isLabor: true,  materialPricePerUnit: 0.00 },
    { label: "Prowadzenie/układanie kabla",    knrCode: "KNR 5-08 0203", unit: "mb", qtyMultiplier: 1.0, rbhPerUnit: 0.20, isLabor: true,  materialPricePerUnit: 0.00 },
  ],
};

// ── ROZDZIELNICA: switchboard assembly (per kpl) ────────────────────────────
// Total_M = Σ materialPricePerUnit × qtyMultiplier × parentQty (parentQty = nr of boards)
// Target: RESIDENTIAL ~2 000 PLN | COMMERCIAL ~5 000 PLN | INDUSTRIAL ~8 000 PLN

const ROZDZIELNICA_RESIDENTIAL: AssemblyTemplate = {
  id: "ROZDZIELNICA_RESIDENTIAL_601",
  name: "Montaż Rozdzielnicy — Mieszkanie",
  triggerKey: "ROZDZIELNICA",
  sector: "RESIDENTIAL",
  description: "Obudowa 24-mod p/t + aparatura MCB/RCD/SPD + materiały montażowe (komplet ~2 000 PLN mat.)",
  items: [
    { label: "Obudowa 24-mod p/t",                       knrCode: "KNR 5-08 0301",    unit: "kpl", qtyMultiplier: 1.0, rbhPerUnit: 0.00, isLabor: false, materialPricePerUnit: 220.00 },
    { label: "Aparatura MCB 1P (12szt, kpl)",             knrCode: "KNR 5-08 0201a",   unit: "kpl", qtyMultiplier: 1.0, rbhPerUnit: 0.00, isLabor: false, materialPricePerUnit: 168.00 },
    { label: "Ochronniki RCD 2P × 2szt (kpl)",           knrCode: "KNR 5-08 0211",    unit: "kpl", qtyMultiplier: 1.0, rbhPerUnit: 0.00, isLabor: false, materialPricePerUnit: 210.00 },
    { label: "SPD T2 (ochronnik przepięć)",               knrCode: "KNR 5-08 0231",    unit: "szt", qtyMultiplier: 1.0, rbhPerUnit: 0.00, isLabor: false, materialPricePerUnit: 280.00 },
    { label: "Materiały montażowe (szyny PE/N, opaski)",  knrCode: "MAT-ROZD-01",      unit: "kpl", qtyMultiplier: 1.0, rbhPerUnit: 0.00, isLabor: false, materialPricePerUnit: 180.00 },
    { label: "Oznaczniki, kable WLZ wewn. (kpl)",        knrCode: "MAT-ROZD-02",      unit: "kpl", qtyMultiplier: 1.0, rbhPerUnit: 0.00, isLabor: false, materialPricePerUnit: 150.00 },
    { label: "Montaż i okablowanie rozdzielnicy 24-mod", knrCode: "ES-KNR-ROZ FULL 24PT", unit: "kpl", qtyMultiplier: 1.0, rbhPerUnit: 10.00, isLabor: true, materialPricePerUnit: 0.00 },
  ],
};

const ROZDZIELNICA_COMMERCIAL: AssemblyTemplate = {
  id: "ROZDZIELNICA_COMMERCIAL_602",
  name: "Montaż Rozdzielnicy — Biuro/Komercja",
  triggerKey: "ROZDZIELNICA",
  sector: "COMMERCIAL",
  description: "Obudowa 48-mod n/t stalowa + aparatura 3P/1P + RCD + SPD + materiały (~5 000 PLN mat.)",
  items: [
    { label: "Obudowa 48-mod n/t (stalowa)",             knrCode: "KNR 5-08 0303",    unit: "kpl", qtyMultiplier: 1.0, rbhPerUnit: 0.00, isLabor: false, materialPricePerUnit: 360.00 },
    { label: "Aparatura MCB 3P/1P × 24szt (kpl)",        knrCode: "KNR 5-08 0203a",   unit: "kpl", qtyMultiplier: 1.0, rbhPerUnit: 0.00, isLabor: false, materialPricePerUnit: 720.00 },
    { label: "RCD 4P + 2P × 4szt (kpl)",                 knrCode: "KNR 5-08 0212",    unit: "kpl", qtyMultiplier: 1.0, rbhPerUnit: 0.00, isLabor: false, materialPricePerUnit: 600.00 },
    { label: "SPD T2 3P+N (kpl)",                        knrCode: "KNR 5-08 0231",    unit: "kpl", qtyMultiplier: 1.0, rbhPerUnit: 0.00, isLabor: false, materialPricePerUnit: 280.00 },
    { label: "Materiały: szyny Cu, zaciski (kpl)",        knrCode: "MAT-ROZD-03",      unit: "kpl", qtyMultiplier: 1.0, rbhPerUnit: 0.00, isLabor: false, materialPricePerUnit: 450.00 },
    { label: "Kable zasilające WLZ (kpl)",               knrCode: "MAT-ROZD-04",      unit: "kpl", qtyMultiplier: 1.0, rbhPerUnit: 0.00, isLabor: false, materialPricePerUnit: 600.00 },
    { label: "Montaż i okablowanie rozdzielnicy 48-mod", knrCode: "ES-KNR-ROZ FULL 48PT", unit: "kpl", qtyMultiplier: 1.0, rbhPerUnit: 18.00, isLabor: true, materialPricePerUnit: 0.00 },
  ],
};

const ROZDZIELNICA_INDUSTRIAL: AssemblyTemplate = {
  id: "ROZDZIELNICA_INDUSTRIAL_603",
  name: "Montaż Rozdzielnicy — Hala/Przemysł",
  triggerKey: "ROZDZIELNICA",
  sector: "INDUSTRIAL",
  description: "Obudowa wolnostojąca IP54 600×800 + MCCB/MCB + RCD/RCBO + SPD T1+T2 + materiały (~8 000 PLN mat.)",
  items: [
    { label: "Obudowa wolnostojąca IP54 600×800",         knrCode: "KNR 5-10 0201",    unit: "kpl", qtyMultiplier: 1.0, rbhPerUnit: 0.00, isLabor: false, materialPricePerUnit: 1800.00 },
    { label: "Aparatura MCCB + MCB (kpl)",                knrCode: "KNR 5-10 0201a",   unit: "kpl", qtyMultiplier: 1.0, rbhPerUnit: 0.00, isLabor: false, materialPricePerUnit: 2000.00 },
    { label: "RCD + RCBO (kpl)",                         knrCode: "KNR 5-08 0212",    unit: "kpl", qtyMultiplier: 1.0, rbhPerUnit: 0.00, isLabor: false, materialPricePerUnit: 900.00 },
    { label: "SPD T1+T2 (kpl)",                          knrCode: "KNR 5-11 0114",    unit: "kpl", qtyMultiplier: 1.0, rbhPerUnit: 0.00, isLabor: false, materialPricePerUnit: 800.00 },
    { label: "Szyny Cu, zaciski, grzebienie (kpl)",       knrCode: "MAT-ROZD-05",      unit: "kpl", qtyMultiplier: 1.0, rbhPerUnit: 0.00, isLabor: false, materialPricePerUnit: 600.00 },
    { label: "Materiały montażowe (kpl)",                 knrCode: "MAT-ROZD-06",      unit: "kpl", qtyMultiplier: 1.0, rbhPerUnit: 0.00, isLabor: false, materialPricePerUnit: 1200.00 },
    { label: "Kable i przewody wewnętrzne (kpl)",         knrCode: "MAT-ROZD-07",      unit: "kpl", qtyMultiplier: 1.0, rbhPerUnit: 0.00, isLabor: false, materialPricePerUnit: 600.00 },
    { label: "Montaż i okablowanie rozdzielnicy przem. wolnostoj.", knrCode: "KNR 5-10 0201", unit: "kpl", qtyMultiplier: 1.0, rbhPerUnit: 28.00, isLabor: true, materialPricePerUnit: 0.00 },
  ],
};

// ─── Template Index ───────────────────────────────────────────────────────────

const TEMPLATE_INDEX: Partial<Record<TemplateIndexKey, AssemblyTemplate>> = {
  "PUNKT__RESIDENTIAL":          PUNKT_RESIDENTIAL,
  "PUNKT__COMMERCIAL":           PUNKT_COMMERCIAL,
  "PUNKT__INDUSTRIAL":           PUNKT_INDUSTRIAL,
  "PUNKT_3PHASE__RESIDENTIAL":   PUNKT_3PHASE_RESIDENTIAL,
  "PUNKT_3PHASE__COMMERCIAL":    PUNKT_3PHASE_COMMERCIAL,
  "PUNKT_3PHASE__INDUSTRIAL":    PUNKT_3PHASE_INDUSTRIAL,
  "BIALY_MONTAZ__RESIDENTIAL":   BIALY_MONTAZ_RESIDENTIAL,
  "BIALY_MONTAZ__COMMERCIAL":    BIALY_MONTAZ_COMMERCIAL,
  "BIALY_MONTAZ__INDUSTRIAL":    BIALY_MONTAZ_INDUSTRIAL,
  "WYPUST__RESIDENTIAL":         WYPUST_RESIDENTIAL,
  "WYPUST__COMMERCIAL":          WYPUST_COMMERCIAL,
  "WYPUST__INDUSTRIAL":          WYPUST_INDUSTRIAL,
  "TRASY__RESIDENTIAL":          TRASY_RESIDENTIAL,
  "TRASY__COMMERCIAL":           TRASY_COMMERCIAL,
  "TRASY__INDUSTRIAL":           TRASY_INDUSTRIAL,
  "ROZDZIELNICA__RESIDENTIAL":   ROZDZIELNICA_RESIDENTIAL,
  "ROZDZIELNICA__COMMERCIAL":    ROZDZIELNICA_COMMERCIAL,
  "ROZDZIELNICA__INDUSTRIAL":    ROZDZIELNICA_INDUSTRIAL,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns a specific template by ID. */
export function getTemplateById(id: string): AssemblyTemplate | null {
  return Object.values(TEMPLATE_INDEX).find((t) => t?.id === id) ?? null;
}

/** Returns all templates for a given sector (for admin display). */
export function getTemplatesForSector(sector: ProjectSector): AssemblyTemplate[] {
  return Object.values(TEMPLATE_INDEX).filter(
    (t): t is AssemblyTemplate => t?.sector === sector,
  );
}

// ─── Main Expansion Function ──────────────────────────────────────────────────

/**
 * Expands an estimate item into a full professional assembly if a Sacred Word trigger is detected.
 *
 * Formula: Total_RBH = Σ (rbhPerUnit × qtyMultiplier × parentQty × knrMultiplier)
 *
 * @param itemName       Item name to parse for Sacred Words.
 * @param parentQty      Qty of the parent item (e.g. 25 for "Punkt gniazdo 25 szt").
 * @param sector         Project sector (from detectSector).
 * @param laborRate      Effective labor rate PLN/rbh (after region modifier).
 * @param knrMultiplier  Admin KNR 2026 multiplier (default 1.4).
 * @param overrides      Optional per-item overrides (from project_items.assembly_overrides).
 */
export function expandToAssembly(
  itemName: string,
  parentQty: number,
  sector: ProjectSector,
  laborRate: number,
  knrMultiplier: number = 1.4,
  overrides?: AssemblyOverrides | null,
): SmartExpansionOutcome {
  const ctx = detectSmartContext(itemName);

  if (ctx.category === "NONE") {
    return { triggered: false };
  }

  // Map SCM category + subType → trigger key
  let triggerKey: AssemblyTriggerKey;
  switch (ctx.category) {
    case "ZESTAW":
      triggerKey = ctx.subType === "ZESTAW_3PHASE" ? "PUNKT_3PHASE" : "PUNKT";
      break;
    case "BIALY_MONTAZ":
      triggerKey = "BIALY_MONTAZ";
      break;
    case "TRASY":
      triggerKey = "TRASY";
      break;
    case "ROZDZIELNICA":
      triggerKey = "ROZDZIELNICA";
      break;
    default:
      return { triggered: false };
  }

  // Special: "Wypust" without "instalacją" suffix → WYPUST trigger
  if (ctx.category === "ZESTAW" && ctx.matchedKeyword === "Wypust z instalacją") {
    triggerKey = "WYPUST";
  }
  // Plain "Wypust" in BIALY_MONTAZ falls to WYPUST too
  if (ctx.category === "BIALY_MONTAZ" && /\bwypust\b/i.test(itemName)) {
    triggerKey = "WYPUST";
  }

  const key: TemplateIndexKey = `${triggerKey}__${sector}`;
  const template = TEMPLATE_INDEX[key];
  if (!template) return { triggered: false };

  // Compute expanded items (apply per-item overrides if present)
  const expandedItems: ExpandedAssemblyItem[] = template.items.map((def) => {
    const ov = overrides?.[def.label];
    const effQtyMult  = ov?.qtyMultiplier        ?? def.qtyMultiplier;
    const effRbhUnit  = ov?.rbhPerUnit            ?? def.rbhPerUnit;
    const effMatUnit  = ov?.materialPricePerUnit  ?? def.materialPricePerUnit;
    const quantity    = effQtyMult * parentQty;
    const rbhTotal    = effRbhUnit * quantity * knrMultiplier;
    const materialTotal = def.isLabor ? 0 : effMatUnit * quantity;
    return {
      label: def.label,
      knrCode: def.knrCode,
      unit: def.unit,
      quantity,
      rbhPerUnit: effRbhUnit,
      rbhTotal,
      materialPricePerUnit: effMatUnit,
      materialTotal,
      isLabor: def.isLabor,
      isOverridden: ov !== undefined,
    };
  });

  const totalRBH        = expandedItems.reduce((s, i) => s + i.rbhTotal, 0);
  const totalLaborPLN   = totalRBH * laborRate;
  const totalMaterialPLN = expandedItems.reduce((s, i) => s + i.materialTotal, 0);

  const rbhPerPoint = parentQty > 0 ? totalRBH / parentQty : totalRBH;

  return {
    triggered: true,
    templateId: template.id,
    templateName: template.name,
    sector,
    matchedKeyword: ctx.matchedKeyword ?? triggerKey,
    context: ctx,
    items: expandedItems,
    totalRBH,
    totalLaborPLN,
    totalMaterialPLN,
    logLine: [
      `Rozpoznano słowo kluczowe '${ctx.matchedKeyword ?? triggerKey}'`,
      `dla sektora '${SECTOR_LABELS[sector]}'.`,
      `Zastosowano Zestaw #${template.id}.`,
      `Łączny nakład: ${totalRBH.toFixed(2)} rbh`,
      `(${rbhPerPoint.toFixed(2)} rbh/${triggerKey === "TRASY" ? "mb" : triggerKey === "ROZDZIELNICA" ? "kpl" : "pkt"}).`,
    ].join(" "),
  };
}

// ─── L3 Prompt Injection ─────────────────────────────────────────────────────

/**
 * Builds an enriched item list string for the L3 AI batch prompt.
 * Extends smart-context-mapper's buildEnrichedItemList with assembly RBH hints.
 *
 * Format per item:
 *   N. "name" | jednostka: unit
 *      ↳ [SCM:ZESTAW ...] hint
 *      ↳ [ASSEMBLY:PUNKT_RESIDENTIAL_101 totalRBH=1.54 rbh/pkt=1.54 items=5]
 */
export function buildEnrichedItemListWithAssembly(
  items: Array<{ name: string; unit: string; quantity?: number }>,
  sector: ProjectSector,
  knrMultiplier: number = 1.4,
): string {
  return items
    .map((item, idx) => {
      const scmHint = buildItemContextPrompt(item.name);
      const qty = item.quantity ?? 1;
      const expansion = expandToAssembly(item.name, qty, sector, 100, knrMultiplier);
      let assemblyHint = "";
      if (expansion.triggered) {
        const rbhPerPoint = qty > 0 ? expansion.totalRBH / qty : expansion.totalRBH;
        assemblyHint = [
          `[ASSEMBLY:${expansion.templateId}`,
          `totalRBH=${expansion.totalRBH.toFixed(2)}`,
          `rbh/pkt=${rbhPerPoint.toFixed(2)}`,
          `items=${expansion.items.length}]`,
          `Zestaw: ${expansion.items.map((i) => `${i.label}(${i.rbhTotal.toFixed(2)}rbh)`).join(" + ")}.`,
          `NIE przeliczaj osobno — użyj sumy ${rbhPerPoint.toFixed(2)} rbh/${qty > 1 ? "szt" : "jm"} jako labor_norm_rbh.`,
        ].join(" ");
      }
      const hints = [scmHint, assemblyHint].filter(Boolean);
      const hintBlock = hints.map((h) => `   ↳ ${h}`).join("\n");
      return `${idx + 1}. "${item.name}" | jednostka: ${item.unit}${hintBlock ? "\n" + hintBlock : ""}`;
    })
    .join("\n");
}
