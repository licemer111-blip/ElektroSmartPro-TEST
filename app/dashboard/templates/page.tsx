import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { PageContainer } from "@/components/layout/page-container";
import { getTemplates } from "./actions";
import { TemplatesPageClient } from "@/components/templates/templates-page-client";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Szablony Kosztorysów",
  description: "Gotowe szablony projektów elektrycznych — mieszkanie, łazienka, rozdzielnica. Rozpocznij kosztorys w 30 sekund z wypełnionymi pozycjami",
};

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const templates = await getTemplates();

  return (
    <PageContainer>
      <Suspense
        fallback={
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        }
      >
        <TemplatesPageClient templates={templates} />
      </Suspense>
    </PageContainer>
  );
}
