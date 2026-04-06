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
import { fetchKbContext, listKbFileNames } from "@/lib/kb-storage";
import {
  resolveImportedRows,
  type MatchResult,
  type EngineSettings,
  DEFAULT_ENGINE_SETTINGS,
} from "@/lib/services/matching-engine";

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
    let kbContext: string | null = null;
    try {
      const fileNames = await Promise.race([
        listKbFileNames(),
        new Promise<string[]>((resolve) => setTimeout(() => resolve([]), 3000)),
      ]);
      if (fileNames && fileNames.length > 0) {
        const ctx = await Promise.race([
          fetchKbContext(fileNames, "knr_knowledge_base"),
          new Promise<string>((resolve) => setTimeout(() => resolve(""), 3000)),
        ]);
        kbContext = ctx && ctx.length > 30 ? ctx : null;
      }
    } catch { /* optional RAG */ }

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

ZASADY WYCENY ES-ENGINE 2 (KRYTYCZNE — NIGDY nie ignoruj):
1. SPLIT PRICING — material_price i labor_price ZAWSZE osobno. Nigdy ich nie sumuj.
2. ZERO jest ZABRONIONE: NIGDY nie zwracaj 0.00 dla obu pól jednocześnie.
   Jeśli cena nie jest w pliku → OSZACUJ rynkową cenę netto PLN 2026 na podstawie nazwy.
3. SEMANTYCZNY MAPPING — rozumiej znaczenie, nie tylko tekst dosłowny:
   - "Przewód U/UTP", "Kabel UTP", "Linia LAN", "kabel sieciowy kat.6", "patch cord" → to samo: kabel UTP kat.6
   - "Szafa rack", "szafa krosowa", "rack 19\"", "szafa 42U" → szafa serwerowa rack
   - "Patchpanel", "panel krosowy", "patch panel 24p" → panel krosowy RJ45
   - "Gniazdo RJ45", "gniazdo LAN", "punkt LAN", "outlet LAN" → gniazdo sieciowe
   - "Wyłącznik nadprądowy", "MCB", "bezpiecznik automatyczny" → MCB
   - "WLZ", "wewnętrzna linia zasilająca" → linia kablowa
4. Jeśli nazwa zawiera skrót jednostki (kpl, szt, mb, m) — NIE włączaj go do name. Tylko wstaw do unit.
5. Przykładowe ceny rynkowe netto Polska 2026 (unit = podana jednostka):
   - Kabel UTP kat.6 /mb: mat=2.80zł, rob=2.00zł (KNR 5-06)
   - Gniazdo RJ45 /szt: mat=18zł, rob=20zł
   - Patchpanel 24p /szt: mat=180zł, rob=45zł
   - Szafa rack 42U /szt: mat=1800zł, rob=180zł
   - Szafa rack 12U /szt: mat=650zł, rob=90zł
   - Gniazdo 230V /szt: mat=25zł, rob=18zł
   - Wyłącznik nadprądowy 1P /szt: mat=35zł, rob=12zł
   - Oprawa LED /szt: mat=120zł, rob=35zł
   - Przewód YDYp 3x2.5 /mb: mat=4.50zł, rob=3.00zł
   - Montaż gniazda LAN /szt: mat=0zł, rob=25zł
   - Bruzda w tynku /mb: mat=0zł, rob=6.00zł
   - Rura instalacyjna /mb: mat=1.20zł, rob=1.50zł
