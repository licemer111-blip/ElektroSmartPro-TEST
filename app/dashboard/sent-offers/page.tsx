import type { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { PageContainer } from "@/components/layout/page-container";
import { SentOffersTable } from "@/components/sent-offers/sent-offers-table";
import { Mail, Send } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Wysłane Oferty — Śledzenie Statusów",
  description: "Monitoruj wysłane oferty w czasie rzeczywistym — statusy (oczekująca/zaakceptowana/odrzucona), komentarze klientów i e-podpisy",
};

export const dynamic = 'force-dynamic';

export default async function SentOffersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch sent emails with project information
  const { data: emailLogs, error } = await supabase
    .from("email_logs")
    .select(`
      *,
      projects (
        id,
        name,
        status
      )
    `)
    .eq("user_id", user.id)
    .order("sent_at", { ascending: false });

  if (error) {
    // Silently handle - logs will be empty
  }

  const logs = emailLogs || [];

  // Calculate statistics
  const totalSent = logs.length;
  const successfulSent = logs.filter(log => log.status === 'sent').length;
  const failedSent = logs.filter(log => log.status === 'failed').length;

  return (
    <div className="min-h-screen animate-in fade-in duration-500">
      <PageContainer maxWidth="xl">
        {/* Header Section */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="p-2 md:p-3 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20">
                <Mail className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  Wysłane oferty
                </h1>
                <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Historia wysyłek • Status dostawy • Powiązanie z projektami
                </p>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Wszystkie wysłane</CardTitle>
                <Send className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalSent}</div>
                <p className="text-xs text-muted-foreground">
                  {totalSent === 0 ? "Brak wysłanych" : `${totalSent} email${totalSent === 1 ? '' : 'i/ów'}`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pomyślnie dostarczone</CardTitle>
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 dark:text-green-500">{successfulSent}</div>
                <p className="text-xs text-muted-foreground">
                  {totalSent > 0 ? `${((successfulSent / totalSent) * 100).toFixed(0)}% sukcesu` : "—"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Nieudane</CardTitle>
                <div className="h-3 w-3 rounded-full bg-red-500"></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600 dark:text-red-500">{failedSent}</div>
                <p className="text-xs text-muted-foreground">
                  {totalSent > 0 ? `${((failedSent / totalSent) * 100).toFixed(0)}% błędów` : "—"}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Email Logs Table */}
        <SentOffersTable emailLogs={logs} />

        <div className="h-12"></div>
      </PageContainer>
    </div>
  );
}
