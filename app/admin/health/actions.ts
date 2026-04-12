"use server";

import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isAdmin } from "@/lib/utils/admin";
import { logger } from "@/lib/logger";
import {
  LABOR_NORMS,
  POWER_CATEGORIES,
  MODULE_CONSUMABLES,
  BUSBAR_LOGIC,
  PANEL_ASSEMBLY,
} from "@/lib/zestawy-logic";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OriginTypeHealth {
  originType: string;
  displayName: string;
  category: "material" | "labor" | "consumable" | "system";
  hasKnrNorm: boolean;
  knrCode: string | null;
  laborNorm: number | null;
  catalogItemCount: number;       // matching items in catalog_items
  avgMaterialPrice: number | null;
  avgLaborPrice: number | null;
  uncertainCount: number;         // project_items with confidence_level='uncertain'
  verifiedCount: number;          // project_items with confidence_level='verified'
  status: "ok" | "warn" | "error";
}

export interface EsEngineStats {
  totalCatalogItems: number;      // all rows in catalog_items
  totalEsDictionary: number;      // rows in es_dictionary (KNR norms)
  categoriesCount: number;        // distinct categories in catalog_items
  baseRbhRate: number;            // current admin RBH rate
  matMultiplier: number;          // current material multiplier
  activeProjects: number;         // projects not archived
  totalProjectItems: number;      // all project_items
  knrCoveredItems: number;        // project_items with knr_code != null
}

export interface RagFileStatus {
  name: string;
  size: number;
  updatedAt: string | null;
  present: boolean;
}

export interface KnrNormsStats {
  total: number;
  byCatalog: { prefix: string; count: number; lastUpdate: string | null }[];
  lastImport: string | null;
  bucketFiles: { name: string; size: number; updatedAt: string | null }[];
}

export interface UserKnrStats {
  globalEntries: number;
  userEntries: number;
  userCategories: string[];
  userByCategory: Record<string, number>;
}

export interface CatalogHealthReport {
  // Summary KPIs
  priceCoveragePct: number;       // % origin_types with avg price > 0
  knrCoveragePct: number;         // % origin_types with valid KNR norm
  uncertainTotal: number;         // total uncertain project_items across all projects
  verifiedTotal: number;
  totalChecked: number;

  // Per-type breakdown
  rows: OriginTypeHealth[];

  // Module catalog stats (catalog_items per category)
  catalogStats: {
    category: string;
    itemCount: number;
    avgPrice: number;
    brandCount: number;
    withKnr: number;
    verified: number;
  }[];

  // Raw counts from project_items
  projectItemStats: {
    total: number;
    withOriginId: number;
    byConfidence: Record<string, number>;
  };

  // ES Engine runtime stats
  engineStats: EsEngineStats;

  // KNR Norms DB stats (real data from knr_norms table)
  knrNormsStats: KnrNormsStats;

  // Deprecated: kept for type compat
  ragFiles: RagFileStatus[];

  // User KNR entries stats from es_dictionary
  userKnrStats: UserKnrStats;

  generatedAt: string;
}

// ─── KNR reference map (from zestawy-logic) ──────────────────────────────────

const KNR_REFERENCE: Record<string, { code: string; norm: number }> = {
  // Panel system types
  panel_material:   { code: "ES-INTERNAL",      norm: 0.00 },
  panel_labor:      { code: "KNR 5-04 0101-01", norm: LABOR_NORMS.breaker_1p },
  panel_consumable: { code: "KNR 5-04 0001-02", norm: 0.02 },
  panel_busbar:     { code: "KNR 5-04 0101-01", norm: 0.05 },
  panel_assembly:   { code: "KNR 5-04 0001-01", norm: PANEL_ASSEMBLY.laborNormBase },
  // DIN module types
  breaker:      { code: "KNR 5-04 0101-01", norm: LABOR_NORMS.breaker_1p },
  rcd:          { code: "KNR 5-04 0201-01", norm: LABOR_NORMS.rcd_2p },
  rcbo:         { code: "KNR 5-04 0201-02", norm: LABOR_NORMS.rcbo_1p },
  spd:          { code: "KNR 5-04 0501-01", norm: LABOR_NORMS.spd },
  contactor:    { code: "KNR 5-04 0301-01", norm: LABOR_NORMS.contactor },
  timer:        { code: "KNR 5-04 0401-01", norm: LABOR_NORMS.timer },
  monitoring:   { code: "KNR 5-08 0295-01", norm: LABOR_NORMS.monitoring },
  automation:   { code: "KNR 5-08 0295-02", norm: LABOR_NORMS.automation },
  compensation: { code: "KNR 5-08 0295-03", norm: LABOR_NORMS.compensation },
  terminal:     { code: "KNR 5-04 0601-01", norm: LABOR_NORMS.terminal },
  switch:       { code: "KNR 5-04 0701-01", norm: LABOR_NORMS.switch },
  enclosure:    { code: "KNR 5-04 0001-01", norm: 1.0 },
  wiring:       { code: "KNR 5-04 0801-01", norm: 0.05 },
  consumable:   { code: "KNR 5-04 0001-02", norm: 0.02 },
  labor:        { code: "KNR 5-04 0101-01", norm: LABOR_NORMS.breaker_1p },
};

