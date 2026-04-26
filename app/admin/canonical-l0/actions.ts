"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/utils/admin";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createClient } from "@/utils/supabase/server";
import {
  getAdminEntryViews,
  invalidateOverridesCache,
  type AdminEntryView,
} from "@/lib/services/canonical-l0-overrides";

// NOTE: cannot `export type {AdminEntryView}` from a "use server" file —
// Next.js enforces that all exports be async functions. Client components
// import AdminEntryView directly from @/lib/services/canonical-l0-overrides.

const SaveOverrideSchema = z.object({
  entry_description: z.string().min(1).max(500),
  labor_norm_override: z
    .number()
    .min(0)
    .max(50)
    .nullable(),
  material_price_override: z
    .number()
    .min(0)
    .max(100000)
    .nullable(),
  knr_code_override: z
    .string()
    .trim()
    .max(120)
    .nullable(),
  disabled: z.boolean(),
  notes: z.string().trim().max(1000).nullable(),
});

export type SaveOverrideInput = z.infer<typeof SaveOverrideSchema>;

export interface SaveResult {
  success: boolean;
  error?: string;
}

export async function listCanonicalL0Entries(): Promise<AdminEntryView[]> {
  await requireAdmin();
  return getAdminEntryViews();
}

export async function saveCanonicalL0Override(
  input: SaveOverrideInput,
): Promise<SaveResult> {
  try {
    await requireAdmin();
    const parsed = SaveOverrideSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join(", "),
      };
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Brak sesji administratora" };

    // Reject overrides that don't reference a real hardcoded entry — prevents
    // dangling rows when a description is renamed in source code.
    const allViews = await getAdminEntryViews();
    const known = allViews.find(
      (v) => v.description === parsed.data.entry_description,
    );
    if (!known) {
      return {
        success: false,
        error: `Nie znaleziono pozycji L0 o opisie: ${parsed.data.entry_description}`,
      };
    }

    // Empty override is a no-op — delete instead so DB stays clean.
    const isAllNull =
      parsed.data.labor_norm_override == null &&
      parsed.data.material_price_override == null &&
      (parsed.data.knr_code_override == null ||
        parsed.data.knr_code_override.length === 0) &&
      !parsed.data.disabled &&
      (!parsed.data.notes || parsed.data.notes.length === 0);

    if (isAllNull) {
      const { error: delErr } = await supabaseAdmin
        .from("canonical_l0_overrides")
        .delete()
        .eq("entry_description", parsed.data.entry_description);
      if (delErr) return { success: false, error: delErr.message };
      invalidateOverridesCache();
      revalidatePath("/admin/canonical-l0");
      return { success: true };
    }

    const knrTrimmed = parsed.data.knr_code_override?.trim() ?? null;
    const notesTrimmed = parsed.data.notes?.trim() ?? null;

    const { error } = await supabaseAdmin
      .from("canonical_l0_overrides")
      .upsert(
        {
          entry_description: parsed.data.entry_description,
          labor_norm_override: parsed.data.labor_norm_override,
          material_price_override: parsed.data.material_price_override,
          knr_code_override: knrTrimmed && knrTrimmed.length > 0 ? knrTrimmed : null,
          disabled: parsed.data.disabled,
          notes: notesTrimmed && notesTrimmed.length > 0 ? notesTrimmed : null,
          updated_by: user.id,
          created_by: user.id,
        },
        { onConflict: "entry_description" },
      );

    if (error) return { success: false, error: error.message };

    invalidateOverridesCache();
    revalidatePath("/admin/canonical-l0");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Nieznany błąd";
    return { success: false, error: msg };
  }
}

export async function deleteCanonicalL0Override(
  entryDescription: string,
): Promise<SaveResult> {
  try {
    await requireAdmin();
    if (!entryDescription || entryDescription.length === 0) {
      return { success: false, error: "Brak identyfikatora pozycji" };
    }
    const { error } = await supabaseAdmin
      .from("canonical_l0_overrides")
      .delete()
      .eq("entry_description", entryDescription);
    if (error) return { success: false, error: error.message };

    invalidateOverridesCache();
    revalidatePath("/admin/canonical-l0");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Nieznany błąd";
    return { success: false, error: msg };
  }
}
