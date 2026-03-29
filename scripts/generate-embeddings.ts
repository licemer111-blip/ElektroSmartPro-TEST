/**
 * ES-Engine: Semantic Vector Brain — Embedding Generation Utility
 * ─────────────────────────────────────────────────────────────────
 * Fetches all es_dictionary rows where embedding IS NULL,
 * generates 1536-dim embeddings via OpenAI text-embedding-3-small,
 * and bulk-writes them back to Supabase.
 *
 * Usage:
 *   npx tsx scripts/generate-embeddings.ts
 *   npx tsx scripts/generate-embeddings.ts --dry-run      (log input texts, no API calls)
 *   npx tsx scripts/generate-embeddings.ts --batch-size 50
 *
 * Prerequisites:
 *   npm install openai dotenv   (if not already in package.json)
 *   OPENAI_API_KEY=sk-...           in .env.local
 *   NEXT_PUBLIC_SUPABASE_URL        in .env.local
 *   SUPABASE_ACCESS_TOKEN=sbp_...   in .env.local  (Personal Access Token from
 *                                   https://supabase.com/dashboard/account/tokens)
 *
 * NOTE: Uses Supabase Management API instead of supabase-js so it works even
 * when the project has "Legacy API keys disabled" (no service_role JWT needed).
 *
 * Run the SQL migration first:
 *   supabase/migrations/20260329_semantic_vector_brain.sql
 */

import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";

// Next.js stores secrets in .env.local — load it explicitly before any imports
// that rely on process.env (supabase-js, openai, etc.)
dotenvConfig({ path: resolve(process.cwd(), ".env.local") });

import OpenAI from "openai";

// ─── Config ──────────────────────────────────────────────────────────────────

const BATCH_SIZE     = parseInt(process.argv.find(a => a.startsWith("--batch-size="))?.split("=")[1] ?? "100");
const DRY_RUN        = process.argv.includes("--dry-run");
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2000;
const BATCH_DELAY_MS = 500;   // courtesy delay between OpenAI API calls
const EMBEDDING_MODEL = "text-embedding-3-small" as const;
const EMBEDDING_DIMS  = 1536;

// ─── Types ────────────────────────────────────────────────────────────────────

interface EsDictionaryRow {
  id:                 string;
  keyword:            string;
  keyword_normalized: string;
  knr_ref:            string;
  label:              string | null;
  category:           string | null;
  type:               "material" | "robocizna" | "zestaw";
  embedding:          number[] | null;
}

interface EmbeddingUpdate {
  id:        string;
  embedding: number[];
}

interface RunStats {
  totalFetched:  number;
  totalEmbedded: number;
  totalSkipped:  number;
  totalFailed:   number;
  batchCount:    number;
  durationMs:    number;
}

// ─── Env validation ──────────────────────────────────────────────────────────

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required env var: ${name}`);
  return val;
}

// ─── Management API helper (replaces supabase-js admin client) ──────────────
// Uses the Supabase Management REST API with a personal access token.
// This works regardless of whether the project has "Legacy API keys" disabled.

function getProjectRef(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return url.replace(/^https:\/\//, "").split(".")[0] ?? "";
}

async function mgmtQuery<T = Record<string, unknown>>(
  sql: string,
  accessToken: string,
  projectRef: string,
): Promise<T[]> {
  const url = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;
  const headers = {
    "Authorization": `Bearer ${accessToken}`,
    "Content-Type":  "application/json",
  };

  for (let attempt = 1; attempt <= 5; attempt++) {
    const res = await fetch(url, {
      method:  "POST",
      headers,
      body:    JSON.stringify({ query: sql }),
    });

    if (res.status === 429) {
      if (attempt < 5) {
        const waitMs = 3000 * attempt; // 3s → 6s → 9s → 12s
        await sleep(waitMs);
        continue;
      }
      const body = await res.text();
      throw new Error(`Management API error (HTTP 429): ${body.slice(0, 200)}`);
    }

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Management API error (HTTP ${res.status}): ${body.slice(0, 300)}`);
    }

    return await res.json() as T[];
  }
  throw new Error("mgmtQuery: max retries exceeded");
}

