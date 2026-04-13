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
  | "TRASY";

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
  description: "Bruzda w cegle/betonie + kabel YDYp 3×2.5mm² + puszka p/t + montaż urządzenia",
  items: [
    { label: "Bruzdowanie ściany (cegła/beton)", knrCode: "KNR 4-01 0101-02", unit: "mb",  qtyMultiplier: 1.5, rbhPerUnit: 0.10, isLabor: true,  materialPricePerUnit: 0.00 },
    { label: "Kabel YDYp 3×2.5mm²",              knrCode: "KNR 5-08 0101-02", unit: "mb",  qtyMultiplier: 3.5, rbhPerUnit: 0.16, isLabor: false, materialPricePerUnit: 5.50 },
    { label: "Układanie kabla p/t",               knrCode: "KNR 5-08 0201-01", unit: "mb",  qtyMultiplier: 3.5, rbhPerUnit: 0.08, isLabor: true,  materialPricePerUnit: 0.00 },
    { label: "Puszka podtynkowa Ø60mm",           knrCode: "KNR 5-08 0301-01", unit: "szt", qtyMultiplier: 1.0, rbhPerUnit: 0.15, isLabor: false, materialPricePerUnit: 3.50 },
    { label: "Urządzenie p/t (gniazdo/wyłącznik)", knrCode: "MAT-GN-01",       unit: "szt", qtyMultiplier: 1.0, rbhPerUnit: 0.00, isLabor: false, materialPricePerUnit: 30.00 },
    { label: "Montaż urządzenia p/t",             knrCode: "KNR 5-08 0401-03", unit: "szt", qtyMultiplier: 1.0, rbhPerUnit: 0.68, isLabor: true,  materialPricePerUnit: 0.00 },
  ],
};

// ── PUNKT: COMMERCIAL — Korytka/G-K (brak bruzdy, korytko lub gofra) ─────────

const PUNKT_COMMERCIAL: AssemblyTemplate = {
  id: "PUNKT_COMMERCIAL_102",
  name: "Punkt instalacyjny — Biuro/Usługi",
  triggerKey: "PUNKT",
  sector: "COMMERCIAL",
  description: "Kabel YDYp 3×2.5mm² w korytku/gofre + puszka pod G-K + montaż urządzenia",
  items: [
    { label: "Kabel YDYp 3×2.5mm²",           knrCode: "KNR 5-08 0101-02", unit: "mb",  qtyMultiplier: 3.5, rbhPerUnit: 0.16, isLabor: false, materialPricePerUnit: 5.50 },
    { label: "Układanie kabla w korytku",      knrCode: "KNR 5-08 0202-01", unit: "mb",  qtyMultiplier: 3.5, rbhPerUnit: 0.08, isLabor: true,  materialPricePerUnit: 0.00 },
    { label: "Puszka podtynkowa pod G-K",      knrCode: "KNR 5-08 0301-03", unit: "szt", qtyMultiplier: 1.0, rbhPerUnit: 0.18, isLabor: false, materialPricePerUnit: 4.00 },
    { label: "Urządzenie p/t (gniazdo/wyłącznik)", knrCode: "MAT-GN-01",       unit: "szt", qtyMultiplier: 1.0, rbhPerUnit: 0.00, isLabor: false, materialPricePerUnit: 30.00 },
    { label: "Montaż urządzenia (biuro/G-K)",  knrCode: "KNR 5-08 0401-03", unit: "szt", qtyMultiplier: 1.0, rbhPerUnit: 0.68, isLabor: true,  materialPricePerUnit: 0.00 },
  ],
};

// ── PUNKT: INDUSTRIAL — Natynkowy (rura PVC karbowana + puszka IP44) ──────────

