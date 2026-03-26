"use server";

import { checkAndIncrementAiUsage } from "@/lib/ai-usage";
import { AI_FUNCTION_NAMES } from "@/lib/ai-quota-config";
import { logger } from "@/lib/logger";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { AI_MODEL_TIER1 } from "@/lib/ai-models";
import { z } from "zod";
import { buildDynamicSystemPrompt, injectKbContext, GEMINI_RAG_MODEL } from "@/lib/ai-master-brain";
import { fetchKbContext, listKbFileNames } from "@/lib/kb-storage";
import {
  getCatalogContext,
  getChunkCatalogContext,
  cleanRawData,
  parseExcelToText,
  parsePdfToText,
  detectFileType,
  isKnrPrzedmiar,
  preprocessKnrPrzedmiar,
  splitKnrIntoPositionChunks,
  type ExtractedMaterial,
  type ParseResult,
  type VisionAnalysisResult,
} from "./ai-excel-actions";

// ─── Shared Gemini schema ─────────────────────────────────────────────────────

const materialsSchema = z.object({
  materials: z.array(
    z.object({
      name: z.string(),
      quantity: z.number(),
      unit: z.string(),
      material_price: z.number().nullable(),
      labor_price: z.number().nullable(),
    })
  ),
});

// ─── Chunking helpers ─────────────────────────────────────────────────────────

const CHUNK_SIZE = 15;

/** Split text into line-based chunks of CHUNK_SIZE rows. */
function splitIntoChunks(text: string, size: number = CHUNK_SIZE): string[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const chunks: string[] = [];
  for (let i = 0; i < lines.length; i += size) {
    chunks.push(lines.slice(i, i + size).join("\n"));
  }
  return chunks.length > 0 ? chunks : [text];
}

/** Merge materials arrays from parallel chunk results, deduplicating by name. */
function mergeChunkResults(allMaterials: ExtractedMaterial[][]): ExtractedMaterial[] {
  const map = new Map<string, ExtractedMaterial>();
  for (const chunk of allMaterials) {
    for (const item of chunk) {
      const key = item.name.toLowerCase().trim();
      const existing = map.get(key);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        map.set(key, { ...item });
      }
    }
  }
  return [...map.values()];
}

// ─── KB loader for AI Lab ────────────────────────────────────────────────────
async function fetchAiLabKbContext(): Promise<string | null> {
  try {
    const fileNames = await Promise.race([
      listKbFileNames(),
      new Promise<string[]>((resolve) => setTimeout(() => resolve([]), 3000)),
    ]);
    if (!fileNames || fileNames.length === 0) return null;
    const ctx = await Promise.race([
      fetchKbContext(fileNames, "knr_knowledge_base"),
      new Promise<string>((resolve) => setTimeout(() => resolve(""), 3000)),
    ]);
    return ctx && ctx.length > 30 ? ctx : null;
  } catch {
    return null;
  }
}

// ─── System prompts built from master-brain ───────────────────────────────────

const KNR_EXTRA = `<knr_przedmiar_struktura>
TEN DOKUMENT TO PRZEDMIAR ROBÓT KNR. Przetwarzaj każdą pozycję KNR jako osobny wpis.

ZNACZNIKI W TEŁŚCI:
- [POS] = nagłówek pozycji KNR → główna pozycja do wyodrębnienia
- [ROB] = linia ROBOCIZNY → wartość numeryczna = labor_price (PLN/jednostkę)
- [ZEST] = Zestawienie Materiałów → użyj do uzupełnienia cen materiałów
- Linie bez znacznika pod [POS] = składniki materiałowe → material_price

EKSTRAKCJA NA POZYCJĘ [POS]:
1. name = opis pozycji (linia tekstu pod [POS], nie sam kod KNR)
2. unit = jednostka miary głównej pozycji (szt, mb, kpl, m² itp.)
3. quantity = ilość z nagłówka lub z treści pozycji
4. labor_price = wartość PLN z linii [ROB] (norma r-g × cena)
5. material_price = suma wartości materiałów z linii pod [POS] do kolejnej [POS]

ZASADY:
- Każda [POS] = jeden obiekt JSON w materials[]
- IGNORUJ procenty (%), transporty, sumy RAZEM
- [ZEST] linie → użyj TYLKO do weryfikacji/uzupełnienia cen materiałów (nie duplikuj jako osobne pozycje)
- Jeśli cena nie występuje w dokumencie → szacuj rynkowo (Polska 2026, PLN netto)
- Zwracaj minimalny JSON
</knr_przedmiar_struktura>
`;

