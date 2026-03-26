// ─── Unit Guard 2.1 — Single source of truth ─────────────────────────────────
// Priority algorithm:
//   Step 0 (Technical Spec Shield): z=Xm / h=Xm patterns = device spec, NOT cable length
//   Step 1 (Exclusion): HARD_OBJECT_KW → NEVER change unit to mb
//   Step 2 (Clear Hit): CABLE_CLEAR_KW  → force mb if unit was kpl/szt/empty
//   Step 3 (Ambiguous): CABLE_AMBIGUOUS_KW + no hard-object context → force mb
//   Step 4 (Device KW): DEVICE_KW → NEVER change unit to mb even if cable-like name

/**
 * Technical parameter patterns in item names:
 * "z=20m", "h=3m", "l=5m", "d=20mm" indicate device technical specs (cable length of device, height, diameter).
 * NEVER treat these as "this item is measured in meters".
 */
export const TECH_PARAM_PATTERN = /\b[zhldr]=\d+(\.\d+)?\s*m(?:m)?\b/i;

/**
 * Device-type keywords: items with these names are always counted in pieces (szt/kpl),
 * even if the name contains a length spec like "z=20m".
 */
export const DEVICE_KW = [
  "detektor", "czujka", "sygnalizator", "modul", "moduł",
  "oprawa", "lampa", "swietlowka", "świetlówka", "luminarz",
  "klawisz", "przycisk", "sterownik", "kontroler",
  "zawor", "zawór", "silownik", "siłownik", "glowica", "głowica",
  "czujnik", "sensor", "nadajnik", "odbiornik",
  "terminal", "blok", "zlaczka", "złączka",
  "lacznik", "łącznik",
  // Osprzęt elektryczny — installation hardware, always counted in szt
  "osprzet", "osprzęt",
] as const;

export const HARD_OBJECT_KW = [
  "szafa", "rack", "switch", "router", "firewall", "ups", "zasilacz",
  "akumulator", "bateria", "gniazdo", "obudowa", "puszka", "rozdzielnica",
  "tablica", "panel krosowy", "patchpanel", "patch panel",
  "kamera", "rejestrator", "nvr", "dvr", "monitor", "ekran",
  "centrala", "czujka", "sygnalizator", "wylacznik", "bezpiecznik",
  "mcb", "rcd", "rcbo", "spd", "transformator",
] as const;

/**
 * Action-verb items that are ALWAYS per-piece (szt).
 * "Podlaczenie kuchenki" = connecting a device (not laying cable).
 * "Uruchomienie systemu" = commissioning (not cable).
 * Stem-based: covers all inflected forms.
 */
export const ACTION_VERB_SZT_KW = [
  "podlaczen", "pod\u0142aczen",   // Pod\u0142\u0105czenie
  "uruchomien",                  // Uruchomienie
] as const;

/**
 * Service / documentation items — should always be counted in kpl, never mb.
 * These are intangible deliverables, not physical linear materials.
 */
export const FORCE_KPL_KW = [
  "dokumentacj", "projekt techniczny", "protokol", "protokół",
  "inwentaryzacja", "uzgodnienia", "dopuszczenie", "opracowanie",
  "nadzor", "nadzór", "kierownik budowy", "audyt", "termowizja",
  "szkolenie", "instruktaz", "instruktaż",
] as const;

export const CABLE_CLEAR_KW = [
  "przewód", "przewod", "kabel", "cable", "wire", "skrętka", "skretka",
  "ydyp", "yky", "yksy", "owy", "h05", "h07", "linka",
  "światłowód", "swiatłowod",
  "cat.6", "cat6", "kat.6", "kat6", "cat.7", "cat7", "kat.7", "cat7",
  "hdmi", "3x1.5", "3x2.5", "5x1.5", "5x2.5", "4x1.5", "4x2.5",
] as const;

export const CABLE_AMBIGUOUS_KW = [
  "utp", "ftp", "sftp", "stp", "ydy",
] as const;

// ─── isHardObject ──────────────────────────────────────────────────────────────
export function isHardObject(name: string): boolean {
  const n = name.toLowerCase();
  return HARD_OBJECT_KW.some((k) => n.includes(k)) || DEVICE_KW.some((k) => n.includes(k));
}

