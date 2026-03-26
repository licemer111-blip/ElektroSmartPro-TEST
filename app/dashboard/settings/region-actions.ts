"use server";

import { logger } from "@/lib/logger";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Update user's region (voivodeship)
 * This affects regional price modifiers in projects
 * 
 * Standalone file for region management
 */
export async function updateUserRegion(
  regionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));

    if (!user || !supabase) {
      return { success: false, error: "Nie jesteś zalogowany" };
    }

    // Empty string = Brak korekty (clear region). Any other non-UUID is invalid.
    const isClearing = !regionId || regionId.trim().length === 0;
    const cleanId = isClearing ? null : regionId.trim();

    // Update user's default region in profiles table (null clears it)
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ 
        default_region_id: cleanId,
        updated_at: new Date().toISOString() 
      })
      .eq("id", user.id);

    if (updateError) {
      logger.error("[updateUserRegion] Database error:", {}, updateError);
      return { 
        success: false, 
        error: `Błąd aktualizacji: ${updateError.message}` 
      };
    }

    // Also sync region to all user's active projects (global setting cascades)
    await supabase
      .from("projects")
      .update({ region_id: cleanId })
      .eq("user_id", user.id);

    // Revalidate paths that might display region-dependent data
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/market");
    revalidatePath("/dashboard/projects", "layout");
    revalidatePath("/dashboard/projects/[id]", "page");

    return { success: true };
  } catch (error) {
    logger.error("💥 [updateUserRegion] Unexpected error:", {}, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Nieoczekiwany błąd" 
    };
  }
}
