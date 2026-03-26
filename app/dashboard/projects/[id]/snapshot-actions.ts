"use server";

import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

export interface SnapshotMeta {
  fileName: string;
  date: string;
  itemCount: number;
  size: number;
}

export async function getProjectSnapshots(projectId: string): Promise<SnapshotMeta[]> {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) return [];

  const { data: files, error } = await supabase.storage
    .from("project-documents")
    .list(projectId, { sortBy: { column: "created_at", order: "desc" } });

  if (error || !files) return [];

  // Filter only snapshot JSON files
  const snapshots = files
    .filter(f => f.name.startsWith("Snapshot_") && f.name.endsWith(".json"))
    .map(f => {
      // Extract date from filename: Snapshot_2026-02-09T20-15-30-123Z.json
      const dateStr = f.name
        .replace("Snapshot_", "")
        .replace(".json", "")
        .replace(/-(\d{2})-(\d{2})-(\d{3})Z$/, ":$1:$2.$3Z")
        .replace(/T(\d{2})-/, "T$1:");

      return {
        fileName: f.name,
        date: dateStr,
        itemCount: 0, // Will be populated when opened
        size: f.metadata?.size || 0,
      };
    });

  return snapshots;
}

export async function getSnapshotData(
  projectId: string,
  fileName: string
): Promise<{ items: unknown[]; error?: string }> {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) return { items: [], error: "Unauthorized" };

  const { data, error } = await supabase.storage
    .from("project-documents")
    .download(`${projectId}/${fileName}`);

  if (error || !data) {
    return { items: [], error: "Nie udało się pobrać snapshota" };
  }

  try {
    const text = await data.text();
    const json = JSON.parse(text);
    return { items: json.items || [] };
  } catch {
    return { items: [], error: "Błąd parsowania snapshota" };
  }
}

export async function restoreSnapshot(
  projectId: string,
  fileName: string
): Promise<{ success?: boolean; error?: string; restoredCount?: number }> {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) {
    return { error: "Musisz być zalogowany" };
  }

  // Verify ownership
  const { data: project } = await supabase
    .from("projects")
    .select("id, user_id, status")
    .eq("id", projectId)
    .single();

  if (!project || project.user_id !== user.id) {
    return { error: "Brak uprawnień" };
  }

  if (project.status === "final") {
    return { error: "Odblokuj projekt przed przywracaniem wersji" };
  }

  // Download snapshot
  const { data: blob, error: dlError } = await supabase.storage
    .from("project-documents")
    .download(`${projectId}/${fileName}`);

  if (dlError || !blob) {
    return { error: "Nie udało się pobrać snapshota" };
  }

  let items: {
    id?: string;
    name: string;
    unit: string;
    quantity: number;
    final_material_price: number | null;
    final_labor_price: number | null;
    material_price?: number | null;
    labor_price?: number | null;
    sort_order: number;
    is_assembly_child?: boolean;
    parent_assembly_id?: string | null;
  }[];

  try {
    const text = await blob.text();
    const json = JSON.parse(text);
    items = json.items || [];
  } catch {
    return { error: "Błąd parsowania snapshota" };
  }

  if (items.length === 0) {
    return { error: "Snapshot jest pusty" };
  }

  // Delete current items
  const { error: delError } = await supabase
    .from("project_items")
    .delete()
    .eq("project_id", projectId);

  if (delError) {
    logger.error("Error deleting items for restore", { projectId }, delError);
    return { error: "Błąd usuwania obecnych pozycji" };
  }

  // Re-insert from snapshot (without old IDs — let DB generate new ones)
  const rows = items.map((item, idx) => ({
    project_id: projectId,
    catalog_item_id: null,
    name: item.name,
    unit: item.unit,
    quantity: item.quantity,
    final_material_price: item.final_material_price ?? item.material_price ?? 0,
    final_labor_price: item.final_labor_price ?? item.labor_price ?? 0,
    sort_order: item.sort_order ?? idx + 1,
    is_assembly_child: item.is_assembly_child ?? false,
  }));

  const { error: insError } = await supabase.from("project_items").insert(rows);

  if (insError) {
    logger.error("Error restoring snapshot items", { projectId, count: rows.length }, insError);
    return { error: "Błąd przywracania pozycji" };
  }

  revalidatePath(`/dashboard/projects/${projectId}`);
  return { success: true, restoredCount: rows.length };
}

/**
 * Create a manual snapshot of the current project state
 */
export async function createManualSnapshot(
  projectId: string,
  versionName: string,
  description?: string
): Promise<{ success?: boolean; error?: string; fileName?: string }> {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
    if (!user || !supabase) {
      return { error: "Musisz być zalogowany" };
    }

    const { data: project } = await supabase
      .from("projects")
      .select("id, user_id")
      .eq("id", projectId)
      .single();

    if (!project || project.user_id !== user.id) {
      return { error: "Brak uprawnień" };
    }

    const { data: items, error: itemsError } = await supabase
      .from("project_items")
      .select("*")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true });

    if (itemsError || !items) {
      return { error: "Nie można pobrać pozycji" };
    }

    if (items.length === 0) {
      return { error: "Projekt nie ma pozycji do zapisania" };
    }

    const snapshotData = {
      projectId,
      versionName,
      description: description || "",
      createdAt: new Date().toISOString(),
      createdBy: user.id,
      itemCount: items.length,
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        unit: item.unit,
        quantity: item.quantity,
        final_material_price: item.final_material_price,
        final_labor_price: item.final_labor_price,
        material_price: item.material_price,
        labor_price: item.labor_price,
        sort_order: item.sort_order,
        is_assembly_child: item.is_assembly_child,
        parent_assembly_id: item.parent_assembly_id,
        section: item.section,
      })),
    };

    const now = new Date();
    const ts = now.toISOString().replace(/:/g, "-").replace(/\./g, "-");
    const fileName = `Snapshot_${ts}.json`;

    const { error: uploadError } = await supabase.storage
      .from("project-documents")
      .upload(`${projectId}/${fileName}`, JSON.stringify(snapshotData), {
        contentType: "text/plain",
        upsert: false,
      });

    if (uploadError) {
      logger.error("Error uploading snapshot", { projectId, fileName }, uploadError);
      return { error: "Błąd zapisu wersji" };
    }

    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true, fileName };
  } catch (error) {
    logger.error("createManualSnapshot error", { projectId }, error);
    return { error: "Nieoczekiwany błąd" };
  }
}
