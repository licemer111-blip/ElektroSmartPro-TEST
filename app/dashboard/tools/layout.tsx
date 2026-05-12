import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ToolsProvider } from "@/components/tools/tools-provider";
import { getEffectiveIsPro } from "@/lib/auth/entitlements";

export default async function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user profile to check PRO status (including trial fields)
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_pro, trial_started_at, trial_ends_at")
    .eq("id", user.id)
    .single();

  const isPro = getEffectiveIsPro(profile as Parameters<typeof getEffectiveIsPro>[0]);

  return (
    <ToolsProvider isPro={isPro}>
      {children}
    </ToolsProvider>
  );
}
