/**
 * Knowledge Base Service — Google Gemini 1.5 Pro Context Caching
 *
 * ISOLATED from OpenAI logic. This is a "Hidden Expert" layer.
 * Feed it KNR norms, price lists, technical standards.
 * Query it via queryKnowledgeBase() for expert answers.
 *
 * Uses new @google/genai SDK (v1 API — supports createCachedContent).
 */

import { logger } from "@/lib/logger";
import path from "path";
import { ai, KB_MODEL, CACHE_TTL_SECONDS, isGoogleAIConfigured } from "@/lib/google-ai";
import { supabaseAdmin } from "@/lib/supabase-admin";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UploadedFile {
  fileUri: string;
  mimeType: string;
  displayName: string;
  sizeBytes: number;
  state: string;
}

export interface KnowledgeBaseStatus {
  cacheExists: boolean;
  cacheName: string | null;
  cacheExpireTime: string | null;
  fileCount: number;
  files: Array<{ name: string; uri: string; mimeType: string; sizeBytes: number; uploadedAt: string | null }>;
  modelName: string;
  directMode: boolean;
}

export interface QueryResult {
  answer: string;
  modelUsed: string;
  cachedTokensUsed: boolean;
}

// ─── 1. Upload document to Google AI File Manager ─────────────────────────────

/**
 * Uploads a file buffer (PDF or plain text) to Google AI File Manager.
 * Returns the file URI needed to create a CachedContent.
 */
export async function uploadToKnowledgeBase(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: "application/pdf" | "text/plain"
): Promise<UploadedFile> {
  if (!isGoogleAIConfigured()) {
    throw new Error("GOOGLE_AI_API_KEY is not configured");
  }

  const tmpPath = await writeTempFile(fileBuffer, fileName);

  // Upload via new SDK: ai.files.upload
  let file = await ai.files.upload({
    file: tmpPath,
    config: { mimeType, displayName: fileName },
  });

  // Poll until ACTIVE
  while (file.state === "PROCESSING") {
    await new Promise((r) => setTimeout(r, 2000));
    file = await ai.files.get({ name: file.name! });
  }

  if (file.state !== "ACTIVE") {
    throw new Error(`File upload failed. State: ${file.state}`);
  }

  // Persist to Supabase tracking table
  await supabaseAdmin.from("knowledge_base_meta").upsert({
    file_name: fileName,
    file_uri: file.uri,
    mime_type: mimeType,
    size_bytes: Number(file.sizeBytes ?? 0),
    gemini_file_name: file.name,
    state: file.state,
    uploaded_at: new Date().toISOString(),
  }, { onConflict: "file_uri" });

  return {
    fileUri: file.uri!,
    mimeType: file.mimeType!,
    displayName: file.displayName ?? fileName,
    sizeBytes: Number(file.sizeBytes ?? 0),
    state: file.state!,
  };
}

// ─── 2. Create or update the Gemini CachedContent ────────────────────────────

/**
 * Creates a new CachedContent from the given file URIs.
 * If a cache already exists, deletes it first (one active cache at a time).
 * TTL defaults to 24h (CACHE_TTL_SECONDS).
 */
