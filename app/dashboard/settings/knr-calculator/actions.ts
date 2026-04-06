"use server";

import { revalidatePath } from "next/cache";
import { tryAuth } from "@/lib/auth";
import { normalizeKnrCode, looksLikeKnrCode } from "@/lib/services/pricing-config";
import { matchItem, type EngineSettings } from "@/lib/services/matching-engine";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { bulkRecalculateLaborPrices } from "@/app/dashboard/catalog/bulk-recalculate-labor";

export async function saveInvestmentContext(
  context: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { user, supabase } = await tryAuth();
    if (!user || !supabase) return { error: "Musisz być zalogowany" };

    const { error } = await supabase
      .from("profiles")
      .update({ investment_context: context.trim().slice(0, 500) || null })
      .eq("id", user.id);

    if (error) return { error: "Błąd zapisu kontekstu" };
    revalidatePath("/dashboard/settings/knr-calculator");
    return { success: true };
  } catch {
    return { error: "Błąd systemu" };
  }
}

export async function getGlobalHourlyRate(): Promise<{ rate: number; materialMultiplier: number; materialMargin: number; isDefault?: boolean; error?: string }> {
  try {
    const { user, supabase } = await tryAuth();
    if (!user || !supabase) return { rate: 0, materialMultiplier: 1.08, materialMargin: 15, isDefault: true };
    const { data } = await supabase
      .from("profiles")
      .select("hourly_rate, material_multiplier, material_margin")
      .eq("id", user.id)
      .single();
    return {
      rate: data?.hourly_rate ?? 0,
      materialMultiplier: data?.material_multiplier ?? 1.08,
      materialMargin: data?.material_margin ?? 15,
      isDefault: data?.hourly_rate == null,
    };
  } catch {
    return { rate: 0, materialMultiplier: 1.08, materialMargin: 15, isDefault: true };
  }
}

