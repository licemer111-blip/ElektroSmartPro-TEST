import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify project ownership
    const { data: project } = await supabase
      .from("projects")
      .select("id, user_id")
      .eq("id", projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Fetch project items that are linked to catalog items
    const { data: projectItems, error: itemsError } = await supabase
      .from("project_items")
      .select("id, catalog_item_id, quantity")
      .eq("project_id", projectId)
      .not("catalog_item_id", "is", null);

    if (itemsError) {
      return NextResponse.json({ error: "Failed to fetch project items" }, { status: 500 });
    }

    const linkedItems = (projectItems ?? []).filter(
      (pi) => pi.catalog_item_id
    );

    if (linkedItems.length === 0) {
      return NextResponse.json({ updated: 0 });
    }

    const catalogIds = linkedItems.map((pi) => pi.catalog_item_id as string);

    // Fetch latest prices from catalog
    const { data: catalogItems, error: catalogError } = await supabase
      .from("catalog_items")
      .select("id, base_material_price, base_labor_price")
      .in("id", catalogIds);

    if (catalogError) {
      return NextResponse.json({ error: "Failed to fetch catalog prices" }, { status: 500 });
    }

    const priceMap = new Map(
      (catalogItems ?? []).map((ci) => [
        ci.id,
        {
          material_price: ci.base_material_price ?? 0,
          labor_price: ci.base_labor_price ?? 0,
        },
      ])
    );

    // Update each project item with fresh catalog prices
    let updated = 0;
    for (const item of linkedItems) {
      const freshPrices = priceMap.get(item.catalog_item_id as string);
      if (!freshPrices) continue;

      const { error: updateError } = await supabase
        .from("project_items")
        .update({
          material_price: freshPrices.material_price,
          labor_price: freshPrices.labor_price,
          final_material_price: freshPrices.material_price,
          final_labor_price: freshPrices.labor_price,
        })
        .eq("id", item.id);

      if (!updateError) updated++;
    }

    // Touch project updated_at so the banner won't reappear immediately
    await supabase
      .from("projects")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", projectId);

    return NextResponse.json({ updated });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
