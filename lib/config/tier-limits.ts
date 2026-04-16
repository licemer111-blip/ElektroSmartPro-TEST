/**
 * ═══════════════════════════════════════════════════════════════════════════
 * tier-limits.ts — Single source of truth for Free / PRO / Trial boundaries
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * BUSINESS MODEL (v2.1 — "Smart Calculator FREE + AI PRO + 7-day Trial"):
 *
 *   FREE (forever, no card)
 *     ✓ Manual catalog & basic calculations (VAT, narzut KP/Z/KZ, contingency)
 *     ✓ Pełna widoczność cen (materiał / robocizna / VAT / brutto)
 *     ✓ Max 3 aktywne projekty (archived nie liczą się w limit)
 *     ✓ AI = 5 requests/month (shared across Szybka Wycena, Blueprint, Chat,
 *       KNR auto-pricing, Smart Assemblies expansion, Vision OCR)
 *     ✓ PDF/Excel export WITH "DEMO" watermark (still sendable for own use)
 *     ✓ Pay-per-Export (29 zł) → one-shot clean PDF for a specific project
 *     ✓ Demo project (seeded) — showcase, read-only, exports WITHOUT watermark
 *     ✗ AI beyond 5/mo, clean PDF, Portal Klienta, branding → PRO
 *
 *   7-DAY FREE TRIAL (no card, one-shot per account)
 *     = Full PRO for 7 days; after expiry → silent downgrade to FREE.
 *     = Solves "wow-effect without paywall" — user sees full value day 1.
 *     = Activated via POST /api/billing/start-trial.
 *     = See lib/auth/entitlements.ts → getEffectiveIsPro().
 *
 *   PRO (159 zł/miesiąc)
 *     ✓ Unlimited projects
 *     ✓ AI = 500/mo (effectively unlimited)
 *     ✓ Clean PDF (no watermark) + own branding
 *     ✓ Portal Klienta z e-podpisami
 *     ✓ Team collaboration + Offline mode
 *     ✓ Priorytetowe wsparcie
 *
 *   PAY-PER-EXPORT (29 zł per clean PDF)
 *     For electricians who do 1–2 estimates/year and don't need subscription.
 *
 * DLACZEGO TAK:
 *   - AI + KNR to nasze core value (nie można skopiować do Excel'a).
 *   - Manual kalkulator za darmo → szacunek do produktu, ale nie substytut Excel'a bez AI.
 *   - 7-day trial bez karty = standard B2B SaaS (Figma, Notion). Konwersja 3-5× lepsza niż trial z kartą.
 *   - Konwersja w momencie realnej potrzeby (AI wyczerpane / wysyłka klientowi / 4. projekt).
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { getEffectiveIsPro, type EntitlementProfile } from "@/lib/auth/entitlements";

/**
 * Maksymalna liczba AKTYWNYCH projektów dla FREE tier.
 * v2.1: 3 — wystarcza do oceny produktu, niewystarczające dla rutynowej pracy.
 * Poprzednio było 999 — dawało "freemium bez trigger-a do konwersji".
 *
 * Archiwizacja projektów NIE liczy się w limit (user może nieograniczenie archiwizować
 * stare), więc 3 aktywne to wystarczający bufor dla real użytkownika.
 */
export const FREE_TIER_MAX_PROJECTS = 3;

/** Maksymalna liczba AKTYWNYCH projektów dla PRO/TRIAL — zawsze nielimitowane. */
export const PRO_TIER_MAX_PROJECTS = 999_999;

/**
 * Efektywny limit projektów dla użytkownika.
 * Używaj zamiast hardcoded `profile.max_projects || 3`.
 *
 * Trial użytkownicy dostają PRO limit automatycznie przez getEffectiveIsPro().
 */
export function getEffectiveMaxProjects(
  profile: (EntitlementProfile & { max_projects?: number | null }) | null | undefined,
): number {
  if (profile == null) return FREE_TIER_MAX_PROJECTS;
  // Admin-set override in DB wins (e.g. admin może nadal wymusić inny limit dla konkretnego user-a)
  if (typeof profile.max_projects === "number" && profile.max_projects > 0) {
    return profile.max_projects;
  }
  // v2.1: effective PRO = paid subscription OR active 7-day trial
  return getEffectiveIsPro(profile) ? PRO_TIER_MAX_PROJECTS : FREE_TIER_MAX_PROJECTS;
}

