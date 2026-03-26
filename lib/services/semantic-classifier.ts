/**
 * lib/services/semantic-classifier.ts
 * ─────────────────────────────────────────────────────────────────
 * PURE functions: NO server-side imports, NO Supabase, NO Next.js.
 * Safe to import in vitest / browser context.
 *
 * Exports:
 *   classifyIntent(name)         → SemanticProfile  (The Brain)
 *   applySALFloor(input)         → SALResult        (The Muscle — pure version)
 *   salMultiplier(name)          → number
 *   getHeightModifier(desc, ctx) → number
 *   getCeilingModifier(desc, ctx)→ number
 *   isZelbet(text)               → boolean
 *   normalizePlName(s)           → string
 *   + all exported constants
 */

// ─────────────────────────────────────────────────────────────────
// Engine calibration constants (exported for tests)
// ─────────────────────────────────────────────────────────────────

/**
 * @deprecated Use getModernizationFactor(intent) from M-Matrix v1.4 instead.
 * Kept for backward compatibility with any external code still referencing it.
 * Represents the old global factor (0.75) — now replaced by per-intent values.
 */
export const MODERN_TOOLING_ADJUSTMENT = 0.75;

/** Standard connection: socket/switch/lamp. 0.50 rbh/szt */
export const CONNECTION_MIN_NORM = 0.50;

/**
 * Heavy connection: induction hob, 3-phase motor, HVAC, pump, boiler.
 * M-Matrix v1.4: 1.30 rbh/szt × 1.0 (Expert Manual) × 120 PLN/h = 156 PLN
 * (was: ×0.75 = 117 PLN with old global factor)
 */
export const HEAVY_CONNECTION_MIN_NORM = 1.30;

// ─────────────────────────────────────────────────────────────────
// SecurityAuditLayer floor constants
// ─────────────────────────────────────────────────────────────────

/** Hardcoded PLN floor for heavy connection (pompa/silnik/indukcja/kociol). */
export const SAL_HEAVY_CONN_FLOOR_PLN   = 140.40;
/** Hardcoded PLN floor for demolition/removal work (demontaż/utylizacja/rozebranie). */
export const SAL_DEMOLITION_FLOOR_PLN   =  20.00;
/** Hardcoded PLN floor for PV/OZE installation (panel/falownik/inwerter). */
export const SAL_PV_FLOOR_PLN           =  80.00;
/** Hardcoded PLN floor for industrial install (szynoprzewód/silniki/drabinka kablowa). */
export const SAL_INDUSTRIAL_FLOOR_PLN   = 100.00;
/** Hardcoded PLN floor for fire-safety lines (SSP/PPOż/E30/E90). */
export const SAL_FIRE_SAFETY_FLOOR_PLN  =  60.00;
/** Hardcoded PLN floor for commercial install (floorbox/DALI/track lighting). */
export const SAL_COMMERCIAL_FLOOR_PLN   =  45.00;
/** Hardcoded PLN floor for standard connection (socket, light switch, lamp). */
export const SAL_STD_CONN_FLOOR_PLN     =  45.00;
/** Hardcoded PLN floor for groove-cutting in beton/żelbet/monolit. */
export const SAL_HARD_SURFACE_FLOOR_PLN =  40.50;
/** Hardcoded PLN floor for drilling (wiercenie) in beton/żelbet/monolit/silka. */
export const SAL_DRILLING_FLOOR_PLN     =  35.00;
/**
 * Hardcoded PLN/mb floor for groove-cutting (bruzd/kucie) specifically in
 * żelbet / zbrojony / monolit. Diamond-blade tools, reinforcement steel present.
 * This floor CANNOT be bypassed even when AI Context supplies the hard-surface signal.
 * Architecture Mandate v10.1: min 150 PLN/mb for groove in reinforced concrete.
 */
export const SAL_GROOVE_ZELBET_FLOOR_PLN = 150.00;

// ─────────────────────────────────────────────────────────────────
// Regex constants (exported for tests)
// ─────────────────────────────────────────────────────────────────

/** Matches groove-cutting / chasing / demolition work items. */
export const GROOVE_FLOOR_RE = /bruzd|wykuci|kucie/i;

/** Matches drilling / boring items (wiercenie). */
export const DRILL_FLOOR_RE = /wierci|wiercen/i;


/** ASCII action verb stems — apply to normalizePlName(item.name) */
export const SAL_ACTION_STEMS_RE = /^(podlacz|uruchom|wymian|wymien|montaz|monta[zż])/;

/** Connection regex — ASCII only, apply to normalizePlName() output */
export const CONNECTION_RE = /^podlacz|^uruchom/;

/**
 * Heavy appliance stems. Uses STEMS (not full words) to match Polish declension.
 * "pompy" (genitive) does NOT contain "pompa" — stem "pomp" matches both.
 */