const EXCEL_KNR_EXTRA = `<excel_knr_tabela>
DOKUMENT EXCEL/CSV z kodami KNR. Struktura tabelaryczna:
- Każdy wiersz = jedna pozycja KNR
- Szukaj kolumn: ROBOCIZNA / Rob. / R → to labor_price
- Szukaj kolumn: MATERIAŁY / Mat. / M → to material_price
- Kolumna RAZEM / Wartość = suma (nie używaj bezpośrednio)
- Arkusz/sekcja "Zestawienie Materiałów" → materiały zakupowe (osobne wiersze z material_price, labor_price=null)
- Nie duplikuj pozycji z KNR i Zestawienia jednocześnie
- NARZUTY / Koszty pośrednie / Zysk → IGNORUJ
</excel_knr_tabela>
`;

const IMPORTER_EXTRA = `<document_types>
A) KOSZTORYS/PRZEDMIAR → odczytaj każdy wiersz tabeli z ilościami i cenami
B) DOKUMENT KNR → zamń kody na czytelne nazwy wg opisów obok kodów
C) FAKTURA → odczytaj nazwy produktów, ilości, ceny netto (materiał)
D) CENNIK/LISTA MATERIAŁÓW → wypisz każdą pozycję z ilościami
E) EXCEL/CSV → odczytaj wszystkie wiersze, zidentyfikuj kolumny (nazwa/ilość/cena)
</document_types>

<knr_handling>
Dokumenty z KNR mają strukturę: KOD | OPIS PRACY | ILOŚĆ | JEDNOSTKA
Czytaj OPIS obok kodu KNR — tam są szczegóły.
KNR 5-08: 01xx=Rozdzielnice | 02xx=Przewody/kable | 03xx=Osprzęt | 04xx=Oprawy | 05xx=Pomiary
KNR 5-09: Instalacje niskoprądowe | KNR 5-10: Odgromowe | KNR 5-11: PV | KNR AT-26: Teletechnika
</knr_handling>

<extraction_rules>
1. DOPASUJ DO KATALOGU: Sprawdź czy pasuje do katalogu poniżej — użyj DOKŁADNIE tej samej nazwy!
2. KNR → NAZWA: Zamień kody KNR na czytelne polskie nazwy pozycji
3. FORMATUJ NAZWY: Polskie nazwy techniczne (np. "Przewód YDYp 3x2,5mm²")
4. JEDNOSTKI: szt, mb, kpl, m², h — tylko polskie skróty
5. ILOŚCI: Zachowaj z dokumentu. Jeśli brak — wpisz 1.
6. GRUPUJ: Łącz identyczne pozycje, sumuj ilości
7. NIE wymyślaj pozycji których nie ma w dokumencie
8. Przetwórz WSZYSTKIE wiersze (nawet 200+)
</extraction_rules>

<pricing_rules>
- Dokument zawiera ceny → PODAJ je (material_price, labor_price)
- Pasuje do KATALOGU → użyj cen z katalogu
- Brak cen → podaj ORIENTACYJNE ceny rynkowe Polski 2026 (PLN netto):
YDYp 3x1,5=5 | YDYp 3x2,5=7.5 | YDYp 5x2,5=14 | YKY 5x4=18 | YKY 5x10=42
Gniazdo=18 | Gniazdo podwójne=28 | Gniazdo IP44=32 | MCB B16 1P=28 | RCD 40A 4P=220
Montaż gniazda=22 | Puszka=8 | Oprawa=35 | Przewód/mb=10 | Bruzda/mb=28
- material_price = cena materiału za jednostkę (PLN netto)
- labor_price = cena robocizny za jednostkę (PLN netto)
- NIGDY nie zwracaj null dla obu cen jednocześnie
</pricing_rules>

Zwracaj minimalny JSON — krótkie wartości string, bez zbędnych wyjaśnień.`;

