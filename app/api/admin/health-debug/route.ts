import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isAdmin } from "@/lib/utils/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await isAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("catalog_items")
    .select("panel_category, base_material_price, base_labor_price")
    .eq("is_active", true)
    .in("panel_category", ["panel_assembly", "panel_labor"]);

  if (error) return NextResponse.json({ error: error.message });

  const counts: Record<string, number> = {};
  for (const r of data ?? []) {
    const k = r.panel_category ?? "null";
    counts[k] = (counts[k] ?? 0) + 1;
  }

  return NextResponse.json({ total: (data ?? []).length, counts, rows: data });
}
