// ═══════════════════════════════════════════════════════════════════
// _ai_actions/utils.ts — Shared AI utilities
// Guards, admin client factory, AI usage logging, rate-limit helpers
// NOTE: No "use server" here — this is a plain helper module.
// ═══════════════════════════════════════════════════════════════════

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { requireAuth, tryAuth } from "@/lib/auth";
import { checkAndIncrementAiUsage } from "@/lib/ai-usage";

// ── Shared interfaces ─────────────────────────────────────────────

export interface GeneratedItem {
  name: string;
  quantity: number;
  unit: string;
  category: string | null;
  section: string | null;
  notes: string | null;
  knr_code?: string | null;
  // Legacy — prices now set by KNR pipeline, kept optional for backward compat
  material_price?: number;
  labor_price?: number;
  confidence_level?: "verified" | "analog" | "estimated" | "uncertain";
  confidence_note?: string | null;
}

export interface AIGenerateResult {
  success: boolean;
  items?: GeneratedItem[];
  addedCount?: number;
  error?: string;
}

// ── Admin Supabase client (bypasses RLS for batch writes) ─────────

export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

// ── Auth + quota guard ────────────────────────────────────────────
// Returns { user, supabase } or an error result conforming to T.
// Usage: const guard = await checkGuard(featureName); if ('error' in guard) return guard;

export interface GuardOk {
  user: NonNullable<Awaited<ReturnType<typeof requireAuth>>["user"]>;
  supabase: NonNullable<Awaited<ReturnType<typeof requireAuth>>["supabase"]>;
}

export interface GuardFail {
  error: string;
}

export async function checkGuard(featureName: string): Promise<GuardOk | GuardFail> {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return { error: "Musisz być zalogowany" };

  const aiCheck = await checkAndIncrementAiUsage(user.id, featureName);
  if (!aiCheck.allowed) return { error: aiCheck.error || "Limit AI wyczerpany" };

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return { error: "Usługa AI nie jest skonfigurowana" };
  }

  return { user, supabase };
}

// ── Simple auth-only guard (no quota, no rate-limit) ─────────────

export async function checkAuthOnly(): Promise<GuardOk | GuardFail> {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return { error: "Musisz być zalogowany" };
  return { user, supabase };
}

// ── Log AI usage without rate-limiting ───────────────────────────

export async function logAiUsage(
  supabase: GuardOk["supabase"],
  userId: string,
  feature: string
): Promise<void> {
  await supabase.from("ai_usage").insert({
    user_id: userId,
    feature,
    success: true,
  });
}
