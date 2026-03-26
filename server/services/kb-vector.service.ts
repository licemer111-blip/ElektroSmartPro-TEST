/**
 * KB Vector Service — Gemini CachedContent creation + similarity queries.
 * Handles createOrUpdateCache, queryKnowledgeBase, buildUserCache, queryUserKnowledgeBase.
 * Split from knowledge-base.service.ts for independent scaling.
 */

import { logger } from "@/lib/logger";
import { KB_MODEL, CACHE_TTL_SECONDS, isGoogleAIConfigured } from "@/lib/google-ai";
import { supabaseAdmin } from "@/lib/supabase-admin";

export interface QueryResult {
  answer: string;
  modelUsed: string;
  cachedTokensUsed: boolean;
}

// ─── Default system instructions ─────────────────────────────────────────────

const DEFAULT_SYSTEM_INSTRUCTION = `Jesteś ES-Engine 2 — zaawansowany silnik ekspercki ElektroSmart, ekspert kosztorysant instalacji elektrycznych w Polsce z uprawnieniami SEP.
Posiadasz pełną wiedzę z KNR (Katalogi Nakładów Rzeczowych), norm branżowych i cenników rynkowych 2026.
Odpowiadaj precyzyjnie, podając konkretne wartości, kody KNR, jednostki miary i ceny netto PLN.
Język odpowiedzi: polski. Styl: techniczny, zwięzły.`;

const USER_SYSTEM_INSTRUCTION = `Jesteś ES-Engine 2 — zaawansowany silnik ekspercki ElektroSmart, ekspert kosztorysant instalacji elektrycznych w Polsce z uprawnieniami SEP.
Posiadasz dostęp do PRYWATNEJ bazy wiedzy użytkownika — jego własnych cenników, norm i dokumentów.
PRIORYTET 1: Dane z prywatnych dokumentów użytkownika (poniżej).
PRIORYTET 2: Ogólna wiedza branżowa KNR i normy polskie.
Odpowiadaj precyzyjnie, podając konkretne wartości, kody, jednostki miary i ceny netto PLN.
Język odpowiedzi: polski. Styl: techniczny, zwięzły.`;

// ─── 1. Create/Update global cache ───────────────────────────────────────────

export async function createOrUpdateCache(
  fileUris: Array<{ uri: string; mimeType: string }>,
  systemInstruction?: string,
  ttlSeconds: number = CACHE_TTL_SECONDS
): Promise<string> {
  if (!isGoogleAIConfigured()) throw new Error("GOOGLE_AI_API_KEY is not configured");

  const { data: existing } = await supabaseAdmin
    .from("knowledge_base_meta").select("cache_name")
    .not("cache_name", "is", null).limit(1).single();

  if (existing?.cache_name) {
    try { await geminiV1Delete(existing.cache_name); } catch { /* expired */ }
  }

  const cache = await geminiV1CreateCache({
    model: `models/${KB_MODEL}`,
    displayName: "ElektroSmart-KnowledgeBase",
    systemInstruction: systemInstruction ?? DEFAULT_SYSTEM_INSTRUCTION,
    fileUris, ttlSeconds,
  });

  if (!cache.name) return "__no_cache__";

  const expireTime = new Date(Date.now() + ttlSeconds * 1000).toISOString();
  await supabaseAdmin.from("knowledge_base_meta")
    .update({ cache_name: cache.name, cache_expire_time: expireTime })
    .not("file_uri", "is", null);

  return cache.name;
}

// ─── 2. Query global KB ───────────────────────────────────────────────────────

