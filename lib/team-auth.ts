import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Check if a user is a team admin (owner OR member with role="admin").
 * Used as a security guard before role changes and member deletions.
 */
export async function isTeamAdmin(
  supabase: SupabaseClient,
  teamId: string,
  userId: string
): Promise<boolean> {
  const [teamResult, memberResult] = await Promise.all([
    supabase.from("teams").select("owner_id").eq("id", teamId).single(),
    supabase
      .from("team_members")
      .select("role")
      .eq("team_id", teamId)
      .eq("user_id", userId)
      .single(),
  ]);

  return (
    teamResult.data?.owner_id === userId ||
    memberResult.data?.role === "admin"
  );
}
