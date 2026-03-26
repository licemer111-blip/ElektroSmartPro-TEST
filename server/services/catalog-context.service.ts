/**
 * Catalog Context Service — Tier 3 RAG
 *
 * Queries the global catalog_items table (ElektroSmart Core) using
 * PostgreSQL fulltext search (search_catalog RPC) and formats results
 * as a compact AI context string.
 *
 * Also manages a Gemini Context Cache of the full catalog export
 * (refreshed every 24h via rebuildCatalogCache) for lightning-fast Tier 3.
 */

import { supabaseAdmin } from "@/lib/supabase-admin";
import { isGoogleAIConfigured } from "@/lib/google-ai";
import { ai, KB_MODEL, CACHE_TTL_SECONDS } from "@/lib/google-ai";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CatalogContextItem {
  name: string;
  unit: string;
  base_labor_price: number;
  base_material_price: number;
  category: string | null;
  price_min: number | null;
  price_max: number | null;
  market_comment: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATALOG_CACHE_KEY = "catalog_export_v1";
const CATALOG_SEARCH_LIMIT = 12;
const CATALOG_CACHE_TIMEOUT_MS = 2000;

// ─── 1. Query catalog via fulltext search (fast, per-query) ───────────────────

/**
 * Searches global catalog_items using the search_catalog RPC (fulltext + ranking).
 * Returns a formatted context string for AI injection, or null if no results.
 */
export async function queryGlobalCatalog(query: string): Promise<string | null> {
  if (!query || query.trim().length < 2) return null;

  try {
    // Use supabaseAdmin to bypass RLS — catalog is global/public data
    const { data, error } = await supabaseAdmin.rpc("search_catalog", {
      search_term: query.trim(),
      limit_val: CATALOG_SEARCH_LIMIT,
      filter_type: null,
      filter_category_id: null,
    });

    if (error || !data || data.length === 0) {
      // Fallback: simple ilike search if RPC fails
      return await fallbackCatalogSearch(query);
    }

    return formatCatalogContext(data as CatalogContextItem[]);
  } catch {
    return await fallbackCatalogSearch(query);
  }
}

async function fallbackCatalogSearch(query: string): Promise<string | null> {
  try {
    const { data } = await supabaseAdmin
      .from("catalog_items")
      .select("name, unit, base_labor_price, base_material_price, price_min, price_max, market_comment")
      .is("user_id", null)
      .eq("is_active", true)
      .ilike("name", `%${query.trim()}%`)
      .limit(CATALOG_SEARCH_LIMIT);

    if (!data || data.length === 0) return null;
    return formatCatalogContext(data as CatalogContextItem[]);
  } catch {
    return null;
  }
}

function formatCatalogContext(items: CatalogContextItem[]): string | null {
  if (!items || items.length === 0) return null;

  const lines = items.map((item) => {
    const parts: string[] = [`• ${item.name} [${item.unit ?? "szt"}]`];

    if (item.base_labor_price > 0) {
      parts.push(`Robocizna: ${item.base_labor_price.toFixed(2)} PLN`);
    }
    if (item.base_material_price > 0) {
      parts.push(`Materiał: ${item.base_material_price.toFixed(2)} PLN`);
    }
    if (item.price_min && item.price_max) {
      parts.push(`Rynek: ${item.price_min}–${item.price_max} PLN`);
    }
    if (item.market_comment) {
      parts.push(`(${item.market_comment})`);
    }

    return parts.join(" | ");
  });

  return `Znalezione pozycje w katalogu ElektroSmart (${items.length}):\n${lines.join("\n")}`;
}

// ─── 2. Catalog Cache Management (Tier 3 fast path) ──────────────────────────

/**
 * Exports the full global catalog to a .txt file and creates/updates
 * a Gemini CachedContent for it. Called by the 24h background job.
 *
 * Stores cache metadata in a dedicated row in knowledge_base_meta
 * with file_name = CATALOG_CACHE_KEY.
 */
export async function rebuildCatalogCache(): Promise<{ cacheName: string; itemCount: number }> {
  if (!isGoogleAIConfigured()) {
    throw new Error("GOOGLE_AI_API_KEY is not configured");
  }

  // Fetch ALL active global catalog items
  const { data: items, error } = await supabaseAdmin
    .from("catalog_items")
    .select(`
      name, unit, base_labor_price, base_material_price,
      price_min, price_max, market_comment,
      catalog_categories ( name )
    `)
    .is("user_id", null)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error || !items || items.length === 0) {
    throw new Error("Brak pozycji w katalogu do eksportu");
  }

  // Build compact text export
  const lines: string[] = [
    "KATALOG ELEKTROSMART PRO — CENNIK BAZOWY 2026",
    `Eksport: ${new Date().toISOString()} | Pozycji: ${items.length}`,
    "Format: Nazwa [Jednostka] | Robocizna PLN | Materiał PLN | Rynek min-max PLN",
    "─".repeat(80),
  ];

  for (const item of items) {
    const cat = Array.isArray(item.catalog_categories)
      ? item.catalog_categories[0]?.name
      : (item.catalog_categories as { name: string } | null)?.name;

    const parts = [`${item.name} [${item.unit ?? "szt"}]`];
    if (item.base_labor_price > 0) parts.push(`R:${item.base_labor_price.toFixed(2)}`);
    if (item.base_material_price > 0) parts.push(`M:${item.base_material_price.toFixed(2)}`);
    if (item.price_min && item.price_max) parts.push(`rynek:${item.price_min}-${item.price_max}`);
    if (cat) parts.push(`[${cat}]`);

    lines.push(parts.join(" | "));
  }

  const catalogText = lines.join("\n");
  const buffer = Buffer.from(catalogText, "utf-8");

  // Write temp file and upload to Gemini
  const { writeFile, mkdir } = await import("fs/promises");
  const os = await import("os");
  const path = await import("path");
  const tmpDir = path.join(os.tmpdir(), "elektrosmart-kb");
  await mkdir(tmpDir, { recursive: true });
  const tmpPath = path.join(tmpDir, "catalog_export.txt");
  await writeFile(tmpPath, buffer);

  let geminiFile = await ai.files.upload({
    file: tmpPath,
    config: { mimeType: "text/plain", displayName: "ElektroSmart-Catalog-Export" },
  });

  while (geminiFile.state === "PROCESSING") {
    await new Promise((r) => setTimeout(r, 2000));
    geminiFile = await ai.files.get({ name: geminiFile.name! });
  }

  if (geminiFile.state !== "ACTIVE") {
    throw new Error(`Catalog file upload failed: ${geminiFile.state}`);
  }

  // Delete old catalog cache if exists
  const { data: existing } = await supabaseAdmin
    .from("knowledge_base_meta")
    .select("cache_name, gemini_file_name")
    .eq("file_name", CATALOG_CACHE_KEY)
    .is("user_id", null)
    .limit(1)
    .single();

  if (existing?.cache_name) {
    try { await geminiV1Delete(existing.cache_name); } catch { /* expired */ }
  }
  if (existing?.gemini_file_name) {
    try { await ai.files.delete({ name: existing.gemini_file_name }); } catch { /* ignore */ }
  }

  // Create new Gemini cache
  const instruction = `Jesteś ES-Engine 2 — zaawansowany silnik ekspercki ElektroSmart, ekspert kosztorysant instalacji elektrycznych.
Posiadasz pełny katalog pozycji ElektroSmart PRO z cenami bazowymi 2026.
Gdy pytają o cenę lub pozycję — podaj dokładne wartości z katalogu.
Format: Nazwa | Robocizna (R) | Materiał (M) | Rynek min-max.
Język: polski. Styl: techniczny, zwięzły.`;

  const cache = await geminiV1CreateCache({
    model: `models/${KB_MODEL}`,
    displayName: "ElektroSmart-Catalog",
    systemInstruction: instruction,
    fileUris: [{ uri: geminiFile.uri!, mimeType: "text/plain" }],
    ttlSeconds: CACHE_TTL_SECONDS,
  });

  const expireTime = new Date(Date.now() + CACHE_TTL_SECONDS * 1000).toISOString();
  const cacheName = cache.name ?? "__no_cache__";

  // Upsert catalog cache metadata
  await supabaseAdmin.from("knowledge_base_meta").upsert({
    file_name: CATALOG_CACHE_KEY,
    file_uri: geminiFile.uri,
    mime_type: "text/plain",
    size_bytes: buffer.length,
    gemini_file_name: geminiFile.name,
    state: "ACTIVE",
    uploaded_at: new Date().toISOString(),
    user_id: null,
    cache_name: cacheName !== "__no_cache__" ? cacheName : null,
    cache_expire_time: cacheName !== "__no_cache__" ? expireTime : null,
  }, { onConflict: "file_name" });

  return { cacheName, itemCount: items.length };
}

