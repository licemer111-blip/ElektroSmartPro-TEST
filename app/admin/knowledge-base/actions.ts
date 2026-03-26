"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/utils/admin";
import { invalidateKbCache } from "@/lib/kb-storage";
import { getKnrCategories } from "@/lib/utils/knr-categories";
import type { KnrCategory } from "./_parts/KbFilesPanel";

// ─── KNR v1.4 Import Types ─────────────────────────────────────────────────────

const VALID_UNITS = [
  "szt", "mb", "m", "kpl", "m2", "godz", "m-c",
  // Power / energy units (PV, OZE, transformers)
  "kWp", "kW", "kVA", "kVar", "kWh", "W", "VA",
  // Length / area / volume
  "km", "m3", "m2a", "dm", "cm",
  // Mass
  "kg", "t",
  // Electrical / counts
  "A", "szt.", "kpl.", "mb.", "pkt", "punkt", "ob", "krot",
  // Time / work
  "rbh", "h", "r-g",
] as const;
const VALID_CATALOG_PREFIXES = ["KNR ", "ES-KNR-"] as const;
const VALID_COMPONENT_TYPES = ["material", "robocizna", "cable", "box", "device", "chase"] as const;

type ValidUnit = typeof VALID_UNITS[number];
type ValidComponentType = typeof VALID_COMPONENT_TYPES[number];

interface KnrNormInput {
  catalog_code: string;
  section?: string;
  table_number: string;
  column_number: string;
  description: string;
  unit: string;
  labor_norm: number;
  labor_norm_min?: number;
  labor_norm_max?: number;
  material_category?: string;
  knr_category?: string;
  is_industrial?: boolean;
  source_edition?: string;
  synonyms?: string[];
  keywords?: string[];
  materials?: KnrMaterialInput[];
}

interface KnrMaterialInput {
  material_name: string;
  material_unit?: string;
  material_category?: string;
  quantity_factor: number;
  component_type?: string;
  recipe_component_id?: string;
  is_optional?: boolean;
  only_for_surface?: string[];
}

export interface KnrImportResult {
  success: boolean;
  inserted: number;
  updated: number;
  materialsInserted: number;
  skipped: number;
  errors: string[];
  warnings: string[];
}

// ─── Validation ────────────────────────────────────────────────────────────────

function validateNorm(norm: KnrNormInput, idx: number): string[] {
  const errs: string[] = [];
  const pos = `Norma[${idx}]`;

  if (!norm.catalog_code || typeof norm.catalog_code !== "string")
    errs.push(`${pos}: brak catalog_code`);
  else if (!VALID_CATALOG_PREFIXES.some((p) => norm.catalog_code.toUpperCase().startsWith(p.toUpperCase())))
    errs.push(`${pos}: nieznany katalog "${norm.catalog_code}" — musi zaczynać się od KNR lub ES-KNR-`);

  if (!norm.table_number || typeof norm.table_number !== "string")
    errs.push(`${pos}: brak table_number`);

  if (!norm.column_number || typeof norm.column_number !== "string")
    errs.push(`${pos}: brak column_number`);

  if (!norm.description || typeof norm.description !== "string" || norm.description.trim().length < 3)
    errs.push(`${pos}: description jest za krótkie lub puste`);

  if (!VALID_UNITS.includes(norm.unit as ValidUnit))
    errs.push(`${pos}: nieprawidłowa jednostka "${norm.unit}" — dozwolone: ${VALID_UNITS.join(", ")}`);

  if (typeof norm.labor_norm !== "number" || norm.labor_norm <= 0)
    errs.push(`${pos}: labor_norm musi być liczbą > 0 (got: ${norm.labor_norm})`);

  if (norm.labor_norm > 50)
    errs.push(`${pos}: labor_norm=${norm.labor_norm} przekracza maksimum 50 rbh — sprawdź dane`);

  if (norm.materials) {
    for (const [mi, mat] of norm.materials.entries()) {
      const mpos = `${pos}.materials[${mi}]`;
      if (!mat.material_name || typeof mat.material_name !== "string")
        errs.push(`${mpos}: brak material_name`);
      if (typeof mat.quantity_factor !== "number" || mat.quantity_factor <= 0)
        errs.push(`${mpos}: quantity_factor musi być > 0`);
      if (mat.component_type && !VALID_COMPONENT_TYPES.includes(mat.component_type as ValidComponentType))
        errs.push(`${mpos}: nieprawidłowy component_type "${mat.component_type}"`);
    }
  }

  return errs;
}

// ─── Main Upload Action ────────────────────────────────────────────────────────

