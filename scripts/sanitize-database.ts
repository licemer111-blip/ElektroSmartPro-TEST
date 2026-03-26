/**
 * sanitize-database.ts
 * Global catalog_items sanitization script.
 *
 * Run (dry-run):  npx tsx scripts/sanitize-database.ts --dry-run
 * Run (live):     npx tsx scripts/sanitize-database.ts
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import {
  MATERIAL_PRICE_CEILING,
  LABOR_PRICE_CEILING,
  LABOR_UNIT_FALLBACK,
  clampPrice,
  lookupKnrForLabor,
} from "../lib/utils/price-validator";

// ─── Config ──────────────────────────────────────────────────────────────────

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const isDryRun = process.argv.includes("--dry-run");
const BATCH_SIZE = 50;

// Prices below this are clearly garbage (0.001, 0.1 groszy, etc.)
const GARBAGE_MIN = 0.10;
// Prices above this for any catalog item are suspicious (e.g. an ID stored as price)
const GARBAGE_MAX_ABSOLUTE = 2000;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface CatalogRow {
  id: string;
  name: string;
  unit: string | null;
  base_material_price: number;
  base_labor_price: number;
  knr_code: string | null;
  user_id: string | null;
}

interface FixRecord {
  id: string;
  name: string;
  field: string;
  before: number | string | null;
  after: number | string | null;
  reason: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const LABOR_KEYWORDS = ["montaż", "kucie", "układanie", "bruzdowanie", "podłączenie", "pomiar", "instalacj"];

function isLaborType(name: string): boolean {
  const lower = name.toLowerCase();
  return LABOR_KEYWORDS.some((kw) => lower.includes(kw));
}

function isGarbagePrice(price: number): boolean {
  return price > 0 && price < GARBAGE_MIN;
}

function isAbsurdlyHigh(price: number): boolean {
  return price > GARBAGE_MAX_ABSOLUTE;
}

function getMarketPriceForMaterial(name: string, unit: string): number | null {
  const nameLower = name.toLowerCase();
  const unitLower = unit.toLowerCase();
  for (const c of MATERIAL_PRICE_CEILING) {
    if (c.unit === unitLower && c.keywords.every((kw) => nameLower.includes(kw))) {
      return c.marketPrice;
    }
  }
  return null;
}

function getMarketPriceForLabor(name: string, unit: string): number | null {
  const nameLower = name.toLowerCase();
  const unitLower = unit.toLowerCase();
  for (const c of LABOR_PRICE_CEILING) {
    if (c.unit === unitLower && c.keywords.every((kw) => nameLower.includes(kw))) {
      return c.marketPrice;
    }
  }
  return null;
}

// ─── Core sanitization logic ──────────────────────────────────────────────────

function sanitizeRow(row: CatalogRow): {
  updates: Partial<CatalogRow>;
  fixes: FixRecord[];
} {
  const updates: Partial<CatalogRow> = {};
  const fixes: FixRecord[] = [];
  const unit = (row.unit ?? "szt").toLowerCase();

  let mat = row.base_material_price;
  let lab = row.base_labor_price;

  // ── Material price ─────────────────────────────────────────
  if (isGarbagePrice(mat)) {
    const market = getMarketPriceForMaterial(row.name, unit) ?? 0;
    fixes.push({ id: row.id, name: row.name, field: "base_material_price", before: mat, after: market, reason: `garbage (< ${GARBAGE_MIN})` });
    mat = market;
  } else if (isAbsurdlyHigh(mat)) {
    const market = getMarketPriceForMaterial(row.name, unit);
    if (market !== null) {
      fixes.push({ id: row.id, name: row.name, field: "base_material_price", before: mat, after: market, reason: `absurdly high (> ${GARBAGE_MAX_ABSOLUTE}) — likely ID stored as price` });
      mat = market;
    }
  } else {
    const clamped = clampPrice(row.name, unit, mat, "material");
    if (clamped !== mat) {
      fixes.push({ id: row.id, name: row.name, field: "base_material_price", before: mat, after: clamped, reason: "above market ceiling" });
      mat = clamped;
    }
  }

  // ── Labor price ────────────────────────────────────────────
  if (isGarbagePrice(lab)) {
    const floor = LABOR_UNIT_FALLBACK[unit] ?? 25;
    fixes.push({ id: row.id, name: row.name, field: "base_labor_price", before: lab, after: floor, reason: `garbage (< ${GARBAGE_MIN})` });
    lab = floor;
  } else if (isAbsurdlyHigh(lab)) {
    const market = getMarketPriceForLabor(row.name, unit) ?? (LABOR_UNIT_FALLBACK[unit] ?? 25);
    fixes.push({ id: row.id, name: row.name, field: "base_labor_price", before: lab, after: market, reason: `absurdly high (> ${GARBAGE_MAX_ABSOLUTE}) — likely ID stored as price` });
    lab = market;
  } else {
    const clamped = clampPrice(row.name, unit, lab, "labor");
    if (clamped !== lab) {
      fixes.push({ id: row.id, name: row.name, field: "base_labor_price", before: lab, after: clamped, reason: "above market ceiling" });
      lab = clamped;
    }
  }

  // ── Labor type with zero labor price ──────────────────────
  if (isLaborType(row.name) && lab === 0 && mat === 0) {
    const floor = LABOR_UNIT_FALLBACK[unit] ?? 25;
    fixes.push({ id: row.id, name: row.name, field: "base_labor_price", before: 0, after: floor, reason: "labor-type item with 0 price — applying floor" });
    lab = floor;
  }

  // ── Both zero (non-labor) ──────────────────────────────────
  if (lab === 0 && mat === 0 && !isLaborType(row.name)) {
    fixes.push({ id: row.id, name: row.name, field: "base_material_price", before: 0, after: null, reason: "both prices = 0 — cannot auto-fix (unknown item type), flagged for manual review" });
  }

  // ── KNR fallback for labor items ──────────────────────────
  if (lab > 0 && !row.knr_code) {
    const knr = lookupKnrForLabor(row.name);
    fixes.push({ id: row.id, name: row.name, field: "knr_code", before: null, after: knr, reason: "labor item without KNR — applying fallback" });
    updates.knr_code = knr;
  }

  // ── Apply updates if values changed ───────────────────────
  if (mat !== row.base_material_price) updates.base_material_price = mat;
  if (lab !== row.base_labor_price) updates.base_labor_price = lab;

  return { updates, fixes };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🔧  ElektroSmart PRO — Catalog Sanitization Script`);
  console.log(`    Mode: ${isDryRun ? "🟡 DRY RUN (no DB writes)" : "🔴 LIVE (will update DB)"}`);
  console.log(`    Supabase: ${SUPABASE_URL}\n`);

  // Fetch all catalog items
  const { data: rows, error: fetchError } = await supabase
    .from("catalog_items")
    .select("id, name, unit, base_material_price, base_labor_price, knr_code, user_id")
    .eq("is_active", true);

  if (fetchError || !rows) {
    console.error("❌  Failed to fetch catalog_items:", fetchError?.message);
    process.exit(1);
  }

  console.log(`📦  Fetched ${rows.length} active catalog items`);

  // ── Sanitize all rows ─────────────────────────────────────
  const allFixes: FixRecord[] = [];
  const toUpdate: Array<{ id: string; updates: Partial<CatalogRow> }> = [];

  for (const row of rows as CatalogRow[]) {
    const { updates, fixes } = sanitizeRow(row);
    allFixes.push(...fixes);
    if (Object.keys(updates).length > 0) {
      toUpdate.push({ id: row.id, updates });
    }
  }

  // ── Report ────────────────────────────────────────────────
  console.log(`\n📋  Fixes found: ${allFixes.length} (${toUpdate.length} rows to update)\n`);

  const manualReview = allFixes.filter((f) => f.after === null);
  const autoFixes = allFixes.filter((f) => f.after !== null);

  if (autoFixes.length > 0) {
    console.log("✅  AUTO-FIXABLE:");
    for (const fix of autoFixes) {
      const before = typeof fix.before === "number" ? fix.before.toFixed(3) : String(fix.before);
      const after = typeof fix.after === "number" ? fix.after.toFixed(2) : String(fix.after);
      console.log(`   [${fix.field}] "${fix.name.substring(0, 45).padEnd(45)}"  ${before.padStart(10)} → ${after.padEnd(10)}  (${fix.reason})`);
    }
  }

  if (manualReview.length > 0) {
    console.log("\n⚠️  MANUAL REVIEW REQUIRED (both prices = 0, unknown type):");
    for (const fix of manualReview) {
      console.log(`   ID: ${fix.id}  "${fix.name}"`);
    }
  }

  if (toUpdate.length === 0) {
    console.log("\n🎉  Database is clean — nothing to update.");
    return;
  }

  if (isDryRun) {
    console.log(`\n🟡  DRY RUN complete — ${toUpdate.length} rows would be updated. Re-run without --dry-run to apply.`);
    return;
  }

  // ── Batch update ──────────────────────────────────────────
  console.log(`\n💾  Applying ${toUpdate.length} updates in batches of ${BATCH_SIZE}...`);
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < toUpdate.length; i += BATCH_SIZE) {
    const batch = toUpdate.slice(i, i + BATCH_SIZE);

    for (const { id, updates } of batch) {
      const { error } = await supabase
        .from("catalog_items")
        .update(updates)
        .eq("id", id);

      if (error) {
        console.error(`   ❌  Failed to update ${id}: ${error.message}`);
        errorCount++;
      } else {
        successCount++;
      }
    }

    const pct = Math.round(((i + batch.length) / toUpdate.length) * 100);
    process.stdout.write(`\r   Progress: ${i + batch.length}/${toUpdate.length} (${pct}%)`);
  }

  console.log(`\n\n✅  Done! Updated: ${successCount}  |  Errors: ${errorCount}`);
}

main().catch((err) => {
  console.error("❌  Unexpected error:", err);
  process.exit(1);
});