// ─── Embedding input text ────────────────────────────────────────────────────
// Combines keyword_normalized + label + category to give the model rich domain
// context. Examples:
//   "montaz gniazda — Montaż gniazda 230V podtynkowego [instalacje_gniazdkowe]"
//   "lacznik schodowy — Łącznik schodowy podtynkowy [laczniki_wylaczniki]"

function buildEmbeddingText(row: EsDictionaryRow): string {
  const parts: string[] = [row.keyword_normalized];
  if (row.label?.trim())    parts.push(`— ${row.label.trim()}`);
  if (row.category?.trim()) parts.push(`[${row.category.trim()}]`);
  return parts.join(" ");
}

// ─── Retry helper ────────────────────────────────────────────────────────────

async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  attempts = RETRY_ATTEMPTS
): Promise<T> {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isLast = attempt === attempts;
      const msg = err instanceof Error ? err.message : String(err);
      if (isLast) {
        console.error(`  ✗ [${label}] failed after ${attempts} attempts: ${msg}`);
        throw err;
      }
      const delay = RETRY_DELAY_MS * attempt;
      console.warn(`  ⚠ [${label}] attempt ${attempt}/${attempts} failed: ${msg}. Retrying in ${delay}ms…`);
      await sleep(delay);
    }
  }
  throw new Error("unreachable");
}

function sleep(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

// ─── Fetch rows without embeddings ────────────────────────────────────────────

async function fetchUnembeddedRows(
  accessToken: string,
  projectRef: string,
): Promise<EsDictionaryRow[]> {
  const sql = `
    SELECT id, keyword, keyword_normalized, knr_ref, label, category, type
    FROM public.es_dictionary
    WHERE embedding IS NULL
    ORDER BY created_at ASC
    LIMIT 50000
  `;
  return mgmtQuery<EsDictionaryRow>(sql, accessToken, projectRef);
}

// ─── Fetch coverage stats (calls the SQL helper from migration) ───────────────

/**
 * Thrown when fetchCoverageStats detects that the SQL migration has not been
 * applied yet (the es_dictionary_embedding_stats function does not exist).
 */
class MigrationNotAppliedError extends Error {
  constructor() {
    super("MIGRATION_NOT_APPLIED");
    this.name = "MigrationNotAppliedError";
  }
}

async function fetchCoverageStats(
  accessToken: string,
  projectRef: string,
): Promise<{ total_rows: number; embedded_rows: number; missing_rows: number; coverage_pct: number }> {
  type StatsRow = { total_rows: string; embedded_rows: string; missing_rows: string; coverage_pct: string };
  let rows: StatsRow[];
  try {
    rows = await mgmtQuery<StatsRow>(
      "SELECT * FROM public.es_dictionary_embedding_stats()",
      accessToken,
      projectRef,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const isMissing =
      msg.includes("es_dictionary_embedding_stats") ||
      msg.includes("does not exist") ||
      msg.includes("Could not find");
    if (isMissing) throw new MigrationNotAppliedError();
    console.error(`\n⚠️  stats query error: ${msg}`);
    return { total_rows: 0, embedded_rows: 0, missing_rows: 0, coverage_pct: 0 };
  }

  if (!rows[0]) return { total_rows: 0, embedded_rows: 0, missing_rows: 0, coverage_pct: 0 };
  const r = rows[0];
  return {
    total_rows:    Number(r.total_rows),
    embedded_rows: Number(r.embedded_rows),
    missing_rows:  Number(r.missing_rows),
    coverage_pct:  Number(r.coverage_pct),
  };
}

// ─── Call OpenAI Embeddings API ───────────────────────────────────────────────

async function embedBatch(
  openai: OpenAI,
  texts: string[]
): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model:           EMBEDDING_MODEL,
    input:           texts,
    encoding_format: "float",
    dimensions:      EMBEDDING_DIMS,
  });

  // Sort by index to guarantee order matches input array
  type RawEmbedding = { index: number; embedding: number[]; object: string };
  const sorted = (response.data as RawEmbedding[]).sort(
    (a: RawEmbedding, b: RawEmbedding) => a.index - b.index
  );

  if (sorted.length !== texts.length) {
    throw new Error(
      `OpenAI returned ${sorted.length} embeddings for ${texts.length} inputs — count mismatch`
    );
  }

  return sorted.map((e: RawEmbedding) => e.embedding);
}

