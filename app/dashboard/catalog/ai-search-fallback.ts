"use server";

import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { logger } from "@/lib/logger";
import type { CatalogItem } from "./catalog-search-actions";

const MAZOWIECKIE_RATE = 62; // PLN/rbh — reference rate for AI suggestions

// ── All 63 KNR category slugs from es_dictionary ──────────────────────────────
const ALL_CATEGORIES = [
  "aparatura","bezpieczenstwo","dali_awaryjne","dali_bms","demontaz","demontaze",
  "ev_ladowanie","fotowoltaika","gniazda_przemyslowe","gniazda_wylaczniki",
  "heat_tracing","hvac","infrastruktura","infrastruktura_specjalna",
  "instalacje_podstawowe","interkomy","it_siec","kable_silnopradowe",
  "kable_slabopradowe","kablowanie","lan_rack","led_dekoracyjny","maszyny_napedy",
  "ogrod_basen","ogrzewanie","osprzet","oswietlenie","oswietlenie_awaryjne",
  "oswietlenie_drogowe","oswietlenie_montaz","oswietlenie_podstawowe",
  "oswietlenie_przemyslowe","oze_ev_ogrzewanie","pomiary_dokumentacja","ppoz",
  "ppoz_ssp","prace_dodatkowe","prace_ziemne","prad_budowlany","prowadzenie",
  "przygotowanie","przylacza_wlz","pv_ev","remonty_pomiary","retail_sklepy",
  "roboty_ziemne","rozdzielnice","rury_trasy","serwis_awarie","smart_home",
  "ssp","swiatlowody","szafy_sterowania","szynoprzewod_zasilajacy","trafostacje",
  "trasy_przemyslowe","uziem_odgrom","uziemienie","uziemienie_odgromowa",
  "wentylacja_hvac_el","zasilanie_awaryjne","zasilanie_gwar","zestawy",
] as const;

// ── Schema for AI category mapping ────────────────────────────────────────────
const AiCategorySchema = z.object({
  categories: z.array(z.string()).max(3).describe(
    "Up to 3 category slugs from the allowed list that best match the query"
  ),
  explanation: z.string().describe(
    "Brief explanation in Polish of what the query likely means (max 80 chars)"
  ),
});

// ── Log failed search to Supabase ─────────────────────────────────────────────
export async function logFailedSearch(
  query: string,
  userId: string | null,
  resolvedCategories: string[] = []
): Promise<void> {
  try {
    await supabaseAdmin.from("failed_searches").insert({
      query: query.trim().toLowerCase().slice(0, 200),
      user_id: userId,
      ai_resolved: resolvedCategories.length > 0,
      ai_categories: resolvedCategories,
    });
  } catch {
    // Non-critical — never break the search flow
  }
}

// ── Normalize Polish chars for comparison ─────────────────────────────────────
function normPl(s: string): string {
  return s.toLowerCase()
    .replace(/ą/g,"a").replace(/ć/g,"c").replace(/ę/g,"e")
    .replace(/ł/g,"l").replace(/ń/g,"n").replace(/ó/g,"o")
    .replace(/ś/g,"s").replace(/ź/g,"z").replace(/ż/g,"z");
}

// ── Shape es_dictionary rows → CatalogItem[] ──────────────────────────────────
type DictRow = { id: unknown; knr_ref: unknown; label: unknown; unit: unknown; labor_norm_rbh: unknown; category: unknown };

