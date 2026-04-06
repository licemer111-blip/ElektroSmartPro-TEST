import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { PageContainer } from "@/components/layout/page-container";
import { TimeTrackingDashboard } from "@/components/time/time-tracking-dashboard";
import { getMyTimeEntries, getTimeSummary } from "./actions";
import { getProjects } from "@/app/dashboard/actions";
import { Clock, Loader2 } from "lucide-react";
import { requireMinProjects } from "@/lib/guards/feature-gate";

export const metadata: Metadata = {
  title: "Śledzenie Czasu Pracy",
  description: "Rejestruj czas pracy na projektach elektrycznych — timer, raporty dzienne i raport rentowności z efektywną stawką godzinową",
};

export const dynamic = "force-dynamic";

export default async function TimePage() {
  await requireMinProjects();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [timeEntries, summary, projects] = await Promise.all([
    getMyTimeEntries(50),
    getTimeSummary(),
    getProjects(),
  ]);

  return (
    <div className="min-h-screen">
      <PageContainer maxWidth="xl">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-3 md:gap-4 mb-2">
            <div className="p-2 md:p-3 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 shadow-lg shadow-emerald-500/20">
              <Clock className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Śledzenie czasu
              </h1>
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-1">
                Timer • Raporty • Przypisanie do projektów • Statystyki
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <Suspense fallback={
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        }>
          <TimeTrackingDashboard
            timeEntries={timeEntries}
            summary={summary}
            projects={projects}
          />
        </Suspense>
      </PageContainer>
    </div>
  );
}