export async function queryKnowledgeBase(
  prompt: string,
  options?: { temperature?: number; maxOutputTokens?: number }
): Promise<QueryResult> {
  if (!isGoogleAIConfigured()) throw new Error("GOOGLE_AI_API_KEY is not configured");

  const { data: meta } = await supabaseAdmin
    .from("knowledge_base_meta").select("cache_name, cache_expire_time")
    .not("cache_name", "is", null).order("uploaded_at", { ascending: false }).limit(1).single();

  const now = new Date();
  const cacheValid = meta?.cache_name && meta.cache_expire_time && new Date(meta.cache_expire_time) > now;

  if (cacheValid && meta?.cache_name) {
    const answer = await geminiV1Generate({ model: `models/${KB_MODEL}`, cachedContent: meta.cache_name, prompt, temperature: options?.temperature ?? 0.1, maxOutputTokens: options?.maxOutputTokens ?? 4096 });
    return { answer, modelUsed: KB_MODEL, cachedTokensUsed: true };
  }

  const answer = await geminiV1Generate({ model: `models/${KB_MODEL}`, systemInstruction: DEFAULT_SYSTEM_INSTRUCTION, prompt, temperature: options?.temperature ?? 0.1, maxOutputTokens: options?.maxOutputTokens ?? 4096 });
  return { answer, modelUsed: KB_MODEL, cachedTokensUsed: false };
}

// ─── 3. Build user-scoped cache ───────────────────────────────────────────────

export async function buildUserCache(userId: string): Promise<string> {
  if (!isGoogleAIConfigured()) throw new Error("GOOGLE_AI_API_KEY is not configured");

  const { data: files } = await supabaseAdmin
    .from("knowledge_base_meta").select("file_uri, mime_type, cache_name_user")
    .eq("user_id", userId).eq("state", "ACTIVE");

  if (!files || files.length === 0) throw new Error("Brak plików do zbudowania cache");

  const existingCache = files.find((f) => f.cache_name_user)?.cache_name_user;
  if (existingCache) {
    try { await geminiV1Delete(existingCache); } catch { /* expired */ }
  }

  const cache = await geminiV1CreateCache({
    model: `models/${KB_MODEL}`,
    displayName: `UserKB-${userId.slice(0, 8)}`,
    systemInstruction: USER_SYSTEM_INSTRUCTION,
    fileUris: files.map((f) => ({ uri: f.file_uri, mimeType: f.mime_type })),
    ttlSeconds: CACHE_TTL_SECONDS,
  });

  if (!cache.name) return "__no_cache__";

  const expireTime = new Date(Date.now() + CACHE_TTL_SECONDS * 1000).toISOString();
  await supabaseAdmin.from("knowledge_base_meta")
    .update({ cache_name_user: cache.name, cache_expire_time: expireTime })
    .eq("user_id", userId);

  return cache.name;
}

// ─── 4. Query user KB ─────────────────────────────────────────────────────────

export async function queryUserKnowledgeBase(
  prompt: string, userId: string,
  options?: { temperature?: number; maxOutputTokens?: number }
): Promise<QueryResult | null> {
  if (!isGoogleAIConfigured()) return null;

  const { data: meta } = await supabaseAdmin
    .from("knowledge_base_meta").select("cache_name_user, cache_expire_time")
    .eq("user_id", userId).not("cache_name_user", "is", null)
    .order("uploaded_at", { ascending: false }).limit(1).single();

  const now = new Date();
  const cacheValid = meta?.cache_name_user && meta.cache_expire_time && new Date(meta.cache_expire_time) > now;
  if (!cacheValid || !meta?.cache_name_user) return null;

  const answer = await geminiV1Generate({ model: `models/${KB_MODEL}`, cachedContent: meta.cache_name_user, prompt, temperature: options?.temperature ?? 0.1, maxOutputTokens: options?.maxOutputTokens ?? 600 });
  return { answer, modelUsed: KB_MODEL, cachedTokensUsed: true };
}

// ─── 5. Query user KB direct mode (small files < 4096 tokens) ────────────────

