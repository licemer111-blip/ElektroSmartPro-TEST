"use server";

import { logger } from "@/lib/logger";
// ═══════════════════════════════════════════════════════════════════
// _ai_actions/analysis.ts — AI Analysis Server Actions
// categorizeCatalogItemWithAI, detectPriceAnomalyWithAI,
// fillMissingRbhNorms
// ═══════════════════════════════════════════════════════════════════

import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { tryAuth } from "@/lib/auth";
import { checkAndIncrementAiUsage } from "@/lib/ai-usage";
import { AI_FUNCTION_NAMES } from "@/lib/ai-quota-config";
import { rateLimitAI } from "@/lib/rate-limit";
import {
  CATEGORIZATION_SYSTEM_PROMPT,
  PRICE_ANOMALY_SYSTEM_PROMPT,
} from "@/lib/services/ai";
import { createAdminClient, checkGuard } from "./utils";
import { revalidatePath } from "next/cache";

// ── Re-export shared result interfaces ────────────────────────────

export interface RbhNormResult {
  success: boolean;
  updatedCount?: number;
  error?: string;
}

// ─────────────────────────────────────────────────────────────────
// categorizeCatalogItemWithAI
// Assigns category + subcategory to a catalog item from its name.
// ─────────────────────────────────────────────────────────────────

export async function categorizeCatalogItemWithAI(
  itemName: string
): Promise<{ category?: string; subcategory?: string; error?: string }> {
  try {
    const { user, supabase } = await tryAuth();
    if (!user || !supabase) return { error: "Musisz być zalogowany" };

    const aiCheck = await checkAndIncrementAiUsage(user.id, "categorizeCatalog");
    if (!aiCheck.allowed) return { error: aiCheck.error || "Limit AI wyczerpany" };

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return { error: "AI service is not configured" };
    }

    const { object: parsed } = await generateObject({
      model: google("gemini-2.0-flash"),
      system: CATEGORIZATION_SYSTEM_PROMPT,
      prompt: itemName,
      schema: z.object({
        category: z.string(),
        subcategory: z.string(),
      }),
      temperature: 0.1,
      maxOutputTokens: 150,
    });

    await supabase.from("ai_usage").insert({
      user_id: user.id,
      feature: "categorization",
      success: true,
    });

    return { category: parsed.category, subcategory: parsed.subcategory };
  } catch (error) {
    logger.error("categorizeCatalogItemWithAI error:", {}, error);
    return { error: "Blad kategoryzacji" };
  }
}

// ─────────────────────────────────────────────────────────────────
// detectPriceAnomalyWithAI
// Checks if a price looks suspicious vs market rates.
// ─────────────────────────────────────────────────────────────────

export async function detectPriceAnomalyWithAI(
  itemName: string,
  price: number
): Promise<{ isAnomaly: boolean; suggestion?: string; marketPrice?: string; error?: string }> {
  try {
    const { user, supabase } = await tryAuth();
    if (!user || !supabase) return { isAnomaly: false, error: "Musisz być zalogowany" };

    const aiCheck = await checkAndIncrementAiUsage(user.id, "detectPriceAnomaly");
    if (!aiCheck.allowed) return { isAnomaly: false, error: aiCheck.error || "Limit AI wyczerpany" };

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return { isAnomaly: false, error: "AI service is not configured" };
    }

    const { object: parsed } = await generateObject({
      model: google("gemini-2.0-flash"),
      system: PRICE_ANOMALY_SYSTEM_PROMPT,
      prompt: `Produkt: ${itemName}\nCena materialu: ${price} PLN`,
      schema: z.object({
        isAnomaly: z.boolean(),
        suggestion: z.string(),
        marketPrice: z.string(),
      }),
      temperature: 0.1,
      maxOutputTokens: 200,
    });

    await supabase.from("ai_usage").insert({
      user_id: user.id,
      feature: "price_check",
      success: true,
    });

    return {
      isAnomaly: parsed.isAnomaly,
      suggestion: parsed.suggestion,
      marketPrice: parsed.marketPrice,
    };
  } catch (error) {
    logger.error("detectPriceAnomalyWithAI error:", {}, error);
    return { isAnomaly: false, error: "Blad wykrywania anomalii" };
  }
}

// ─────────────────────────────────────────────────────────────────
// fillMissingKnrCodes
// Uses KNR AI to fill in missing knr_code values for project items.
// ─────────────────────────────────────────────────────────────────

export interface KnrCodeResult {
  success: boolean;
  updatedCount?: number;
  error?: string;
}

