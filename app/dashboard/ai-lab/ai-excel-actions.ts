import * as XLSX from "xlsx-js-style";
import { logger } from "@/lib/logger";

// ─── Shared interfaces ────────────────────────────────────────────────────────

export interface ExtractedMaterial {
  name: string;
  quantity: number;
  unit: string;
  material_price: number | null;
  labor_price: number | null;
}

export interface ParseResult {
  success: boolean;
  materials?: ExtractedMaterial[];
  rawText?: string;
  error?: string;
}

export interface VisionAnalysisResult {
  success: boolean;
  materials?: ExtractedMaterial[];
  error?: string;
}

// ─── Excel / PDF text extraction ─────────────────────────────────────────────

/**
 * Parse an Excel buffer to CSV text for AI processing.
 */
export function parseExcelToText(buffer: Buffer): string {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_csv(worksheet);
}

/**
 * Parse a PDF buffer to raw text using pdf2json.
 */
export async function parsePdfToText(buffer: Buffer): Promise<string> {
  const PDFParser = (await import("pdf2json")).default;
  return new Promise<string>((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on(
      "pdfParser_dataError",
      (errData: Error | { parserError?: Error | string }) => {
        const errorMsg =
          errData instanceof Error
            ? errData.message
            : errData.parserError instanceof Error
            ? errData.parserError.message
            : String(errData.parserError || "Unknown error");
        logger.error("PDF Parser Error", { errorMsg });
        reject(new Error(`PDF parsing failed: ${errorMsg}`));
      }
    );

    pdfParser.on("pdfParser_dataReady", () => {
      try {
        const text = pdfParser.getRawTextContent();
        resolve(text);
      } catch (err) {
        logger.error("Text extraction failed", {}, err);
        reject(new Error(`Failed to extract text: ${err}`));
      }
    });

    pdfParser.parseBuffer(buffer);
  });
}

/**
 * Detect file type from File object.
 */
export function detectFileType(file: File): "excel" | "pdf" | "unknown" {
  if (
    file.name.endsWith(".xlsx") ||
    file.name.endsWith(".xls") ||
    file.type.includes("spreadsheet")
  ) {
    return "excel";
  }
  if (file.type.includes("pdf") || file.name.endsWith(".pdf")) {
    return "pdf";
  }
  return "unknown";
}

// ─── Pre-filter: strip junk rows before AI ───────────────────────────────────

/**
 * Remove empty, header, footer, and non-electrical rows from raw CSV/text.
 * Saves 30-40% of tokens sent to Gemini.
 */
export function cleanRawData(rawText: string): string {
  const JUNK_PATTERNS = [
    /^\s*$/,                                          // empty lines
    /^[,;\t ]+$/,                                     // only delimiters
    /^\s*strona\s+\d+/i,                              // "Strona 1 z 10"
    /^\s*page\s+\d+/i,
    /^\s*\d+\s*\/\s*\d+\s*$/,                         // "1/10"
    /^\s*razem\s*:?\s*$/i,                            // "Razem:"
    /^\s*suma\s*:?\s*$/i,                             // "Suma:"
    /^\s*łącznie\s*:?\s*$/i,
    /^\s*ogółem\s*:?\s*$/i,
    /^\s*podpis\s*/i,                                 // "Podpis"
    /^\s*data\s*:?\s*$/i,                             // "Data:"
    /^\s*miejscowość\s*/i,
    /^\s*zatwierdził\s*/i,
    /^\s*sporządził\s*/i,
    /^\s*nr\s+oferty\s*/i,
    /^\s*oferta\s+nr\s*/i,
    /^\s*[\-=_]{5,}\s*$/,                             // separator lines -----
    /^\s*lp\.?\s*$/i,                                 // lone "Lp."
    /^\s*(nazwa|opis|jednostka|ilość|cena|wartość|uwagi)\s*$/i, // single-word headers
  ];

  const lines = rawText.split(/\r?\n/);
  const cleaned = lines.filter((line) => {
    const trimmed = line.trim();
    if (trimmed.length < 3) return false;
    return !JUNK_PATTERNS.some((re) => re.test(trimmed));
  });

  return cleaned.join("\n");
}

// ─── KNR Przedmiar Robót detection & preprocessing ───────────────────────────

const KNR_INDICATORS = [
  /KNR[W]?\s+\d{1,4}[/\-]/i,
  /PRZEDMIAR\s+ROB[ÓO]T/i,
  /robocizna\s*\/?\s*sum/i,
  /warto\u015b\u0107\s+pozycji/i,
  /razem\s+\(z\s+narzutami\)/i,
];

/**
 * Returns true if the raw PDF text looks like a Polish KNR Przedmiar Robót.
 * Requires at least 2 of 5 KNR-specific indicators.
 */
export function isKnrPrzedmiar(text: string): boolean {
  return KNR_INDICATORS.filter((r) => r.test(text)).length >= 2;
}