const ORIGIN_TYPE_DISPLAY: Record<string, { name: string; category: OriginTypeHealth["category"] }> = {
  // Panel sync system types
  panel_material:    { name: "Materiał modułu DIN",           category: "material" },
  panel_labor:       { name: "Robocizna montażu modułu",      category: "labor" },
  panel_consumable:  { name: "Tulejki i oznakowanie (Zestaw)",category: "consumable" },
  panel_busbar:      { name: "Szyna łączeniowa (Zestaw)",     category: "consumable" },
  panel_assembly:    { name: "Montaż bazowy rozdzielnicy",    category: "labor" },
  // DIN module categories (15 categories from ES Engine Rack)
  breaker:      { name: "Wyłącznik nadprądowy (MCB)",    category: "material" },
  rcd:          { name: "Wyłącznik różnicowoprądowy",    category: "material" },
  rcbo:         { name: "Kombiautomat (RCBO)",            category: "material" },
  spd:          { name: "Ochronnik przepięciowy (SPD)",  category: "material" },
  contactor:    { name: "Stycznik",                      category: "material" },
  timer:        { name: "Przekaźnik czasowy",             category: "material" },
  monitoring:   { name: "Przekaźnik kontrolny",          category: "material" },
  automation:   { name: "Moduł automatyki / PLC",        category: "material" },
  compensation: { name: "Kompensacja mocy biernej",      category: "material" },
  terminal:     { name: "Złączka szynowa",               category: "material" },
  switch:       { name: "Łącznik / Przełącznik",         category: "material" },
  enclosure:    { name: "Obudowa rozdzielnicy",          category: "material" },
  wiring:       { name: "Przewody i kable (w szafie)",   category: "material" },
  consumable:   { name: "Materiały pomocnicze (kpl.)",   category: "consumable" },
  labor:        { name: "Robocizna montażu ogólna",      category: "labor" },
};

// ─── Main health report action ────────────────────────────────────────────────