// ─── isServiceKplItem ──────────────────────────────────────────────────────────
// Returns true for intangible service/documentation items that should always be kpl.
export function isServiceKplItem(name: string): boolean {
  const n = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\u0142/g, "l");
  return FORCE_KPL_KW.some((k) => {
    const kn = k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\u0142/g, "l");
    return n.includes(kn);
  });
}

// ─── isActionVerbSzt ─────────────────────────────────────────────────────────────────
export function isActionVerbSzt(name: string): boolean {
  const n = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\u0142/g, "l");
  return ACTION_VERB_SZT_KW.some((k) => n.includes(k));
}

// ─── hasTechParam ──────────────────────────────────────────────────────────────
// Returns true if the name contains a technical parameter like z=20m, h=3m.
// These are device specs, NOT units of measurement.
export function hasTechParam(name: string): boolean {
  return TECH_PARAM_PATTERN.test(name);
}

// ─── isCableItem ───────────────────────────────────────────────────────────────
// Returns true only for genuine cable/wire items (respects exclusion list)
export function isCableItem(name: string): boolean {
  if (isHardObject(name)) return false;
  if (hasTechParam(name)) return false;         // Step 0: z=20m is a device spec
  const n = name.toLowerCase();
  if (CABLE_CLEAR_KW.some((k) => n.includes(k))) return true;
  return CABLE_AMBIGUOUS_KW.some((k) => n.includes(k));
}

// ─── guardUnit ─────────────────────────────────────────────────────────────────
// Given item name + current unit, returns the correct unit.
// Does NOT touch DB — purely for in-memory / pre-AI use.
//
// Priority algorithm (v2.2):
//   Step 0  (Tech Spec Shield): z=Xm / h=Xm patterns = device spec, not cable length
//   Step -1a (Service → kpl):   service/documentation items always kpl regardless of unit
//   Step -1b (Device → szt):    hard-object/device items with unit=mb → correct to szt
//   Step 1  (Exclusion):        HARD_OBJECT_KW/DEVICE_KW → never change to mb
//   Step 2  (Clear Hit):        CABLE_CLEAR_KW → force mb if unit was kpl/szt/empty
//   Step 3  (Ambiguous):        CABLE_AMBIGUOUS_KW + no hard-object context → force mb
export function guardUnit(name: string, unit: string): string {
  if (hasTechParam(name)) return unit;          // Step 0: device spec pattern, never touch

  const u = unit.toLowerCase();

  // Step -1a: Service/documentation items → always kpl (reverse guard)
  // Catches items imported with wrong unit (e.g. "Dokumentacja" as "mb")
  if (isServiceKplItem(name)) return "kpl";

  // Step -1b: Action-verb items → always szt regardless of imported unit
  // "Podlaczenie kuchenki indukcyjnej" imported as "mb" → fix to szt
  if (isActionVerbSzt(name)) return "szt";

  // Step -1c: Device/hard-object items → if unit was wrongly set to mb, fix to szt
  // Catches items imported with wrong unit (e.g. "\u0141\u0105cznik o\u015bwietleniowy" as "mb")
  if ((u === "mb" || u === "m") && isHardObject(name)) return "szt";

  if (isHardObject(name)) return unit;          // Step 1: exclusion wins (keep szt/kpl)
  const shouldConvert = u === "kpl" || u === "szt" || u === "";
  if (!shouldConvert) return unit;              // already mb or other — keep
  if (isCableItem(name)) return "mb";           // Steps 2 & 3
  return unit;
}

// ─── verifyAiUnit ──────────────────────────────────────────────────────────────
// Post-processing check: if source file had szt/kpl but AI returned mb,
// and the item name indicates a device (not a cable), revert to source unit.
export function verifyAiUnit(name: string, sourceUnit: string, aiUnit: string): string {
  const src = sourceUnit.toLowerCase().trim();
  const ai  = aiUnit.toLowerCase().trim();
  // Only intervene when source=szt/kpl and AI claims mb
  if ((src === "szt" || src === "kpl") && (ai === "mb" || ai === "m")) {
    // If it's a genuine cable item, trust AI
    if (isCableItem(name)) return ai;
    // Otherwise source unit wins
    return sourceUnit;
  }
  return aiUnit;
}