/**
 * Query the catalog Gemini cache (fast path).
 * Falls back to queryGlobalCatalog (DB search) if cache unavailable.
 */
export async function queryCatalogCache(
  query: string,
  options?: { temperature?: number; maxOutputTokens?: number }
): Promise<string | null> {
  if (!isGoogleAIConfigured()) return null;

  try {
    const { data: meta } = await supabaseAdmin
      .from("knowledge_base_meta")
      .select("cache_name, cache_expire_time")
      .eq("file_name", CATALOG_CACHE_KEY)
      .is("user_id", null)
      .not("cache_name", "is", null)
      .limit(1)
      .single();

    const now = new Date();
    const cacheValid =
      meta?.cache_name &&
      meta.cache_expire_time &&
      new Date(meta.cache_expire_time) > now;

    if (!cacheValid || !meta?.cache_name) {
      // No cache — fall back to DB search
      return await queryGlobalCatalog(query);
    }

    const answer = await geminiV1Generate({
      model: `models/${KB_MODEL}`,
      cachedContent: meta.cache_name,
      prompt: `Znajdź w katalogu pozycje pasujące do: "${query}". Podaj nazwy, jednostki i ceny.`,
      temperature: options?.temperature ?? 0.1,
      maxOutputTokens: options?.maxOutputTokens ?? 400,
    });

    if (!answer || answer.trim().length < 10) return null;
    return `Katalog ElektroSmart (cache):\n${answer.trim()}`;
  } catch {
    // Silent fallback to DB search
    return await queryGlobalCatalog(query);
  }
}

