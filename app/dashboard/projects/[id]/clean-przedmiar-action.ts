"use server";

import { logger } from "@/lib/logger";
import { checkAndIncrementAiUsage } from "@/lib/ai-usage";
import { AI_FUNCTION_NAMES } from "@/lib/ai-quota-config";
import { normalizeKnrCode } from "@/lib/services/pricing-config";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { AI_MODEL_TIER1 } from "@/lib/ai-models";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { CLEAN_PRZEDMIAR_SYSTEM_PROMPT } from "@/lib/ai/prompts";

interface CleanedItem {
  name: string;
  quantity: number;
  unit: string;
  material_price: number;
  labor_price: number;
  knr_code?: string | null;
}

interface CleanPrzedmiarResult {
  success: boolean;
  items?: CleanedItem[];
  error?: string;
}

/**
 * AI-powered Przedmiar cleanup — Gemini Flash only.
 * Splits messy text into structured name/quantity/unit rows.
 * Prices are intentionally left at 0 (structure-only pass).
 * For pricing, user should use the Global AI pricing button.
 */
export async function cleanPrzedmiarWithAi(
  rawText: string
): Promise<CleanPrzedmiarResult> {
  try {
    const { user } = await requireAuth().catch(() => ({ user: null }));
    if (!user) return { success: false, error: "Musisz być zalogowany" };

    const aiCheck = await checkAndIncrementAiUsage(user.id, AI_FUNCTION_NAMES.cleanPrzedmiar);
    if (!aiCheck.allowed) return { success: false, error: aiCheck.error || "Limit AI wyczerpany" };

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return { success: false, error: "Brak klucza GOOGLE_GENERATIVE_AI_API_KEY" };
    }

    if (!rawText?.trim() || rawText.trim().length < 3) {
      return { success: false, error: "Brak tekstu do przetworzenia" };
    }

    const { object } = await generateObject({
      model: google(AI_MODEL_TIER1),
      system: CLEAN_PRZEDMIAR_SYSTEM_PROMPT,
      prompt: `Przetwórz ten tekst przedmiaru:\n\n${rawText.substring(0, 8000)}`,
      schema: z.object({
        items: z.array(z.object({
          name: z.string(),
          quantity: z.number(),
          unit: z.string(),
          knr_code: z.string().optional(),
        })),
      }),
      temperature: 0.0,
      maxOutputTokens: 4000,
    });

    const items: CleanedItem[] = (object.items || [])
      .filter(i => i.name?.trim().length > 0 && i.quantity > 0)
      .map(i => ({
        name: i.name.trim(),
        quantity: Math.max(0.01, Number(i.quantity) || 1),
        unit: i.unit?.trim() || "szt",
        material_price: 0,
        labor_price: 0,
        knr_code: i.knr_code ? normalizeKnrCode(i.knr_code) : null,
      }));

    if (items.length === 0) {
      return { success: false, error: "AI nie rozpoznało żadnych pozycji w tekście" };
    }

    return { success: true, items };
  } catch (error: unknown) {
    logger.error("[cleanPrzedmiar] error:", {}, error);
    return { success: false, error: "Błąd podczas porządkowania struktury" };
  }
}
