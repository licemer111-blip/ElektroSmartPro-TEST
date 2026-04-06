import { Metadata } from "next";
import { tryAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getProfile } from "@/app/dashboard/settings/actions";
import { getProjects } from "@/app/dashboard/actions";
import { PanelConfiguratorPageClient } from "./page-client";
import { DIN_MODULES_COUNT } from "@/lib/data/din-modules-stats";

export const metadata: Metadata = {
  title: `Konfigurator Rozdzielnicy — ${DIN_MODULES_COUNT}+ Modułów DIN w 15 Kategoriach`,
  description: `Wizualny konfigurator tablic rozdzielczych: ${DIN_MODULES_COUNT}+ modułów DIN (zabezpieczenia, RCD, RCBO, SPD, złączki, materiały montażowe, terminale), automatyczny balans faz, schemat jednokreskowy ES-Engine, eksport PDF/SVG, normy KNR 5-08`,
};

export default async function PanelConfiguratorPage() {
  const { user } = await tryAuth();
  if (!user) redirect("/login");

  const [profileResult, projects] = await Promise.all([
    getProfile(),
    getProjects(),
  ]);

  const profile = profileResult?.data;

  const projectList = (projects || []).map((p) => ({
    id: p.id,
    name: p.name,
    status: p.status,
  }));

  const isPro = profile?.is_pro ?? false;

  const userProfile = profile ? {
    full_name: profile.full_name || undefined,
    company_name: profile.company_name || undefined,
    nip: profile.nip || undefined,
    address: profile.address || undefined,
    phone: profile.phone || undefined,
    email: profile.email || undefined,
    logo_url: profile.logo_url || undefined,
  } : undefined;

  return (
    <PanelConfiguratorPageClient
      projects={projectList}
      isPro={isPro}
      userProfile={userProfile}
      userId={user.id}
    />
  );
}