export const HEAVY_APPLIANCE_RE = /indukcj|kuchen|kuchark|piekarni|silni|motor|pomp|klimatyz|agregat|wentylat/i;

/** Ceiling / overhead work detection */
export const CEILING_RE = /\b(sufit|strop|sufitow|stropow)/i;

/**
 * Demolition / removal / disposal work.
 * M-Factor 0.40 (fast rip-out, no precision) — Architecture Mandate v10.2.
 * Normalized stems: demontaz covers demontaż (diacritics stripped by normalizePlName).
 */
export const DEMOLITION_RE = /\b(demontaz|demonta[zż]|utylizacj|rozebranie|rozbiork|rozebra)/i;

/**
 * Aluminum cable detection: YAKY, AsXSn, Alumini*, " Al " separator.
 * Aluminum cables require ~20% more labor (Al-Cu paste, ferrules, stiffer bending).
 * Architecture Mandate v10.3: Al-Modifier = ×1.20 on M-Factor.
 */
export const ALUMINUM_CABLE_RE = /\b(YAKY|AsXSn|alumini[a-z]*|\bAl\b)/i;

// ─── Ultra-Max 2.0 — Cluster 9–12 Regexes ────────────────────────────────────

/**
 * Cluster 9: Fotowoltaika i OZE.
 * Matches: panel PV, falownik, inwerter, solar, H1Z2Z2, magazyn energii, prosument.
 * Tested against both original name and normalizePlName(name).
 */
export const PV_RE = /\b(panel.*pv|pv\b|fotowoltaik|inwerter|falownik.*pv|falownik.*solar|solar|modul.*pv|h1z2z2|kabel.*dc.*solar|string.*pv|optymalizator.*pv|magazyn.*energii|prosument|konstrukcja.*pv|carport.*solar)\b/i;

/**
 * Cluster 10: Przemysł i Hale — industrial cable management + heavy drives.
 * Matches: szynoprzewód, szyna prądowa, busbar, drabinka kablowa, wieszak prętowy.
 * Normalized stems for Polish declension.
 */
export const INDUSTRIAL_RE = /\b(szynoprzewod|szyna.*pradow|busbar|drabinka.*kablowa|drabinka.*metalow|koryto.*metalow|wieszak.*pretow|hak.*pretow|korytko.*drabinkow|szynoprzewod|szyna.*ciagniona|taca.*kablowa)\b/i;

/**
 * Cluster 11: Systemy Bezpieczeństwa & PPOż.
 * Matches: SSP, PPOż, czujka dymu, ewakuacja, centrala SAP, ROP, MCP, syrena.
 */
export const FIRE_SAFETY_RE = /\b(ssp|ppoz|czujka.*dym|czujka.*poz|ewakuacj|centrala.*sap|rop\b|mcp\b|syrena.*poz|czujka.*termod|system.*ppoz|ppoze|oddymian|sap\b)\b/i;

/**
 * Fire-resistant line detection: E30/E90 cables require every-30cm fixings.
 * Architecture Mandate v10.4: E30/E90 → salMultiplier ×1.50 (high fixing density).
 */
export const PPOŻ_E_LINE_RE = /\b(e30|e90|p30|p90|ognioodporn|linia.*e30|linia.*e90|kabel.*e30|kabel.*e90|bezhalogen.*e90|przewod.*e30|kabel.*nhxh)\b/i;

/**
 * Cluster 12: Biura i Komercja — office/commercial installs.
 * Matches: floorbox, kanał podłogowy, track lighting, DALI, kolumna biurowa.
 */
export const COMMERCIAL_RE = /\b(floorbox|laczek.*podlog|kanal.*podlog|track.*oswietl|szyna.*oswietl|dali.*biuro|kolumna.*biuro|floor.*box|gniazdo.*podlog)\b/i;

/**
 * Metal/Steel surface detection.
 * Architecture Mandate v10.4: isMetal() → salMultiplier ×1.30.
 * Matches: stalowy, metalowy, drabinka stalowa, szyna stalowa, koryto stalowe.
 */
export const METAL_SURFACE_RE = /\bstalow|metalow|stalowa|\bstal\s|drabinka.*stal|szyna.*stal|koryto.*stal|wieszak.*stal|taca.*stal\b/i;

/**
 * Aerial work platform / boom lift detection.
 * Architecture Mandate v10.4: Zwyżka → getHeightModifier() returns 1.40.
 */
export const ZWYŻKA_RE = /\bzwy[żz]k/i;

/**
 * Detects cable/wire LAYING work verbs (normalized ASCII stems).
 * Matches: Układanie, Ułożenie, Prowadzenie (cable routing).
 * Does NOT match "Montaż" (→ P1 STANDARD_ACTION) or bare cable nouns.
 */