export async function createOrUpdateCache(
  fileUris: Array<{ uri: string; mimeType: string }>,
  systemInstruction?: string,
  ttlSeconds: number = CACHE_TTL_SECONDS
): Promise<string> {
  if (!isGoogleAIConfigured()) {
    throw new Error("GOOGLE_AI_API_KEY is not configured");
  }

  // Delete existing cache if present
  const { data: existing } = await supabaseAdmin
    .from("knowledge_base_meta")
    .select("cache_name")
    .not("cache_name", "is", null)
    .limit(1)
    .single();

  if (existing?.cache_name) {
    try { await geminiV1Delete(existing.cache_name); } catch { /* expired */ }
  }

  const defaultInstruction = `Jesteś ES-Engine 2 — zaawansowany silnik ekspercki ElektroSmart, ekspert kosztorysant instalacji elektrycznych w Polsce z uprawnieniami SEP.
Posiadasz pełną wiedzę z KNR (Katalogi Nakładów Rzeczowych), norm branżowych i cenników rynkowych 2026.
Odpowiadaj precyzyjnie, podając konkretne wartości, kody KNR, jednostki miary i ceny netto PLN.
Język odpowiedzi: polski. Styl: techniczny, zwięzły.`;

  // Direct v1beta API call — SDK always uses v1beta but ignores apiVersion param
  const cache = await geminiV1CreateCache({
    model: `models/${KB_MODEL}`,
    displayName: "ElektroSmart-KnowledgeBase",
    systemInstruction: systemInstruction ?? defaultInstruction,
    fileUris,
    ttlSeconds,
  });

  // null = content too small for caching (<4096 tokens) — files stored but no cache
  if (!cache.name) {
    return "__no_cache__";
  }

  const expireTime = new Date(Date.now() + ttlSeconds * 1000).toISOString();

  // Update all rows with the new cache name and expiry
  await supabaseAdmin
    .from("knowledge_base_meta")
    .update({ cache_name: cache.name, cache_expire_time: expireTime })
    .not("file_uri", "is", null);

  return cache.name;
}

// ─── 3. Query the Knowledge Base using the active cache ───────────────────────

/**
 * Queries Gemini 1.5 Pro using the active CachedContent.
 * Falls back to a direct (uncached) call if no cache exists.
 */
export async function queryKnowledgeBase(
  prompt: string,
  options?: { temperature?: number; maxOutputTokens?: number }
): Promise<QueryResult> {
  if (!isGoogleAIConfigured()) {
    throw new Error("GOOGLE_AI_API_KEY is not configured");
  }

  const { data: meta } = await supabaseAdmin
    .from("knowledge_base_meta")
    .select("cache_name, cache_expire_time")
    .not("cache_name", "is", null)
    .order("uploaded_at", { ascending: false })
    .limit(1)
    .single();

  const now = new Date();
  const cacheValid =
    meta?.cache_name &&
    meta.cache_expire_time &&
    new Date(meta.cache_expire_time) > now;

  if (cacheValid && meta?.cache_name) {
    // Direct v1 API call with cachedContent
    const answer = await geminiV1Generate({
      model: `models/${KB_MODEL}`,
      cachedContent: meta.cache_name,
      prompt,
      temperature: options?.temperature ?? 0.1,
      maxOutputTokens: options?.maxOutputTokens ?? 4096,
    });
    return { answer, modelUsed: KB_MODEL, cachedTokensUsed: true };
  }

  // Fallback: no active cache — direct query without file context
  const answer = await geminiV1Generate({
    model: `models/${KB_MODEL}`,
    systemInstruction: `Jesteś ES-Engine 2 — zaawansowany silnik ekspercki ElektroSmart, ekspert kosztorysant instalacji elektrycznych w Polsce z uprawnieniami SEP.
Odpowiadaj precyzyjnie po polsku, podając konkretne wartości i ceny netto PLN 2026.`,
    prompt,
    temperature: options?.temperature ?? 0.1,
    maxOutputTokens: options?.maxOutputTokens ?? 4096,
  });
  return { answer, modelUsed: KB_MODEL, cachedTokensUsed: false };
}

// ─── 4. Get current Knowledge Base status ────────────────────────────────────