// ─── Write embeddings back to Supabase ────────────────────────────────────────────
// Sends a single bulk UPDATE ... FROM (VALUES ...) per batch via Management API.
// Example for a batch of N rows:
//   UPDATE es_dictionary AS d
//   SET embedding = v.emb::vector(1536)
//   FROM (VALUES ('uuid1','[f1,...]'), ..., ('uuidN','[f1,...]')) AS v(id, emb)
//   WHERE d.id = v.id::uuid
// = 1 Management API call per batch (vs N individual calls) → no 429 rate limiting.

async function persistEmbeddings(
  accessToken: string,
  projectRef: string,
  updates: EmbeddingUpdate[],
): Promise<{ succeeded: number; failed: number }> {
  if (updates.length === 0) return { succeeded: 0, failed: 0 };

  // Build VALUES list: ('uuid', '[f1,f2,...,f1536]'), ...
  const valuesList = updates
    .map(({ id, embedding }) => `('${id}','[${embedding.join(",")}]')`)
    .join(",\n  ");

  const sql = `
    UPDATE public.es_dictionary AS d
    SET embedding = v.emb::vector(1536)
    FROM (VALUES
      ${valuesList}
    ) AS v(id, emb)
    WHERE d.id = v.id::uuid
  `;

  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      await mgmtQuery(sql, accessToken, projectRef);
      return { succeeded: updates.length, failed: 0 };
    } catch (err) {
      const msg  = err instanceof Error ? err.message : String(err);
      const is429 = msg.includes("429") || msg.toLowerCase().includes("too many");
      if (is429 && attempt < 4) {
        await sleep(2000 * attempt); // 2s → 4s → 6s
        continue;
      }
      console.error(`    ✗ Bulk update failed (attempt ${attempt}): ${msg.slice(0, 200)}`);
      return { succeeded: 0, failed: updates.length };
    }
  }
  return { succeeded: 0, failed: updates.length };
}

// ─── Chunk helper ────────────────────────────────────────────────────────────

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

