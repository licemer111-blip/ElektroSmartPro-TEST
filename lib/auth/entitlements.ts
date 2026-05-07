/**
 * ═════════════════════════════════════════════════════════════════════════════
 * lib/auth/entitlements.ts — Single source of truth for "what can this user do"
 * ═════════════════════════════════════════════════════════════════════════════
 *
 * v2.1 Freemium business model (see user_global memory):
 *
 *   FREE (forever)
 *     ✓ Manual catalog & basic calculations
 *     ✓ Max 3 active projects
 *     ✓ AI = 5 requests/month (existing `ai_usage_count` counter)
 *     ✓ PDF/Excel export WITH "DEMO" watermark
 *     ✓ Pay-per-Export (29 PLN) for one-shot clean PDF
 *     ✗ AI beyond 5/mo, clean PDF, Portal Klienta, branding → PRO
 *
 *   1-DAY FREE TRIAL (no card, one-shot per account)
 *     = Full PRO for 1 day. After expiry → automatic silent downgrade to FREE.
 *     Activated via POST /api/billing/start-trial; tracked via
 *     profiles.trial_started_at + trial_ends_at.
 *
 *   PRO (159 PLN/month)
 *     = All FREE limits removed, clean PDF, Portal Klienta, branding, etc.
 *
 * IMPORTANT: this module is pure & server/client-safe (no Supabase client
 * imports). It takes a Profile-shaped object and returns effective flags.
 * That lets both RSC pages AND client components check entitlements from
 * the same function without hitting the DB.
 */

/** How long a trial lasts. Change here only — propagates everywhere. */
export const TRIAL_DURATION_DAYS = 1;

/** Shape of the fields we need to decide PRO entitlement. */
export interface EntitlementProfile {
  is_pro?: boolean | null;
  trial_started_at?: string | null;
  trial_ends_at?: string | null;
}

/**
 * Does the profile have an active trial right now?
 * Pure function — takes "now" for testability (defaults to Date.now()).
 */
export function isTrialActive(
  profile: EntitlementProfile | null | undefined,
  nowMs: number = Date.now(),
): boolean {
  if (!profile?.trial_ends_at) return false;
  const ends = Date.parse(profile.trial_ends_at);
  if (Number.isNaN(ends)) return false;
  return ends > nowMs;
}

/**
 * Has this account ever used the trial? (Active OR expired both count.)
 * Used to prevent re-activation — trial is one-shot per account.
 */
export function hasUsedTrial(profile: EntitlementProfile | null | undefined): boolean {
  return Boolean(profile?.trial_started_at);
}

/**
 * **THE** entitlement check: is this user effectively PRO right now?
 *
 * Returns true if:
 *   - profile.is_pro === true (paid subscription), OR
 *   - trial is currently active
 *
 * Use this EVERYWHERE instead of raw `profile.is_pro`:
 *   - AI quota gates (lib/ai-usage.ts)
 *   - PDF watermark decision (app/api/pdf/route.ts)
 *   - Project limit enforcement (lib/config/tier-limits.ts)
 *   - UI feature toggles (SummaryExportPanel, etc.)
 */
export function getEffectiveIsPro(
  profile: EntitlementProfile | null | undefined,
  nowMs: number = Date.now(),
): boolean {
  if (!profile) return false;
  if (profile.is_pro === true) return true;
  return isTrialActive(profile, nowMs);
}

/**
 * Milliseconds remaining on the trial (0 if not active / expired).
 * Useful for "Trial ends in 2d 14h" UI badges.
 */
export function trialTimeRemainingMs(
  profile: EntitlementProfile | null | undefined,
  nowMs: number = Date.now(),
): number {
  if (!profile?.trial_ends_at) return 0;
  const ends = Date.parse(profile.trial_ends_at);
  if (Number.isNaN(ends)) return 0;
  return Math.max(0, ends - nowMs);
}

/**
 * Human-readable trial remaining — Polish locale, mobile-friendly.
 * Examples: "6 dni 23 godz.", "2 godz. 14 min", "13 min", "".
 */
export function formatTrialRemaining(
  profile: EntitlementProfile | null | undefined,
  nowMs: number = Date.now(),
): string {
  const ms = trialTimeRemainingMs(profile, nowMs);
  if (ms <= 0) return "";
  const totalMinutes = Math.floor(ms / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  if (days >= 1) return `${days} dni ${hours} godz.`;
  if (hours >= 1) return `${hours} godz. ${minutes} min`;
  return `${minutes} min`;
}

/**
 * Why-is-this-user-PRO breakdown (for UI badges / analytics).
 * Never used for gating — use getEffectiveIsPro() for that.
 */
export type EntitlementReason = "paid" | "trial" | "free";

export function getEntitlementReason(
  profile: EntitlementProfile | null | undefined,
  nowMs: number = Date.now(),
): EntitlementReason {
  if (profile?.is_pro === true) return "paid";
  if (isTrialActive(profile, nowMs)) return "trial";
  return "free";
}