const PUNKT_INDUSTRIAL: AssemblyTemplate = {
  id: "PUNKT_INDUSTRIAL_103",
  name: "Punkt instalacyjny — Hala/Przemysł",
  triggerKey: "PUNKT",
  sector: "INDUSTRIAL",
  description: "Kabel YDYp 3×2.5mm² w rurze PVC + puszka natynkowa IP44 + montaż urządzenia",
  items: [
    { label: "Kabel YDYp 3×2.5mm²",           knrCode: "KNR 5-08 0101-02", unit: "mb",  qtyMultiplier: 3.5, rbhPerUnit: 0.16, isLabor: false, materialPricePerUnit: 5.50 },
    { label: "Rura karbowana PVC M20",         knrCode: "KNR 5-08 0501-01", unit: "mb",  qtyMultiplier: 3.5, rbhPerUnit: 0.07, isLabor: false, materialPricePerUnit: 1.20 },
    { label: "Układanie rur + mocowania",      knrCode: "KNR 5-08 0503-01", unit: "mb",  qtyMultiplier: 3.5, rbhPerUnit: 0.05, isLabor: true,  materialPricePerUnit: 0.00 },
    { label: "Puszka natynkowa IP44",          knrCode: "KNR 5-08 0301-04", unit: "szt", qtyMultiplier: 1.0, rbhPerUnit: 0.20, isLabor: false, materialPricePerUnit: 7.50 },
    { label: "Urządzenie natynkowe IP44",      knrCode: "MAT-GN-02",       unit: "szt", qtyMultiplier: 1.0, rbhPerUnit: 0.00, isLabor: false, materialPricePerUnit: 35.00 },
    { label: "Montaż urządzenia natynk. IP44", knrCode: "KNR 5-08 0401-06", unit: "szt", qtyMultiplier: 1.0, rbhPerUnit: 0.54, isLabor: true,  materialPricePerUnit: 0.00 },
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
    { label: "Bruzdowanie ściany (cegła/beton)",  knrCode: "KNR 4-01 0101-02", unit: "mb",  qtyMultiplier: 4.5, rbhPerUnit: 0.12, isLabor: true,  materialPricePerUnit: 0.00 },
    { label: "Kabel YDYp 5×2.5mm²",               knrCode: "KNR 5-08 0101-04", unit: "mb",  qtyMultiplier: 4.5, rbhPerUnit: 0.20, isLabor: false, materialPricePerUnit: 5.80 },
    { label: "Układanie kabla p/t",                knrCode: "KNR 5-08 0201-01", unit: "mb",  qtyMultiplier: 4.5, rbhPerUnit: 0.08, isLabor: true,  materialPricePerUnit: 0.00 },
    { label: "Puszka podtynkowa głęboka",          knrCode: "KNR 5-08 0301-02", unit: "szt", qtyMultiplier: 1.0, rbhPerUnit: 0.20, isLabor: false, materialPricePerUnit: 3.20 },
    { label: "Gniazdo 3-faz CEE 16A p/t",          knrCode: "KNR 5-08 0403-01", unit: "szt", qtyMultiplier: 1.0, rbhPerUnit: 1.18, isLabor: true,  materialPricePerUnit: 0.00 },
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
    { label: "Kabel YDYp 5×2.5mm²",      knrCode: "KNR 5-08 0101-04", unit: "mb",  qtyMultiplier: 4.5, rbhPerUnit: 0.20, isLabor: false, materialPricePerUnit: 5.80 },
    { label: "Układanie w korytku",       knrCode: "KNR 5-08 0202-01", unit: "mb",  qtyMultiplier: 4.5, rbhPerUnit: 0.08, isLabor: true,  materialPricePerUnit: 0.00 },
    { label: "Puszka głęboka pod G-K",    knrCode: "KNR 5-08 0301-03", unit: "szt", qtyMultiplier: 1.0, rbhPerUnit: 0.22, isLabor: false, materialPricePerUnit: 4.00 },
    { label: "Gniazdo 3-faz CEE 16A p/t", knrCode: "KNR 5-08 0403-01", unit: "szt", qtyMultiplier: 1.0, rbhPerUnit: 1.18, isLabor: true,  materialPricePerUnit: 0.00 },
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
    { label: "Kabel YDYp 5×2.5mm²",             knrCode: "KNR 5-08 0101-04", unit: "mb",  qtyMultiplier: 4.5, rbhPerUnit: 0.20, isLabor: false, materialPricePerUnit: 5.80 },
    { label: "Rura stalowa giętka EMT 20mm",     knrCode: "KNR 5-08 0502-02", unit: "mb",  qtyMultiplier: 4.5, rbhPerUnit: 0.10, isLabor: false, materialPricePerUnit: 2.20 },
    { label: "Mocowanie rur stalowych",          knrCode: "KNR 5-08 0503-02", unit: "mb",  qtyMultiplier: 4.5, rbhPerUnit: 0.06, isLabor: true,  materialPricePerUnit: 0.00 },
    { label: "Puszka natynkowa IP54",            knrCode: "KNR 5-08 0301-05", unit: "szt", qtyMultiplier: 1.0, rbhPerUnit: 0.25, isLabor: false, materialPricePerUnit: 8.50 },
    { label: "Gniazdo 3-faz CEE 32A natynkowe", knrCode: "KNR 5-08 0403-03", unit: "szt", qtyMultiplier: 1.0, rbhPerUnit: 1.45, isLabor: true,  materialPricePerUnit: 0.00 },
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
    { label: "Montaż urządzenia p/t", knrCode: "KNR 5-08 0401-03", unit: "szt", qtyMultiplier: 1.0, rbhPerUnit: 0.17, isLabor: true, materialPricePerUnit: 0.00 },
  ],
};

