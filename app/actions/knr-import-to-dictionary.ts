"use server";

// ═══════════════════════════════════════════════════════════════════
// knr-import-to-dictionary.ts
// Parsuje plik Excel/CSV z normami KNR użytkownika i zapisuje
// do es_dictionary jako prywatne wpisy (user_id = current user).
// Każdy wpis jest dostępny jako L1 w matching engine.
// ═══════════════════════════════════════════════════════════════════

import { requireAuth } from "@/lib/auth";
import { normalizeText } from "@/lib/services/normalization";
import type { DictionaryEntryType } from "@/lib/services/matching-engine";

export interface KnrImportRow {
  keyword: string;
  knr_ref: string;
  labor_norm_rbh: number | null;
  unit: string;
  type: DictionaryEntryType;
}

export interface KnrImportPreview {
  rows: KnrImportRow[];
  totalRows: number;
  skippedRows: number;
  columnMapping: {
    nameCol: number;
    knrCol: number | null;
    normCol: number | null;
    unitCol: number | null;
  };
  headers: string[];
  sampleData: string[][];
}

export interface KnrImportResult {
  success: boolean;
  inserted: number;
  updated: number;
  skipped: number;
  error?: string;
}

// ─── Column auto-detection heuristics ────────────────────────────────────────

const NAME_HINTS = ["nazwa", "opis", "pozycja", "przedmiot", "robota", "description", "item", "name"];
const KNR_HINTS  = ["knr", "kod", "numer", "code", "ref", "katalog"];
const NORM_HINTS = ["norm", "nakład", "nakld", "rbh", "r-g", "rg", "godz", "hours", "czas", "labor"];
const UNIT_HINTS = ["jedn", "unit", "jm", "miara"];

function detectColIndex(headers: string[], hints: string[]): number | null {
  const lower = headers.map((h) => h.toLowerCase().replace(/[^a-ząćęłńóśźż0-9]/gi, ""));
  for (const hint of hints) {
    const idx = lower.findIndex((h) => h.includes(hint));
    if (idx !== -1) return idx;
  }
  return null;
}

// ─── Parse raw rows into structured KnrImportRow ─────────────────────────────

function parseRawRows(
  rows: string[][],
  nameCol: number,
  knrCol: number | null,
  normCol: number | null,
  unitCol: number | null,
): { parsed: KnrImportRow[]; skipped: number } {
  const parsed: KnrImportRow[] = [];
  let skipped = 0;

  for (const row of rows) {
    const rawName = (row[nameCol] ?? "").toString().trim();
    if (!rawName || rawName.length < 3) { skipped++; continue; }

    const rawKnr  = knrCol  !== null ? (row[knrCol]  ?? "").toString().trim() : "";
    const rawNorm = normCol !== null ? (row[normCol] ?? "").toString().trim() : "";
    const rawUnit = unitCol !== null ? (row[unitCol] ?? "").toString().trim() : "";

    // parse norm — handle Polish comma decimal separator
    const normNum = parseFloat(rawNorm.replace(",", ".").replace(/\s/g, ""));

    // Skip rows without KNR and without meaningful norm
    if (!rawKnr && isNaN(normNum)) { skipped++; continue; }

    parsed.push({
      keyword:        rawName.slice(0, 200),
      knr_ref:        rawKnr  || "USER-KNR",
      labor_norm_rbh: isNaN(normNum) ? null : normNum,
      unit:           (rawUnit || "szt").slice(0, 20),
      type:           "robocizna",
    });
  }

  return { parsed, skipped };
}

// ─── Public: parse preview (no DB write) ─────────────────────────────────────

export async function previewKnrImport(
  formData: FormData,
): Promise<{ success: true; preview: KnrImportPreview } | { success: false; error: string }> {
  try {
    await requireAuth();

    const file = formData.get("file") as File | null;
    if (!file) return { success: false, error: "Nie wybrano pliku" };

    const allowedTypes = [
      "text/csv",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/plain",
    ];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx?|txt)$/i)) {
      return { success: false, error: "Dozwolone formaty: CSV, XLSX, XLS, TXT" };
    }

    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > 10) return { success: false, error: "Plik za duży (maks. 10 MB)" };

    const buffer = Buffer.from(await file.arrayBuffer());
    let rawRows: string[][] = [];

    if (file.type === "text/csv" || file.name.toLowerCase().endsWith(".csv") || file.type === "text/plain") {
      const Papa = (await import("papaparse")).default;
      const text = buffer.toString("utf-8");
      const result = Papa.parse<string[]>(text, { skipEmptyLines: true, delimiter: "" });
      rawRows = result.data as string[][];
    } else {
      const XLSX = await import("xlsx-js-style");
      const wb = XLSX.read(buffer, { type: "buffer" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      rawRows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: "" }) as string[][];
    }

    if (rawRows.length < 2) return { success: false, error: "Plik jest pusty lub zawiera tylko nagłówki" };

    // First non-empty row = headers
    const headers = rawRows[0].map((h) => String(h ?? "").trim());
    const dataRows = rawRows.slice(1).filter((r) => r.some((c) => String(c ?? "").trim() !== ""));

    const nameCol = detectColIndex(headers, NAME_HINTS) ?? 0;
    const knrCol  = detectColIndex(headers, KNR_HINTS);
    const normCol = detectColIndex(headers, NORM_HINTS);
    const unitCol = detectColIndex(headers, UNIT_HINTS);

    const { parsed, skipped } = parseRawRows(dataRows, nameCol, knrCol, normCol, unitCol);

    return {
      success: true,
      preview: {
        rows:        parsed.slice(0, 5),   // show max 5 in preview
        totalRows:   parsed.length,
        skippedRows: skipped,
        columnMapping: { nameCol, knrCol, normCol, unitCol },
        headers,
        sampleData:  dataRows.slice(0, 5).map((r) => headers.map((_, i) => String(r[i] ?? ""))),
      },
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Błąd parsowania pliku" };
  }
}

