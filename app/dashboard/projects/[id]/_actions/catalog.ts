"use server";

import { requireAuth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import type { CatalogItem, CatalogCategory } from "@/lib/types/database";

// Helper type for category with count
export type CatalogCategoryWithCount = CatalogCategory & { count: number };

// Fetch all catalog categories with item counts
// sourceFilter: 'personal' = user's own + AI items, 'team' = team-shared, 'all' = global catalog
export async function getCatalogCategories(
  objectTypeId?: string,
  forceShowAll?: boolean,
  _pricingMode?: string, // @deprecated — ignored, use sourceFilter directly
  sourceFilter?: "personal" | "team" | "all"
): Promise<CatalogCategoryWithCount[]> {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) {
    return [];
  }

  const effectiveSource: "personal" | "team" | "all" = sourceFilter ?? "personal";

  // Get user's team_id
  const { data: profileData } = await supabase
    .from("profiles")
    .select("team_id")
    .eq("id", user.id)
    .single();
  const userTeamId = profileData?.team_id as string | null;

  // Get all categories first
  const { data: categoriesData, error } = await supabase
    .from("catalog_categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    logger.error("Error fetching categories", {}, error);
    return [];
  }

  const allCategories = (categoriesData as CatalogCategory[]) || [];

  // Step A: Get hidden items set
  const { data: hiddenItems } = await supabase
    .from("hidden_catalog_items")
    .select("catalog_item_id")
    .eq("user_id", user.id);

  const hiddenItemIds = new Set((hiddenItems || []).map((h: { catalog_item_id: string }) => h.catalog_item_id));

  // Step B: Query distinct category_id from visible items (batch to bypass 1000-row limit)
  let allCountItems: { category_id: string; id: string }[] = [];
  let from = 0;
  const batchSize = 1000;
  let hasMore = true;

  while (hasMore) {
    let itemsQuery = supabase
      .from("catalog_items")
      .select("id, category_id, user_id, team_id, visibility")
      .eq("is_active", true)
      .range(from, from + batchSize - 1);

    if (effectiveSource === "all") {
      itemsQuery = itemsQuery.is("user_id", null);
    } else if (effectiveSource === "team") {
      if (userTeamId) {
        itemsQuery = itemsQuery.eq("team_id", userTeamId).not("user_id", "is", null);
      } else {
        hasMore = false;
        break;
      }
    } else {
      itemsQuery = itemsQuery.eq("user_id", user.id);
    }

    const { data: batch, error: itemsError } = await itemsQuery;

    if (itemsError) {
      logger.error("Error counting items (batch)", {}, itemsError);
      if (from === 0) return allCategories.map(cat => ({ ...cat, count: 0 }));
      break;
    }

    if (batch && batch.length > 0) {
      allCountItems.push(...(batch as { category_id: string; id: string }[]));
      if (batch.length < batchSize) {
        hasMore = false;
      } else {
        from += batchSize;
      }
    } else {
      hasMore = false;
    }
  }

  // Step C: Filter hidden items and Count by Category
  const countMap = new Map<string, number>();

  allCountItems.forEach((item) => {
    if (!hiddenItemIds.has(item.id)) {
      countMap.set(item.category_id, (countMap.get(item.category_id) || 0) + 1);
    }
  });

  return allCategories.map(cat => ({
    ...cat,
    count: countMap.get(cat.id) || 0,
  }));
}

/**
 * Single Server Action that returns BOTH categories (with counts) AND all items.
 * Replaces getCatalogCategories + getCatalogItemsBatch (2 SA round-trips → 1).
 * Total SQL: 1 auth + 1 profiles + 1 catalog_categories + 1 catalog_items + 1 hidden_items = 5 queries.
 */