const BIALY_MONTAZ_COMMERCIAL: AssemblyTemplate = {
  id: "BIALY_MONTAZ_COMMERCIAL_302",
  name: "Biały montaż — Biuro",
  triggerKey: "BIALY_MONTAZ",
  sector: "COMMERCIAL",
  description: "Tylko czysta robocizna montażu urządzenia w zabudowie biurowej",
  items: [
    { label: "Montaż urządzenia (biuro/G-K)", knrCode: "KNR 5-08 0401-03", unit: "szt", qtyMultiplier: 1.0, rbhPerUnit: 0.17, isLabor: true, materialPricePerUnit: 0.00 },
  ],
};

const BIALY_MONTAZ_INDUSTRIAL: AssemblyTemplate = {
  id: "BIALY_MONTAZ_INDUSTRIAL_303",
  name: "Biały montaż — Hala",
  triggerKey: "BIALY_MONTAZ",
  sector: "INDUSTRIAL",
  description: "Tylko czysta robocizna montażu urządzenia natynkowego IP44+",
  items: [
    { label: "Montaż urządzenia natynk. IP44", knrCode: "KNR 5-08 0401-06", unit: "szt", qtyMultiplier: 1.0, rbhPerUnit: 0.17, isLabor: true, materialPricePerUnit: 0.00 },
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
    { label: "Bruzdowanie ściany (cegła/beton)", knrCode: "KNR 4-01 0101-02", unit: "mb",  qtyMultiplier: 1.5, rbhPerUnit: 0.10, isLabor: true,  materialPricePerUnit: 0.00 },
    { label: "Kabel YDYp 3×1.5mm²",              knrCode: "KNR 5-08 0101-01", unit: "mb",  qtyMultiplier: 3.5, rbhPerUnit: 0.13, isLabor: false, materialPricePerUnit: 2.20 },
    { label: "Układanie kabla p/t",               knrCode: "KNR 5-08 0201-01", unit: "mb",  qtyMultiplier: 3.5, rbhPerUnit: 0.08, isLabor: true,  materialPricePerUnit: 0.00 },
  ],
};

const WYPUST_COMMERCIAL: AssemblyTemplate = {
  id: "WYPUST_COMMERCIAL_402",
  name: "Wypust kablowy — Biuro",
  triggerKey: "WYPUST",
  sector: "COMMERCIAL",
  description: "Kabel YDYp 3×1.5mm² w korytku (bez montażu urządzenia końcowego)",
  items: [
    { label: "Kabel YDYp 3×1.5mm²",      knrCode: "KNR 5-08 0101-01", unit: "mb", qtyMultiplier: 3.5, rbhPerUnit: 0.13, isLabor: false, materialPricePerUnit: 2.20 },
    { label: "Układanie kabla w korytku", knrCode: "KNR 5-08 0202-01", unit: "mb", qtyMultiplier: 3.5, rbhPerUnit: 0.08, isLabor: true,  materialPricePerUnit: 0.00 },
  ],
};

