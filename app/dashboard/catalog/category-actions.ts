"use server";

import { logger } from "@/lib/logger";
import { tryAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Create a new user catalog category
 */
export async function createCatalogCategory(name: string): Promise<{
  success: boolean;
  category?: { id: string; name: string };
  error: string | null;
}> {
  try {
    const { user, supabase } = await tryAuth();

    if (!user || !supabase) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate input
    if (!name || name.trim().length === 0) {
      return { success: false, error: "Nazwa kategorii nie może być pusta" };
    }

    if (name.trim().length > 100) {
      return { success: false, error: "Nazwa kategorii jest za długa (max 100 znaków)" };
    }

    // Check if category with this name already exists for this user
    const { data: existing } = await supabase
      .from("catalog_categories")
      .select("id, name")
      .eq("user_id", user.id)
      .eq("name", name.trim())
      .maybeSingle();

    if (existing) {
      return {
        success: false,
        error: `Kategoria "${name}" już istnieje`,
      };
    }

    // Insert new category
    const { data: newCategory, error: insertError } = await supabase
      .from("catalog_categories")
      .insert({
        name: name.trim(),
        user_id: user.id,
        sort_order: 999, // User categories go at the end
      })
      .select("id, name")
      .single();

    if (insertError) {
      logger.error("[createCatalogCategory] Insert error:", {}, insertError);
      return {
        success: false,
        error: `Błąd tworzenia kategorii: ${insertError.message}`,
      };
    }

    // Revalidate catalog pages
    revalidatePath("/dashboard/catalog");

    return {
      success: true,
      category: newCategory,
      error: null,
    };
  } catch (error) {
    logger.error("[createCatalogCategory] Exception:", {}, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Nieznany błąd",
    };
  }
}

/**
 * Update an existing user catalog category
 */
export async function updateCatalogCategory(
  categoryId: string,
  name: string
): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    const { user, supabase } = await tryAuth();

    if (!user || !supabase) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate input
    if (!name || name.trim().length === 0) {
      return { success: false, error: "Nazwa kategorii nie może być pusta" };
    }

    if (name.trim().length > 100) {
      return { success: false, error: "Nazwa kategorii jest za długa (max 100 znaków)" };
    }

    // Check if another category with this name exists
    const { data: existing } = await supabase
      .from("catalog_categories")
      .select("id")
      .eq("user_id", user.id)
      .eq("name", name.trim())
      .neq("id", categoryId)
      .maybeSingle();

    if (existing) {
      return {
        success: false,
        error: `Kategoria "${name}" już istnieje`,
      };
    }

    // Update category
    const { error: updateError } = await supabase
      .from("catalog_categories")
      .update({ name: name.trim() })
      .eq("id", categoryId)
      .eq("user_id", user.id);

    if (updateError) {
      logger.error("[updateCatalogCategory] Update error:", {}, updateError);
      return {
        success: false,
        error: `Błąd aktualizacji kategorii: ${updateError.message}`,
      };
    }

    // Revalidate catalog pages
    revalidatePath("/dashboard/catalog");

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    logger.error("[updateCatalogCategory] Exception:", {}, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Nieznany błąd",
    };
  }
}

/**
 * Delete a user catalog category
 */
export async function deleteCatalogCategory(categoryId: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    const { user, supabase } = await tryAuth();

    if (!user || !supabase) {
      return { success: false, error: "Unauthorized" };
    }

    // Check if category has items
    const { data: items } = await supabase
      .from("catalog_items")
      .select("id")
      .eq("category_id", categoryId)
      .limit(1);

    if (items && items.length > 0) {
      return {
        success: false,
        error: "Nie można usunąć kategorii zawierającej pozycje. Najpierw przenieś lub usuń wszystkie pozycje.",
      };
    }

    // Delete category
    const { error: deleteError } = await supabase
      .from("catalog_categories")
      .delete()
      .eq("id", categoryId)
      .eq("user_id", user.id);

    if (deleteError) {
      logger.error("[deleteCatalogCategory] Delete error:", {}, deleteError);
      return {
        success: false,
        error: `Błąd usuwania kategorii: ${deleteError.message}`,
      };
    }

    // Revalidate catalog pages
    revalidatePath("/dashboard/catalog");

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    logger.error("[deleteCatalogCategory] Exception:", {}, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Nieznany błąd",
    };
  }
}