export async function getKnowledgeBaseStatus(): Promise<KnowledgeBaseStatus> {
  const { data: files } = await supabaseAdmin
    .from("knowledge_base_meta")
    .select("file_name, file_uri, mime_type, size_bytes, cache_name, cache_expire_time, uploaded_at")
    .order("uploaded_at", { ascending: false });

  const activeMeta = files?.find((f) => f.cache_name);
  const now = new Date();
  const cacheValid =
    activeMeta?.cache_expire_time &&
    new Date(activeMeta.cache_expire_time) > now;

  return {
    cacheExists: Boolean(cacheValid),
    cacheName: cacheValid ? (activeMeta?.cache_name ?? null) : null,
    cacheExpireTime: cacheValid ? (activeMeta?.cache_expire_time ?? null) : null,
    fileCount: files?.length ?? 0,
    files: (files ?? []).map((f) => ({
      name: f.file_name,
      uri: f.file_uri,
      mimeType: f.mime_type,
      sizeBytes: f.size_bytes,
      uploadedAt: f.uploaded_at ?? null,
    })),
    modelName: KB_MODEL,
    directMode: false,
  };
}

// ─── 5. Clear the cache and all tracked files ─────────────────────────────────

export async function clearKnowledgeBase(): Promise<void> {
  const { data: files } = await supabaseAdmin
    .from("knowledge_base_meta")
    .select("gemini_file_name, cache_name");

  // Delete Gemini caches
  const cacheNames = [...new Set((files ?? []).map((f) => f.cache_name).filter(Boolean))];
  for (const cacheName of cacheNames) {
    try { await geminiV1Delete(cacheName); } catch { /* already expired */ }
  }

  // Delete Gemini files
  for (const f of files ?? []) {
    if (f.gemini_file_name) {
      try { await ai.files.delete({ name: f.gemini_file_name }); } catch { /* ignore */ }
    }
  }

  // Clear tracking table
  await supabaseAdmin.from("knowledge_base_meta").delete().not("id", "is", null);
}

// ─── User-scoped KB functions ─────────────────────────────────────────────────

/**
 * Upload a file to the Knowledge Base scoped to a specific user.
 * Stored with user_id so RLS isolates it from other users.
 */
export async function uploadToKnowledgeBaseForUser(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: "application/pdf" | "text/plain",
  userId: string
): Promise<UploadedFile> {
  if (!isGoogleAIConfigured()) {
    throw new Error("GOOGLE_AI_API_KEY is not configured");
  }

  // ── NUCLEAR PURGE: delete ALL existing user files + cache before upload ──
  // New file = new truth. No stale data from previous uploads.
  const { data: oldFiles } = await supabaseAdmin
    .from("knowledge_base_meta")
    .select("gemini_file_name, cache_name_user")
    .eq("user_id", userId);

  if (oldFiles && oldFiles.length > 0) {
    // Delete old Gemini user cache
    const oldCache = oldFiles.find((f) => f.cache_name_user)?.cache_name_user;
    if (oldCache) {
      try { await geminiV1Delete(oldCache); } catch { /* expired */ }
    }
    // Delete old Gemini files
    for (const f of oldFiles) {
      if (f.gemini_file_name) {
        try { await ai.files.delete({ name: f.gemini_file_name }); } catch { /* ignore */ }
      }
    }
    // Wipe all user rows from tracking table
    await supabaseAdmin.from("knowledge_base_meta").delete().eq("user_id", userId);
    logger.info(`[KB-PURGE] Deleted ${oldFiles.length} old files for user ${userId.slice(0, 8)}`);
  }

  // ── Upload new file ──
  const tmpPath = await writeTempFile(fileBuffer, fileName);

  let file = await ai.files.upload({
    file: tmpPath,
    config: { mimeType, displayName: `[user:${userId.slice(0, 8)}] ${fileName}` },
  });

  while (file.state === "PROCESSING") {
    await new Promise((r) => setTimeout(r, 2000));
    file = await ai.files.get({ name: file.name! });
  }

  if (file.state !== "ACTIVE") {
    throw new Error(`File upload failed. State: ${file.state}`);
  }

  await supabaseAdmin.from("knowledge_base_meta").insert({
    file_name: fileName,
    file_uri: file.uri,
    mime_type: mimeType,
    size_bytes: Number(file.sizeBytes ?? 0),
    gemini_file_name: file.name,
    state: file.state,
    uploaded_at: new Date().toISOString(),
    user_id: userId,
  });

  return {
    fileUri: file.uri!,
    mimeType: file.mimeType!,
    displayName: file.displayName ?? fileName,
    sizeBytes: Number(file.sizeBytes ?? 0),
    state: file.state!,
  };
}

