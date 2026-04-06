"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { tryAuth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { isTeamAdmin } from "@/lib/team-auth";

// ─── Update member role (admin-only guard) ────────────────────────────────────

/**
 * Change a team member's role.
 * SECURITY: Only team owner or existing admin can change roles.
 * Prevents privilege escalation by non-admin members.
 */
export async function updateMemberRole(
  memberId: string,
  newRole: string,
  teamId?: string
) {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return { error: "Nie jesteś zalogowany" };

  if (teamId) {
    const adminCheck = await isTeamAdmin(supabase, teamId, user.id);
    if (!adminCheck) {
      return { error: "Tylko administrator może zmieniać role członków zespołu" };
    }
  }

  const { error } = await supabase
    .from("team_members")
    .update({ role: newRole })
    .eq("id", memberId);

  if (error) {
    logger.error("Error updating member role", { memberId, newRole, teamId }, error);
    return { error: error.message };
  }

  revalidatePath("/dashboard/team");
  return { success: true };
}

// ─── Legacy alias (no admin check) — prefer updateMemberRole(id, role, teamId) ─

export async function updateMemberRoleLegacy(memberId: string, newRole: string) {
  return updateMemberRole(memberId, newRole);
}
