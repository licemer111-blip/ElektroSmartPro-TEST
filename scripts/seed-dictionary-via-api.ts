/**
 * seed-dictionary-via-api.ts
 *
 * Applies es_dictionary seed migrations directly via the Supabase Management API.
 * Bypasses CLI migration tracking — safe to run even when migration history has drift.
 *
 * Requires:
 *   SUPABASE_ACCESS_TOKEN  — personal access token (sbp_...)
 *   NEXT_PUBLIC_SUPABASE_URL — to extract project ref
 *
 * Usage:
 *   npx tsx scripts/seed-dictionary-via-api.ts
 *   npx tsx scripts/seed-dictionary-via-api.ts --dry-run
 */

import { config as dotenvConfig } from "dotenv";
import { resolve, join } from "path";
import { readFileSync, readdirSync } from "fs";

dotenvConfig({ path: resolve(process.cwd(), ".env.local") });

const DRY_RUN = process.argv.includes("--dry-run");

// ─── Config ──────────────────────────────────────────────────────────────────

const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

if (!ACCESS_TOKEN) {
  console.error("❌ SUPABASE_ACCESS_TOKEN not set.");
  console.error('   Run: $env:SUPABASE_ACCESS_TOKEN = "sbp_..."');
  process.exit(1);
}

const PROJECT_REF = SUPABASE_URL.replace(/^https:\/\//, "").split(".")[0];
if (!PROJECT_REF) {
  console.error("❌ Could not extract project ref from NEXT_PUBLIC_SUPABASE_URL");
  process.exit(1);
}

const API_BASE = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;

// ─── SQL execution via Management API ────────────────────────────────────────

async function executeSQL(sql: string, label: string): Promise<boolean> {
  if (DRY_RUN) {
    console.log(`  [DRY-RUN] Would execute: ${label}`);
    return true;
  }

  const res = await fetch(API_BASE, {
    method:  "POST",
    headers: {
      "Authorization": `Bearer ${ACCESS_TOKEN}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });

  if (res.ok) return true;

  const body = await res.text();
  // Some errors are benign (already exists, duplicate key) — treat as OK
  const benign = [
    "already exists",
    "duplicate key",
    "relation already exists",
    "column already exists",
    "policy already exists",
  ];
  if (benign.some(msg => body.toLowerCase().includes(msg.toLowerCase()))) {
    console.log(`  ⚠ ${label}: already applied (skipped)`);
    return true;
  }

  console.error(`  ✗ ${label}: HTTP ${res.status} — ${body.slice(0, 200)}`);
  return false;
}

// ─── Find seed migration files ────────────────────────────────────────────────

function getSeedFiles(): string[] {
  const dir = resolve(process.cwd(), "supabase", "migrations");
  return readdirSync(dir)
    .filter(f => f.endsWith(".sql") && f.includes("seed_es_dictionary"))
    .sort()
    .map(f => join(dir, f));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  ES-Engine — Seed es_dictionary via Management API");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Project ref: ${PROJECT_REF}`);
  console.log(`  Mode:        ${DRY_RUN ? "DRY-RUN" : "LIVE"}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const files = getSeedFiles();
  console.log(`📂 Found ${files.length} seed migration files:\n`);

  let ok = 0;
  let failed = 0;

  for (const filePath of files) {
    const name = filePath.split(/[/\\]/).pop()!;
    process.stdout.write(`  ▶ ${name} … `);

    const sql = readFileSync(filePath, "utf8");
    const success = await executeSQL(sql, name);

    if (success) {
      console.log("✓");
      ok++;
    } else {
      failed++;
    }
  }

  console.log(`\n${"─".repeat(56)}`);
  console.log(`  Applied: ${ok}  Failed: ${failed}`);

  if (failed === 0) {
    console.log("\n✅ All seed migrations applied. Run the embedding generator:");
    console.log("     npx tsx scripts/generate-embeddings.ts\n");
  } else {
    console.log("\n⚠️  Some migrations failed — check errors above.\n");
    process.exit(1);
  }
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
