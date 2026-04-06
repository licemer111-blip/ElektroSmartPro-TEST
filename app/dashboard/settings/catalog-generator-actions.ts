"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { generateMasterCatalog } from "./generate-catalog-action";
import { tryAuth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import {
  CABLE_SECTIONS, CABLE_CORES, CABLE_TYPES,
  ICT_CABLES,
  TRAY_WIDTHS, TRAY_TYPES, TRAY_ACCESSORIES,
  FLOORBOX_MODULES, FLOORBOX_TYPES, DADO_SIZES,
  MCCB_RATINGS, MCCB_POLES, MCCB_CURVES, DISCONNECTOR_RATINGS, CONTACTOR_RATINGS, THERMAL_RANGES,
  ENCLOSURE_SIZES, ENCLOSURE_TYPES,
  BUSBAR_RATINGS,
  DALI_DEVICES, DMX_DEVICES,
  FIRE_DEVICES,
  UPS_RATINGS, BATTERY_CAPACITIES,
  GROUNDING_ITEMS,
  HVAC_ITEMS,
  MEASUREMENT_ITEMS,
  EMERGENCY_ITEMS, OFFICE_SPECIALIZED_ITEMS, ADDITIONAL_MEASUREMENT_ITEMS, SECURITY_ITEMS,
  DEMOLITION_ACCESSORIES, DEMOLITION_LIGHTING, DEMOLITION_CABLES, DEMOLITION_TRAYS, DEMOLITION_SWITCHGEAR, DEMOLITION_CHASING,
  MONITORING_CAMERAS, MONITORING_RECORDERS, MONITORING_STORAGE, MONITORING_NETWORK, MONITORING_POWER, MONITORING_ACCESSORIES, MONITORING_SERVICES,
  EARTHWORKS_CABLING, EARTHWORKS_PROTECTION, EARTHWORKS_GROUNDING, EARTHWORKS_JOINTS, EARTHWORKS_SOIL,
  FIRE_MANUAL_DEVICES, FIRE_DETECTORS, FIRE_SOUNDERS, FIRE_CENTRALS,
  SMOKE_VENTING,
  ACCESS_LOCKS, ACCESS_POINTS, ACCESS_CONTROLLERS,
  ENGINEERING_SERVICES,
} from "@/lib/data/catalog-matrix";

export async function generateBigCatalogMatrix() {
  try {
    const { user, supabase } = await tryAuth();
    if (!user || !supabase) {
      return { success: false, count: 0, error: "Unauthorized" };
    }

    const items: Array<{ name: string; category: string; unit: string; material_price: number; labor_price: number }> = [];

    // 1. Heavy Power Cables
    for (const cableType of CABLE_TYPES) {
      for (const cores of CABLE_CORES) {
        for (const section of CABLE_SECTIONS) {
          items.push({ name: `${cableType.name} ${cores}x${section}mm2`, category: "Okablowanie", unit: "m", material_price: parseFloat((cores * section * cableType.basePricePerMm2 + 2).toFixed(2)), labor_price: parseFloat((2.5 + section * 0.08).toFixed(2)) });
        }
      }
    }
    // 2. ICT Cables
    for (const c of ICT_CABLES) { items.push({ name: `Kabel ${c.name}`, category: "Teletechnika", unit: "m", material_price: c.price, labor_price: c.labor }); }
    // 3. Cable Trays
    for (const t of TRAY_TYPES) { for (const w of TRAY_WIDTHS) { items.push({ name: `${t.name} ${w}mm (3m)`, category: "Trasy Kablowe", unit: "szt", material_price: parseFloat((w * t.pricePerMm).toFixed(2)), labor_price: t.labor }); } }
    for (const a of TRAY_ACCESSORIES) { for (const w of TRAY_WIDTHS) { items.push({ name: `${a.name} ${w}mm`, category: "Trasy Kablowe", unit: "szt", material_price: a.price + w * 0.05, labor_price: a.labor }); } }
    // 4. Office Infrastructure
    for (const fb of FLOORBOX_TYPES) { for (const m of FLOORBOX_MODULES) { items.push({ name: `${fb.name} ${m}M`, category: "Biuro", unit: "szt", material_price: fb.basePrice + m * 25, labor_price: 120 + m * 8 }); } }
    for (const d of DADO_SIZES) {
      items.push({ name: `Kanal instalacyjny PVC ${d.size} (2m)`, category: "Biuro", unit: "szt", material_price: d.price, labor_price: d.labor });
      items.push({ name: `Naroznik wewnetrzny kanalu ${d.size}`, category: "Biuro", unit: "szt", material_price: d.price * 0.4, labor_price: 5 });
      items.push({ name: `Naroznik zewnetrzny kanalu ${d.size}`, category: "Biuro", unit: "szt", material_price: d.price * 0.4, labor_price: 5 });
    }
    // 5. Industrial Switchgear
    for (const r of MCCB_RATINGS) { for (const p of MCCB_POLES) { for (const c of MCCB_CURVES) { items.push({ name: `Wylacznik MCCB ${p}P ${r}A ${c}`, category: "Rozdzielnice", unit: "szt", material_price: parseFloat((450 + r * 1.2).toFixed(2)), labor_price: 180 + r * 0.15 }); } } }
    for (const r of DISCONNECTOR_RATINGS) {
      items.push({ name: `Rozlacznik izolacyjny RBK 3P ${r}A`, category: "Rozdzielnice", unit: "szt", material_price: 250 + r * 0.8, labor_price: 120 + r * 0.2 });
      items.push({ name: `Rozlacznik izolacyjny RBK 4P ${r}A`, category: "Rozdzielnice", unit: "szt", material_price: 320 + r * 1.0, labor_price: 150 + r * 0.25 });
    }
    for (const r of CONTACTOR_RATINGS) {
      items.push({ name: `Stycznik 3P ${r}A (AC3) 230V`, category: "Rozdzielnice", unit: "szt", material_price: 85 + r * 2.5, labor_price: 45 + r * 0.5 });
      items.push({ name: `Stycznik 3P ${r}A (AC3) 400V`, category: "Rozdzielnice", unit: "szt", material_price: 90 + r * 2.5, labor_price: 45 + r * 0.5 });
    }
    for (const t of THERMAL_RANGES) { items.push({ name: `Przekaznik termiczny ${t.range}`, category: "Rozdzielnice", unit: "szt", material_price: t.price, labor_price: 35 }); }
    // 6. Industrial Enclosures
    for (const et of ENCLOSURE_TYPES) { for (const s of ENCLOSURE_SIZES) { items.push({ name: `${et.name} ${s.size}mm`, category: "Rozdzielnice", unit: "szt", material_price: parseFloat((s.price * et.multiplier).toFixed(2)), labor_price: s.labor }); } }
    // 7. Busbar Systems
    for (const r of BUSBAR_RATINGS) {
      items.push({ name: `Szyna zasilajaca (Busbar) ${r}A (1m)`, category: "Rozdzielnice", unit: "m", material_price: 180 + r * 0.8, labor_price: 120 + r * 0.15 });
      items.push({ name: `Odgaleznik szyny ${r}A`, category: "Rozdzielnice", unit: "szt", material_price: 250 + r * 0.5, labor_price: 85 });
      items.push({ name: `Zasilanie koncowe szyny ${r}A`, category: "Rozdzielnice", unit: "szt", material_price: 320 + r * 0.6, labor_price: 95 });
    }
    // 8. Lighting Control
    for (const d of DALI_DEVICES) { items.push({ name: d.name, category: "Oswietlenie", unit: "szt", material_price: d.price, labor_price: d.labor }); }
    for (const d of DMX_DEVICES) { items.push({ name: d.name, category: "Oswietlenie", unit: "szt", material_price: d.price, labor_price: d.labor }); }
    // 9. Fire Safety
    for (const d of FIRE_DEVICES) { items.push({ name: d.name, category: "Security", unit: "szt", material_price: d.price, labor_price: d.labor }); }
    // 10. UPS & Power Quality
    for (const r of UPS_RATINGS) {
      items.push({ name: `UPS Line-Interactive ${r}VA`, category: "Rozdzielnice", unit: "szt", material_price: 350 + r * 0.45, labor_price: 120 + r * 0.02 });
      items.push({ name: `UPS Online Double-Conversion ${r}VA`, category: "Rozdzielnice", unit: "szt", material_price: 650 + r * 0.75, labor_price: 180 + r * 0.03 });
    }
    for (const c of BATTERY_CAPACITIES) { items.push({ name: `Akumulator zelowy 12V ${c}Ah`, category: "Rozdzielnice", unit: "szt", material_price: 120 + c * 8, labor_price: 35 }); }
    // 11. Grounding
    for (const i of GROUNDING_ITEMS) { items.push({ name: i.name, category: "Uziemienie/Odgrom", unit: i.unit, material_price: i.price, labor_price: i.labor }); }
    // 12. HVAC
    for (const i of HVAC_ITEMS) { items.push({ name: i.name, category: "Biuro", unit: "kpl", material_price: i.price, labor_price: i.labor }); }
    // 13. Measurement
    for (const i of MEASUREMENT_ITEMS) { items.push({ name: i.name, category: "Pomiary", unit: "szt", material_price: i.price, labor_price: i.labor }); }
    // 14. Specialized
    for (const i of EMERGENCY_ITEMS) { items.push({ name: i.name, category: "Awaryjne", unit: "szt", material_price: i.price, labor_price: i.labor }); }
    for (const i of OFFICE_SPECIALIZED_ITEMS) { items.push({ name: i.name, category: "Biuro", unit: "szt", material_price: i.price, labor_price: i.labor }); }
    for (const i of ADDITIONAL_MEASUREMENT_ITEMS) { items.push({ name: i.name, category: "Pomiary", unit: "szt", material_price: i.price, labor_price: i.labor }); }
    for (const i of SECURITY_ITEMS) { items.push({ name: i.name, category: "Security", unit: "szt", material_price: i.price, labor_price: i.labor }); }
    // 15. Demolition
    for (const i of DEMOLITION_ACCESSORIES) { items.push({ name: i.name, category: "Demontaze", unit: "szt", material_price: 0, labor_price: i.labor }); }
    for (const i of DEMOLITION_LIGHTING) { items.push({ name: i.name, category: "Demontaze", unit: "szt", material_price: 0, labor_price: i.labor }); }
    for (const i of DEMOLITION_CABLES) { items.push({ name: i.name, category: "Demontaze", unit: "m", material_price: 0, labor_price: i.labor }); }
    for (const i of DEMOLITION_TRAYS) { items.push({ name: i.name, category: "Demontaze", unit: "m", material_price: 0, labor_price: i.labor }); }
    for (const i of DEMOLITION_SWITCHGEAR) { items.push({ name: i.name, category: "Demontaze", unit: "szt", material_price: 0, labor_price: i.labor }); }
    for (const i of DEMOLITION_CHASING) { items.push({ name: i.name, category: "Demontaze", unit: "szt", material_price: 0, labor_price: i.labor }); }
    // 16. Monitoring
    for (const i of MONITORING_CAMERAS) { items.push({ name: i.name, category: "Monitoring", unit: "szt", material_price: i.price, labor_price: i.labor }); }
    for (const i of MONITORING_RECORDERS) { items.push({ name: i.name, category: "Monitoring", unit: "szt", material_price: i.price, labor_price: i.labor }); }
    for (const i of MONITORING_STORAGE) { items.push({ name: i.name, category: "Monitoring", unit: "szt", material_price: i.price, labor_price: i.labor }); }
    for (const i of MONITORING_NETWORK) { items.push({ name: i.name, category: "Monitoring", unit: "szt", material_price: i.price, labor_price: i.labor }); }
    for (const i of MONITORING_POWER) { items.push({ name: i.name, category: "Monitoring", unit: "szt", material_price: i.price, labor_price: i.labor }); }
    for (const i of MONITORING_ACCESSORIES) { items.push({ name: i.name, category: "Monitoring", unit: "szt", material_price: i.price, labor_price: i.labor }); }
    for (const i of MONITORING_SERVICES) { items.push({ name: i.name, category: "Monitoring", unit: "usl", material_price: i.price, labor_price: i.labor }); }
    // 17. Earthworks
    for (const i of EARTHWORKS_CABLING) { items.push({ name: i.name, category: "Prace Ziemne", unit: "m", material_price: i.price, labor_price: i.labor }); }
    for (const i of EARTHWORKS_PROTECTION) { items.push({ name: i.name, category: "Prace Ziemne", unit: "m", material_price: i.price, labor_price: i.labor }); }
    for (const i of EARTHWORKS_GROUNDING) { items.push({ name: i.name, category: "Prace Ziemne", unit: "szt", material_price: i.price, labor_price: i.labor }); }
    for (const i of EARTHWORKS_JOINTS) { items.push({ name: i.name, category: "Prace Ziemne", unit: "szt", material_price: i.price, labor_price: i.labor }); }
    for (const i of EARTHWORKS_SOIL) { items.push({ name: i.name, category: "Prace Ziemne", unit: i.unitOverride ?? "szt", material_price: i.price, labor_price: i.labor }); }
    // 18. PPOZ
    for (const i of FIRE_MANUAL_DEVICES) { items.push({ name: i.name, category: "PPOZ", unit: "szt", material_price: i.price, labor_price: i.labor }); }
    for (const i of FIRE_DETECTORS) { items.push({ name: i.name, category: "PPOZ", unit: "szt", material_price: i.price, labor_price: i.labor }); }
    for (const i of FIRE_SOUNDERS) { items.push({ name: i.name, category: "PPOZ", unit: "szt", material_price: i.price, labor_price: i.labor }); }
    for (const i of FIRE_CENTRALS) { items.push({ name: i.name, category: "PPOZ", unit: i.unitOverride ?? "szt", material_price: i.price, labor_price: i.labor }); }
    // 19. Smoke Venting
    for (const i of SMOKE_VENTING) { items.push({ name: i.name, category: "PPOZ", unit: i.unitOverride ?? "szt", material_price: i.price, labor_price: i.labor }); }
    // 20. Access Control
    for (const i of ACCESS_LOCKS) { items.push({ name: i.name, category: "Security", unit: "szt", material_price: i.price, labor_price: i.labor }); }
    for (const i of ACCESS_POINTS) { items.push({ name: i.name, category: "Security", unit: "szt", material_price: i.price, labor_price: i.labor }); }
    for (const i of ACCESS_CONTROLLERS) { items.push({ name: i.name, category: "Security", unit: i.unitOverride ?? "szt", material_price: i.price, labor_price: i.labor }); }
    // 21. Engineering Services
    for (const i of ENGINEERING_SERVICES) { items.push({ name: i.name, category: "Pomiary", unit: "usl", material_price: i.price, labor_price: i.labor }); }

    // INSERT INTO DATABASE
    const categoryMapping: Record<string, string> = {};
    const { data: categories, error: catFetchError } = await supabase.from("catalog_categories").select("id, name");
    if (catFetchError) {
      logger.error("[Catalog Generator] Error fetching categories", {}, catFetchError);
      return { success: false, count: 0, error: "Failed to fetch categories" };
    }
    const categoryMap = new Map(categories?.map(cat => [cat.name, cat.id]) || []);
    const dbItems = items.map(item => {
      const mappedCategoryName = categoryMapping[item.category] || item.category;
      const categoryId = categoryMap.get(mappedCategoryName);
      if (!categoryId) { logger.warn("Skipping item - category not found", { itemName: item.name, mappedCategoryName, originalCategory: item.category }); return null; }
      return { user_id: null, category_id: categoryId, name: item.name, unit: item.unit, base_material_price: item.material_price, base_labor_price: item.labor_price, is_assembly_parent: false, is_active: true };
    }).filter(Boolean);

    const batchSize = 500;
    let insertedCount = 0;
    let skippedCount = 0;
    for (let i = 0; i < dbItems.length; i += batchSize) {
      const batch = dbItems.slice(i, i + batchSize);
      const { data: insertedData, error: upsertError } = await supabase.from('catalog_items').upsert(batch, { onConflict: 'user_id,name', ignoreDuplicates: true }).select('id');
      if (upsertError) { logger.error("[Catalog Generator] Batch upsert error", { batch: Math.floor(i/batchSize) + 1 }, upsertError); throw new Error(`Database upsert failed: ${upsertError.message}`); }
      const batchInserted = insertedData?.length || 0;
      insertedCount += batchInserted;
      skippedCount += batch.length - batchInserted;
    }
    return { success: true, count: insertedCount, message: `Dodano ${insertedCount} nowych pozycji (${skippedCount} duplikatow pominieto)`, error: null };
  } catch (error) {
    logger.error("[Catalog Generator] Error", {}, error);
    return { success: false, count: 0, error: error instanceof Error ? error.message : "Nieznany blad" };
  }
}
export async function createCategory(name: string): Promise<{ 
  success: boolean; 
  category?: { id: string; name: string };
  error: string | null 
}> {
  try {
    const { user, supabase } = await tryAuth();
    if (!user || !supabase) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate input
    if (!name || name.trim().length === 0) {
      return { success: false, error: "Nazwa kategorii nie mo┼╝e by─З pusta" };
    }

    if (name.trim().length > 100) {
      return { success: false, error: "Nazwa kategorii jest za d┼Вuga (max 100 znak├│w)" };
    }


    // Check if category with this name already exists (global catalog)
    const { data: existing } = await supabase
      .from("catalog_categories")
      .select("id, name")
      .eq("name", name.trim())
      .maybeSingle();

    if (existing) {
      return { 
        success: false, 
        error: `Kategoria "${name}" ju┼╝ istnieje` 
      };
    }

    // Insert new category
    const { data: newCategory, error: insertError } = await supabase
      .from("catalog_categories")
      .insert({
        name: name.trim(),
      })
      .select("id, name")
      .single();

    if (insertError) {
      logger.error("[createCategory] Insert error", { name }, insertError);
      return { 
        success: false, 
        error: `B┼В─Еd tworzenia kategorii: ${insertError.message}` 
      };
    }


    // Revalidate catalog and settings pages
    revalidatePath("/dashboard/catalog");
    revalidatePath("/dashboard/settings");

    return { 
      success: true, 
      category: newCategory,
      error: null 
    };
  } catch (error) {
    logger.error("[createCategory] Exception", { name }, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Nieznany b┼В─Еd" 
    };
  }
}

/**
 * Get all categories
 */
export async function getCategories(): Promise<{ 
  success: boolean; 
  categories?: Array<{ id: string; name: string }>;
  error: string | null 
}> {
  try {
    const { user, supabase } = await tryAuth();
    if (!user || !supabase) {
      return { success: false, error: "Unauthorized" };
    }

    const { data: categories, error: fetchError } = await supabase
      .from("catalog_categories")
      .select("id, name")
      .order("name");

    if (fetchError) {
      logger.error("[getCategories] Fetch error", {}, fetchError);
      return { 
        success: false, 
        error: `B┼В─Еd pobierania kategorii: ${fetchError.message}` 
      };
    }

    return { 
      success: true, 
      categories: categories || [],
      error: null 
    };
  } catch (error) {
    logger.error("[getCategories] Exception", {}, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Nieznany b┼В─Еd" 
    };
  }
}

/**
 * Generate PRO Catalog - Combines Standard + Extended generators
 * This is a unified function that executes both catalog generations sequentially
 * Total: ~933 items (Standard ~350 + Extended ~583)
 */
export async function generateProCatalog(): Promise<{
  success: boolean;
  count: number;
  message?: string;
  error: string | null;
}> {
  try {
    const { user, supabase } = await tryAuth();
    if (!user || !supabase) {
      return { success: false, count: 0, error: "Musisz by─З zalogowany" };
    }


    // Check PRO status
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_pro')
      .eq('id', user.id)
      .single();

    if (!profile?.is_pro) {
      return { 
        success: false, 
        count: 0, 
        error: "Funkcja dost─Щpna tylko w pakiecie PRO. Przejd┼║ na PRO, aby odblokowa─З pe┼Вn─Е baz─Щ danych." 
      };
    }

    let totalCount = 0;

    // Step 1: Generate Standard Catalog (~350 items)
    const standardResult = await generateMasterCatalog();
    
    if (!standardResult.success) {
      return {
        success: false,
        count: 0,
        error: `B┼В─Еd podczas generowania Standard Catalog: ${standardResult.message}`,
      };
    }
    
    totalCount += standardResult.count;

    // Step 2: Generate Extended Catalog (~583 items)
    const matrixResult = await generateBigCatalogMatrix();
    
    if (!matrixResult.success) {
      return {
        success: false,
        count: totalCount, // Return partial count
        error: `Standard Catalog OK (${totalCount} items), ale Extended Catalog failed: ${matrixResult.error}`,
      };
    }
    
    totalCount += matrixResult.count;


    return {
      success: true,
      count: totalCount,
      message: `Dodano ${totalCount} nowych pozycji do bazy! ${matrixResult.message || ''}`,
      error: null,
    };
  } catch (error) {
    logger.error("[PRO Catalog Generator] Error", {}, error);
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : "Nieznany b┼В─Еd podczas generowania bazy PRO",
    };
  }
}