export async function queryUserKnowledgeBaseDirectMode(
  prompt: string, userId: string,
  options?: { temperature?: number; maxOutputTokens?: number }
): Promise<QueryResult | null> {
  if (!isGoogleAIConfigured()) return null;

  const { data: files } = await supabaseAdmin
    .from("knowledge_base_meta").select("file_uri, mime_type")
    .eq("user_id", userId).eq("state", "ACTIVE");

  if (!files || files.length === 0) return null;

  const fileParts = files.map((f) => ({ fileData: { fileUri: f.file_uri, mimeType: f.mime_type } }));
  const body = {
    system_instruction: { parts: [{ text: USER_SYSTEM_INSTRUCTION }] },
    contents: [{ role: "user", parts: [...fileParts, { text: prompt }] }],
    generationConfig: { temperature: options?.temperature ?? 0.1, maxOutputTokens: options?.maxOutputTokens ?? 600 },
  };

  const res = await fetch(
    `${GEMINI_V1}/models/${KB_MODEL}:generateContent?key=${geminiKey()}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
  );

  const rawText = await res.text();
  if (!rawText) return null;

  const data = JSON.parse(rawText) as { candidates?: Array<{ content: { parts: Array<{ text: string }> } }>; error?: { message: string } };
  if (!res.ok) { logger.error("Gemini direct mode failed:", {}, data.error?.message); return null; }

  const answer = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
  return answer.length >= 10 ? { answer, modelUsed: KB_MODEL, cachedTokensUsed: false } : null;
}

// ─── Gemini v1beta Direct API helpers ─────────────────────────────────────────

const GEMINI_V1 = "https://generativelanguage.googleapis.com/v1beta";

function geminiKey(): string {
  const key = process.env.GOOGLE_AI_API_KEY;
  if (!key) throw new Error("GOOGLE_AI_API_KEY is not set");
  return key;
}

async function geminiV1CreateCache(opts: {
  model: string; displayName: string; systemInstruction: string;
  fileUris: Array<{ uri: string; mimeType: string }>; ttlSeconds: number;
}): Promise<{ name: string | null }> {
  const body = {
    model: opts.model, displayName: opts.displayName,
    systemInstruction: { parts: [{ text: opts.systemInstruction }] },
    contents: opts.fileUris.map((f) => ({ role: "user", parts: [{ fileData: { fileUri: f.uri, mimeType: f.mimeType } }] })),
    ttl: `${opts.ttlSeconds}s`,
  };

  const res = await fetch(`${GEMINI_V1}/cachedContents?key=${geminiKey()}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const text = await res.text();
  if (!text) throw new Error(`Cache create failed: empty response (HTTP ${res.status})`);
  const data = JSON.parse(text) as { name?: string; error?: { message: string; code?: number; status?: string } };

  if (!res.ok && data.error?.status === "INVALID_ARGUMENT" && data.error.message?.includes("too small")) return { name: null };
  if (!res.ok || !data.name) throw new Error(`Cache create failed [${res.status}]: ${JSON.stringify(data.error ?? data)}`);
  return { name: data.name };
}

async function geminiV1Delete(cacheName: string): Promise<void> {
  await fetch(`${GEMINI_V1}/${cacheName}?key=${geminiKey()}`, { method: "DELETE" });
}

async function geminiV1Generate(opts: {
  model: string; prompt: string; cachedContent?: string;
  systemInstruction?: string; temperature: number; maxOutputTokens: number;
}): Promise<string> {
  const body: Record<string, unknown> = {
    contents: [{ role: "user", parts: [{ text: opts.prompt }] }],
    generationConfig: { temperature: opts.temperature, maxOutputTokens: opts.maxOutputTokens },
  };
  if (opts.cachedContent) body.cachedContent = opts.cachedContent;
  if (opts.systemInstruction) body.systemInstruction = { parts: [{ text: opts.systemInstruction }] };

  const res = await fetch(`${GEMINI_V1}/${opts.model}:generateContent?key=${geminiKey()}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const rawText = await res.text();
  if (!rawText) throw new Error(`Gemini generate failed: empty response (HTTP ${res.status})`);
  const data = JSON.parse(rawText) as { candidates?: Array<{ content: { parts: Array<{ text: string }> } }>; error?: { message: string } };
  if (!res.ok) throw new Error(`Gemini generate failed: ${JSON.stringify(data.error ?? data)}`);
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}