/**
 * Get KB status for a specific user (only their files).
 */
export async function getKnowledgeBaseStatusForUser(userId: string): Promise<KnowledgeBaseStatus> {
  const { data: files } = await supabaseAdmin
    .from("knowledge_base_meta")
    .select("file_name, file_uri, mime_type, size_bytes, cache_name_user, cache_expire_time, uploaded_at")
    .eq("user_id", userId)
    .order("uploaded_at", { ascending: false });

  const activeMeta = files?.find((f) => f.cache_name_user);
  const now = new Date();
  const cacheValid =
    activeMeta?.cache_expire_time &&
    new Date(activeMeta.cache_expire_time) > now;

  const fileCount = files?.length ?? 0;
  const cacheExistsFlag = Boolean(cacheValid);

  return {
    cacheExists: cacheExistsFlag,
    cacheName: cacheValid ? (activeMeta?.cache_name_user ?? null) : null,
    cacheExpireTime: cacheValid ? (activeMeta?.cache_expire_time ?? null) : null,
    fileCount,
    files: (files ?? []).map((f) => ({
      name: f.file_name,
      uri: f.file_uri,
      mimeType: f.mime_type,
      sizeBytes: f.size_bytes,
      uploadedAt: f.uploaded_at ?? null,
    })),
    modelName: KB_MODEL,
    directMode: fileCount > 0 && !cacheExistsFlag,
  };
}

/**
 * Build (or rebuild) a Gemini CachedContent for a specific user's files.
 * Separate cache from the global one — stored in cache_name_user column.
 */
export async function buildUserCache(userId: string): Promise<string> {
  if (!isGoogleAIConfigured()) {
    throw new Error("GOOGLE_AI_API_KEY is not configured");
  }

  const { data: files } = await supabaseAdmin
    .from("knowledge_base_meta")
    .select("file_uri, mime_type, cache_name_user")
    .eq("user_id", userId)
    .eq("state", "ACTIVE");

  if (!files || files.length === 0) {
    throw new Error("Brak plików do zbudowania cache");
  }

  // Delete existing user cache
  const existingCache = files.find((f) => f.cache_name_user)?.cache_name_user;
  if (existingCache) {
    try { await geminiV1Delete(existingCache); } catch { /* expired */ }
  }

  const userInstruction = `Jesteś ES-Engine 2 — zaawansowany silnik ekspercki ElektroSmart, ekspert kosztorysant instalacji elektrycznych w Polsce z uprawnieniami SEP.
Posiadasz dostęp do PRYWATNEJ bazy wiedzy użytkownika — jego własnych cenników, norm i dokumentów.
PRIORYTET 1: Dane z prywatnych dokumentów użytkownika (poniżej).
PRIORYTET 2: Ogólna wiedza branżowa KNR i normy polskie.
Odpowiadaj precyzyjnie, podając konkretne wartości, kody, jednostki miary i ceny netto PLN.
Język odpowiedzi: polski. Styl: techniczny, zwięzły.`;

  const cache = await geminiV1CreateCache({
    model: `models/${KB_MODEL}`,
    displayName: `UserKB-${userId.slice(0, 8)}`,
    systemInstruction: userInstruction,
    fileUris: files.map((f) => ({ uri: f.file_uri, mimeType: f.mime_type })),
    ttlSeconds: CACHE_TTL_SECONDS,
  });

  if (!cache.name) {
    return "__no_cache__";
  }

  const expireTime = new Date(Date.now() + CACHE_TTL_SECONDS * 1000).toISOString();

  // Store cache name in user's rows
  await supabaseAdmin
    .from("knowledge_base_meta")
    .update({ cache_name_user: cache.name, cache_expire_time: expireTime })
    .eq("user_id", userId);

  return cache.name;
}