export const CABLE_LAYING_RE = /^(uklad|uloz|prowadzeni)/;

/**
 * Detects distribution board / switchboard items.
 * Matches: rozdzielnica, tablica rozdzielcza, szafa rozdzielcza.
 * Used in P1 (with action verb) and P3b (noun-only) to classify as DISTRIBUTION_BOARD.
 */
export const DISTRIBUTION_BOARD_RE = /rozdzielni[acę]|tablica\s+rozdziel|rozdzielcz|szafa\s+rozdziel/i;

/**
 * Noun-to-Verb: detects bare cable brand/type designations without an action verb.
 * Matches: WLZ, YDY(p/ż/o), YKY(żo), YAKY, NYY, LgYżo/LgY, H07V-*, YTDY, YnTKSY.
 * When detected WITHOUT a preceding action verb → auto-assign CABLE_LAYING (medium).
 * Rule: "If it quacks like a cable, it probably needs to be laid."
 */
export const CABLE_BRAND_RE = /\b(WLZ|YDY[pżo]?|YKY[żzo]?|YAKY?|NYY|LgY[żzo]*|H07V[-\w]*|YTDY|YnTKSY)\b/i;

/**
 * Detects "Zestaw" (complex assembly) items by name keywords.
 * Zestawy get the FULL material bill including cables/conduits.
 * Examples: "Punkt oświetleniowy (Zestaw)", "Komplet gniazdowy", "Zestaw RG-15".
 */
export const ZESTAW_RE = /\b(zestaw|komplet|punkt)\b/i;

/**
 * Detects "Atomic Tasks" — single-action device-level work items.
 * Atomic tasks are subject to the MATERIAL_EXCLUSION constraint:
 * cables (CABLE) and conduits (CONDUIT) are automatically excluded.
 *
 * Normalized stems (Polish ł→l, ą→a etc.):
 *   montaz = Montaż, gniazd = Gniazdo/Gniazda, puszk = Puszka/Puszkę,
 *   laczni = Łącznik, wypust = Wypust, opraw = Oprawa, oswietl = Oświetlenie
 */
export const ATOMIC_TASK_RE = /\b(montaz|gniazd|puszk|laczni|wypust|opraw|oswietl|lamp[ae]|swiatl)/i;

/**
 * Returns true if the item name indicates a complex assembly (Zestaw/Komplet/Punkt).
 * Zestawy receive the full material bill — cables, conduits, boxes, all included.
 */
export function isZestaw(name: string): boolean {
  return ZESTAW_RE.test(name);
}

/**
 * Returns true if the item name indicates an Atomic Task.
 * Uses normalized ASCII to handle Polish diacritics (ł→l, ą→a, etc.).
 *
 * Atomic Task rule: suggest only "body" materials (box, device, consumables).
 * NEVER suggest cables or conduits — those are separate line items.
 */
export function isAtomicTask(name: string): boolean {
  return ATOMIC_TASK_RE.test(normalizePlName(name));
}

/** Height pattern: "wysokość 4.5m", "na wysokości 3m" */
const HEIGHT_RE = /(?:wysoko[sś][cć]|na\s+wysoko[sś][cć])\s*[^0-9]{0,15}([0-9]+[.,][0-9]+|[0-9]+)\s*m(?:[^a-z²³]|$)/i;

// ─────────────────────────────────────────────────────────────────
// Pure helper functions
// ─────────────────────────────────────────────────────────────────

/**
 * Normalize Polish item names to ASCII for regex matching.
 * Polish ł (U+0142) does NOT match plain [l] in JS regex.
 */
export function normalizePlName(s: string): string {
  return s
    .replace(/[\u0141\u0142]/g, "l")  // Ł/ł → l
    .replace(/[\u0104\u0105]/g, "a")  // Ą/ą → a
    .replace(/[\u0118\u0119]/g, "e")  // Ę/ę → e
    .replace(/[\u00d3\u00f3]/g, "o")  // Ó/ó → o
    .replace(/[\u015a\u015b]/g, "s")  // Ś/ś → s
    .replace(/[\u0179\u017a\u017b\u017c]/g, "z") // Ź/ź/Ż/ż → z
    .replace(/[\u0106\u0107]/g, "c")  // Ć/ć → c
    .replace(/[\u0143\u0144]/g, "n")  // Ń/ń → n
    .toLowerCase();
}

/**
 * Detects żelbet / zbrojony / monolit surface in item name.
 * Uses includes() for Polish declension coverage (żelbecie, żelbetowy, etc.)
 */
export function isZelbet(text: string): boolean {
  const t = text.toLowerCase();
  return t.includes("żelbe") || t.includes("zelbe") || t.includes("zbrojon") || t.includes("monolit");
}

