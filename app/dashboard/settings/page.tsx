import { Metadata } from "next";
import { SettingsContentV2 } from "./settings-content-v2";
import { getProfile, ensureProfile, getCatalogStats } from "./actions";
import { isAdmin } from "./finance-actions";
import { getHiddenCatalogItems } from "../catalog/actions";
import { getProfileStats } from "../profile/actions";
import { getRegions } from "../actions";
import { createClient } from "@/utils/supabase/server";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Ustawienia — Profil, Firma i Integracje",
  description: "Stawka rbh, województwo, dane firmy na PDF, katalog i subskrypcja PRO.",
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

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const profileData = user ? await getProfileStats(user.email || "") : null;

  // Await searchParams (Next.js 15 requirement)
  const params = await searchParams;
  const activeTab = params.tab || "guide";

  return (
    <SettingsContentV2 
      initialProfile={profile} 
      isAdmin={isUserAdmin} 
      hiddenItems={hiddenItems} 
      activeTab={activeTab}
      profileData={profileData}
      initialCatalogStats={catalogStats}
      regions={regions}
    />
  );
}
