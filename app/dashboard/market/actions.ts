"use server";

import { createClient } from "@/utils/supabase/server";
import { logger } from "@/lib/logger";

export interface MarketItem {
  id: string;
  name: string;
  unit: string;
  base_labor_price: number;
  base_material_price: number;
  category_id: string | null;
  category_name?: string;
  // Market Intelligence fields
  price_min?: number | null;
  price_max?: number | null;
  price_trend?: "stable" | "up" | "down";
  confidence_level?: "low" | "medium" | "high";
  confidence_reason?: string | null;
  market_comment?: string | null;
  market_comment_type?: string | null;
  last_verified_at?: string | null;
  knr_code?: string | null;
}

export interface MarketDataResult {
  items: MarketItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Get market data with pagination and search
 */
export async function getMarketData(params: {
  search?: string;
  categoryId?: string;
  priceType?: "labor" | "material";
  page?: number;
  pageSize?: number;
}): Promise<MarketDataResult> {
  const { search = "", categoryId, priceType = "labor", page = 1, pageSize = 20 } = params;

  const supabase = await createClient();

  // ⚡ MARKET ALWAYS SHOWS ALL GLOBAL ITEMS (independent of user toggles)
  // Market is public pricing data - users should always see it
  // Performance is handled by server-side pagination (LIMIT 40-500)

  let query = supabase
    .from("catalog_items")
    .select(`
      id,
      name,
      unit,
      base_labor_price,
      base_material_price,
      category_id,
      price_min,
      price_max,
      price_trend,
      confidence_level,
      confidence_reason,
      market_comment,
      market_comment_type,
      last_verified_at,
      knr_code,
      catalog_categories (
        name
      )
    `, { count: "exact" })
    .is("user_id", null)
    .eq("is_active", true)
    .order("name", { ascending: true });

  // Apply category filter if provided
  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  // Filter by price type - only show items with price > 0 for selected type
  if (priceType === "labor") {
    query = query.gt("base_labor_price", 0);
  } else if (priceType === "material") {
    query = query.gt("base_material_price", 0);
  }

  // Apply server-side search if provided
  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const from = Math.max(0, (page - 1) * pageSize);
  const to = from + pageSize - 1;
  const { data, error, count } = await query.range(from, to);

  if (error) {
    logger.error("Error fetching market data", { search, categoryId, priceType }, error);
    throw new Error("Failed to fetch market data");
  }

  const items: MarketItem[] = (data || []).map((item) => ({
    id: item.id,
    name: item.name,
    unit: item.unit,
    base_labor_price: item.base_labor_price,
    base_material_price: item.base_material_price,
    category_id: item.category_id,
    category_name: (Array.isArray(item.catalog_categories) ? item.catalog_categories[0]?.name : (item.catalog_categories as { name: string } | null)?.name) || "Bez kategorii",
    price_min: item.price_min,
    price_max: item.price_max,
    price_trend: item.price_trend,
    confidence_level: item.confidence_level,
    confidence_reason: item.confidence_reason,
    market_comment: item.market_comment,
    market_comment_type: item.market_comment_type,
    last_verified_at: item.last_verified_at,
    knr_code: item.knr_code,
  }));

  const total = count ?? items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Get all categories for dropdown
 */
export async function getMarketCategories(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("catalog_categories")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) {
    logger.error("Error fetching categories", {}, error);
    return [];
  }

  return data || [];
}

/**
 * Get total count of all active global catalog items
 * This is the TOTAL number of positions in the catalog (not filtered)
 */
export async function getTotalCatalogCount(): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("catalog_items")
    .select("*", { count: "exact", head: true })
    .is("user_id", null)
    .eq("is_active", true);

  if (error) {
    logger.error("Error fetching total catalog count", {}, error);
    return 0;
  }

  return count || 0;
}
