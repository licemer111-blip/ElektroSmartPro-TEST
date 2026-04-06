"use server";

import { logger } from "@/lib/logger";
import { tryAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { checkAndIncrementAiUsage } from "@/lib/ai-usage";
import type { DataVisibility } from "@/lib/types/database";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { buildDynamicSystemPrompt, injectKbContext, GEMINI_RAG_MODEL } from "@/lib/ai-master-brain";
import { fetchKbContext, listKbFileNames } from "@/lib/kb-storage";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { lookupKnrByName, buildLocalKnrContext } from "@/lib/knr-local-context";
import { applyPriceGuard } from "@/lib/utils/price-validator";
import { clampToBenchmark, buildBenchmarkPromptContext } from "@/lib/data/material-benchmarks";

// ─── RAG KB loader (with timeout) ────────────────────────────────────────────
async function fetchCatalogKbContext(): Promise<string | null> {
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

// v10.5: Catalog items reference now sourced from material-benchmarks.ts (single source of truth)
const CATALOG_ITEMS_REFERENCE = `
WZORCE POZYCJI KATALOGOWYCH ElektroSmart PRO (Polska 2026, ceny NETTO):

${buildBenchmarkPromptContext()}

══ ROBOCIZNA ══
- Montaż gniazda / łącznika | szt | mat: 0 | rob: 25
- Montaż gniazda hermetycznego IP44 | szt | mat: 0 | rob: 35
- Montaż gniazda CEE przemysłowego | szt | mat: 0 | rob: 55
- Montaż floorboxa | szt | mat: 0 | rob: 120
- Montaż puszki podtynkowej | szt | mat: 0 | rob: 15
- Montaż puszki hermetycznej IP65 | szt | mat: 0 | rob: 25
- Układanie przewodu w rurce / korytku | mb | mat: 0 | rob: 12
- Kucie bruzd pod przewody | mb | mat: 0 | rob: 35
- Montaż korytka kablowego | mb | mat: 0 | rob: 18
- Montaż oprawy oświetleniowej | szt | mat: 0 | rob: 40
- Montaż oprawy highbay na wysokości | szt | mat: 0 | rob: 85
- Montaż oprawy awaryjnej | szt | mat: 0 | rob: 45
- Montaż rozdzielnicy | szt | mat: 0 | rob: 250
- Podłączenie aparatury w rozdzielnicy | kpl | mat: 0 | rob: 180
- Montaż i podłączenie silnika | kpl | mat: 0 | rob: 320
- Montaż czujnika / detektora | szt | mat: 0 | rob: 35
- Montaż kamery / domofonu | szt | mat: 0 | rob: 120
- Pomiary elektryczne instalacji | kpl | mat: 0 | rob: 350
- Pomiary instalacji odgromowej | kpl | mat: 0 | rob: 280
- Uruchomienie i regulacja systemu | kpl | mat: 0 | rob: 450

JEDNOSTKI: szt, mb, kpl, h, m², m³
`;

interface GenerateCatalogItemsOptions {
  description: string;
  visibility?: DataVisibility;
  team_id?: string;
}

export async function generateCatalogItemsWithAI(
  descriptionOrOptions: string | GenerateCatalogItemsOptions
) {
  // Support both old and new API formats
  const options: GenerateCatalogItemsOptions = 
    typeof descriptionOrOptions === 'string' 
      ? { description: descriptionOrOptions }
      : descriptionOrOptions;
  
  const { description, visibility = 'personal', team_id } = options;

  try {
    const { user, supabase } = await tryAuth();

    if (!user || !supabase) {
      return { success: false, error: "Brak autoryzacji" };
    }

    // AI usage limit for demo users (5 free calls/month)
    const aiCheck = await checkAndIncrementAiUsage(user.id, "generateCatalogItems");
    if (!aiCheck.allowed) return { success: false, error: aiCheck.error || "Limit AI wyczerpany" };

    // 3. Check API key configuration
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      logger.error("GOOGLE_GENERATIVE_AI_API_KEY not configured", {});
      return { success: false, error: "AI service is not configured. Please contact support." };
    }

    // 4. Check AI usage limits
    const { data: usageCount } = await supabase.rpc('get_monthly_ai_usage', {
      p_user_id: user.id,
      p_feature: 'catalog_creator'
    });

    if (usageCount && usageCount >= 100) {
      return {
        success: false,
        error: "Wykorzystano limit 100 żądań AI w tym miesiącu",
      };
    }

    // 5. Get available categories for reference
    const { data: categories } = await supabase
      .from("catalog_categories")
      .select("id, name, object_type_id")
      .order("name");

    const categoryList = categories?.map(c => `${c.name} (ID: ${c.id})`).join(", ") || "Brak kategorii";

    // 6. Fetch KB context in parallel; inject compact KNR norms (limit 40 — prevents context overload)
    const kbContext = await fetchCatalogKbContext();
    const knrNormsContext = buildLocalKnrContext(62, 40);

    // Build system prompt via Master Brain + inject KB
    const basePrompt = await buildDynamicSystemPrompt("catalog");
    const masterPrompt = injectKbContext(basePrompt, kbContext);

    const knrBlock = `<knr_norms_table>
${knrNormsContext}
FORMAT: [KOD KNR]: [OPIS] → [NORMA rbh/jednostkę] = [CENA PLN przy 62 zł/rbh]
Używaj DOKŁADNIE tych kodów w polu knr_code. OBLICZ base_labor_price = labor_hours × 62 zł.
</knr_norms_table>`;

    // Dynamic part (changes per user — not cached)
    const dynamicCatalogContext = `DOSTĘPNE KATEGORIE (używaj tych nazw):
${categoryList}

${knrBlock}


<price_reference>
${CATALOG_ITEMS_REFERENCE}
</price_reference>

<reality_check>
══ KONTROLA CENY RYNKOWEJ — HARD LIMITS (Polska 2026, NETTO) ══
MATERIĄŁY — LIMITY MAKSYMALNE:
• YDYp 3x1,5mm²: MAX 8 zł/mb (typowo 5 zł/mb)
• YDYp 3x2,5mm²: MAX 10 zł/mb (typowo 7 zł/mb)
• YDYp 5x2,5mm²: MAX 18 zł/mb (typowo 14 zł/mb)
• Puszka podtynkowa Ø60: MAX 8 zł/szt (typowo 3 zł/szt)
• Gniazdo pojedyncze: MAX 30 zł/szt, Gniazdo podwójne: MAX 45 zł/szt
• MCB B16 1P: MAX 40 zł/szt
ROBOCIZNA — LIMITY MAKSYMALNE:
• Montaż gniazda/łącznika: MAX 60 zł/szt (typowo 25–35 zł)
• Kucie bruzd: MAX 30 zł/mb (typowo ~20 zł/mb). NIGDY 120 zł/mb!
• Uładanie przewodów w tynku: MAX 15 zł/mb (typowo 10–12 zł/mb)
• Montaż oprawy: MAX 75 zł/szt
ILOŚCI MATERIAŁÓW W ZESTAWIE (na 1 punkt):
• Kabel/przewod dla 1 gniazda: MAX 5–7 mb. Jeśli AI daje 15 mb → to błąd! Użyj 5 mb.
• Bruzdowanie dla 1 gniazda: MAX 5–7 mb. Nie 15!
• Kabel dla 1 łącznika: MAX 4–5 mb.
RE-VERIFY: Przed zapisem — kabel kabla < 10 zł/mb? Bruzda < 30 zł/mb? Ilość kabla ≤ 7 mb/punkt?
Jeśli NIE — podziel przez 5.
</reality_check>

<output_rules>
1. Generuj 5–20 pozycji zgodnie z opisem użytkownika.
2. Każda pozycja materiałowa: base_material_price > 0, base_labor_price = 0.
3. Każda pozycja robocizny: labor_hours > 0 z <knr_norms_table>. base_labor_price = labor_hours × 62 (OBLICZ, nie zgaduj). MINIMUM: szt≥20zł, mb≥12zł.
4. ZAKAZ: nigdy oba pola = 0 jednocześnie. Robocizna ZAWSZE > 0.
5. Jednostki: mb (przewody/kable/korytka), szt (osprzęt/aparatura/oprawy), kpl (zestawy/pomiary), h (czas), m² (powierzchnie).
6. Opis: parametry techniczne (przekrój, moc, IP, wymiary) + kod normy KNR jeśli dotyczy.
7. Dopasuj kategorię do listy dostępnych kategorii.
8. ═══ KNR dla ROBOCIZNY: OBOWIĄZKOWY — NIGDY null ═══
   Używaj kodów z <knr_norms_table>. Kody bazowe gdy brak dokładnego:
   • Montaż osprzętu (gniazdo/łącznik): KNR 5-04 0202-01
   • Montaż puszki podtynkowej: KNR 5-04 0601-01
   • Układanie przewodów YDYp w tynku: KNR 5-04 0101-01
   • Kucie bruzd (cegła): KNR 5-04 0701-01
   • Montaż oprawy oświetleniowej: KNR 5-04 0401-01
   • Montaż aparatury modułowej MCB/RCD: KNR 5-08 0201-01
   • Montaż rozdzielnicy: KNR 5-08 0101-01
   • Pomiary i odbiory: KNR 5-04 1501-01
   • Montaż kamery/domofonu: KNR 5-09 0401-01
9. KNR dla materiałów: opcjonalny — używaj z <knr_norms_table> jeśli pasuje, wpisz null jeśli brak.
10. Zwracaj minimalny JSON — bez zbędnych komentarzy.
</output_rules>

<output_example>
[
  {
    "name": "Przewód YDYp 3x1,5mm²",
    "description": "Przewód YDYp 3x1,5mm², 100m",
    "category_name": "Przewody i kable",
    "unit": "mb",
    "base_material_price": 5,
    "base_labor_price": 0,
    "is_assembly_parent": false,
    "knr_code": "KNR 5-04 0101-01"
  },
  {
    "name": "Montaż gniazda",
    "description": "Montaż gniazda pojedynczego",
    "category_name": "Robocizna",
    "unit": "szt",
    "base_material_price": 0,
    "base_labor_price": 25,
    "is_assembly_parent": false,
    "knr_code": "KNR 5-04 0202-01"
  }
]
</output_example>
`;

    // 7. Call Gemini via Master Brain model
    const { object } = await generateObject({
      model: google(GEMINI_RAG_MODEL),
      system: `${masterPrompt}\n\n${dynamicCatalogContext}`,
      prompt: description,
      schema: z.object({
        items: z.array(z.object({
          name: z.string(),
          description: z.string().nullable(),
          category_name: z.string(),
          unit: z.string(),
          base_material_price: z.number(),
          base_labor_price: z.number(),
          is_assembly_parent: z.boolean().nullable(),
          knr_code: z.string().nullable().describe("Kod KNR np. 'KNR 5-08 0401-03' lub 'szacunek'"),
          labor_hours: z.number().nullable().describe("Czas montażu w r-g na jednostkę, np. 0.15"),
        })),
      }),
      temperature: 0.25,
      maxOutputTokens: 4000,
    });

    const generatedItems = object.items || [];

    if (generatedItems.length === 0) {
      return {
        success: false,
        error: "AI nie wygenerowało pozycji",
      };
    }

    // Map category names to IDs (safer than trusting AI with UUIDs)
    const categoryNameToId = new Map(
      categories?.map(c => [c.name.toLowerCase().trim(), c.id]) || []
    );

    // Find best matching category for each item
    const validatedItems = generatedItems
      .map(item => {
        // Try exact match first
        let categoryId = categoryNameToId.get(item.category_name?.toLowerCase().trim());
        
        // If no exact match, try fuzzy match
        if (!categoryId && item.category_name) {
          const searchTerm = item.category_name.toLowerCase();
          for (const [catName, catId] of categoryNameToId.entries()) {
            if (catName.includes(searchTerm) || searchTerm.includes(catName)) {
              categoryId = catId;
              break;
            }
          }
        }
        
        // Smart fallback: keyword-based semantic mapping
        if (!categoryId && categories && categories.length > 0) {
          const isLaborItem = item.base_labor_price > 0 && item.base_material_price === 0;
          const nameLower = item.name.toLowerCase();
          const findCat = (kw: string) => categories.find(c => c.name.toLowerCase().includes(kw));

          if (isLaborItem) {
            categoryId = findCat("robocizna")?.id ?? categories[0].id;
          } else if (/gniazd|łącznik|puszk|ramk|wyłącznik|przełącznik|osprzęt|ospret|schodow|krzyżow/.test(nameLower)) {
            categoryId = findCat("osprzęt")?.id ?? findCat("instalacyjn")?.id ?? findCat("elektryczn")?.id ?? categories[0].id;
          } else if (/kabel|przewód|ydy|ydyp|nkt|lgy|kabel|drut/.test(nameLower)) {
            categoryId = findCat("kable")?.id ?? findCat("okablowanie")?.id ?? categories[0].id;
          } else if (/oprawa|świetlówk|led|luminar|downlight|kinkiet|żyrandol|plafon|oświetl/.test(nameLower)) {
            categoryId = findCat("oświetlenie")?.id ?? categories[0].id;
          } else if (/rozdzielnic|tablica|tdd|roz\./.test(nameLower)) {
            categoryId = findCat("rozdzielnic")?.id ?? categories[0].id;
          } else if (/mcb|rcd|rcbo|bezpiecznik|wyłącznik nadprąd|aparat|din/.test(nameLower)) {
            categoryId = findCat("aparatura")?.id ?? findCat("modularna")?.id ?? categories[0].id;
          } else if (/korytko|koryto|trasa|drabinka|rura/.test(nameLower)) {
            categoryId = findCat("trasy")?.id ?? findCat("koryto")?.id ?? categories[0].id;
          } else if (/pomiar|protokół|badani|rezystancj|impedancj/.test(nameLower)) {
            categoryId = findCat("pomiar")?.id ?? findCat("robocizna")?.id ?? categories[0].id;
          } else {
            categoryId = findCat("instalacje elektryczn")?.id ?? categories[0].id;
          }
          logger.error(`[AICatalog] No category match for "${item.category_name}" (item: "${item.name}"), keyword fallback applied`);
        }

        return {
          ...item,
          category_id: categoryId
        };
      })
      .filter(item => item.category_id); // Remove items without valid category

    if (validatedItems.length === 0) {
      return {
        success: false,
        error: "Nie udało się dopasować kategorii dla wygenerowanych pozycji",
      };
    }

    // Post-processing: calculate labor from KNR norms, enforce KNR codes, clamp prices
    const DEFAULT_HOURLY_RATE_CATALOG = 62;
    const processedItems = validatedItems.map(item => {
      let knrCode = item.knr_code ?? null;
      let laborPrice = item.base_labor_price;
      const unit = item.unit ?? "szt";

      // PRIORITY: calculate labor_price from labor_hours × rate (authoritative over AI guess)
      const laborHours = (item as typeof item & { labor_hours?: number | null }).labor_hours;
      if (laborHours && laborHours > 0) {
        laborPrice = Math.round(laborHours * DEFAULT_HOURLY_RATE_CATALOG * 100) / 100;
      }

      // Ensure KNR code for labor items via local lookup
      if (laborPrice > 0 || laborHours) {
        if (!knrCode) {
          const knrMatch = lookupKnrByName(item.name);
          knrCode = knrMatch?.code ?? null;
        }
      }

      // v10.5: Benchmark validation for material prices before price guard
      let matPrice = item.base_material_price;
      if (matPrice > 0) {
        const { price: benchValidated } = clampToBenchmark(item.name, unit, matPrice);
        matPrice = benchValidated;
      }

      const guarded = applyPriceGuard({
        ...item,
        base_material_price: matPrice,
        base_labor_price: laborPrice,
        knr_code: knrCode,
        unit,
      });
      return { ...item, ...guarded };
    });

    // 9. Validate material item knr_codes against live es_dictionary (labor KNR kept as-is)
    const rawMaterialCodes = processedItems
      .filter(i => i.base_labor_price === 0)
      .map(i => i.knr_code)
      .filter((c): c is string => !!c && c !== 'szacunek');

    let verifiedCodes = new Set<string>();
    if (rawMaterialCodes.length > 0) {
      const { data: found } = await supabaseAdmin
        .from('es_dictionary')
        .select('knr_ref')
        .in('knr_ref', rawMaterialCodes);
      found?.forEach(r => verifiedCodes.add(r.knr_ref));
    }

    // Insert generated items into database with ai_generated flag
    const itemsToInsert = processedItems.map(item => {
      const laborHours = (item as typeof item & { labor_hours?: number | null }).labor_hours;
      return {
        user_id: user.id,
        category_id: item.category_id,
        name: item.name,
        description: item.description || null,
        unit: item.unit,
        base_material_price: item.base_material_price || 0,
        base_labor_price: item.base_labor_price || 0,
        is_assembly_parent: item.is_assembly_parent || false,
        is_active: true,
        knr_code: item.base_labor_price > 0
          ? (item.knr_code ?? null)
          : ((item.knr_code && verifiedCodes.has(item.knr_code)) ? item.knr_code : null),
        labor_norm_rbh: (laborHours && laborHours > 0) ? laborHours : null,
        market_comment: "AI Generated",
        visibility: visibility,
        team_id: visibility === 'team' ? team_id : null,
      };
    });

    // Pre-filter: skip items the user already has (by name) — prevents silent drops from global-scope upsert
    const { data: existingUserItems } = await supabase
      .from("catalog_items")
      .select("name")
      .eq("user_id", user.id)
      .in("name", itemsToInsert.map(i => i.name));

    const existingNames = new Set((existingUserItems ?? []).map(i => i.name.toLowerCase()));
    const newItems = itemsToInsert.filter(i => !existingNames.has(i.name.toLowerCase()));

    if (newItems.length === 0) {
      return { success: true, createdCount: 0 };
    }

    const { data: insertedItems, error: insertError } = await supabase
      .from("catalog_items")
      .insert(newItems)
      .select();

    if (insertError) {
      logger.error("Error inserting items:", {}, insertError);
      return {
        success: false,
        error: `Błąd zapisu do bazy danych: ${insertError.message}`,
      };
    }

    // Verify that market_comment was actually saved

    // 8. Log AI usage
    await supabase.from("ai_usage_logs").insert({
      user_id: user.id,
      feature: "catalog_creator",
    });

    return {
      success: true,
      createdCount: insertedItems?.length || 0,
      knrVerifiedCount: verifiedCodes.size,
    };

  } catch (error) {
    logger.error("AI Catalog Generation Error:", {}, error);
    return {
      success: false,
      error: "Błąd generowania pozycji",
    };
  }
}