export async function getCatalogDataBatch(
  _pricingMode?: string, // @deprecated — ignored, use sourceFilter directly
  sourceFilter?: "personal" | "team" | "all"
): Promise<{
  categories: CatalogCategoryWithCount[];
  itemsByCategory: Record<string, CatalogItem[]>;
}> {
  const empty = { categories: [], itemsByCategory: {} };
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
    if (!user || !supabase) return empty;

    const effectiveSource: "personal" | "team" | "all" = sourceFilter ?? "personal";

    const { data: profileData } = await supabase
      .from("profiles")
      .select("team_id")
      .eq("id", user.id)
      .single();
    const userTeamId = profileData?.team_id as string | null;

    if (effectiveSource === "team" && !userTeamId) return empty;

    const [categoriesResult, itemsResult, hiddenResult] = await Promise.all([
      supabase
        .from("catalog_categories")
        .select("*")
        .order("sort_order", { ascending: true }),
      (() => {
        let q = supabase
          .from("catalog_items")
          .select("*")
          .eq("is_active", true);
        if (effectiveSource === "all") {
          // global (user_id IS NULL) + personal (user_id = me) — no extra filter
          q = q.or(`user_id.is.null,user_id.eq.${user.id}`);
        } else if (effectiveSource === "team") {
          q = q.eq("team_id", userTeamId!).not("user_id", "is", null);
        } else {
          q = q.eq("user_id", user.id);
        }
        return q.order("name", { ascending: true }).limit(5000);
      })(),
      supabase
        .from("hidden_catalog_items")
        .select("catalog_item_id")
        .eq("user_id", user.id),
    ]);

    const allCategories = (categoriesResult.data as CatalogCategory[]) || [];
    const allItems = (itemsResult.data as CatalogItem[]) || [];
    const hiddenIds = new Set(
      ((hiddenResult.data || []) as { catalog_item_id: string }[]).map(h => h.catalog_item_id)
    );

    const itemsByCategory: Record<string, CatalogItem[]> = {};
    const countMap = new Map<string, number>();

    for (const item of allItems) {
      if (hiddenIds.has(item.id)) continue;
      const catId = item.category_id as string;
      if (!catId) continue;
      if (!itemsByCategory[catId]) itemsByCategory[catId] = [];
      itemsByCategory[catId].push(item);
      countMap.set(catId, (countMap.get(catId) || 0) + 1);
    }

    const categories: CatalogCategoryWithCount[] = allCategories.map(cat => ({
      ...cat,
      count: countMap.get(cat.id) || 0,
    }));

    return { categories, itemsByCategory };
  } catch {
    return empty;
  }
}

// Fetch catalog items for a category
// sourceFilter: 'personal' = user's own items, 'team' = team-shared, 'all' = global catalog
export async function getCatalogItemsByCategory(
  categoryId: string,
  _pricingMode?: string, // @deprecated — ignored, use sourceFilter directly
  sourceFilter?: "personal" | "team" | "all"
): Promise<CatalogItem[]> {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
    if (!user || !supabase) {
      logger.error("Auth failed in getCatalogItemsByCategory", { categoryId });
      return [];
    }

    const effectiveSource: "personal" | "team" | "all" = sourceFilter ?? "personal";

    const { data: profile } = await supabase
      .from("profiles")
      .select("team_id")
      .eq("id", user.id)
      .single();

    const userTeamId = profile?.team_id as string | null;

    let query = supabase
      .from("catalog_items")
      .select("*")
      .eq("category_id", categoryId)
      .eq("is_active", true);

    if (effectiveSource === "all") {
      // global (user_id IS NULL) + personal (user_id = me)
      query = query.or(`user_id.is.null,user_id.eq.${user.id}`);
    } else if (effectiveSource === "team") {
      if (userTeamId) {
        query = query.eq("team_id", userTeamId).not("user_id", "is", null);
      } else {
        return [];
      }
    } else {
      query = query.eq("user_id", user.id);
    }

    query = query.order("name", { ascending: true });

    const { data, error } = await query;

    if (error) {
      logger.error("Error fetching catalog items", { categoryId }, error);
      return [];
    }

    const { data: hiddenItems } = await supabase
      .from("hidden_catalog_items")
      .select("catalog_item_id")
      .eq("user_id", user.id);

    const hiddenItemIds = new Set((hiddenItems || []).map((h: { catalog_item_id: string }) => h.catalog_item_id));

    return (data as CatalogItem[] || []).filter(item => !hiddenItemIds.has(item.id));
  } catch (error) {
    logger.error("Critical error in getCatalogItemsByCategory", { categoryId }, error);
    return [];
  }
}

