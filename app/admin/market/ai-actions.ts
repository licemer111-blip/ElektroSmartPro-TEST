"use server";

import { requireAdmin } from "@/lib/utils/admin";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { AI_MODEL_TIER1 } from "@/lib/ai-models";
import { z } from "zod";

// ─── 1. AI SMART CSV IMPORT ────────────────────────────────────────────────────
// Takes raw CSV text (messy, unstructured) and AI classifies each row

interface AiProcessedItem {
  name: string;
  category_name: string;
  unit: string;
  base_material_price: number;
  base_labor_price: number;
  ai_confidence: "high" | "medium" | "low";
  ai_note: string | null;
}

export async function aiProcessCsvData(
  rawCsvText: string
): Promise<{ items: AiProcessedItem[]; error?: string }> {
  try {
    await requireAdmin();

    const supabase = await createClient();

    // Get existing categories
    const { data: categories } = await supabase
      .from("catalog_categories")
      .select("name");
    const categoryNames = categories?.map((c) => c.name) || [];

    const systemPrompt = `<role>
Specjalista ds. katalogów materiałów elektroinstalacyjnych, normalizacja danych wg standardów polskiej branży.
</role>

<task>
Przeanalizuj surowe dane CSV. Dla każdego wiersza:
1. Znormalizuj nazwę (literówki, nazwy branżowe)
2. Przypisz kategorię z listy
3. Ustal jednostkę (szt, mb, m², kpl, godz)
4. Rozdziel cenę na materiał i robociznę (split: ~60/40 dla materiałów, odwrotnie dla prac)
5. Oceń pewność: high/medium/low
</task>

<categories>
${categoryNames.join(", ")}
</categories>

<price_ranges>
Przewody: mat. 2–15 zł/mb, rob. 1–5 zł/mb
Gniazda/łączniki: mat. 10–50 zł/szt, rob. 5–25 zł/szt
Puszki: mat. 1–5 zł/szt, rob. 2–5 zł/szt
Rozdzielnice: mat. 50–500 zł/szt, rob. 30–200 zł/szt
Aparatura modułowa (MCB, RCD): mat. 20–300 zł/szt, rob. 10–30 zł/szt
Oprawy LED: mat. 30–500 zł/szt, rob. 15–60 zł/szt
Ceny PLN netto.
</price_ranges>`;

    const { object } = await generateObject({
      model: google(AI_MODEL_TIER1),
      messages: [
        {
          role: "system" as const,
          content: systemPrompt + "\nZwracaj minimalny JSON — krótkie wartości string, bez zbędnych wyjaśnień.",
        },
        { role: "user" as const, content: `Przetwórz te dane CSV:\n\n${rawCsvText.slice(0, 8000)}` },
      ],
      schema: z.object({
        items: z.array(z.object({
          name: z.string(),
          category_name: z.string(),
          unit: z.string(),
          base_material_price: z.number(),
          base_labor_price: z.number(),
          ai_confidence: z.enum(["high", "medium", "low"]),
          ai_note: z.string().nullable(),
        })),
      }),
      maxOutputTokens: 4000,
      temperature: 0.1,
    });

    const items: AiProcessedItem[] = object.items || [];

    return { items };
  } catch (error) {
    logger.error("AI CSV processing error", {}, error);
    return {
      items: [],
      error: error instanceof Error ? error.message : "Błąd przetwarzania AI",
    };
  }
}

// ─── 2. AI ITEM GENERATOR ──────────────────────────────────────────────────────
// Generate catalog items from text description