export async function updateGlobalHourlyRate(
  rate: number
): Promise<{ success: boolean; error?: string; recalculated?: { catalog: number; assemblies: number } }> {
  try {
    const { user, supabase } = await tryAuth();
    if (!user || !supabase) return { success: false, error: "Nie jesteś zalogowany" };
    if (rate < 1 || rate > 9999) return { success: false, error: "Stawka musi być między 1 a 9999 PLN" };

    // Fetch old rate before update — needed for back-calculating norms on catalog items without stored labor_norm_rbh
    const { data: oldProfile } = await supabase
      .from("profiles")
      .select("hourly_rate")
      .eq("id", user.id)
      .single();
    const oldRate = (oldProfile as { hourly_rate?: number | null } | null)?.hourly_rate ?? 0;

    const { error } = await supabase
      .from("profiles")
      .update({ hourly_rate: rate, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (error) return { success: false, error: error.message };

    // Propagate new rate to ALL user projects — global rate change is a user intent to update everything.
    // Per-project overrides can still be set individually in project settings.
    await supabase
      .from("projects")
      .update({ default_hourly_rate: rate })
      .eq("user_id", user.id);

    // Auto-recalculate all user catalog items + assembly items.
    // oldRate enables back-calculation of norms for items without stored labor_norm_rbh.
    const recalc = await bulkRecalculateLaborPrices(rate, oldRate > 0 ? oldRate : undefined);

    revalidatePath("/dashboard/settings/knr-calculator");
    revalidatePath("/dashboard/projects", "layout");
    return {
      success: true,
      recalculated: { catalog: recalc.catalogUpdated, assemblies: recalc.assembliesUpdated },
    };
  } catch {
    return { success: false, error: "Błąd zapisu stawki" };
  }
}


export async function updateMaterialMultiplier(
  multiplier: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const { user, supabase } = await tryAuth();
    if (!user || !supabase) return { success: false, error: "Nie jesteś zalogowany" };
    if (multiplier < 0.5 || multiplier > 3.0) return { success: false, error: "Mnożnik musi być między 0.5 a 3.0" };

    const { error } = await supabase
      .from("profiles")
      .update({ material_multiplier: multiplier, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard/settings/knr-calculator");
    return { success: true };
  } catch {
    return { success: false, error: "Błąd zapisu mnożnika materiałów" };
  }
}

export async function updateMaterialMargin(
  marginPct: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const { user, supabase } = await tryAuth();
    if (!user || !supabase) return { success: false, error: "Nie jesteś zalogowany" };
    if (marginPct < 0 || marginPct > 100) return { success: false, error: "Marża musi być między 0% a 100%" };

    const { error } = await supabase
      .from("profiles")
      .update({ material_margin: marginPct, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard/settings/knr-calculator");
    return { success: true };
  } catch {
    return { success: false, error: "Błąd zapisu marży materiałów" };
  }
}

export async function updateExpertMode(
  useCustomRates: boolean,
  customLaborRate: number | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const { user, supabase } = await tryAuth();
    if (!user || !supabase) return { success: false, error: "Nie jesteś zalogowany" };

    const { error } = await supabase
      .from("profiles")
      .update({
        use_custom_rates: useCustomRates,
        custom_labor_rate: useCustomRates ? customLaborRate : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) return { success: false, error: error.message };

    revalidatePath("/dashboard/settings/knr-calculator");
    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch {
    return { success: false, error: "Błąd zapisu trybu eksperckiego" };
  }
}

export async function updateCoefficients(
  height: boolean,
  difficulty: boolean,
  surface: boolean,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { user, supabase } = await tryAuth();
    if (!user || !supabase) return { success: false, error: "Nie jesteś zalogowany" };

    const { error } = await supabase
      .from("profiles")
      .update({
        coeff_height: height,
        coeff_difficulty: difficulty,
        coeff_surface: surface,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard/settings/knr-calculator");
    return { success: true };
  } catch {
    return { success: false, error: "Błąd zapisu współczynników" };
  }
}

export async function searchKnrNorm(
  query: string,
  hourlyRate: number,
  sensitivity: EngineSettings["sensitivity"] = "optymalna",
  defaultMontage: EngineSettings["defaultMontage"] = "bez_wyboru",
  investmentContext = "",
): Promise<{
  success: boolean;
  results: Array<{
    name: string;
    norm: number;
    unit: string;
    source: "KNR" | "User" | "AI";
    knrCode?: string;
    laborCost: number;
    confidence: "high" | "medium" | "low";
  }>;
  error?: string;
}> {
  try {
    const { user, supabase } = await tryAuth();
    if (!user || !supabase) return { success: false, results: [], error: "Brak autoryzacji" };

    if (!query.trim() || query.trim().length < 2) {
      return { success: false, results: [], error: "Wpisz co najmniej 2 znaki" };
    }

    // Normalize KNR code if query looks like a code (e.g. "5-08 0401/03" → "5-08 0401-03")
    const normalizedQuery = looksLikeKnrCode(query) ? normalizeKnrCode(query) : query.trim();
    const safeRate = hourlyRate > 0 ? hourlyRate : 100;

    const results: Array<{
      name: string;
      norm: number;
      unit: string;
      source: "KNR" | "User" | "AI";
      knrCode?: string;
      laborCost: number;
      confidence: "high" | "medium" | "low";
    }> = [];

    // ── PRIMARY: ES-Engine 4-phase dictionary lookup ──────────────────────────
    const engineSettings: EngineSettings = {
      sensitivity,
      defaultMontage,
      autoLearning: true,
      investmentContext: investmentContext.trim() || undefined,
    };

    const match = await matchItem(normalizedQuery, supabase, engineSettings);

    if (match.match_method !== "no_match" && match.labor_norm_rbh != null) {
      const norm = match.labor_norm_rbh;
      const isUserEntry = match.matched_keyword != null && match.confidence_level === "L1";
      results.push({
        name: match.label ?? query,
        norm,
        unit: match.unit,
        source: isUserEntry ? "User" : "KNR",
        knrCode: match.knr_ref ?? undefined,
        laborCost: parseFloat((norm * safeRate).toFixed(2)),
        confidence: match.confidence_level === "L1" ? "high" : match.confidence_level === "L2" ? "medium" : "low",
      });
    }

    // ── SECONDARY: catalog_items enrichment (labor_norm_rbh column) ───────────
    const { data: catalogItems } = await supabase
      .from("catalog_items")
      .select("id, name, unit, labor_norm_rbh, base_labor_price, sub_category, knr_code")
      .or(`user_id.is.null,user_id.eq.${user.id}`)
      .ilike("name", `%${normalizedQuery}%`)
      .not("labor_norm_rbh", "is", null)
      .gt("labor_norm_rbh", 0)
      .limit(3);

    if (catalogItems && catalogItems.length > 0) {
      for (const item of catalogItems) {
        const norm = (item.labor_norm_rbh as number) ?? 0;
        if (norm <= 0) continue;
        // Avoid duplicates: skip if same KNR code already present
        const rawKnrCode = (item.knr_code as string | null) ?? (item.sub_category ? `KNR ${item.sub_category}` : undefined);
        const knrCode = rawKnrCode ? normalizeKnrCode(rawKnrCode) : undefined;
        const alreadyPresent = results.some((r) => r.knrCode && knrCode && r.knrCode === knrCode);
        if (!alreadyPresent) {
          results.push({
            name: item.name as string,
            norm: parseFloat(norm.toFixed(3)),
            unit: item.unit as string,
            source: "KNR",
            knrCode,
            laborCost: parseFloat((norm * safeRate).toFixed(2)),
            confidence: "high",
          });
        }
      }
    }

    // ── FALLBACK: AI estimation when nothing found ────────────────────────────
    if (results.length === 0) {
      const NORM_ESTIMATES: Record<string, { norm: number; unit: string }> = {
        gniazdo: { norm: 0.5, unit: "szt" },
        kontakt: { norm: 0.5, unit: "szt" },
        łącznik: { norm: 0.4, unit: "szt" },
        wyłącznik: { norm: 0.4, unit: "szt" },
        puszka: { norm: 0.25, unit: "szt" },
        przewód: { norm: 0.08, unit: "mb" },
        kabel: { norm: 0.1, unit: "mb" },
        oprawa: { norm: 0.75, unit: "szt" },
        lampa: { norm: 0.75, unit: "szt" },
        rozdzielnica: { norm: 8.0, unit: "szt" },
        tablica: { norm: 8.0, unit: "szt" },
        rcd: { norm: 0.35, unit: "szt" },
        różnicówka: { norm: 0.35, unit: "szt" },
        bruzda: { norm: 0.15, unit: "mb" },
        kucie: { norm: 0.15, unit: "mb" },
        tynk: { norm: 0.05, unit: "mb" },
        rura: { norm: 0.012, unit: "mb" },
        peszel: { norm: 0.012, unit: "mb" },
        punkt: { norm: 1.5, unit: "szt" },
      };
      const q = query.toLowerCase();
      let matched = false;
      for (const [key, val] of Object.entries(NORM_ESTIMATES)) {
        if (q.includes(key)) {
          results.push({
            name: `${query} (szacunek AI)`,
            norm: val.norm,
            unit: val.unit,
            source: "AI",
            laborCost: parseFloat((val.norm * safeRate).toFixed(2)),
            confidence: "low",
          });
          matched = true;
          break;
        }
      }
      if (!matched) {
        results.push({
          name: `${query} (szacunek AI)`,
          norm: 0.5,
          unit: "szt",
          source: "AI",
          laborCost: parseFloat((0.5 * safeRate).toFixed(2)),
          confidence: "low",
        });
      }
    }

    return { success: true, results };
  } catch {
    return { success: false, results: [], error: "Błąd wyszukiwania" };
  }
}

export interface DictionaryEntry {
  id: string;
  keyword: string;
  category: string;
  knr_ref: string | null;
  label: string | null;
  unit: string;
  labor_norm_rbh: number | null;
  match_score?: number;
  match_type?: "exact" | "fuzzy" | "partial";
}

export interface DictionaryStats {
  totalEntries: number;
  categoryCount: number;
  categories: string[];
}

export async function getSystemDictionaryStats(): Promise<{
  success: boolean;
  stats?: DictionaryStats;
  error?: string;
}> {
  try {
    const { supabase } = await tryAuth();
    if (!supabase) return { success: false, error: "Brak autoryzacji" };

    // RPC does DISTINCT + COUNT server-side — bypasses PostgREST max_rows cap
    const { data, error } = await supabase.rpc("get_dictionary_stats");

    if (error || !data || data.length === 0) {
      return { success: false, error: "Błąd pobierania statystyk" };
    }

    const row = data[0] as { total_entries: number; categories: string[] };
    const categories = (row.categories ?? []).filter(Boolean).sort();

    return {
      success: true,
      stats: {
        totalEntries: row.total_entries ?? 0,
        categoryCount: categories.length,
        categories,
      },
    };
  } catch {
    return { success: false, error: "Błąd pobierania statystyk" };
  }
}

export async function searchSystemDictionaryByCategory(
  category: string
): Promise<{ success: boolean; entries: DictionaryEntry[]; error?: string }> {
  try {
    const { supabase } = await tryAuth();
    if (!supabase) return { success: false, entries: [], error: "Brak autoryzacji" };

    const { data, error } = await supabase
      .from("es_dictionary")
      .select("id, keyword, category, knr_ref, label, unit, labor_norm_rbh")
      .eq("category", category)
      .order("keyword")
      .limit(50);

    if (error) return { success: false, entries: [], error: error.message };
    return { success: true, entries: (data ?? []) as DictionaryEntry[] };
  } catch {
    return { success: false, entries: [], error: "Błąd wyszukiwania" };
  }
}

export async function searchSystemDictionary(
  query: string
): Promise<{ success: boolean; entries: DictionaryEntry[]; error?: string }> {
  try {
    const { supabase } = await tryAuth();
    if (!supabase) return { success: false, entries: [], error: "Brak autoryzacji" };

    if (!query.trim() || query.trim().length < 2) {
      return { success: false, entries: [], error: "Wpisz co najmniej 2 znaki" };
    }

    const { data, error } = await supabase
      .rpc("search_dictionary_fuzzy", { p_query: query.trim(), p_limit: 25 });

    if (error) {
      // Graceful fallback to basic ilike if RPC unavailable
      const { data: fb, error: fe } = await supabase
        .from("es_dictionary")
        .select("id, keyword, category, knr_ref, label, unit, labor_norm_rbh")
        .or(`keyword.ilike.%${query}%,label.ilike.%${query}%`)
        .order("category")
        .limit(20);
      if (fe) return { success: false, entries: [], error: fe.message };
      return { success: true, entries: (fb ?? []) as DictionaryEntry[] };
    }

    return { success: true, entries: (data ?? []) as DictionaryEntry[] };
  } catch {
    return { success: false, entries: [], error: "Błąd wyszukiwania" };
  }
}

export async function searchDictionaryWithAI(
  query: string
): Promise<{ success: boolean; entries: DictionaryEntry[]; explanation?: string; error?: string }> {
  try {
    const { supabase } = await tryAuth();
    if (!supabase) return { success: false, entries: [], error: "Brak autoryzacji" };

    if (!query.trim() || query.trim().length < 2) {
      return { success: false, entries: [], error: "Wpisz co najmniej 2 znaki" };
    }

    // Step 1: Gemini extracts synonyms / related Polish electrical terms
    let terms: string[] = [query];
    let explanation = "";

    try {
      const { text } = await generateText({
        model: google("gemini-2.0-flash"),
        messages: [{
          role: "user",
          content: `Jesteś ekspertem instalacji elektrycznych w Polsce (KNR, SEP, PN-HD 60364).\nZapytanie: "${query}"\nPodaj 5 krótkich polskich słów kluczowych (max 3 słowa każde) ze słownictwa KNR, które najlepiej opisują tę pracę lub materiał. Uwzględnij synonimy i skróty branżowe.\nOdpowiedź WYŁĄCZNIE JSON: {"terms":["term1","term2","term3","term4","term5"],"explanation":"1-zdaniowe wyjaśnienie"}`,
        }],
        temperature: 0,
        maxOutputTokens: 180,
      });

      const cleaned = text.trim().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned) as { terms: string[]; explanation?: string };
      if (Array.isArray(parsed.terms) && parsed.terms.length > 0) {
        terms = parsed.terms.slice(0, 5);
      }
      explanation = parsed.explanation ?? "";
    } catch {
      terms = [query];
    }

    // Step 2: Search fuzzy for each AI-generated term
    const allEntries: DictionaryEntry[] = [];
    const seenIds = new Set<string>();

    for (const term of terms) {
      if (!term.trim()) continue;
      const { data } = await supabase
        .rpc("search_dictionary_fuzzy", { p_query: term.trim(), p_limit: 6 });
      if (data) {
        for (const row of data as DictionaryEntry[]) {
          if (!seenIds.has(row.id)) {
            seenIds.add(row.id);
            allEntries.push({ ...row, match_type: "fuzzy" });
          }
        }
      }
    }

    return {
      success: true,
      entries: allEntries.slice(0, 20),
      explanation,
    };
  } catch {
    return { success: false, entries: [], error: "Błąd wyszukiwania AI" };
  }
}
