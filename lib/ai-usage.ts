"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { DEMO_AI_LIMIT, PRO_AI_LIMIT, FUNCTION_LIMITS } from "@/lib/ai-quota-config";

function getLimitForFunction(isPro: boolean, functionName?: string): number {
  if (!functionName) return isPro ? PRO_AI_LIMIT : DEMO_AI_LIMIT;
  const override = FUNCTION_LIMITS[functionName];
  if (override) return isPro ? override.pro : override.demo;
  return isPro ? PRO_AI_LIMIT : DEMO_AI_LIMIT;
}

interface AiUsageResult {
  allowed: boolean;
  remaining: number;
  error?: string;
}

/**
 * Check if user can use AI features and increment counter if allowed.
 * Tracks per-function usage in ai_usage_stats table.
 * PRO users: 100 calls/month per function. Demo users: 5 calls/month per function.
 * Counter auto-resets on the first call of each new month.
 * Call this BEFORE making any AI API request.
 *
 * @param userId - The user's ID
 * @param functionName - Optional function identifier for per-function tracking (e.g. "vision", "parsePdf")
 */
export async function checkAndIncrementAiUsage(userId: string, functionName?: string): Promise<AiUsageResult> {
  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("is_pro, ai_usage_count, ai_usage_reset_at")
    .eq("id", userId)
    .single();

  if (error || !profile) {
    return { allowed: false, remaining: 0, error: "Nie można zweryfikować profilu użytkownika" };
  }

  const isPro = (profile as Record<string, unknown>).is_pro as boolean;
  const limit = getLimitForFunction(isPro, functionName);
  const now = new Date();

  // --- Per-function tracking (ai_usage_stats) ---
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

    if (fnCount >= limit) {
      const msg = isPro
        ? `Osiągnięto limit ${PRO_AI_LIMIT} prób w tym miesiącu dla tej funkcji. Limit odnowi się w następnym miesiącu.`
        : `Wykorzystano limit ${DEMO_AI_LIMIT} darmowych zapytań AI/miesiąc. Przejdź na PRO (${PRO_AI_LIMIT}/mies.), aby korzystać bez ograniczeń.`;
      return { allowed: false, remaining: 0, error: msg };
    }

    // Upsert per-function counter
    await supabaseAdmin
      .from("ai_usage_stats")
      .upsert(
        { user_id: userId, function_name: functionName, usage_count: fnCount + 1, reset_at: fnNeedsReset ? now.toISOString() : (fnResetAt?.toISOString() ?? now.toISOString()) },
        { onConflict: "user_id,function_name" }
      );
  }

  // --- Global counter (backward compat on profiles) ---
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

  // Increment global counter
  await supabaseAdmin
    .from("profiles")
    .update({ ai_usage_count: currentCount + 1 })
    .eq("id", userId);

  // Per-function remaining (if functionName given, use that; else global)
  if (functionName) {
    const { data: stat2 } = await supabaseAdmin
      .from("ai_usage_stats")
      .select("usage_count")
      .eq("user_id", userId)
      .eq("function_name", functionName)
      .maybeSingle();
    const fnUsed = stat2?.usage_count ?? 1;
    return { allowed: true, remaining: limit - fnUsed };
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
    .select("is_pro, ai_usage_count, ai_usage_reset_at")
    .eq("id", userId)
    .single();

  const isPro = ((profile as Record<string, unknown> | null)?.is_pro as boolean) ?? false;
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
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("is_pro")
    .eq("id", userId)
    .single();

  const isPro = ((profile as Record<string, unknown> | null)?.is_pro as boolean) ?? false;
  const fnOverride = FUNCTION_LIMITS[functionName];
  const limit = fnOverride
    ? (isPro ? fnOverride.pro : fnOverride.demo)
    : (isPro ? PRO_AI_LIMIT : DEMO_AI_LIMIT);

  const { data: stat } = await supabaseAdmin
    .from("ai_usage_stats")
    .select("usage_count, reset_at")
    .eq("user_id", userId)
    .eq("function_name", functionName)
    .maybeSingle();

  let used = stat?.usage_count ?? 0;
  const now = new Date();
  const resetAt = stat?.reset_at ? new Date(stat.reset_at) : null;
  if (!resetAt || resetAt.getMonth() !== now.getMonth() || resetAt.getFullYear() !== now.getFullYear()) {
    used = 0;
  }

  return { used, limit, remaining: Math.max(0, limit - used) };
}

/**
 * Server Action: Get quota info for multiple functions at once.
 * Used by the client-side useAiQuota hook.
 */
export async function getAiQuotaForFunctions(
  userId: string,
  functionNames: string[]
): Promise<Record<string, { used: number; limit: number; remaining: number; isPro: boolean }>> {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("is_pro")
    .eq("id", userId)
    .single();

  const isPro = ((profile as Record<string, unknown> | null)?.is_pro as boolean) ?? false;

  const { data: stats } = await supabaseAdmin
    .from("ai_usage_stats")
    .select("function_name, usage_count, reset_at")
    .eq("user_id", userId)
    .in("function_name", functionNames);

  const now = new Date();
  const result: Record<string, { used: number; limit: number; remaining: number; isPro: boolean }> = {};

  for (const fn of functionNames) {
    const fnLimit = getLimitForFunction(isPro, fn);
    const stat = (stats ?? []).find((s) => s.function_name === fn);
    let used = stat?.usage_count ?? 0;
    const resetAt = stat?.reset_at ? new Date(stat.reset_at) : null;
    if (!resetAt || resetAt.getMonth() !== now.getMonth() || resetAt.getFullYear() !== now.getFullYear()) {
      used = 0;
    }
    result[fn] = { used, limit: fnLimit, remaining: Math.max(0, fnLimit - used), isPro };
  }

  return result;
}
