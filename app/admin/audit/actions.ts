"use server";

import { createClient } from "@/utils/supabase/server";
import { requireAdmin } from "@/lib/utils/admin";
import { logger } from "@/lib/logger";

export interface CatalogAuditLog {
  id: string;
  operation: "INSERT" | "UPDATE" | "DELETE";
  item_id: string;
  item_name: string;
  changed_by: string | null;
  changed_at: string;
  old_mat_price: number | null;
  new_mat_price: number | null;
  old_lab_price: number | null;
  new_lab_price: number | null;
  old_conf_level: string | null;
  new_conf_level: string | null;
  old_trend: string | null;
  new_trend: string | null;
  note: string | null;
}

export interface GetAuditLogsResult {
  logs: CatalogAuditLog[];
  total: number;
  error?: string;
}

export async function getCatalogAuditLogs(
  page = 1,
  pageSize = 50,
  itemId?: string
): Promise<GetAuditLogsResult> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const offset = (page - 1) * pageSize;

    const { data, error } = await supabase.rpc("get_catalog_audit_logs", {
      p_limit: pageSize,
      p_offset: offset,
      p_item_id: itemId ?? null,
    });

    if (error) {
      logger.error("getCatalogAuditLogs error", {}, error);
      return { logs: [], total: 0, error: "Nie udało się pobrać logów audytu" };
    }

    // Count total separately for pagination
    const { count } = await supabase
      .from("catalog_audit_logs")
      .select("*", { count: "exact", head: true });

    return {
      logs: (data ?? []) as CatalogAuditLog[],
      total: count ?? 0,
    };
  } catch (err) {
    logger.error("getCatalogAuditLogs exception", {}, err);
    return { logs: [], total: 0, error: "Brak dostępu" };
  }
}

export async function getAuditStats(): Promise<{
  today: number;
  week: number;
  total: number;
  topChangedItems: Array<{ item_name: string; change_count: number }>;
}> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart  = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [todayRes, weekRes, totalRes, topRes] = await Promise.all([
      supabase.from("catalog_audit_logs").select("*", { count: "exact", head: true })
        .gte("changed_at", todayStart),
      supabase.from("catalog_audit_logs").select("*", { count: "exact", head: true })
        .gte("changed_at", weekStart),
      supabase.from("catalog_audit_logs").select("*", { count: "exact", head: true }),
      supabase.from("catalog_audit_logs").select("item_name")
        .gte("changed_at", weekStart),
    ]);

    // Count by item_name from raw data
    const nameCounts: Record<string, number> = {};
    for (const row of topRes.data ?? []) {
      nameCounts[row.item_name] = (nameCounts[row.item_name] ?? 0) + 1;
    }
    const topChangedItems = Object.entries(nameCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([item_name, change_count]) => ({ item_name, change_count }));

    return {
      today: todayRes.count ?? 0,
      week:  weekRes.count ?? 0,
      total: totalRes.count ?? 0,
      topChangedItems,
    };
  } catch {
    return { today: 0, week: 0, total: 0, topChangedItems: [] };
  }
}