/**
 * Czy w UI pokazać licznik "X z Y projektów"?
 * Nie pokazuj jeśli limit jest praktycznie nielimitowany.
 */
export function shouldShowProjectLimitCounter(maxProjects: number): boolean {
  return maxProjects > 0 && maxProjects < 100;
}

// ─── Feature flags — co jest zablokowane dla FREE ──────────────────────────

export const FREE_TIER_LOCKED_FEATURES = {
  /** Eksport PDF bez znaku wodnego — tylko PRO lub pay-per-export */
  PDF_CLEAN_EXPORT: true,
  /** Portal Klienta z unikalnym linkiem + e-podpisy */
  CLIENT_PORTAL: true,
  /** Własne logo firmy na PDF / ofertach */
  CUSTOM_BRANDING: true,
  /** Zespołowa współpraca (wielu userów na projekcie) */
  TEAM_COLLABORATION: true,
  /** Offline mode + PWA background sync */
  OFFLINE_MODE: true,
  /** Priorytetowe wsparcie przez chat / email */
  PRIORITY_SUPPORT: true,
  /** Bulk export (wiele projektów naraz do ZIP) */
  BULK_EXPORT: true,
  /** Zaawansowane templates projektu (PRO templates library) */
  PRO_TEMPLATES: true,
} as const;

export type FreeTierLockedFeature = keyof typeof FREE_TIER_LOCKED_FEATURES;

/**
 * Czy dana funkcja jest dostępna dla użytkownika?
 */
export function canUseFeature(isPro: boolean | null | undefined, feature: FreeTierLockedFeature): boolean {
  if (isPro) return true;
  return !FREE_TIER_LOCKED_FEATURES[feature];
}

// ─── PDF Watermark configuration ───────────────────────────────────────────

/**
 * Parametry watermarku "DEMO" na PDF-ach dla FREE tier.
 * Watermark jest duży, po przekątnej, półprzezroczysty — PDF da się czytać ale
 * widać że to wersja demo i nie nadaje się do wysyłki do klienta.
 */
export const PDF_DEMO_WATERMARK = {
  text: "DEMO — ElektroSmart PRO",
  subtitle: "Wersja demonstracyjna — nie do celów komercyjnych",
  /** Kąt obrotu w stopniach (ujemny = góra-prawa do dół-lewej) */
  rotation: -35,
  /** Przezroczystość 0–1 */
  opacity: 0.18,
  /** Rozmiar czcionki w punktach */
  fontSize: 84,
  /** Kolor w formacie HEX — czerwono-pomarańczowy, dobrze widoczny na białym */
  color: "#DC2626",
  /** CTA który pojawi się w stopce każdej strony */
  footerCTA: "Aktywuj ElektroSmart PRO (159 zł/m-c) lub kup pojedynczy eksport (29 zł) → elektrosmart.pro/pro",
} as const;

// ─── Pay-per-export pricing ────────────────────────────────────────────────

export const PAY_PER_EXPORT_PRICE_PLN = 29;
export const PRO_SUBSCRIPTION_PRICE_PLN = 159;

/**
 * v2.1 soft-launch switch — hide the "Kup czysty PDF za 29 zł" CTA in UI
 * while the Stripe one-time product + Stripe Tax config are still being
 * validated. The /api/billing/pay-per-export endpoint stays functional
 * (webhook handler + unlock flow) so existing checkout links keep working.
 *
 * Flip to `true` once Stripe Tax is active + BLIK/P24 enabled (see
 * Stripe Dashboard → Payment methods) + one test purchase has succeeded.
 */
export const PAY_PER_EXPORT_ENABLED = false;

/**
 * Próg ROI: od ilu eksportów w miesiącu subskrypcja PRO się opłaca.
 * Math: 159 / 29 ≈ 5.48 → już przy 6 eksportach/m-c PRO tanieje.
 */
export const ROI_EXPORTS_BREAKEVEN = Math.ceil(PRO_SUBSCRIPTION_PRICE_PLN / PAY_PER_EXPORT_PRICE_PLN);
