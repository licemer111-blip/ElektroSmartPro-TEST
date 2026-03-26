import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { logger } from "@/lib/logger";

// Supabase client type alias — shared across all domain files
export type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

// Helper function to check if user can edit project (owner or editor)
// Roles that CAN edit: owner, editor, kierownik, admin
// Roles that CANNOT edit: elektryk (read-only)
// Uses RPC function with SECURITY DEFINER to bypass RLS
export async function canUserEditProject(
  supabase: SupabaseServerClient,
  projectId: string,
  userId: string
): Promise<boolean> {
  const { data: canEdit, error } = await supabase
    .rpc("user_can_edit_project", { p_project_id: projectId });

  if (error) {
    logger.error("Error calling user_can_edit_project RPC", { projectId, userId }, error);
    return false;
  }

  return canEdit === true;
}

// ⚡ Helper for aggressive revalidation (for collaborative features)
export function revalidateProject(projectId: string) {
  revalidatePath(`/dashboard/projects/${projectId}`, "page");
  revalidatePath("/dashboard", "page");
  revalidatePath("/dashboard/projects", "page");
}

// Helper to get user catalog preferences (show global vs personal only)
export async function getUserCatalogPreferences(
  supabase: SupabaseServerClient,
  userId: string
): Promise<{ showGlobalCatalog: boolean }> {
  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("show_global_catalog")
      .eq("id", userId)
      .single();

    if (error) {
      logger.warn("Error fetching user catalog preferences", { userId });
      return { showGlobalCatalog: true };
    }

    return {
      showGlobalCatalog: profile?.show_global_catalog ?? true,
    };
  } catch (err) {
    logger.error("Exception in getUserCatalogPreferences", { userId }, err);
    return { showGlobalCatalog: true };
  }
}
