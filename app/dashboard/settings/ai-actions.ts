"use server";

import { logger } from "@/lib/logger";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Delete all AI-generated catalog items for the current user
 * Items are identified by market_comment containing "AI Generated"
 */
export async function deleteAICatalogItems() {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));

    if (!user || !supabase) {
      return { success: false, error: "Musisz być zalogowany" };
    }

    // Delete catalog items where:
    // 1. user_id matches current user
    // 2. market_comment contains "AI Generated"
    const { data: deletedItems, error } = await supabase
      .from("catalog_items")
      .delete()
      .eq("user_id", user.id)
      .like("market_comment", "%AI Generated%")
      .select("id");

    if (error) {
      logger.error("[AI Content Manager] Error deleting catalog items:", {}, error);
      return { success: false, error: "Błąd usuwania pozycji katalogowych" };
    }

    const deletedCount = deletedItems?.length || 0;

    // Revalidate catalog page
    revalidatePath("/dashboard/catalog");

    return {
      success: true,
      deletedCount,
    };
  } catch (error) {
    logger.error("[AI Content Manager] Unexpected error:", {}, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Nieoczekiwany błąd",
    };
  }
}

/**
 * Delete all AI-generated assemblies for the current user
 * Assemblies are identified by is_ai_generated = true
 * Also deletes all related assembly items
 */
export async function deleteAIAssemblies() {

  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));

    if (!user || !supabase) {
      return { success: false, error: "Musisz być zalogowany" };
    }

    // Get AI assembly IDs first (to delete items later)
    const { data: aiAssemblies, error: fetchError } = await supabase
      .from("user_assemblies")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_ai_generated", true);

    if (fetchError) {
      logger.error("[AI Content Manager] Error fetching AI assemblies:", {}, fetchError);
      return { success: false, error: "Błąd pobierania zestawów AI" };
    }

    const assemblyIds = aiAssemblies?.map((a) => a.id) || [];

    if (assemblyIds.length === 0) {
      return {
        success: true,
        deletedCount: 0,
      };
    }

    // Delete assembly items first (due to foreign key constraint)
    const { error: itemsError } = await supabase
      .from("user_assembly_items")
      .delete()
      .in("assembly_id", assemblyIds);

    if (itemsError) {
      logger.error("[AI Content Manager] Error deleting assembly items:", {}, itemsError);
      return { success: false, error: "Błąd usuwania elementów zestawów" };
    }

    // Delete assemblies
    const { error: assembliesError } = await supabase
      .from("user_assemblies")
      .delete()
      .eq("user_id", user.id)
      .eq("is_ai_generated", true);

    if (assembliesError) {
      logger.error("[AI Content Manager] Error deleting assemblies:", {}, assembliesError);
      return { success: false, error: "Błąd usuwania zestawów" };
    }

    // Revalidate assemblies page
    revalidatePath("/dashboard/assemblies");

    return {
      success: true,
      deletedCount: assemblyIds.length,
    };
  } catch (error) {
    logger.error("[AI Content Manager] Unexpected error:", {}, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Nieoczekiwany błąd",
    };
  }
}