const KNR_SUB_ROW_JUNK = [
  /\u015brodk[i]?\s+transport/i,           // Środki transportu
  /materia\u0142y\s+inne\s*\(/i,           // Materiały inne (%)
  /^\s*razem\s*\(z\s+narzutami\)\s*:?/i,  // Razem (z narzutami):
  /^\s*warto\u015b\u0107\s+pozycji\s*:?/i,// Wartość pozycji:
  /^\s*razem\s*:\s*$/i,                    // standalone Razem:
  /^\s*podstawa\s+nak\u0142ad/i,           // Podstawa nakładów
  /^\s*analogia\s*:/i,                     // Analogia:
  /^\s*obliczenie\s+ilo/i,                 // Obliczenie ilości
  /^\s*opis\s+pozycji/i,                   // Opis pozycji (table header)
  /^\s*j\.?m\.?\s+norma\s+ilo/i,          // j.m. norma ilość (column header)
  /^\s*[R]\s+[M]\s+[S]\s*$/,              // column header "R M S"
];

/**
 * Converts raw KNR Przedmiar Robót PDF text into a structured format
 * with explicit markers for position headers, robocizna, and materials.
 * Removes transport/narzuty noise. Marks Zestawienie Materiałów separately.
 *
 * Output markers:
 *   [POS]  — KNR position header (main item)
 *   [ROB]  — Robocizna (labor) sub-row → maps to labor_price
 *   [ZEST] — Zestawienie Materiałów line → use for material price reference
 *   (plain lines under [POS]) — material components → map to material_price
 */
export function preprocessKnrPrzedmiar(rawText: string): string {
  const lines = rawText.split(/\r?\n/);
  const out: string[] = [];
  let inZestawienie = false;
  let inNarzuty = false;

  const KNR_POS_RE = /^\s*\d+[\.,]\d+\s+KNR[W]?\s+[\d\-/]+/i;
  const ROBOCIZNA_RE = /robocizna/i;
  const RG_UNIT_RE = /\br-?g\b/i;
  const ZESTAWIENIE_RE = /ZESTAWIENIE\s+MATERIA/i;
  const NARZUTY_RE = /^\s*NARZUTY\s*$/i;
  const PAGE_NUM_RE = /strona\s+\d+/i;
  const TABLE_HDR_RE = /^\s*(l\.?p\.?|s\.?\s*lp|nazwa|jm|ilo\u015b\u0107|cena|warto\u015b\u0107)\s*$/i;

  for (const line of lines) {
    const t = line.trim();
    if (!t || t.length < 2) continue;

    // ── Section detection ───────────────────────────────────────────
    if (ZESTAWIENIE_RE.test(t)) {
      inZestawienie = true;
      out.push("\n[ZEST_HEADER] Zestawienie Materiałów (lista zakupowa)");
      continue;
    }
    if (NARZUTY_RE.test(t)) { inNarzuty = true; continue; }
    if (inNarzuty && KNR_POS_RE.test(t)) inNarzuty = false;
    if (inNarzuty) continue;

    // ── Zestawienie Materiałów section ─────────────────────────────
    if (inZestawienie) {
      if (PAGE_NUM_RE.test(t) || TABLE_HDR_RE.test(t)) continue;
      if (/^\s*\d+[\s.]/.test(t)) out.push(`[ZEST] ${t}`);
      continue;
    }

    // ── KNR sub-row noise → skip ───────────────────────────────────
    if (KNR_SUB_ROW_JUNK.some((p) => p.test(t))) continue;

    // ── KNR position header ────────────────────────────────────────
    if (KNR_POS_RE.test(t)) { out.push(`\n[POS] ${t}`); continue; }

    // ── Robocizna (labor) row ──────────────────────────────────────
    if (ROBOCIZNA_RE.test(t) || RG_UNIT_RE.test(t)) {
      out.push(`[ROB] ${t}`);
      continue;
    }

    out.push(t);
  }

  return out.join("\n");
}

/**
 * Splits preprocessed KNR text into chunks of N positions each,
 * splitting at [POS] boundaries to never break a position across chunks.
 */
export function splitKnrIntoPositionChunks(
  text: string,
  posPerChunk = 8,
): string[] {
  const segments = text.split(/(?=\n\[POS\])/);
  const chunks: string[] = [];
  for (let i = 0; i < segments.length; i += posPerChunk) {
    chunks.push(segments.slice(i, i + posPerChunk).join(""));
  }
  return chunks.length > 0 ? chunks : [text];
}

// ─── Catalog context helpers ──────────────────────────────────────────────────

import { COMMON_ELECTRICAL_ITEMS, getRelevantCatalogContext } from "@/lib/ai/prompts";

/**
 * Build catalog context string for AI prompts (user catalog + global catalog).
 */
export async function getCatalogContext(): Promise<string> {
  try {
    const { createClient } = await import("@/utils/supabase/server");
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    let userCatalogList = "";
    if (user) {
      const { data: userItems } = await supabase
        .from("catalog_items")
        .select("name, unit, base_material_price, base_labor_price")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .limit(50);

      if (userItems && userItems.length > 0) {
        userCatalogList = userItems
          .map(
            (i) =>
              `- ${i.name} (${i.unit}) | materiał: ${i.base_material_price} PLN | robocizna: ${i.base_labor_price} PLN`
          )
          .join("\n");
      }
    }

    let showGlobalCatalog = true;
    if (user) {
      const { data: profilePrefs } = await supabase
        .from("profiles")
        .select("show_global_catalog")
        .eq("id", user.id)
        .single();
      showGlobalCatalog = profilePrefs?.show_global_catalog ?? true;
    }

    let globalCatalogList = "";
    if (showGlobalCatalog) {
      const { data: items } = await supabase
        .from("catalog_items")
        .select("name, unit, base_material_price, base_labor_price")
        .is("user_id", null)
        .eq("is_active", true)
        .limit(50);
      if (items && items.length > 0) {
        globalCatalogList = items
          .map(
            (i) =>
              `- ${i.name} (${i.unit}) | materiał: ${i.base_material_price} PLN | robocizna: ${i.base_labor_price} PLN`
          )
          .join("\n");
      }
    }

    let result = COMMON_ELECTRICAL_ITEMS;
    if (userCatalogList) {
      result += `\n\nKATALOG UŻYTKOWNIKA (priorytet dopasowania!):\n${userCatalogList}`;
    }
    if (globalCatalogList) {
      result += `\n\nKATALOG GLOBALNY:\n${globalCatalogList}`;
    }

    return result;
  } catch {
    return COMMON_ELECTRICAL_ITEMS;
  }
}

/**
 * Vector-Search-Lite: return only top-N catalog entries relevant to the chunk.
 * Extracts keywords from the chunk text and filters COMMON_ELECTRICAL_ITEMS.
 */
export function getChunkCatalogContext(chunkText: string): string {
  return getRelevantCatalogContext(chunkText);
}

/**
 * Fetch user + global catalog items for price matching.
 */
export async function getUserCatalogForMatching(): Promise<
  {
    id: string;
    name: string;
    unit: string;
    base_material_price: number;
    base_labor_price: number;
  }[]
> {
  try {
    const { createClient } = await import("@/utils/supabase/server");
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    const { data: profilePrefs } = await supabase
      .from("profiles")
      .select("show_global_catalog")
      .eq("id", user.id)
      .single();
    const showGlobalCatalog = profilePrefs?.show_global_catalog ?? true;

    const { data: userItems } = await supabase
      .from("catalog_items")
      .select("id, name, unit, base_material_price, base_labor_price")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .limit(200);

    let globalItems: {
      id: string;
      name: string;
      unit: string;
      base_material_price: number | null;
      base_labor_price: number | null;
    }[] = [];
    if (showGlobalCatalog) {
      const { data } = await supabase
        .from("catalog_items")
        .select("id, name, unit, base_material_price, base_labor_price")
        .is("user_id", null)
        .eq("is_active", true)
        .limit(200);
      globalItems = data || [];
    }

    return [...(userItems || []), ...globalItems] as {
      id: string;
      name: string;
      unit: string;
      base_material_price: number;
      base_labor_price: number;
    }[];
  } catch {
    return [];
  }
}

// ─── Fuzzy catalog matcher ────────────────────────────────────────────────────

type CatalogItem = {
  id: string;
  name: string;
  unit: string;
  base_material_price: number;
  base_labor_price: number;
};

/**
 * Fuzzy-match a material name against catalog items.
 * Priority: exact → contains → keyword (≥2 words, score ≥0.5).
 */
export function findBestCatalogMatch(
  materialName: string,
  catalogItems: CatalogItem[]
): CatalogItem | null {
  const normalizedName = materialName.toLowerCase().trim();

  const exactMatch = catalogItems.find(
    (item) => item.name.toLowerCase().trim() === normalizedName
  );
  if (exactMatch) return exactMatch;

  const containsMatch = catalogItems.find((item) => {
    const catName = item.name.toLowerCase().trim();
    return normalizedName.includes(catName) || catName.includes(normalizedName);
  });
  if (containsMatch) return containsMatch;

  const stopWords = new Set([
    "z", "do", "na", "w", "i", "dla", "pod", "bez", "od", "mm²", "mm", "szt", "mb", "kpl",
  ]);
  const materialWords = normalizedName
    .split(/[\s,./()-]+/)
    .filter((w) => w.length > 1 && !stopWords.has(w));

  let bestMatch: CatalogItem | null = null;
  let bestScore = 0;

  for (const item of catalogItems) {
    const catWords = item.name
      .toLowerCase()
      .trim()
      .split(/[\s,./()-]+/)
      .filter((w) => w.length > 1 && !stopWords.has(w));

    let matchCount = 0;
    for (const mw of materialWords) {
      if (catWords.some((cw) => cw.includes(mw) || mw.includes(cw))) {
        matchCount++;
      }
    }

    const score =
      matchCount / Math.max(materialWords.length, catWords.length);
    if (score > bestScore && score >= 0.5 && matchCount >= 2) {
      bestScore = score;
      bestMatch = item;
    }
  }

  return bestMatch;
}