export async function aiGenerateCatalogItems(
  description: string
): Promise<{ items: AiProcessedItem[]; error?: string }> {
  try {
    await requireAdmin();

    const supabase = await createClient();

    const { data: categories } = await supabase
      .from("catalog_categories")
      .select("name");
    const categoryNames = categories?.map((c) => c.name) || [];

    const systemPrompt2 = `<role>
Specjalista ds. katalogów materiałów elektroinstalacyjnych, cenniki hurtowe 2026.
</role>

<task>
Wygeneruj 5–20 pozycji katalogowych na podstawie opisu. Każda pozycja:
- profesjonalna nazwa branżowa
- split pricing: material_price + labor_price osobno
- kategoria z listy: ${categoryNames.join(", ")}
- jednostka: szt, mb, m², kpl, godz
</task>

<price_reference>
Przewód YDYp 3x1.5mm²: mat. 2.80/mb, rob. 1.50/mb
Przewód YDYp 3x2.5mm²: mat. 3.50/mb, rob. 1.50/mb
Gniazdo z uziemieniem: mat. 15.00/szt, rob. 12.00/szt
Łącznik świecznikowy: mat. 18.00/szt, rob. 10.00/szt
Puszka podtynkowa Ø60: mat. 1.80/szt, rob. 3.00/szt
Rozdzielnica 12-mod.: mat. 80.00/szt, rob. 120.00/szt
Wyłącznik nadprądowy MCB C16: mat. 22.00/szt, rob. 8.00/szt
Wyłącznik różnicowopądowy RCD 30mA: mat. 85.00/szt, rob. 12.00/szt
Oprawa LED panel 60x60: mat. 120.00/szt, rob. 35.00/szt
Bruzda w betonie: mat. 0.00/mb, rob. 18.00/mb
Ceny PLN netto.
</price_reference>`;

    const { object: obj2 } = await generateObject({
      model: google(AI_MODEL_TIER1),
      messages: [
        {
          role: "system" as const,
          content: systemPrompt2 + "\nZwracaj minimalny JSON — krótkie wartości string, bez zbędnych wyjaśnień.",
        },
        { role: "user" as const, content: `Wygeneruj pozycje katalogowe dla: ${description}` },
      ],
      schema: z.object({
        items: z.array(z.object({
          name: z.string(),
          category_name: z.string(),
          unit: z.string(),
          base_material_price: z.number(),
          base_labor_price: z.number(),
          ai_confidence: z.enum(["high", "medium", "low"]),
          ai_note: z.string().nullable(),
        })),
      }),
      maxOutputTokens: 4000,
      temperature: 0.1,
    });

    const items: AiProcessedItem[] = obj2.items || [];

    return { items };
  } catch (error) {
    logger.error("AI item generation error", {}, error);
    return {
      items: [],
      error: error instanceof Error ? error.message : "Błąd generowania AI",
    };
  }
}

// ─── 3. AI PRICE VALIDATOR ─────────────────────────────────────────────────────
// Scan existing catalog items for anomalies

interface PriceAnomaly {
  itemId: string;
  itemName: string;
  issue: string;
  severity: "critical" | "warning" | "info";
  suggestion: string;
  suggestedMaterialPrice: number | null;
  suggestedLaborPrice: number | null;
}

export async function aiValidatePrices(): Promise<{
  anomalies: PriceAnomaly[];
  error?: string;
}> {
  try {
    await requireAdmin();

    const supabase = await createClient();

    // Get all global items
    const { data: items } = await supabase
      .from("catalog_items")
      .select("id, name, base_material_price, base_labor_price, unit, catalog_categories(name)")
      .is("user_id", null)
      .order("name");

    if (!items || items.length === 0) {
      return { anomalies: [], error: "Brak pozycji w katalogu" };
    }

    // Take a sample (max 100 items to limit API cost)
    const sample = items.slice(0, 100);
    const itemsText = sample
      .map((item) => {
        const cat = (item as Record<string, unknown>).catalog_categories as { name: string }[] | { name: string } | null;
        const categoryName = Array.isArray(cat) ? cat[0]?.name : cat?.name;
        return `${item.id}|${item.name}|${categoryName || "?"}|${item.unit}|mat:${item.base_material_price}|rob:${item.base_labor_price}`;
      })
      .join("\n");

    const systemPrompt3 = `<role>
Audytor cenowy materiałów elektroinstalacyjnych, baza cenowa: hurtownie polskie 2026.
</role>

<task>
Przeanalizuj pozycje katalogowe (format: id|nazwa|kategoria|jm|mat:cena|rob:cena).
Zidentyfikuj anomalie cenowe. Max 20 wyników.
</task>

<rules>
Kryteria anomalii:
1. Cena zerowa (material_price=0 dla materiału fizycznego lub labor_price=0 dla pracy montażowej)
2. Cena poniżej 50% wartości rynkowej (np. gniazdo mat. <5 zł, przewód <1 zł/mb)
3. Cena powyżej 200% wartości rynkowej (np. puszka >20 zł, przewód 3x1.5 >15 zł/mb)
4. Zamienione ceny (robocizna droższa niż materiał dla typowych produktów fizycznych)
5. Duplikaty nazw (pozycje opisujące ten sam produkt)
Wyjątek: czysta robocizna (bruzdy, montaż) — material_price=0 jest poprawne.
</rules>`;

    const { object: obj3 } = await generateObject({
      model: google(AI_MODEL_TIER1),
      messages: [
        {
          role: "system" as const,
          content: systemPrompt3 + "\nZwracaj minimalny JSON — krótkie wartości string, bez zbędnych wyjaśnień.",
        },
        { role: "user" as const, content: `Przeanalizuj te pozycje:\n\n${itemsText}` },
      ],
      schema: z.object({
        anomalies: z.array(z.object({
          itemId: z.string(),
          itemName: z.string(),
          issue: z.string(),
          severity: z.enum(["critical", "warning", "info"]),
          suggestion: z.string(),
          suggestedMaterialPrice: z.number().nullable(),
          suggestedLaborPrice: z.number().nullable(),
        })),
      }),
      maxOutputTokens: 3000,
      temperature: 0.1,
    });

    const anomalies: PriceAnomaly[] = obj3.anomalies || [];

    return { anomalies };
  } catch (error) {
    logger.error("AI price validation error", {}, error);
    return {
      anomalies: [],
      error: error instanceof Error ? error.message : "Błąd walidacji AI",
    };
  }
}

