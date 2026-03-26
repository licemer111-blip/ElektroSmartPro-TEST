/**
 * KB Storage — RAG Loader
 *
 * Fetches JSON knowledge base files from Supabase Storage bucket `ai-knowledge-base`.
 * This is the "Water" in the Pipe/Water/Filter RAG architecture.
 *
 * TypeScript (Pipe) → Supabase Storage JSON (Water) → Gemini 2.0 Flash (Filter)
 *
 * Usage:
 *   const context = await fetchKbContext(["es_knr_rozdzielnice_aparatura.json"]);
 *   // inject `context` as a system message into Gemini
 */

import { supabaseAdmin } from "@/lib/supabase-admin";
import fs from "fs";
import path from "path";

const BUCKET = "ai-knowledge-base";
const LOCAL_FALLBACK_DIR = path.join(process.cwd(), "data", "knr");

// In-memory cache: fileName → { content, fetchedAt }
// Avoids re-fetching on every request within the same server process lifetime.
const memCache = new Map<string, { content: string; fetchedAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Detect the type of a KB file by extension.
 * Returns 'json' | 'csv' | 'excel' | 'pdf' | 'txt' | 'unknown'.
 */
function detectFileType(fileName: string): "json" | "csv" | "excel" | "pdf" | "txt" | "unknown" {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".json")) return "json";
  if (lower.endsWith(".csv")) return "csv";
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) return "excel";
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".txt")) return "txt";
  return "unknown";
}

/**
 * Parse raw text content based on file type.
 * JSON: fully parsed and cleaned.
 * CSV/TXT: returned as-is (plain text, ready for Gemini).
 * XLSX/XLS/PDF: not yet parseable server-side — returns a placeholder note.
 * This prevents crashes when non-JSON files exist in the bucket.
 */
function parseFileContent(fileName: string, raw: string): string {
  const type = detectFileType(fileName);
  switch (type) {
    case "json": {
      try {
        const parsed = JSON.parse(raw);
        return JSON.stringify(parsed, (key, value) => {
          // Strip internal metadata keys — never expose to AI
          if (key === "_todo" || key === "_comment" || key === "_meta") return undefined;
          // Strip labor price metadata — NEVER used by AI for calculations.
          // The system rate hierarchy (user profile → admin global) is the only source of truth.
          // See: getEffectiveRate() in lib/global-benchmarks.ts
          if (key === "labor_price_pln_rbh" || key === "labor_price_note") return undefined;
          return value;
        });
      } catch {
        return raw; // malformed JSON — pass raw, let Gemini handle it
      }
    }
    case "csv":
    case "txt":
      return raw; // plain text — inject directly
    case "excel":
      // Binary format — cannot parse as text server-side yet.
      // Return a note so Gemini knows the file exists but content is pending.
      return `[PLIK EXCEL: ${fileName} — parsowanie XLSX/XLS zostanie zaimplementowane wkrótce. Plik istnieje w buckecie.]`;
    case "pdf":
      // Binary format — PDF parsing requires a dedicated library.
      return `[PLIK PDF: ${fileName} — parsowanie PDF zostanie zaimplementowane wkrótce. Plik istnieje w buckecie.]`;
    default:
      return raw;
  }
}

/**
 * Download a single file from Supabase Storage.
 * Falls back to local `data/knr/` if bucket is unavailable (dev mode).
 * Gracefully handles JSON, CSV, TXT. Skips binary formats (XLSX, PDF) with a placeholder.
 */
async function fetchFileContent(fileName: string): Promise<string> {
  // 1. Check in-memory cache
  const cached = memCache.get(fileName);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.content;
  }

  // 2. Try Supabase Storage (primary source)
  try {
    const { data, error } = await supabaseAdmin.storage.from(BUCKET).download(fileName);
    if (!error && data) {
      const raw = await data.text();
      const content = parseFileContent(fileName, raw);
      memCache.set(fileName, { content, fetchedAt: Date.now() });
      return content;
    }
  } catch {
    // fall through to local fallback
  }

  // 3. Local fallback (dev / CI) — JSON only
  try {
    const localPath = path.join(LOCAL_FALLBACK_DIR, fileName);
    if (fs.existsSync(localPath)) {
      const raw = fs.readFileSync(localPath, "utf-8");
      const content = parseFileContent(fileName, raw);
      memCache.set(fileName, { content, fetchedAt: Date.now() });
      return content;
    }
  } catch {
    // no local file either
  }

  return "";
}

/**
 * Fetch one or more KB files and return a combined context string
 * ready to be injected as a Gemini system message.
 *
 * @param fileNames - list of .json file names in the bucket
 * @param label     - label shown in the XML tag (default: "knr_knowledge_base")
 */
