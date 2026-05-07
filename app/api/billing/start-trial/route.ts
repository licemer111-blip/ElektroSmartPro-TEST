import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { TRIAL_DURATION_DAYS, hasUsedTrial, isTrialActive } from "@/lib/auth/entitlements";

/**
 * POST /api/billing/start-trial
 *
 * v2.1 — Activates the one-shot 7-day free PRO trial for the calling user.
 * No credit card, no Stripe. Sets `trial_started_at = now()` and
 * `trial_ends_at = now() + TRIAL_DURATION_DAYS` on the profile.
 *
 * Rules:
 *   - One trial per account (forever). Re-activation is silently rejected.
 *   - Users who are already paid PRO can't start a trial (doesn't make sense).
 *   - Users whose trial is currently active → return current end date (no-op,
 *     idempotent). Prevents double-activation from double-clicks.
 *   - Users whose trial already expired → BLOCKED ("Trial już wykorzystany").
 *
 * Response:
 *   200 { started: true, trialEndsAt: string }  — newly activated
 *   200 { started: false, active: true, trialEndsAt } — already active
 *   409 { error, trialEndsAt? }                 — already used / paid pro
 *   401 / 429 / 500                              — standard errors
 */
export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Musisz być zalogowany." }, { status: 401 });
    }

    // Fetch profile with trial + is_pro fields
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select("is_pro, trial_started_at, trial_ends_at")
      .eq("id", user.id)
      .single();

    if (profileErr || !profile) {
      logger.error("[start-trial] profile fetch failed", { userId: user.id }, profileErr);
      return NextResponse.json(
        { error: "Nie można pobrać profilu użytkownika." },
        { status: 500 },
      );
    }

    // Case 1: already paid PRO → no point activating a trial
    if (profile.is_pro === true) {
      return NextResponse.json(
        {
          started: false,
          alreadyPro: true,
          message: "Masz już aktywną subskrypcję PRO — trial nie jest potrzebny.",
        },
        { status: 200 },
      );
    }

    // Case 2: trial currently active → return current end date (idempotent)
    if (isTrialActive(profile)) {
      return NextResponse.json(
        {
          started: false,
          active: true,
          trialEndsAt: profile.trial_ends_at,
          message: "Trial jest już aktywny.",
        },
        { status: 200 },
      );
    }

    // Case 3: trial already used (started in the past, now expired) → BLOCKED
    if (hasUsedTrial(profile)) {
      return NextResponse.json(
        {
          started: false,
          error: "Trial 7-dniowy został już wykorzystany. Aktywuj PRO aby odblokować wszystkie funkcje.",
          trialEndsAt: profile.trial_ends_at,
        },
        { status: 409 },
      );
    }

    // Case 4: fresh activation
    const now = new Date();
    const endsAt = new Date(now.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);

    // Atomic activation guard: only sets trial_started_at if still NULL — protects
    // against race conditions from parallel double-clicks.
    const { data: updated, error: updateErr } = await supabaseAdmin
      .from("profiles")
      .update({
        trial_started_at: now.toISOString(),
        trial_ends_at: endsAt.toISOString(),
      })
      .eq("id", user.id)
      .is("trial_started_at", null)
      .select("trial_started_at, trial_ends_at")
      .maybeSingle();

    if (updateErr) {
      logger.error("[start-trial] DB update failed", { userId: user.id }, updateErr);
      return NextResponse.json(
        { error: "Nie udało się aktywować trialu. Spróbuj ponownie." },
        { status: 500 },
      );
    }

    if (!updated) {
      // Another concurrent request won the race. Re-fetch and return that state.
      const { data: after } = await supabaseAdmin
        .from("profiles")
        .select("trial_ends_at")
        .eq("id", user.id)
        .single();
      return NextResponse.json(
        {
          started: false,
          active: true,
          trialEndsAt: after?.trial_ends_at ?? null,
          message: "Trial został już aktywowany w innym żądaniu.",
        },
        { status: 200 },
      );
    }

    logger.info("[start-trial] activated", {
      userId: user.id,
      endsAt: endsAt.toISOString(),
    });

    return NextResponse.json(
      {
        started: true,
        trialEndsAt: updated.trial_ends_at,
        durationDays: TRIAL_DURATION_DAYS,
      },
      { status: 200 },
    );
  } catch (error) {
    logger.error("[start-trial] unexpected error", {}, error);
    return NextResponse.json(
      {
        error: "Wystąpił nieoczekiwany błąd.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