export async function uploadKnrNormsJson(
  formData: FormData
): Promise<KnrImportResult> {
  const result: KnrImportResult = {
    success: false,
    inserted: 0,
    updated: 0,
    materialsInserted: 0,
    skipped: 0,
    errors: [],
    warnings: [],
  };

  try {
    await requireAdmin();

    const file = formData.get("file") as File | null;
    if (!file) {
      result.errors.push("Brak pliku JSON");
      return result;
    }

    if (!file.name.endsWith(".json")) {
      result.errors.push("Tylko pliki JSON są obsługiwane przez importer KNR");
      return result;
    }

    if (file.size > 10 * 1024 * 1024) {
      result.errors.push("Plik przekracza 10MB — podziel na mniejsze pliki");
      return result;
    }

    const text = await file.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      result.errors.push("Nieprawidłowy format JSON — sprawdź składnię pliku");
      return result;
    }

    // Accept both array root and { norms: [...] } envelope
    let norms: KnrNormInput[];
    if (Array.isArray(parsed)) {
      norms = parsed as KnrNormInput[];
    } else if (
      parsed !== null &&
      typeof parsed === "object" &&
      "norms" in parsed &&
      Array.isArray((parsed as Record<string, unknown>).norms)
    ) {
      norms = (parsed as { norms: KnrNormInput[] }).norms;
    } else {
      result.errors.push(
        'JSON musi być tablicą norm lub obiektem { "norms": [...] }'
      );
      return result;
    }

    if (norms.length === 0) {
      result.errors.push("Plik JSON jest pusty — brak norm do importu");
      return result;
    }

    if (norms.length > 2000) {
      result.errors.push("Przekroczono limit 2000 norm na plik — podziel na mniejsze partie");
      return result;
    }

    // Validate all norms first — fail fast if critical errors
    const allErrors: string[] = [];
    for (const [idx, norm] of norms.entries()) {
      const errs = validateNorm(norm, idx);
      allErrors.push(...errs);
      if (allErrors.length > 20) {
        allErrors.push("...zbyt wiele błędów, przerwano walidację. Popraw plik i spróbuj ponownie.");
        break;
      }
    }

    if (allErrors.length > 0) {
      result.errors = allErrors;
      return result;
    }

    // ── Upsert knr_norms in batches of 100 ─────────────────────────────────
    const BATCH = 100;

    for (let i = 0; i < norms.length; i += BATCH) {
      const batch = norms.slice(i, i + BATCH);

      const rows = batch.map((n) => {
        // Merge synonyms + keywords arrays, deduplicate, filter empty strings
        const merged = [...(n.synonyms ?? []), ...(n.keywords ?? [])]
          .map((s) => s.trim().toLowerCase())
          .filter((s, i, arr) => s.length > 0 && arr.indexOf(s) === i);

        return {
          catalog_code:      n.catalog_code.trim(),
          section:           n.section?.trim() ?? "",
          table_number:      n.table_number.trim(),
          column_number:     n.column_number.trim(),
          description:       n.description.trim(),
          unit:              n.unit as ValidUnit,
          labor_norm:        n.labor_norm,
          labor_norm_min:    n.labor_norm_min ?? null,
          labor_norm_max:    n.labor_norm_max ?? null,
          material_category: n.material_category?.trim() ?? null,
          knr_category:      n.knr_category?.trim() ?? null,
          is_industrial:     n.is_industrial ?? false,
          is_active:         true,
          is_verified:       false,
          source_edition:    n.source_edition?.trim() ?? file.name,
          synonyms:          merged,
        };
      });

      // ON CONFLICT on (catalog_code, table_number, column_number) — unique combo
      // Since we don't have a unique constraint yet we use upsert by matching
      // existing rows and distinguishing insert vs update via returned data.
      const { data: upserted, error: upsertError } = await supabaseAdmin
        .from("knr_norms")
        .upsert(rows, {
          onConflict: "catalog_code,table_number,column_number",
          ignoreDuplicates: false,
        })
        .select("id, catalog_code, table_number, column_number");

      if (upsertError) {
        console.error("[uploadKnrNormsJson] upsert error:", upsertError);
        result.errors.push(`Błąd zapisu normy (batch ${Math.floor(i / BATCH) + 1}): ${upsertError.message}`);
        continue;
      }

      const batchCount = (upserted ?? []).length;
      if (batchCount === 0) {
        result.warnings.push(`Batch ${Math.floor(i / BATCH) + 1}: upsert zwrócił 0 wierszy — sprawdź czy constraint 'knr_norms_catalog_table_col_unique' istnieje w bazie`);
      }
      result.inserted += batchCount;

      // ── Insert knr_to_materials for norms that have materials ────────────
      for (const [batchIdx, norm] of batch.entries()) {
        if (!norm.materials || norm.materials.length === 0) continue;

        const normRow = (upserted ?? [])[batchIdx];
        if (!normRow?.id) {
          result.warnings.push(
            `Pominięto materiały dla ${norm.catalog_code} ${norm.table_number}-${norm.column_number} — brak ID normy`
          );
          continue;
        }

        // Delete existing materials for this norm to avoid duplicates on re-upload
        await supabaseAdmin
          .from("knr_to_materials")
          .delete()
          .eq("knr_norm_id", normRow.id);

        const materialRows = norm.materials.map((m) => ({
          knr_norm_id:         normRow.id,
          material_name:       m.material_name.trim(),
          material_unit:       (m.material_unit?.trim() as ValidUnit) ?? "szt",
          material_category:   m.material_category?.trim() ?? null,
          quantity_factor:     m.quantity_factor,
          component_type:      (m.component_type as ValidComponentType) ?? "material",
          recipe_component_id: m.recipe_component_id?.trim() ?? null,
          is_optional:         m.is_optional ?? false,
          only_for_surface:    m.only_for_surface ?? null,
        }));

        const { error: matError } = await supabaseAdmin
          .from("knr_to_materials")
          .insert(materialRows);

        if (matError) {
          result.warnings.push(
            `Błąd zapisu materiałów dla normy ${norm.catalog_code} ${norm.table_number}-${norm.column_number}: ${matError.message}`
          );
        } else {
          result.materialsInserted += materialRows.length;
        }
      }
    }

    result.success = result.errors.length === 0;
    return result;
  } catch (err) {
    result.errors.push(err instanceof Error ? err.message : "Nieznany błąd importu");
    return result;
  }
}