export async function fillMissingKnrCodes(projectId: string): Promise<KnrCodeResult> {
  try {
    const guard = await checkGuard(AI_FUNCTION_NAMES.aiPricing);
    if ("error" in guard) return { success: false, error: guard.error };
    const { user, supabase } = guard;

    const { data: project } = await supabase
      .from("projects")
      .select("id, status, user_id")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (!project) return { success: false, error: "Nie masz uprawnien do tego projektu" };
    if (project.status === "final") return { success: false, error: "Projekt jest zablokowany" };

    const { data: items } = await supabase
      .from("project_items")
      .select("id, name, unit, quantity, knr_code, labor_price, parent_assembly_id, expert_override, confidence_level, norm_protected")
      .eq("project_id", projectId)
      .order("sort_order");

    type KnrItem = {
      id: string; name: string; unit: string; quantity: number;
      knr_code: string | null; labor_price: number | null;
      parent_assembly_id: string | null;
      expert_override: boolean | null;
      confidence_level: string | null;
      norm_protected: boolean | null;
    };
    // v2.5 Iron Lock: skip user-confirmed rows entirely
    const itemsNeedingCode = ((items || []) as KnrItem[]).filter(
      (i) => !i.parent_assembly_id
        && (!i.knr_code || i.knr_code.trim() === "")
        && i.expert_override !== true
        && i.confidence_level !== "manual"
        && i.norm_protected !== true
    );

    if (itemsNeedingCode.length === 0) {
      return { success: false, error: "Wszystkie pozycje mają już uzupełnione kody KNR" };
    }

    const itemsList = itemsNeedingCode
      .map((item: KnrItem, i: number) => `${i}. "${item.name}" | jm: ${item.unit} | ilosc: ${item.quantity}`)
      .join("\n");

    const { object: result } = await generateObject({
      model: google("gemini-2.0-flash"),
      system: `Jesteś ekspertem KNR (Katalog Norm Rzeczowych) dla instalacji elektrycznych w Polsce.
Twoim zadaniem jest znalezienie kodu KNR dla każdej pozycji robocizny.

ZASADY (KRYTYCZNE — zawsze przestrzegaj):
1. NIGDY nie zwracaj knr_code=null. Każda pozycja MUSI otrzymać kod.
2. Jeśli znasz dokładny kod → confidence="high", format "KNR X-XX XXXX-XX".
3. Jeśli szacujesz na podstawie podobnych pozycji → confidence="medium".
4. Jeśli brak odpowiedniego kodu KNR → użyj kodu syntetycznego ES-Engine:
   - Pozycje LAN/sieć/UTP/patch/RJ45/światłowód/rack → knr_code="KNR 5-06+ES"
   - Pozycje CCTV/kamera/NVR/DVR → knr_code="KNR 5-09+ES"
   - Pozycje alarm/SSWiN/czujka/centrala alarmowa → knr_code="KNR 5-10+ES"
   - Pozycje SSP/pożar/ROP/detekcja → knr_code="KNR 5-11+ES"
   - Pozycje KD/kontrola dostępu/RFID/elektrozaczep → knr_code="KNR 5-09+ES"
   - Pozycje PV/fotowoltaika/panel solarny/falownik → knr_code="KNR AT-26+ES"
   - Pozycje EV/ładowarka/EVSE → knr_code="KNR-ES"
   - Wszystkie pozostałe nieznane → knr_code="KNR-ES"
   - confidence="low" dla wszystkich syntetycznych
5. Przykłady pewnych kodów:
   gniazdo 230V → "KNR 5-01 0401-01" (high)
   punkt oświetleniowy → "KNR 5-01 0301-01" (high)
   przewód YDYp 3x2.5 → "KNR 5-04 0101-02" (high)
   wyłącznik nadprądowy → "KNR 5-08 0201-01" (high)
   Linia LAN/punkt LAN → "KNR 5-06+ES" (low)
   kabel UTP/U/UTP kat.6 → "KNR 5-06+ES" (low)`,
      prompt: `Znajdź kody KNR dla następujących pozycji:\n\n${itemsList}`,
      schema: z.object({
        codes: z.array(z.object({
          index: z.number(),
          knr_code: z.string(),
          confidence: z.enum(["high", "medium", "low"]),
        })),
      }),
      temperature: 0.05,
      maxOutputTokens: 2000,
    });

    const adminClient = createAdminClient();
    let count = 0;

    for (const entry of result.codes) {
      const item = itemsNeedingCode[entry.index];
      if (!item || !entry.knr_code) continue;
      const knrSource =
        entry.confidence === "high" ? "system_knr" :
        entry.confidence === "medium" ? "es_synthetic" :
        "ai_estimation";
      const { error } = await adminClient
        .from("project_items")
        .update({
          knr_code: entry.knr_code,
          knr_source: knrSource,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id)
        .eq("project_id", projectId);
      if (!error) count++;
    }

    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true, updatedCount: count };
  } catch (error) {
    logger.error("fillMissingKnrCodes error:", {}, error);
    return { success: false, error: "Wystąpił błąd podczas uzupełniania kodów KNR" };
  }
}