function shapeDictItems(rows: DictRow[]): CatalogItem[] {
  const seen = new Set<string>();
  const result: CatalogItem[] = [];
  for (const row of rows) {
    const key = `${row.knr_ref as string}__${row.label as string}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({
      id: row.id as string,
      name: row.label as string,
      unit: (row.unit as string) ?? "szt",
      base_labor_price: Math.round(Number(row.labor_norm_rbh ?? 0) * MAZOWIECKIE_RATE),
      base_material_price: 0,
      category_id: null,
      category_name: (row.knr_ref as string) ?? (row.category as string),
      user_id: "knr",
      isAiSuggestion: true,
      knr_ref: row.knr_ref as string,
    });
  }
  return result;
}

// ── Direct keyword/label search — exported for parallel use ───────────────────
export async function searchKnrNorms(query: string): Promise<CatalogItem[]> {
  return directDictSearch(query);
}

// ── Context builder for AI prompt injection ────────────────────────────────────
// Returns a formatted string of real KNR norms relevant to the description
export async function searchEsDictionaryContext(description: string): Promise<string> {
  const words = description
    .toLowerCase()
    .replace(/[^a-ząćęłńóśźż\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3)
    .map(normPl)
    .slice(0, 8);

  if (words.length === 0) return "";

  // Build OR filter for all keywords
  const orFilter = words
    .flatMap((w) => [
      `keyword_normalized.ilike.${w}%`,
      `keyword_normalized.ilike.% ${w}%`,
      `label.ilike.${w}%`,
      `label.ilike.% ${w}%`,
    ])
    .join(",");

  const { data } = await supabaseAdmin
    .from("es_dictionary")
    .select("knr_ref, label, unit, labor_norm_rbh, category")
    .or(orFilter)
    .is("user_id", null)
    .not("knr_ref", "is", null)
    .order("confidence_weight", { ascending: false })
    .limit(25);

  if (!data || data.length === 0) return "";

  // Deduplicate by knr_ref
  const seen = new Set<string>();
  const unique = data.filter((r) => {
    const key = `${r.knr_ref}::${r.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const lines = unique.map(
    (r) =>
      `${r.knr_ref} | ${r.label} | ${r.unit} | rbh: ${r.labor_norm_rbh ?? "—"}`
  );

  return `BAZA KNR 2026 — ${unique.length} norm pasujących do opisu:\n${lines.join("\n")}`;
}

async function directDictSearch(query: string): Promise<CatalogItem[]> {
  const q = normPl(query);

  const { data: kwData } = await supabaseAdmin
    .from("es_dictionary")
    .select("id, knr_ref, label, unit, labor_norm_rbh, category")
    .or(`keyword_normalized.ilike.${q}%,keyword_normalized.ilike.% ${q}%`)
    .is("user_id", null)
    .not("knr_ref", "is", null)
    .order("confidence_weight", { ascending: false })
    .limit(100);

  if (kwData && kwData.length > 0) return shapeDictItems(kwData);

  const { data: lblData } = await supabaseAdmin
    .from("es_dictionary")
    .select("id, knr_ref, label, unit, labor_norm_rbh, category")
    .or(`label.ilike.${query}%,label.ilike.% ${query}%`)
    .is("user_id", null)
    .not("knr_ref", "is", null)
    .order("confidence_weight", { ascending: false })
    .limit(100);

  if (lblData && lblData.length > 0) return shapeDictItems(lblData);

  return [];
}

// ── Main fallback (direct search first, AI only as last resort) ────────────────
export async function getAiSearchFallback(
  query: string,
  userId: string | null
): Promise<{ items: CatalogItem[]; explanation: string }> {
  try {
    // Step 1 — Direct es_dictionary search (reliable, no AI)
    const directItems = await directDictSearch(query);
    if (directItems.length > 0) {
      void logFailedSearch(query, userId, []);
      return {
        items: directItems,
        explanation: `Podobne pozycje KNR dla zapytania "${query}"`,
      };
    }

    // Step 2 — AI fallback (only when direct search also returned 0)
    const { object } = await generateObject({
      model: google("gemini-2.0-flash"),
      schema: AiCategorySchema,
      prompt: `Jesteś ekspertem polskiego kosztorysowania elektrycznego KNR 2026.
Użytkownik wpisał: "${query}" — brak wyników w katalogu i słowniku KNR.
Przeanalizuj intencję (żargon, skrót, potoczna nazwa).
Zwróć 1-3 kategorie z listy: ${ALL_CATEGORIES.join(", ")}.
Przykłady: "gniazdko"→["gniazda_wylaczniki"], "lampa"→["oswietlenie"], "uziom"→["uziemienie"]`,
      temperature: 0.1,
    });

    const matched = object.categories.filter((c) =>
      (ALL_CATEGORIES as readonly string[]).includes(c)
    );
    await logFailedSearch(query, userId, matched);
    if (matched.length === 0) return { items: [], explanation: object.explanation };

    const { data, error } = await supabaseAdmin
      .from("es_dictionary")
      .select("id, knr_ref, label, unit, labor_norm_rbh, category")
      .in("category", matched)
      .not("knr_ref", "is", null)
      .is("user_id", null)
      .order("confidence_weight", { ascending: false })
      .limit(60);

    if (error || !data) {
      logger.error("[getAiSearchFallback] query error", { message: error?.message });
      return { items: [], explanation: object.explanation };
    }
    return { items: shapeDictItems(data), explanation: object.explanation };
  } catch (err) {
    logger.error("[getAiSearchFallback] error", {}, err as Error);
    void logFailedSearch(query, userId, []);
    return { items: [], explanation: "" };
  }
}
