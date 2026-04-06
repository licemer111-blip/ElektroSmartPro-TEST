import type { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getPortfolioItems } from "./actions";
import { PortfolioView } from "./portfolio-view";
import { requireMinProjects } from "@/lib/guards/feature-gate";

export const metadata: Metadata = {
  title: "Portfolio — Zrealizowane Projekty",
  description: "Prezentuj swoje najlepsze realizacje elektryczne — galeria portfolio widoczna w portalu klienta. Buduj zaufanie i zdobywaj nowe zlecenia",
};

export default async function PortfolioPage() {
  await requireMinProjects();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_pro, portfolio_visible, portfolio_limit")
    .eq("id", user.id)
    .single();

  const { items, error } = await getPortfolioItems();

  return (
    <PortfolioView
      items={items}
      isPro={profile?.is_pro || false}
      portfolioVisible={profile?.portfolio_visible ?? true}
      portfolioLimit={profile?.portfolio_limit ?? 5}
      error={error}
    />
  );
}
