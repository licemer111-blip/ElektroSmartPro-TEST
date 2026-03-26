"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { logger } from "@/lib/logger";

/**
 * Share all items in a category with team
 */
export async function shareCategoryWithTeam(
  categoryId: string,
  teamId: string
): Promise<{ success: boolean; sharedCount: number; message?: string }> {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) throw new Error("Unauthorized");

  const { data: allUserItems, error: allUserError } = await supabase
    .from("catalog_items")
    .select("id, name, visibility, team_id")
    .eq("user_id", user.id)
    .eq("category_id", categoryId);

  if (allUserError) {
    logger.error("Error fetching user items for sharing", { categoryId }, allUserError);
    const { data: basicItems, error: basicError } = await supabase
      .from("catalog_items")
      .select("id, name")
      .eq("user_id", user.id)
      .eq("category_id", categoryId);

    if (basicError) throw new Error("Failed to fetch category items");
    if (!basicItems || basicItems.length === 0) {
      return { success: true, sharedCount: 0, message: "Nie masz własnych pozycji w tej kategorii" };
    }

    const itemIds = basicItems.map((item) => item.id);
    const { error: updateError } = await supabase
      .from("catalog_items")
      .update({ visibility: "team", team_id: teamId })
      .in("id", itemIds);

    if (updateError) {
      logger.error("Error sharing items", { categoryId, teamId }, updateError);
      throw new Error("Nie udało się udostępnić pozycji - sprawdź czy migracja bazy danych została zastosowana");
    }

    revalidatePath("/dashboard/catalog");
    revalidatePath("/dashboard/team");
    return { success: true, sharedCount: basicItems.length };
  }

  const items = allUserItems?.filter(
    (item) => item.visibility === "personal" || item.visibility === null || !item.visibility
  ) || [];

  if (items.length === 0) {
    if (allUserItems && allUserItems.length > 0) {
      return { success: true, sharedCount: 0, message: "Wszystkie pozycje są już udostępnione zespołowi" };
    }
    return { success: true, sharedCount: 0, message: "Nie masz własnych pozycji w tej kategorii do udostępnienia" };
  }

  const itemIds = items.map((item) => item.id);

  const { error: updateError } = await supabase
    .from("catalog_items")
    .update({ visibility: "team", team_id: teamId })
    .in("id", itemIds)
    .eq("user_id", user.id);

  if (updateError) {
    logger.error("Error sharing category items", { categoryId, teamId, itemCount: items.length }, updateError);
    throw new Error("Failed to share category items");
  }

  revalidatePath("/dashboard/catalog");
  revalidatePath("/dashboard/team");
  return { success: true, sharedCount: items.length };
}

/**
 * Update catalog item visibility (personal <-> team)
 */
export async function updateCatalogItemVisibility(
  itemId: string,
  visibility: "personal" | "team",
  teamId?: string
): Promise<{ success: boolean }> {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) throw new Error("Unauthorized");

  const { data: item, error: fetchError } = await supabase
    .from("catalog_items")
    .select("user_id, team_id, visibility")
    .eq("id", itemId)
    .single();

  if (fetchError || !item) throw new Error("Item not found");
  if (item.user_id !== user.id) throw new Error("Only item owner can change visibility");

  const updateData: Record<string, string | null> = { visibility };

  if (visibility === "team") {
    if (!teamId) {
      const { data: ownedTeam } = await supabase
        .from("teams")
        .select("id")
        .eq("owner_id", user.id)
        .limit(1)
        .single();

      const { data: membership } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1)
        .single();

      teamId = ownedTeam?.id || membership?.team_id;
      if (!teamId) throw new Error("You must be in a team to share items with team");
    }
    updateData.team_id = teamId;
  } else {
    updateData.team_id = null;
  }

  const { error } = await supabase
    .from("catalog_items")
    .update(updateData)
    .eq("id", itemId)
    .eq("user_id", user.id)
    .select("id, visibility, team_id")
    .single();

  if (error) {
    logger.error("Error updating item visibility", { itemId, visibility }, error);
    throw new Error("Failed to update visibility");
  }

  revalidatePath("/dashboard/catalog");
  revalidatePath("/dashboard/team");
  return { success: true };
}
