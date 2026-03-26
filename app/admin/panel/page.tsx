import { Metadata } from "next";
import { isAdmin } from "@/lib/utils/admin";
import { redirect } from "next/navigation";
import { PanelAdminClient } from "./panel-admin-client";
import { DIN_MODULES, MANUFACTURERS, PANEL_TEMPLATES, ENCLOSURE_OPTIONS } from "@/lib/data/din-modules-catalog";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Rozdzielnice — Admin",
};

export interface PanelCategoryStats {
  category: string;
  count: number;
  hasRating: number;
  avgMaterial: number;
  avgLabor: number;
}

export interface PanelAdminData {
  totalModules: number;
  categories: PanelCategoryStats[];
  manufacturers: number;
  templates: number;
  enclosureOptions: number;
  duplicateIds: string[];
  missingIcons: string[];
  catalogCoverage: { category: string; itemsInDb: number; avgPrice: number }[];
  panelItemStats: { total: number; lastUsed: string | null };
  generatedAt: string;
}

async function getPanelAdminData(): Promise<PanelAdminData> {
  const categoryMap = new Map<string, PanelCategoryStats>();
  const seenIds = new Set<string>();
  const duplicateIds: string[] = [];
  const missingIcons: string[] = [];

  const KNOWN_ICONS = new Set([
    "Zap", "Shield", "ToggleLeft", "Gauge", "CircleDot", "Timer",
    "Cable", "Activity", "Cog", "Power", "Battery", "Lightbulb",
    "Package", "Scissors", "Ruler", "Antenna", "Box", "Plug", "Hammer",
    "PaintBucket", "Cpu", "CircleAlert", "FileText", "Fan", "Flame",
    "Sun", "Radio", "Home", "Factory", "Store", "Building2",
  ]);

  for (const m of DIN_MODULES) {
    if (seenIds.has(m.id)) duplicateIds.push(m.id);
    seenIds.add(m.id);

    const iconName = (m as unknown as { iconName?: string }).iconName;
    if (iconName && !KNOWN_ICONS.has(iconName)) {
      missingIcons.push(`${m.id} → "${iconName}"`);
    }

    const cat = categoryMap.get(m.category) ?? {
      category: m.category,
      count: 0,
      hasRating: 0,
      avgMaterial: 0,
      avgLabor: 0,
    };
    cat.count++;
    if (m.defaultRating) cat.hasRating++;
    cat.avgMaterial += m.defaultPrice;
    cat.avgLabor += m.defaultLaborPrice;
    categoryMap.set(m.category, cat);
  }

  const categories: PanelCategoryStats[] = Array.from(categoryMap.values()).map(c => ({
    ...c,
    avgMaterial: c.count > 0 ? Math.round(c.avgMaterial / c.count) : 0,
    avgLabor: c.count > 0 ? Math.round(c.avgLabor / c.count) : 0,
  })).sort((a, b) => b.count - a.count);

  // DB: catalog_items coverage for panel categories
  const { data: catalogRows } = await supabaseAdmin
    .from("catalog_items")
    .select("category, price_material, price_labor")
    .in("category", Array.from(categoryMap.keys()));

  const dbCovMap = new Map<string, { sum: number; cnt: number }>();
  for (const row of (catalogRows ?? []) as { category: string; price_material: number }[]) {
    const e = dbCovMap.get(row.category) ?? { sum: 0, cnt: 0 };
    e.cnt++;
    e.sum += row.price_material ?? 0;
    dbCovMap.set(row.category, e);
  }

  const catalogCoverage = categories.map(cat => ({
    category: cat.category,
    itemsInDb: dbCovMap.get(cat.category)?.cnt ?? 0,
    avgPrice: dbCovMap.get(cat.category)?.cnt
      ? Math.round((dbCovMap.get(cat.category)!.sum / dbCovMap.get(cat.category)!.cnt))
      : 0,
  }));

  // DB: panel_assembly / panel_material usage from project_items
  const { count: panelTotal } = await supabaseAdmin
    .from("project_items")
    .select("id", { count: "exact", head: true })
    .like("origin_type", "panel%");

  const { data: lastRow } = await supabaseAdmin
    .from("project_items")
    .select("created_at")
    .like("origin_type", "panel%")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    totalModules: DIN_MODULES.length,
    categories,
    manufacturers: MANUFACTURERS.length,
    templates: PANEL_TEMPLATES.filter(t => !t.isHidden).length,
    enclosureOptions: ENCLOSURE_OPTIONS.length,
    duplicateIds,
    missingIcons,
    catalogCoverage,
    panelItemStats: {
      total: panelTotal ?? 0,
      lastUsed: (lastRow as { created_at?: string } | null)?.created_at ?? null,
    },
    generatedAt: new Date().toISOString(),
  };
}

export default async function PanelAdminPage() {
  const admin = await isAdmin();
  if (!admin) redirect("/dashboard");

  const data = await getPanelAdminData();

  return <PanelAdminClient data={data} />;
}
