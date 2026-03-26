"use server";

import { requireAuth } from "@/lib/auth";
import { normalizeText } from "@/lib/services/normalization";
import type { DictionaryEntryType } from "@/lib/services/matching-engine";

export interface LearnPayload {
  /** Raw original name from the PDF / spreadsheet import */
  originalName: string;
  /** KNR code the user confirmed/corrected for this item */
  resolvedKnr: string;
  type?: DictionaryEntryType;
  laborNormRbh?: number | null;
  unit?: string;
}

/**
 * ES-Engine Auto-Learning.
 * Upserts a private dictionary entry for the current user so that
 * future imports resolve this item as L1 (exact match) instead of L3.
 *
 * Called fire-and-forget from the estimate table when the user saves
 * a row edit and `calibration.autoLearning` is enabled.
 */
export async function learnKnrMapping(
  payload: LearnPayload,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
    if (!user || !supabase) return { success: false, error: "Nie jesteś zalogowany" };

    const { originalName, resolvedKnr, type = "robocizna", laborNormRbh, unit } = payload;

    if (!originalName?.trim() || !resolvedKnr?.trim()) {
      return { success: false, error: "Brak wymaganych danych" };
    }

    const keyword = originalName.trim().slice(0, 200); // guard against giant strings
    const keywordNormalized = normalizeText(keyword);

    if (keywordNormalized.length < 2) {
      return { success: false, error: "Słowo kluczowe zbyt krótkie" };
    }

    // Try upsert via partial unique index (keyword_normalized, user_id)
    const newEntry = {
      keyword,
      keyword_normalized: keywordNormalized,
      knr_ref: resolvedKnr.trim(),
      type,
      is_composite: false,
      composite_refs: null,
      labor_norm_rbh: laborNormRbh ?? null,
      unit: (unit ?? "szt").slice(0, 20),
      category: "user_learned",
      confidence_weight: 1.2, // user's own entries get extra weight in fuzzy sort
      user_id: user.id,
    };

    const { error: upsertError } = await supabase
      .from("es_dictionary")
      .upsert(newEntry, {
        onConflict: "keyword_normalized,user_id",
        ignoreDuplicates: false,
      });

    if (upsertError) {
      // Fallback: manual SELECT → INSERT or UPDATE
      const { data: existing } = await supabase
        .from("es_dictionary")
        .select("id")
        .eq("keyword_normalized", keywordNormalized)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing?.id) {
        const { error: updateError } = await supabase
          .from("es_dictionary")
          .update({
            knr_ref: resolvedKnr.trim(),
            labor_norm_rbh: laborNormRbh ?? null,
            unit: (unit ?? "szt").slice(0, 20),
            confidence_weight: 1.2,
          })
          .eq("id", existing.id);

        if (updateError) return { success: false, error: "Błąd aktualizacji słownika" };
      } else {
        const { error: insertError } = await supabase
          .from("es_dictionary")
          .insert(newEntry);

        if (insertError) return { success: false, error: "Błąd zapisu do słownika" };
      }
    }

    return { success: true };
  } catch {
    return { success: false, error: "Błąd systemu ES-Engine" };
  }
}
