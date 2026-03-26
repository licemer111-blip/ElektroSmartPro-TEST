"use server";

import { createClient } from "@/utils/supabase/server";
import { logger } from "@/lib/logger";

/**
 * Get global catalog count for public landing page
 * No authentication required
 */
export async function getGlobalCatalogCount(): Promise<number> {
  try {
    const supabase = await createClient();

    const { count, error } = await supabase
      .from("catalog_items")
      .select("*", { count: "exact", head: true })
      .is("user_id", null)
      .eq("is_active", true);

    if (error) {
      logger.error("Error counting global items", {}, error);
      return 1022; // Fallback to current count
    }

    return count || 1022;
  } catch (error) {
    logger.error("getGlobalCatalogCount error", {}, error);
    return 1022; // Fallback to current count
  }
}
