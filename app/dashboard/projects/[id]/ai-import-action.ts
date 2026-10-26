"use server";

import { logger } from "@/lib/logger";
import { tryAuth } from "@/lib/auth";
import { checkAndIncrementAiUsage } from "@/lib/ai-usage";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { buildDynamicSystemPrompt, buildLightSystemPrompt, injectKbContext, GEMINI_RAG_MODEL } from "@/lib/ai-master-brain";
import { verifyAiUnit } from "@/lib/unit-guard";
import { scaleLaborNorm } from "@/lib/labor-time";
import { loadKbContextOptional } from "@/lib/kb-storage";
import {
  resolveImportedRows,
  type MatchResult,
  type EngineSettings,
  DEFAULT_ENGINE_SETTINGS,
} from "@/lib/services/matching-engine";
import { findCanonicalL0 } from "@/lib/services/canonical-knr-l0";
import { laborFromHours } from "@/lib/catalog/catalog-work";

interface ParsedRow {
  [key: string]: string;
}

// ─── Column detection helper ──────────────────────────────────────────────────

/**
 * Guesses which column header is most likely to contain item names/descriptions.
 * Checked in priority order against known Polish/English naming patterns.
 */
function guessNameColumn(headers: string[]): string {
  const NAME_KEYWORDS = [
    "nazwa", "opis", "pozycja", "poz", "description", "name", "item", "material",
    "robota", "element", "towar", "usluga", "wyszczegolnienie",
  ];
  const normalized = (h: string) => h.toLowerCase().replace(/[^a-z]/g, "");

  for (const kw of NAME_KEYWORDS) {
    const found = headers.find((h) => normalized(h).includes(kw));
    if (found) return found;
  }
  // Fallback: first header that is not an obvious number/LP column
  const LP_PATTERNS = /^(lp|l\.p|nr|no|#|id|ilość|jm|jedn|qty|cena|price|kwota|vat)/i;
  return headers.find((h) => !LP_PATTERNS.test(h.trim())) ?? headers[0];
}

// ─── Pre-resolution context builder ──────────────────────────────────────────

// ─── Engine settings context builder ─────────────────────────────────────────

/**
 * Builds the prompt block injected into the LLM from KnrEngineCalibration +
 * KnrInvestmentContext UI settings.
 */
function buildEngineContextBlock(settings: EngineSettings): string {
  const lines: string[] = [];

  if (settings.investmentContext && settings.investmentContext.trim().length > 3) {
    lines.push(
      `KONTEKST INWESTYCJI (podany przez elektryka — NAJWYŻSZY PRIORYTET przy doborze norm):`,
      `"${settings.investmentContext.trim()}"`,
      `Interpretuj każdą pozycję z uwzględnieniem powyższego kontekstu. Np.:`,
      `  - Jeśli to SAP/p.poż. → preferuj kable HDGs/NHXMH, normy KNR 5-09`,
      `  - Jeśli to instalacja KNX/inteligentny dom → preferuj kable YTKSY/BUS, normy KNR 5-08`,
      `  - Jeśli to biurowiec/serwerownia → preferuj kable UTP kat.6a, normy KNR 5-06`,
      `  - Jeśli to instalacja PV → preferuj kabel solarny 4mm², normy KNR AT-26`,
    );
  }

  const MONTAGE_NAMES: Record<string, string> = {
    pod_tynkiem: "pod tynkiem",
    w_tynku:     "w tynku (bruzda)",
    w_rurach:    "w rurach / peszel",
    na_wierzchu: "na wierzchu (natynkowo)",
  };
  const montageName = MONTAGE_NAMES[settings.defaultMontage] ?? "pod tynkiem";
  if (settings.defaultMontage !== "pod_tynkiem") {
    lines.push(
      `DOMYŚLNY SPOSÓB MONTAŻU (użyj jeśli przedmiar nie precyzuje): ${montageName}`,
      `Jeśli pozycja nie określa sposobu układania kabla/rury → zakładaj montaż "${montageName}".`,
    );
  }

  if (lines.length === 0) return "";
  return `\n\nES-ENGINE CALIBRATION:\n${lines.join("\n")}`;
}

/** Builds a prompt snippet with pre-resolved KNR codes from es_dictionary */
function buildPreResolutionContext(results: Array<{ name: string; _match: MatchResult; knr_code: string | null; labor_norm_rbh: number | null }>): string {
  const resolved = results.filter((r) => r._match.confidence_level !== "L3" && r.knr_code);
  if (resolved.length === 0) return "";

  const lines = resolved.map((r) => {
    const tier = r._match.confidence_level === "L1" ? "✅ Pewny" : "⚠️ Przybliżony";
    return `  • "${r.name}" → ${r.knr_code}  (rbh=${r.labor_norm_rbh ?? "?"}  ${tier})`;
  });

  return `\n\nPRE-ANALIZA ES-DICTIONARY (wygenerowane algorytmicznie — ZACHOWAJ te kody KNR):\n${lines.join("\n")}\nDla pozycji oznaczonych ✅ użyj dokładnie tych kodów KNR i norm rbh.`;
}

function parseMoney(raw: string | undefined): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/\s/g, "").replace(",", ".").replace(/[^\d.]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function materialHeader(headers: string[]): string | undefined {
  const n = (h: string) => h.toLowerCase();
  const explicit = headers.find((h) => /materia/.test(n(h)));
  if (explicit) return explicit;
  return headers.find((h) => /cena|price/.test(n(h)) && !/roboc|suma|warto|brutto/.test(n(h)));
}

function stampWorkPrice(
  item: AIProjectItem,
  hourlyRate: number,
  fileMaterial: number | null,
): AIProjectItem {
  const l0 = findCanonicalL0(item.name, item.unit);
  const dictHours = item.knr_source === "system_knr" && item.labor_norm ? item.labor_norm : 0;
  const hours = l0?.laborNorm ?? dictHours;
  const code = l0?.knrCode ?? (item.knr_source === "system_knr" ? item.knr_code ?? null : null);
  return {
    ...item,
    material_price: fileMaterial != null && fileMaterial > 0 ? fileMaterial : 0,
    labor_price: laborFromHours(hours, hourlyRate),
    labor_norm: hours > 0 ? hours : null,
    knr_code: code,
    knr_source: code ? "system_knr" : null,
  };
}

interface AIProjectItem {
  name: string;
  unit: string;
  quantity: number;
  material_price: number;
  labor_price: number;
  knr_code?: string | null;
  knr_source?: string | null;
  labor_norm?: number | null;
}

/**
 * AI-powered analysis of spreadsheet data for project import.
 * Understands any file structure and converts to project items.
 */
export async function aiAnalyzeProjectImport(
  rawRows: ParsedRow[],
  columnHeaders: string[],
  fileName: string,
  engineSettings?: EngineSettings,
): Promise<{ success: boolean; items?: AIProjectItem[]; error?: string }> {
  const settings: EngineSettings = engineSettings ?? DEFAULT_ENGINE_SETTINGS;
  try {
    const { user, supabase } = await tryAuth();
    if (!user || !supabase) return { success: false, error: "Musisz być zalogowany" };

    // AI usage limit (DEMO=5, PRO=200 via centralized quota system)
    const aiCheck = await checkAndIncrementAiUsage(user.id, "aiImportProject");
    if (!aiCheck.allowed) return { success: false, error: aiCheck.error || "Limit AI wyczerpany" };

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return { success: false, error: "Usługa AI nie jest skonfigurowana" };
    }

    const sampleRows = rawRows.slice(0, 300);
    const dataPreview = `KOLUMNY: ${columnHeaders.join(" | ")}\n\nDANE (${sampleRows.length} wierszy):\n` +
      sampleRows.map((row, i) => `${i + 1}. ${columnHeaders.map(h => row[h] || "").join(" | ")}`).join("\n");

    // ── Extract source units from file for post-processing verification ────────
    // Detects the unit column and stores original units by row index.
    // Used after AI to revert incorrect mb inference for device items.
    const UNIT_HEADER_KW = ["jedn", "unit", "jm", "j.m", "jednostk"];
    const unitColHeader = columnHeaders.find(h => UNIT_HEADER_KW.some(k => h.toLowerCase().includes(k)));
    const sourceUnits: string[] = unitColHeader
      ? sampleRows.map(row => (row[unitColHeader] ?? "").trim().toLowerCase())
      : [];

    // Build system prompt via Master Brain + RAG
    const kbContext = await loadKbContextOptional("import przedmiar knr materialy robocizna");

    // ── ES-Engine pre-resolution (Phase 1-3, before LLM) ─────────────────────
    // Detects item name column, runs 4-phase matching, injects results into prompt.
    // Items with L1 confidence will override LLM output after generation.
    let preResolved: Awaited<ReturnType<typeof resolveImportedRows>> = [];
    let preResolutionContext = "";
    try {
      const nameColumn = guessNameColumn(columnHeaders);
      const nameInputs = sampleRows
        .map((row) => ({ name: row[nameColumn] ?? "" }))
        .filter((r) => r.name.trim().length > 1);

      if (nameInputs.length > 0) {
        preResolved = await resolveImportedRows(nameInputs, supabase, settings);
        preResolutionContext = buildPreResolutionContext(preResolved);
      }
    } catch {
      // Non-critical — continue without pre-resolution
    }

    const basePrompt = await buildDynamicSystemPrompt("importer");
    const systemPrompt = injectKbContext(basePrompt, kbContext);
    const engineContextBlock = buildEngineContextBlock(settings);

    const importContext = `<import_context>

Plik: ${fileName}
Kolumny: ${columnHeaders.join(" | ")}

ZASADA #0 — ALLOKACJA (ABSOLUTNY PRIORYTET, ważniejsza niż wszystkie inne):
NIGDY nie pomijaj żadnego wiersza z pliku. Każda pozycja z niepustą nazwą MUSI znaleźć się w output.
To dotyczy SZCZEGÓLNIE: "materiały pomocnicze", "dodatkowe", "inne", "rezerwa", "pozostałości",
"nieprzewidziane", "robocizna dodatkowa", "transport", etc.
Takie pozycje NIE są śmieciami — to prawdziwe pozycje kosztorysu budowlanego.
Wynik MUSI mieć DOKŁADNIE tyle samo pozycji co wierszy danych w pliku.

ZASADA #0A — PRIORYTET JEDNOSTKI (ABSOLUTNY ZAKAZ ZMIANY, równorzędny z #0):
Jeśli w pliku źródłowym kolumna 'Jednostka' / 'JM' zawiera wartość ('szt', 'kpl', 'm', 'mb', 'h'),
MASZ OBOWIĄZEK użyć jej dosłownie. NIE WOLNO Ci jej zmieniać na podstawie:
  - Opisu technicznego (np. "z=20m", "h=3m", "długość 5m", "5x2.5mm²")
  - Kategorii produktu (np. "to kabel więc powinno być mb")
  - Własnych założeń dotyczących rodzaju pracy

TECH_PARAM_SHIELD — Parametry techniczne NIE są jednostką miary:
Wzorce takie jak z=Xm, h=Xm, l=Xm, d=Xmm w nazwie pozycji oznaczają parametr techniczny urządzenia
(np. długość kabla zasilającego, wysokość montażu, średnicę), a NIE jednostkę ilości.
PRZYKŁADY (błąd który MUSISZ unikać):
  ❌ "Detektor dymu z=20m | 29 | szt" → unit="mb"  ← ZABRONIONE
  ✅ "Detektor dymu z=20m | 29 | szt" → unit="szt"  ← WYMAGANE
  ❌ "Oprawa LED h=3m | 5 | szt" → unit="mb"  ← ZABRONIONE
  ✅ "Oprawa LED h=3m | 5 | szt" → unit="szt"  ← WYMAGANE
  ✅ "Przewód YDYp 3x2.5 | 150 | mb" → unit="mb"  ← POPRAWNE (kabel z jednostką mb)
  ✅ "Kabel UTP kat.6 | 200 | m" → unit="mb"  ← POPRAWNE (kabel, m=mb)

DEVICE_KW_SHIELD — Te typy pozycji są ZAWSZE w szt/kpl, nawet z parametrami długości:
Detektor, Czujka, Czujnik, Sygnalizator, Oprawa, Lampa, Gniazdo, Klawisz, Wyłącznik,
Sterownik, Kontroler, Moduł, Centrala, Kamera, Rejestrator, Głowica, Zawór, Siłownik

ZASADY ODCZYTU (KRYTYCZNE):
1. SPLIT — material_price i labor_price osobno. Nie sumuj.
2. Cena TYLKO z pliku. Jeśli w wierszu nie ma ceny materiału — material_price = 0. Nie szacuj rynku.
   labor_price ZAWSZE 0. Godziny liczy program: norma ES × stawka elektryka.
3. SEMANTYCZNY MAPPING — rozumiej znaczenie, nie tylko tekst dosłowny:
   - "Przewód U/UTP", "Kabel UTP", "Linia LAN", "kabel sieciowy kat.6", "patch cord" → to samo: kabel UTP kat.6
   - "Szafa rack", "szafa krosowa", "rack 19\"", "szafa 42U" → szafa serwerowa rack
   - "Patchpanel", "panel krosowy", "patch panel 24p" → panel krosowy RJ45
   - "Gniazdo RJ45", "gniazdo LAN", "punkt LAN", "outlet LAN" → gniazdo sieciowe
   - "Wyłącznik nadprądowy", "MCB", "bezpiecznik automatyczny" → MCB
   - "WLZ", "wewnętrzna linia zasilająca" → linia kablowa
4. Jeśli nazwa zawiera skrót jednostki (kpl, szt, mb, m) — NIE włączaj go do name. Tylko wstaw do unit.
5. knr_code i labor_norm zostaw null. Program sam dopasuje normę ES. Nie wymyślaj kodu.
6. Zestaw zostaw jedną pozycją, bez doliczania własnych złotych. unit z pliku.
</import_context>`;

    const fullSystemPrompt = systemPrompt + "\n" + importContext + engineContextBlock + preResolutionContext;

    const { object } = await generateObject({
      model: google(GEMINI_RAG_MODEL),
      system: fullSystemPrompt,
      prompt: dataPreview,
      schema: z.object({
        items: z.array(z.object({
          name: z.string(),
          unit: z.string(),
          quantity: z.number(),
          material_price: z.number(),
          labor_price: z.number(),
          knr_code: z.string().optional().nullable(),
          knr_source: z.enum(["system_knr", "ai_estimation", "es_synthetic"]).optional().nullable(),
          labor_norm: z.number().optional().nullable(),
        })),
      }),
      temperature: 0.1,
      maxOutputTokens: 16000,
    });

    const items: AIProjectItem[] = object.items || [];

    const validItems = items
      .filter(item => item.name && item.name.trim().length > 0)
      .map((item, idx) => {
        const aiUnit = item.unit || "kpl";
        const srcUnit = sourceUnits[idx] ?? "";
        // Post-processing shield: revert AI unit if source file had szt/kpl and AI inferred mb
        const finalUnit = srcUnit ? verifyAiUnit(item.name.trim(), srcUnit, aiUnit) : aiUnit;
        return {
          name: item.name.trim(),
          unit: finalUnit,
          quantity: Math.max(0.01, Number(item.quantity) || 1),
          material_price: Math.max(0, Number(item.material_price) || 0),
          labor_price: Math.max(0, Number(item.labor_price) || 0),
          knr_code: item.knr_code || null,
          knr_source: item.knr_source || null,
          labor_norm: item.labor_norm != null ? Math.max(0, Number(item.labor_norm)) : null,
        };
      });

    // ── Apply L1 overrides: exact dictionary matches take priority over LLM ───
    // L1 = 100% confidence from es_dictionary exact match — never let LLM override
    validItems.forEach((item, idx) => {
      const pre = preResolved[idx];
      if (pre?._match.confidence_level === "L1" && pre.knr_code) {
        item.knr_code = pre.knr_code;
        item.knr_source = "system_knr";
        if (pre.labor_norm_rbh != null) {
          item.labor_norm = scaleLaborNorm(pre.labor_norm_rbh, pre._match.unit, item.unit ?? "");
        }
      }
    });

    const { data: profile } = await supabase.from("profiles").select("hourly_rate").eq("id", user.id).single();
    const rate = Number(profile?.hourly_rate) || 0;
    const matCol = materialHeader(columnHeaders);
    const fileMats = matCol ? sampleRows.map((row) => parseMoney(row[matCol])) : [];
    const stamped = validItems.map((item, idx) => stampWorkPrice(item, rate, fileMats[idx] ?? null));

    return { success: true, items: stamped };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "";
    if (errorMessage.includes("PRO") || errorMessage.includes("subscription")) {
      return { success: false, error: "Ta funkcja wymaga subskrypcji PRO" };
    }
    logger.error("[ai-import] error:", {}, error);
    return { success: false, error: "Wystąpił błąd podczas analizy AI" };
  }
}