/**
 * Query the user's private KB cache.
 * Returns null if no active cache exists for this user.
 */
export async function queryUserKnowledgeBase(
  prompt: string,
  userId: string,
  options?: { temperature?: number; maxOutputTokens?: number }
): Promise<QueryResult | null> {
  if (!isGoogleAIConfigured()) return null;

  const { data: meta } = await supabaseAdmin
    .from("knowledge_base_meta")
    .select("cache_name_user, cache_expire_time")
    .eq("user_id", userId)
    .not("cache_name_user", "is", null)
    .order("uploaded_at", { ascending: false })
    .limit(1)
    .single();

  const now = new Date();
  const cacheValid =
    meta?.cache_name_user &&
    meta.cache_expire_time &&
    new Date(meta.cache_expire_time) > now;

  if (!cacheValid || !meta?.cache_name_user) return null;

  const answer = await geminiV1Generate({
    model: `models/${KB_MODEL}`,
    cachedContent: meta.cache_name_user,
    prompt,
    temperature: options?.temperature ?? 0.1,
    maxOutputTokens: options?.maxOutputTokens ?? 600,
  });

  return { answer, modelUsed: KB_MODEL, cachedTokensUsed: true };
}

/**
 * Query user's KB files directly (no cache) — for small files < 4096 tokens.
 * Sends all user file URIs inline as fileData parts in a single Gemini request.
 */