6. Pozycja czysto materiałowa (kabel, osprzęt) → labor_price MOŻE być 0, ale material_price > 0.
7. Pozycja robocizny (montaż, układanie) → material_price MOŻE być 0, ale labor_price > 0.
8. KNR → polska techniczna nazwa (bez numeru KNR w nazwie).
9. Jednostka: "mb" lub "m" dla kabli/przewodów, "szt" dla sprzętu, "kpl" dla kompletu.
10. KNR CODES — dla każdej pozycji podaj knr_code i labor_norm (rbh/szt):
    ZASADA: NIGDY nie zwracaj null dla knr_code. Zawsze podaj kod (syntetyczny jeśli brak dokładnego).
    Kody pewne (confidence high):
    - Gniazdo 230V → "KNR 5-01 0401-01", rbh=0.25
    - Punkt oświetleniowy / oprawa LED → "KNR 5-01 0301-01", rbh=0.30
    - Przewód YDYp 3x2.5 /mb → "KNR 5-04 0101-02", rbh=0.05
    - Przewód YDYp 5x6 /mb → "KNR 5-04 0101-04", rbh=0.07
    - Wyłącznik nadprądowy 1P → "KNR 5-08 0201-01", rbh=0.15
    - Rozdzielnia/rozdzielnica → "KNR 5-08 0101-01", rbh=2.00
    - Bruzda w tynku /mb → "KNR 2-02 0401-01", rbh=0.12
    Kody syntetyczne LAN/IT (confidence low → knr_source="es_synthetic"):
    - Kabel UTP/U-UTP kat.5e/6/6a /mb → "KNR 5-06+ES", rbh=0.04
    - Gniazdo RJ45 / punkt LAN → "KNR 5-06+ES", rbh=0.25
    - Patchpanel → "KNR 5-06+ES", rbh=0.45
    - Szafa rack → "KNR 5-06+ES", rbh=2.50
    - Linia LAN zakończona wkładkami RJ45 (kpl) → "KNR 5-06+ES", rbh=1.50
    Kody syntetyczne CCTV/alarm:
    - Kamera IP/CCTV → "KNR 5-09+ES", rbh=1.00
    - NVR/DVR → "KNR 5-09+ES", rbh=1.50
    - Czujka alarm/PIR → "KNR 5-10+ES", rbh=0.50
    Kody syntetyczne pozostałe:
    - PV/fotowoltaika → "KNR AT-26+ES"
    - Wszystkie inne nieznane → "KNR-ES"
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

    return { success: true, items: validItems };
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
    let kbContext: string | null = null;
    try {
      const fileNames = await Promise.race([
        listKbFileNames(),
        new Promise<string[]>((resolve) => setTimeout(() => resolve([]), 3000)),
      ]);
      if (fileNames && fileNames.length > 0) {
        const ctx = await Promise.race([
          fetchKbContext(fileNames, "knr_knowledge_base"),
          new Promise<string>((resolve) => setTimeout(() => resolve(""), 3000)),
        ]);
        kbContext = ctx && ctx.length > 30 ? ctx : null;
      }
    } catch { /* optional RAG */ }

    // NOTE: buildLightSystemPrompt used intentionally (not "importer") —
    // IMPORTER_PROMPT has "use prices from document if present" which confuses pricing pass
    const basePrompt = buildLightSystemPrompt();
    const systemPrompt = injectKbContext(basePrompt, kbContext);
    const engineContextBlock = buildEngineContextBlock(settings);

    const importContext = `<import_context>

Źródło: OCR (skan/zdjęcie dokumentu)
Zadanie: WYCENA pozycji rozpoznanych przez ES-Engine 2 Vision.

ZASADY WYCENY ES-ENGINE 2 (KRYTYCZNE — NIGDY nie ignoruj):
1. SPLIT PRICING — material_price i labor_price ZAWSZE osobno. Nigdy ich nie sumuj.
2. ZERO jest ZABRONIONE: NIGDY nie zwracaj 0.00 dla obu pól jednocześnie.
   Jeśli cena nie jest podana → OSZACUJ rynkową cenę netto PLN 2026 na podstawie nazwy.
3. SEMANTYCZNY MAPPING — rozumiej znaczenie:
   - "Przewód U/UTP", "Kabel UTP", "Linia LAN", "kabel sieciowy kat.6" → kabel UTP kat.6
   - "Szafa rack", "szafa krosowa", "rack 19\"", "szafa 42U" → szafa serwerowa rack
   - "Patchpanel", "panel krosowy", "patch panel 24p" → panel krosowy RJ45
   - "Gniazdo RJ45", "gniazdo LAN", "punkt LAN" → gniazdo sieciowe
   - "Wklad/keystone/wkladka RJ45/insert" → wkladka keystonowa RJ45
   - "Wyłącznik nadprądowy", "MCB", "bezpiecznik automatyczny" → MCB
   - "WLZ", "wewnętrzna linia zasilająca" → linia kablowa
4. Ceny za 1 JEDNOSTKĘ miary — NIE mnóż przez ilość!
5. Przykładowe ceny rynkowe netto Polska 2026:
   - Kabel UTP kat.6 /mb: mat=2.80zł, rob=2.00zł
   - Wkladka RJ45 kat.6 (keystone/wklad) /szt: mat=8zł, rob=5zł
   - Gniazdo RJ45 /szt: mat=18zł, rob=20zł
   - Patchpanel 24p /szt: mat=180zł, rob=45zł
   - Patchpanel 48p /szt: mat=320zł, rob=75zł
   - Szafa rack 12U /szt: mat=650zł, rob=90zł
   - Szafa rack 18U /szt: mat=950zł, rob=150zł
   - Szafa rack 42U /szt: mat=1800zł, rob=250zł
   - Panel krosujacy do szafy RACK /szt: mat=280zł, rob=75zł
   - Gniazdo 230V /szt: mat=25zł, rob=18zł
   - Wyłącznik nadprądowy 1P /szt: mat=35zł, rob=12zł
   - Oprawa LED /szt: mat=120zł, rob=35zł
   - Przewód YDYp 3x2.5 /mb: mat=4.50zł, rob=3.00zł
   - Bruzda w tynku /mb: mat=0zł, rob=6.00zł
   - Kamera IP kopulkowa 4Mpx /szt: mat=350zł, rob=120zł
   - Rejestrator NVR 8-kanal /szt: mat=600zł, rob=150zł
6. Pozycja czysto materiałowa → labor_price MOŻE być 0, ale material_price > 0.
7. Pozycja robocizny → material_price MOŻE być 0, ale labor_price > 0.
8. KNR CODES — dla każdej pozycji podaj knr_code i labor_norm:
   ZASADA: NIGDY nie zwracaj null dla knr_code.
   - Gniazdo 230V → "KNR 5-01 0401-01", rbh=0.25
   - Punkt oświetleniowy / oprawa LED → "KNR 5-01 0301-01", rbh=0.30
   - Przewód YDYp 3x2.5 /mb → "KNR 5-04 0101-02", rbh=0.05
   - Wyłącznik nadprądowy 1P → "KNR 5-08 0201-01", rbh=0.15
   - Rozdzielnia/rozdzielnica → "KNR 5-08 0101-01", rbh=2.00
   - Bruzda w tynku /mb → "KNR 2-02 0401-01", rbh=0.12
   - Kabel UTP/U-UTP kat.6 /mb → "KNR 5-06+ES", rbh=0.04
   - Gniazdo RJ45 / punkt LAN → "KNR 5-06+ES", rbh=0.25
   - Wkladka RJ45 (keystone) /szt → "KNR 5-06+ES", rbh=0.10
   - Patchpanel → "KNR 5-06+ES", rbh=0.45
   - Szafa rack → "KNR 5-06+ES", rbh=2.50
   - Kamera IP/CCTV → "KNR 5-09+ES", rbh=1.00
   - NVR/DVR → "KNR 5-09+ES", rbh=1.50
   - Wszystkie inne nieznane → "KNR-ES"
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

    return { success: true, items: pricedItems };
  } catch (error: unknown) {
    logger.error("[ai-price-vision] error:", {}, error);
    return { success: false, error: "Wystąpił błąd podczas wyceny pozycji OCR" };
  }
}