export async function getKnrReferenceFiles(): Promise<KnrCategory[]> {
  return getKnrCategories();
}

const BUCKET = "ai-knowledge-base";

const ALLOWED_EXTENSIONS = [".json", ".csv", ".xlsx", ".xls", ".pdf", ".txt"];

const MIME_MAP: Record<string, string> = {
  ".json": "application/json",
  ".csv": "text/csv",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".xls": "application/vnd.ms-excel",
  ".pdf": "application/pdf",
  ".txt": "text/plain",
};

function getExtension(fileName: string): string {
  const idx = fileName.lastIndexOf(".");
  return idx !== -1 ? fileName.slice(idx).toLowerCase() : "";
}

export interface KbFile {
  name: string;
  size: number;
  updatedAt: string;
  path: string;
}

export async function listKbFiles(): Promise<{ files: KbFile[]; error?: string }> {
  try {
    await requireAdmin();
    const { data, error } = await supabaseAdmin.storage.from(BUCKET).list("", {
      limit: 100,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) return { files: [], error: error.message };
    const files: KbFile[] = (data ?? [])
      .filter((f) => f.name !== ".emptyFolderPlaceholder")
      .map((f) => ({
        name: f.name,
        size: f.metadata?.size ?? 0,
        updatedAt: f.updated_at ?? f.created_at ?? "",
        path: f.name,
      }));
    return { files };
  } catch (err) {
    return { files: [], error: err instanceof Error ? err.message : "Błąd pobierania listy" };
  }
}

export async function uploadKbFile(
  formData: FormData
): Promise<{ success: boolean; fileName?: string; error?: string }> {
  try {
    await requireAdmin();
    const file = formData.get("file") as File | null;
    if (!file) return { success: false, error: "Brak pliku" };
    const ext = getExtension(file.name);
    if (!ALLOWED_EXTENSIONS.includes(ext))
      return { success: false, error: `Niedozwolony format. Obsługiwane: ${ALLOWED_EXTENSIONS.join(", ")}` };
    if (file.size > 20 * 1024 * 1024)
      return { success: false, error: "Plik przekracza 20MB" };

    const contentType = MIME_MAP[ext] ?? "application/octet-stream";
    const buffer = Buffer.from(await file.arrayBuffer());

    // upsert: overwrite if exists
    const { error } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(file.name, buffer, {
        contentType,
        upsert: true,
      });

    if (error) return { success: false, error: error.message };
    invalidateKbCache(file.name);
    return { success: true, fileName: file.name };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Błąd uploadu" };
  }
}

export async function deleteKbFile(
  fileName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    const ext = getExtension(fileName);
    if (!fileName || !ALLOWED_EXTENSIONS.includes(ext))
      return { success: false, error: "Nieprawidłowa nazwa pliku" };

    const { error } = await supabaseAdmin.storage.from(BUCKET).remove([fileName]);
    if (error) return { success: false, error: error.message };
    invalidateKbCache(fileName);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Błąd usuwania" };
  }
}

