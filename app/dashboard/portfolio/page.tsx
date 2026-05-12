import type { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getPortfolioItems } from "./actions";
import { PortfolioView } from "./portfolio-view";
import { getEffectiveIsPro } from "@/lib/auth/entitlements";

export const metadata: Metadata = {
  title: "Portfolio — Zrealizowane Projekty",
  description: "Prezentuj swoje najlepsze realizacje elektryczne — galeria portfolio widoczna w portalu klienta. Buduj zaufanie i zdobywaj nowe zlecenia",
};

export default async function PortfolioPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_pro, trial_started_at, trial_ends_at, portfolio_visible, portfolio_limit")
    .eq("id", user.id)
    .single();

  const { items, error } = await getPortfolioItems();

  return (
    <PortfolioView
      items={items}
      isPro={getEffectiveIsPro(profile as Parameters<typeof getEffectiveIsPro>[0])}
      portfolioVisible={profile?.portfolio_visible ?? true}
      portfolioLimit={profile?.portfolio_limit ?? 5}
      error={error}
    />
  );
}