/** Detects hard surface (żelbet + silka/silce) */
export function isHardSurface(text: string): boolean {
  const t = text.toLowerCase();
  return isZelbet(text) || t.includes("silk") || t.includes("silce");
}

/**
 * Returns ceiling modifier for overhead work.
 * KNR overhead surcharge = ×2.5 (standard per industry norms).
 */
export function getCeilingModifier(description: string, globalContext = ""): number {
  for (const text of [description, globalContext]) {
    if (CEILING_RE.test(text)) return 2.5;
  }
  return 1.0;
}

/**
 * Returns height modifier based on work elevation.
 * Supports explicit "wysokość Xm" patterns AND elevated-work keywords.
 *
 * Tiered modifiers (Architecture Mandate v9.0):
 *   antresola (mezzanine, ~2m elevation) → ×2.0
 *   > 4.0m → ×1.40
 *   > 3.0m → ×1.25
 *   > 2.0m → ×1.15
 */
export function getHeightModifier(description: string, globalContext = ""): number {
  for (const text of [description, globalContext]) {
    // Keyword: antresola (mezzanine) — elevated work at ~2m above floor
    // Architecture Mandate v9.0: "antresola" must trigger height multiplier for STANDARD_ACTION items.
    if (/\bantresol/i.test(text)) return 2.0;
    // Keyword: zwyżka (aerial work platform / boom lift)
    // Architecture Mandate v10.4: Zwyżka always triggers ×1.40 (operator + safety overhead).
    if (ZWYŻKA_RE.test(text)) return 1.40;

    const hit = HEIGHT_RE.exec(text);
    if (hit) {
      const h = parseFloat(hit[1].replace(",", "."));
      if (!isNaN(h)) {
        if (h > 4.0) return 1.40;
        if (h > 3.0) return 1.25;
        if (h > 2.0) return 1.15;
      }
    }
  }
  return 1.0;
}

/**
 * Cumulative surface × ceiling × height multiplier.
 * Applied AFTER base floor per Architecture Mandate v3.0:
 *   Total = max(CalculatedPrice, CategoryFloor) × SurfaceMod × CeilingMod × HeightMod
 * MULTIPLICATIVE, not additive.
 */
export function salMultiplier(name: string): number {
  let m = 1.0;
  if (isZelbet(name)) m *= 2.25;             // żelbet/monolit surface
  if (CEILING_RE.test(name)) m *= 2.50;      // strop/sufit/nad głową
  const ht = getHeightModifier(name, "");
  if (ht > 1.0) m *= ht;                     // wysokość tiered
  if (isMetal(name)) m *= 1.30;              // Metal/steel surface (v10.4)
  if (isFireProtectedLine(name)) m *= 1.50;  // E30/E90 every-30cm fixings (v10.4)
  return m;
}

// ─────────────────────────────────────────────────────────────────
// SEMANTIC INTERPRETER — Types
// ─────────────────────────────────────────────────────────────────

export type SemanticIntent =
  | "HEAVY_CONNECTION"    // pompa/silnik/indukcja/kocioł — 1.30 rbh / 140.40 PLN base
  | "DISTRIBUTION_BOARD"  // rozdzielnica/tablica el. — expert logic, M-Factor 1.0
  | "STANDARD_ACTION"     // gniazdko/włącznik/lampa/montaż osprzętu — 0.40 rbh / 45.00 PLN base
  | "CABLE_LAYING"        // układanie/ułożenie przewodów/kabli — M-Factor 0.65
  | "HARD_CONSTRUCTION"   // bruzda/kucie w betonie/żelbecie — 0.25 rbh/mb / 40.50 PLN base
  | "DRILLING_HARD"       // wiercenie w betonie/silce — 0.35 rbh/szt / 35.00 PLN base
  | "DEMOLITION"          // demontaż/utylizacja/rozebranie — 0.20 rbh / 20.00 PLN base, M-Factor 0.40
  // ── Cluster 9–12: Ultra-Max 2.0 — Industrial & Green Energy ──
  | "PV_INSTALLATION"    // Cluster 9: panele/falownik/inwerter/magazyn energii — 80 PLN base
  | "INDUSTRIAL_INSTALL" // Cluster 10: szynoprzewód/drabinka/silniki przemysłowe — 100 PLN base
  | "FIRE_SAFETY_LINE"   // Cluster 11: SSP/PPOż/czujki/E30/E90 — 60 PLN base, ×1.50 fireMod
  | "COMMERCIAL_INSTALL" // Cluster 12: floorbox/DALI/track lighting/biuro — 45 PLN base
  | "GENERAL";            // no floor constraint

