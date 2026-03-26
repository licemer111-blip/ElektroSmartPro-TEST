/**
 * seed-knr-norms.ts
 *
 * One-shot seed script — reads all fixed_norms/*.json and upserts into knr_norms.
 * Run:  npx ts-node --project tsconfig.json -e "require('./scripts/seed-knr-norms.ts')"
 * OR:   npx tsx scripts/seed-knr-norms.ts
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const NORMS_DIR = path.resolve(__dirname, "../data/knr/fixed_norms");
const BATCH_SIZE = 50;
const VALID_CATALOG_PREFIXES = ["KNR ", "ES-KNR-"];

interface RawNorm {
  catalog_code: string;
  section?: string;
  table_number: string;
  column_number: string;
  description: string;
  unit?: string;
  labor_norm: number;
  labor_norm_min?: number;
  labor_norm_max?: number;
  knr_category?: string;
  is_industrial?: boolean;
  source_edition?: string;
  synonyms?: string[];
}

function isValidCatalog(code: string): boolean {
  return VALID_CATALOG_PREFIXES.some((p) =>
    code.toUpperCase().startsWith(p.toUpperCase())
  );
}

async function main() {
  if (!fs.existsSync(NORMS_DIR)) {
    console.error(`❌  Directory not found: ${NORMS_DIR}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(NORMS_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort();

  console.log(`\n🔍  Found ${files.length} JSON files in fixed_norms/\n`);

  let totalInserted = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;
  const allErrors: string[] = [];

  for (const file of files) {
    const filePath = path.join(NORMS_DIR, file);
    let norms: RawNorm[];

    try {
      const raw = fs.readFileSync(filePath, "utf8");
      norms = JSON.parse(raw);
      if (!Array.isArray(norms)) { console.warn(`  ⚠️  ${file}: not an array — skipped`); continue; }
    } catch (e) {
      console.error(`  ❌  ${file}: JSON parse error — ${e}`);
      allErrors.push(`${file}: JSON parse error`);
      continue;
    }

    const rows = norms
      .filter((n, idx) => {
        if (!n.catalog_code || !isValidCatalog(n.catalog_code)) {
          totalSkipped++;
          allErrors.push(`${file}[${idx}]: invalid catalog_code "${n.catalog_code}"`);
          return false;
        }
        if (!n.table_number || !n.column_number || !n.description) {
          totalSkipped++;
          return false;
        }
        return true;
      })
      .map((n) => ({
        catalog_code: n.catalog_code.trim(),
        section: (n.section ?? "").trim(),
        table_number: String(n.table_number).trim(),
        column_number: String(n.column_number).trim(),
        description: n.description.trim(),
        unit: (n.unit ?? "szt").trim(),
        labor_norm: Number(n.labor_norm) || 0,
        labor_norm_min: n.labor_norm_min ?? null,
        labor_norm_max: n.labor_norm_max ?? null,
        knr_category: n.knr_category ?? null,
        is_industrial: n.is_industrial ?? false,
        source_edition: n.source_edition ?? file.replace(".json", ""),
        synonyms: n.synonyms ?? [],
        is_active: true,
        is_verified: false,
      }));

    if (rows.length === 0) {
      console.log(`  ⏭️   ${file}: 0 valid rows`);
      continue;
    }

    // Upsert in batches
    let fileInserted = 0;
    let fileUpdated = 0;

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const { error, count } = await supabase
        .from("knr_norms")
        .upsert(batch, {
          onConflict: "catalog_code,table_number,column_number",
          ignoreDuplicates: false,
          count: "exact",
        });

      if (error) {
        allErrors.push(`${file} batch ${i / BATCH_SIZE + 1}: ${error.message}`);
        console.error(`  ❌  ${file} batch ${i / BATCH_SIZE + 1}: ${error.message}`);
      } else {
        const affected = count ?? batch.length;
        fileInserted += affected;
        totalInserted += affected;
      }
    }

    console.log(`  ✅  ${file}: ${rows.length} rows → inserted/updated: ${fileInserted}`);
    totalUpdated += fileUpdated;
  }

  console.log(`
═══════════════════════════════════════
✅  Seed complete
   Files processed : ${files.length}
   Total upserted  : ${totalInserted}
   Skipped/invalid : ${totalSkipped}
   Errors          : ${allErrors.length}
═══════════════════════════════════════`);

  if (allErrors.length > 0) {
    console.log("\n⚠️  Errors:");
    allErrors.forEach((e) => console.log(`   • ${e}`));
  }

  // Final count
  const { count } = await supabase
    .from("knr_norms")
    .select("*", { count: "exact", head: true });
  console.log(`\n📊  knr_norms total records now: ${count}`);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
