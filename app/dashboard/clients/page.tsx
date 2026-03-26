import type { Metadata } from "next";
import { Suspense } from "react";
import { getClients, getClientStats } from "./actions";
import { ClientsPageClient } from "./clients-page-client";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "CRM Klientów — Baza Kontrahentów",
  description: "Profesjonalny CRM dla elektryka — baza klientów, historia projektów, notatki, tagi i statystyki współpracy. Wszystko w jednym miejscu",
};

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const [clients, stats] = await Promise.all([
    getClients(),
    getClientStats(),
  ]);

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    }>
      <ClientsPageClient initialClients={clients} stats={stats} />
    </Suspense>
  );
}
