"use server";

import { unstable_noStore as noStore } from "next/cache";
import { normalizePolish, searchComparator } from "@/lib/utils";
import { requireAuth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { searchKnrNorms } from "./ai-search-fallback";

export interface CatalogItem {
  id: string;
  name: string;
  unit: string;
  base_labor_price: number;
  base_material_price: number;
  category_id: string | null;
  user_id: string | null;
  category_name?: string;
  team_id?: string | null;
  visibility?: "personal" | "team";
  price_min?: number | null;
  price_max?: number | null;
  price_trend?: "stable" | "up" | "down";
  confidence_level?: "low" | "medium" | "high";
  confidence_reason?: string | null;
  market_comment?: string | null;
  market_comment_type?: string | null;
  last_verified_at?: string | null;
  isAiSuggestion?: boolean;
  knr_ref?: string;
}

export interface CatalogItemsResult {
  items: CatalogItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  knrNorms?: CatalogItem[];
}

/**
 * Get catalog items with search, pagination, and category filter
 */
export async function getCatalogItems(params: {
  search?: string;
  categoryId?: string;
  type?: string;
  page?: number;
  pageSize?: number;
  favoritesOnly?: boolean;
  visibilityFilter?: "all" | "personal" | "team";
  viewMode?: "all" | "core" | "own";
}): Promise<CatalogItemsResult> {
  noStore();
  const {
    search = "",
    categoryId,
    type,
    page = 1,
    pageSize = 20,
    favoritesOnly = false,
    visibilityFilter = "all",
    viewMode = "all",
  } = params;

  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) {
    return { items: [], total: 0, page, pageSize, totalPages: 0 };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("show_global_catalog")
    .eq("id", user.id)
    .single();

  const showGlobalCatalog = profile?.show_global_catalog ?? true;

  const { data: teamMembership } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .single();

  const { data: ownedTeam } = await supabase
    .from("teams")
    .select("id")
    .eq("owner_id", user.id)
    .limit(1)
    .single();

  const userTeamId = ownedTeam?.id || teamMembership?.team_id;

  let query = supabase
    .from("catalog_items")
    .select(
      `
      id, name, unit, base_labor_price, base_material_price,
      category_id, user_id, team_id, visibility, knr_code,
      price_min, price_max, price_trend, confidence_level,
      confidence_reason, market_comment, market_comment_type, last_verified_at,
      catalog_categories ( name )
    `,
      { count: "exact", head: false }
    );

  query = query.eq("is_active", true);

  if (viewMode === "core") {
    query = query.is("user_id", null);
  } else if (viewMode === "own") {
    query = query.eq("user_id", user.id);
  } else if (viewMode === "all") {
    // Hybrid: always include global + personal + team, regardless of showGlobalCatalog
    const filterParts: string[] = [`user_id.eq.${user.id}`, `user_id.is.null`];
    if (userTeamId) filterParts.push(`and(visibility.eq.team,team_id.eq.${userTeamId})`);
    query = query.or(filterParts.join(","));
  } else if (visibilityFilter === "personal") {
    query = query.eq("user_id", user.id).or("visibility.eq.personal,visibility.is.null");
  } else if (visibilityFilter === "team" && userTeamId) {
    query = query.eq("visibility", "team").eq("team_id", userTeamId);
  } else {
    const filterParts: string[] = [`user_id.eq.${user.id}`];
    if (showGlobalCatalog) filterParts.push(`user_id.is.null`);
    if (userTeamId) filterParts.push(`and(visibility.eq.team,team_id.eq.${userTeamId})`);
    query = query.or(filterParts.join(","));
  }

  if (categoryId) query = query.eq("category_id", categoryId);

  if (type && type !== "all") {
    if (type === "labor") query = query.gt("base_labor_price", 0).lte("base_material_price", 0);
    else if (type === "material") query = query.gt("base_material_price", 0).lte("base_labor_price", 0);
    else if (type === "mixed") query = query.gt("base_material_price", 0).gt("base_labor_price", 0);
  }

  const [{ data: hiddenItems }, favoriteResult] = await Promise.all([
    supabase.from("hidden_catalog_items").select("catalog_item_id").eq("user_id", user.id),
    favoritesOnly
      ? supabase.from("favorite_catalog_items").select("catalog_item_id").eq("user_id", user.id)
      : Promise.resolve({ data: null }),
  ]);

  const hiddenItemIds = new Set(
    (hiddenItems || []).map((h: { catalog_item_id: string }) => h.catalog_item_id)
  );
  const favoriteItemIds: Set<string> | null = favoritesOnly
    ? new Set(
        (
          (favoriteResult as { data: { catalog_item_id: string }[] | null }).data || []
        ).map((f) => f.catalog_item_id)
      )
    : null;

  // ── FUZZY SEARCH PATH ────────────────────────────────────────────────────────
  if (search) {
    const { data: fuzzyData, error: fuzzyError } = await supabase.rpc("search_catalog_fuzzy", {
      search_term: search,
      user_id_param: user.id,
      team_id_param: userTeamId ?? null,
      result_limit: 200,
    });

    if (fuzzyError) {
      logger.error("[getCatalogItems] Fuzzy search RPC error", { message: fuzzyError.message }, fuzzyError);
    }

    const rawFuzzy = (fuzzyData || []) as Array<{
      id: string; name: string; unit: string;
      base_labor_price: number; base_material_price: number;
      category_id: string | null; user_id: string | null;
      team_id: string | null; visibility: string | null;
      similarity_score: number;
    }>;

    let filtered = rawFuzzy.filter((item) => {
      if (hiddenItemIds.has(item.id)) return false;
      if (favoriteItemIds && !favoriteItemIds.has(item.id)) return false;
      if (viewMode === "core" && item.user_id !== null) return false;
      if (viewMode === "own" && item.user_id !== user.id) return false;
      if (categoryId && item.category_id !== categoryId) return false;
      if (type && type !== "all") {
        if (type === "labor" && !(item.base_labor_price > 0 && item.base_material_price <= 0)) return false;
        if (type === "material" && !(item.base_material_price > 0 && item.base_labor_price <= 0)) return false;
        if (type === "mixed" && !(item.base_material_price > 0 && item.base_labor_price > 0)) return false;
      }
      return true;
    });

    const normalizedSearch = normalizePolish(search);
    filtered = filtered.sort((a, b) =>
      searchComparator(normalizedSearch, normalizePolish(a.name), normalizePolish(b.name))
    );

    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize);
    const searchFrom = (page - 1) * pageSize;
    const items: CatalogItem[] = filtered.slice(searchFrom, searchFrom + pageSize).map((item) => ({
      id: item.id,
      name: item.name,
      unit: item.unit,
      base_labor_price: item.base_labor_price,
      base_material_price: item.base_material_price,
      category_id: item.category_id,
      user_id: item.user_id,
      team_id: item.team_id,
      visibility: (item.visibility as "personal" | "team") || "personal",
      category_name: "Bez kategorii",
    }));

    // ── Parallel KNR norms search (always runs alongside catalog search) ────────
    const knrNorms = search.length > 2 ? await searchKnrNorms(search) : [];

    return { items, total, page, pageSize, totalPages, knrNorms };
  }

  // ── STANDARD PATH ────────────────────────────────────────────────────────────
  query = query.order("name", { ascending: true });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query.range(from, to);

  if (error) {
    logger.error("[getCatalogItems] Error fetching items", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    }, error);
    return { items: [], total: 0, page, pageSize, totalPages: 0 };
  }

  const allItems: CatalogItem[] = (data || [])
    .filter((item) => {
      if (hiddenItemIds.has(item.id)) return false;
      if (favoriteItemIds && !favoriteItemIds.has(item.id)) return false;
      return true;
    })
    .map((item) => ({
      id: item.id,
      name: item.name,
      unit: item.unit,
      base_labor_price: item.base_labor_price,
      base_material_price: item.base_material_price,
      category_id: item.category_id,
      user_id: item.user_id,
      team_id: item.team_id,
      visibility: item.visibility || "personal",
      category_name:
        (Array.isArray(item.catalog_categories)
          ? item.catalog_categories[0]?.name
          : (item.catalog_categories as { name: string } | null)?.name) || "Bez kategorii",
      market_comment: item.market_comment,
      knr_ref: (item as Record<string, unknown>).knr_code as string | undefined ?? undefined,
    }));

  const total = count || allItems.length;
  const totalPages = Math.ceil(total / pageSize);

  return { items: allItems, total, page, pageSize, totalPages };
}

