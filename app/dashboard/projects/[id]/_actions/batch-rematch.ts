"use server";

/**
 * batch-rematch.ts
 *
 * Batch re-matcher for project items with missing KNR data.
 * Targets items where knr_code IS NULL or labor_norm IS NULL and
 * re-runs the full 5-phase matching pipeline (including Phase 2e Synonyms
 * and Phase 4b Reverse Norm Lookup) to fill in the gaps.
 *
 * Called from: "Napraw normy" button in project detail page / admin tools.
 */

import { tryAuth } from "@/lib/auth";
import { matchItem, DEFAULT_ENGINE_SETTINGS } from "@/lib/services/matching-engine";
import { scaleLaborNorm } from "@/lib/labor-time";

export interface BatchRematchResult {
  success: boolean;
  totalScanned: number;
  fixed: number;
  stillMissing: number;
  error?: string;
}

/**
 * Re-matches all project items that are missing knr_code or labor_norm.
 * Uses the enhanced matching engine (Phase 2e synonyms + Phase 4b reverse lookup).
 * Only updates items where the new match improves the data (not null→null).
 */
export async function batchRematchNullLaborItems(
  projectId: string,
): Promise<BatchRematchResult> {
  try {
    const { user, supabase } = await tryAuth();
    if (!user || !supabase) {
      return { success: false, totalScanned: 0, fixed: 0, stillMissing: 0, error: "Musisz być zalogowany" };
    }

    // Fetch items missing knr_code or labor_norm
    const { data: items, error: fetchError } = await supabase
      .from("project_items")
      .select("id, name, unit, labor_norm, knr_code, norm_protected")
      .eq("project_id", projectId)
      .or("knr_code.is.null,labor_norm.is.null")
      .is("norm_protected", null)   // skip manually locked norms
      .not("name", "is", null)
      .order("sort_order");

    if (fetchError) {
      return { success: false, totalScanned: 0, fixed: 0, stillMissing: 0, error: "Błąd pobierania pozycji" };
    }

    if (!items || items.length === 0) {
      return { success: true, totalScanned: 0, fixed: 0, stillMissing: 0 };
    }

    let fixed = 0;
    let stillMissing = 0;

    // Process in batches of 10 to avoid overwhelming Supabase
    const BATCH_SIZE = 10;
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const chunk = items.slice(i, i + BATCH_SIZE);

      await Promise.all(
        chunk.map(async (item) => {
          if (!item.name?.trim()) { stillMissing++; return; }

          const match = await matchItem(item.name, supabase, DEFAULT_ENGINE_SETTINGS);

          const hasNewKnr = match.knr_ref && !item.knr_code;
          const hasNewNorm = match.labor_norm_rbh != null && item.labor_norm == null;

          if (!hasNewKnr && !hasNewNorm) { stillMissing++; return; }

          const updatePayload: Record<string, unknown> = {};

          if (hasNewKnr) {
            updatePayload.knr_code = match.knr_ref;
            updatePayload.knr_source = match.confidence_level === "L1" ? "system_knr"
              : match.match_method === "reverse_norm_lookup" ? "ai_estimation"
              : "es_synthetic";
            updatePayload.confidence_level = match.confidence_level;
          }

          if (hasNewNorm && match.labor_norm_rbh != null) {
            const scaledNorm = scaleLaborNorm(match.labor_norm_rbh, match.unit, item.unit ?? "szt");
            updatePayload.labor_norm = scaledNorm;
          }

          const { error: updateError } = await supabase
            .from("project_items")
            .update(updatePayload)
            .eq("id", item.id)
            .eq("project_id", projectId);

          if (updateError) { stillMissing++; return; }
          fixed++;
        }),
      );
    }

    return {
      success: true,
      totalScanned: items.length,
      fixed,
      stillMissing,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Nieznany błąd";
    return { success: false, totalScanned: 0, fixed: 0, stillMissing: 0, error: msg };
  }
}