export interface SemanticProfile {
  intent:     SemanticIntent;
  baseFloor:  number;           // hardcoded PLN floor (before cumulative multipliers)
  baseNorm:   number;           // minimum rbh norm
  forcedUnit: "szt" | "mb" | null; // unit enforcement (null = keep original)
  /**
   * high   — explicit action verb detected ("Podłączenie", "Montaż")
   * medium — construction keyword detected ("beton", "żelbet") without action verb
   * low    — heavy appliance noun without action verb ("Pompa ciepła" alone)
   *          → price set to safety floor, isLowConfidence=true flagged in estimate
   */
  confidence: "high" | "medium" | "low";
}

// ─────────────────────────────────────────────────────────────────
// SEMANTIC INTERPRETER — classifyIntent (The Brain)
// ─────────────────────────────────────────────────────────────────

/**
 * Classifies item name into a typed SemanticProfile.
 *
 * Priority order (higher wins):
 *   1. Action verb (podlacz/uruchom/wymian/montaz) → HEAVY or STANDARD  [HIGH confidence]
 *   2. Drilling + hard material → DRILLING_HARD                         [HIGH confidence]
 *   3. Hard material (beton/żelbet/monolit) alone → HARD_CONSTRUCTION   [MEDIUM confidence]
 *   4. Heavy appliance noun without verb → HEAVY_CONNECTION             [LOW confidence]
 *   5. Fallback → GENERAL                                               [no floor]
 *
 * Rule: "Action verb ALWAYS beats noun classification" (Architecture Mandate v3.0)
 * Rule: "Better to overprice than underprice" (safety fallback for heavy appliances)
 */
