"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isGoogleAIConfigured } from "@/lib/google-ai";
import {
  uploadToKnowledgeBaseForUser,
  getKnowledgeBaseStatusForUser,
  clearKnowledgeBaseForUser,
  buildUserCache,
  deleteKnowledgeBaseFileForUser,
} from "@/server/services/knowledge-base.service";

const MAX_USER_FILES = 20;
const MAX_FILE_SIZE_MB = 20;

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
];

// ─── Convert Excel/CSV buffer to plain text ───────────────────────────────────

async function convertToText(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<{ buffer: Buffer; fileName: string }> {
  // PDF and TXT — pass through unchanged
  if (mimeType === "application/pdf" || mimeType === "text/plain") {
    return { buffer, fileName };
  }

  // CSV — parse with papaparse
  if (mimeType === "text/csv") {
    const Papa = (await import("papaparse")).default;
    const text = buffer.toString("utf-8");
    const result = Papa.parse<string[]>(text, { skipEmptyLines: true });
    const lines = (result.data as string[][]).map((row) => row.join(" | "));
    const txtContent = `PLIK: ${fileName}\n${"─".repeat(60)}\n${lines.join("\n")}`;
    return {
      buffer: Buffer.from(txtContent, "utf-8"),
      fileName: fileName.replace(/\.(csv)$/i, ".txt"),
    };
  }

  // Excel (.xlsx / .xls) — parse with xlsx
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) {
    const XLSX = await import("xlsx-js-style");
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const lines: string[] = [`PLIK: ${fileName}`, "─".repeat(60)];

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "" });
      if (rows.length === 0) continue;
      lines.push(`\n[Arkusz: ${sheetName}]`);
      for (const row of rows as string[][]) {
        const cells = row.map((c) => String(c ?? "").trim());
        if (cells.some((c) => c !== "")) {
          lines.push(cells.join(" | "));
        }
      }
    }

    return {
      buffer: Buffer.from(lines.join("\n"), "utf-8"),
      fileName: fileName.replace(/\.(xlsx?|xls)$/i, ".txt"),
    };
  }

  return { buffer, fileName };
}

// ─── Get user KB status ───────────────────────────────────────────────────────

export async function getUserKBStatus() {
  const { user } = await requireAuth();

  if (!isGoogleAIConfigured()) {
    return { error: "Baza wiedzy ES Engine jest niedostępna (brak klucza API)" };
  }

  try {
    const status = await getKnowledgeBaseStatusForUser(user.id);
    return { data: status };
  } catch {
    return { error: "Nie udało się pobrać statusu bazy wiedzy" };
  }
}

// ─── Upload file to user KB ───────────────────────────────────────────────────

export async function uploadUserKBFile(formData: FormData) {
  const { user } = await requireAuth();

  if (!isGoogleAIConfigured()) {
    return { error: "Baza wiedzy ES Engine jest niedostępna (brak klucza API)" };
  }

  const file = formData.get("file") as File | null;
  if (!file) return { error: "Nie wybrano pliku" };

  // Validate type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { error: "Dozwolone formaty: PDF, TXT, CSV, XLSX" };
  }

  // Validate size
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > MAX_FILE_SIZE_MB) {
    return { error: `Plik za duży. Maksymalny rozmiar: ${MAX_FILE_SIZE_MB} MB` };
  }

  // Check file count limit
  const { count } = await supabaseAdmin
    .from("knowledge_base_meta")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((count ?? 0) >= MAX_USER_FILES) {
    return {
      error: `Osiągnięto limit ${MAX_USER_FILES} plików. Usuń stary plik, aby dodać nowy.`,
    };
  }

  try {
    const rawBuffer = Buffer.from(await file.arrayBuffer());

    // Convert Excel/CSV to plain text — Gemini only accepts PDF or text/plain
    const { buffer, fileName } = await convertToText(rawBuffer, file.type, file.name);

    // After conversion everything is either PDF or plain text
    const mimeType: "application/pdf" | "text/plain" =
      file.type === "application/pdf" ? "application/pdf" : "text/plain";

    await uploadToKnowledgeBaseForUser(buffer, fileName, mimeType, user.id);

    revalidatePath("/dashboard/settings/my-knowledge-base");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Nieznany błąd";
    return { error: `Błąd przesyłania: ${msg}` };
  }
}

// ─── Rebuild user cache ───────────────────────────────────────────────────────

export async function rebuildUserCache() {
  const { user } = await requireAuth();

  if (!isGoogleAIConfigured()) {
    return { error: "Baza wiedzy ES Engine jest niedostępna (brak klucza API)" };
  }

  try {
    const cacheName = await buildUserCache(user.id);
    revalidatePath("/dashboard/settings/my-knowledge-base");
    return {
      success: true,
      cacheName,
      noCache: cacheName === "__no_cache__",
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Nieznany błąd";
    return { error: `Błąd budowania cache: ${msg}` };
  }
}

// ─── Delete user KB (all files) ───────────────────────────────────────────────

export async function clearUserKB() {
  const { user } = await requireAuth();

  if (!isGoogleAIConfigured()) {
    return { error: "Baza wiedzy ES Engine jest niedostępna (brak klucza API)" };
  }

  try {
    await clearKnowledgeBaseForUser(user.id);
    revalidatePath("/dashboard/settings/my-knowledge-base");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Nieznany błąd";
    return { error: `Błąd usuwania: ${msg}` };
  }
}

// ─── Delete single file from user KB ──────────────────────────────────────────

export async function deleteUserKBFile(fileUri: string) {
  const { user } = await requireAuth();

  if (!isGoogleAIConfigured()) {
    return { error: "Baza wiedzy ES Engine jest niedostępna (brak klucza API)" };
  }

  if (!fileUri) return { error: "Brak identyfikatora pliku" };

  try {
    await deleteKnowledgeBaseFileForUser(fileUri, user.id);
    revalidatePath("/dashboard/settings/my-knowledge-base");
    revalidatePath("/dashboard/settings/knr-calculator");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Nieznany błąd";
    return { error: `Błąd usuwania pliku: ${msg}` };
  }
}