export async function getCatalogHealthReport(): Promise<{ data: CatalogHealthReport | null; error?: string }> {
  try {
    const admin = await isAdmin();
    if (!admin) return { data: null, error: "Unauthorized" };

    // Use supabaseAdmin for reads — bypasses RLS to get accurate global counts
    const supabase = supabaseAdmin;

    // ── 1. project_items confidence stats ────────────────────────────────────
    const { data: confidenceData, error: confErr } = await supabase
      .from("project_items")
      .select("confidence_level, origin_type")
      .not("origin_id", "is", null);

    if (confErr) {
      logger.error("health: confidence query", {}, confErr);
      return { data: null, error: "Błąd pobierania danych z project_items" };
    }

    const byConfidence: Record<string, number> = {};
    let totalWithOrigin = 0;
    let totalItems = 0;
    for (const row of confidenceData ?? []) {
      totalWithOrigin++;
      totalItems++;
      const lvl = (row as { confidence_level?: string | null }).confidence_level ?? "unknown";
      byConfidence[lvl] = (byConfidence[lvl] ?? 0) + 1;
    }

    // ── 2. catalog_items stats — aggregated on DB side to bypass PostgREST 1000-row limit ──
    // Using raw SQL aggregate avoids fetching all 1500+ rows through the API
    const { data: aggData, error: catErr } = await supabase.rpc("health_catalog_stats");

    if (catErr) {
      logger.error("health: catalog aggregate query", {}, catErr);
    }

    // Build panelCatMap from aggregated rows (one row per panel_category)
    const panelCatMap = new Map<string, { matPrices: number[]; labPrices: number[]; brands: Set<string | null>; withKnr: number; verified: number }>();
    for (const row of (aggData ?? []) as {
      panel_category: string | null;
      item_count: number;
      avg_mat: number | null;
      avg_lab: number | null;
      with_knr: number;
      verified_count: number;
    }[]) {
      const key = row.panel_category ?? "__uncategorized";
      const cnt = Number(row.item_count) || 0;
      const avgMat = Number(row.avg_mat) || 0;
      const avgLab = Number(row.avg_lab) || 0;
      // Reconstruct price arrays: fill with avg value repeated cnt times for compatibility
      // For non-zero avgs, create a single representative entry; zeros are excluded by nonZero filter later
      const matPrices = Array(cnt).fill(avgMat);
      const labPrices = Array(cnt).fill(avgLab);
      panelCatMap.set(key, {
        matPrices,
        labPrices,
        brands: new Set([null]), // brand count not available in aggregate — set to 1
        withKnr: Number(row.with_knr) || 0,
        verified: Number(row.verified_count) || 0,
      });
    }

    const catalogStats = Array.from(panelCatMap.entries())
      .filter(([key]) => key !== "__uncategorized")
      .map(([panelCat, stat]) => {
        const matNonZero = stat.matPrices.filter(p => p > 0);
        const labNonZero = stat.labPrices.filter(p => p > 0);
        // For labor-type categories mat prices are always 0 — use labor avg instead
        const pricePool = matNonZero.length > 0 ? matNonZero : labNonZero;
        const avgPrice = pricePool.length > 0
          ? pricePool.reduce((a, b) => a + b, 0) / pricePool.length
          : 0;
        return {
          category: panelCat,
          itemCount: stat.matPrices.length,
          avgPrice,
          brandCount: stat.brands.size,
          withKnr: stat.withKnr,
          verified: stat.verified,
        };
      }).sort((a, b) => b.itemCount - a.itemCount);

    // ── 3. catalog_categories lookup (for UI display only) ───────────────────
    const { data: categories } = await supabase
      .from("catalog_categories")
      .select("id, name");
    void categories; // used only if needed for display elsewhere

    // ── 4. Per origin_type health rows ────────────────────────────────────────
    const originTypesToCheck = [...new Set([
      "panel_material", "panel_labor", "panel_consumable", "panel_busbar", "panel_assembly",
      ...Object.keys(KNR_REFERENCE),
      "compensation", "consumable", "labor", // extra DIN categories
    ])];

    const { data: originStats } = await supabase
      .from("project_items")
      .select("origin_type, confidence_level, material_price, labor_price")
      .not("origin_id", "is", null);

    // Aggregate by origin_type
    const originAgg = new Map<string, {
      uncertain: number; verified: number;
      matPrices: number[]; labPrices: number[];
    }>();

    for (const row of (originStats ?? []) as {
      origin_type: string | null;
      confidence_level: string | null;
      material_price: number | null;
      labor_price: number | null;
    }[]) {
      const ot = row.origin_type ?? "unknown";
      if (!originAgg.has(ot)) originAgg.set(ot, { uncertain: 0, verified: 0, matPrices: [], labPrices: [] });
      const agg = originAgg.get(ot)!;
      if (row.confidence_level === "uncertain") agg.uncertain++;
      if (row.confidence_level === "verified") agg.verified++;
      if (row.material_price != null && row.material_price > 0) agg.matPrices.push(row.material_price);
      if (row.labor_price != null && row.labor_price > 0) agg.labPrices.push(row.labor_price);
    }

    const rows: OriginTypeHealth[] = originTypesToCheck.map(ot => {
      const displayInfo = ORIGIN_TYPE_DISPLAY[ot] ?? { name: ot, category: "system" as const };
      const knr = KNR_REFERENCE[ot] ?? null;
      const agg = originAgg.get(ot) ?? { uncertain: 0, verified: 0, matPrices: [], labPrices: [] };

      // Catalog item count — direct match by panel_category = origin_type
      const catalogForType = panelCatMap.get(ot);
      const catalogItemCount = catalogForType?.matPrices.length ?? 0;

      // avgMaterialPrice: prefer live project_items data, fall back to catalog avg
      // For labor-type categories (panel_assembly, panel_labor), base_material_price=0 is correct
      // so we check catalog labor prices too
      const isLaborType = displayInfo.category === "labor";
      const catMatPricesNonZero = catalogForType?.matPrices.filter(p => p > 0) ?? [];
      const catLabPricesNonZero = catalogForType?.labPrices.filter(p => p > 0) ?? [];

      const avgMaterialPrice = agg.matPrices.length > 0
        ? agg.matPrices.reduce((a, b) => a + b, 0) / agg.matPrices.length
        : catMatPricesNonZero.length > 0
          ? catMatPricesNonZero.reduce((a, b) => a + b, 0) / catMatPricesNonZero.length
          : null;

      // avgLaborPrice: prefer project_items, fall back to catalog labor avg
      // Labor-type items always have base_labor_price > 0 — use it as fallback even if no project items
      const avgLaborPrice = agg.labPrices.length > 0
        ? agg.labPrices.reduce((a, b) => a + b, 0) / agg.labPrices.length
        : catLabPricesNonZero.length > 0
          ? catLabPricesNonZero.reduce((a, b) => a + b, 0) / catLabPricesNonZero.length
          : null;

      // Determine status — labor-type entries are valid if they have avgLaborPrice
      const hasPrice = avgMaterialPrice != null || avgLaborPrice != null
        || displayInfo.category === "consumable"
        || (isLaborType && catLabPricesNonZero.length > 0);
      const hasKnr = knr != null;
      let status: "ok" | "warn" | "error" = "ok";
      if (agg.uncertain > 0) status = "error";
      else if (!hasPrice) status = "warn";

      return {
        originType: ot,
        displayName: displayInfo.name,
        category: displayInfo.category,
        hasKnrNorm: hasKnr,
        knrCode: knr?.code ?? null,
        laborNorm: knr?.norm ?? null,
        catalogItemCount,
        avgMaterialPrice,
        avgLaborPrice,
        uncertainCount: agg.uncertain,
        verifiedCount: agg.verified,
        status,
      } satisfies OriginTypeHealth;
    });

    // ── 5. Summary KPIs ───────────────────────────────────────────────────────
    const withPrice = rows.filter(r => r.avgMaterialPrice != null || r.avgLaborPrice != null || r.category === "consumable").length;
    const withKnr = rows.filter(r => r.hasKnrNorm).length;
    const priceCoveragePct = Math.round((withPrice / rows.length) * 100);
    const knrCoveragePct = Math.round((withKnr / rows.length) * 100);
    const uncertainTotal = byConfidence["uncertain"] ?? 0;
    const verifiedTotal = byConfidence["verified"] ?? 0;

    // ── 6. Extended counts ─────────────────────────────────────────────────────
    const [
      { count: totalProjectItems },
      { count: totalCatalogItems },
      { count: totalEsDictionary },
      { count: activeProjects },
      { count: knrCoveredItems },
    ] = await Promise.all([
      supabase.from("project_items").select("id", { count: "exact", head: true }),
      supabase.from("catalog_items").select("id", { count: "exact", head: true }),
      supabase.from("es_dictionary").select("id", { count: "exact", head: true }),
      supabase.from("projects").select("id", { count: "exact", head: true }).neq("status", "archived"),
      supabase.from("project_items").select("id", { count: "exact", head: true }).not("knr_code", "is", null),
    ]);

    // ── 7. Engine runtime stats ────────────────────────────────────────────────
    const rbhRate = 75; // hardcoded base rate (project-specific)
    const matMult = 1.05; // hardcoded material multiplier (project-specific)

    // ── 8. KNR Norms DB stats (real data from knr_norms table) ──────────────────
    const { data: knrCatalogRows } = await supabase
      .from("knr_norms")
      .select("catalog_code, created_at, updated_at");

    const catalogPrefixMap = new Map<string, { count: number; lastUpdate: string | null }>();
    let knrLastImport: string | null = null;

    for (const row of (knrCatalogRows ?? []) as { catalog_code: string; created_at: string; updated_at: string }[]) {
      const prefix = row.catalog_code.replace(/ \d{4}.*$/, "").trim() || row.catalog_code;
      const existing = catalogPrefixMap.get(prefix) ?? { count: 0, lastUpdate: null };
      existing.count++;
      if (!existing.lastUpdate || (row.updated_at && row.updated_at > existing.lastUpdate)) {
        existing.lastUpdate = row.updated_at;
      }
      catalogPrefixMap.set(prefix, existing);
      if (!knrLastImport || (row.created_at && row.created_at > knrLastImport)) {
        knrLastImport = row.created_at;
      }
    }

    const byCatalog = Array.from(catalogPrefixMap.entries())
      .map(([prefix, stat]) => ({ prefix, count: stat.count, lastUpdate: stat.lastUpdate }))
      .sort((a, b) => b.count - a.count);

    // Storage bucket — just list what’s actually there (no hardcoded expected list)
    let bucketFiles: { name: string; size: number; updatedAt: string | null }[] = [];
    try {
      const { data: storageList } = await supabase.storage
        .from("ai-knowledge-base")
        .list("", { limit: 200, offset: 0 });
      if (storageList) {
        bucketFiles = storageList.map(f => ({
          name: f.name,
          size: f.metadata?.size ?? 0,
          updatedAt: f.updated_at ?? null,
        }));
      }
    } catch {
      // Storage unavailable
    }

    const knrNormsStats: KnrNormsStats = {
      total: knrCatalogRows?.length ?? 0,
      byCatalog,
      lastImport: knrLastImport,
      bucketFiles,
    };

    const ragFiles: RagFileStatus[] = bucketFiles.map(f => ({
      name: f.name, size: f.size, updatedAt: f.updatedAt, present: true,
    }));

    // ── 9. User KNR stats from es_dictionary ──────────────────────────────────
    const { data: esDictStats } = await supabase
      .from("es_dictionary")
      .select("user_id, category")
      .not("user_id", "is", null);

    const { count: globalEntriesCount } = await supabase
      .from("es_dictionary")
      .select("id", { count: "exact", head: true })
      .is("user_id", null);

    const userByCategory: Record<string, number> = {};
    for (const row of (esDictStats ?? []) as { user_id: string | null; category: string | null }[]) {
      const cat = row.category ?? "unknown";
      userByCategory[cat] = (userByCategory[cat] ?? 0) + 1;
    }

    const userKnrStats: UserKnrStats = {
      globalEntries: globalEntriesCount ?? 0,
      userEntries: esDictStats?.length ?? 0,
      userCategories: Object.keys(userByCategory),
      userByCategory,
    };

    const distinctCategories = catalogStats.length;

    return {
      data: {
        priceCoveragePct,
        knrCoveragePct,
        uncertainTotal,
        verifiedTotal,
        totalChecked: rows.length,
        rows,
        catalogStats: catalogStats.slice(0, 25),
        projectItemStats: {
          total: totalProjectItems ?? 0,
          withOriginId: totalWithOrigin,
          byConfidence,
        },
        engineStats: {
          totalCatalogItems: totalCatalogItems ?? 0,
          totalEsDictionary: totalEsDictionary ?? 0,
          categoriesCount: distinctCategories,
          baseRbhRate: rbhRate,
          matMultiplier: matMult,
          activeProjects: activeProjects ?? 0,
          totalProjectItems: totalProjectItems ?? 0,
          knrCoveredItems: knrCoveredItems ?? 0,
        },
        knrNormsStats,
        ragFiles,
        userKnrStats,
        generatedAt: new Date().toISOString(),
      },
    };
  } catch (err) {
    logger.error("health: unexpected", {}, err);
    return { data: null, error: "Nieoczekiwany błąd raportu" };
  }
}

