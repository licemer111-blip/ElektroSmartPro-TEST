import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { PageContainer } from "@/components/layout/page-container";
import { getRegions, getObjectTypes } from "@/app/dashboard/actions";
import { QuickEstimateWizard } from "@/components/projects/quick-estimate-wizard";

export const metadata: Metadata = {
  title: "Szybka Wycena — Kosztorys w 5 Minut",
  description: "Kreator ekspresowej wyceny instalacji elektrycznej — wybierz obiekt, dodaj pozycje i wyślij ofertę PDF klientowi w 5 minut",
};

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default async function QuickEstimatePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check PRO status
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_pro")
    .eq("id", user.id)
    .single();

  const isPro = profile?.is_pro === true;

  const [regions, objectTypes] = await Promise.all([
    getRegions(),
    getObjectTypes(),
  ]);

  return (
    <PageContainer>
      <QuickEstimateWizard
        regions={regions.map(r => ({ id: r.id, name: r.name }))}
        objectTypes={objectTypes.map(ot => ({ id: ot.id, name: ot.name, default_vat_rate: ot.default_vat_rate }))}
        isPro={isPro}
      />
    </PageContainer>
  );
}