export async function queryUserKnowledgeBaseDirectMode(
  prompt: string,
  userId: string,
  options?: { temperature?: number; maxOutputTokens?: number }
): Promise<QueryResult | null> {
  if (!isGoogleAIConfigured()) return null;

  const { data: files } = await supabaseAdmin
    .from("knowledge_base_meta")
    .select("file_uri, mime_type")
    .eq("user_id", userId)
    .eq("state", "ACTIVE");

  if (!files || files.length === 0) return null;

  const systemInstruction = `Jesteś ES-Engine 2 — zaawansowany silnik ekspercki ElektroSmart, ekspert kosztorysant instalacji elektrycznych w Polsce z uprawnieniami SEP.
Posiadasz dostęp do PRYWATNEJ bazy wiedzy użytkownika — jego własnych cenników, norm i dokumentów.
PRIORYTET 1: Dane z prywatnych dokumentów użytkownika (poniżej).
PRIORYTET 2: Ogólna wiedza branżowa KNR i normy polskie.
Odpowiadaj precyzyjnie, podając konkretne wartości, kody, jednostki miary i ceny netto PLN.
Język odpowiedzi: polski. Styl: techniczny, zwięzły.`;

  const fileParts = files.map((f) => ({
    fileData: { fileUri: f.file_uri, mimeType: f.mime_type },
  }));

  const body = {
    system_instruction: { parts: [{ text: systemInstruction }] },
    contents: [
      {
        role: "user",
        parts: [...fileParts, { text: prompt }],
      },
    ],
    generationConfig: {
      temperature: options?.temperature ?? 0.1,
      maxOutputTokens: options?.maxOutputTokens ?? 600,
    },
  };

  const res = await fetch(
    `${GEMINI_V1}/models/${KB_MODEL}:generateContent?key=${geminiKey()}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  const rawText = await res.text();
  if (!rawText) return null;

  const data = JSON.parse(rawText) as {
    candidates?: Array<{ content: { parts: Array<{ text: string }> } }>;
    error?: { message: string };
  };

  if (!res.ok) {
    logger.error("Gemini direct mode failed:", {}, data.error?.message);
    return null;
  }

  const answer = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
  return answer.length >= 10 ? { answer, modelUsed: KB_MODEL, cachedTokensUsed: false } : null;
}

/**
 * Delete a single file from a user's Knowledge Base.
 * Removes from Gemini File Manager + knowledge_base_meta row.
 * Invalidates the user's cache so it must be rebuilt.
 */
export async function deleteKnowledgeBaseFileForUser(
  fileUri: string,
  userId: string
): Promise<void> {
  const { data: row } = await supabaseAdmin
    .from("knowledge_base_meta")
    .select("gemini_file_name, cache_name_user")
    .eq("file_uri", fileUri)
    .eq("user_id", userId)
    .single();

  if (!row) return;

  // Invalidate user cache (must rebuild after deletion)
  if (row.cache_name_user) {
    try { await geminiV1Delete(row.cache_name_user); } catch { /* expired */ }
    // Clear cache reference from all user rows
    await supabaseAdmin
      .from("knowledge_base_meta")
      .update({ cache_name_user: null, cache_expire_time: null })
      .eq("user_id", userId);
  }

  // Delete Gemini file
  if (row.gemini_file_name) {
    try { await ai.files.delete({ name: row.gemini_file_name }); } catch { /* ignore */ }
  }

  // Remove row from tracking table
  await supabaseAdmin
    .from("knowledge_base_meta")
    .delete()
    .eq("file_uri", fileUri)
    .eq("user_id", userId);
}

/**
 * Clear all files and caches for a specific user.
 */
export async function clearKnowledgeBaseForUser(userId: string): Promise<void> {
  const { data: files } = await supabaseAdmin
    .from("knowledge_base_meta")
    .select("gemini_file_name, cache_name_user")
    .eq("user_id", userId);

  // Delete user Gemini caches
  const cacheNames = [...new Set((files ?? []).map((f) => f.cache_name_user).filter(Boolean))];
  for (const cacheName of cacheNames) {
    try { await geminiV1Delete(cacheName); } catch { /* already expired */ }
  }

  // Delete Gemini files
  for (const f of files ?? []) {
    if (f.gemini_file_name) {
      try { await ai.files.delete({ name: f.gemini_file_name }); } catch { /* ignore */ }
    }
  }

  // Clear user rows from tracking table
  await supabaseAdmin
    .from("knowledge_base_meta")
    .delete()
    .eq("user_id", userId);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// ─── Gemini v1 Direct API helpers ────────────────────────────────────────────

// v1beta is required — v1/cachedContents returns 404 for this API key tier
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
  const data = JSON.parse(text) as { name?: string; error?: { message: string; code?: number; status?: string } };

  // Graceful fallback: content too small for caching (min 4096 tokens)
  // Return null — caller will skip cache and use direct generation
  if (!res.ok && data.error?.status === "INVALID_ARGUMENT" && data.error.message?.includes("too small")) {
    return { name: null };
  }

  if (!res.ok || !data.name) {
    throw new Error(`Cache create failed [${res.status}]: ${JSON.stringify(data.error ?? data)}`);
  }
  return { name: data.name };
}

async function geminiV1Delete(cacheName: string): Promise<void> {
  // cacheName is like "cachedContents/abc123" — DELETE returns 200 with {} or 204 No Content
  await fetch(`${GEMINI_V1}/${cacheName}?key=${geminiKey()}`, { method: "DELETE" });
  // Intentionally ignore response body
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

  if (opts.cachedContent) {
    body.cachedContent = opts.cachedContent;
  }
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

  if (!res.ok) {
    throw new Error(`Gemini generate failed: ${JSON.stringify(data.error ?? data)}`);
  }

  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

async function writeTempFile(buffer: Buffer, fileName: string): Promise<string> {
  const { writeFile, mkdir } = await import("fs/promises");
  const os = await import("os");
  const tmpDir = path.join(os.tmpdir(), "elektrosmart-kb");
  await mkdir(tmpDir, { recursive: true });
  const tmpPath = path.join(tmpDir, fileName.replace(/[^a-zA-Z0-9._-]/g, "_"));
  await writeFile(tmpPath, buffer);
  return tmpPath;
}
