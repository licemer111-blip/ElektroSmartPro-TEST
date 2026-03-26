import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { matchItem } from "@/lib/services/matching-engine";
import { getEffectiveRate } from "@/lib/global-benchmarks";
import { scaleLaborNorm } from "@/lib/labor-time";

interface CleanResult {
  id: string;
  name: string;
  old_knr: string;
  new_knr: string | null;
  labor_norm: number | null;
  confidence: string;
  action: "updated" | "skipped" | "error";
  reason?: string;
}

/**
 * POST /api/projects/clean-synthetic
 *
 * Re-matches all project_items with synthetic KNR-ES-XXXX codes
 * against the real es_dictionary. Items successfully matched at L1/L2
 * get their knr_code, labor_norm, labor_price, and confidence updated.
 *
 * Returns: { total, updated, skipped, results[] }
 */
export async function POST(_req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // ── Fetch all KNR-ES items across user's projects ─────────────────────────
    const { data: rawItems, error: itemsErr } = await supabase
      .from("project_items")
      .select("id, name, unit, quantity, labor_price, knr_code, project_id")
      .like("knr_code", "KNR-ES-%");

    if (itemsErr) {
      return NextResponse.json({ error: "DB error fetching items" }, { status: 500 });
    }

    if (!rawItems || rawItems.length === 0) {
      return NextResponse.json({ total: 0, updated: 0, skipped: 0, results: [] });
    }

    // ── Verify project ownership (security) ───────────────────────────────────
    const projectIds = [...new Set(rawItems.map((i) => i.project_id as string))];
    const { data: projects } = await supabase
      .from("projects")
      .select("id, default_hourly_rate, regions(name)")
      .in("id", projectIds)
      .eq("user_id", user.id);

    type RegionRow = { name: string };
    type ProjectEntry = { region: RegionRow | null; laborRate: number };
    const projectMap = new Map(
      (projects ?? []).map((p) => {
        const regions = p.regions as RegionRow[] | RegionRow | null;
        const region = Array.isArray(regions) ? regions[0] : regions;
        return [p.id, { region: region ?? null, laborRate: (p.default_hourly_rate as number | null) ?? 0 }] as [string, ProjectEntry];
      }),
    );

    const ownedItems = rawItems.filter((i) => projectMap.has(i.project_id as string));

    if (ownedItems.length === 0) {
      return NextResponse.json({ total: 0, updated: 0, skipped: 0, results: [] });
    }

    // ── Resolve labor rate once (use first project's rate as reference) ─────
    const firstProject = projectMap.values().next().value as ProjectEntry | undefined;
    const firstRegionName = firstProject?.region?.name ?? null;
    const firstLaborRate = firstProject?.laborRate ?? 0;
    const rateResult = await getEffectiveRate(firstRegionName, firstLaborRate);
    // Iron Rule: store BASE price — region modifier applied at display via calcRowPrices
    const baseRate =
      rateResult.regionModifier > 0
        ? Math.round((rateResult.laborRate / rateResult.regionModifier) * 100) / 100
        : rateResult.laborRate;

    // ── Process each item ─────────────────────────────────────────────────────
    const results: CleanResult[] = [];
    let updated = 0;
    let skipped = 0;

    for (const item of ownedItems) {
      const itemName = (item.name as string) || "";

      // Run full matching pipeline with liberal sensitivity
      const match = await matchItem(itemName, supabase, {
        sensitivity: "elastyczna",
        defaultMontage: "pod_tynkiem",
        autoLearning: false,
      });

      // Skip L3 — no reliable match found
      if (match.confidence_level === "L3" || !match.knr_ref) {
        skipped++;
        results.push({
          id: item.id as string,
          name: itemName,
          old_knr: item.knr_code as string,
          new_knr: null,
          labor_norm: null,
          confidence: "L3",
          action: "skipped",
          reason: "Brak pewnego dopasowania w es_dictionary",
        });
        continue;
      }

      // Unit Scaling v2.3: scale raw dict norm to item unit
      const rawNorm = match.labor_norm_rbh;
      const itemUnit = (item.unit as string | null) ?? "mb";
      const laborNorm = rawNorm != null ? scaleLaborNorm(rawNorm, match.unit, itemUnit) : null;
      const newLaborPrice =
        laborNorm != null && laborNorm > 0
          ? Math.round(laborNorm * baseRate * 100) / 100
          : (Number(item.labor_price) || 0);

      const laborHoursTotal =
        laborNorm != null
          ? Math.round(laborNorm * (Number(item.quantity) || 1) * 100) / 100
          : null;

      const isL1 = match.confidence_level === "L1";
      const newKnrSource = isL1 ? "official" : "es-synthetic";
      const newConfidenceLevel = isL1 ? "high" : "medium";
      const newNote = `ES-Słownik (${isL1 ? "exact" : "analog"}): ${match.matched_keyword ?? itemName} → ${match.knr_ref}${laborNorm != null ? ` | norma: ${laborNorm.toFixed(4)} rbh/${itemUnit}` : ""}${match.unit && match.unit !== itemUnit ? ` [KNR: ${match.unit}]` : ""} [re-matched from ${item.knr_code}]`;

      const { error: updateErr } = await supabase
        .from("project_items")
        .update({
          knr_code: match.knr_ref,
          knr_source: newKnrSource,
          labor_norm: laborNorm,
          labor_price: newLaborPrice,
          final_labor_price: newLaborPrice,
          labor_hours_total: laborHoursTotal,
          confidence_level: newConfidenceLevel,
          confidence_note: newNote,
        })
        .eq("id", item.id);

      if (updateErr) {
        skipped++;
        results.push({
          id: item.id as string,
          name: itemName,
          old_knr: item.knr_code as string,
          new_knr: match.knr_ref,
          labor_norm: laborNorm,
          confidence: match.confidence_level,
          action: "error",
          reason: updateErr.message,
        });
        continue;
      }

      updated++;
      results.push({
        id: item.id as string,
        name: itemName,
        old_knr: item.knr_code as string,
        new_knr: match.knr_ref,
        labor_norm: laborNorm,
        confidence: match.confidence_level,
        action: "updated",
      });
    }

    return NextResponse.json({
      total: ownedItems.length,
      updated,
      skipped,
      results,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