export function classifyIntent(name: string): SemanticProfile {
  const nn = normalizePlName(name);

  // Priority 1: Action verbs → HIGH confidence (explicit intent)
  // Even if mb/cable-spec present, verb wins ("Hierarchy of Truth").

  // Priority 1.5: Demolition / removal / disposal → DEMOLITION (high confidence).
  // Checked BEFORE other action verbs to prevent "Demontaż rozdzielnicy" → DISTRIBUTION_BOARD.
  if (DEMOLITION_RE.test(nn) || DEMOLITION_RE.test(name)) {
    return { intent: "DEMOLITION", baseFloor: SAL_DEMOLITION_FLOOR_PLN, baseNorm: 0.20, forcedUnit: "szt", confidence: "high" };
  }

  if (SAL_ACTION_STEMS_RE.test(nn)) {
    // Cluster 9–12: domain-specific detection within P1 (wins over generic STANDARD_ACTION)
    if (PV_RE.test(nn) || PV_RE.test(name))
      return { intent: "PV_INSTALLATION",    baseFloor: SAL_PV_FLOOR_PLN,          baseNorm: 0.50, forcedUnit: "szt", confidence: "high" };
    if (FIRE_SAFETY_RE.test(nn) || FIRE_SAFETY_RE.test(name))
      return { intent: "FIRE_SAFETY_LINE",   baseFloor: SAL_FIRE_SAFETY_FLOOR_PLN, baseNorm: 0.45, forcedUnit: "szt", confidence: "high" };
    if (INDUSTRIAL_RE.test(nn) || INDUSTRIAL_RE.test(name))
      return { intent: "INDUSTRIAL_INSTALL", baseFloor: SAL_INDUSTRIAL_FLOOR_PLN,  baseNorm: 1.00, forcedUnit: "szt", confidence: "high" };
    if (COMMERCIAL_RE.test(nn) || COMMERCIAL_RE.test(name))
      return { intent: "COMMERCIAL_INSTALL", baseFloor: SAL_COMMERCIAL_FLOOR_PLN,  baseNorm: 0.40, forcedUnit: "szt", confidence: "high" };
    const isHeavy    = HEAVY_APPLIANCE_RE.test(name) || /kocio[lł]/i.test(name);
    const isDistBoard = DISTRIBUTION_BOARD_RE.test(name);
    if (isHeavy)     return { intent: "HEAVY_CONNECTION",   baseFloor: SAL_HEAVY_CONN_FLOOR_PLN, baseNorm: HEAVY_CONNECTION_MIN_NORM, forcedUnit: "szt", confidence: "high" };
    if (isDistBoard) return { intent: "DISTRIBUTION_BOARD", baseFloor: SAL_STD_CONN_FLOOR_PLN,   baseNorm: CONNECTION_MIN_NORM,       forcedUnit: "szt", confidence: "high" };
    return             { intent: "STANDARD_ACTION",         baseFloor: SAL_STD_CONN_FLOOR_PLN,   baseNorm: CONNECTION_MIN_NORM,       forcedUnit: "szt", confidence: "high" };
  }

  // Priority 2: Drilling + hard material → HIGH confidence
  // Stem /^wierc/ covers: wiercenie (noun), wiercić (inf), wierci (3sg), wiercił (past)
  if (/^wierc/i.test(nn)) {
    const isHard = /\bbeton|żelbet|zelbet|\bmonolit|silk[aąei]|silce/i.test(name);
    if (isHard) return { intent: "DRILLING_HARD", baseFloor: SAL_DRILLING_FLOOR_PLN, baseNorm: 0.35, forcedUnit: "szt", confidence: "high" };
  }

  // Priority 3: Hard surface construction (non-drilling) → MEDIUM confidence
  if (/\bbeton|żelbet|zelbet|\bmonolit/i.test(name)) {
    return { intent: "HARD_CONSTRUCTION", baseFloor: SAL_HARD_SURFACE_FLOOR_PLN, baseNorm: 0.25, forcedUnit: null, confidence: "medium" };
  }

  // Priority 3a: Cable laying verb (układanie/ułożenie/prowadzenie) → CABLE_LAYING
  // NB: "Montaż" is caught by P1 above; this handles dedicated laying verbs only.
  if (CABLE_LAYING_RE.test(nn)) {
    return { intent: "CABLE_LAYING", baseFloor: 0, baseNorm: 0, forcedUnit: null, confidence: "high" };
  }

  // Priority 3b: Distribution board noun without action verb → DISTRIBUTION_BOARD
  // "Montaż rozdzielnicy" is caught by P1; this catches "Rozdzielnica RG-15" alone.
  if (DISTRIBUTION_BOARD_RE.test(name)) {
    return { intent: "DISTRIBUTION_BOARD", baseFloor: SAL_STD_CONN_FLOOR_PLN, baseNorm: CONNECTION_MIN_NORM, forcedUnit: "szt", confidence: "medium" };
  }

  // Priority 3c: PV noun without action verb → PV_INSTALLATION (medium confidence).
  // e.g. "Panel fotowoltaiczny 450Wp", "Falownik SolarEdge 10kW".
  if (PV_RE.test(nn) || PV_RE.test(name)) {
    return { intent: "PV_INSTALLATION", baseFloor: SAL_PV_FLOOR_PLN, baseNorm: 0.50, forcedUnit: "szt", confidence: "medium" };
  }

  // Priority 3d: Fire Safety noun without action verb → FIRE_SAFETY_LINE (medium confidence).
  // e.g. "Czujka dymu optyczna SSP", "ROP przycisk czerwony".
  if (FIRE_SAFETY_RE.test(nn) || FIRE_SAFETY_RE.test(name)) {
    return { intent: "FIRE_SAFETY_LINE", baseFloor: SAL_FIRE_SAFETY_FLOOR_PLN, baseNorm: 0.45, forcedUnit: "szt", confidence: "medium" };
  }

  // Priority 3e: Industrial noun without action verb → INDUSTRIAL_INSTALL (medium confidence).
  // e.g. "Szynoprzewód 400A Siemens", "Drabinka kablowa 500mm".
  if (INDUSTRIAL_RE.test(nn) || INDUSTRIAL_RE.test(name)) {
    return { intent: "INDUSTRIAL_INSTALL", baseFloor: SAL_INDUSTRIAL_FLOOR_PLN, baseNorm: 1.00, forcedUnit: "szt", confidence: "medium" };
  }

  // Priority 4 (Safety fallback): heavy appliance WITHOUT explicit action verb → LOW confidence.
  // e.g. "Pompa ciepła 15kW", "Kuchenka indukcyjna" without "Podłączenie".
  // Rule: ALWAYS default to Heavy Floor — better to flag than to underprice.
  if (HEAVY_APPLIANCE_RE.test(name) || /kocio[lł]/i.test(name)) {
    return { intent: "HEAVY_CONNECTION", baseFloor: SAL_HEAVY_CONN_FLOOR_PLN, baseNorm: HEAVY_CONNECTION_MIN_NORM, forcedUnit: "szt", confidence: "low" };
  }

  // Priority 5 (Noun-to-Verb): bare cable brand without action verb → CABLE_LAYING (medium).
  // e.g. "WLZ 4x35", "YDYp 3x2.5", "Kabel YKY 5x10" — lazy electrician shorthand.
  // Confidence MEDIUM: intent inferred from cable type, not explicit verb.
  if (CABLE_BRAND_RE.test(name)) {
    return { intent: "CABLE_LAYING", baseFloor: 0, baseNorm: 0, forcedUnit: "mb", confidence: "medium" };
  }

  return { intent: "GENERAL", baseFloor: 0, baseNorm: 0, forcedUnit: null, confidence: "high" };
}

// ─────────────────────────────────────────────────────────────────
// M-Matrix — Intent-Based Modernization Factor (v1.4)
// ─────────────────────────────────────────────────────────────────

