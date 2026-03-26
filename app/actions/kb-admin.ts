'use server'

import {
  getKnowledgeBaseStatus,
  createOrUpdateCache,
  clearKnowledgeBase,
  uploadToKnowledgeBase,
  type KnowledgeBaseStatus,
} from "@/server/services/knowledge-base.service";
import { invalidateKbCache } from "@/lib/kb-storage";
import { supabaseAdmin } from "@/lib/supabase-admin";

// ─── Constants ────────────────────────────────────────────────────────────────

// Google AI File Manager only supports PDF and plain text.
type GeminiMime = "application/pdf" | "text/plain";

// Supabase Storage bucket for structured data (JSON, CSV, XLSX).
const KB_BUCKET = "ai-knowledge-base";

const EXT_MIME_MAP: Record<string, string> = {
  ".pdf":  "application/pdf",
  ".txt":  "text/plain",
  ".json": "application/json",
  ".csv":  "text/csv",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".xls":  "application/vnd.ms-excel",
};

const GEMINI_EXTS = new Set([".pdf", ".txt"]);
const STORAGE_EXTS = new Set([".json", ".csv", ".xlsx", ".xls"]);

function getExt(fileName: string): string {
  return fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
}

function resolveMime(file: File): string | null {
  const ext = getExt(file.name);
  return EXT_MIME_MAP[ext] ?? (EXT_MIME_MAP[file.type] ? file.type : null);
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export async function getKbStatus(): Promise<KnowledgeBaseStatus> {
  const geminiStatus = await getKnowledgeBaseStatus();

  // Also fetch JSON/CSV/XLSX files from Supabase Storage bucket
  const { data: storageFiles } = await supabaseAdmin.storage
    .from(KB_BUCKET)
    .list("", { limit: 100, sortBy: { column: "name", order: "asc" } });

  const STORAGE_SUPPORTED = [".json", ".csv", ".xlsx", ".xls"];
  const storageEntries = (storageFiles ?? [])
    .filter((f) => f.name !== ".emptyFolderPlaceholder" && STORAGE_SUPPORTED.some((ext) => f.name.toLowerCase().endsWith(ext)))
    .map((f) => ({
      name: f.name,
      uri: `storage://${KB_BUCKET}/${f.name}`,
      mimeType: EXT_MIME_MAP[f.name.slice(f.name.lastIndexOf(".")).toLowerCase()] ?? "application/octet-stream",
      sizeBytes: f.metadata?.size ?? 0,
      uploadedAt: null,
    }));

  // Deduplicate: Gemini files take priority, storage fills the rest
  const geminiNames = new Set(geminiStatus.files.map((f) => f.name));
  const uniqueStorageEntries = storageEntries.filter((f) => !geminiNames.has(f.name));

  const mergedFiles = [...geminiStatus.files, ...uniqueStorageEntries];

  return {
    ...geminiStatus,
    fileCount: mergedFiles.length,
    files: mergedFiles,
  };
}

export async function rebuildKbCache(): Promise<{ success: boolean; cacheName?: string; error?: string; info?: string }> {
  try {
    const status = await getKbStatus();
    if (status.files.length === 0) {
      return { success: false, error: "Brak plików w bazie wiedzy. Najpierw wgraj dokumenty." };
    }
    // Only Gemini-hosted files (PDF/TXT) can be used in CachedContent.
    // JSON/CSV files in Storage are injected via fetchKbContext at query time — not cached.
    const geminiFiles = status.files.filter((f) =>
      f.uri.startsWith("https://") || f.uri.startsWith("generativelanguage")
    );
    if (geminiFiles.length === 0) {
      return { success: true, info: "Pliki JSON/CSV są wstrzykiwane przez RAG (fetchKbContext) — cache Gemini nie jest wymagany." };
    }
    const fileUris = geminiFiles.map((f) => ({
      uri: f.uri,
      mimeType: f.mimeType,
    }));
    const cacheName = await createOrUpdateCache(fileUris);
    return { success: true, cacheName };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Błąd przebudowy cache" };
  }
}

export async function clearKbAll(): Promise<{ success: boolean; error?: string }> {
  const errors: string[] = [];

  // ── Step 1: Delete ALL files from Supabase Storage bucket ──────────────────
  try {
    const { data: storageFiles, error: listError } = await supabaseAdmin.storage
      .from(KB_BUCKET)
      .list("", { limit: 1000 });
    if (listError) {
      errors.push(`Błąd listowania bucketu: ${listError.message}`);
    } else {
      const filesToRemove = (storageFiles ?? [])
        .map((f) => f.name)
        .filter((n) => n !== ".emptyFolderPlaceholder");
      if (filesToRemove.length > 0) {
        const { error: removeError } = await supabaseAdmin.storage
          .from(KB_BUCKET)
          .remove(filesToRemove);
        if (removeError) errors.push(`Błąd usuwania z Storage: ${removeError.message}`);
      }
    }
  } catch (err) {
    errors.push(`Storage: ${err instanceof Error ? err.message : String(err)}`);
  }

  // ── Step 2: Invalidate entire in-memory RAG cache ──────────────────────────
  try {
    invalidateKbCache(); // no arg = clears all
  } catch { /* non-critical */ }

  // ── Step 3: Clear Gemini files + knowledge_base_meta table ─────────────────
  try {
    await clearKnowledgeBase();
  } catch (err) {
    errors.push(`Gemini/Meta: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (errors.length > 0) {
    return { success: false, error: errors.join(" | ") };
  }
  return { success: true };
}

export async function uploadKbFile(
  formData: FormData
): Promise<{ success: boolean; fileName?: string; error?: string }> {
  try {
    const file = formData.get("file") as File | null;
    if (!file) return { success: false, error: "Brak pliku" };

    const ext = getExt(file.name);
    const mime = resolveMime(file);

    if (!mime) {
      return { success: false, error: `Nieobsługiwany typ: ${file.type || file.name}. Obsługiwane: PDF, TXT, JSON, CSV, XLSX` };
    }
    if (file.size > 50 * 1024 * 1024) return { success: false, error: "Plik przekracza 50MB" };

    const buffer = Buffer.from(await file.arrayBuffer());

    if (GEMINI_EXTS.has(ext)) {
      // Path A: PDF / TXT → Google AI File Manager + auto-rebuild cache
      await uploadToKnowledgeBase(buffer, file.name, mime as GeminiMime);
      const status = await getKnowledgeBaseStatus();
      const fileUris = status.files.map((f) => ({ uri: f.uri, mimeType: f.mimeType }));
      if (fileUris.length > 0) await createOrUpdateCache(fileUris);
    } else if (STORAGE_EXTS.has(ext)) {
      // Path B: JSON / CSV / XLSX → Supabase Storage bucket (read by fetchKbContext)
      const { error } = await supabaseAdmin.storage
        .from(KB_BUCKET)
        .upload(file.name, buffer, { contentType: mime, upsert: true });
      if (error) return { success: false, error: error.message };
    } else {
      return { success: false, error: `Nieobsługiwany format: ${ext}` };
    }

    return { success: true, fileName: file.name };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Błąd uploadu" };
  }
}

// ─── Per-file operations ───────────────────────────────────────────────────────

export async function deleteKbFile(
  fileName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const ext = getExt(fileName);
    if (STORAGE_EXTS.has(ext)) {
      const { error } = await supabaseAdmin.storage
        .from(KB_BUCKET)
        .remove([fileName]);
      if (error) return { success: false, error: error.message };
      invalidateKbCache(fileName);
    } else if (GEMINI_EXTS.has(ext)) {
      // Gemini-hosted files would need the file URI to delete from File Manager.
      // For now: not supported via this UI — use clearKbAll for full reset.
      return { success: false, error: "Usuwanie plików PDF/TXT z Gemini nie jest obsługiwane w tym widoku. Użyj 'Wyczyść wszystko'." };
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Błąd usuwania pliku" };
  }
}

export async function getKbFileContent(
  fileName: string
): Promise<{ success: boolean; content?: string; error?: string }> {
  try {
    const ext = getExt(fileName);
    if (!STORAGE_EXTS.has(ext)) {
      return { success: false, error: "Edycja inline jest dostępna tylko dla plików JSON/CSV/XLSX." };
    }
    const { data, error } = await supabaseAdmin.storage
      .from(KB_BUCKET)
      .download(fileName);
    if (error || !data) return { success: false, error: error?.message ?? "Nie udało się pobrać pliku" };
    const text = await data.text();
    return { success: true, content: text };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Błąd odczytu pliku" };
  }
}

export async function updateKbFileContent(
  fileName: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const ext = getExt(fileName);
    if (!STORAGE_EXTS.has(ext)) {
      return { success: false, error: "Edycja inline jest dostępna tylko dla plików JSON/CSV." };
    }
    if (ext === ".json") {
      try { JSON.parse(content); } catch {
        return { success: false, error: "Nieprawidłowy JSON — sprawdź składnię przed zapisem." };
      }
    }
    const mime = EXT_MIME_MAP[ext] ?? "application/octet-stream";
    const buffer = Buffer.from(content, "utf-8");
    const { error } = await supabaseAdmin.storage
      .from(KB_BUCKET)
      .upload(fileName, buffer, { contentType: mime, upsert: true });
    if (error) return { success: false, error: error.message };
    invalidateKbCache(fileName);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Błąd zapisu pliku" };
  }
}