// ─────────────────────────────────────────────────────────────────
// fillMissingRbhNorms
// Uses KNR norms AI to fill in missing labor_norm values.
// ─────────────────────────────────────────────────────────────────

export async function fillMissingRbhNorms(projectId: string): Promise<RbhNormResult> {
  try {
    const guard = await checkGuard(AI_FUNCTION_NAMES.aiPricing);
    if ("error" in guard) return { success: false, error: guard.error };
    const { user, supabase } = guard;

    const { data: project } = await supabase
      .from("projects")
      .select("id, status, user_id, default_hourly_rate")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (!project) return { success: false, error: "Nie masz uprawnien do tego projektu" };
    if (project.status === "final") return { success: false, error: "Projekt jest zablokowany" };

    const { data: items } = await supabase
      .from("project_items")
      .select("id, name, unit, quantity, labor_norm, labor_price, parent_assembly_id, expert_override, confidence_level, norm_protected")
      .eq("project_id", projectId)
      .order("sort_order");

    type NormItem = {
      id: string; name: string; unit: string; quantity: number;
      labor_norm: number | null; labor_price: number | null;
      parent_assembly_id: string | null;
      expert_override: boolean | null;
      confidence_level: string | null;
      norm_protected: boolean | null;
    };
    // v2.5 Iron Lock: skip user-confirmed rows entirely
    const itemsNeedingNorm = ((items || []) as NormItem[]).filter(
      (i) => !i.parent_assembly_id
        && (i.labor_norm == null || i.labor_norm === 0)
        && i.expert_override !== true
        && i.confidence_level !== "manual"
        && i.norm_protected !== true
    );

    if (itemsNeedingNorm.length === 0) {
      return { success: false, error: "Wszystkie pozycje maja juz uzupelnione normy rbh" };
    }

    const itemsList = itemsNeedingNorm
      .map((item: NormItem, i: number) => `${i}. "${item.name}" | jm: ${item.unit} | ilosc: ${item.quantity}`)
      .join("\n");

    const { object: result } = await generateObject({
      model: google("gemini-2.0-flash"),
      system: `Jestes ekspertem KNR (Katalog Norm Rzeczowych) dla instalacji elektrycznych w Polsce.
Twoim zadaniem jest znalezienie normy czasu pracy (labor_norm) w rbh/jm dla kazdej pozycji.
ZASADY:
- Zwracaj TYLKO labor_norm (rbh na jednostke miary), NIE ceny.
- Normy wg ES-KNR 2026 / KNR 5-01 / KNR 2-21.
- Jesli znasz dokladna norme KNR -> confidence="high".
- Jesli szacujesz na podstawie podobnych pozycji -> confidence="medium".
- Jesli brak danych -> labor_norm=0, confidence="low".
- Przyklady: gniazdo 230V=0.25rbh/szt, punkt oswietleniowy=0.35rbh/szt, przewod YDYp 3x2.5=0.08rbh/mb, tablica 12-mod=2.5rbh/szt.`,
      prompt: `Znajdz normy rbh/jm dla nastepujacych pozycji:\n\n${itemsList}`,
      schema: z.object({
        norms: z.array(z.object({
          index: z.number(),
          labor_norm: z.number(),
          confidence: z.enum(["high", "medium", "low"]),
          knr_code: z.string().optional(),
        })),
      }),
      temperature: 0.05,
      maxOutputTokens: 2000,
    });

    const adminClient = createAdminClient();
    let count = 0;

    for (const norm of result.norms) {
      const item = itemsNeedingNorm[norm.index];
      if (!item || norm.labor_norm <= 0 || norm.confidence === "low") continue;
      const laborHoursTotal = Math.round(norm.labor_norm * item.quantity * 100) / 100;
      const { error } = await adminClient
        .from("project_items")
        .update({
          labor_norm: norm.labor_norm,
          labor_hours_total: laborHoursTotal,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id)
        .eq("project_id", projectId);
      if (!error) count++;
    }

    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true, updatedCount: count };
  } catch (error) {
    logger.error("fillMissingRbhNorms error:", {}, error);
    return { success: false, error: "Wystapil blad podczas uzupelniania norm rbh" };
  }
}
