"use server";

import { logger } from "@/lib/logger";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { checkAndIncrementAiUsage } from "@/lib/ai-usage";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { AI_MODEL_TIER1 } from "@/lib/ai-models";
import { DEMO_AI_LIMIT, PRO_AI_LIMIT } from "@/lib/ai-quota-config";
import { applyPriceGuard } from "@/lib/utils/price-validator";

/**
 * AI-powered analysis of spreadsheet data for catalog import.
 * Sends first rows to ES-Intelligence v2.1 to auto-detect column mapping
 * and transform messy data into clean catalog items.
 */

interface ParsedRow {
  [key: string]: string;
}

interface AICatalogItem {
  name: string;
  unit: string;
  base_material_price: number;
  base_labor_price: number;
  category: string;
}

interface AIAnalyzeResult {
  success: boolean;
  items?: AICatalogItem[];
  error?: string;
}

// Reference for the AI to understand our catalog structure
const CATALOG_FORMAT_REFERENCE = `
FORMAT KATALOGU ElektroSmart:
- name: Nazwa pozycji (pełna, profesjonalna, po polsku)
- unit: Jednostka miary (szt, mb, kpl, m², h)
- base_material_price: Cena materiału za jednostkę (PLN, liczbowo)
- base_labor_price: Cena robocizny za jednostkę (PLN, liczbowo)
- category: Nazwa kategorii (np. Przewody, Osprzęt, Rozdzielnice, Oprawy, Robocizna, Inne)

STANDARDOWE JEDNOSTKI:
- szt = sztuka (gniazda, łączniki, oprawy, aparatura modułowa)
- mb = metr bieżący (przewody, kable, korytka)
- kpl = komplet (zestawy montażowe, pomiary)
- m² = metr kwadratowy (powierzchnie)
- h = godzina (robocizna godzinowa)

WSKAZÓWKI:
- Jeśli w danych jest jedna kolumna "cena" bez podziału na materiał i robociznę:
  - Dla materiałów: przypisz całą cenę jako base_material_price, base_labor_price = 0
  - Dla robocizny/usług: przypisz całą cenę jako base_labor_price, base_material_price = 0
  - Dla pozycji mieszanych: podziel orientacyjnie 60% materiał / 40% robocizna
- Jeśli brak jednostki, domyślnie "szt"
- Jeśli brak ceny, ustaw 0
- Pomiń puste wiersze, nagłówki, podsumowania, sumy
- Nazwy pozycji pisz po polsku, profesjonalnie
`;

/**
 * Use AI to analyze spreadsheet data and convert it to catalog items.
 * PRO feature — requires active subscription.
 */
