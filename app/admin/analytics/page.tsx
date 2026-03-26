import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/utils/admin";
import { getPriceDeviationAnalytics, getUserActivityAnalytics, getCustomItemsDetailed } from "./actions";
import { PriceDeviationTable } from "./price-deviation-table";
import { UserActivityTable } from "./user-activity-table";
import { CustomItemsDetailedTable } from "./custom-items-detailed-table";
import { BarChart3, TrendingUp, Users, Package } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Admin Analytics | ElektroSmart PRO",
  description: "Analiza danych użytkowników do ulepszania Globalnej Bazy Danych",
};

export default async function AdminAnalyticsPage() {
  // Check if user is admin
  const userIsAdmin = await isAdmin();

  if (!userIsAdmin) {
    redirect("/dashboard");
  }

  // Fetch analytics data
  const [customItemsResult, priceDeviationResult, userActivityResult] = await Promise.all([
    getCustomItemsDetailed(),
    getPriceDeviationAnalytics(),
    getUserActivityAnalytics(),
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-purple-600 flex-shrink-0" />
          Analityka
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Aktywność użytkowników, własne pozycje, odchylenia cen w katalogu globalnym.
        </p>
      </div>

      {/* User Activity Section */}
      <section>
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            Aktywność Użytkowników
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Projekty, pozycje, oferty — kto aktywnie korzysta z aplikacji.
          </p>
        </div>

        {userActivityResult.error ? (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-800 dark:text-red-200">
            <p className="font-medium">Błąd podczas pobierania danych:</p>
            <p className="text-sm">{userActivityResult.error}</p>
          </div>
        ) : (
          <UserActivityTable users={userActivityResult.users} />
        )}
      </section>

      {/* Custom Items Section */}
      <section>
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-600 flex-shrink-0" />
            Własne Pozycje Użytkowników
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pozycje spoza globalnego katalogu — można je przeglądać, usuwać lub awansować do bazy.
          </p>
        </div>

        {customItemsResult.error ? (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-800 dark:text-red-200">
            <p className="font-medium">Błąd podczas pobierania danych:</p>
            <p className="text-sm">{customItemsResult.error}</p>
          </div>
        ) : (
          <CustomItemsDetailedTable items={customItemsResult.items} />
        )}
      </section>

      {/* Price Deviation Section */}
      <section>
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-600 flex-shrink-0" />
            Price Checker — Odchylenia od Cen Globalnych
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pozycje z odchyleniami &gt;10% od ceny bazowej — sygnalizuje trendy inflacji/deflacji.
          </p>
        </div>

        {priceDeviationResult.error ? (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-800 dark:text-red-200">
            <p className="font-medium">Błąd podczas pobierania danych:</p>
            <p className="text-sm">{priceDeviationResult.error}</p>
          </div>
        ) : (
          <PriceDeviationTable items={priceDeviationResult.items} />
        )}
      </section>
    </div>
  );
}
