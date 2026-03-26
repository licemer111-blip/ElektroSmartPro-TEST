"use server";

import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/utils/admin";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EngineHealthStats {
  l0Total: number;
  l2Total: number;
  l0Coverage: number;
  auditTotal: number;
  auditL1: number;
  auditL2: number;
  auditL3: number;
  auditUnmatched: number;
  l3Rate: number;
  l0VerifiedCount: number;
}

export interface DictEntry {
  id: string;
  keyword: string;
  label: string;
  knr_ref: string;
  labor_norm_rbh: number;
  unit: string;
  category: string;
  type: string;
}

export interface L0MissEntry {
  item_name: string;
  frequency: number;
  best_knr_code: string | null;
  avg_match_level: string;
  can_promote: boolean;
  es_dict_entry?: DictEntry;
}

export interface PromoteToL0Input {
  keyword: string;
  knr_ref: string;
  label: string;
  labor_norm_rbh: number;
  unit: string;
  category: string;
}

export interface PromoteResult {
  success: boolean;
  message: string;
  knr_id?: string;
}

export interface CommandSearchResult {
  type: "norm" | "user";
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

// ─── Health Stats ─────────────────────────────────────────────────────────────

export async function getEngineHealthStats(): Promise<EngineHealthStats> {
  await requireAdmin();
  const supabase = await createClient();

  const [
    l0Res,
    l0VerifiedRes,
    l2Res,
    auditRes,
  ] = await Promise.all([
    supabase.from("knr_norms").select("*", { count: "exact", head: true }),
    supabase.from("knr_norms").select("*", { count: "exact", head: true }).eq("is_verified", true),
    supabase.from("es_dictionary").select("*", { count: "exact", head: true }).is("user_id", null),
    supabase.from("pricing_audit_log").select("match_level"),
  ]);

  const all = auditRes.data ?? [];
  const auditTotal = all.length;
  const auditL1 = all.filter((r) => r.match_level === "L1").length;
  const auditL2 = all.filter((r) => r.match_level === "L2").length;
  const auditL3 = all.filter((r) => r.match_level === "L3").length;
  const auditUnmatched = all.filter((r) => r.match_level === "unmatched").length;
  const l3Rate = auditTotal > 0 ? Math.round(((auditL3 + auditUnmatched) / auditTotal) * 100) : 0;
  const l0Coverage = auditTotal > 0 ? Math.round((auditL1 / auditTotal) * 100) : 0;

  return {
    l0Total: l0Res.count ?? 0,
    l0VerifiedCount: l0VerifiedRes.count ?? 0,
    l2Total: l2Res.count ?? 0,
    l0Coverage,
    auditTotal,
    auditL1,
    auditL2,
    auditL3,
    auditUnmatched,
    l3Rate,
  };
}

// ─── L0 Miss Analysis ─────────────────────────────────────────────────────────

export async function getL0MissAnalysis(limit = 50): Promise<L0MissEntry[]> {
  await requireAdmin();
  const supabase = await createClient();

  const { data: auditRows } = await supabase
    .from("pricing_audit_log")
    .select("item_name, match_level, knr_code")
    .in("match_level", ["L2", "L3", "unmatched"])
    .order("created_at", { ascending: false })
    .limit(2000);

  if (!auditRows || auditRows.length === 0) return [];

  // Group by item_name
  const grouped = new Map<string, { count: number; knr_codes: Set<string>; levels: string[] }>();
  for (const row of auditRows) {
    const key = row.item_name as string;
    const existing = grouped.get(key) ?? { count: 0, knr_codes: new Set<string>(), levels: [] as string[] };
    existing.count++;
    if (row.knr_code) existing.knr_codes.add(row.knr_code as string);
    existing.levels.push(row.match_level as string);
    grouped.set(key, existing);
  }

  const sorted = [...grouped.entries()]
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, limit);

  const allKnrCodes = [...new Set(sorted.flatMap(([, v]) => [...v.knr_codes]))].filter(Boolean);

  const dictByCode = new Map<string, DictEntry>();
  if (allKnrCodes.length > 0) {
    const { data: dictEntries } = await supabase
      .from("es_dictionary")
      .select("id, keyword, label, knr_ref, labor_norm_rbh, unit, category, type")
      .in("knr_ref", allKnrCodes)
      .is("user_id", null);

    for (const entry of dictEntries ?? []) {
      if (!dictByCode.has(entry.knr_ref as string)) {
        dictByCode.set(entry.knr_ref as string, {
          id: entry.id as string,
          keyword: entry.keyword as string,
          label: entry.label as string,
          knr_ref: entry.knr_ref as string,
          labor_norm_rbh: Number(entry.labor_norm_rbh),
          unit: entry.unit as string,
          category: entry.category as string,
          type: entry.type as string,
        });
      }
    }
  }

