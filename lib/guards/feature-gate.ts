import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

const MIN_PROJECTS_FOR_SECONDARY = 3;

/**
 * Server-side guard: redirects to dashboard if user has fewer than
 * MIN_PROJECTS_FOR_SECONDARY projects. Used on secondary pages
 * (Analytics, Portfolio, Time, Team) that overwhelm new users.
 */
export async function requireMinProjects(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { count } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((count ?? 0) < MIN_PROJECTS_FOR_SECONDARY) {
    redirect("/dashboard");
  }
}