/**
 * Intent-Based Modernization Matrix.
 * Maps SemanticIntent → tool-acceleration factor replacing the deprecated
 * global MODERN_TOOLING_ADJUSTMENT = 0.75 constant.
 *
 * Formula: Final_Labor = KNR_Base_Norm × M-Factor × Region_Modifier × BaseRate
 */
export const M_MATRIX: Record<SemanticIntent, number> = {
  HARD_CONSTRUCTION:  0.45, // Diamond drill + groove cutter: ×2 speed over 1980s manual
  DRILLING_HARD:      0.45, // Diamond core drill: ×2 speed
  DEMOLITION:         0.40, // Fast rip-out, no precision — fastest M-Factor in system
  CABLE_LAYING:       0.65, // Nail gun, cable reels: 35% faster than manual
  GENERAL:            0.65, // Catch-all: typical modern power-tool acceleration
  // Cluster 9–12 (Ultra-Max 2.0)
  PV_INSTALLATION:    0.75, // Specialized PV tools (torque wrench, DC crimper) + outdoor
  INDUSTRIAL_INSTALL: 0.80, // Heavy industrial: cable trays, motors, precision alignment
  COMMERCIAL_INSTALL: 0.85, // Office precision (laser level, modular connectors)
  STANDARD_ACTION:    0.85, // Laser level, power screwdriver: precision > speed
  DISTRIBUTION_BOARD: 1.0,  // Expert logic: wiring errors cost more than speed saves
  HEAVY_CONNECTION:   1.0,  // Expert manual: no meaningful tool-speed benefit
  FIRE_SAFETY_LINE:   1.0,  // Every-30cm fixings, no tool advantage (×1.50 fireMod on top)
};

/**
 * Returns the M-Factor (modernization coefficient) for a given intent.
 *
 * WLZ Guard: Physical cable weight ≥ 10mm² limits pulling/routing speed.
 * For heavy cables the factor is clamped to max(computed, 0.90) regardless
 * of the laying intent (prevents optimistic 0.65 for WLZ 4x35 lines).
 *
 * Al-Modifier: Aluminum cables apply ×1.20 on top of WLZ/intent factor.
 *
 * @param intent             - SemanticIntent of the work item
 * @param cableSection       - conductor cross-section in mm² (null if not a cable)
 * @param isAluminumCable    - true if cable material is Aluminum (YAKY, AsXSn, Al)
 * @param isIndustrialMetal  - true if item involves steel/metal surface construction
 */
export function getModernizationFactor(
  intent:              SemanticIntent,
  cableSection?:       number | null,
  isAluminumCable?:    boolean,
  isIndustrialMetal?:  boolean
): number {
  let factor = M_MATRIX[intent] ?? 0.65;

  // WLZ guard: heavy cable ≥ 10mm² — physical weight limits speed
  if (cableSection !== null && cableSection !== undefined && cableSection >= 10) {
    factor = Math.max(factor, 0.90);
  }

  // Al-Modifier (Architecture Mandate v10.3):
  // Aluminum cables require Al-Cu paste, special ferrules, and are stiffer to bend.
  // Measured ~20% more labor time vs. copper — applies regardless of section size.
  if (isAluminumCable) {
    factor = factor * 1.20;
  }

  // Industrial Metal Override (Architecture Mandate v10.4):
  // HARD_CONSTRUCTION on steel/metal is MUCH harder than on concrete.
  // Diamond saw vs. angle grinder + metal bits: factor clamped to 0.95 (near-manual speed).
  if (isIndustrialMetal && intent === "HARD_CONSTRUCTION") {
    factor = Math.max(factor, 0.95);
  }

  return factor;
}

/**
 * Human-readable label for the M-Factor, used in calculation logs.
 * Example: "[M-Factor: 0.45 (Machine-assisted)]"
 */
export function getMFactorLabel(factor: number): string {
  if (factor >= 1.0)  return "Expert Manual";
  if (factor >= 0.95) return "Metal/Industrial";
  if (factor >= 0.90) return "Heavy Cable";
  if (factor >= 0.85) return "Precision Tools";
  if (factor >= 0.75) return "Specialized/PV";
  if (factor >= 0.65) return "Power-Tool Accel.";
  if (factor >= 0.40) return "Machine-Assisted";
  return "Rozebranie/Demontaż";
}

/**
 * Returns true if the item name indicates an Aluminum cable type.
 * Aluminum cables require ~20% more labor (Al-Cu paste, ferrules, stiffer bending).
 * Detects: YAKY, AsXSn, "Alumini*", explicit " Al " separator.
 */
export function isAluminum(text: string): boolean {
  return ALUMINUM_CABLE_RE.test(text);
}