  return sorted.map(([item_name, { count, knr_codes, levels }]) => {
    const bestCode = [...knr_codes][0] ?? null;
    const dictEntry = bestCode ? dictByCode.get(bestCode) : undefined;

    const levelCounts = levels.reduce<Record<string, number>>((acc, l) => {
      acc[l] = (acc[l] ?? 0) + 1;
      return acc;
    }, {});
    const avgLevel = Object.entries(levelCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "L2";

    return {
      item_name,
      frequency: count,
      best_knr_code: bestCode,
      avg_match_level: avgLevel,
      can_promote: !!dictEntry,
      es_dict_entry: dictEntry,
    };
  });
}

// ─── Promote to L0 ────────────────────────────────────────────────────────────

function parseKnrRef(knrRef: string): { catalog_code: string; table_number: string; column_number: string } {
  // "KNR 5-08 0301-01" → catalog_code="KNR 5-08", table_number="0301", column_number="01"
  const match = knrRef.match(/^(.+)\s+(\d{4})-(\d{2})$/);
  if (match) {
    return { catalog_code: match[1].trim(), table_number: match[2], column_number: match[3] };
  }
  // ES-KNR- format: "ES-KNR-EV EV-0101-01"
  const esMatch = knrRef.match(/^(ES-KNR-\S+)\s+(.+)-(\d{2})$/i);
  if (esMatch) {
    return { catalog_code: esMatch[1], table_number: esMatch[2], column_number: esMatch[3] };
  }
  return { catalog_code: knrRef, table_number: "0000", column_number: "01" };
}

export async function promoteToL0(input: PromoteToL0Input): Promise<PromoteResult> {
  await requireAdmin();

  const { catalog_code, table_number, column_number } = parseKnrRef(input.knr_ref);

  const { data, error } = await supabaseAdmin
    .from("knr_norms")
    .upsert(
      {
        catalog_code,
        table_number,
        column_number,
        description: input.label,
        unit: input.unit,
        labor_norm: input.labor_norm_rbh,
        knr_category: input.category,
        is_active: true,
        is_verified: true,
        source_edition: "promoted_from_L2",
        synonyms: [input.keyword],
      },
      { onConflict: "catalog_code,table_number,column_number", ignoreDuplicates: false }
    )
    .select("id")
    .single();

  if (error) {
    return { success: false, message: `Błąd bazy: ${error.message}` };
  }

  return {
    success: true,
    message: `Norma "${input.label}" awansowana do L0 (${input.knr_ref})`,
    knr_id: data?.id as string | undefined,
  };
}

// ─── Dictionary Browser (L2 es_dictionary) ───────────────────────────────────

export interface DictRow {
  id: string;
  keyword: string;
  label: string;
  knr_ref: string;
  labor_norm_rbh: number;
  unit: string;
  category: string;
  type: string;
  confidence_weight: number;
}

export async function getDictionaryRows(): Promise<DictRow[]> {
  await requireAdmin();
  const supabase = await createClient();

  const { data } = await supabase
    .from("es_dictionary")
    .select("id, keyword, label, knr_ref, labor_norm_rbh, unit, category, type, confidence_weight")
    .is("user_id", null)
    .order("category", { ascending: true })
    .order("keyword", { ascending: true })
    .limit(10000);

  return (data ?? []).map((r) => ({
    id: r.id as string,
    keyword: r.keyword as string,
    label: r.label as string,
    knr_ref: r.knr_ref as string,
    labor_norm_rbh: Number(r.labor_norm_rbh),
    unit: r.unit as string,
    category: r.category as string,
    type: r.type as string,
    confidence_weight: Number(r.confidence_weight),
  }));
}

// ─── CMD+K Search ─────────────────────────────────────────────────────────────

export async function commandSearch(query: string): Promise<CommandSearchResult[]> {
  await requireAdmin();
  const q = query.trim();
  if (q.length < 2) return [];

  const supabase = await createClient();

  const [normsRes, usersRes] = await Promise.all([
    supabase
      .from("knr_norms")
      .select("id, full_code, description, unit, labor_norm")
      .or(`description.ilike.%${q}%,full_code.ilike.%${q}%`)
      .limit(8),
    supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, nip, company_name, is_pro")
      .or(`email.ilike.%${q}%,nip.ilike.%${q}%,full_name.ilike.%${q}%,company_name.ilike.%${q}%`)
      .limit(5),
  ]);

  const normResults: CommandSearchResult[] = (normsRes.data ?? []).map((n) => ({
    type: "norm" as const,
    id: n.id as string,
    title: n.description as string,
    subtitle: `${n.full_code ?? ""} · ${n.labor_norm} rbh · ${n.unit}`,
    href: "/admin/knr-quality",
  }));

  const userResults: CommandSearchResult[] = (usersRes.data ?? []).map((u) => ({
    type: "user" as const,
    id: u.id as string,
    title: (u.full_name as string) || (u.email as string) || "—",
    subtitle: `${u.email ?? ""} · NIP: ${u.nip ?? "brak"} · ${u.is_pro ? "PRO" : "Demo"}`,
    href: `/admin/users`,
  }));

  return [...normResults, ...userResults];
}
