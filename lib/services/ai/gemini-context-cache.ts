/**
 * gemini-context-cache.ts — M5: Google Gemini Context Caching
 *
 * Caches the combined PRICING_STATIC_SYSTEM_PROMPT + KNR local context
 * as a Google Gemini CachedContent (TTL 1h). Subsequent L3 calls reference
 * the cache name instead of re-sending the full context, reducing token costs
 * and latency by ~40-60% for large KNR context payloads.
 *
 * Requires: GOOGLE_GENERATIVE_AI_API_KEY env var.
 * Compatible with: @google/generative-ai ^0.24.1, @ai-sdk/google ^3.x
 */

import { GoogleAICacheManager } from "@google/generative-ai/server";
import { logger } from "@/lib/logger";

export const CACHE_MODEL_ID = "models/gemini-1.5-flash-001";
const CACHE_TTL_SECONDS = 3600; // 1 hour

/** Module-level cache state (persists across requests in the same Node.js worker) */
let _cacheName: string | null = null;
let _cacheExpiry = 0;
let _cachedForRateKey = "";

/**
 * Returns the Gemini CachedContent name for the pricing system prompt + KNR context.
 * Creates a new cache if none exists or if TTL expired / rate changed.
 *
 * @param systemPrompt  The static PRICING_STATIC_SYSTEM_PROMPT string
 * @param kbContext     Output of buildLocalKnrContext(baseRate) — the 35+ KNR JSON files
 * @param baseRate      Base labor rate (used to key the cache — different rates = different cache)
 * @returns             CachedContent name (e.g. "cachedContents/abc123") or null if caching fails
 */
export async function getPricingCacheName(
  systemPrompt: string,
  kbContext: string,
  baseRate: number,
): Promise<string | null> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) return null;

  const rateKey = String(Math.round(baseRate));

  if (
    _cacheName &&
    _cachedForRateKey === rateKey &&
    Date.now() < _cacheExpiry - 60_000
  ) {
    return _cacheName;
  }

  try {
    const cacheManager = new GoogleAICacheManager(apiKey);

    const cache = await cacheManager.create({
      model: CACHE_MODEL_ID,
      displayName: `ElektroSmart-PRO-KNR-R${rateKey}`,
      systemInstruction: systemPrompt,
      contents: [
        {
          role: "user",
          parts: [{ text: kbContext }],
        },
        {
          role: "model",
          parts: [{ text: "Kontekst KNR załadowany. Gotowy do wyceny pozycji kosztorysowych." }],
        },
      ],
      ttlSeconds: CACHE_TTL_SECONDS,
    });

    _cacheName = cache.name ?? null;
    _cachedForRateKey = rateKey;
    _cacheExpiry = Date.now() + CACHE_TTL_SECONDS * 1000;

    return _cacheName;
  } catch (err) {
    logger.error("[M5 ContextCache] Failed to create Gemini cache", { rateKey }, err);
    return null;
  }
}

/** Force-invalidate the module-level cache (e.g. after KNR data update). */
export function invalidatePricingCache(): void {
  _cacheName = null;
  _cacheExpiry = 0;
  _cachedForRateKey = "";
}