// ─── Main ─────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const startMs = Date.now();

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  ES-Engine Semantic Vector Brain — Embedding Generator");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Model:      ${EMBEDDING_MODEL} (${EMBEDDING_DIMS} dims)`);
  console.log(`  Batch size: ${BATCH_SIZE}`);
  console.log(`  Mode:       ${DRY_RUN ? "DRY-RUN (no API calls)" : "LIVE"}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const accessToken = requireEnv("SUPABASE_ACCESS_TOKEN");
  const projectRef  = getProjectRef();
  const openai      = new OpenAI({ apiKey: requireEnv("OPENAI_API_KEY") });

  // ── Pre-run stats ───────────────────────────────────────────────────────────
  let before: { total_rows: number; embedded_rows: number; missing_rows: number; coverage_pct: number };
  try {
    before = await fetchCoverageStats(accessToken, projectRef);
  } catch (err) {
    if (err instanceof MigrationNotAppliedError) {
      const ref          = getProjectRef();
      const dashboardUrl = `https://supabase.com/dashboard/project/${ref}/sql/new`;
      console.error("\n❌ SQL migration has not been applied to the database.\n");
      console.error("   The following objects are missing:");
      console.error("     • es_dictionary.embedding column (vector(1536))");
      console.error("     • HNSW index on es_dictionary.embedding");
      console.error("     • match_dictionary_semantic() RPC function");
      console.error("     • es_dictionary_embedding_stats() RPC function\n");
      console.error("   ─────────────────────────────────────────────────────");
      console.error("   Apply the migration in 3 steps:\n");
      console.error(`   1. Open: ${dashboardUrl}`);
      console.error("   2. Paste the contents of:");
      console.error("        supabase/migrations/20260329_semantic_vector_brain.sql");
      console.error("   3. Click ▶ Run — then re-run this script.\n");
      process.exit(1);
    }
    throw err;
  }

  console.log(`📊 Coverage before run:`);
  console.log(`   Total rows:    ${before.total_rows}`);
  console.log(`   Embedded:      ${before.embedded_rows} (${before.coverage_pct}%)`);
  console.log(`   Missing:       ${before.missing_rows}\n`);

  if (before.missing_rows === 0) {
    if (before.total_rows === 0) {
      console.warn("⚠️  es_dictionary is empty — seed the table first, then re-run.");
    } else {
      console.log("✅ All rows already have embeddings. Nothing to do.");
    }
    return;
  }

  // ── Fetch unembedded rows ───────────────────────────────────────────────────
  console.log("🔍 Fetching rows with embedding IS NULL…");
  const rows = await fetchUnembeddedRows(accessToken, projectRef);
  console.log(`   Fetched ${rows.length} rows to embed.\n`);

  // ── Build batches ───────────────────────────────────────────────────────────
  const batches = chunk(rows, BATCH_SIZE);

  const stats: RunStats = {
    totalFetched:  rows.length,
    totalEmbedded: 0,
    totalSkipped:  0,
    totalFailed:   0,
    batchCount:    batches.length,
    durationMs:    0,
  };

  // ── Process each batch ──────────────────────────────────────────────────────
  for (let bIdx = 0; bIdx < batches.length; bIdx++) {
    const batch   = batches[bIdx];
    const bLabel  = `Batch ${bIdx + 1}/${batches.length} (${batch.length} rows)`;
    console.log(`⚙️  ${bLabel}`);

    // Build embedding input texts
    const texts = batch.map(buildEmbeddingText);

    if (DRY_RUN) {
      console.log("   [DRY-RUN] Sample inputs:");
      texts.slice(0, 3).forEach((t, i) => console.log(`     [${i}] "${t}"`));
      stats.totalSkipped += batch.length;
      continue;
    }

    // Call OpenAI with retry
    let embeddings: number[][];
    try {
      embeddings = await withRetry(
        () => embedBatch(openai, texts),
        bLabel
      );
    } catch {
      console.error(`   ✗ Skipping ${bLabel} after all retries exhausted.`);
      stats.totalFailed += batch.length;
      continue;
    }

    // Build update payload
    const updates: EmbeddingUpdate[] = batch.map((row, i) => ({
      id:        row.id,
      embedding: embeddings[i],
    }));

    // Persist to Supabase
    const { succeeded, failed } = await persistEmbeddings(accessToken, projectRef, updates);
    stats.totalEmbedded += succeeded;
    stats.totalFailed   += failed;

    console.log(`   ✓ ${succeeded}/${batch.length} rows updated${failed > 0 ? `, ${failed} failed` : ""}`);

    // Courtesy delay between batches to avoid OpenAI rate limits
    if (bIdx < batches.length - 1) await sleep(BATCH_DELAY_MS);
  }

  // ── Post-run stats ──────────────────────────────────────────────────────────
  stats.durationMs = Date.now() - startMs;
  const after = await fetchCoverageStats(accessToken, projectRef);

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Run Complete");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Fetched:   ${stats.totalFetched}`);
  console.log(`  Embedded:  ${stats.totalEmbedded}`);
  console.log(`  Skipped:   ${stats.totalSkipped} (dry-run)`);
  console.log(`  Failed:    ${stats.totalFailed}`);
  console.log(`  Batches:   ${stats.batchCount}`);
  console.log(`  Duration:  ${(stats.durationMs / 1000).toFixed(1)}s`);
  if (!DRY_RUN) {
    console.log(`\n📊 Coverage after run:`);
    console.log(`   Embedded:  ${after.embedded_rows}/${after.total_rows} (${after.coverage_pct}%)`);
    console.log(`   Missing:   ${after.missing_rows}`);
  }
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  if (stats.totalFailed > 0) {
    console.error(`⚠️  ${stats.totalFailed} rows failed. Re-run the script to retry (they remain embedding IS NULL).`);
    process.exit(1);
  }

  console.log("✅ All embeddings generated successfully.");
}

main().catch(err => {
  console.error("Fatal error:", err instanceof Error ? err.message : err);
  process.exit(1);
});
