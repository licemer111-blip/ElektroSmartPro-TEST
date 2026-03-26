/**
 * Admin API: Knowledge Base Management (System B — Supabase Storage)
 * POST   /api/admin/knowledge-base  — Upload document(s) to Supabase Storage bucket
 * GET    /api/admin/knowledge-base  — List files in bucket
 * DELETE /api/admin/knowledge-base  — Remove a specific file from bucket
 *
 * Protected by ADMIN_SECRET header. NOT exposed to end users.
 * Single source of truth: `ai-knowledge-base` Supabase Storage bucket.
 */

import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { invalidateKbCache } from "@/lib/kb-storage";

const BUCKET = "ai-knowledge-base";

// Supported MIME types — matches frontend kb-manager.tsx accepted types
const ALLOWED_MIME_TYPES: Record<string, string> = {
  "application/pdf": "application/pdf",
  "text/plain": "text/plain",
  "application/json": "application/json",
  "text/csv": "text/csv",
  "application/csv": "text/csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel": "application/vnd.ms-excel",
};

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

// ─── Auth guard ───────────────────────────────────────────────────────────────

function isAuthorized(req: NextRequest): boolean {
  const secret = req.headers.get("x-admin-secret");
  const expected = process.env.ADMIN_SECRET;
  if (!expected) return false;
  return secret === expected;
}

// ─── GET — List files in bucket ───────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data, error } = await supabaseAdmin.storage.from(BUCKET).list("", {
      limit: 100,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const files = (data ?? [])
      .filter((f) => f.name !== ".emptyFolderPlaceholder")
      .map((f) => ({
        name: f.name,
        sizeBytes: f.metadata?.size ?? 0,
        updatedAt: f.updated_at ?? null,
      }));

    return NextResponse.json({ success: true, files, fileCount: files.length });
  } catch (error) {
    logger.error("[knowledge-base GET]", {}, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// ─── POST — Upload document(s) to Supabase Storage ───────────────────────────

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (files.length === 0) {
      return NextResponse.json({ error: "Brak plików do przesłania" }, { status: 400 });
    }

    const uploadedFiles: Array<{ name: string; sizeBytes: number; mimeType: string }> = [];

    for (const file of files) {
      const mimeType = ALLOWED_MIME_TYPES[file.type];
      if (!mimeType) {
        return NextResponse.json(
          { error: `Nieobsługiwany typ pliku: ${file.type}. Dozwolone: PDF, TXT, JSON, CSV, XLSX, XLS` },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          { error: `Plik ${file.name} przekracza limit 20MB` },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());

      const { error: uploadError } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(file.name, buffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (uploadError) {
        return NextResponse.json(
          { error: `Błąd przesyłania ${file.name}: ${uploadError.message}` },
          { status: 500 }
        );
      }

      // Invalidate in-memory cache so next request fetches fresh content
      invalidateKbCache(file.name);

      uploadedFiles.push({ name: file.name, sizeBytes: file.size, mimeType });
    }

    return NextResponse.json({
      success: true,
      uploadedFiles,
      message: `${uploadedFiles.length} plik(i) przesłano do bazy wiedzy`,
    });
  } catch (error) {
    logger.error("[knowledge-base POST]", {}, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Błąd przesyłania" },
      { status: 500 }
    );
  }
}

// ─── DELETE — Remove a file from bucket ──────────────────────────────────────

export async function DELETE(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { fileName } = await req.json() as { fileName?: string };

    if (!fileName || typeof fileName !== "string") {
      return NextResponse.json({ error: "Brak nazwy pliku" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.storage.from(BUCKET).remove([fileName]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    invalidateKbCache(fileName);

    return NextResponse.json({
      success: true,
      message: `Plik "${fileName}" usunięty z bazy wiedzy`,
    });
  } catch (error) {
    logger.error("[knowledge-base DELETE]", {}, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Błąd usuwania" },
      { status: 500 }
    );
  }
}
