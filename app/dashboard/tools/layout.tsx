import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ToolsProvider } from "@/components/tools/tools-provider";

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

  // Fetch user profile to check PRO status
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_pro")
    .eq("id", user.id)
    .single();

  const isPro = profile?.is_pro || false;

  return (
    <ToolsProvider isPro={isPro}>
      {children}
    </ToolsProvider>
  );
}