// ─── 4. AI BULK IMPORT (processed items) ────────────────────────────────────────
// Import AI-processed items into catalog

export async function aiImportProcessedItems(
  items: AiProcessedItem[]
): Promise<{ imported: number; skipped: number; errors: string[] }> {
  try {
    await requireAdmin();

    const supabase = await createClient();

    // Get categories
    const { data: categories } = await supabase
      .from("catalog_categories")
      .select("id, name");
    const categoryMap = new Map(
      categories?.map((cat) => [cat.name.toLowerCase(), cat.id]) || []
    );

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    const CHUNK_SIZE = 100;

    for (let i = 0; i < items.length; i += CHUNK_SIZE) {
      const chunk = items.slice(i, i + CHUNK_SIZE);

      const toInsert = chunk
        .map((item) => {
          const categoryId = categoryMap.get(item.category_name.toLowerCase());
          if (!categoryId) {
            // Try partial match
            const partial = Array.from(categoryMap.entries()).find(([key]) =>
              key.includes(item.category_name.toLowerCase()) ||
              item.category_name.toLowerCase().includes(key)
            );
            if (partial) {
              return {
                name: item.name.trim(),
                category_id: partial[1],
                unit: item.unit || "szt",
                base_material_price: Math.max(0, item.base_material_price || 0),
                base_labor_price: Math.max(0, item.base_labor_price || 0),
                user_id: null,
                is_active: true,
                price_trend: "stable" as const,
                confidence_level: item.ai_confidence || ("medium" as const),
                last_verified_at: new Date().toISOString(),
              };
            }
            errors.push(`Brak kategorii "${item.category_name}" dla "${item.name}"`);
            skipped++;
            return null;
          }

          return {
            name: item.name.trim(),
            category_id: categoryId,
            unit: item.unit || "szt",
            base_material_price: Math.max(0, item.base_material_price || 0),
            base_labor_price: Math.max(0, item.base_labor_price || 0),
            user_id: null,
            is_active: true,
            price_trend: "stable" as const,
            confidence_level: item.ai_confidence || ("medium" as const),
            last_verified_at: new Date().toISOString(),
          };
        })
        .filter(Boolean);

      if (toInsert.length > 0) {
        const { error, data } = await supabase
          .from("catalog_items")
          .insert(toInsert)
          .select("id");

        if (error) {
          errors.push(`Chunk ${Math.floor(i / CHUNK_SIZE) + 1}: ${error.message}`);
          skipped += toInsert.length;
        } else {
          imported += data?.length || toInsert.length;
        }
      }
    }

    revalidatePath("/admin/market");
    revalidatePath("/dashboard/catalog");
    revalidatePath("/dashboard/market");

    return { imported, skipped, errors };
  } catch (error) {
    logger.error("AI import error", {}, error);
    return {
      imported: 0,
      skipped: items.length,
      errors: [error instanceof Error ? error.message : "Błąd importu"],
    };
  }
}