const VISION_EXTRA = `<visual_scanning_methodology>
Jeśli obraz to RZUT/RYSUNEK ELEKTRYCZNY:
KROK 1: Zlokalizuj legendę symboli. Odczytaj kody symboli. Zidentyfikuj pomieszczenia.
KROK 2 — GRID 3×3: Podziel obraz na 9 sektorów, skanuj każdy osobno.
KROK 3: Sprawdź czy KAŻDY kod z legendy został zaraportowany.
KROK 4: Zwróć breakdown per sektor i pomieszczenie.
NIE ZAKŁADAJ SYMETRII: Licz każdy symbol osobno.
</visual_scanning_methodology>

<extraction_rules>
- Dopasuj nazwy do katalogu poniżej — polska terminologia techniczna
- Jednostki: szt, mb, kpl, m²
- Grupuj i sumuj powtarzające się pozycje
- RZUTY: Użyj GRID 3×3 — skanuj każdy z 9 sektorów osobno
</extraction_rules>

Zwracaj minimalny JSON — krótkie wartości string, bez zbędnych wyjaśnień.`;

// ─── Public server actions ────────────────────────────────────────────────────

/**
 * Parse PDF or Excel file with Gemini AI to extract materials list.
 */
export async function parsePdfWithAi(formData: FormData): Promise<ParseResult> {
  try {
    const { createClient } = await import("@/utils/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const aiCheck = await checkAndIncrementAiUsage(
        user.id,
        AI_FUNCTION_NAMES.aiVision
      );
      if (!aiCheck.allowed)
        return { success: false, error: aiCheck.error || "Limit AI wyczerpany" };
    }

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      logger.error("GOOGLE_GENERATIVE_AI_API_KEY is not set");
      return {
        success: false,
        error:
          "Klucz API Google AI nie jest skonfigurowany. Dodaj GOOGLE_GENERATIVE_AI_API_KEY do zmiennych środowiskowych.",
      };
    }

    const file = formData.get("pdf") as File;
    const userInstructions = (formData.get("instructions") as string) || "";

    if (!file) {
      logger.error("File is NULL - FormData key mismatch or empty upload");
      return {
        success: false,
        error: "Nie wybrano pliku (Server received NULL). Sprawdź console logs.",
      };
    }

    const fileType = detectFileType(file);
    if (fileType === "unknown") {
      return {
        success: false,
        error:
          "Nieprawidłowy format pliku. Wybierz plik PDF lub Excel (.xlsx, .xls).",
      };
    }

    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return {
        success: false,
        error: "Plik jest zbyt duży. Maksymalny rozmiar to 10MB.",
      };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    let rawText: string;

    if (fileType === "excel") {
      try {
        rawText = parseExcelToText(buffer);
      } catch (err) {
        logger.error("Excel parsing failed", {}, err);
        throw new Error(`Failed to parse Excel file: ${err}`);
      }
    } else {
      rawText = await parsePdfToText(buffer);
    }

    if (!rawText || rawText.trim().length < 10) {
      logger.error("Extracted text is too short", {
        length: rawText?.length || 0,
      });
      return {
        success: false,
        error:
          fileType === "excel"
            ? "Plik Excel jest pusty lub nie zawiera danych."
            : "PDF nie zawiera tekstu lub jest pusty. Upewnij się, że PDF zawiera prawdziwy tekst (nie zeskanowany obraz).",
        rawText,
      };
    }

    // ── Detect format & pre-process ──────────────────────────────────────────
    // KNR preprocessing only applies to PDF (messy multi-line text).
    // Excel/CSV already has clean tabular structure — use column-aware hint instead.
    const isKnrPdf = fileType === "pdf" && isKnrPrzedmiar(rawText);
    const isKnrExcel = fileType === "excel" && isKnrPrzedmiar(rawText);
    const cleanedText = isKnrPdf ? preprocessKnrPrzedmiar(rawText) : cleanRawData(rawText);
    const extraPrompt = isKnrPdf
      ? KNR_EXTRA + "\n" + IMPORTER_EXTRA
      : isKnrExcel
        ? EXCEL_KNR_EXTRA + "\n" + IMPORTER_EXTRA
        : IMPORTER_EXTRA;

    // ── Chunking + Parallel Processing ───────────────────────────────────────
    const chunks = isKnrPdf
      ? splitKnrIntoPositionChunks(cleanedText, 8)
      : splitIntoChunks(cleanedText);
    const isLargeFile = chunks.length > 3;

    let materials: ExtractedMaterial[];

    if (isLargeFile) {
      // Parallel: each chunk gets its own focused catalog context
      const chunkPromises = chunks.map(async (chunk) => {
        const chunkCatalog = getChunkCatalogContext(chunk);
        const prompt = userInstructions
          ? `INSTRUKCJE: ${userInstructions}\n\nCHUNK DOKUMENTU:\n${chunk}`
          : isKnrPdf
            ? `Wyodrębnij pozycje KNR z tego fragmentu Przedmiaru Robót (każda [POS] = jeden wpis):\n${chunk}`
            : `Wyodrębnij pozycje kosztorysowe z tego fragmentu dokumentu:\n${chunk}`;

        const [chunkBasePrompt, chunkKbCtx] = await Promise.all([buildDynamicSystemPrompt("importer", extraPrompt), fetchAiLabKbContext()]);
        const { object: chunkObj } = await generateObject({
          model: google(AI_MODEL_TIER1),
          system: injectKbContext(chunkBasePrompt, chunkKbCtx) + `\n\n<catalog>\n${chunkCatalog}\n</catalog>`,
          prompt,
          schema: materialsSchema,
          temperature: 0.1,
          maxOutputTokens: 4000,
        });
        return chunkObj.materials || [];
      });

      const chunkResults = await Promise.all(chunkPromises);
      materials = mergeChunkResults(chunkResults);
    } else {
      // Small file: single call with full catalog context
      const catalogContext = await getCatalogContext();
      const textLimit = 15000;
      const userMessage = userInstructions
        ? `Przeanalizuj ten dokument i wyodrębnij WSZYSTKIE pozycje.\n\nINSTRUKCJE UŻYTKOWNIKA:\n${userInstructions}\n\nDOKUMENT:\n${cleanedText.substring(0, textLimit)}`
        : isKnrPdf
          ? `Przeanalizuj Przedmiar Robót KNR. Każda linia [POS] = jedna pozycja. [ROB] = robocizna (labor_price). Linie materiałów = material_price. [ZEST] = tylko referencja cen.\n\nDOKUMENT:\n${cleanedText.substring(0, textLimit)}`
          : `Przeanalizuj ten dokument i wyodrębnij WSZYSTKIE pozycje materiałowe.\nDokument może zawierać kody KNR - zamń je na czytelne nazwy pozycji.\n\nDOKUMENT:\n${cleanedText.substring(0, textLimit)}`;

      const [singleBasePrompt, singleKbCtx] = await Promise.all([buildDynamicSystemPrompt("importer", extraPrompt), fetchAiLabKbContext()]);
      const { object } = await generateObject({
        model: google(AI_MODEL_TIER1),
        system: injectKbContext(singleBasePrompt, singleKbCtx) + `\n\n<catalog>\n${catalogContext}\n</catalog>`,
        prompt: userMessage,
        schema: materialsSchema,
        temperature: 0.1,
        maxOutputTokens: 10000,
      });
      materials = object.materials || [];
    }

    if (!Array.isArray(materials) || materials.length === 0) {
      return {
        success: false,
        error: "AI nie znalazło żadnych materiałów w pliku",
        rawText: rawText.substring(0, 500),
      };
    }

    return {
      success: true,
      materials,
      rawText: rawText.substring(0, 1000),
    };
  } catch (error) {
    logger.error("Error in parsePdfWithAi", {}, error);
    if (error instanceof Error && error.message.includes("PDF parsing")) {
      return {
        success: false,
        error:
          "Błąd parsowania PDF. Upewnij się, że plik jest prawidłowy i nie jest zaszyfrowany.",
      };
    }
    const errorMessage =
      error instanceof Error ? error.message : "Nieznany błąd";
    return {
      success: false,
      error: `${errorMessage}. Sprawdź logi serwera dla szczegółów.`,
    };
  }
}