/**
 * Get catalog cache status (for admin panel).
 */
export async function getCatalogCacheStatus(): Promise<{
  cacheExists: boolean;
  expireTime: string | null;
  itemCount: number | null;
}> {
  const { data } = await supabaseAdmin
    .from("knowledge_base_meta")
    .select("cache_name, cache_expire_time, size_bytes")
    .eq("file_name", CATALOG_CACHE_KEY)
    .is("user_id", null)
    .limit(1)
    .single();

  const now = new Date();
  const cacheValid =
    data?.cache_name &&
    data.cache_expire_time &&
    new Date(data.cache_expire_time) > now;

  return {
    cacheExists: Boolean(cacheValid),
    expireTime: data?.cache_expire_time ?? null,
    itemCount: null,
  };
}

// ─── Gemini v1 Direct API helpers (duplicated from kb service for isolation) ──

const GEMINI_V1 = "https://generativelanguage.googleapis.com/v1beta";

function geminiKey(): string {
  const key = process.env.GOOGLE_AI_API_KEY;
  if (!key) throw new Error("GOOGLE_AI_API_KEY is not set");
  return key;
}

async function geminiV1CreateCache(opts: {
  model: string;
  displayName: string;
  systemInstruction: string;
  fileUris: Array<{ uri: string; mimeType: string }>;
  ttlSeconds: number;
}): Promise<{ name: string | null }> {
  const body = {
    model: opts.model,
    displayName: opts.displayName,
    systemInstruction: { parts: [{ text: opts.systemInstruction }] },
    contents: opts.fileUris.map((f) => ({
      role: "user",
      parts: [{ fileData: { fileUri: f.uri, mimeType: f.mimeType } }],
    })),
    ttl: `${opts.ttlSeconds}s`,
  };

  const res = await fetch(`${GEMINI_V1}/cachedContents?key=${geminiKey()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!text) throw new Error(`Cache create failed: empty response (HTTP ${res.status})`);
  const data = JSON.parse(text) as {
    name?: string;
    error?: { message: string; code?: number; status?: string };
  };

  if (!res.ok && data.error?.status === "INVALID_ARGUMENT" && data.error.message?.includes("too small")) {
    return { name: null };
  }
  if (!res.ok || !data.name) {
    throw new Error(`Cache create failed [${res.status}]: ${JSON.stringify(data.error ?? data)}`);
  }
  return { name: data.name };
}

async function geminiV1Delete(cacheName: string): Promise<void> {
  await fetch(`${GEMINI_V1}/${cacheName}?key=${geminiKey()}`, { method: "DELETE" });
}

async function geminiV1Generate(opts: {
  model: string;
  prompt: string;
  cachedContent?: string;
  systemInstruction?: string;
  temperature: number;
  maxOutputTokens: number;
}): Promise<string> {
  const body: Record<string, unknown> = {
    contents: [{ role: "user", parts: [{ text: opts.prompt }] }],
    generationConfig: {
      temperature: opts.temperature,
      maxOutputTokens: opts.maxOutputTokens,
    },
  };

  if (opts.cachedContent) body.cachedContent = opts.cachedContent;
  if (opts.systemInstruction) {
    body.systemInstruction = { parts: [{ text: opts.systemInstruction }] };
  }

  const res = await fetch(
    `${GEMINI_V1}/${opts.model}:generateContent?key=${geminiKey()}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  const rawText = await res.text();
  if (!rawText) throw new Error(`Gemini generate failed: empty response (HTTP ${res.status})`);
  const data = JSON.parse(rawText) as {
    candidates?: Array<{ content: { parts: Array<{ text: string }> } }>;
    error?: { message: string };
  };

  if (!res.ok) throw new Error(`Gemini generate failed: ${JSON.stringify(data.error ?? data)}`);
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

export { CATALOG_CACHE_TIMEOUT_MS };
