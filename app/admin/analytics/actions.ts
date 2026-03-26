"use server";

import { createClient } from "@/utils/supabase/server";
import { requireAdmin } from "@/lib/utils/admin";
import { logger } from "@/lib/logger";

// Type for custom item analytics
export interface CustomItemAnalytics {
  item_name: string;
  usage_count: number;
  avg_material_price: number;
  avg_labor_price: number;
  users_count: number;
}

// Type for price deviation analytics
export interface PriceDeviationItem {
  catalog_id: string;
  item_name: string;
  category_name: string;
  global_material_price: number;
  global_labor_price: number;
  user_avg_material_price: number;
  user_avg_labor_price: number;
  material_deviation_percent: number;
  labor_deviation_percent: number;
  usage_count: number;
}

/**
 * Get most frequent custom items across all users
 * (Items that are NOT linked to global catalog)
 */
export async function getCustomItemsAnalytics(): Promise<{
  items: CustomItemAnalytics[];
  error?: string;
}> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    // Query: Find all project_items that don't have catalog_item_id (custom items)
    // Group by normalized name, count occurrences, calculate avg prices
    const { data, error } = await supabase.rpc("get_custom_items_analytics");

    if (error) {
      logger.error("Error fetching custom items analytics", {}, error);
      return { items: [], error: error.message };
    }

    return { items: data || [] };
  } catch (error: unknown) {
    logger.error("Exception in getCustomItemsAnalytics", {}, error);
    return { items: [], error: error instanceof Error ? error.message : "Nieznany błąd" };
  }
}

/**
 * Get global items where user prices deviate significantly (>10%) from global prices
 */
export async function getPriceDeviationAnalytics(): Promise<{
  items: PriceDeviationItem[];
  error?: string;
}> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    // Query: Compare global catalog prices with user-entered prices
    const { data, error } = await supabase.rpc("get_price_deviation_analytics");

    if (error) {
      logger.error("Error fetching price deviation analytics", {}, error);
      return { items: [], error: error.message };
    }

    return { items: data || [] };
  } catch (error: unknown) {
    logger.error("Exception in getPriceDeviationAnalytics", {}, error);
    return { items: [], error: error instanceof Error ? error.message : "Nieznany błąd" };
  }
}

// Type for user activity analytics
export interface UserActivityData {
  user_id: string;
  email: string;
  full_name: string;
  company_name: string;
  is_pro: boolean;
  created_at: string;
  last_sign_in_at: string | null;
  projects_count: number;
  project_items_count: number;
  custom_catalog_items: number;
  offers_sent: number;
  offers_accepted: number;
  ai_requests: number;
  last_project_created: string | null;
  last_item_added: string | null;
}

/**
 * Get user activity analytics for admin dashboard
 * Shows engagement metrics per user
 */
export async function getUserActivityAnalytics(): Promise<{
  users: UserActivityData[];
  error?: string;
}> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("get_user_activity_analytics");

    if (error) {
      logger.error("Error fetching user activity analytics", {}, error);
      return { users: [], error: error.message };
    }

    return { users: (data || []) as UserActivityData[] };
  } catch (error: unknown) {
    logger.error("Exception in getUserActivityAnalytics", {}, error);
    return { users: [], error: error instanceof Error ? error.message : "Nieznany błąd" };
  }
}

// Type for detailed custom items (individual rows with user info)
export interface DetailedCustomItem {
  item_id: string;
  item_name: string;
  unit: string;
  quantity: number;
  material_price: number;
  labor_price: number;
  project_id: string;
  project_name: string;
  user_id: string;
  user_email: string;
  user_full_name: string;
  created_at: string;
}

/**
 * Get all custom items with full detail (who created, which project, prices)
 */
export async function getCustomItemsDetailed(): Promise<{
  items: DetailedCustomItem[];
  error?: string;
}> {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_custom_items_detailed");

    if (error) {
      logger.error("Error fetching detailed custom items", {}, error);
      return { items: [], error: error.message };
    }

    return { items: (data || []) as DetailedCustomItem[] };
  } catch (error: unknown) {
    logger.error("Exception in getCustomItemsDetailed", {}, error);
    return { items: [], error: error instanceof Error ? error.message : "Nieznany błąd" };
  }
}

/**
 * Delete a custom project item (admin only)
 */
export async function deleteCustomItem(itemId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { error } = await supabase
      .from("project_items")
      .delete()
      .eq("id", itemId)
      .is("catalog_item_id", null);

    if (error) {
      logger.error("Error deleting custom item", { itemId }, error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: unknown) {
    logger.error("Exception in deleteCustomItem", { itemId }, error);
    return { success: false, error: error instanceof Error ? error.message : "Nieznany błąd" };
  }
}

/**
 * Add a custom item to the global catalog
 */
export async function addCustomItemToGlobal(
  itemName: string,
  categoryId: string,
  unit: string,
  materialPrice: number,
  laborPrice: number
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    // Insert into catalog_items as global item (user_id = NULL)
    const { error } = await supabase.from("catalog_items").insert({
      name: itemName,
      category_id: categoryId,
      unit: unit,
      base_material_price: materialPrice,
      base_labor_price: laborPrice,
      user_id: null, // Global item
      price_min: materialPrice * 0.9, // -10%
      price_max: materialPrice * 1.1, // +10%
      price_trend: "stable",
      last_verified_at: new Date().toISOString(),
    });

    if (error) {
      logger.error("Error adding item to global catalog", { itemName, categoryId }, error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: unknown) {
    logger.error("Exception in addCustomItemToGlobal", { itemName, categoryId }, error);
    return { success: false, error: error instanceof Error ? error.message : "Nieznany błąd" };
  }
}
