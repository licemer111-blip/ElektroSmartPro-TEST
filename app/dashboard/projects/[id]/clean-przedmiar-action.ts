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

// ─── Deterministic pre-parser for structured tables ──────────────────────────
// Handles TSV / semicolon-separated tables with a header row.
// Column detection: Lp. (row number — ignored), Opis/Nazwa, J.m./Jm, Ilość.
// Returns null if the text doesn't look like a structured table.

function tryParseStructuredTable(text: string): CleanedItem[] | null {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return null;

  // Detect separator: tab preferred, then semicolon
  const sep = lines[0].includes("\t") ? "\t" : lines[0].includes(";") ? ";" : null;
  if (!sep) return null;

  const headers = lines[0].split(sep).map(h => h.trim().toLowerCase().replace(/[.\s]/g, ""));

  // Map known header names to column indices
  const col = (aliases: string[]) => headers.findIndex(h => aliases.some(a => h.includes(a)));

  const nameIdx = col(["opis", "nazwa", "pozycj", "material", "robocizna"]);
  const unitIdx = col(["jm", "jedn", "jednostk"]);
  const qtyIdx  = col(["ilo", "ilosc", "kol", "qty", "ilo\u015b\u0107"]);

  if (nameIdx === -1 || qtyIdx === -1) return null;

  const items: CleanedItem[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(sep).map(c => c.trim());
    if (cols.length < 2) continue;

    const name = cols[nameIdx]?.trim();
    const rawQty = cols[qtyIdx]?.replace(",", ".") ?? "0";
    const qty = parseFloat(rawQty);
    const unit = unitIdx !== -1 ? (cols[unitIdx]?.trim() || "szt") : "szt";

    if (!name || name.length < 2 || isNaN(qty) || qty <= 0) continue;

    items.push({ name, quantity: qty, unit, material_price: 0, labor_price: 0, knr_code: null });
  }

  return items.length > 0 ? items : null;
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

    // ─── Fast path: structured TSV / CSV table — no AI needed ────────────────
    const tableItems = tryParseStructuredTable(rawText);
    if (tableItems && tableItems.length > 0) {
      return { success: true, items: tableItems };
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