const WYPUST_INDUSTRIAL: AssemblyTemplate = {
  id: "WYPUST_INDUSTRIAL_403",
  name: "Wypust kablowy — Hala",
  triggerKey: "WYPUST",
  sector: "INDUSTRIAL",
  description: "Kabel YDYp 3×1.5mm² w rurze PVC karbowanej (bez urządzenia końcowego)",
  items: [
    { label: "Kabel YDYp 3×1.5mm²",      knrCode: "KNR 5-08 0101-01", unit: "mb", qtyMultiplier: 3.5, rbhPerUnit: 0.13, isLabor: false, materialPricePerUnit: 2.20 },
    { label: "Rura karbowana PVC M20",    knrCode: "KNR 5-08 0501-01", unit: "mb", qtyMultiplier: 3.5, rbhPerUnit: 0.07, isLabor: false, materialPricePerUnit: 0.85 },
    { label: "Układanie rur + mocowania", knrCode: "KNR 5-08 0503-01", unit: "mb", qtyMultiplier: 3.5, rbhPerUnit: 0.05, isLabor: true,  materialPricePerUnit: 0.00 },
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
    { label: "Bruzdowanie ściany (cegła/beton)", knrCode: "KNR 4-01 0101-02", unit: "mb", qtyMultiplier: 1.0, rbhPerUnit: 0.10, isLabor: true, materialPricePerUnit: 0.00 },
    { label: "Układanie kabla p/t",               knrCode: "KNR 5-08 0201-01", unit: "mb", qtyMultiplier: 1.0, rbhPerUnit: 0.08, isLabor: true, materialPricePerUnit: 0.00 },
  ],
};

const TRASY_COMMERCIAL: AssemblyTemplate = {
  id: "TRASY_COMMERCIAL_502",
  name: "Trasa kablowa — Biuro (korytko)",
  triggerKey: "TRASY",
  sector: "COMMERCIAL",
  description: "Montaż korytka kablowego PVC 60×60 + układanie kabli (per mb)",
  items: [
    { label: "Korytko kablowe PVC 60×60", knrCode: "KNR 5-08 0601-02", unit: "mb", qtyMultiplier: 1.0, rbhPerUnit: 0.12, isLabor: false, materialPricePerUnit: 12.50 },
    { label: "Montaż korytka",            knrCode: "KNR 5-08 0601-01", unit: "mb", qtyMultiplier: 1.0, rbhPerUnit: 0.12, isLabor: true,  materialPricePerUnit: 0.00 },
    { label: "Układanie kabla w korytku", knrCode: "KNR 5-08 0202-01", unit: "mb", qtyMultiplier: 1.0, rbhPerUnit: 0.08, isLabor: true,  materialPricePerUnit: 0.00 },
  ],
};

const TRASY_INDUSTRIAL: AssemblyTemplate = {
  id: "TRASY_INDUSTRIAL_503",
  name: "Trasa kablowa — Hala (drabinka stalowa)",
  triggerKey: "TRASY",
  sector: "INDUSTRIAL",
  description: "Drabinka kablowa stalowa 100mm + prowadzenie kabli (per mb)",
  items: [
    { label: "Drabinka kablowa stalowa 100mm", knrCode: "KNR 5-08 0602-02", unit: "mb", qtyMultiplier: 1.0, rbhPerUnit: 0.18, isLabor: false, materialPricePerUnit: 22.00 },
    { label: "Montaż drabinki kablowej",       knrCode: "KNR 5-08 0602-01", unit: "mb", qtyMultiplier: 1.0, rbhPerUnit: 0.18, isLabor: true,  materialPricePerUnit: 0.00 },
    { label: "Prowadzenie/układanie kabla",    knrCode: "KNR 5-08 0203-01", unit: "mb", qtyMultiplier: 1.0, rbhPerUnit: 0.07, isLabor: true,  materialPricePerUnit: 0.00 },
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
 */
export function expandToAssembly(
  itemName: string,
  parentQty: number,
  sector: ProjectSector,
  laborRate: number,
  knrMultiplier: number = 1.4,
): SmartExpansionOutcome {
  const ctx = detectSmartContext(itemName);

  if (ctx.category === "NONE" || ctx.category === "ROZDZIELNICA") {
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

  // Compute expanded items
  const expandedItems: ExpandedAssemblyItem[] = template.items.map((def) => {
    const quantity = def.qtyMultiplier * parentQty;
    const rbhTotal = def.rbhPerUnit * quantity * knrMultiplier;
    const materialTotal = def.isLabor ? 0 : def.materialPricePerUnit * quantity;
    return {
      label: def.label,
      knrCode: def.knrCode,
      unit: def.unit,
      quantity,
      rbhPerUnit: def.rbhPerUnit,
      rbhTotal,
      materialPricePerUnit: def.materialPricePerUnit,
      materialTotal,
      isLabor: def.isLabor,
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
      `(${rbhPerPoint.toFixed(2)} rbh/${triggerKey === "TRASY" ? "mb" : "pkt"}).`,
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