// ─── Public: commit import to es_dictionary ──────────────────────────────────

export async function commitKnrImport(
  formData: FormData,
  columnMapping: { nameCol: number; knrCol: number | null; normCol: number | null; unitCol: number | null },
): Promise<KnrImportResult> {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
    if (!user || !supabase) return { success: false, inserted: 0, updated: 0, skipped: 0, error: "Brak autoryzacji" };

    const file = formData.get("file") as File | null;
    if (!file) return { success: false, inserted: 0, updated: 0, skipped: 0, error: "Brak pliku" };

    const buffer = Buffer.from(await file.arrayBuffer());
    let rawRows: string[][] = [];

    if (file.type === "text/csv" || file.name.toLowerCase().endsWith(".csv") || file.type === "text/plain") {
      const Papa = (await import("papaparse")).default;
      const result = Papa.parse<string[]>(buffer.toString("utf-8"), { skipEmptyLines: true, delimiter: "" });
      rawRows = result.data as string[][];
    } else {
      const XLSX = await import("xlsx-js-style");
      const wb = XLSX.read(buffer, { type: "buffer" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      rawRows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: "" }) as string[][];
    }

    if (rawRows.length < 2) return { success: false, inserted: 0, updated: 0, skipped: 0, error: "Pusty plik" };

    const dataRows = rawRows.slice(1).filter((r) => r.some((c) => String(c ?? "").trim() !== ""));
    const { nameCol, knrCol, normCol, unitCol } = columnMapping;
    const { parsed, skipped } = parseRawRows(dataRows, nameCol, knrCol, normCol, unitCol);

    if (parsed.length === 0) return { success: false, inserted: 0, updated: 0, skipped, error: "Brak danych do importu" };

    let inserted = 0;
    let updated  = 0;

    // Process in batches of 50
    const BATCH = 50;
    for (let i = 0; i < parsed.length; i += BATCH) {
      const chunk = parsed.slice(i, i + BATCH);

      const entries = chunk.map((row) => ({
        keyword:            row.keyword,
        keyword_normalized: normalizeText(row.keyword),
        knr_ref:            row.knr_ref,
        label:              row.keyword.slice(0, 200),
        type:               row.type,
        is_composite:       false,
        composite_refs:     null,
        labor_norm_rbh:     row.labor_norm_rbh,
        unit:               row.unit,
        category:           "user_knr_import" as const,
        confidence_weight:  1.5,  // user's own KNR gets strong weight
        user_id:            user.id,
      })).filter((e) => e.keyword_normalized.length >= 2);

      // Upsert — ON CONFLICT (keyword_normalized, user_id) → update
      const { error, data } = await supabase
        .from("es_dictionary")
        .upsert(entries, {
          onConflict: "keyword_normalized,user_id",
          ignoreDuplicates: false,
        })
        .select("id");

      if (error) {
        // Fallback: insert each row individually to skip problematic ones
        for (const entry of entries) {
          const { error: singleErr } = await supabase
            .from("es_dictionary")
            .upsert(entry, { onConflict: "keyword_normalized,user_id", ignoreDuplicates: false });
          if (!singleErr) inserted++;
        }
      } else {
        inserted += data?.length ?? entries.length;
      }
    }

    return { success: true, inserted, updated, skipped };
  } catch (err) {
    return { success: false, inserted: 0, updated: 0, skipped: 0, error: err instanceof Error ? err.message : "Błąd importu" };
  }
}

// ─── Public: get user's imported KNR entries stats ───────────────────────────

export async function getUserKnrDictionaryStats(): Promise<{
  success: boolean;
  total: number;
  learned: number;
  imported: number;
  error?: string;
}> {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
    if (!user || !supabase) return { success: false, total: 0, learned: 0, imported: 0, error: "Brak autoryzacji" };

    const { data, error } = await supabase
      .from("es_dictionary")
      .select("category")
      .eq("user_id", user.id);

    if (error) return { success: false, total: 0, learned: 0, imported: 0, error: error.message };

    const total    = data.length;
    const learned  = data.filter((d) => d.category === "user_learned").length;
    const imported = data.filter((d) => d.category === "user_knr_import").length;

    return { success: true, total, learned, imported };
  } catch {
    return { success: false, total: 0, learned: 0, imported: 0 };
  }
}

// ─── Public: delete all user's imported KNR entries ──────────────────────────

export async function clearUserKnrImport(): Promise<{ success: boolean; deleted: number; error?: string }> {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
    if (!user || !supabase) return { success: false, deleted: 0, error: "Brak autoryzacji" };

    const { error, count } = await supabase
      .from("es_dictionary")
      .delete({ count: "exact" })
      .eq("user_id", user.id)
      .eq("category", "user_knr_import");

    if (error) return { success: false, deleted: 0, error: error.message };
    return { success: true, deleted: count ?? 0 };
  } catch {
    return { success: false, deleted: 0 };
  }
}