export async function fetchKbContext(
  fileNames: string[],
  label = "knr_knowledge_base"
): Promise<string> {
  const results = await Promise.all(fileNames.map(fetchFileContent));
  const combined = results.filter(Boolean).join("\n\n");
  if (!combined) return "";

  return `<${label}>
Poniżej znajduje się baza wiedzy eksperckiej ElektroSmart PRO.
Zawiera normy robocizny KNR 5-08, wskazówki eksperckie oraz typowe konfiguracje rozdzielnic.

INSTRUKCJA DLA GEMINI:
- Jesteś AI ElektroSmart. Twoje absolutne źródło prawdy dla NORM ROBOCIZNY (norma_rg) i zestawów materiałowych (zestaw_domyslny) to poniższe pliki JSON.
- NIGDY nie wymyślaj czasów robocizny. Zawsze oddzielaj Robociznę i Materiały.
- Przy każdej wartości z KB cytuj źródło w nawiasie, np. (KNR 5-08 0201).
- Jeśli KB nie zawiera danej wartości — zaznacz: "(szacunek — zweryfikuj z cennikiem)".

⚠️ ŻELAZNA ZASADA — STAWKA ROBOCIZNY (IRON RULE):
- NIGDY nie używaj żadnej stałej stawki PLN/rbh z pliku JSON.
- Jedyne źródło stawki to system: P1 = stawka użytkownika z profilu, P2 = globalna stawka admina.
- Twoja rola: odczytaj wyłącznie pole 'norma_rg' (rbh/jednostkę) z JSON, a przeliczenie na PLN wykona system.
- Formuła: cena_robocizny = norma_rg × stawka_systemowa (nigdy norma_rg × jakakolwiek wartość z JSON).

DANE KB:
${combined}
</${label}>`;
}

/**
 * Invalidate the in-memory cache for a specific file (or all files).
 * Call this after uploading a new version of a KB file.
 */
export function invalidateKbCache(fileName?: string): void {
  if (fileName) {
    memCache.delete(fileName);
  } else {
    memCache.clear();
  }
}

/**
 * List all active KB file names uploaded by a specific user.
 * Reads from knowledge_base_meta WHERE user_id = userId AND state = 'ACTIVE'.
 */
export async function listUserKbFileNames(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("knowledge_base_meta")
      .select("file_name")
      .eq("user_id", userId)
      .eq("state", "ACTIVE");
    if (error || !data) return [];
    return data.map((r: { file_name: string }) => r.file_name).filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Fetch user-uploaded KB files and return combined context string.
 * Merges with global KB if globalContext provided.
 * User files are labelled "user_knowledge_base" — highest priority for AI.
 */
export async function fetchUserKbContext(userId: string): Promise<string | null> {
  try {
    const fileNames = await Promise.race([
      listUserKbFileNames(userId),
      new Promise<string[]>((resolve) => setTimeout(() => resolve([]), 4000)),
    ]);
    if (!fileNames || fileNames.length === 0) return null;

    const results = await Promise.all(fileNames.map(fetchFileContent));
    const combined = results.filter(Boolean).join("\n\n");
    if (!combined) return null;

    return `<user_knowledge_base>
PRYWATNA BAZA WIEDZY UŻYTKOWNIKA — NAJWYŻSZY PRIORYTET:
Te dane mają pierwszeństwo przed globalną bazą KNR i wiedzą ogólną.
Zawiera własne cenniki, stawki, normy i dokumenty przesłane przez użytkownika.

INSTRUKCJA: Jeśli w tej bazie jest cena lub norma dla danej pozycji — użyj jej.
Cytuj źródło: "(cennik użytkownika)".

DANE:
${combined}
</user_knowledge_base>`;
  } catch {
    return null;
  }
}

/**
 * List all .json files currently available in the bucket.
 * Returns file names only (no content).
 */
export async function listKbFileNames(): Promise<string[]> {
  try {
    const { data, error } = await supabaseAdmin.storage.from(BUCKET).list("", {
      limit: 100,
      sortBy: { column: "name", order: "asc" },
    });
    if (error || !data) return [];
    const SUPPORTED_EXTS = [".json", ".csv", ".txt", ".xlsx", ".xls", ".pdf"];
    return data
      .filter((f) => f.name !== ".emptyFolderPlaceholder" && SUPPORTED_EXTS.some((ext) => f.name.toLowerCase().endsWith(ext)))
      .map((f) => f.name);
  } catch {
    return [];
  }
}