// ─── aiPriceVisionItems ───────────────────────────────────────────────────────
// Pricing pass for Vision OCR results — same prompt as aiAnalyzeProjectImport.
// Input: OCR-extracted items (name, unit, quantity, prices=0).
// Output: same items enriched with material_price, labor_price, knr_code, labor_norm.

interface VisionItem {
  name: string;
  unit: string;
  quantity: number;
}

export async function aiPriceVisionItems(
  visionItems: VisionItem[],
  engineSettings?: EngineSettings,
): Promise<{ success: boolean; items?: AIProjectItem[]; error?: string }> {
  const settings: EngineSettings = engineSettings ?? DEFAULT_ENGINE_SETTINGS;
  try {
    const { user, supabase } = await tryAuth();
    if (!user || !supabase) return { success: false, error: "Musisz być zalogowany" };

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return { success: false, error: "Usługa AI nie jest skonfigurowana" };
    }

    // Build RAG context (same as aiAnalyzeProjectImport)
    const kbContext = await loadKbContextOptional("import przedmiar knr materialy robocizna");

    // NOTE: buildLightSystemPrompt used intentionally (not "importer") —
    // IMPORTER_PROMPT has "use prices from document if present" which confuses pricing pass
    const basePrompt = buildLightSystemPrompt();
    const systemPrompt = injectKbContext(basePrompt, kbContext);
    const engineContextBlock = buildEngineContextBlock(settings);

    const importContext = `<import_context>

Źródło: OCR (skan/zdjęcie dokumentu)
Zadanie: WYCENA pozycji rozpoznanych przez ES-Engine 2 Vision.

ZASADY:
1. material_price = 0 i labor_price = 0. Nie szacuj cen.
2. knr_code i labor_norm = null. Program liczy godziny normy ES × stawka.
3. Zachowaj nazwę i nie mnóż niczego przez ilość.
</import_context>`;

    // ── ES-Engine pre-resolution for vision items ────────────────────────────
    let visionPreResolved: Awaited<ReturnType<typeof resolveImportedRows>> = [];
    let visionPreContext = "";
    try {
      visionPreResolved = await resolveImportedRows(
        visionItems.map((v) => ({ name: v.name, unit: v.unit })),
        supabase,
        settings,
      );
      visionPreContext = buildPreResolutionContext(visionPreResolved);
    } catch {
      // Non-critical
    }

    const fullSystemPrompt = systemPrompt + "\n" + importContext + engineContextBlock + visionPreContext;

    // NOTE: quantity intentionally omitted — prevents model from multiplying unit price by quantity
    const itemsList = visionItems
      .map((item, i) => `${i + 1}. "${item.name}" | jm: ${item.unit}`)
      .join("\n");

    const { object } = await generateObject({
      model: google(GEMINI_RAG_MODEL),
      system: fullSystemPrompt,
      prompt: `Wycen następujące pozycje rozpoznane z dokumentu OCR (uwzględnij PRE-ANALIZĘ ES-DICTIONARY jeśli była podana):\n\n${itemsList}`,
      schema: z.object({
        items: z.array(z.object({
          index: z.number(),
          material_price: z.number(),
          labor_price: z.number(),
          knr_code: z.string().optional().nullable(),
          knr_source: z.enum(["system_knr", "ai_estimation", "es_synthetic"]).optional().nullable(),
          labor_norm: z.number().optional().nullable(),
        })),
      }),
      temperature: 0.1,
      maxOutputTokens: 16000,
    });

    const pricedItems: AIProjectItem[] = visionItems.map((item, idx) => {
      // NOTE: prompt uses 1-based index (i+1), so we search for idx+1
      const p = object.items.find((e) => e.index === idx + 1) ?? object.items[idx];
      const pre = visionPreResolved[idx];

      // L1 dictionary match overrides LLM KNR code
      const knrCode = (pre?._match.confidence_level === "L1" && pre.knr_code)
        ? pre.knr_code
        : (p?.knr_code || null);
      const knrSource = (pre?._match.confidence_level === "L1" && pre.knr_code)
        ? ("system_knr" as const)
        : (p?.knr_source || null);
      const laborNorm = (pre?._match.confidence_level === "L1" && pre.labor_norm_rbh != null)
        ? scaleLaborNorm(pre.labor_norm_rbh, pre._match.unit, item.unit ?? "")
        : (p?.labor_norm != null ? Math.max(0, Number(p.labor_norm)) : null);

      return {
        name: item.name,
        unit: item.unit || "szt",
        quantity: Math.max(0.01, item.quantity || 1),
        // Sanity cap: unit price > 50000 PLN is almost certainly a total-not-unit error
        material_price: Math.min(50000, Math.max(0, Number(p?.material_price) || 0)),
        labor_price: Math.min(50000, Math.max(0, Number(p?.labor_price) || 0)),
        knr_code: knrCode,
        knr_source: knrSource,
        labor_norm: laborNorm,
      };
    });

    const { data: visionProfile } = await supabase.from("profiles").select("hourly_rate").eq("id", user.id).single();
    const visionRate = Number(visionProfile?.hourly_rate) || 0;
    const visionStamped = pricedItems.map((item) => stampWorkPrice(item, visionRate, null));

    return { success: true, items: visionStamped };
  } catch (error: unknown) {
    logger.error("[ai-price-vision] error:", {}, error);
    return { success: false, error: "Wystąpił błąd podczas wyceny pozycji OCR" };
  }
}