/**
 * Batch fetch ALL catalog items for ALL categories in 2 SQL queries.
 * Replaces N individual getCatalogItemsByCategory calls in reloadCatalog.
 * Returns a map: categoryId → CatalogItem[]
 */
export async function getCatalogItemsBatch(
  _pricingMode?: string, // @deprecated — ignored, use sourceFilter directly
  sourceFilter?: "personal" | "team" | "all"
): Promise<Record<string, CatalogItem[]>> {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
    if (!user || !supabase) return {};

    const effectiveSource: "personal" | "team" | "all" = sourceFilter ?? "personal";

    const { data: profile } = await supabase
      .from("profiles")
      .select("team_id")
      .eq("id", user.id)
      .single();
    const userTeamId = profile?.team_id as string | null;

    let query = supabase
      .from("catalog_items")
      .select("*")
      .eq("is_active", true);

    if (effectiveSource === "all") {
      // global (user_id IS NULL) + personal (user_id = me)
      query = query.or(`user_id.is.null,user_id.eq.${user.id}`);
    } else if (effectiveSource === "team") {
      if (!userTeamId) return {};
      query = query.eq("team_id", userTeamId).not("user_id", "is", null);
    } else {
      query = query.eq("user_id", user.id);
    }

    query = query.order("name", { ascending: true });

    const { data, error } = await query;
    if (error || !data) return {};

    const { data: hiddenItems } = await supabase
      .from("hidden_catalog_items")
      .select("catalog_item_id")
      .eq("user_id", user.id);
    const hiddenIds = new Set((hiddenItems || []).map((h: { catalog_item_id: string }) => h.catalog_item_id));

    const result: Record<string, CatalogItem[]> = {};
    for (const item of data as CatalogItem[]) {
      if (hiddenIds.has(item.id)) continue;
      const catId = item.category_id as string;
      if (!catId) continue;
      if (!result[catId]) result[catId] = [];
      result[catId].push(item);
    }
    return result;
  } catch {
    return {};
  }
}

// Search catalog items (for lazy loading)
export async function searchCatalogItems(
  searchTerm: string,
  searchMode: "own" | "engine" | "hybrid" = "hybrid",
): Promise<CatalogItem[]> {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) {
    return [];
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("team_id")
    .eq("id", user.id)
    .single();

  const userTeamId = profile?.team_id;

  let query = supabase
    .from("catalog_items")
    .select("*")
    .eq("is_active", true)
    .ilike("name", `%${searchTerm}%`)
    .limit(60);

  if (searchMode === "own") {
    if (userTeamId) {
      query = query.or(`user_id.eq.${user.id},team_id.eq.${userTeamId}`);
    } else {
      query = query.eq("user_id", user.id);
    }
  } else if (searchMode === "engine") {
    query = query.is("user_id", null);
  } else {
    // hybrid: own + global
    if (userTeamId) {
      query = query.or(`user_id.is.null,user_id.eq.${user.id},team_id.eq.${userTeamId}`);
    } else {
      query = query.or(`user_id.is.null,user_id.eq.${user.id}`);
    }
  }

  query = query.order("name", { ascending: true });

  const { data, error } = await query;

  if (error) {
    logger.error("Error searching catalog items", { searchTerm, searchMode }, error);
    return [];
  }

  const { data: hiddenItems } = await supabase
    .from("hidden_catalog_items")
    .select("catalog_item_id")
    .eq("user_id", user.id);

  const hiddenItemIds = new Set((hiddenItems || []).map((h: { catalog_item_id: string }) => h.catalog_item_id));

  const filtered = (data as CatalogItem[] || []).filter((item) => !hiddenItemIds.has(item.id));

  // hybrid: sort own items first, then global (user_id === null)
  if (searchMode === "hybrid") {
    filtered.sort((a, b) => {
      const aIsOwn = a.user_id !== null ? 0 : 1;
      const bIsOwn = b.user_id !== null ? 0 : 1;
      if (aIsOwn !== bIsOwn) return aIsOwn - bIsOwn;
      return a.name.localeCompare(b.name);
    });
  }

  return filtered;
}
