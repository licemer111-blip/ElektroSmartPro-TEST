/**
 * audit-categories.mjs
 * Выводит список всех категорий es_dictionary с количеством позиций.
 * Показывает "дыры" (категории с малым числом записей) для планирования v20 миграции.
 *
 * Run: node scripts/audit-categories.mjs
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

const TARGET_PER_CATEGORY = 50;

const BAR_WIDTH = 30;
function renderBar(count, max) {
  const filled = Math.round((count / max) * BAR_WIDTH);
  const bar = "█".repeat(filled) + "░".repeat(BAR_WIDTH - filled);
  return bar;
}

function statusLabel(count) {
  if (count === 0) return "🔴 PUSTA";
  if (count < 10) return "🔴 KRYTYCZNA";
  if (count < 30) return "🟠 SŁABA";
  if (count < TARGET_PER_CATEGORY) return "🟡 POTRZEBUJE";
  return "✅ OK";
}

async function auditDatabase(name, url, key) {
  console.log(`\n${"=".repeat(70)}`);
  console.log(`  AUDYT KATEGORII ES-DICTIONARY — ${name}`);
  console.log(`  ${url}`);
  console.log("=".repeat(70));

  const sb = createClient(url, key, { auth: { persistSession: false } });

  const { data, error } = await sb
    .from("es_dictionary")
    .select("category", { count: "exact" });

  if (error) {
    console.error(`[${name}] Błąd pobierania:`, error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log(`[${name}] Baza pusta lub brak dostępu.`);
    return;
  }

  // Count per category
  const counts = {};
  for (const row of data) {
    const cat = row.category ?? "(brak kategorii)";
    counts[cat] = (counts[cat] || 0) + 1;
  }

  // Sort by count ascending (holes first)
  const sorted = Object.entries(counts).sort(([, a], [, b]) => a - b);
  const maxCount = Math.max(...Object.values(counts));
  const totalEntries = data.length;
  const categoryCount = sorted.length;

  // Header
  console.log(`\n  Łącznie: ${totalEntries.toLocaleString("pl-PL")} wpisów w ${categoryCount} kategoriach`);
  console.log(`  Cel: ${TARGET_PER_CATEGORY}+ na kategorię\n`);

  const nameWidth = Math.max(...sorted.map(([cat]) => cat.length), 20);

  console.log(
    `  ${"KATEGORIA".padEnd(nameWidth)}  ${"WPISY".padStart(6)}  ${"STATUS".padEnd(18)}  WYPEŁNIENIE`
  );
  console.log(`  ${"-".repeat(nameWidth + 6 + 18 + BAR_WIDTH + 8)}`);

  // Below target first, then OK
  const belowTarget = sorted.filter(([, c]) => c < TARGET_PER_CATEGORY);
  const aboveTarget = sorted.filter(([, c]) => c >= TARGET_PER_CATEGORY).sort(([, a], [, b]) => b - a);

  for (const [cat, count] of belowTarget) {
    const bar = renderBar(count, Math.max(maxCount, TARGET_PER_CATEGORY));
    const status = statusLabel(count);
    console.log(
      `  ${cat.padEnd(nameWidth)}  ${String(count).padStart(6)}  ${status.padEnd(18)}  ${bar}`
    );
  }

  if (belowTarget.length > 0 && aboveTarget.length > 0) {
    console.log(`  ${"-".repeat(nameWidth + 6 + 18 + BAR_WIDTH + 8)}`);
  }

  for (const [cat, count] of aboveTarget) {
    const bar = renderBar(count, Math.max(maxCount, TARGET_PER_CATEGORY));
    const status = statusLabel(count);
    console.log(
      `  ${cat.padEnd(nameWidth)}  ${String(count).padStart(6)}  ${status.padEnd(18)}  ${bar}`
    );
  }

  // Summary
  console.log(`\n${"─".repeat(70)}`);
  const critical = sorted.filter(([, c]) => c < 10).length;
  const weak = sorted.filter(([, c]) => c >= 10 && c < 30).length;
  const needsWork = sorted.filter(([, c]) => c >= 30 && c < TARGET_PER_CATEGORY).length;
  const ok = sorted.filter(([, c]) => c >= TARGET_PER_CATEGORY).length;

  console.log(`\n  PODSUMOWANIE:`);
  console.log(`    🔴 Krytyczne (0–9):          ${String(critical).padStart(3)} kategorii`);
  console.log(`    🟠 Słabe (10–29):             ${String(weak).padStart(3)} kategorii`);
  console.log(`    🟡 Potrzebują pracy (30–49):  ${String(needsWork).padStart(3)} kategorii`);
  console.log(`    ✅ OK (50+):                  ${String(ok).padStart(3)} kategorii`);
  console.log(`\n  Brakuje wpisów do celu 50+: ~${Math.max(0, categoryCount * TARGET_PER_CATEGORY - totalEntries).toLocaleString("pl-PL")} wpisów`);
  console.log(`  Cele v20: napolnij ${belowTarget.length} kategorii do ${TARGET_PER_CATEGORY}+ wpisów`);
  console.log("");
}

// ── LIVE (z .env.local) ──────────────────────────────────────────────────────
const live = readEnv(resolve(__dirname, "../.env.local"));
if (live.url && live.key) {
  await auditDatabase("LIVE", live.url, live.key);
} else {
  console.warn("[LIVE] Pominięto — brak NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY w .env.local");
}

// ── TEST (opcjonalnie przez env var) ─────────────────────────────────────────
const TEST_URL = "https://upwctgdpuckreoquofiu.supabase.co";
const TEST_KEY = process.env.SUPABASE_SERVICE_KEY || "";
if (TEST_KEY) {
  await auditDatabase("TEST", TEST_URL, TEST_KEY);
} else {
  console.log("[TEST] Pominięto — podaj SUPABASE_SERVICE_KEY=... aby audytować TEST");
}
