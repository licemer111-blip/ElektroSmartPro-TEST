"use server";

import { unstable_cache } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { SYSTEM_STATS_FALLBACK } from "@/constants/system";

export interface SystemStats {
  normsCount: number;
  categoriesCount: number;
  normsLabel: string;
  normsLabelRounded: string;
  normsLabelPlus: string;
  categoriesLabel: string;
}

async function fetchSystemStats(): Promise<SystemStats> {
  try {
    const supabase = await createClient();
    const [esDictResult, knrNormsResult, catsResult] = await Promise.all([
      supabase.from("es_dictionary").select("*", { count: "exact", head: true }),
      supabase.from("knr_norms").select("*", { count: "exact", head: true }),
      supabase.from("catalog_categories").select("*", { count: "exact", head: true }),
    ]);

    const esDictCount = esDictResult.count ?? 0;
    const knrNormsCount = knrNormsResult.count ?? 0;
    const norms = esDictCount + knrNormsCount || SYSTEM_STATS_FALLBACK.normsCount;
    const cats = catsResult.count ?? SYSTEM_STATS_FALLBACK.categoriesCount;
    const roundedThousand = Math.floor(norms / 1000) * 1000;

    return {
      normsCount: norms,
      categoriesCount: cats,
      normsLabel: norms.toLocaleString("pl-PL"),
      normsLabelRounded: `ponad ${roundedThousand.toLocaleString("pl-PL")}`,
      normsLabelPlus: `${roundedThousand.toLocaleString("pl-PL")}+`,
      categoriesLabel: cats.toString(),
    };
  } catch {
    const roundedThousand = Math.floor(SYSTEM_STATS_FALLBACK.normsCount / 1000) * 1000;
    return {
      ...SYSTEM_STATS_FALLBACK,
      normsLabel: SYSTEM_STATS_FALLBACK.normsCount.toLocaleString("pl-PL"),
      normsLabelRounded: `ponad ${roundedThousand.toLocaleString("pl-PL")}`,
      normsLabelPlus: `${roundedThousand.toLocaleString("pl-PL")}+`,
    };
  }
}

export const getSystemStats = unstable_cache(fetchSystemStats, ["system-stats"], {
  revalidate: 3600,
  tags: ["system-stats"],
});