/**
 * Returns true if the item is a fire-protected line (E30/E90).
 * Fire-resistant cables require every-30cm metal fixings → ×1.50 labor multiplier.
 * Architecture Mandate v10.4.
 */
export function isFireProtectedLine(text: string): boolean {
  return PPOŻ_E_LINE_RE.test(text) || PPOŻ_E_LINE_RE.test(normalizePlName(text));
}

/**
 * Returns true if the item involves metal/steel surface work.
 * Drilling and fixing into steel requires special tools → salMultiplier ×1.30.
 * Architecture Mandate v10.4.
 */
export function isMetal(text: string): boolean {
  return METAL_SURFACE_RE.test(text) || METAL_SURFACE_RE.test(normalizePlName(text));
}

// ─────────────────────────────────────────────────────────────────
// SAL — Pure floor application (The Muscle — testable version)
// ─────────────────────────────────────────────────────────────────

/** Minimal input for applySALFloor (subset of AiPriceEstimate) */
export interface SALInput {
  name:           string;
  suggestedLabor: number;
  unit?:          string;
  guardedUnit?:   string;
  laborNorm?:     number;
}

/** Result from applySALFloor — pure, no AiPriceEstimate dependency */
export interface SALResult {
  suggestedLabor:  number;
  guardedUnit:     string | undefined;
  laborNorm:       number;
  expertOverride:  boolean;
  isLowConfidence: boolean;
  calculationLog:  string;
  intent:          SemanticIntent;
  multiplier:      number;
  floor:           number;
}

/**
 * Pure SAL floor application — The Muscle.
 * Safe to call from tests (no server deps).
 * pricing.ts securityAuditLayer delegates to this.
 *
 * Formula: suggestedLabor = max(prevPrice, baseFloor × salMultiplier)
 */
export function applySALFloor(input: SALInput): SALResult {
  const { name, suggestedLabor: prevPrice } = input;
  const profile = classifyIntent(name);

  const surfaceMod = isZelbet(name) ? 2.25 : 1.0;
  const ceilingMod = CEILING_RE.test(name) ? 2.50 : 1.0;
  const heightMod  = getHeightModifier(name, "");
  const metalMod   = isMetal(name) ? 1.30 : 1.0;
  const fireMod    = isFireProtectedLine(name) ? 1.50 : 1.0;
  const multiplier = surfaceMod * ceilingMod * (heightMod > 1.0 ? heightMod : 1.0) * metalMod * fireMod;
  const floor      = Math.round(profile.baseFloor * multiplier * 100) / 100;

  const currentUnit = (input.guardedUnit ?? input.unit ?? "").toLowerCase().trim();
  const forcedUnit  = profile.forcedUnit ?? currentUnit;

  const isLowConf       = profile.confidence === "low";
  const objectHint      = (HEAVY_APPLIANCE_RE.test(name) || /kocio[lł]/i.test(name)) ? "Ciężkie urządz." : "Osprzęt";
  const surfTag         = surfaceMod !== 1.0 ? `Pow.×${surfaceMod}` : "Pow.×1.0";
  const ceilTag         = ceilingMod !== 1.0 ? `Suf.×${ceilingMod}` : "Suf.×1.0";
  const htTag           = heightMod > 1.0 ? `Wys.×${heightMod.toFixed(2)}` : "Wys.×1.0";
  const metalTag        = metalMod !== 1.0 ? ` Metal×${metalMod}` : "";
  const fireTag         = fireMod !== 1.0 ? ` E30/E90×${fireMod}` : "";
  const confTag         = isLowConf ? " [Pewność: NISKA]" : "";
  const finalPrice      = profile.intent !== "GENERAL" && prevPrice > 0 ? Math.max(prevPrice, floor) : (profile.intent !== "GENERAL" ? floor : prevPrice);

  const calculationLog =
    `Wykryto: [${profile.intent}] (${objectHint})${confTag}. ` +
    `Norma bazowa: ${profile.baseNorm.toFixed(2)} rbh. ` +
    `Floor: ${profile.baseFloor.toFixed(2)} PLN. ` +
    `Mnożniki: ${surfTag} × ${ceilTag} × ${htTag}${metalTag}${fireTag} → Końcowa: ${finalPrice.toFixed(2)} PLN`;

  return {
    suggestedLabor:  finalPrice,
    guardedUnit:     (profile.forcedUnit ?? currentUnit) || undefined,
    laborNorm:       Math.max(input.laborNorm ?? 0, profile.baseNorm),
    expertOverride:  profile.intent !== "GENERAL" && prevPrice > 0 && prevPrice < floor,
    isLowConfidence: isLowConf,
    calculationLog,
    intent:          profile.intent,
    multiplier,
    floor,
  };
}
