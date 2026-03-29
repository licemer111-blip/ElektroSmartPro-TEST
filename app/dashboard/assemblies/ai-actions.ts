"use server";

import { logger } from "@/lib/logger";
import { requireAuth } from "@/lib/auth";
import { checkAndIncrementAiUsage } from "@/lib/ai-usage";
import { AI_FUNCTION_NAMES } from "@/lib/ai-quota-config";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import type { DataVisibility } from "@/lib/types/database";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { buildDynamicSystemPrompt, injectKbContext, GEMINI_RAG_MODEL } from "@/lib/ai-master-brain";
import { fetchKbContext, listKbFileNames } from "@/lib/kb-storage";
import { buildLocalKnrContext, lookupKnrByName } from "@/lib/knr-local-context";
import { clampPrice, clampQuantity, clampLaborNorm, lookupKnrForLabor, LABOR_UNIT_FALLBACK } from "@/lib/utils/price-validator";

// ─── RAG KB loader (with timeout) ────────────────────────────────────────────
async function fetchAssembliesKbContext(): Promise<string | null> {
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

/** Fallback rate used only when the user has no rate configured in their profile. */
const DEFAULT_HOURLY_RATE = 62;

interface GeneratedAssembly {
  name: string;
  description: string;
  category: string | null;
  items: {
    name: string;
    quantity: number;
    unit: string;
    type: 'material' | 'labor';
    estimatedPrice: number | null;
    knr_code: string | null;
    labor_norm_rbh: number | null;
    notes: string | null;
  }[];
}

interface GenerateAssembliesOptions {
  description: string;
  visibility?: DataVisibility;
  team_id?: string;
}

/**
 * Generate assemblies (zestawy) using AI from natural language description
 * 
 * Example inputs:
 * - "Mieszkanie 60m2 - standardowa instalacja"
 * - "Biuro 100m2 - LED + sterowanie WiFi"
 * - "Salon 25m2 - oświetlenie smart home"
 */
export async function generateAssembliesWithAI(
  descriptionOrOptions: string | GenerateAssembliesOptions
) {
  // Support both old and new API formats
  const options: GenerateAssembliesOptions = 
    typeof descriptionOrOptions === 'string' 
      ? { description: descriptionOrOptions }
      : descriptionOrOptions;
  
  const { description, visibility = 'personal', team_id } = options;
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));

    if (!user || !supabase) {
      return { success: false, error: "Musisz być zalogowany" };
    }

    // AI usage limit: DEMO=5/mies., PRO=200/mies. (centralized quota)
    const aiCheck = await checkAndIncrementAiUsage(user.id, AI_FUNCTION_NAMES.aiAssemblies);
    if (!aiCheck.allowed) return { success: false, error: aiCheck.error || "Limit AI wyczerpany" };

    // Check if API key is configured
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      logger.error("GOOGLE_GENERATIVE_AI_API_KEY not configured", {});
      return { success: false, error: "Klucz API Google AI nie jest skonfigurowany. Skontaktuj się z administratorem." };
    }

    // Resolve effective hourly rate from user profile (B1 Hotfix: replace hardcoded 62)
    const { data: profileRate } = await supabase
      .from("profiles")
      .select("hourly_rate, use_custom_rates, custom_labor_rate")
      .eq("id", user.id)
      .single();
    const effectiveRate: number = (() => {
      if (profileRate?.use_custom_rates && profileRate.custom_labor_rate && profileRate.custom_labor_rate > 0) {
        return profileRate.custom_labor_rate;
      }
      if (profileRate?.hourly_rate && profileRate.hourly_rate > 0) {
        return profileRate.hourly_rate;
      }
      return DEFAULT_HOURLY_RATE;
    })();

    // Get existing assembly categories for context
    const { data: existingCategories } = await supabase
      .from("assembly_categories")
      .select("name")
      .eq("user_id", user.id)
      .limit(20);

    const categoriesContext = existingCategories
      ?.map(cat => cat.name)
      .join(", ") || "Oświetlenie, Gniazda, Rozdzielnice, Instalacje";

    // KNR norms from local JSON (no DB call, always available) — limit 40 to prevent context overload
    const knrContext = buildLocalKnrContext(effectiveRate, 40);

    // KB context in parallel
    const kbContext = await fetchAssembliesKbContext();

    // Build system prompt via Master Brain + inject KB
    const basePrompt = await buildDynamicSystemPrompt("assemblies");
    const systemPrompt = injectKbContext(basePrompt, kbContext);

    // Dynamic user context
    const dynamicAssemblyContext = `<user_categories>
${categoriesContext}
</user_categories>

<knr_norms_table>
${knrContext}
FORMAT: [KOD KNR] | [OPIS] → [NORMA rbh/jednostkę] = [CENA PLN robocizna przy ${effectiveRate} zł/rbh]
Używaj DOKŁADNIE tych kodów w polu knr_code. Obliczaj estimatedPrice = labor_norm_rbh × ${effectiveRate}.
</knr_norms_table>

<reality_check>
══ KONTROLA CEN — HARD LIMITS (Polska 2026, NETTO) ══
MATERIAŁY — LIMITY MAKSYMALNE (cena za JEDNOSTKĘ):
• YDYp 3x1,5mm²: MAX 12 zł/mb (typowo 5,5 zł/mb)
• YDYp 3x2,5mm²: MAX 14 zł/mb (typowo 7,2 zł/mb)
• YDYp 5x2,5mm²/5x4mm²: MAX 28 zł/mb (typowo 14,5 zł/mb)
• Puszka podtynkowa Ø60: MAX 12 zł/szt (typowo 3,5 zł/szt)
• Gniazdo pojedyncze: MAX 35 zł/szt | Gniazdo podwójne: MAX 55 zł/szt
ILOŚCI W ZESTAWIE (na 1 punkt instalacyjny):
• Kabel/przewód dla 1 gniazda: MAX 7 mb (typowo 5 mb). NIGDY 15 mb!
• Bruzdowanie dla 1 gniazda: MAX 7 mb (typowo 5 mb).
• Kabel dla 1 łącznika: MAX 5 mb.
ROBOCIZNA — OBLICZAJ Z NORMY KNR:
• estimatedPrice MUSI być = labor_norm_rbh × ${effectiveRate} zł
• ZAKAZ podawania 0 dla pozycji type=labor
• Kucie bruzd: max 30 zł/mb | Układanie: max 15 zł/mb | Montaż gniazda: max 60 zł/szt
</reality_check>

<output_rules>
1. Generuj ZAWSZE DOKŁADNIE 3 zestawy — nawet jeśli opis jest krótki. Przykład: dla "gniazdo pojedyncze" generuj: (a) standard p/t, (b) IP44 łazienka, (c) z USB/DATA.
2. Każdy zestaw: kompletna lista pozycji (materiały + robocizna).
3. Każdy zestaw MUSI zawierać ZARÓWNO type="material" JAK I type="labor".
4. Dla KAŻDEJ pozycji robocizny: OBOWIĄZKOWE pola knr_code + labor_norm_rbh z <knr_norms_table>.
5. estimatedPrice dla robocizny = labor_norm_rbh × ${effectiveRate}. NIGDY 0!
6. estimatedPrice dla materiałów = cena katalogowa za jednostkę (bez robocizny).
7. Zwracaj minimalny JSON — bez zbędnych komentarzy.
8. MINIMUM 3 zestawy w odpowiedzi — nigdy mniej!
</output_rules>`;

    const { object: aiResult } = await generateObject({
      model: google(GEMINI_RAG_MODEL),
      system: `${systemPrompt}\n\n${dynamicAssemblyContext}`,
      prompt: description,
      schema: z.object({
        assemblies: z.array(z.object({
          name: z.string(),
          description: z.string(),
          category: z.string().nullable(),
          items: z.array(z.object({
            name: z.string(),
            quantity: z.number(),
            unit: z.string(),
            type: z.enum(["material", "labor"]),
            estimatedPrice: z.number().nullable(),
            knr_code: z.string().nullable().describe("Kod KNR np. 'KNR 5-04 0202-01' — OBOWIĄZKOWY dla labor"),
            labor_norm_rbh: z.number().nullable().describe("Norma robocizny w r-g/jednostkę np. 0.25 — OBOWIĄZKOWA dla labor"),
            notes: z.string().nullable(),
          })),
        })),
      }),
      temperature: 0.35,
      maxOutputTokens: 8000,
    });

    const generatedAssemblies: GeneratedAssembly[] = aiResult.assemblies || [];

    if (generatedAssemblies.length === 0) {
      return { success: false, error: "AI nie wygenerowało zestawów" };
    }

    // Create assemblies in database
    const createdAssemblyIds: string[] = [];

    for (const assembly of generatedAssemblies) {
      // Find or create category
      let categoryId: string | null = null;
      if (assembly.category) {
        const { data: existingCat } = await supabase
          .from("assembly_categories")
          .select("id")
          .eq("user_id", user.id)
          .eq("name", assembly.category)
          .single();

        if (existingCat) {
          categoryId = existingCat.id;
        } else {
          // Create new category
          const { data: newCat } = await supabase
            .from("assembly_categories")
            .insert({
              user_id: user.id,
              name: assembly.category,
            })
            .select("id")
            .single();
          
          if (newCat) {
            categoryId = newCat.id;
          }
        }
      }

      // Create assembly with AI-generated flag
      const { data: newAssembly, error: assemblyError } = await supabase
        .from("user_assemblies")
        .insert({
          user_id: user.id,
          name: assembly.name,
          description: assembly.description,
          category_id: categoryId,
          is_ai_generated: true, // Mark as AI-generated
          // Team data sharing
          visibility: visibility,
          team_id: visibility === 'team' ? team_id : null,
        })
        .select("id")
        .single();

      if (assemblyError || !newAssembly) {
        logger.error("Error creating assembly:", {}, assemblyError);
        continue;
      }

      createdAssemblyIds.push(newAssembly.id);

      // Post-process items: clamp quantities, ensure KNR codes, calculate labor prices from norms
      const processedItems = assembly.items.map((item) => {
        const unit = (item.unit || "szt").toLowerCase();
        const qty = clampQuantity(assembly.name, item.name, unit, item.quantity || 1);

        let knrCode = item.knr_code ?? null;
        let laborNorm = item.labor_norm_rbh ?? null;
        let price = item.estimatedPrice ?? 0;

        if (item.type === "labor") {
          // Ensure KNR code via local lookup if missing
          if (!knrCode) {
            const match = lookupKnrByName(item.name);
            if (match) {
              knrCode = match.code;
              laborNorm = laborNorm ?? match.laborNorm;
            } else {
              knrCode = lookupKnrForLabor(item.name);
            }
          }
          // Layer 1: clamp norm to realistic KNR ceiling (catches AI hallucinations like 0.85 rbh/mb)
          if (laborNorm && laborNorm > 0) {
            laborNorm = clampLaborNorm(item.name, unit, laborNorm);
          }
          // Calculate price from norm × rate (authoritative)
          if (laborNorm && laborNorm > 0) {
            price = Math.round(laborNorm * effectiveRate * 100) / 100;
          }
          // Fallback if still 0
          if (price <= 0) {
            price = LABOR_UNIT_FALLBACK[unit] ?? LABOR_UNIT_FALLBACK["szt"];
          }
          // Layer 2: clamp final price to market ceiling
          const clampedPrice = clampPrice(item.name, unit, price, "labor");
          // Back-calculate norm from clamped price so stored norm always matches stored price
          if (clampedPrice < price && laborNorm && laborNorm > 0) {
            laborNorm = Math.round((clampedPrice / effectiveRate) * 10000) / 10000;
          }
          price = clampedPrice;
        } else {
          // Clamp material price to market ceiling
          price = clampPrice(item.name, unit, price, "material");
        }

        return { ...item, quantity: qty, price, knrCode, laborNorm };
      });

      // Create assembly items
      const itemsToInsert = processedItems.map((item, index) => ({
        assembly_id: newAssembly.id,
        name: item.name,
        unit: item.unit || "szt.",
        type: item.type,
        price: item.price,
        quantity: item.quantity,
        knr_code: item.knrCode,
        labor_norm_rbh: item.laborNorm,
        sort_order: index,
      }));

      const { error: itemsError } = await supabase
        .from("user_assembly_items")
        .insert(itemsToInsert);

      if (itemsError) {
        logger.error("Error creating assembly items:", {}, itemsError);
      }
    }

    // Log successful usage
    await supabase.from("ai_usage").insert({
      user_id: user.id,
      project_id: null,
      feature: "assembly_generator",
      success: true,
    });

    revalidatePath("/dashboard/assemblies");

    return {
      success: true,
      assemblies: generatedAssemblies,
      createdCount: createdAssemblyIds.length,
      assemblyIds: createdAssemblyIds,
    };
  } catch (error) {
    logger.error("[AI Assembly Generator] Error:", {}, error);
    
    // Log failed usage
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("ai_usage").insert({
          user_id: user.id,
          project_id: null,
          feature: "assembly_generator",
          success: false,
        });
      }
    } catch (logError) {
      logger.error("Failed to log AI usage:", {}, logError);
    }

    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Nieoczekiwany błąd" 
    };
  }
}
