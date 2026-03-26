/**
 * apply-max-projects-3.mjs
 * Updates max_projects = 3 for all free tier users on TEST + LIVE.
 * Run: node scripts/apply-max-projects-3.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function readEnv(envPath) {
  const out = { url: "", key: "" };
  try {
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const [k, ...rest] = line.split("=");
      const v = rest.join("=").trim().replace(/^["']|["']$/g, "");
      if (k?.trim() === "NEXT_PUBLIC_SUPABASE_URL") out.url = v;
      if (k?.trim() === "SUPABASE_SERVICE_ROLE_KEY") out.key = v;
    }
  } catch { /* skip */ }
  return out;
}

async function applyMigration(name, url, key) {
  const sb = createClient(url, key, { auth: { persistSession: false } });

  // 2. Update all existing free tier users to max_projects = 3
  const { data: freeUpdated, error: e1 } = await sb
    .from("profiles")
    .update({ max_projects: 3 })
    .eq("is_pro", false)
    .select("id", { count: "exact" });
  if (e1) { console.error(`[${name}] free update error:`, e1.message); return; }

  // 3. Ensure PRO users have 999
  const { data: proUpdated, error: e2 } = await sb
    .from("profiles")
    .update({ max_projects: 999 })
    .eq("is_pro", true)
    .lt("max_projects", 999)
    .select("id", { count: "exact" });
  if (e2) { console.error(`[${name}] PRO update error:`, e2.message); return; }

  const freeCount = freeUpdated?.length ?? 0;
  const proCount = proUpdated?.length ?? 0;
  console.log(`[${name}] ✅ free users updated: ${freeCount}, PRO fixed: ${proCount}`);

  // Verify
  const { data: verify } = await sb
    .from("profiles")
    .select("is_pro, max_projects")
    .order("is_pro");

  const summary = {};
  for (const row of verify ?? []) {
    const label = `is_pro=${row.is_pro} max_projects=${row.max_projects}`;
    summary[label] = (summary[label] || 0) + 1;
  }
  for (const [label, count] of Object.entries(summary)) {
    console.log(`  ${label}  → ${count} users`);
  }
}

// LIVE
const live = readEnv(resolve(__dirname, "../.env.local"));
if (live.url && live.key) {
  console.log(`\nApplying to LIVE: ${live.url}`);
  await applyMigration("LIVE", live.url, live.key);
}

// TEST
const TEST_URL = "https://upwctgdpuckreoquofiu.supabase.co";
const TEST_KEY = process.env.SUPABASE_SERVICE_KEY || "";
if (TEST_KEY) {
  console.log(`\nApplying to TEST: ${TEST_URL}`);
  await applyMigration("TEST", TEST_URL, TEST_KEY);
} else {
  console.log("\n[TEST] Skipped — provide SUPABASE_SERVICE_KEY env var");
}

console.log("\nDone. NOTE: ALTER COLUMN SET DEFAULT 3 must be applied manually via Supabase SQL editor.");
