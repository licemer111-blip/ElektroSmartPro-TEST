import { Metadata } from "next";
import { SettingsContentV2 } from "./settings-content-v2";
import { getProfile, ensureProfile, getCatalogStats } from "./actions";
import { isAdmin } from "./finance-actions";
import { getHiddenCatalogItems } from "../catalog/actions";
import { getPortfolioItems } from "../portfolio/actions";
import { getProfileStats } from "../profile/actions";
import { getRegions } from "../actions";
import { createClient } from "@/utils/supabase/server";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Ustawienia — Profil, Firma i Integracje",
  description: "Dane firmy, logo, NIP/VAT, stawka r-g, stawka ES-Engine, klucz InFakt, szablony PDF, portfolio i personalizacja — dostosuj ElektroSmart PRO do swojej działalności elektrycznej",
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  // Ensure profile exists (for existing users before this feature)
  await ensureProfile();

  // Fetch current profile
  const { data: profile } = await getProfile();

  // Check if user is admin
  const isUserAdmin = await isAdmin();

  // Fetch hidden catalog items + catalog stats + regions (server-side to avoid SSR fetch waterfall)
  const [hiddenItems, catalogStats, regions] = await Promise.all([
    getHiddenCatalogItems(),
    getCatalogStats(),
    getRegions(),
  ]);

  // Fetch portfolio data
  const { items: portfolioItems, error: portfolioError } = await getPortfolioItems();

  // Fetch portfolio visibility settings
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [portfolioProfileResult, profileData] = await Promise.all([
    user ? supabase.from("profiles").select("portfolio_visible, portfolio_limit").eq("id", user.id).single() : Promise.resolve({ data: null }),
    user ? getProfileStats(user.email || "") : Promise.resolve(null),
  ]);
  const portfolioProfile = portfolioProfileResult.data;

  // Await searchParams (Next.js 15 requirement)
  const params = await searchParams;
  const activeTab = params.tab || "guide";

  return (
    <SettingsContentV2 
      initialProfile={profile} 
      isAdmin={isUserAdmin} 
      hiddenItems={hiddenItems} 
      activeTab={activeTab}
      portfolioItems={portfolioItems}
      portfolioVisible={portfolioProfile?.portfolio_visible ?? true}
      portfolioLimit={portfolioProfile?.portfolio_limit ?? 5}
      portfolioError={portfolioError}
      profileData={profileData}
      initialCatalogStats={catalogStats}
      regions={regions}
    />
  );
}
