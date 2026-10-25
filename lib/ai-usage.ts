"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { DEMO_AI_LIMIT, PRO_AI_LIMIT } from "@/lib/ai-quota-config";
import { getEffectiveIsPro } from "@/lib/auth/entitlements";

/**
 * Select the exact columns needed to resolve effective PRO status (paid OR
 * active 7-day trial) + usage counters. Keep in one place so adding new
 * entitlement inputs (e.g. team licence) doesn't miss any call site.
 */
const ENTITLEMENT_COLUMNS = "is_pro, trial_started_at, trial_ends_at, ai_usage_count, ai_usage_reset_at";

interface AiUsageResult {
  allowed: boolean;
  remaining: number;
  error?: string;
}

/**
 * Check if user can use AI features and increment counter if allowed.
 * GLOBAL monthly cap (FREE 5 / PRO 80) is the only allow/deny gate.
 * Per-function rows in ai_usage_stats are telemetry for the UI, not extra quota.
 * Counter auto-resets on the first call of each new month.
 * Call this BEFORE making any AI API request.
 *
 * @param userId - The user's ID
 * @param functionName - Optional function identifier for per-function tracking (e.g. "vision", "parsePdf")
 */
export async function checkAndIncrementAiUsage(userId: string, functionName?: string): Promise<AiUsageResult> {
  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select(ENTITLEMENT_COLUMNS)
    .eq("id", userId)
    .single();

  if (error || !profile) {
    return { allowed: false, remaining: 0, error: "Nie można zweryfikować profilu użytkownika" };
  }

  // v2.1: effective PRO = paid subscription OR active 7-day trial
  const isPro = getEffectiveIsPro(profile as {
    is_pro?: boolean | null;
    trial_started_at?: string | null;
    trial_ends_at?: string | null;
  });
  const limit = isPro ? PRO_AI_LIMIT : DEMO_AI_LIMIT;
  const now = new Date();

  let currentCount = ((profile as Record<string, unknown>).ai_usage_count as number | null) ?? 0;
  const rawResetAt = (profile as Record<string, unknown>).ai_usage_reset_at as string | null;
  const resetAt = rawResetAt ? new Date(rawResetAt) : null;
  const needsReset = !resetAt || resetAt.getMonth() !== now.getMonth() || resetAt.getFullYear() !== now.getFullYear();

  if (needsReset) {
    currentCount = 0;
    await supabaseAdmin
      .from("profiles")
      .update({ ai_usage_count: 0, ai_usage_reset_at: now.toISOString() })
      .eq("id", userId);
  }

  if (currentCount >= limit) {
    const msg = isPro
      ? `Osiągnięto miesięczny limit ${PRO_AI_LIMIT} zapytań AI. Limit odnowi się w następnym miesiącu.`
      : `Wykorzystano limit ${DEMO_AI_LIMIT} darmowych zapytań AI/miesiąc. Przejdź na PRO (${PRO_AI_LIMIT}/mies.).`;
    return { allowed: false, remaining: 0, error: msg };
  }

  await supabaseAdmin
    .from("profiles")
    .update({ ai_usage_count: currentCount + 1 })
    .eq("id", userId);

  if (functionName) {
    const { data: stat } = await supabaseAdmin
      .from("ai_usage_stats")
      .select("usage_count, reset_at")
      .eq("user_id", userId)
      .eq("function_name", functionName)
      .maybeSingle();

    let fnCount = stat?.usage_count ?? 0;
    const fnResetAt = stat?.reset_at ? new Date(stat.reset_at) : null;
    const fnNeedsReset = !fnResetAt || fnResetAt.getMonth() !== now.getMonth() || fnResetAt.getFullYear() !== now.getFullYear();
    if (fnNeedsReset) fnCount = 0;

    await supabaseAdmin
      .from("ai_usage_stats")
      .upsert(
        {
          user_id: userId,
          function_name: functionName,
          usage_count: fnCount + 1,
          reset_at: fnNeedsReset ? now.toISOString() : (fnResetAt?.toISOString() ?? now.toISOString()),
        },
        { onConflict: "user_id,function_name" }
      );
  }

  return {
    allowed: true,
    remaining: limit - currentCount - 1,
  };
}

/**
 * Get current AI usage info without incrementing.
 */
export async function getAiUsageInfo(userId: string): Promise<{ used: number; limit: number; isPro: boolean }> {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select(ENTITLEMENT_COLUMNS)
    .eq("id", userId)
    .single();

  const isPro = getEffectiveIsPro(profile as {
    is_pro?: boolean | null;
    trial_started_at?: string | null;
    trial_ends_at?: string | null;
  } | null);
  let used = ((profile as Record<string, unknown> | null)?.ai_usage_count as number | null) ?? 0;

  const now = new Date();
  const rawResetAt = (profile as Record<string, unknown> | null)?.ai_usage_reset_at as string | null;
  const resetAt = rawResetAt ? new Date(rawResetAt) : null;
  if (!resetAt || resetAt.getMonth() !== now.getMonth() || resetAt.getFullYear() !== now.getFullYear()) {
    used = 0;
    if (profile) {
      await supabaseAdmin
        .from("profiles")
        .update({ ai_usage_count: 0, ai_usage_reset_at: now.toISOString() })
        .eq("id", userId);
    }
  }

  return { used, limit: isPro ? PRO_AI_LIMIT : DEMO_AI_LIMIT, isPro };
}

/**
 * Get per-function AI usage for UI badge (remaining count).
 */
export async function getAiFunctionUsage(userId: string, functionName: string): Promise<{ used: number; limit: number; remaining: number }> {
  const info = await getAiUsageInfo(userId);
  void functionName;
  return { used: info.used, limit: info.limit, remaining: Math.max(0, info.limit - info.used) };
}

/**
 * Server Action: Get quota info for multiple functions at once.
 * Used by the client-side useAiQuota hook.
 */
export async function getAiQuotaForFunctions(
  userId: string,
  functionNames: string[]
): Promise<Record<string, { used: number; limit: number; remaining: number; isPro: boolean }>> {
  const global = await getAiUsageInfo(userId);
  const result: Record<string, { used: number; limit: number; remaining: number; isPro: boolean }> = {};
  for (const fn of functionNames) {
    result[fn] = {
      used: global.used,
      limit: global.limit,
      remaining: Math.max(0, global.limit - global.used),
      isPro: global.isPro,
    };
  }
  return result;
}