/**
 * Analyze floor plan / blueprint image with Gemini Vision.
 */
export async function analyzeImageWithAi(
  imageBase64: string,
  userInstructions?: string,
  contextImageBase64?: string
): Promise<VisionAnalysisResult> {
  try {
    const { createClient } = await import("@/utils/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const aiCheck = await checkAndIncrementAiUsage(user.id, AI_FUNCTION_NAMES.aiVision);
      if (!aiCheck.allowed)
        return { success: false, error: aiCheck.error || "Limit AI wyczerpany" };
    }

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      logger.error("GOOGLE_GENERATIVE_AI_API_KEY is not set");
      return {
        success: false,
        error: "Klucz API Google AI nie jest skonfigurowany.",
      };
    }

    const catalogContext = await getCatalogContext();
    const [visionBasePrompt, visionKbCtx] = await Promise.all([buildDynamicSystemPrompt("importer", VISION_EXTRA), fetchAiLabKbContext()]);
    const systemPrompt = injectKbContext(visionBasePrompt, visionKbCtx) + `\n\n<catalog>\n${catalogContext}\n</catalog>`;

    const userContent: Array<
      { type: "text"; text: string } | { type: "image"; image: string }
    > = [
      {
        type: "text" as const,
        text: userInstructions
          ? `User Instructions: ${userInstructions}\n\nCount items in the TARGET image using context from the FULL PAGE.`
          : "Count all electrical symbols in the TARGET image. Use the FULL PAGE context for legend.",
      },
    ];

    if (contextImageBase64) {
      userContent.push({ type: "image" as const, image: contextImageBase64 });
      userContent.push({
        type: "text" as const,
        text: "ABOVE is Image 1: FULL PAGE CONTEXT (Use for Legend). BELOW is Image 2: TARGET (Count here).",
      });
    }
    userContent.push({ type: "image" as const, image: imageBase64 });

    const { object: visionResult } = await generateObject({
      model: google(AI_MODEL_TIER1),
      messages: [
        { role: "system" as const, content: systemPrompt },
        { role: "user" as const, content: userContent },
      ],
      schema: materialsSchema,
      temperature: 0.0,
      maxOutputTokens: 8000,
    });

    const materials: ExtractedMaterial[] = visionResult.materials || [];

    if (!Array.isArray(materials) || materials.length === 0) {
      logger.warn("AI found no materials in image");
      return {
        success: false,
        error:
          "AI nie znalazło żadnych elementów. Sprawdź czy zaznaczenie jest poprawne.",
      };
    }

    return { success: true, materials };
  } catch (error) {
    logger.error("Error in analyzeImageWithAi", {}, error);
    const errorMessage =
      error instanceof Error ? error.message : "Nieznany błąd";
    return {
      success: false,
      error: `${errorMessage}. Sprawdź logi serwera dla szczegółów.`,
    };
  }
}