export async function aiAnalyzeImportData(
  rawRows: ParsedRow[],
  columnHeaders: string[],
  fileName: string
): Promise<AIAnalyzeResult> {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));

    if (!user || !supabase) {
      return { success: false, error: "Musisz być zalogowany" };
    }

    // AI usage limit: DEMO=5/mies., PRO=200/mies. (centralized quota)
    const aiCheck = await checkAndIncrementAiUsage(user.id, "aiImportCatalog");
    if (!aiCheck.allowed) return { success: false, error: aiCheck.error || "Limit AI wyczerpany" };

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return { success: false, error: "Usługa AI nie jest skonfigurowana" };
    }

    // Take up to 100 rows for analysis
    const sampleRows = rawRows.slice(0, 100);

    // Format data for AI
    const dataPreview = `KOLUMNY: ${columnHeaders.join(" | ")}\n\nDANE (${sampleRows.length} wierszy):\n` +
      sampleRows.map((row, i) =>
        `${i + 1}. ${columnHeaders.map(h => row[h] || "").join(" | ")}`
      ).join("\n");

    const systemPrompt = `<role>
Ekspert kosztorysant instalacji elektrycznych z 15-letnim doświadczeniem w analizie cenników hurtowych, przedmiarów KNR i katalogów produktów na rynku polskim.
Specjalizacja: normalizacja danych i import do katalogu ElektroSmart PRO.
</role>

<business_context>
ElektroSmart PRO — profesjonalna platforma kosztorysowa dla elektryków w Polsce.
- **SPLIT PRICING (KLUCZOWE)**: Każda pozycja ma OSOBNĄ cenę materiału (base_material_price) i robocizny (base_labor_price). NIGDY nie łącz w jedną cenę.
- **VAT**: Ceny NETTO. System sam dolicza VAT (8%/23%).
- **REGIONY**: Ceny robocizny bazowe — system sam mnożyy przez współczynnik regionalny.
</business_context>

${CATALOG_FORMAT_REFERENCE}

<knr_handling>
Dokumenty KNR: KOD | OPIS | ILOŚĆ | JEDNOSTKA
- KNR 5-08 01xx: Rozdzielnice
- KNR 5-08 02xx: Przewody, kable
- KNR 5-08 03xx: Osprzęt
- KNR 5-08 04xx: Oprawy
- KNR 5-08 05xx: Pomiary
Zamień kody na czytelne polskie nazwy z opisów.
</knr_handling>

<polish_terminology>
- Przewody: YDYp, YDY, YKY, LgY, NYM (nie "cable")
- Gniazda: "z uziemieniem", "podwójne", "hermetyczne IP44"
- Łączniki: pojedynczy, schodowy, krzyżowy, świecznikowy
- Wyłączniki: nadprądowy B/C/D + amperaż, różnicowoprądowy + mA
- Oprawy: LED downlight, panel, liniowa, hermetyczna IP65
</polish_terminology>

<price_validation>
ORIENTACYJNE CENY NETTO (PLN 2026) — do walidacji:
Przewody: 3x1,5mm² 4-6/mb | 3x2,5mm² 6-9/mb | 5x2,5mm² 12-16/mb
Osprzęt: Gniazdo 12-25/szt | Łącznik 10-20/szt | Puszka 2-4/szt
Aparatura: MCB B16 20-35/szt | RCD 30mA 80-120/szt
Oprawy: LED downlight 40-80/szt | Panel 80-150/szt
Robocizna: Montaż gniazda 15-30/szt | Przewód 8-15/mb | Bruzda 20-40/mb
Jeśli brak cen w danych → podaj realistyczne orientacyjne (NIE 0!).
</price_validation>

<extraction_rules>
1. Przeanalizuj nagłówki i zrozum strukturę (nawet niestandardowe nazwy kolumn)
2. Wyodrębnij pozycje z cenami, normalizuj nazwy do profesjonalnych polskich
3. Pomiń puste wiersze, nagłówki sekcji, sumy, podsumowania
4. Split pricing: materiały → base_material_price, robocizna → base_labor_price
5. Jeśli jedna kolumna "cena": materiał = cena (labor=0), robocizna = labor (mat=0)
6. Dobierz kategorię: Przewody, Osprzęt, Rozdzielnice, Aparatura, Oświetlenie, Robocizna, Inne
7. Popraw/ustandaryzuj nazwy jeśli nieprecyzyjne
</extraction_rules>`;

    const { object } = await generateObject({
      model: google(AI_MODEL_TIER1),
      system: systemPrompt + "\nZwracaj minimalny JSON — krótkie wartości string, bez zbędnych wyjaśnień.",
      prompt: `Plik: ${fileName}\n\n${dataPreview}`,
      schema: z.object({
        items: z.array(z.object({
          name: z.string(),
          unit: z.string(),
          base_material_price: z.number(),
          base_labor_price: z.number(),
          category: z.string(),
        })),
      }),
      temperature: 0.1,
      maxOutputTokens: 4000,
    });

    const items: AICatalogItem[] = object.items || [];

    // Validate and clean items
    const validItems = items
      .filter(item => item.name && item.name.trim().length > 0)
      .map(item => ({
        name: item.name.trim(),
        unit: item.unit || "szt",
        base_material_price: Math.max(0, Number(item.base_material_price) || 0),
        base_labor_price: Math.max(0, Number(item.base_labor_price) || 0),
        category: item.category || "Inne",
      }));

    // Log AI usage
    await supabase.from("ai_usage").insert({
      user_id: user.id,
      feature: "catalog_import",
    });

    return { success: true, items: validItems };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "";
    if (errorMessage.includes("PRO") || errorMessage.includes("subscription")) {
      return { success: false, error: "Ta funkcja wymaga subskrypcji PRO" };
    }
    logger.error("AI import error:", {}, error);
    return { success: false, error: "Wystąpił błąd podczas analizy AI" };
  }
}