export async function deleteKbFiles(
  fileNames: string[]
): Promise<{ deleted: string[]; errors: string[] }> {
  const deleted: string[] = [];
  const errors: string[] = [];
  try {
    await requireAdmin();
    const valid = fileNames.filter((f) => f && ALLOWED_EXTENSIONS.includes(getExtension(f)));
    if (valid.length === 0) return { deleted, errors: ["Brak prawidłowych plików do usunięcia"] };

    const { error } = await supabaseAdmin.storage.from(BUCKET).remove(valid);
    if (error) return { deleted, errors: [error.message] };

    for (const f of valid) { invalidateKbCache(f); deleted.push(f); }
    return { deleted, errors };
  } catch (err) {
    return { deleted, errors: [err instanceof Error ? err.message : "Błąd usuwania"] };
  }
}

export async function deleteAllKnrNorms(): Promise<{ success: boolean; deleted: number; error?: string }> {
  try {
    await requireAdmin();
    // First count how many rows exist
    const { count, error: countError } = await supabaseAdmin
      .from("knr_norms")
      .select("id", { count: "exact", head: true });
    if (countError) return { success: false, deleted: 0, error: countError.message };

    // Delete all rows using gt epoch (works with service role bypassing RLS)
    const { error } = await supabaseAdmin
      .from("knr_norms")
      .delete()
      .gte("created_at", "2000-01-01T00:00:00Z");
    if (error) {
      console.error("[deleteAllKnrNorms]", error.message);
      return { success: false, deleted: 0, error: error.message };
    }
    return { success: true, deleted: count ?? 0 };
  } catch (err) {
    return { success: false, deleted: 0, error: err instanceof Error ? err.message : "Błąd usuwania" };
  }
}

export async function deleteKnrNormsByFile(
  fileName: string
): Promise<{ success: boolean; deleted: number; error?: string }> {
  try {
    await requireAdmin();
    if (!fileName?.trim()) return { success: false, deleted: 0, error: "Brak nazwy pliku" };

    const isUnknown = fileName === "(nieznany plik)";
    const query = supabaseAdmin.from("knr_norms").delete();
    const { data, error } = await (isUnknown
      ? query.is("source_edition", null)
      : query.eq("source_edition", fileName)
    ).select("id");

    if (error) return { success: false, deleted: 0, error: error.message };
    return { success: true, deleted: (data ?? []).length };
  } catch (err) {
    return { success: false, deleted: 0, error: err instanceof Error ? err.message : "Błąd usuwania" };
  }
}

export interface KnrCatalogStat {
  catalog_code: string;
  count: number;
  lastUpdated: string | null;
}

export interface KnrImportedFile {
  fileName: string;
  count: number;
  lastUpdated: string | null;
}

export interface KnrDbStats {
  total: number;
  catalogs: KnrCatalogStat[];
  importedFiles: KnrImportedFile[];
  error?: string;
}

export async function getKnrDbStats(): Promise<KnrDbStats> {
  try {
    await requireAdmin();

    // Use RPC functions to bypass PostgREST max_rows=1000 server limit.
    // DB-level GROUP BY returns only aggregated rows (72 files, ~20 catalogs).
    const [catalogsResult, filesResult] = await Promise.all([
      supabaseAdmin.rpc("get_knr_catalog_stats"),
      supabaseAdmin.rpc("get_knr_file_stats"),
    ]);

    if (catalogsResult.error) return { total: 0, catalogs: [], importedFiles: [], error: catalogsResult.error.message };
    if (filesResult.error) return { total: 0, catalogs: [], importedFiles: [], error: filesResult.error.message };

    const catalogs: KnrCatalogStat[] = (catalogsResult.data ?? []).map(
      (row: { catalog_code_normalized: string; norm_count: number; last_updated: string | null }) => ({
        catalog_code: row.catalog_code_normalized,
        count: Number(row.norm_count),
        lastUpdated: row.last_updated ?? null,
      })
    );

    const importedFiles: KnrImportedFile[] = (filesResult.data ?? []).map(
      (row: { source_edition: string; norm_count: number; last_updated: string | null }) => ({
        fileName: row.source_edition,
        count: Number(row.norm_count),
        lastUpdated: row.last_updated ?? null,
      })
    );

    const total = importedFiles.reduce((sum, f) => sum + f.count, 0);

    return { total, catalogs, importedFiles };
  } catch (err) {
    return { total: 0, catalogs: [], importedFiles: [], error: err instanceof Error ? err.message : "Błąd pobierania statystyk" };
  }
}

export async function downloadKbFile(
  fileName: string
): Promise<{ content: string; error?: string }> {
  try {
    await requireAdmin();
    const { data, error } = await supabaseAdmin.storage.from(BUCKET).download(fileName);
    if (error || !data) return { content: "", error: error?.message ?? "Brak danych" };
    const text = await data.text();
    return { content: text };
  } catch (err) {
    return { content: "", error: err instanceof Error ? err.message : "Błąd pobierania" };
  }
}