// ─── AI repair action for UNCERTAIN items ─────────────────────────────────────

export interface RepairResult {
  repaired: number;
  skipped: number;
  error?: string;
}

export async function repairUncertainPrices(projectId?: string): Promise<RepairResult> {
  try {
    const admin = await isAdmin();
    if (!admin) return { repaired: 0, skipped: 0, error: "Unauthorized" };

    const supabase = await createClient();

    // Fetch UNCERTAIN items (optionally scoped to one project)
    let query = supabase
      .from("project_items")
      .select("id, name, origin_type, quantity")
      .eq("confidence_level", "uncertain");

    if (projectId) query = query.eq("project_id", projectId);

    const { data: items, error } = await query.limit(50);
    if (error) return { repaired: 0, skipped: 0, error: "Błąd pobierania pozycji" };

    if (!items || items.length === 0) {
      return { repaired: 0, skipped: 0 };
    }

    // Record KNR norm reference only — never write labor_price using admin rate.
    // Price calculation is the user's responsibility (set in project settings).
    let repaired = 0;

    for (const item of items as { id: string; name: string; origin_type: string | null; quantity: number }[]) {
      const ot = item.origin_type ?? "";
      const knr = KNR_REFERENCE[ot];

      if (knr) {
        await supabase.from("project_items").update({
          confidence_note: `Norma KNR: ${knr.norm} rbh — ustaw stawkę roboczą w ustawieniach projektu`,
        }).eq("id", item.id);
        repaired++;
      }
    }

    return { repaired, skipped: items.length - repaired };
  } catch (err) {
    logger.error("health: repair", {}, err);
    return { repaired: 0, skipped: 0, error: "Nieoczekiwany błąd naprawy" };
  }
}
