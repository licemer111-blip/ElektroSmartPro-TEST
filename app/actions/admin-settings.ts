"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/utils/admin";
import { invalidateBenchmarkCache } from "@/lib/global-benchmarks";

export interface GlobalBenchmarks {
  market_rbh_rate: number;
  material_inflation_multiplier: number;
}

export interface AdminSettingsData {
  benchmarks: GlobalBenchmarks;
  directives: string;
}

// ─── Getters ──────────────────────────────────────────────────────────────────

export async function getAdminSettings(): Promise<AdminSettingsData> {
  const [benchmarksRow, directivesRow] = await Promise.all([
    supabaseAdmin
      .from("admin_settings")
      .select("value")
      .eq("key", "global_benchmarks")
      .single(),
    supabaseAdmin
      .from("admin_settings")
      .select("value")
      .eq("key", "expert_directives")
      .single(),
  ]);

  const benchmarks: GlobalBenchmarks = {
    market_rbh_rate: (benchmarksRow.data?.value as GlobalBenchmarks)?.market_rbh_rate ?? 85,
    material_inflation_multiplier: (benchmarksRow.data?.value as GlobalBenchmarks)?.material_inflation_multiplier ?? 1.08,
  };

  const directives: string = (directivesRow.data?.value as { directives: string })?.directives ?? "";

  return { benchmarks, directives };
}

/** Returns the global base labor rate (PLN/rbh) from admin_settings. Falls back to 85 if not set. */
export async function getGlobalLaborRate(): Promise<number> {
  try {
    const { data } = await supabaseAdmin
      .from("admin_settings")
      .select("value")
      .eq("key", "global_benchmarks")
      .single();
    return (data?.value as GlobalBenchmarks)?.market_rbh_rate ?? 85;
  } catch {
    return 85;
  }
}

/** Returns the global material inflation multiplier from admin_settings. Falls back to 1.08 if not set. */
export async function getGlobalMaterialMultiplier(): Promise<number> {
  try {
    const { data } = await supabaseAdmin
      .from("admin_settings")
      .select("value")
      .eq("key", "global_benchmarks")
      .single();
    return (data?.value as GlobalBenchmarks)?.material_inflation_multiplier ?? 1.08;
  } catch {
    return 1.08;
  }
}

export async function getExpertDirectives(): Promise<string> {
  try {
    const { data } = await supabaseAdmin
      .from("admin_settings")
      .select("value")
      .eq("key", "expert_directives")
      .single();
    return (data?.value as { directives: string })?.directives ?? "";
  } catch {
    return "";
  }
}

// ─── Setters ──────────────────────────────────────────────────────────────────

export async function saveGlobalBenchmarks(
  benchmarks: GlobalBenchmarks
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    if (benchmarks.market_rbh_rate < 1 || benchmarks.market_rbh_rate > 1000) {
      return { success: false, error: "Stawka rbh musi być między 1 a 1000 PLN/h" };
    }
    if (benchmarks.material_inflation_multiplier < 0.5 || benchmarks.material_inflation_multiplier > 3.0) {
      return { success: false, error: "Współczynnik inflacji musi być między 0.5 a 3.0" };
    }

    const { error } = await supabaseAdmin
      .from("admin_settings")
      .upsert(
        { key: "global_benchmarks", value: benchmarks, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );

    if (error) return { success: false, error: error.message };
    invalidateBenchmarkCache();
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Błąd zapisu" };
  }
}

export async function saveExpertDirectives(
  directives: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    if (directives.length > 5000) {
      return { success: false, error: "Dyrektywy nie mogą przekraczać 5000 znaków" };
    }

    const { error } = await supabaseAdmin
      .from("admin_settings")
      .upsert(
        { key: "expert_directives", value: { directives }, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Błąd zapisu" };
  }
}