/**
 * Batch-import items into the user's catalog.
 * Creates items with optional category matching/creation.
 */
export async function batchImportCatalogItems(
  items: AICatalogItem[],
  visibility: "personal" | "team" = "personal",
  teamId?: string
): Promise<{ success: boolean; count?: number; error?: string }> {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));

  if (!user || !supabase) {
    return { error: "Musisz być zalogowany", success: false };
  }

  if (items.length === 0) {
    return { error: "Brak pozycji do zaimportowania", success: false };
  }

  // Get existing categories
  const { data: existingCategories } = await supabase
    .from("catalog_categories")
    .select("id, name");

  const cats = existingCategories || [];
  const categoryMap = new Map<string, string>();
  for (const cat of cats) {
    categoryMap.set(cat.name.toLowerCase(), cat.id);
  }

  // Fuzzy category lookup: exact → substring → keyword fallback
  const findCategoryId = (aiCategoryName: string): string | null => {
    const q = aiCategoryName.toLowerCase().trim();
    // 1. Exact match
    if (categoryMap.has(q)) return categoryMap.get(q)!;
    // 2. Substring match
    for (const [catName, catId] of categoryMap.entries()) {
      if (catName.includes(q) || q.includes(catName)) return catId;
    }
    // 3. Keyword-based semantic match
    const findCat = (kw: string) => { for (const [n, id] of categoryMap.entries()) { if (n.includes(kw)) return id; } return null; };
    if (/osprzęt|ospret|gniazd|łącznik|puszk|wyłącznik/.test(q)) return findCat("osprzęt") ?? findCat("instalacyjn") ?? null;
    if (/kabel|przewód|ydy|lgy|drut/.test(q)) return findCat("kable") ?? findCat("okablowanie") ?? null;
    if (/oprawa|led|oświetl|downlight/.test(q)) return findCat("oświetlenie") ?? null;
    if (/rozdzielnic|tablica/.test(q)) return findCat("rozdzielnic") ?? null;
    if (/mcb|rcd|rcbo|aparatura|din/.test(q)) return findCat("aparatura") ?? findCat("modularna") ?? null;
    if (/robocizna|montaż|instalacja|pomiar/.test(q)) return findCat("robocizna") ?? null;
    return findCat("instalacje elektryczn") ?? null;
  };

  // Pre-filter: skip items user already has (prevent constraint violations)
  const { data: existingUserItems } = await supabase
    .from("catalog_items")
    .select("name")
    .eq("user_id", user.id)
    .in("name", items.map(i => i.name));

  const existingNames = new Set((existingUserItems ?? []).map(i => i.name.toLowerCase()));
  const newItems = items.filter(i => !existingNames.has(i.name.toLowerCase()));

  if (newItems.length === 0) {
    revalidatePath("/dashboard/catalog");
    return { success: true, count: 0 };
  }

  // Prepare items for insert — apply price guard to fix hallucinated/zero prices
  const insertItems = newItems.map(item => {
    const categoryId = findCategoryId(item.category);

    const guarded = applyPriceGuard({
      name: item.name,
      unit: item.unit,
      base_material_price: item.base_material_price,
      base_labor_price: item.base_labor_price,
      knr_code: null,
    });

    const data: Record<string, string | number | boolean | null> = {
      user_id: user.id,
      name: item.name,
      unit: item.unit,
      base_material_price: guarded.base_material_price,
      base_labor_price: guarded.base_labor_price,
      knr_code: guarded.knr_code,
      category_id: categoryId,
      visibility: visibility,
      is_active: true,
    };

    if (visibility === "team" && teamId) {
      data.team_id = teamId;
    }

    return data;
  });

  // Insert in batches of 50
  let totalInserted = 0;
  for (let i = 0; i < insertItems.length; i += 50) {
    const batch = insertItems.slice(i, i + 50);
    const { error } = await supabase.from("catalog_items").insert(batch);
    if (error) {
      logger.error("Batch insert error:", {}, error);
      if (totalInserted === 0) {
        return { success: false, error: "Błąd podczas importu pozycji" };
      }
      // Partial success
      break;
    }
    totalInserted += batch.length;
  }

  revalidatePath("/dashboard/catalog");
  return { success: true, count: totalInserted };
}