/**
 * Get total catalog count — respects viewMode
 */
export async function getTotalCatalogCount(viewMode?: "all" | "core" | "own"): Promise<number> {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) return 0;

  const { data: profile } = await supabase
    .from("profiles")
    .select("show_global_catalog")
    .eq("id", user.id)
    .single();
  const showGlobalCatalog = profile?.show_global_catalog ?? true;

  let query = supabase
    .from("catalog_items")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  if (viewMode === "own") query = query.eq("user_id", user.id);
  else if (viewMode === "core") query = query.is("user_id", null);
  else query = query.or(`user_id.eq.${user.id},user_id.is.null`);

  // suppress unused variable warning
  void showGlobalCatalog;

  const { count, error } = await query;

  if (error) {
    logger.error("Error fetching total catalog count", {}, error);
    return 0;
  }

  return count || 0;
}

/**
 * Get category item counts — respects viewMode
 */
export async function getCategoryItemCounts(
  viewMode?: "all" | "core" | "own"
): Promise<Record<string, number>> {
  noStore();
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) return {};

  let allData: { id: string; category_id: string | null }[] = [];
  let offset = 0;
  const batchSize = 1000;

  while (true) {
    let q = supabase
      .from("catalog_items")
      .select("id, category_id")
      .eq("is_active", true)
      .range(offset, offset + batchSize - 1);

    if (viewMode === "own") q = q.eq("user_id", user.id);
    else if (viewMode === "core") q = q.is("user_id", null);
    else q = q.or(`user_id.eq.${user.id},user_id.is.null`);

    const { data: batch, error } = await q;

    if (error) {
      logger.error("[getCategoryItemCounts] Error fetching category counts", {}, error);
      return {};
    }

    if (!batch || batch.length === 0) break;

    allData = allData.concat(batch);
    offset += batchSize;
    if (batch.length < batchSize) break;
  }

  const { data: hiddenItems } = await supabase
    .from("hidden_catalog_items")
    .select("catalog_item_id")
    .eq("user_id", user.id);

  const hiddenItemIds = new Set(
    (hiddenItems || []).map((h: { catalog_item_id: string }) => h.catalog_item_id)
  );

  const counts: Record<string, number> = {};
  allData.forEach((item) => {
    if (hiddenItemIds.has(item.id)) return;
    const catId = item.category_id || "uncategorized";
    counts[catId] = (counts[catId] || 0) + 1;
  });

  return counts;
}

/**
 * Get count of user-created categories only (excludes global/system categories)
 */
export async function getUserCategoriesCount(): Promise<number> {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) return 0;

  const { count, error } = await supabase
    .from("catalog_categories")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (error) return 0;
  return count ?? 0;
}

/**
 * Get all categories for dropdown
 */
export async function getCatalogCategories() {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) return [];

  const { data, error } = await supabase
    .from("catalog_categories")
    .select("id, name, user_id")
    .order("name", { ascending: true });

  if (error) {
    logger.error("[getCatalogCategories] Error fetching categories", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    }, error);
    return [];
  }

  return data || [];
}
