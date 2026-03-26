/**
 * KB Management Service — CRUD operations, DB tracking, user-scoped uploads.
 * Handles file upload to Google AI File Manager + Supabase metadata.
 * Split from knowledge-base.service.ts for scalability.
 */

import path from "path";
import { ai, isGoogleAIConfigured } from "@/lib/google-ai";
import { supabaseAdmin } from "@/lib/supabase-admin";

// ─── Re-export shared types ───────────────────────────────────────────────────
export type { UploadedFile, KnowledgeBaseStatus, QueryResult } from "@/server/services/knowledge-base.service";

// ─── 1. Upload to Google AI File Manager ──────────────────────────────────────

export async function uploadToKnowledgeBase(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: "application/pdf" | "text/plain"
): Promise<{ fileUri: string; mimeType: string; displayName: string; sizeBytes: number; state: string }> {
  if (!isGoogleAIConfigured()) throw new Error("GOOGLE_AI_API_KEY is not configured");

  const tmpPath = await writeTempFile(fileBuffer, fileName);
  let file = await ai.files.upload({ file: tmpPath, config: { mimeType, displayName: fileName } });

  while (file.state === "PROCESSING") {
    await new Promise((r) => setTimeout(r, 2000));
    file = await ai.files.get({ name: file.name! });
  }
  if (file.state !== "ACTIVE") throw new Error(`File upload failed. State: ${file.state}`);

  await supabaseAdmin.from("knowledge_base_meta").upsert({
    file_name: fileName, file_uri: file.uri, mime_type: mimeType,
    size_bytes: Number(file.sizeBytes ?? 0), gemini_file_name: file.name,
    state: file.state, uploaded_at: new Date().toISOString(),
  }, { onConflict: "file_uri" });

  return { fileUri: file.uri!, mimeType: file.mimeType!, displayName: file.displayName ?? fileName, sizeBytes: Number(file.sizeBytes ?? 0), state: file.state! };
}

export async function uploadToKnowledgeBaseForUser(
  fileBuffer: Buffer, fileName: string,
  mimeType: "application/pdf" | "text/plain", userId: string
): Promise<{ fileUri: string; mimeType: string; displayName: string; sizeBytes: number; state: string }> {
  if (!isGoogleAIConfigured()) throw new Error("GOOGLE_AI_API_KEY is not configured");

  const tmpPath = await writeTempFile(fileBuffer, fileName);
  let file = await ai.files.upload({ file: tmpPath, config: { mimeType, displayName: `[user:${userId.slice(0, 8)}] ${fileName}` } });

  while (file.state === "PROCESSING") {
    await new Promise((r) => setTimeout(r, 2000));
    file = await ai.files.get({ name: file.name! });
  }
  if (file.state !== "ACTIVE") throw new Error(`File upload failed. State: ${file.state}`);

  await supabaseAdmin.from("knowledge_base_meta").upsert({
    file_name: fileName, file_uri: file.uri, mime_type: mimeType,
    size_bytes: Number(file.sizeBytes ?? 0), gemini_file_name: file.name,
    state: file.state, uploaded_at: new Date().toISOString(), user_id: userId,
  }, { onConflict: "file_uri" });

  return { fileUri: file.uri!, mimeType: file.mimeType!, displayName: file.displayName ?? fileName, sizeBytes: Number(file.sizeBytes ?? 0), state: file.state! };
}

// ─── 2. Get KB status ─────────────────────────────────────────────────────────

export async function getKnowledgeBaseStatus() {
  const { data: files } = await supabaseAdmin
    .from("knowledge_base_meta")
    .select("file_name, file_uri, mime_type, size_bytes, cache_name, cache_expire_time")
    .order("uploaded_at", { ascending: false });

  const activeMeta = files?.find((f) => f.cache_name);
  const now = new Date();
  const cacheValid = activeMeta?.cache_expire_time && new Date(activeMeta.cache_expire_time) > now;

  return {
    cacheExists: Boolean(cacheValid),
    cacheName: cacheValid ? (activeMeta?.cache_name ?? null) : null,
    cacheExpireTime: cacheValid ? (activeMeta?.cache_expire_time ?? null) : null,
    fileCount: files?.length ?? 0,
    files: (files ?? []).map((f) => ({ name: f.file_name, uri: f.file_uri, mimeType: f.mime_type, sizeBytes: f.size_bytes })),
    modelName: "gemini-1.5-pro",
    directMode: false,
  };
}

export async function getKnowledgeBaseStatusForUser(userId: string) {
  const { data: files } = await supabaseAdmin
    .from("knowledge_base_meta")
    .select("file_name, file_uri, mime_type, size_bytes, cache_name_user, cache_expire_time")
    .eq("user_id", userId)
    .order("uploaded_at", { ascending: false });

  const activeMeta = files?.find((f) => f.cache_name_user);
  const now = new Date();
  const cacheValid = activeMeta?.cache_expire_time && new Date(activeMeta.cache_expire_time) > now;
  const fileCount = files?.length ?? 0;

  return {
    cacheExists: Boolean(cacheValid),
    cacheName: cacheValid ? (activeMeta?.cache_name_user ?? null) : null,
    cacheExpireTime: cacheValid ? (activeMeta?.cache_expire_time ?? null) : null,
    fileCount,
    files: (files ?? []).map((f) => ({ name: f.file_name, uri: f.file_uri, mimeType: f.mime_type, sizeBytes: f.size_bytes })),
    modelName: "gemini-1.5-pro",
    directMode: fileCount > 0 && !Boolean(cacheValid),
  };
}

// ─── 3. Clear KB ──────────────────────────────────────────────────────────────

export async function clearKnowledgeBase(): Promise<void> {
  const { data: files } = await supabaseAdmin.from("knowledge_base_meta").select("gemini_file_name, cache_name");

  const cacheNames = [...new Set((files ?? []).map((f) => f.cache_name).filter(Boolean))];
  for (const cacheName of cacheNames) {
    try { await geminiV1Delete(cacheName); } catch { /* expired */ }
  }
  for (const f of files ?? []) {
    if (f.gemini_file_name) {
      try { await ai.files.delete({ name: f.gemini_file_name }); } catch { /* ignore */ }
    }
  }
  await supabaseAdmin.from("knowledge_base_meta").delete().not("id", "is", null);
}

export async function clearKnowledgeBaseForUser(userId: string): Promise<void> {
  const { data: files } = await supabaseAdmin.from("knowledge_base_meta").select("gemini_file_name, cache_name_user").eq("user_id", userId);

  const cacheNames = [...new Set((files ?? []).map((f) => f.cache_name_user).filter(Boolean))];
  for (const cacheName of cacheNames) {
    try { await geminiV1Delete(cacheName); } catch { /* expired */ }
  }
  for (const f of files ?? []) {
    if (f.gemini_file_name) {
      try { await ai.files.delete({ name: f.gemini_file_name }); } catch { /* ignore */ }
    }
  }
  await supabaseAdmin.from("knowledge_base_meta").delete().eq("user_id", userId);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const GEMINI_V1 = "https://generativelanguage.googleapis.com/v1beta";

function geminiKey(): string {
  const key = process.env.GOOGLE_AI_API_KEY;
  if (!key) throw new Error("GOOGLE_AI_API_KEY is not set");
  return key;
}

async function geminiV1Delete(cacheName: string): Promise<void> {
  await fetch(`${GEMINI_V1}/${cacheName}?key=${geminiKey()}`, { method: "DELETE" });
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
